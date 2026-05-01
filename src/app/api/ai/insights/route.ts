import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import ZAI from 'z-ai-web-dev-sdk'

interface InsightInput {
  storeId: string
  stats: {
    totalRevenue: number
    totalOrders: number
    totalProducts: number
    activeProducts: number
    totalCustomers: number
    pendingOrders: number
    unfulfilledOrders: number
  }
  topProducts: Array<{
    name: string
    totalRevenue: number | null
    totalQuantity: number | null
  }>
  monthlyRevenue: Array<{
    month: string
    revenue: number
  }>
}

// Fallback static insights
function getStaticInsights(): Array<{
  title: string
  description: string
  type: 'opportunity' | 'warning' | 'info'
}> {
  return [
    {
      title: 'Expand Product Catalog',
      description:
        'Adding more products can increase your store visibility and attract new customers. Consider expanding into complementary categories.',
      type: 'opportunity',
    },
    {
      title: 'Review Pending Orders',
      description:
        'You have pending orders that need attention. Prompt fulfillment improves customer satisfaction and repeat purchase rates.',
      type: 'warning',
    },
    {
      title: 'Optimize Pricing Strategy',
      description:
        'Regularly reviewing your pricing compared to market trends can help maximize revenue while staying competitive.',
      type: 'info',
    },
    {
      title: 'Boost Customer Retention',
      description:
        'Implementing a loyalty program or offering repeat purchase discounts can increase customer lifetime value significantly.',
      type: 'opportunity',
    },
  ]
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: InsightInput = await request.json()
    const { storeId, stats, topProducts, monthlyRevenue } = body

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      )
    }

    // Prepare data summary for the AI
    const topProductNames = (topProducts || [])
      .slice(0, 3)
      .map((p) => `${p.name} (₹${p.totalRevenue || 0} revenue)`)
      .join(', ')

    const recentRevenue =
      monthlyRevenue && monthlyRevenue.length >= 2
        ? `Last month: ₹${monthlyRevenue[monthlyRevenue.length - 1].revenue}, Previous: ₹${monthlyRevenue[monthlyRevenue.length - 2].revenue}`
        : 'Limited monthly data available'

    const dataSummary = `
Store Stats:
- Total Revenue: ₹${stats?.totalRevenue || 0}
- Total Orders: ${stats?.totalOrders || 0}
- Total Products: ${stats?.totalProducts || 0} (${stats?.activeProducts || 0} active)
- Total Customers: ${stats?.totalCustomers || 0}
- Pending Orders: ${stats?.pendingOrders || 0}
- Unfulfilled Orders: ${stats?.unfulfilledOrders || 0}
- Top Products: ${topProductNames || 'None'}
- Revenue Trend: ${recentRevenue}
`.trim()

    // Create ZAI instance
    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content:
            'You are a business analytics expert for Indian e-commerce merchants. Generate 3-5 actionable business insights based on store data. Each insight should have a title (short), description (1-2 sentences), and type (opportunity, warning, or info). Return ONLY a valid JSON array of objects with title, description, and type fields. No markdown, no code blocks, just the JSON array.',
        },
        {
          role: 'user',
          content: `Based on this store data, generate 3-5 business insights:\n\n${dataSummary}`,
        },
      ],
      thinking: { type: 'disabled' },
    })

    const content = completion.choices?.[0]?.message?.content?.trim() || ''

    if (!content) {
      return NextResponse.json({ insights: getStaticInsights() })
    }

    // Parse the AI response as JSON
    let insights: Array<{
      title: string
      description: string
      type: 'opportunity' | 'warning' | 'info'
    }>

    try {
      // Try to extract JSON from the response (might have markdown wrapping)
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      insights = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)

      // Validate structure
      if (!Array.isArray(insights) || insights.length === 0) {
        throw new Error('Invalid insights format')
      }

      // Ensure each insight has the right structure
      insights = insights
        .filter(
          (i) =>
            i.title && i.description && ['opportunity', 'warning', 'info'].includes(i.type)
        )
        .map((i) => ({
          title: String(i.title).slice(0, 100),
          description: String(i.description).slice(0, 300),
          type: i.type as 'opportunity' | 'warning' | 'info',
        }))
    } catch {
      // If parsing fails, return static insights
      insights = getStaticInsights()
    }

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('AI insights generation error:', error)
    // Return static insights as fallback
    return NextResponse.json({ insights: getStaticInsights() })
  }
}
