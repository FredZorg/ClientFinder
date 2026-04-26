import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody } from '@/components/ui/Card'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const firmProfile = await prisma.firmProfile.findFirst({
    orderBy: { createdAt: 'asc' },
  })

  const campaigns = firmProfile
    ? await prisma.campaign.findMany({
        where: { firmProfileId: firmProfile.id },
        include: {
          _count: { select: { companies: true, drafts: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    : []

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Welcome to PipelineIQ</p>
        </div>
        <div className="flex gap-3">
          <Link href="/firm-profile">
            <Button variant="secondary" size="sm">
              {firmProfile ? 'Edit Firm Profile' : 'Set Up Firm Profile'}
            </Button>
          </Link>
          {firmProfile && (
            <Link href="/campaigns/new">
              <Button size="sm">+ New Campaign</Button>
            </Link>
          )}
        </div>
      </div>

      {!firmProfile && (
        <Card className="mb-8 border-indigo-200 bg-indigo-50">
          <CardBody className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-indigo-900">No firm profile yet</p>
              <p className="text-sm text-indigo-700 mt-0.5">Set up your firm profile to unlock personalized outreach generation.</p>
            </div>
            <Link href="/firm-profile">
              <Button size="sm">Set Up Now</Button>
            </Link>
          </CardBody>
        </Card>
      )}

      {firmProfile && (
        <Card className="mb-8">
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{firmProfile.name}</p>
                <p className="text-xs text-gray-500">{firmProfile.serviceAreas.join(' · ')}</p>
              </div>
              <Badge variant="green" className="ml-auto">Profile Active</Badge>
            </div>
          </CardBody>
        </Card>
      )}

      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Campaigns</h2>

        {campaigns.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl">
            <svg className="w-8 h-8 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm text-gray-500">
              {firmProfile
                ? 'No campaigns yet — create one to start discovering companies.'
                : 'Set up your firm profile first to create campaigns.'}
            </p>
            {firmProfile && (
              <Link href="/campaigns/new" className="inline-block mt-4">
                <Button size="sm">Create First Campaign</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <Card key={c.id} className="hover:border-indigo-200 transition-colors">
                <CardBody className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <Badge variant={c.status === 'ACTIVE' ? 'green' : 'gray'}>
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {c._count.companies} companies · {c._count.drafts} drafts
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/campaigns/${c.id}/discover`}>
                      <Button variant="ghost" size="sm">Discover</Button>
                    </Link>
                    <Link href={`/campaigns/${c.id}/select`}>
                      <Button variant="ghost" size="sm">Select</Button>
                    </Link>
                    <Link href={`/campaigns/${c.id}/generate`}>
                      <Button variant="secondary" size="sm">Generate</Button>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
