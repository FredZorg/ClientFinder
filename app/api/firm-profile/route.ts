import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const profile = await prisma.firmProfile.findFirst({
      include: { caseStudies: true },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ profile })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      id,
      name,
      description,
      serviceAreas,
      icpIndustries,
      icpCompanySizeMin,
      icpCompanySizeMax,
      icpGeographies,
      caseStudies,
    } = body

    let profile
    const data = {
      name,
      description,
      serviceAreas,
      icpIndustries,
      icpCompanySizeMin: Number(icpCompanySizeMin),
      icpCompanySizeMax: Number(icpCompanySizeMax),
      icpGeographies,
    }

    if (id) {
      profile = await prisma.firmProfile.update({ where: { id }, data })
    } else {
      profile = await prisma.firmProfile.create({ data })
    }

    // Sync case studies: delete all then recreate
    if (caseStudies) {
      await prisma.caseStudy.deleteMany({ where: { firmProfileId: profile.id } })
      if (caseStudies.length > 0) {
        await prisma.caseStudy.createMany({
          data: caseStudies.map((cs: {
            title: string
            industry: string
            problemStatement: string
            outcome: string
            metrics: string
            testimonial?: string
          }) => ({
            firmProfileId: profile.id,
            title: cs.title,
            industry: cs.industry,
            problemStatement: cs.problemStatement,
            outcome: cs.outcome,
            metrics: cs.metrics,
            testimonial: cs.testimonial ?? null,
          })),
        })
      }
    }

    const updated = await prisma.firmProfile.findUnique({
      where: { id: profile.id },
      include: { caseStudies: true },
    })

    return NextResponse.json({ profile: updated })
  } catch (err) {
    console.error('/api/firm-profile error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
