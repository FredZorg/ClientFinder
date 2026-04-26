'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SelectionCard } from '@/components/select/SelectionCard'
import { StepIndicator } from '@/components/ui/StepIndicator'
import { Button } from '@/components/ui/Button'
import { CompanyCardSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'

interface Contact {
  id: string
  firstName: string
  lastName: string
  title?: string | null
  email?: string | null
  linkedinUrl?: string | null
  seniority?: string | null
}

interface Company {
  id: string
  name: string
  industry?: string | null
  employeeCount?: number | null
  location?: string | null
  description?: string | null
  domain?: string | null
  contacts: Contact[]
}

interface CampaignEntry {
  id: string
  campaignId: string
  companyId: string
  serviceAngle?: string | null
  status: 'SELECTED' | 'SKIPPED'
  company: Company
}

export default function SelectPage({ params }: { params: { id: string } }) {
  const { id } = params
  const { toast } = useToast()
  const [entries, setEntries] = useState<CampaignEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/campaigns/${id}/companies`)
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => toast('Failed to load companies', 'error'))
      .finally(() => setLoading(false))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateEntry(updated: CampaignEntry) {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
  }

  const ready = entries.filter(
    (e) => e.status === 'SELECTED' && e.company.contacts.length > 0 && e.serviceAngle?.trim()
  )

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <StepIndicator currentStep={1} />
        <Link href={`/campaigns/${id}/generate`}>
          <Button disabled={ready.length === 0} size="sm">
            Generate Drafts →
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Select Companies</h1>
        <p className="text-sm text-gray-500">
          Find contacts, set a service angle, and keep or skip each company.
          {ready.length > 0 && (
            <span className="text-indigo-600 font-medium"> {ready.length} ready for generation.</span>
          )}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <CompanyCardSkeleton key={i} />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl">
          <p className="text-sm text-gray-500">
            No companies shortlisted yet.{' '}
            <Link href={`/campaigns/${id}/discover`} className="text-indigo-600 hover:underline">
              Go to Discover
            </Link>{' '}
            to add some.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <SelectionCard key={entry.id} entry={entry} onChange={updateEntry} />
          ))}
        </div>
      )}
    </div>
  )
}
