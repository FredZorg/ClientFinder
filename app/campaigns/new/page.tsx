'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

export default function NewCampaignPage() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/campaigns/${data.campaign.id}/discover`)
    } catch (err) {
      toast((err as Error).message, 'error')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-8 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">New Campaign</h1>
      <p className="text-gray-500 text-sm mb-8">Give your campaign a name, then start discovering companies.</p>

      <Card>
        <CardBody>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Campaign Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Denver SaaS Ops — Spring 2025"
              autoFocus
            />
            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" loading={loading} disabled={!name.trim()}>
                Create & Discover
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
