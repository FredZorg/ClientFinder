import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const drafts = await prisma.draft.findMany({
      where: { campaignId: params.id },
      include: {
        company: true,
        contact: true,
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ drafts })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { draftId, body, subject, status } = await req.json()

    const draft = await prisma.draft.update({
      where: { id: draftId },
      data: {
        ...(body !== undefined && { body }),
        ...(subject !== undefined && { subject }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json({ draft })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
