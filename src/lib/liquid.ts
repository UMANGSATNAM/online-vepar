import { Liquid } from 'liquidjs'
import { db } from './db'

export const engine = new Liquid({
  cache: process.env.NODE_ENV === 'production',
  extname: '.liquid',
})

// Register Shopify-specific standard filters
engine.registerFilter('asset_url', (v) => `/assets/${v}`)
engine.registerFilter('money', (v: number) => `₹${(v / 100).toFixed(2)}`)
engine.registerFilter('money_without_currency', (v: number) => (v / 100).toFixed(2))
engine.registerFilter('handleize', (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))
engine.registerFilter('img_url', (v: string, size?: string) => v) // Placeholder for CDN resizing

/**
 * Renders a full page using the JSON Template (OS 2.0) architecture.
 */
export async function renderStorefront(storeId: string, templateName: string, globalContext: any, overrideSections?: any[]) {
  // 1. Fetch store and its active theme
  const store = await db.store.findUnique({
    where: { id: storeId },
    include: { metafields: true }
  })
  
  if (!store) throw new Error('Store not found')

  // Parse OS 2.0 JSON Template structure
  // If we have an override from the WebSocket, we build the templateJson dynamically!
  let templateJson: any = { sections: {}, order: [] }

  if (overrideSections && Array.isArray(overrideSections)) {
    overrideSections.forEach(sec => {
      templateJson.sections[sec.id] = { type: sec.type, settings: sec.settings }
      templateJson.order.push(sec.id)
    })
  } else {
    // Fallback to DB stored config
    const dbConfig = store.sectionsConfig ? JSON.parse(store.sectionsConfig) : []
    if (dbConfig.length > 0) {
      dbConfig.forEach((sec: any) => {
        templateJson.sections[sec.id] = { type: sec.type, settings: sec.settings }
        templateJson.order.push(sec.id)
      })
    } else {
      templateJson = {
        "sections": {
          "main": {
            "type": "main-product",
            "settings": {
              "show_vendor": true
            }
          }
        },
        "order": ["main"]
      }
    }
  }

  // 2. Fetch the Liquid sections defined in the template JSON
  // In reality, this would read from theme files: `sections/${type}.liquid`
  const mockLiquidFiles: Record<string, string> = {
    'main-product': `
      <div class="product-section">
        <h1>{{ product.title }}</h1>
        {% if section.settings.show_vendor %}
          <p class="vendor">{{ product.vendor }}</p>
        {% endif %}
        <p class="price">{{ product.price | money }}</p>
      </div>
    `,
    'product-recommendations': `
      <div class="recommendations">
        <h2>You may also like</h2>
        <!-- recommendation loop -->
      </div>
    `
  }

  // 3. Render sections in order
  let renderedBody = ''
  for (const sectionId of templateJson.order) {
    const sectionConfig = templateJson.sections[sectionId as keyof typeof templateJson.sections]
    const liquidSource = mockLiquidFiles[sectionConfig.type]
    
    if (liquidSource) {
      // Create a section-specific context injecting the settings
      const sectionContext = {
        ...globalContext,
        section: {
          id: sectionId,
          settings: sectionConfig.settings
        }
      }
      
      const renderedSection = await engine.parseAndRender(liquidSource, sectionContext)
      // Wrap in Shopify-style section div
      renderedBody += `\n<div id="shopify-section-${sectionId}" class="shopify-section">\n${renderedSection}\n</div>`
    }
  }

  // 4. Wrap inside layout/theme.liquid
  const layoutLiquid = `
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>{{ store.name }}</title>
      {{ content_for_header }}
    </head>
    <body>
      <main id="MainContent" class="content-for-layout focus-none" role="main" tabindex="-1">
        {{ content_for_layout }}
      </main>
    </body>
    </html>
  `

  const finalHtml = await engine.parseAndRender(layoutLiquid, {
    ...globalContext,
    store,
    content_for_header: '<!-- Shopify header injected -->',
    content_for_layout: renderedBody
  })

  return finalHtml
}
