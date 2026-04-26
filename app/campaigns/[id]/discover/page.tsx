'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SearchBar } from '@/components/discover/SearchBar'
import { FilterSidebar, Filters } from '@/components/discover/FilterSidebar'
import { CompanyCard, Enrichment } from '@/components/discover/CompanyCard'
import { AIChat } from '@/components/discover/AIChat'
import { CompanyCardSkeleton } from '@/components/ui/Skeleton'
import { StepIndicator } from '@/components/ui/StepIndicator'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'

interface Company {
  id: string
  name: string
  industry?: string | null
  employeeCount?: number | null
  location?: string | null
  description?: string | null
  linkedinUrl?: string | null
  estimatedRevenue?: string | null
}

export default function DiscoverPage({ params }: { params: { id: string } }) {
  const { id } = params
  const { toast } = useToast()

  const [searching, setSearching] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [enrichments, setEnrichments] = useState<Record<string, Enrichment>>({})
  const [enriching, setEnriching] = useState(false)
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set())
  const [shortlisting, setShortlisting] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Filters>({
    industries: [],
    location: '',
    employeeMin: '',
    employeeMax: '',
    keywords: '',
  })

  async function handleSearch(query: string) {
    setSearching(true)
    setEnrichments({})
    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          filters: {
            industries: filters.industries,
            location: filters.location,
            employeeMin: filters.employeeMin ? Number(filters.employeeMin) : undefined,
            employeeMax: filters.employeeMax ? Number(filters.employeeMax) : undefined,
            keywords: filters.keywords,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const results: Company[] = data.companies
      setCompanies(results)
      if (data.fromCache) toast(`Apollo unavailable: ${data.apolloError ?? 'rate limit'}`, 'error')

      // Kick off enrichment in the background
      if (results.length > 0) enrichCompanies(results)
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSearching(false)
    }
  }

  async function enrichCompanies(results: Company[]) {
    setEnriching(true)
    try {
      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: results }),
      })
      const data = await res.json()
      if (res.ok && data.enrichments) {
        const map: Record<string, Enrichment> = {}
        for (const e of data.enrichments) map[e.id] = e
        setEnrichments(map)
      }
    } catch {
      // Enrichment is best-effort — silently fail
    } finally {
      setEnriching(false)
    }
  }

  async function handleShortlist(companyId: string) {
    setShortlisting(companyId)
    try {
      const res = await fetch(`/api/campaigns/${id}/shortlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShortlisted((prev) => new Set(Array.from(prev).concat(companyId)))
      toast('Added to shortlist')
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setShortlisting(null)
    }
  }

  // Sort: enriched companies with higher fit scores first
  const sorted = [...companies].sort((a, b) => {
    const sa = enrichments[a.id]?.fitScore ?? 0
    const sb = enrichments[b.id]?.fitScore ?? 0
    return sb - sa
  })

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <StepIndicator currentStep={0} />
        {shortlisted.size > 0 && (
          <Link href={`/campaigns/${id}/select`}>
            <Button size="sm">
              View Shortlist
              <Badge variant="indigo" className="ml-1">{shortlisted.size}</Badge>
              →
            </Button>
          </Link>
        )}
      </div>

      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Discover Companies</h1>
        <p className="text-sm text-gray-500">Use AI to refine your target, then search Apollo.io.</p>
      </div>

      <AIChat onQueryReady={(q) => { setSearchQuery(q); handleSearch(q) }} />

      <div className="mb-6">
        <SearchBar
          onSearch={handleSearch}
          loading={searching}
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      <div className="flex gap-8">
        <FilterSidebar filters={filters} onChange={setFilters} />

        <div className="flex-1 space-y-3">
          {enriching && companies.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
              <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Scoring fit for your firm…
            </div>
          )}

          {searching ? (
            Array.from({ length: 5 }).map((_, i) => <CompanyCardSkeleton key={i} />)
          ) : companies.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl">
              <p className="text-sm text-gray-500">
                Enter a search query or chat with the AI copilot to discover companies.
              </p>
            </div>
          ) : (
            sorted.map((c) => (
              <CompanyCard
                key={c.id}
                company={c}
                onShortlist={handleShortlist}
                isShortlisted={shortlisted.has(c.id)}
                shortlisting={shortlisting === c.id}
                enrichment={enrichments[c.id]}
                enriching={enriching}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
