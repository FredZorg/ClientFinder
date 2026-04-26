'use client'

import { useState } from 'react'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
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

interface SelectionCardProps {
  entry: CampaignEntry
  onChange: (updated: CampaignEntry) => void
}

export function SelectionCard({ entry, onChange }: SelectionCardProps) {
  const { toast } = useToast()
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [savingAngle, setSavingAngle] = useState(false)
  const [serviceAngle, setServiceAngle] = useState(entry.serviceAngle ?? '')

  const isSkipped = entry.status === 'SKIPPED'

  async function findContacts() {
    if (!entry.company.domain) {
      toast('No domain found for this company', 'error')
      return
    }
    setLoadingContacts(true)
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: entry.companyId, domain: entry.company.domain }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onChange({
        ...entry,
        company: { ...entry.company, contacts: data.contacts },
      })
      toast(`Found ${data.contacts.length} contact${data.contacts.length !== 1 ? 's' : ''}`)
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setLoadingContacts(false)
    }
  }

  async function saveAngle() {
    setSavingAngle(true)
    try {
      const res = await fetch(`/api/campaigns/${entry.campaignId}/companies`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: entry.companyId, serviceAngle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onChange({ ...entry, serviceAngle })
      toast('Service angle saved')
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSavingAngle(false)
    }
  }

  async function toggleStatus() {
    const newStatus = isSkipped ? 'SELECTED' : 'SKIPPED'
    try {
      const res = await fetch(`/api/campaigns/${entry.campaignId}/companies`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: entry.companyId, status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onChange({ ...entry, status: newStatus })
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  return (
    <Card className={isSkipped ? 'opacity-50' : ''}>
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-900">{entry.company.name}</h3>
              {entry.company.industry && <Badge variant="indigo">{entry.company.industry}</Badge>}
              {isSkipped && <Badge variant="gray">Skipped</Badge>}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {[entry.company.location, entry.company.employeeCount && `${entry.company.employeeCount} employees`]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {entry.company.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{entry.company.description}</p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant={isSkipped ? 'secondary' : 'ghost'}
              onClick={toggleStatus}
              className={isSkipped ? '' : 'text-red-500 hover:bg-red-50'}
            >
              {isSkipped ? 'Restore' : 'Skip'}
            </Button>
          </div>
        </div>

        {!isSkipped && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Contacts</label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={findContacts}
                  loading={loadingContacts}
                  className="text-indigo-600 hover:bg-indigo-50"
                >
                  {entry.company.contacts.length > 0 ? 'Refresh Contacts' : 'Find Contacts'}
                </Button>
              </div>

              {entry.company.contacts.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No contacts yet — click &ldquo;Find Contacts&rdquo;</p>
              ) : (
                <div className="space-y-1.5">
                  {entry.company.contacts.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex-1">
                        <span className="font-medium">{c.firstName} {c.lastName}</span>
                        {c.title && <span className="text-gray-500"> · {c.title}</span>}
                      </div>
                      {c.email && <span className="text-gray-400">{c.email}</span>}
                      {c.seniority && <Badge variant="gray">{c.seniority}</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Service Angle</label>
              <Textarea
                rows={2}
                value={serviceAngle}
                onChange={(e) => setServiceAngle(e.target.value)}
                placeholder="Lead with ops efficiency — they're scaling fast and their ops team is thin…"
              />
              {serviceAngle !== (entry.serviceAngle ?? '') && (
                <div className="flex justify-end">
                  <Button size="sm" variant="secondary" onClick={saveAngle} loading={savingAngle}>
                    Save Angle
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </CardBody>
    </Card>
  )
}
