import { GoogleGenerativeAI } from '@google/generative-ai'
import { CaseStudy, Company, Contact, FirmProfile } from '@prisma/client'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction:
    'You are a BD assistant for a student consulting firm. Write genuinely personalized outreach — not generic templates. Reference specific details about the company and contact. Be concise and direct. Sound like a capable peer, not a vendor. Always respond with valid JSON only.',
})

export interface GeneratedDraft {
  email: { subject: string; body: string }
  linkedin: { message: string }
}

function buildPrompt(
  firmProfile: FirmProfile & { caseStudies: CaseStudy[] },
  company: Company,
  contact: Contact,
  serviceAngle: string
): string {
  const topCaseStudies = firmProfile.caseStudies.slice(0, 2)

  const caseStudiesText = topCaseStudies
    .map(
      (cs) =>
        `- "${cs.title}" (${cs.industry}): ${cs.problemStatement} → ${cs.outcome}. Metrics: ${cs.metrics}.${cs.testimonial ? ` "${cs.testimonial}"` : ''}`
    )
    .join('\n')

  return `Firm: ${firmProfile.name}
Services: ${firmProfile.serviceAreas.join(', ')}
Description: ${firmProfile.description}

Case studies:
${caseStudiesText}

Target company: ${company.name}
Industry: ${company.industry ?? 'unknown'}
Size: ${company.employeeCount ? `~${company.employeeCount} employees` : 'unknown'}
Location: ${company.location ?? 'unknown'}
Description: ${company.description ?? 'n/a'}
${company.recentNews ? `Recent news: ${company.recentNews}` : ''}
${company.linkedinUrl ? `LinkedIn: ${company.linkedinUrl}` : ''}

Contact: ${contact.firstName} ${contact.lastName}
Title: ${contact.title ?? 'unknown'}
${contact.linkedinUrl ? `LinkedIn: ${contact.linkedinUrl}` : ''}

Service angle for this account: ${serviceAngle}

Write:
1. EMAIL — subject line (max 8 words) + body (max 120 words). Reference a specific detail about the company or contact. End with a single, low-friction ask (15-min call).
2. LINKEDIN — connection message (max 300 chars). No pitch, just a warm relevant opener that references something real.

Return valid JSON only, no markdown fences:
{"email":{"subject":"...","body":"..."},"linkedin":{"message":"..."}}`
}

export async function generateDraft(
  firmProfile: FirmProfile & { caseStudies: CaseStudy[] },
  company: Company,
  contact: Contact,
  serviceAngle: string
): Promise<GeneratedDraft> {
  const result = await model.generateContent(buildPrompt(firmProfile, company, contact, serviceAngle))
  const text = result.response.text()

  try {
    return JSON.parse(text) as GeneratedDraft
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as GeneratedDraft
    throw new Error('Failed to parse Gemini response as JSON')
  }
}
