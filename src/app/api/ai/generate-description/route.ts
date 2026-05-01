import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, category, price, features, tone } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    // Validate tone
    const validTones = ['professional', 'casual', 'luxury', 'friendly']
    const selectedTone = validTones.includes(tone) ? tone : 'professional'

    // Create ZAI instance
    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content:
            'You are an expert e-commerce copywriter. Write compelling, SEO-friendly product descriptions for Indian merchants. Use Indian English conventions. Keep descriptions concise (2-3 paragraphs). Include key selling points. Do NOT use markdown headers or bullet points - write in plain paragraphs.',
        },
        {
          role: 'user',
          content: `Generate a product description for:\nProduct Name: ${name.trim()}\nCategory: ${category || 'General'}\nPrice: ₹${price || 'N/A'}\nKey Features: ${features || 'Not specified'}\nTone: ${selectedTone}`,
        },
      ],
      thinking: { type: 'disabled' },
    })

    const description =
      completion.choices?.[0]?.message?.content?.trim() || ''

    if (!description) {
      return NextResponse.json(
        { error: 'Failed to generate description' },
        { status: 500 }
      )
    }

    return NextResponse.json({ description })
  } catch (error) {
    console.error('AI description generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate description. Please try again.' },
      { status: 500 }
    )
  }
}
