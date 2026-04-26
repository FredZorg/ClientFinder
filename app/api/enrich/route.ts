import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface CompanyInput {
  id: string
  name: string
  industry?: string | null
  employeeCount?: number | null
  location?: string | null
  description?: string | null
}

export interface Enrichment {
  id: string
  fitScore: number       // 1–10
  fitReason: string      // 1–2 sentences: why they're a fit
  whatTheyDo: string     // one sentence summary
  officeNote: string     // local office context
}

export async function POST(req: NextRequest) {
  try {
    const { companies } = await req.json() as { companies: CompanyInput[] }

    if (!companies?.length) return NextResponse.json({ enrichments: [] })

    const firmProfile = await prisma.firmProfile.findFirst({
      include: { caseStudies: { take: 2 } },
      orderBy: { createdAt: 'asc' },
    })

    const firmContext = firmProfile
      ? `Firm: ${firmProfile.name}
Services: ${firmProfile.serviceAreas.join(', ')}
Description: ${firmProfile.description}
ICP: industries=[${firmProfile.icpIndustries.join(', ')}], size=${firmProfile.icpCompanySizeMin}–${firmProfile.icpCompanySizeMax} employees
Case studies: ${firmProfile.caseStudies.map((cs) => `${cs.title} (${cs.industry}): ${cs.outcome}. ${cs.metrics}`).join(' | ')}`
      : `Firm: a student consulting firm`

    // Limit to 15 to keep prompt size reasonable
    const batch = companies.slice(0, 15)

    const companiesList = batch
      .map(
        (c, i) =>
          `${i + 1}. ID:${c.id} | ${c.name} | ${c.industry ?? 'unknown industry'} | ${c.employeeCount ? c.employeeCount + ' employees' : 'size unknown'} | ${c.location ?? 'location unknown'} | ${c.description ?? 'no description'}`
      )
      .join('\n')

    const prompt = `${firmContext}

Evaluate these companies as potential BD targets for this firm. For each, return a JSON array item with:
- id: the exact ID string provided
- fitScore: integer 1–10 (10 = perfect ICP match and clear use case for the firm's services)
- fitReason: 1–2 specific sentences on WHY they're a good or poor fit (reference the firm's services and the company's specifics)
- whatTheyDo: one clear sentence describing what the company actually does
- officeNote: one short phrase about their local presence (e.g. "Denver HQ", "Boulder office", "Remote-first")

Companies:
${companiesList}

Return only a valid JSON array, no markdown fences.`

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: 'You are a precise BD analyst. Always return valid JSON arrays only.',
    })

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    let enrichments: Enrichment[] = []
    try {
      const parsed = JSON.parse(text)
      enrichments = Array.isArray(parsed) ? parsed : []
    } catch {
      const match = text.match(/\[[\s\S]*\]/)
      if (match) enrichments = JSON.parse(match[0])
    }

    return NextResponse.json({ enrichments })
  } catch (err) {
    console.error('/api/enrich error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
