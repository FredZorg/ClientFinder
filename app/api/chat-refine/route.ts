import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json() as {
      messages: { role: 'user' | 'assistant'; content: string }[]
    }

    const firmProfile = await prisma.firmProfile.findFirst({
      orderBy: { createdAt: 'asc' },
    })

    const firmContext = firmProfile
      ? `You are a BD copilot for ${firmProfile.name}, a student consulting firm offering: ${firmProfile.serviceAreas.join(', ')}. ICP: size ${firmProfile.icpCompanySizeMin}–${firmProfile.icpCompanySizeMax} employees, geographies: ${firmProfile.icpGeographies.join(', ')}.`
      : `You are a BD copilot for a student consulting firm.`

    const systemInstruction = `${firmContext}

Help the user define their ideal target company for a BD campaign. Ask one short clarifying question at a time if needed (industry, company stage, pain point, geography). Keep responses concise — 2–4 sentences max.

Once you have enough context, end your reply with this exact line:
SEARCH_QUERY: [specific keyword-rich query]

Do not include SEARCH_QUERY until you have enough context.`

    // Build contents array with alternating user/model turns
    const contents = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model' as const,
      parts: [{ text: m.content }],
    }))

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction })
    const result = await model.generateContent({ contents })
    const text = result.response.text()

    const queryMatch = text.match(/SEARCH_QUERY:\s*(.+)$/m)
    const searchQuery = queryMatch ? queryMatch[1].trim() : undefined
    const reply = text.replace(/SEARCH_QUERY:\s*.+$/m, '').trim()

    return NextResponse.json({ reply, searchQuery })
  } catch (err) {
    console.error('/api/chat-refine error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
