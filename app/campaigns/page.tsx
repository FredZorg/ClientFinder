import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody } from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

export default async function CampaignsPage() {
  const firmProfile = await prisma.firmProfile.findFirst({ orderBy: { createdAt: 'asc' } })

  const campaigns = firmProfile
    ? await prisma.campaign.findMany({
        where: { firmProfileId: firmProfile.id },
        include: { _count: { select: { companies: true, drafts: true } } },
        orderBy: { createdAt: 'desc' },
      })
    : []

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
        </div>
        {firmProfile && (
          <Link href="/campaigns/new">
            <Button size="sm">+ New Campaign</Button>
          </Link>
        )}
      </div>

      {!firmProfile ? (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl">
          <p className="text-sm text-gray-500">
            Set up your{' '}
            <Link href="/firm-profile" className="text-indigo-600 hover:underline">firm profile</Link>{' '}
            first to create campaigns.
          </p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl">
          <p className="text-sm text-gray-500">No campaigns yet.</p>
          <Link href="/campaigns/new" className="inline-block mt-4">
            <Button size="sm">Create Campaign</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardBody className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{c.name}</span>
                    <Badge variant={c.status === 'ACTIVE' ? 'green' : 'gray'}>{c.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c._count.companies} companies · {c._count.drafts} drafts
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/campaigns/${c.id}/discover`}><Button variant="ghost" size="sm">Discover</Button></Link>
                  <Link href={`/campaigns/${c.id}/select`}><Button variant="ghost" size="sm">Select</Button></Link>
                  <Link href={`/campaigns/${c.id}/generate`}><Button variant="secondary" size="sm">Generate</Button></Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
