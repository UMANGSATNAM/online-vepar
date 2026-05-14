import type { NicheTheme } from './types'

export const BREW: NicheTheme = {
  id: 'brew',
  name: 'BREW',
  niche: 'Coffee / Beverage',
  tagline: 'Roasted to perfection. Brewed for you.',
  styleFamily: 'Bold & Earthy',
  previewImage: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80',
  previewImages: [
    'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80',
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80',
    'https://images.unsplash.com/photo-1521302080334-4bebac2763a6?w=800&q=80',
  ],
  accentHex: '#C97A34',
  sectionCount: 75,
  colorSystem: {
    primary: '#C97A34',
    primaryFg: '#FFFFFF',
    secondary: '#2C1E16',
    secondaryFg: '#F5EBE1',
    accent: '#E6A15C',
    background: '#1A1412',
    surface: '#241B18',
    surfaceRaised: '#332622',
    border: '#45352F',
    borderStrong: '#6E564D',
    text: '#F5EBE1',
    textMuted: '#A89287',
    textInverse: '#1A1412',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
  },
  typography: {
    displayFont: "'Oswald', sans-serif",
    bodyFont: "'Work Sans', sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Work+Sans:wght@400;500;600&display=swap',
    displayWeights: [500, 700],
    bodyWeights: [400, 500, 600],
    scaleRatio: 1.333,
  },
  motionSystem: {
    defaultEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    springEasing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    sharpEasing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    fastDuration: '150ms',
    baseDuration: '300ms',
    slowDuration: '500ms',
  },
  pages: {
    home: {
      sections: [
        { id: 'bw-announce', type: 'announcementBar', label: 'Announcement', settings: { text: '⚡ Fresh roasts every Tuesday. Free shipping over ₹999.', backgroundColor: '#C97A34', textColor: '#FFFFFF' } },
        { id: 'bw-hero', type: 'heroEditorialSplit', label: 'Hero', settings: { eyebrow: 'Single Origin Series', headline: 'Awaken your\nsenses.', subhead: 'Small-batch specialty coffee sourced directly from Indian estates.', primaryCtaLabel: 'Shop Roasts', primaryCtaUrl: '/collections/roasts', secondaryCtaLabel: 'Brew Guides', secondaryCtaUrl: '/pages/brew-guides', imageUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1200&q=90', layout: 'media-left', backgroundColor: '#1A1412' } },
        { id: 'bw-roasts', type: 'featuredCollection', label: 'Fresh Roasts', settings: { eyebrow: 'Roasted to order', title: 'Our Signature Blends', collectionSlug: 'roasts', count: 4, ctaLabel: 'View all' } },
        { id: 'bw-subscription', type: 'subscriptionBanner', label: 'Subscription', settings: { headline: 'Never run out of good coffee.', body: 'Subscribe and save 15%. Delivered fresh to your door on your schedule.', ctaLabel: 'Subscribe Now', ctaUrl: '/pages/subscribe', imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=90' } },
        { id: 'bw-equipment', type: 'featuredCollection', label: 'Equipment', settings: { eyebrow: 'Brew like a pro', title: 'Brewing Gear', collectionSlug: 'equipment', count: 4, ctaLabel: 'Shop gear' } },
        { id: 'bw-story', type: 'brandStory', label: 'Our Process', settings: { headline: 'From farm to cup.', body: 'We partner directly with farmers in Chikmagalur and Coorg, ensuring fair prices and the highest quality beans. Every batch is profiled and roasted with precision.', imageUrl: 'https://images.unsplash.com/photo-1521302080334-4bebac2763a6?w=800&q=90', ctaLabel: 'Learn more', ctaUrl: '/pages/about' } },
        { id: 'bw-footer', type: 'footerFull', label: 'Footer', settings: { storeName: 'BREW', tagline: 'Fueling your daily hustle.', columns: [{ title: 'Shop', links: [{ label: 'Coffee', url: '/collections/roasts' }, { label: 'Equipment', url: '/collections/equipment' }, { label: 'Merch', url: '/collections/merch' }, { label: 'Subscriptions', url: '/pages/subscribe' }] }] } },
      ],
    },
    product: {
      sections: [
        { id: 'bwp-gallery', type: 'productGallery', label: 'Gallery', settings: { layout: 'grid', showTastingNotes: true } },
        { id: 'bwp-buybox', type: 'stickyBuyBox', label: 'Buy Box', settings: { showGrindOptions: true, showSubscriptionOption: true } },
        { id: 'bwp-details', type: 'productDetails', label: 'Details', settings: { showOrigin: true, showProcess: true, showRoastLevel: true } },
        { id: 'bwp-reviews', type: 'reviewsGrid', label: 'Reviews', settings: { showRatings: true } },
      ],
    },
    collection: {
      sections: [
        { id: 'bwc-header', type: 'collectionHeader', label: 'Header', settings: { style: 'bold' } },
        { id: 'bwc-filters', type: 'collectionFilters', label: 'Filters', settings: { showRoastLevel: true, showProcess: true } },
        { id: 'bwc-grid', type: 'collectionGrid', label: 'Products', settings: { columns: 4, showTastingNotes: true } },
      ],
    },
    cart: {
      sections: [{ id: 'bwcart', type: 'cartDrawer', label: 'Cart', settings: { showUpsell: true, upsellCollection: 'equipment', freeShippingThreshold: 999 } }],
    },
    about: {
      sections: [{ id: 'bwa-hero', type: 'heroEditorialSplit', label: 'Hero', settings: { headline: 'Coffee without compromise.', imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1400&q=90' } }],
    },
  },
  seedProducts: [
    { name: 'Monsoon Malabar AA', slug: 'monsoon-malabar', description: 'Exposed to monsoon winds. Earthy, low acidity, notes of spice and chocolate.', price: 450, images: ['https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=90'], tags: ['coffee', 'single-origin', 'dark-roast'], category: 'Roasts', hsnCode: '0901', gstRate: 5 },
    { name: 'Chikmagalur Estate Blend', slug: 'chikmagalur-blend', description: 'A perfectly balanced medium roast with hints of caramel and roasted nuts.', price: 400, images: ['https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=90'], tags: ['coffee', 'blend', 'medium-roast'], category: 'Roasts', hsnCode: '0901', gstRate: 5 },
    { name: 'Matte Black Pour Over Kettle', slug: 'pour-over-kettle', description: 'Precision gooseneck kettle for the perfect pour. Stainless steel, 600ml.', price: 1899, comparePrice: 2499, images: ['https://images.unsplash.com/photo-1521302080334-4bebac2763a6?w=800&q=90'], tags: ['equipment', 'brewing'], category: 'Equipment', hsnCode: '7323', gstRate: 18 },
  ],
  seedCollections: [
    { name: 'Fresh Roasts', slug: 'roasts', description: 'Roasted to order, delivered fresh.', image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=90' },
    { name: 'Brewing Gear', slug: 'equipment', description: 'Everything you need for the perfect cup.', image: 'https://images.unsplash.com/photo-1521302080334-4bebac2763a6?w=800&q=90' },
  ],
}
