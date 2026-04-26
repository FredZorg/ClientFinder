'use client'

import { useState, useEffect } from 'react'
import { DraftCard } from '@/components/generate/DraftCard'
import { ExportButton } from '@/components/generate/ExportButton'
import { StepIndicator } from '@/components/ui/StepIndicator'
import { Badge } from '@/components/ui/Badge'
import { CompanyCardSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'

interface Contact {
  id: string
  firstName: string
  lastName: string
  title?: string | null
  email?: string | null
}

interface Company {
  id: string
  name: string
  contacts: Contact[]
}

interface CampaignEntry {
  companyId: string
  serviceAngle?: string | null
  status: 'SELECTED' | 'SKIPPED'
  company: Company
}

interface Draft {
  id: string
  type: 'EMAIL' | 'LINKEDIN'
  subject?: string | null
  body: string
  status: 'PENDING' | 'APPROVED' | 'EDITED'
  companyId: string
  contact: { firstName: string; lastName: string; title?: string | null; email?: string | null }
  company: { name: string }
}

type GenStatus = 'idle' | 'generating' | 'done' | 'error'

export default function GeneratePage({ params }: { params: { id: string } }) {
  const { id } = params
  const { toast } = useToast()

  const [entries, setEntries] = useState<CampaignEntry[]>([])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [genStatus, setGenStatus] = useState<Record<string, GenStatus>>({})

  useEffect(() => {
    Promise.all([
      fetch(`/api/campaigns/${id}/companies`).then((r) => r.json()),
      fetch(`/api/campaigns/${id}/drafts`).then((r) => r.json()),
    ])
      .then(([compData, draftData]) => {
        const es: CampaignEntry[] = compData.entries ?? []
        const ds: Draft[] = draftData.drafts ?? []
        setEntries(es)
        setDrafts(ds)

        // Auto-generate for selected companies that have contacts + angle but no drafts
        const pending = es.filter((e) => {
          if (e.status === 'SKIPPED') return false
          if (!e.serviceAngle?.trim()) return false
          if (!e.company.contacts.length) return false
          const hasDraft = ds.some((d) => d.companyId === e.companyId)
          return !hasDraft
        })

        if (pending.length > 0) {
          pending.forEach((e) => generateForCompany(e, ds))
        }
      })
      .catch(() => toast('Failed to load data', 'error'))
      .finally(() => setLoading(false))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function generateForCompany(entry: CampaignEntry, existingDrafts: Draft[]) {
    if (!entry.serviceAngle || !entry.company.contacts.length) return

    // Double-check not already generated
    const alreadyDone = existingDrafts.some((d) => d.companyId === entry.companyId)
    if (alreadyDone) return

    setGenStatus((prev) => ({ ...prev, [entry.companyId]: 'generating' }))
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: id,
          companyId: entry.companyId,
          contacts: entry.company.contacts,
          serviceAngle: entry.serviceAngle,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Refresh drafts
      const draftRes = await fetch(`/api/campaigns/${id}/drafts`)
      const draftData = await draftRes.json()
      setDrafts(draftData.drafts ?? [])
      setGenStatus((prev) => ({ ...prev, [entry.companyId]: 'done' }))
    } catch (err) {
      toast(`Failed to generate for ${entry.company.name}: ${(err as Error).message}`, 'error')
      setGenStatus((prev) => ({ ...prev, [entry.companyId]: 'error' }))
    }
  }

  function updateDraft(updated: Draft) {
    setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
  }

  const selectedEntries = entries.filter((e) => e.status === 'SELECTED')
  const approvedCount = drafts.filter((d) => d.status === 'APPROVED').length

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <StepIndicator currentStep={2} />
        <ExportButton drafts={drafts} />
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Generate Drafts</h1>
        <p className="text-sm text-gray-500">
          AI-generated outreach drafts for each contact. Edit, approve, then export.
          {approvedCount > 0 && (
            <span className="text-green-600 font-medium"> {approvedCount} approved.</span>
          )}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <CompanyCardSkeleton key={i} />)}
        </div>
      ) : selectedEntries.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl">
          <p className="text-sm text-gray-500">
            No selected companies. Go back to Select to keep companies and add contacts.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {selectedEntries.map((entry) => {
            const companyDrafts = drafts.filter((d) => d.companyId === entry.companyId)
            const status = genStatus[entry.companyId]

            return (
              <div key={entry.companyId} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold text-gray-900">{entry.company.name}</h2>
                  {status === 'generating' && (
                    <Badge variant="indigo">
                      <svg className="animate-spin w-3 h-3 mr-1 inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating…
                    </Badge>
                  )}
                  {status === 'error' && <Badge variant="red">Error</Badge>}
                  {companyDrafts.length > 0 && !status && (
                    <Badge variant="green">{companyDrafts.length} draft{companyDrafts.length !== 1 ? 's' : ''}</Badge>
                  )}
                  {!entry.serviceAngle && (
                    <Badge variant="yellow">No service angle set</Badge>
                  )}
                  {!entry.company.contacts.length && (
                    <Badge variant="yellow">No contacts found</Badge>
                  )}
                </div>

                {companyDrafts.length === 0 && status !== 'generating' && (
                  <p className="text-xs text-gray-400">
                    {!entry.serviceAngle
                      ? 'Set a service angle in Select to generate drafts.'
                      : !entry.company.contacts.length
                        ? 'Find contacts in Select to generate drafts.'
                        : 'Drafts will generate automatically.'}
                  </p>
                )}

                {companyDrafts.map((draft) => (
                  <DraftCard key={draft.id} draft={draft} campaignId={id} onUpdate={updateDraft} />
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
