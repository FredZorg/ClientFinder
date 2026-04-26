import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const firmProfile = await prisma.firmProfile.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!firmProfile) {
      return NextResponse.json({ campaigns: [] })
    }

    const campaigns = await prisma.campaign.findMany({
      where: { firmProfileId: firmProfile.id },
      include: {
        _count: {
          select: {
            companies: true,
            drafts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ campaigns })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json()

    const firmProfile = await prisma.firmProfile.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!firmProfile) {
      return NextResponse.json({ error: 'Create a firm profile first' }, { status: 400 })
    }

    const campaign = await prisma.campaign.create({
      data: { name, firmProfileId: firmProfile.id },
    })

    return NextResponse.json({ campaign })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
