'use client'

import { useState } from 'react'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Textarea, Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

interface Draft {
  id: string
  type: 'EMAIL' | 'LINKEDIN'
  subject?: string | null
  body: string
  status: 'PENDING' | 'APPROVED' | 'EDITED'
  companyId: string
  contact: { firstName: string; lastName: string; title?: string | null }
  company: { name: string }
}

interface DraftCardProps {
  draft: Draft
  campaignId: string
  onUpdate: (updated: Draft) => void
}

export function DraftCard({ draft, campaignId, onUpdate }: DraftCardProps) {
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [subject, setSubject] = useState(draft.subject ?? '')
  const [body, setBody] = useState(draft.body)
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)

  async function saveEdit() {
    setSaving(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/drafts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id, body, subject: draft.type === 'EMAIL' ? subject : undefined, status: 'EDITED' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUpdate({ ...draft, body, subject: subject || null, status: 'EDITED' })
      setEditing(false)
      toast('Draft saved')
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function approve() {
    setApproving(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/drafts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id, status: 'APPROVED' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUpdate({ ...draft, status: 'APPROVED' })
      toast('Draft approved')
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setApproving(false)
    }
  }

  function copyToClipboard() {
    const text = draft.type === 'EMAIL'
      ? `Subject: ${draft.subject ?? ''}\n\n${draft.body}`
      : draft.body
    navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard'))
  }

  const statusColor = draft.status === 'APPROVED' ? 'green' : draft.status === 'EDITED' ? 'yellow' : 'gray'

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={draft.type === 'EMAIL' ? 'indigo' : 'default'}>
              {draft.type === 'EMAIL' ? 'Email' : 'LinkedIn'}
            </Badge>
            <span className="text-xs text-gray-500">
              → {draft.contact.firstName} {draft.contact.lastName}
              {draft.contact.title && ` (${draft.contact.title})`}
            </span>
          </div>
          <Badge variant={statusColor}>{draft.status}</Badge>
        </div>

        {editing ? (
          <div className="space-y-2">
            {draft.type === 'EMAIL' && (
              <Input
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            )}
            <Textarea
              label="Body"
              rows={draft.type === 'EMAIL' ? 6 : 4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setBody(draft.body); setSubject(draft.subject ?? '') }}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveEdit} loading={saving}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {draft.type === 'EMAIL' && draft.subject && (
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-500 font-medium">Subject: </span>
                <span className="text-sm text-gray-800">{draft.subject}</span>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{draft.body}</p>
            </div>
          </div>
        )}

        {!editing && (
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={copyToClipboard}>
              Copy
            </Button>
            {draft.status !== 'APPROVED' && (
              <Button size="sm" variant="primary" onClick={approve} loading={approving}>
                Approve
              </Button>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
