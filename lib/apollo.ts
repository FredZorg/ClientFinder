const APOLLO_BASE = 'https://api.apollo.io/v1'
const APOLLO_API_KEY = process.env.APOLLO_API_KEY!

// Simple in-memory rate limit: 50 requests/hour
const rateLimitState = {
  count: 0,
  windowStart: Date.now(),
}

function checkRateLimit() {
  const now = Date.now()
  const elapsed = now - rateLimitState.windowStart
  if (elapsed > 3600 * 1000) {
    rateLimitState.count = 0
    rateLimitState.windowStart = now
  }
  if (rateLimitState.count >= 50) {
    throw new Error('Apollo rate limit reached (50 req/hour). Try again later.')
  }
  rateLimitState.count++
}

export interface ApolloOrganization {
  id: string
  name: string
  website_url?: string
  linkedin_url?: string
  short_description?: string
  industry?: string
  estimated_num_employees?: number
  annual_revenue_printed?: string
  city?: string
  state?: string
  country?: string
}

export interface ApolloPerson {
  id: string
  first_name: string
  last_name: string
  title?: string
  email?: string
  linkedin_url?: string
  seniority?: string
  organization?: { id: string; name: string; website_url?: string }
}

export interface OrgSearchParams {
  q_organization_name?: string
  q_keywords?: string
  organization_locations?: string[]
  organization_num_employees_ranges?: string[]
  organization_industries?: string[]
  page?: number
  per_page?: number
}

export async function searchOrganizations(params: OrgSearchParams): Promise<ApolloOrganization[]> {
  checkRateLimit()

  const body = { page: 1, per_page: 25, ...params }

  const res = await fetch(`${APOLLO_BASE}/organizations/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': APOLLO_API_KEY },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Apollo organizations/search failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  console.log('[Apollo] orgs response — total:', data.pagination?.total_entries, 'returned:', data.organizations?.length, 'params:', JSON.stringify(body))
  return data.organizations ?? []
}

export interface PeopleSearchParams {
  q_organization_domains: string[]
  person_titles?: string[]
  contact_email_status?: string[]
  per_page?: number
}

export async function searchPeople(params: PeopleSearchParams): Promise<ApolloPerson[]> {
  checkRateLimit()

  const body = { per_page: 3, contact_email_status: ['verified', 'likely_to_engage'], ...params }

  const res = await fetch(`${APOLLO_BASE}/people/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': APOLLO_API_KEY },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Apollo people/search failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  return data.people ?? []
}
