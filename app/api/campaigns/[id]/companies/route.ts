import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: fetch all shortlisted companies for a campaign
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const entries = await prisma.campaignCompany.findMany({
      where: { campaignId: params.id },
      include: {
        company: { include: { contacts: true } },
      },
      orderBy: { id: 'asc' },
    })

    return NextResponse.json({ entries })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// PATCH: update serviceAngle or status for a campaign company
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId, serviceAngle, status } = await req.json()

    const entry = await prisma.campaignCompany.update({
      where: {
        campaignId_companyId: {
          campaignId: params.id,
          companyId,
        },
      },
      data: {
        ...(serviceAngle !== undefined && { serviceAngle }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json({ entry })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
