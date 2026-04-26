import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchPeople } from '@/lib/apollo'

const TARGET_TITLES = [
  'CEO',
  'COO',
  'Chief Executive Officer',
  'Chief Operating Officer',
  'VP Operations',
  'VP of Operations',
  'Head of Marketing',
  'VP Marketing',
  'Founder',
  'Co-Founder',
]

export async function POST(req: NextRequest) {
  try {
    const { companyId, domain } = await req.json()

    if (!companyId || !domain) {
      return NextResponse.json({ error: 'companyId and domain are required' }, { status: 400 })
    }

    let fromCache = false
    let contacts

    try {
      const people = await searchPeople({
        q_organization_domains: [domain],
        person_titles: TARGET_TITLES,
        per_page: 3,
      })

      contacts = await Promise.all(
        people.map((p) =>
          prisma.contact.upsert({
            where: { apolloId: p.id },
            update: {
              firstName: p.first_name,
              lastName: p.last_name,
              title: p.title,
              email: p.email,
              linkedinUrl: p.linkedin_url,
              seniority: p.seniority,
            },
            create: {
              apolloId: p.id,
              companyId,
              firstName: p.first_name,
              lastName: p.last_name,
              title: p.title,
              email: p.email,
              linkedinUrl: p.linkedin_url,
              seniority: p.seniority,
            },
          })
        )
      )
    } catch (apolloErr) {
      console.error('Apollo contacts error, falling back to cache:', apolloErr)
      fromCache = true
      contacts = await prisma.contact.findMany({ where: { companyId } })
    }

    return NextResponse.json({ contacts, fromCache })
  } catch (err) {
    console.error('/api/contacts error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
