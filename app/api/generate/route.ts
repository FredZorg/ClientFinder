import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateDraft } from '@/lib/gemini'
import { Contact } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const { campaignId, companyId, contacts, serviceAngle } = await req.json() as {
      campaignId: string
      companyId: string
      contacts: Contact[]
      serviceAngle: string
    }

    if (!campaignId || !companyId || !contacts?.length || !serviceAngle) {
      return NextResponse.json(
        { error: 'campaignId, companyId, contacts, and serviceAngle are required' },
        { status: 400 }
      )
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        firmProfile: { include: { caseStudies: true } },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const draftIds: string[] = []

    for (const contact of contacts) {
      // Skip if drafts already exist for this contact in this campaign
      const existing = await prisma.draft.findFirst({
        where: { campaignId, companyId, contactId: contact.id },
      })
      if (existing) {
        draftIds.push(existing.id)
        continue
      }

      const generated = await generateDraft(
        campaign.firmProfile,
        company,
        contact,
        serviceAngle
      )

      const [emailDraft, linkedinDraft] = await Promise.all([
        prisma.draft.create({
          data: {
            campaignId,
            companyId,
            contactId: contact.id,
            type: 'EMAIL',
            subject: generated.email.subject,
            body: generated.email.body,
            status: 'PENDING',
          },
        }),
        prisma.draft.create({
          data: {
            campaignId,
            companyId,
            contactId: contact.id,
            type: 'LINKEDIN',
            body: generated.linkedin.message,
            status: 'PENDING',
          },
        }),
      ])

      draftIds.push(emailDraft.id, linkedinDraft.id)
    }

    return NextResponse.json({ draftIds })
  } catch (err) {
    console.error('/api/generate error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
