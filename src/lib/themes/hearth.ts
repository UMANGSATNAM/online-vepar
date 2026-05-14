import type { NicheTheme } from './types'

export const HEARTH: NicheTheme = {
  id: 'hearth',
  name: 'HEARTH',
  niche: 'Home / Décor',
  tagline: 'Where every corner tells a story.',
  styleFamily: 'Organic',
  previewImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
  previewImages: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80',
  ],
  accentHex: '#8B6F5E',
  sectionCount: 80,
  colorSystem: {
    primary: '#8B6F5E',
    primaryFg: '#FFFFFF',
    secondary: '#3D2B1F',
    secondaryFg: '#FFF8F5',
    accent: '#C4A882',
    background: '#FDF9F6',
    surface: '#FFFFFF',
    surfaceRaised: '#F5EDE6',
    border: '#E8D5C8',
    borderStrong: '#C9A890',
    text: '#3D2B1F',
    textMuted: '#7D6559',
    textInverse: '#FFFFFF',
    success: '#2D6A4F',
    warning: '#D97706',
    error: '#B91C1C',
  },
  typography: {
    displayFont: "'Cormorant Garamond', Georgia, serif",
    bodyFont: "'Inter', system-ui, sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500&display=swap',
    displayWeights: [400, 600],
    bodyWeights: [400, 500],
    scaleRatio: 1.414,
  },
  motionSystem: {
    defaultEasing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    springEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    sharpEasing: 'cubic-bezier(0.12, 0, 0.39, 0)',
    fastDuration: '200ms',
    baseDuration: '400ms',
    slowDuration: '700ms',
  },
  pages: {
    home: {
      sections: [
        { id: 'ht-announce', type: 'announcementBar', label: 'Announcement', settings: { text: '🏡 Free shipping on orders above ₹1499 · COD available · Handcrafted in India', backgroundColor: '#3D2B1F', textColor: '#FDF9F6' } },
        { id: 'ht-hero', type: 'heroEditorialSplit', label: 'Hero', settings: { eyebrow: 'New: Monsoon Living Collection', headline: 'Make your home\nyour sanctuary.', subhead: 'Handcrafted décor, thoughtfully curated. Built for modern Indian homes.', primaryCtaLabel: 'Explore Collection', primaryCtaUrl: '/collections/new', secondaryCtaLabel: 'Rooms We Love', secondaryCtaUrl: '/pages/lookbook', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=90', layout: 'media-right', backgroundColor: '#FDF9F6' } },
        { id: 'ht-rooms', type: 'shopByRoom', label: 'Shop by Room', settings: { headline: 'Shop by room', rooms: [{ name: 'Living Room', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80' }, { name: 'Bedroom', image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&q=80' }, { name: 'Dining', image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80' }, { name: 'Outdoor', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80' }] } },
        { id: 'ht-bestsellers', type: 'featuredCollection', label: 'Bestsellers', settings: { eyebrow: 'Customer favourites', title: 'Bestsellers', collectionSlug: 'bestsellers', count: 4, ctaLabel: 'Shop all' } },
        { id: 'ht-story', type: 'brandStory', label: 'Our Story', settings: { headline: 'Made with intention.', body: 'Every piece in the HEARTH collection is sourced from artisans across India — Rajasthan, Kerala, Kutch, and beyond. We believe your home should reflect who you are, not what everyone else has.', imageUrl: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=90', ctaLabel: 'Read our story', ctaUrl: '/pages/about' } },
        { id: 'ht-lookbook', type: 'lookbookGrid', label: 'Lookbook', settings: { headline: 'Styled spaces', images: [{ url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80', caption: 'The minimal living room' }, { url: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&q=80', caption: 'Warm bedroom tones' }, { url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80', caption: 'Dining in style' }] } },
        { id: 'ht-footer', type: 'footerFull', label: 'Footer', settings: { storeName: 'HEARTH', tagline: 'Handcrafted décor for modern Indian homes.', columns: [{ title: 'Shop', links: [{ label: 'Living Room', url: '/collections/living-room' }, { label: 'Bedroom', url: '/collections/bedroom' }, { label: 'Dining', url: '/collections/dining' }, { label: 'New Arrivals', url: '/collections/new' }] }] } },
      ],
    },
    product: {
      sections: [
        { id: 'htp-gallery', type: 'productGallery', label: 'Gallery', settings: { layout: 'editorial', showDimensions: true } },
        { id: 'htp-buybox', type: 'stickyBuyBox', label: 'Buy Box', settings: { showPincode: true, showCod: true, showRoomVisualizer: true } },
        { id: 'htp-details', type: 'productDetails', label: 'Details', settings: { showMaterial: true, showCareInstructions: true, showOrigin: true } },
        { id: 'htp-reviews', type: 'reviewsGrid', label: 'Reviews', settings: { showPhotos: true } },
      ],
    },
    collection: {
      sections: [
        { id: 'htc-header', type: 'collectionHeader', label: 'Header', settings: { style: 'editorial' } },
        { id: 'htc-filters', type: 'collectionFilters', label: 'Filters', settings: { showRoom: true, showMaterial: true, showStyle: true } },
        { id: 'htc-grid', type: 'collectionGrid', label: 'Products', settings: { columns: 3, showDimensions: true } },
      ],
    },
    cart: {
      sections: [{ id: 'htcart', type: 'cartDrawer', label: 'Cart', settings: { showGiftWrapping: true, freeShippingThreshold: 1499 } }],
    },
    about: {
      sections: [{ id: 'hta-hero', type: 'heroEditorialSplit', label: 'Hero', settings: { headline: 'Designed for the way you live.', imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1400&q=90' } }],
    },
  },
  seedProducts: [
    { name: 'Jaipur Block Print Cushion Covers (Set of 2)', slug: 'jaipur-block-print-cushion-set', description: 'Hand block-printed cotton cushion covers. 45x45cm. Available in 4 colorways. Zipper closure. Wash care included.', price: 699, comparePrice: 999, images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=90'], tags: ['cushion', 'jaipur', 'block-print', 'bestseller'], category: 'Living Room', hsnCode: '6302', gstRate: 5 },
    { name: 'Mango Wood Side Table — Natural', slug: 'mango-wood-side-table', description: 'Solid mango wood side table with cross-leg base. 45x45x55cm. Ready to assemble. Each piece is unique due to natural wood grain.', price: 2499, images: ['https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=90'], tags: ['table', 'mango-wood', 'living-room', 'natural'], category: 'Living Room', hsnCode: '9403', gstRate: 18 },
    { name: 'Kerala Coconut Shell Bowl Set', slug: 'coconut-shell-bowl-set', description: 'Hand-turned coconut shell bowls. Set of 3 sizes. Food safe lacquer finish. Ideal for snacks, keys, or decor.', price: 849, images: ['https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=90'], tags: ['bowl', 'coconut', 'kerala', 'sustainable'], category: 'Dining', hsnCode: '4421', gstRate: 12 },
  ],
  seedCollections: [
    { name: 'Living Room', slug: 'living-room', description: 'Cushions, throws, side tables, and statement pieces.', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=90' },
    { name: 'Bedroom', slug: 'bedroom', description: 'Bedlinen, lamps, and bedside decor.', image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=90' },
    { name: 'Dining', slug: 'dining', description: 'Tableware, placemats, and serveware.', image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=90' },
    { name: 'Bestsellers', slug: 'bestsellers', description: 'Our most loved pieces.', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=90' },
    { name: 'New Arrivals', slug: 'new', description: 'Fresh additions this season.', image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=90' },
  ],
}
