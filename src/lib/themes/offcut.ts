import type { NicheTheme } from './types'

export const OFFCUT: NicheTheme = {
  id: 'offcut',
  name: 'OFFCUT',
  niche: 'Streetwear',
  tagline: 'Limited. Always.',
  styleFamily: 'Minimal',
  previewImage: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=800&q=80',
  previewImages: [
    'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=800&q=80',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80',
    'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80',
  ],
  accentHex: '#FF3B30',
  sectionCount: 80,
  colorSystem: {
    primary: '#000000',
    primaryFg: '#FFFFFF',
    secondary: '#FF3B30',
    secondaryFg: '#FFFFFF',
    accent: '#FF3B30',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceRaised: '#EBEBEB',
    border: '#D4D4D4',
    borderStrong: '#A3A3A3',
    text: '#0A0A0A',
    textMuted: '#525252',
    textInverse: '#FFFFFF',
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
  },
  typography: {
    displayFont: "'Inter', system-ui, sans-serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap',
    displayWeights: [700, 900],
    bodyWeights: [400, 500],
    scaleRatio: 1.414,
  },
  motionSystem: {
    defaultEasing: 'cubic-bezier(0.12, 0, 0.39, 0)',
    springEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    sharpEasing: 'cubic-bezier(0.12, 0, 0.39, 0)',
    fastDuration: '100ms',
    baseDuration: '200ms',
    slowDuration: '400ms',
  },
  pages: {
    home: {
      sections: [
        { id: 'of-announce', type: 'announcementBar', label: 'Announcement', settings: { text: 'DROP 07 — LIVE NOW · Only 120 pieces. No restock. Ever.', backgroundColor: '#FF3B30', textColor: '#FFFFFF', marquee: true } },
        { id: 'of-hero', type: 'heroFullBleedTypography', label: 'Hero', settings: { headline: 'DROP 07', subhead: 'LIMITED. ALWAYS.', primaryCtaLabel: 'Shop the Drop', primaryCtaUrl: '/collections/drop-07', imageUrl: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1400&q=90', overlayOpacity: 0.55, textColor: '#FFFFFF' } },
        { id: 'of-countdown', type: 'dropCountdown', label: 'Countdown', settings: { headline: 'NEXT DROP', dropDate: '2026-06-01T12:00:00+05:30', label: 'DROP 08 — The Monsoon Edition', ctaLabel: 'Notify Me', backgroundColor: '#0A0A0A', textColor: '#FFFFFF', accentColor: '#FF3B30' } },
        { id: 'of-members-gate', type: 'membersGate', label: 'Members Gate', settings: { headline: 'OFFCUT INNER ACCESS', subhead: 'First 48-hour window. Early access. Exclusive colourways.', ctaLabel: 'Join the waitlist', backgroundColor: '#0A0A0A', textColor: '#FFFFFF' } },
        { id: 'of-current-drop', type: 'featuredCollection', label: 'Current Drop', settings: { eyebrow: 'Live Now', title: 'DROP 07', collectionSlug: 'drop-07', count: 4, ctaLabel: "Shop before it's gone" } },
        { id: 'of-raffle', type: 'raffleModule', label: 'Raffle', settings: { headline: 'RAFFLE — DROP 07 HOODIE', subhead: 'Enter for a chance to cop. One entry per account.', endDate: '2026-05-20T23:59:59+05:30', ctaLabel: 'Enter the raffle' } },
        { id: 'of-footer', type: 'footerMinimal', label: 'Footer', settings: { storeName: 'OFFCUT', tagline: 'Limited. Always.', columns: [{ title: 'Drops', links: [{ label: 'Current Drop', url: '/collections/drop-07' }, { label: 'Archive', url: '/collections/archive' }] }, { title: 'Members', links: [{ label: 'Inner Access', url: '/pages/inner-access' }, { label: 'Raffle', url: '/pages/raffle' }] }] } },
      ],
    },
    product: {
      sections: [
        { id: 'ofp-gallery', type: 'productGallery', label: 'Gallery', settings: { layout: 'grid', showModelInfo: true } },
        { id: 'ofp-buybox', type: 'stickyBuyBox', label: 'Buy Box', settings: { showStockCounter: true, showPincode: true, showCod: true, showRestockWaitlist: true } },
        { id: 'ofp-details', type: 'productDetails', label: 'Details', settings: { showMaterial: true, showFitGuide: true } },
        { id: 'ofp-reviews', type: 'reviewsGrid', label: 'Reviews', settings: { showPhotos: true } },
      ],
    },
    collection: {
      sections: [
        { id: 'ofc-header', type: 'collectionHeaderDrop', label: 'Header', settings: { showDropDate: true, showPieceCount: true } },
        { id: 'ofc-grid', type: 'collectionGrid', label: 'Products', settings: { columns: 4, showStockPill: true } },
      ],
    },
    cart: {
      sections: [{ id: 'ofcart', type: 'cartDrawer', label: 'Cart', settings: { showFreeShippingBar: true, freeShippingThreshold: 999 } }],
    },
    about: {
      sections: [
        { id: 'ofa-hero', type: 'heroFullBleedTypography', label: 'Hero', settings: { headline: 'NO RERUNS. NO EXCUSES.', imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=1400&q=90' } },
      ],
    },
  },
  seedProducts: [
    { name: 'Drop 07 Heavy Hoodie — Bone', slug: 'drop-07-hoodie-bone', description: '500GSM French terry cotton. Dropped hem. OFFCUT woven label. Designed in Delhi, made in Tirupur.', price: 3499, images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=90'], tags: ['hoodie', 'drop-07', 'limited'], category: 'Hoodies', hsnCode: '6110', gstRate: 12 },
    { name: 'Drop 07 Cargo Pant — Slate', slug: 'drop-07-cargo-slate', description: '8-pocket utility cargo in 320GSM washed canvas. YKK zips throughout.', price: 2999, images: ['https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=90'], tags: ['cargo', 'pants', 'drop-07'], category: 'Bottoms', hsnCode: '6203', gstRate: 12 },
    { name: 'Drop 07 Graphic Tee — Black', slug: 'drop-07-tee-black', description: '240GSM combed cotton. Screenprinted art by Delhi-based artist Kunal Sen.', price: 1499, images: ['https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=800&q=90'], tags: ['tee', 'graphic', 'drop-07'], category: 'T-Shirts', hsnCode: '6109', gstRate: 12 },
    { name: 'OFFCUT Cap — Drop 07', slug: 'offcut-cap-drop-07', description: 'Six-panel structured cap. Embroidered drop number on side panel.', price: 899, images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=90'], tags: ['cap', 'accessories'], category: 'Accessories', hsnCode: '6505', gstRate: 12 },
  ],
  seedCollections: [
    { name: 'Drop 07', slug: 'drop-07', description: '120 pieces. No restock.', image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=800&q=90' },
    { name: 'Archive', slug: 'archive', description: 'Past drops. Sold out forever.', image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=90' },
    { name: 'Hoodies', slug: 'hoodies', description: 'Heavy cotton. Always limited.', image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=90' },
    { name: 'Bottoms', slug: 'bottoms', description: 'Cargos, trousers, and shorts.', image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=90' },
    { name: 'Accessories', slug: 'accessories', description: 'Caps, bags, and extras.', image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=800&q=90' },
    { name: 'Collabs', slug: 'collabs', description: 'Artist collaborations.', image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=90' },
  ],
}
