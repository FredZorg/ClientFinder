import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchOrganizations, ApolloOrganization } from '@/lib/apollo'

function parseNaturalLanguage(query: string): {
  industries?: string[]
  locations?: string[]
  keywords?: string
} {
  const result: { industries?: string[]; locations?: string[]; keywords?: string } = {}

  // Very simple keyword extraction — production would use Claude
  const industryKeywords: Record<string, string> = {
    saas: 'Software as a Service',
    software: 'Computer Software',
    tech: 'Information Technology',
    finance: 'Financial Services',
    fintech: 'Financial Services',
    healthcare: 'Health, Wellness and Fitness',
    marketing: 'Marketing and Advertising',
    operations: 'Operations',
    logistics: 'Transportation/Trucking/Railroad',
    retail: 'Retail',
    ecommerce: 'Internet',
  }

  const lower = query.toLowerCase()
  const foundIndustries = Object.entries(industryKeywords)
    .filter(([kw]) => lower.includes(kw))
    .map(([, val]) => val)
  if (foundIndustries.length) result.industries = Array.from(new Set(foundIndustries))

  // Extract location hints like "in Denver" or "in New York"
  const locationMatch = lower.match(/\bin\s+([a-z\s]+?)(?:\s+with|\s+and|\s+that|$)/i)
  if (locationMatch) result.locations = [locationMatch[1].trim()]

  result.keywords = query
  return result
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, filters } = body as {
      query: string
      filters?: {
        industries?: string[]
        location?: string
        employeeMin?: number
        employeeMax?: number
        keywords?: string
      }
    }

    const nlHints = parseNaturalLanguage(query)

    // Locations: split "Denver or Boulder" → ["Denver, Colorado, United States", ...]
    const rawLocation = filters?.location || ''
    const locations: string[] = rawLocation
      ? rawLocation.split(/\s+or\s+|,\s*/i).map((l) => l.trim()).filter(Boolean)
      : (nlHints.locations ?? [])

    const employeeRanges: string[] = []
    const eMin = filters?.employeeMin
    const eMax = filters?.employeeMax
    if (eMin != null || eMax != null) {
      employeeRanges.push(`${eMin ?? 1},${eMax ?? 10000}`)
    } else {
      const sizeMatch = query.match(/(\d+)\s*[-–]\s*(\d+)\s*employees?/i)
      if (sizeMatch) employeeRanges.push(`${sizeMatch[1]},${sizeMatch[2]}`)
    }

    // Keywords: always use the natural language query as the primary signal.
    // Skip organization_industries — user-entered tags rarely match Apollo's internal taxonomy
    // and cause zero results. Keywords alone is more reliable.
    const keywords = filters?.keywords || query

    let apolloOrgs: ApolloOrganization[] = []
    let fromCache = false

    try {
      apolloOrgs = await searchOrganizations({
        q_keywords: keywords,
        organization_locations: locations.length ? locations : undefined,
        organization_num_employees_ranges: employeeRanges.length ? employeeRanges : undefined,
        per_page: 25,
      })
    } catch (apolloErr) {
      const errMsg = (apolloErr as Error).message
      console.error('Apollo error:', errMsg)

      const cached = await prisma.company.findMany({
        where: undefined,
        take: 25,
        orderBy: { createdAt: 'desc' },
      })

      return NextResponse.json({ companies: cached, fromCache: true, apolloError: errMsg })
    }

    // Upsert companies in DB
    const companies = await Promise.all(
      apolloOrgs.map(async (org) => {
        const domain = org.website_url
          ? org.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')
          : undefined

        return prisma.company.upsert({
          where: { apolloId: org.id },
          update: {
            name: org.name,
            domain,
            industry: org.industry,
            employeeCount: org.estimated_num_employees,
            estimatedRevenue: org.annual_revenue_printed,
            location: [org.city, org.state, org.country].filter(Boolean).join(', '),
            description: org.short_description,
            linkedinUrl: org.linkedin_url,
          },
          create: {
            apolloId: org.id,
            name: org.name,
            domain,
            industry: org.industry,
            employeeCount: org.estimated_num_employees,
            estimatedRevenue: org.annual_revenue_printed,
            location: [org.city, org.state, org.country].filter(Boolean).join(', '),
            description: org.short_description,
            linkedinUrl: org.linkedin_url,
          },
        })
      })
    )

    return NextResponse.json({ companies, fromCache })
  } catch (err) {
    console.error('/api/discover error:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
