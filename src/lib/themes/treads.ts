import type { NicheTheme } from './types'

export const TREADS: NicheTheme = {
  id: 'treads',
  name: 'TREADS',
  niche: 'Footwear / Sneakers',
  tagline: 'Step into the future.',
  styleFamily: 'Streetwear & Tech',
  previewImage: 'https://images.unsplash.com/photo-1552346154-21d32810baa3?w=800&q=80',
  previewImages: [
    'https://images.unsplash.com/photo-1552346154-21d32810baa3?w=800&q=80',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
  ],
  accentHex: '#E11D48',
  sectionCount: 82,
  colorSystem: {
    primary: '#E11D48',
    primaryFg: '#FFFFFF',
    secondary: '#0F172A',
    secondaryFg: '#F8FAFC',
    accent: '#F43F5E',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceRaised: '#F1F5F9',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    text: '#0F172A',
    textMuted: '#64748B',
    textInverse: '#FFFFFF',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  typography: {
    displayFont: "'Teko', sans-serif",
    bodyFont: "'Chivo', sans-serif",
    monoFont: "'Space Mono', monospace",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Teko:wght@500;600;700&family=Chivo:ital,wght@0,400;0,700;1,400&display=swap',
    displayWeights: [500, 600, 700],
    bodyWeights: [400, 700],
    scaleRatio: 1.618,
  },
  motionSystem: {
    defaultEasing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    springEasing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    sharpEasing: 'cubic-bezier(0.4, 0, 1, 1)',
    fastDuration: '200ms',
    baseDuration: '400ms',
    slowDuration: '600ms',
  },
  pages: {
    home: {
      sections: [
        { id: 'tr-announce', type: 'announcementBar', label: 'Announcement', settings: { text: '🚨 DROP 04 IS LIVE. LIMITED STOCK.', backgroundColor: '#E11D48', textColor: '#FFFFFF' } },
        { id: 'tr-hero', type: 'heroEditorialSplit', label: 'Hero', settings: { eyebrow: 'New Release', headline: 'DEFY\nGRAVITY.', subhead: 'The all-new AERO-X. Engineered for maximum energy return and street-ready style.', primaryCtaLabel: 'Shop AERO-X', primaryCtaUrl: '/collections/aero', secondaryCtaLabel: 'View Lookbook', secondaryCtaUrl: '/pages/lookbook', imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810baa3?w=1200&q=90', layout: 'media-right', backgroundColor: '#F8FAFC' } },
        { id: 'tr-featured', type: 'featuredCollection', label: 'Trending', settings: { eyebrow: 'Hot right now', title: 'Trending Kicks', collectionSlug: 'trending', count: 4, ctaLabel: 'Shop All' } },
        { id: 'tr-tech', type: 'brandStory', label: 'Technology', settings: { headline: 'Engineered for the streets.', body: 'Our proprietary foam technology delivers 40% more energy return than standard EVA, while the abrasion-resistant outsole keeps you gripped to the city.', imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=90', ctaLabel: 'Learn about our tech', ctaUrl: '/pages/tech' } },
        { id: 'tr-categories', type: 'shopByRoom', label: 'Categories', settings: { headline: 'Shop by Style', rooms: [{ name: 'Running', image: 'https://images.unsplash.com/photo-1552346154-21d32810baa3?w=600&q=80' }, { name: 'Lifestyle', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80' }, { name: 'High Tops', image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80' }] } },
        { id: 'tr-footer', type: 'footerFull', label: 'Footer', settings: { storeName: 'TREADS', tagline: 'Step into the future.', columns: [{ title: 'Shop', links: [{ label: 'New Arrivals', url: '/collections/new' }, { label: 'Men', url: '/collections/men' }, { label: 'Women', url: '/collections/women' }, { label: 'Sale', url: '/collections/sale' }] }] } },
      ],
    },
    product: {
      sections: [
        { id: 'trp-gallery', type: 'productGallery', label: 'Gallery', settings: { layout: 'carousel', show3DViewer: true } },
        { id: 'trp-buybox', type: 'stickyBuyBox', label: 'Buy Box', settings: { showSizeGuide: true, showStockUrgency: true } },
        { id: 'trp-details', type: 'productDetails', label: 'Details', settings: { showTechSpecs: true, showFitInfo: true } },
        { id: 'trp-reviews', type: 'reviewsGrid', label: 'Reviews', settings: { showPhotos: true, showSizingFeedback: true } },
      ],
    },
    collection: {
      sections: [
        { id: 'trc-header', type: 'collectionHeader', label: 'Header', settings: { style: 'streetwear' } },
        { id: 'trc-filters', type: 'collectionFilters', label: 'Filters', settings: { showSize: true, showColor: true, showActivity: true } },
        { id: 'trc-grid', type: 'collectionGrid', label: 'Products', settings: { columns: 3, showSecondaryImageOnHover: true } },
      ],
    },
    cart: {
      sections: [{ id: 'trcart', type: 'cartDrawer', label: 'Cart', settings: { showUpsell: true, upsellCollection: 'accessories' } }],
    },
    about: {
      sections: [{ id: 'tra-hero', type: 'heroEditorialSplit', label: 'Hero', settings: { headline: 'Pushing boundaries.', imageUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1400&q=90' } }],
    },
  },
  seedProducts: [
    { name: 'AERO-X Runner — Crimson', slug: 'aero-x-runner-crimson', description: 'Lightweight running shoe with responsive foam cushioning and breathable knit upper.', price: 4999, comparePrice: 5999, images: ['https://images.unsplash.com/photo-1552346154-21d32810baa3?w=800&q=90'], tags: ['sneaker', 'running', 'red', 'new'], category: 'Running', hsnCode: '6404', gstRate: 18 },
    { name: 'STREET-V2 Low — Monochrome', slug: 'street-v2-low-mono', description: 'Classic streetwear silhouette updated with premium leather and a chunky sole.', price: 3499, images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=90'], tags: ['sneaker', 'lifestyle', 'black', 'white'], category: 'Lifestyle', hsnCode: '6403', gstRate: 18 },
    { name: 'ELEVATE High Top', slug: 'elevate-high-top', description: 'Retro-inspired high top with modern comfort tech and ankle support.', price: 5499, images: ['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=90'], tags: ['sneaker', 'high-top', 'lifestyle'], category: 'High Tops', hsnCode: '6403', gstRate: 18 },
  ],
  seedCollections: [
    { name: 'Trending Kicks', slug: 'trending', description: 'What everyone is wearing right now.', image: 'https://images.unsplash.com/photo-1552346154-21d32810baa3?w=800&q=90' },
    { name: 'Lifestyle', slug: 'lifestyle', description: 'Everyday street style.', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=90' },
  ],
}
