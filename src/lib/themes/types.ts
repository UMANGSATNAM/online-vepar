// OMNI Commerce — Theme System Types
// Every D2C brand deserves a world-class storefront by default.

export interface ColorSystem {
  // Brand
  primary: string       // Brand's signature color
  primaryFg: string     // Text on primary bg
  secondary: string     // Supporting color
  secondaryFg: string
  accent: string        // High-contrast highlight
  // Surfaces
  background: string    // Page background
  surface: string       // Card / section bg
  surfaceRaised: string // Elevated elements
  // Borders
  border: string
  borderStrong: string
  // Text
  text: string
  textMuted: string
  textInverse: string
  // Semantic
  success: string
  warning: string
  error: string
}

export interface TypographySystem {
  displayFont: string       // CSS font-family for headings
  bodyFont: string          // CSS font-family for body
  monoFont?: string         // For prices, specs, numbers
  googleFontsUrl: string    // Preload URL
  displayWeights: number[]
  bodyWeights: number[]
  scaleRatio: number        // e.g. 1.333 for Perfect Fourth
}

export interface MotionSystem {
  defaultEasing: string
  springEasing: string
  sharpEasing: string
  fastDuration: string   // 150ms
  baseDuration: string   // 300ms
  slowDuration: string   // 600ms
}

export interface SectionConfig {
  id: string
  type: string
  label: string
  settings: Record<string, unknown>
}

export interface PageTemplate {
  sections: SectionConfig[]
}

export interface SeedProduct {
  name: string
  slug: string
  description: string
  price: number
  comparePrice?: number
  images: string[]       // Unsplash URLs — merchant-replaceable
  tags: string[]
  category: string
  sku?: string
  hsnCode?: string
  gstRate?: number
}

export interface SeedCollection {
  name: string
  slug: string
  description: string
  image: string
}

export interface NicheTheme {
  id: string             // 'aurene' | 'apex-groom' | 'offcut' | ...
  name: string           // 'AURENE'
  niche: string          // 'Luxury Jewellery'
  tagline: string        // One-line brand promise
  styleFamily: string    // 'Luxe' | 'Bold' | 'Minimal' | ...
  colorSystem: ColorSystem
  typography: TypographySystem
  motionSystem: MotionSystem
  pages: {
    home: PageTemplate
    product: PageTemplate
    collection: PageTemplate
    cart: PageTemplate
    about: PageTemplate
    [key: string]: PageTemplate
  }
  previewImage: string   // Hero image for theme card
  previewImages: string[] // Gallery of 3 screenshots
  accentHex: string      // For color swatch in UI
  sectionCount: number
  seedProducts: SeedProduct[]
  seedCollections: SeedCollection[]
}

// Section type registry — what section types exist in the OMNI engine
export type SectionType =
  | 'announcementBar'
  | 'heroEditorialSplit'
  | 'heroFullBleed'
  | 'heroTypographic'
  | 'pressBand'
  | 'craftStory'
  | 'featuredCollection'
  | 'categoryGrid'
  | 'lookbookVertical'
  | 'testimonialsLuxe'
  | 'emiStrip'
  | 'trustBadges'
  | 'newsletter'
  | 'footerFull'
  | 'productGallery'
  | 'stickyBuyBox'
  | 'ingredientTransparency'
  | 'routineBuilder'
  | 'skinQuiz'
  | 'dropCalendar'
  | 'bundleBuilder'
  | 'reviewsGrid'
  | 'videoShoppable'
  | 'countdownTimer'
  | 'pincodeChecker'
  | 'codBadge'
  | 'whatsappCta'
  | 'gstInvoiceStrip'

export type StyleFamily =
  | 'Luxe'
  | 'Bold'
  | 'Minimal'
  | 'Editorial'
  | 'Playful'
  | 'Tech'
  | 'Organic'
  | 'Brutalist'
  | 'Sensory'
