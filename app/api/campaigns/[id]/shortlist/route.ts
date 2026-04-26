import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST: add a company to shortlist
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId } = await req.json()

    const entry = await prisma.campaignCompany.upsert({
      where: {
        campaignId_companyId: {
          campaignId: params.id,
          companyId,
        },
      },
      update: { status: 'SELECTED' },
      create: {
        campaignId: params.id,
        companyId,
        status: 'SELECTED',
      },
    })

    return NextResponse.json({ entry })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// DELETE: remove a company from shortlist
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId } = await req.json()

    await prisma.campaignCompany.deleteMany({
      where: { campaignId: params.id, companyId },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
