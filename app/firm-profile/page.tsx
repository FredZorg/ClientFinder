import { prisma } from '@/lib/prisma'
import { FirmProfileForm } from '@/components/firm/FirmProfileForm'

export const dynamic = 'force-dynamic'

export default async function FirmProfilePage() {
  const profile = await prisma.firmProfile.findFirst({
    include: { caseStudies: true },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Firm Profile</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Define your firm&apos;s identity, services, and ideal customer profile. This powers all personalized outreach.
        </p>
      </div>
      <FirmProfileForm initial={profile} />
    </div>
  )
}
