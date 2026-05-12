# Complete Panel & Feature Inventory: Shopify-Class Commerce Platform

**Companion to:** Master Architecture Document
**Purpose:** Exact panel-by-panel feature spec — every screen, every section, every feature
**Version:** 1.0

---

## How This Document Is Organized

For each of the **8 panels**, you get:
- **Who uses it** (the user persona)
- **URL structure** (where it lives)
- **Tech stack** (frontend + backend for this panel)
- **Auth & access** (who can log in)
- **All sections** (top-level navigation)
- **All features per section** (the complete inventory)
- **India-specific additions** (your moat)
- **Build phase priority** (when to build it)

Total: **~450 distinct features** across 8 panels.

---

# PANEL 1: MERCHANT ADMIN PANEL

## Overview
**The big one.** This is what your customers (store owners) live inside daily. 70% of your engineering effort goes here. Shopify's admin has 200+ screens. You'll match that gradually.

- **Users:** Store owners, their staff, contracted agencies
- **URL:** `admin.yourplatform.com` or `yourplatform.com/admin`
- **Tech:** React 18 + TypeScript + Vite + your design system + GraphQL backend
- **Auth:** Email + password + mandatory 2FA + session timeout 7 days
- **Mobile:** Responsive web (year 1) + native mobile app (year 2)
- **Build phase:** Foundation in Phase 0, features added in every subsequent phase

## Navigation Structure (Left Sidebar)

```
Dashboard (Home)
├── Orders
│   ├── All Orders
│   ├── Draft Orders
│   ├── Abandoned Checkouts
│   └── Returns
├── Products
│   ├── All Products
│   ├── Collections
│   ├── Inventory
│   ├── Transfers
│   ├── Purchase Orders
│   └── Gift Cards
├── Customers
│   ├── All Customers
│   └── Segments
├── Marketing
│   ├── Campaigns
│   ├── Automations
│   └── Activity
├── Discounts
├── Content
│   ├── Pages
│   ├── Blog Posts
│   ├── Menus (Navigation)
│   ├── Files
│   └── Metaobjects
├── Analytics
│   ├── Dashboard
│   ├── Reports
│   └── Live View
├── Online Store (Sales Channel)
│   ├── Themes
│   ├── Blog Posts
│   ├── Pages
│   ├── Navigation
│   ├── Domains
│   └── Preferences
├── Apps
└── Settings (separate full-page area)
```

---

## 1.1 Dashboard (Home)

The first screen merchants see daily. Should answer: "What's happening with my business today?"

**Widgets:**
- Sales today (with comparison to yesterday/last week)
- Sessions today (with conversion rate)
- Total orders today
- Top products today
- Average order value
- Returning customer rate
- Total online store sessions chart (last 7 days)
- Pending tasks (orders to fulfill, abandoned carts to recover, low inventory alerts)
- Latest 5 orders (quick view)
- Setup checklist (for new merchants)
- Recent activity feed

**Personalization:**
- Drag-drop widget reordering
- Show/hide widgets per user
- Date range selector (today / yesterday / 7d / 30d / custom)

---

## 1.2 Orders Section

### 1.2.1 All Orders
- Order list with columns: Order #, Date, Customer, Channel, Payment status, Fulfillment status, Total, Tags
- Filters: status (open/closed/cancelled), payment status, fulfillment status, channel, tag, date range, location, app source
- Bulk actions: capture payment, mark as fulfilled, archive, add tags, export
- Search: by order number, customer, email, product, SKU
- Saved filter views
- CSV export (with field selection)
- Sort by any column
- Pagination (25/50/100 per page)

**Order Detail View:**
- Order header: number, customer, date, source
- Items list with quantities, prices, fulfillment status per item
- Customer info card with order history link
- Shipping address + billing address (with edit)
- Payment timeline (auth, capture, refunds)
- Fulfillment cards (one per shipment)
- Timeline (everything that happened to this order)
- Notes (private merchant notes)
- Tags
- Risk score (fraud assessment)
- Print options: order, packing slip, receipt, invoice (GST-compliant)
- Actions: refund, mark as paid, fulfill, archive, cancel, duplicate, edit, send invoice

**Order Edit:**
- Add line item
- Remove line item
- Adjust quantity
- Apply discount
- Customer change
- Address change
- Trigger refund/charge for difference

**Fulfillment workflow:**
- Select items to fulfill
- Select location (multi-location inventory)
- Select shipping carrier
- Enter tracking number (or generate via integration)
- Auto-generate AWB and label PDF (via Shiprocket/Delhivery)
- Send tracking email to customer
- Mark as shipped, in-transit, delivered (via webhook from carrier)

**Refund workflow:**
- Select items to refund
- Restock toggle
- Refund shipping
- Reason dropdown (customer request, damaged, fraudulent, etc.)
- Notify customer toggle
- Refund payment selection (which transaction to refund)
- Refund total calculation
- Submit → gateway refund call → confirmation

### 1.2.2 Draft Orders
- Manually-created orders (phone orders, custom quotes)
- Add products, customer, discount, shipping, tax
- Send invoice via email (customer pays via link)
- Convert to order on payment

### 1.2.3 Abandoned Checkouts
- List of incomplete checkouts (last 30 days)
- Filters: high-value, with email, with phone
- Detail: customer info, cart contents, value, abandonment point
- Actions: send recovery email, send recovery SMS, send recovery WhatsApp
- Auto-recovery campaigns (link to Marketing)

### 1.2.4 Returns
- Return requests (customer-initiated)
- Return reasons & analytics
- Refund/exchange workflow
- RTO (Return to Origin) tracking — India-specific
- Restock automation

**India-specific in Orders:**
- COD-specific filters (COD orders, COD verified, COD pending)
- RTO prediction badge on orders
- WhatsApp send notification button
- Pincode-based shipping options
- GST invoice generation with IRN/QR (e-invoicing)

---

## 1.3 Products Section

### 1.3.1 All Products
- Product list: Image, Title, Status, Inventory, Type, Vendor
- Filters: status (active/draft/archived), inventory level, vendor, type, collection, tag, published channels
- Bulk actions: edit, delete, add to collection, change vendor/type, change status
- Search by title, SKU, barcode
- CSV import & export
- Sort by any column

**Product Detail View:**
- Title, description (rich text editor with HTML mode)
- Media (images, videos, 3D models) — drag-drop, reorder, alt text
- Pricing: price, compare-at price, cost per item (for margin calc), profit auto-calculated
- Inventory: SKU, barcode, track quantity toggle, quantity, continue selling when OOS toggle
- Shipping: weight, customs info (HS code, country of origin), requires shipping toggle
- Variants: with options (size, color, etc.) — bulk price/inventory edit
- Search engine listing (SEO title, description, URL handle, preview)
- Status (active/draft/archived)
- Product organization: type, vendor, collections, tags
- Metafields (custom data)
- Sales channels (which channels this product is published to)

**Variant Management:**
- Up to 3 options, 100 variants per product (configurable limit)
- Bulk edit modal for prices, quantities, SKUs across all variants
- Per-variant: SKU, barcode, price, compare-at, weight, inventory, image

**Inventory History:**
- Stock changes log per variant
- Reason for each change (sale, return, restock, adjustment)
- User who made the change

### 1.3.2 Collections
- All Collections list
- **Manual collections:** add products manually
- **Smart collections:** rules-based (e.g., "Vendor = Nike AND price > 500")
- Collection editor: title, description, image, SEO, products, conditions
- Sort order within collection (manual, alphabetical, price asc/desc, best-selling, etc.)

### 1.3.3 Inventory
- Single view of all inventory across all locations
- Filter by location, low stock, out of stock
- Bulk adjust quantities (e.g., +10 to many items at once)
- Quantity update reasons
- Stock movement history per SKU
- Low stock alerts (configurable threshold)

### 1.3.4 Transfers (Multi-location Year 2)
- Move inventory between locations
- Transfer order with line items
- In-transit status
- Receive shipment workflow

### 1.3.5 Purchase Orders (Year 2)
- Create PO to suppliers
- Track expected receive date
- Receive against PO

### 1.3.6 Gift Cards (Year 2)
- Issue gift cards (digital)
- Redeem flow at checkout
- Balance tracking
- Expiry management

**India-specific in Products:**
- HSN code field on every product (mandatory for GST)
- GST rate auto-suggested from HSN
- Per-product COD enable/disable
- Multilingual product titles & descriptions (Hindi, regional)
- Product reviews integration (in-house or via app)

---

## 1.4 Customers Section

### 1.4.1 All Customers
- Customer list: Name, Email, Phone, Location, Orders, Spent, Last order, Marketing consent
- Filters: location, segment, order count, total spent, last order date, marketing subscribed
- Bulk actions: add to segment, tag, export
- Search by name, email, phone

**Customer Detail View:**
- Profile (name, email, phone, accepts marketing toggles, account state)
- Address book (default + multiple)
- Order history with totals
- Customer-since date, last order date, total spent, total orders, AOV
- Tags
- Notes (private merchant notes)
- Tax exemption settings
- Send account invite
- Suspend / delete

**Customer Editing:**
- Update info
- Manage addresses
- Add custom metafields
- Marketing consent (with audit trail — DPDP compliance)
- Account state: enabled, invited, disabled, declined

### 1.4.2 Customer Segments
- Pre-built segments (VIP customers, At risk, New customers, etc.)
- Custom segment builder with conditions:
  - Total spent
  - Order count
  - Last order date
  - Products bought
  - Location
  - Marketing subscription
  - Custom tags
- Save segments
- Use segments in marketing, discounts, exports

**India-specific in Customers:**
- Phone number is primary identifier (not email — India uses phone heavily)
- WhatsApp opt-in tracking
- Pincode-based segments
- COD reliability score per customer (auto-calculated from RTO history)

---

## 1.5 Marketing Section

### 1.5.1 Campaigns
- One-off marketing pushes (email, SMS, WhatsApp)
- Campaign builder:
  - Audience: segment, all subscribers, custom list
  - Channel: email, SMS, WhatsApp, or multi-channel
  - Content: template selection, customization
  - Schedule: send now or schedule
  - A/B test (subject line, send time)
- Campaign analytics (sent, opened, clicked, converted, revenue)

### 1.5.2 Automations / Flows
- Pre-built automations:
  - Welcome email series
  - Abandoned cart recovery (multi-step: email → SMS → WhatsApp)
  - Post-purchase thank you
  - Browse abandonment
  - Win-back inactive customers
  - Birthday discount
  - Review request after delivery
- Custom flow builder (trigger → conditions → actions)
- Flow analytics

### 1.5.3 Activity
- Timeline of all marketing actions
- Performance reports

**India-specific in Marketing:**
- WhatsApp template manager (with Meta approval status)
- DLT-compliant SMS template manager
- Bulk WhatsApp send (with template-based messaging compliance)
- Festival campaign templates (Diwali, Holi, Raksha Bandhan, Eid)
- Regional language templates

---

## 1.6 Discounts Section

- All Discounts list (active, scheduled, expired)
- Filters by type, status, dates
- Create Discount:
  - **Type:** Amount off products, Amount off order, Buy X get Y, Free shipping
  - **Method:** Discount code, automatic
  - **Value:** % or fixed amount
  - **Applies to:** All products, specific collections, specific products
  - **Minimum requirements:** None, minimum purchase amount, minimum quantity
  - **Customer eligibility:** All, specific segments, specific customers
  - **Usage limits:** Total uses, once per customer
  - **Combinations:** With product discounts, with order discounts, with shipping discounts
  - **Active dates:** Start, end
  - **Summary preview**
- Discount detail view with usage stats (used count, revenue generated, AOV impact)

**Advanced features (Year 2):**
- Discount stacking rules
- Tiered discounts (buy more, save more)
- Product bundle discounts
- Customer-segment-specific automatic discounts

---

## 1.7 Content Section

### 1.7.1 Pages
- Custom pages (About, Contact, Shipping Policy, etc.)
- Rich text editor (TinyMCE/Tiptap)
- HTML mode for advanced
- SEO settings
- Templates (different page types using different theme templates)
- Publish/unpublish
- Schedule publish

### 1.7.2 Blog Posts
- Multiple blogs (e.g., "News", "Tutorials")
- Post editor with featured image, excerpt, tags, author
- Comments moderation
- SEO settings
- Schedule publish

### 1.7.3 Navigation Menus
- Multiple menus (main menu, footer menu, mobile menu)
- Drag-drop menu builder
- Link to: pages, products, collections, blogs, custom URL
- Multi-level nesting
- Mega menu support (Year 2)

### 1.7.4 Files
- Asset library: images, PDFs, videos, fonts
- Drag-drop upload
- Copy URL for use in content
- Folder organization
- Search by name, type, date
- CDN-served URLs

### 1.7.5 Metaobjects (Year 2)
- Custom content types (e.g., "Testimonial", "FAQ entry", "Recipe")
- Define schema (fields, types, validations)
- Create entries
- Reference in themes and content

---

## 1.8 Analytics Section

### 1.8.1 Dashboard
- Sales over time (line chart)
- Total sales, online store sessions, conversion rate, AOV (with trends)
- Top products
- Sales by channel
- Sales by traffic source
- Returning customer rate
- Date range picker
- Compare to previous period

### 1.8.2 Reports (50+ pre-built)
**Sales reports:**
- Sales over time
- Sales by product
- Sales by variant
- Sales by collection
- Sales by location
- Sales by staff
- Sales by discount code
- Sales by source/medium
- Sales by referrer
- Sales by device
- Sales by day of week / hour

**Customer reports:**
- New vs returning
- Customer cohorts (retention curves)
- Top customers by spend
- Customer acquisition cost (when integrated with ad accounts)
- Customer lifetime value
- Predicted customer behavior (Year 2 — ML)

**Marketing reports:**
- Sessions over time
- Sessions by traffic source
- Sessions by device
- Sessions by location
- Conversion rate by channel
- Marketing attribution

**Inventory reports:**
- Stock on hand
- Inventory value
- Sell-through rate
- Days of inventory remaining
- Slow-moving items

**Behavior reports:**
- Top pages
- Top search queries (with no results)
- Add-to-cart rate
- Checkout funnel

**Finance reports:**
- Sales taxes (GST breakdown)
- Refunds
- Payments by gateway
- Tips & other charges

### 1.8.3 Live View
- Real-time visitors map
- Real-time sessions
- Real-time checkouts in progress
- Real-time orders ticker
- Refresh every 15 seconds

**India-specific in Analytics:**
- COD vs prepaid split
- RTO rate report
- State-wise sales (GST regions)
- WhatsApp campaign attribution
- Pincode heatmap

---

## 1.9 Online Store Section (Sales Channel)

### 1.9.1 Themes
- Current theme display
- Theme library (installed but not active themes)
- "Customize" button → opens Theme Editor (Panel 4)
- "Actions" menu: duplicate, rename, edit code, download, delete
- Theme Store browser (browse + install)
- Upload theme (ZIP file — you know this pain)
- Theme version history

### 1.9.2 Blog Posts (alias of Content > Blog Posts)
### 1.9.3 Pages (alias of Content > Pages)
### 1.9.4 Navigation (alias of Content > Menus)

### 1.9.5 Domains
- Primary domain selector
- All domains list
- Add domain:
  - Connect existing domain (CNAME setup)
  - Buy new domain (registrar integration — Year 2)
- SSL status per domain
- Auto-redirect to primary toggle
- DNS records help

### 1.9.6 Preferences
- Homepage title & meta description (default SEO)
- Google Analytics integration
- Meta Pixel + Conversion API
- Google Search Console
- Password protection (pre-launch stores)
- Customer privacy controls (cookie consent — DPDP)

---

## 1.10 Apps Section

- Installed apps list
- Each app: name, developer, permissions, install date, billing status
- "Open app" → embedded iframe (app's admin UI)
- App settings link
- Uninstall app
- App permissions audit
- App Store browser (Panel-internal app marketplace)
- App categories (Marketing, Reviews, Subscriptions, etc.)

---

## 1.11 Settings (separate full-page area)

This is its own world. Settings has 25+ sub-sections.

### 1.11.1 Store Details
- Store name, logo
- Legal business name
- Phone, email
- Address (registered office)
- GSTIN (India-specific)
- PAN, CIN
- Standards & formats (units, weight, currency display)
- Time zone

### 1.11.2 Plan
- Current plan with usage
- Plan comparison
- Upgrade / downgrade
- Cancel subscription
- Billing history (invoices)

### 1.11.3 Billing
- Payment method on file
- Billing email
- Billing address (separate from shop address)
- Invoices download
- App charges history
- Transaction fees history

### 1.11.4 Users and Permissions
- Account owner
- Staff list with roles
- Invite staff
- Permission groups (predefined: Owner, Admin, Limited Staff)
- Custom permission groups
- Granular permissions (40+ checkboxes)
- 2FA enforcement settings
- Login activity log

### 1.11.5 Payments
- Active payment providers
- Manage providers:
  - Razorpay (default for India)
  - Cashfree
  - PayU
  - PhonePe PG
  - Stripe (international)
  - Manual payment methods (bank transfer, cheque)
- COD setup (Cash on Delivery)
  - Enable toggle
  - COD fee (₹X)
  - Min/max order value for COD
  - Pincode-level COD rules
- Capture: automatic on order, manual
- Test mode toggle

### 1.11.6 Checkout
- Customer accounts: required, optional, guest-only
- Form options: company name, address line 2, phone (required/optional)
- Order processing: auto-archive, auto-fulfill digital products
- Email marketing checkbox default (on/off)
- SMS marketing checkbox default
- WhatsApp marketing checkbox default
- Checkout language
- Order status page customization
- Abandoned checkout email automation
- Custom checkout (script tag, year 2)

### 1.11.7 Customer Accounts
- Account type: classic, new (passwordless), or none
- Login methods: email + password, OTP (phone), social
- Account fields customization
- Default address required toggle
- Reorder enabled toggle

### 1.11.8 Shipping & Delivery
- Shipping zones (countries / regions)
- Shipping rates per zone:
  - Flat rate
  - Calculated rate (carrier API)
  - Free shipping
  - Conditional rates (cart total / weight thresholds)
- Local delivery (within radius of store)
- Local pickup (with selectable locations)
- Processing time
- Delivery customizations (custom rules)
- Packages (saved package dimensions)
- Shipping labels (carrier integrations setup)
- General shipping settings (require company name, etc.)

### 1.11.9 Taxes & Duties
- Tax regions (India = GST)
- Tax overrides per product / per collection
- Tax-inclusive pricing toggle
- Charge tax on shipping rates toggle
- Tax-exempt customers
- GSTIN configuration
- E-invoicing setup
- HSN code default

### 1.11.10 Locations
- Multiple business locations (warehouses, stores)
- Inventory tracked per location
- Fulfillment service per location
- Default location for orders
- Pickup locations (for in-store pickup)
- Markets the location serves

### 1.11.11 Markets (Year 2)
- International market setup
- Per-market currency
- Per-market language
- Per-market domain
- Per-market product publishing
- Per-market pricing

### 1.11.12 Apps and Sales Channels
- Sales channels: Online Store, POS (Year 2), Facebook, Instagram, Google, Amazon (Year 2)
- Each channel: configure, activate/deactivate
- App permissions

### 1.11.13 Domains (alias of Online Store > Domains)

### 1.11.14 Customer Events
- Pixels (Meta, Google, TikTok)
- Web Pixels API (modern customer event tracking)
- Custom pixels
- Cookie consent banner

### 1.11.15 Brand
- Brand assets: logo, banner, square logo, cover image
- Brand colors (primary, secondary, etc.)
- Slogan / tagline
- Short description
- Social links (Instagram, Facebook, X, YouTube, LinkedIn, TikTok)
- Used by storefront themes and partner apps

### 1.11.16 Notifications
- Email notification templates (30+ events)
  - Order confirmation
  - Order shipment
  - Order delivery
  - Order cancellation
  - Refund
  - Customer welcome
  - Password reset
  - Abandoned cart
  - Back-in-stock
  - Gift card
- SMS notification templates (DLT-compliant)
- WhatsApp notification templates (Meta-approved)
- Per-template editing (HTML + Liquid)
- Preview & send test
- Staff notifications (new order, low inventory)
- Webhook notifications (for integrations)

### 1.11.17 Metafields
- Define custom data fields for: products, variants, collections, orders, customers, blog posts, pages
- Field types: text, number, JSON, file, reference, date, color, etc.
- Validation rules
- Pin to admin (show on edit pages)

### 1.11.18 Files (alias of Content > Files)

### 1.11.19 Languages
- Default language
- Add languages (Hindi, Gujarati, Tamil, Telugu, Marathi, Bengali, etc.)
- Per-language translation editor
- Theme translation
- Email template translation
- Product translation (titles, descriptions)
- Collection translation
- URL routing per language

### 1.11.20 Policies
- Refund policy
- Privacy policy
- Terms of service
- Shipping policy
- Contact information
- Cancellation policy
- Generators (auto-generate template from inputs)
- Linked in checkout & footer

### 1.11.21 Gift Cards (Year 2)
- Enable/disable
- Default expiry
- Min/max amounts
- Custom denominations

### 1.11.22 Public Storefront (Year 2)
- Custom storefront API access tokens
- Headless store enable

### 1.11.23 Marketing & SEO
- Default meta titles & descriptions
- robots.txt customization
- sitemap.xml settings
- Redirects manager (301 redirects)

### 1.11.24 Webhooks (in API/Webhooks settings)
- Webhook subscription list
- Create webhook: topic, URL, format (JSON/XML), API version
- Test webhook
- Delivery history

### 1.11.25 Account
- Subscription status
- Cancel store
- Transfer ownership
- Deactivate (soft delete)

---

# PANEL 2: STOREFRONT (Customer-Facing)

## Overview
- **Users:** End customers (the people who buy)
- **URL:** `merchantname.yourplatform.com` or merchant's custom domain
- **Tech:** Rails server-side rendering + Liquid templates + minimal JS (vanilla or Alpine) + CDN
- **Auth:** None for browsing, optional for purchase (guest checkout allowed)
- **Build phase:** Phase 1

## Pages Available

### 2.1 Home Page
- Theme-controlled layout
- Sections built by merchant (slideshow, featured products, collections, testimonials, etc.)
- Hero banner with CTA
- Newsletter signup
- Most-viewed sections

### 2.2 Product Page
- Image gallery (zoom, swipe, video)
- Title, vendor, type
- Price (with sale price, discount %)
- Variant selectors (size, color)
- Quantity selector
- Add to cart button
- Buy now (express checkout)
- Description (rich text)
- Specifications / features
- Customer reviews (if app installed)
- Related products
- Recently viewed
- Trust badges (free shipping, COD available, secure checkout)
- Pincode checker ("Will it deliver to me?") — India-specific
- Stock status ("In stock" / "Only 3 left" / "Sold out")

### 2.3 Collection Page
- Title, description, hero image
- Filter sidebar (price, brand, color, size, custom)
- Sort dropdown (featured, alphabetical, price asc/desc, newest)
- Product grid (with quick view option)
- Pagination or infinite scroll
- SEO-friendly URL structure

### 2.4 Search Results Page
- Search bar with autocomplete
- Filters (same as collection)
- "Did you mean" suggestions
- No results page with recommendations

### 2.5 Cart Page
- Line items (image, title, variant, quantity, price)
- Quantity adjust
- Remove item
- Discount code input
- Order note input
- Subtotal calculation
- Taxes excluded note (or included, per merchant setting)
- Estimated shipping (with pincode entry)
- Checkout button
- Continue shopping link
- Cart abandonment exit intent (Year 2)

### 2.6 Checkout (Critical Page)
**Three-step or one-page (mobile = one-page recommended):**

**Step 1: Contact**
- Email or phone (toggle)
- Marketing consent checkbox(es)

**Step 2: Shipping Address**
- Pincode field first (auto-fills city + state)
- Full name, address1, address2, landmark, city, state, country
- Phone number
- Save address for future toggle (for customer accounts)
- Shipping method selection (with rates from carrier APIs)
- ETA per method

**Step 3: Payment**
- Razorpay-embedded payment UI
- UPI Intent (mobile prominently)
- Cards (Visa, MC, RuPay, Amex)
- Netbanking dropdown
- Wallets (Paytm, PhonePe, Amazon Pay)
- EMI options
- COD (with eligibility check by pincode + cart value)
- COD verification: OTP to phone before order confirmation

**Order summary (sticky):**
- Items thumbnails
- Subtotal
- Discount applied (line by line)
- Shipping
- Tax (CGST + SGST or IGST clearly shown)
- COD fee (if COD)
- Total

**Other elements:**
- Discount code apply
- Gift card apply (Year 2)
- Express checkout buttons (Year 2 — Shop Pay equivalent)
- Trust seals
- Return policy link
- Customer support link

### 2.7 Order Confirmation Page
- Order #, thank you message
- Order details
- Tracking info link
- Continue shopping
- Account creation prompt (for guests)
- Cross-sell / upsell offers (Year 2)
- Share with friends (referral)

### 2.8 Pages (Custom)
- About, Contact, FAQ, Shipping, Returns, etc.
- Theme-controlled
- Merchant-editable content

### 2.9 Blog & Blog Post Pages
- Blog list page
- Individual post page
- Author info, date, tags, share buttons
- Comments (moderated)
- Related posts

### 2.10 Customer Login / Signup
- Login: email + password or phone + OTP
- Signup: name + email/phone + password
- Forgot password
- Social login (Google, Facebook) — Year 2
- "Continue as guest" option

### 2.11 404 / Error Pages
- Custom 404 page (theme-controlled)
- 500 page (graceful failure)
- Maintenance page

### 2.12 Search Page (separate from collection filter)
- Search bar
- Live suggestions as user types
- Recent searches
- Trending searches
- Categorized results (products, collections, pages, articles)

**India-specific in Storefront:**
- Pincode checker on PDP (Product Detail Page)
- COD eligibility badge per product / cart
- Trust signals: GSTIN displayed, FSSAI (if food), legal compliance
- WhatsApp chat widget (storefront → merchant)
- Multi-language toggle (English / Hindi / regional)
- Festival-specific banners (Diwali sale, Holi, etc.)
- "Made in India" badge support

---

# PANEL 3: CUSTOMER ACCOUNT PORTAL

## Overview
- **Users:** End customers who have accounts
- **URL:** `merchantname.yourplatform.com/account`
- **Tech:** Same theme system (Liquid) — accessible within storefront
- **Auth:** Customer login
- **Build phase:** Phase 2

## Sections

### 3.1 Dashboard
- Welcome message with name
- Recent order
- Quick links (orders, addresses, wishlist)
- Loyalty points balance (if app)
- Recommendations

### 3.2 Order History
- All orders list
- Filter by status, date
- Order detail view:
  - Items with thumbnails
  - Total breakdown
  - Tracking link
  - Reorder button
  - Cancel order (if eligible)
  - Return / exchange request
  - Download invoice (GST-compliant PDF)
  - Contact support about this order

### 3.3 Addresses
- Default address
- Saved addresses
- Add / edit / delete
- Pincode auto-fill

### 3.4 Profile
- Name, email, phone
- Date of birth (for birthday discounts)
- Gender (optional)
- Password change
- Marketing preferences (email, SMS, WhatsApp toggles — DPDP compliant)
- Delete account (DPDP right to erasure)

### 3.5 Wishlist (Year 2)
- Saved products
- Move to cart
- Share wishlist

### 3.6 Subscriptions (Year 2)
- Recurring orders (subscription products)
- Pause / cancel / skip next
- Update payment method

### 3.7 Loyalty / Rewards (App-driven)
- Points balance
- Earning history
- Redemption options
- Referral link

### 3.8 Support
- Submit ticket
- Order-specific support
- FAQ links

**India-specific in Customer Portal:**
- GST invoice download per order
- WhatsApp contact button
- Order returns with pickup scheduling
- COD-to-prepaid retry (failed COD orders)

---

# PANEL 4: THEME EDITOR

## Overview
The visual designer where merchants customize their store without code. This is one of the hardest UX challenges. Shopify has iterated on this for 15+ years.

- **Users:** Store owners, designers
- **URL:** `admin.yourplatform.com/themes/:id/editor`
- **Tech:** React + iframe (renders storefront) + WebSocket for live preview updates
- **Auth:** Merchant admin
- **Build phase:** Phase 5

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Topbar: theme name, viewport selector, save, exit          │
├──────────┬──────────────────────────────┬───────────────────┤
│          │                              │                   │
│ Left     │ Center                       │ Right             │
│ Sidebar  │ (iframe storefront preview)  │ Settings panel    │
│          │                              │                   │
│ Section  │ Click any section to edit it │ Settings for      │
│ list     │ Hover shows section bounds   │ selected section  │
│          │                              │ or block          │
│          │                              │                   │
└──────────┴──────────────────────────────┴───────────────────┘
```

## Features

### 4.1 Page Selector (Top)
- Switch between pages: home, product, collection, cart, blog, blog post, page, search, 404, password, etc.
- Each page has its own template that can have different sections

### 4.2 Section List (Left Sidebar)
- All sections on the current page
- Drag-drop reorder
- Add section button (opens picker)
- Remove section
- Hide section (without removing)
- Section icon + title
- Blocks within a section (nested drag-drop)

### 4.3 Section Picker
- Available sections grouped by category
- Sections defined in theme files (schema in JSON)
- Filtering by category
- Search

### 4.4 Live Preview (Center)
- Renders the storefront with current settings
- Updates live as merchant changes settings (debounced, ~500ms)
- Hover highlights sections
- Click selects section → opens settings on right
- Viewport switcher: desktop, tablet, mobile
- Annotation mode (comments on sections — collaboration, Year 2)

### 4.5 Settings Panel (Right)
- Section-specific settings based on schema
- Common setting types:
  - Text
  - Textarea
  - Rich text (small editor)
  - Number
  - Range slider
  - Checkbox
  - Select dropdown
  - Radio
  - Color picker
  - Image picker (from files)
  - Video picker
  - URL/link picker (page, product, collection, blog, custom URL)
  - Product picker
  - Collection picker
  - Blog picker
  - Article picker
  - Font picker
  - Header (label only)
  - Paragraph (info text only)

### 4.6 Theme Settings
- Global settings (apply to whole theme)
- Typography (font families, sizes, weights)
- Colors (palette)
- Layout (max-width, spacing scale)
- Buttons (style, radius)
- Cards (style)
- Forms (style)
- Animations (transitions)
- Social media links
- Favicon
- Brand logo
- Checkout customizations

### 4.7 Code Editor (Advanced)
- Edit raw theme files (for developers)
- File tree (layout, templates, sections, snippets, assets, config, locales)
- Liquid syntax highlighting
- JSON validation for templates
- Auto-save
- Undo/redo
- Diff with previous version
- Cannot break the theme (validation on save)

### 4.8 Versions / History
- Auto-snapshot on every save
- View previous versions
- Restore previous version
- Compare versions

### 4.9 Languages (Translation Editor)
- Per-language theme strings
- Default + secondary languages
- Inline editing of customer-facing text

### 4.10 Preview & Publish
- Preview as: desktop, mobile, tablet
- Preview as logged-in customer (Year 2)
- Save as draft
- Publish (replaces current live theme)
- Schedule publish (Year 2)

### 4.11 Theme Store Browser
- Browse available themes
- Free + paid themes
- Preview demo before installing
- Install (creates new theme record in merchant's account)
- Categories (industry, layout, free/paid)

---

# PANEL 5: SUPER ADMIN PANEL (Your Internal Operations)

## Overview
- **Users:** Your team (engineering, support, ops, sales, leadership)
- **URL:** `internal.yourplatform.com` (separate from merchant admin, IP-restricted)
- **Tech:** React + TypeScript (can reuse merchant admin design system)
- **Auth:** Strong 2FA mandatory, IP allowlist, SSO via Google Workspace, audit log on every action
- **Build phase:** Phase 0 (basic) → fully built out across all phases

## Sections

### 5.1 Dashboard
- Platform-wide metrics:
  - Total active shops
  - MRR / ARR
  - GMV today / month / year
  - Total orders today
  - New signups today
  - Churned shops this month
  - Trial conversions
  - Top shops by GMV
- Infrastructure health (uptime, latency, error rate)
- Pending support tickets count
- Pending payouts
- Trust & safety queue count

### 5.2 Merchants Management

#### 5.2.1 All Shops
- Massive table: shop handle, owner email, plan, status, country, MRR, GMV, signup date, last active
- Filters: plan, status, country, signup date range, MRR bucket, GMV bucket
- Search by shop handle, owner email, domain
- Bulk actions: export, change plan, suspend, send announcement
- CSV export

#### 5.2.2 Shop Detail View
- Complete shop profile
- Owner info (with contact details)
- Plan & billing
- Tabs:
  - **Overview:** key metrics, recent activity
  - **Billing:** invoices, payment method, plan history, transaction fees
  - **Orders:** all orders summary (link to drill-down)
  - **Apps:** installed apps
  - **Staff:** users in this shop
  - **Domains:** all domains, SSL status
  - **Theme:** current theme, version
  - **Support:** all support tickets for this shop
  - **Trust & Safety:** flags, fraud signals, prohibited content
  - **Audit Log:** every significant action on this shop
- Actions:
  - Impersonate (log in as merchant — audit trailed, restricted role)
  - Force logout
  - Change plan
  - Apply credit / refund
  - Send custom notification
  - Suspend (with reason)
  - Restore
  - Soft delete
  - Hard delete (separate workflow, requires approval)

### 5.3 Plans & Pricing
- Plan list: Starter, Growth, Pro, Plus
- Plan editor:
  - Name, price (monthly + annual)
  - Trial duration
  - Transaction fee %
  - Limits (products, staff users, locations, storage)
  - Features included/excluded (feature flags)
  - Tax rate
  - Active for new signups toggle
- Plan migrations log
- Trial extension management

### 5.4 Billing & Finance
- All invoices across all merchants
- Subscription status per merchant
- Failed payment retry queue
- Refund requests
- Revenue reports (by plan, by month, by region)
- App revenue share calculations
- Transaction fee collected
- Outstanding balances
- Bank reconciliation

### 5.5 Trust & Safety

#### 5.5.1 Review Queue
- Manual review queue (flagged shops, products, orders)
- Reasons: prohibited content, suspicious activity, chargeback rate high, etc.
- Reviewer actions: approve, warn, restrict, suspend
- Comments / notes (visible internally)

#### 5.5.2 Auto-flagging Rules
- Configure rules:
  - High chargeback rate (e.g., > 1%)
  - High RTO rate (e.g., > 30%)
  - Sudden GMV spike (potential bonus farming)
  - Prohibited keywords in products
  - Sanctioned country IP
- Per-rule actions: flag for review, auto-suspend, notify

#### 5.5.3 Prohibited Categories
- Maintain list of prohibited products (drugs, weapons, adult, gambling — depends on Indian law)
- Periodic scans of catalogs
- Notification flow to merchants

#### 5.5.4 KYC / Compliance
- Merchant verification status (PAN, GST, bank account)
- Document upload review
- Approval workflow

### 5.6 Support Tools

#### 5.6.1 Ticket Inbox
- All open tickets across all merchants
- Filter by priority, assignee, merchant, channel
- Ticket view: conversation thread, merchant context (shop, plan, recent issues)
- Reply, internal note, assign, change status
- Macros (canned responses for common issues)
- SLA tracking
- Escalation rules

#### 5.6.2 Knowledge Base CMS
- Articles (publish help.yourplatform.com)
- Categories, tags
- Search analytics (what merchants are searching)
- Articles linked from in-product help

#### 5.6.3 Announcements
- Broadcast to all merchants (in-app banner, email)
- Targeted by plan, country, segment
- Schedule

### 5.7 Theme Store Admin
- Theme submissions queue (from designers)
- Theme review workflow
- Theme metadata (categories, tags, screenshots, demo URL)
- Theme pricing
- Theme analytics (installs, conversion rate)
- Featured themes management
- Theme designer payouts

### 5.8 App Store Admin
- App submissions queue
- App review workflow
- App security audits
- App metadata
- App pricing & billing models
- App analytics (installs, MRR, churn)
- Featured apps management
- App developer payouts
- Revenue share calculations

### 5.9 Partners (App + Theme Developers)
- All partners list
- Partner profile (developer info, contact, payment details)
- Partner earnings & payouts
- Partner support tickets
- Partner academy / education

### 5.10 Domains
- Custom domains health (SSL expiring, DNS issues)
- Bulk SSL renewals
- DNS misconfiguration alerts
- Domain transfers

### 5.11 Infrastructure / DevOps Views
- Per-pod health
- Database stats
- Queue depth
- Background job status
- Cache hit rates
- Error rate heatmap
- Latency dashboards
- Deployment history & rollback
- Feature flag management

### 5.12 Internal Users & Permissions
- Your team members
- Roles: Super Admin, Admin, Support, Engineer, Sales, Finance, Read-only
- Granular permissions
- Department assignment
- Onboarding / offboarding workflow
- Audit log per user

### 5.13 Analytics & BI
- Platform health metrics
- Cohort analysis (signup cohorts, retention)
- Revenue analytics
- Engagement metrics (DAU/MAU for merchants)
- Feature adoption (which features are used by % of merchants)
- A/B test results
- Custom queries (via BI tool integration — Metabase, Mode, Looker)

### 5.14 Settings
- Platform-wide configurations
- Email templates (system emails — not merchant-customizable)
- Default plans for new signups
- Signup feature flags
- Maintenance mode
- Rate limits per plan
- Region / data residency settings

---

# PANEL 6: PARTNER DASHBOARD (App & Theme Developers)

## Overview
- **Users:** Third-party app developers, theme designers, agencies
- **URL:** `partners.yourplatform.com`
- **Tech:** React + your design system
- **Auth:** Partner account (separate from merchant account, can have both)
- **Build phase:** Phase 6

## Sections

### 6.1 Dashboard
- Overview metrics (active apps, active themes, total earnings, monthly earnings)
- Recent activity (installs, uninstalls, reviews)
- Quick links

### 6.2 Apps

#### 6.2.1 All Apps
- Your apps list (in development, in review, live)
- Each app: name, status, installs, MRR, last update

#### 6.2.2 App Detail
- Tabs: Overview, API credentials, Configuration, Pricing, Listing, Analytics, Reviews
- **Overview:** app stats
- **API credentials:** client ID, client secret, OAuth URLs, allowed scopes
- **Configuration:** webhooks, allowed redirects, GDPR webhooks
- **Pricing:** free, recurring, one-time, usage-based
- **Listing (App Store):** name, description, screenshots, demo URL, support email, categories
- **Analytics:** installs over time, churn, MRR
- **Reviews:** merchant reviews & ratings

#### 6.2.3 Create App
- Public app (App Store listing) or Custom app (specific merchants only)
- Scopes selection
- Initial configuration

### 6.3 Themes

#### 6.3.1 All Themes
- Your themes list
- Each theme: name, status, installs, revenue

#### 6.3.2 Theme Detail
- Tabs: Overview, Versions, Listing, Pricing, Analytics, Reviews
- Theme versions (with changelog)
- Submit new version for review
- Theme listing for Theme Store

### 6.4 Development Stores
- Create dev stores (free, for testing)
- Manage dev stores
- Promote dev store to production (year 2)

### 6.5 Payouts & Earnings
- Earnings summary
- Monthly statement
- Payout method setup (bank account, GST details)
- TDS deduction (India compliance)
- Tax forms (Form 26AS download for partners)
- Historical payouts

### 6.6 Documentation
- API reference (REST + GraphQL)
- App development guides
- Theme development guides
- Liquid reference
- Webhook reference
- Tutorials & sample apps

### 6.7 Support
- Partner-specific support channel (faster SLA)
- Partner forum / community
- Office hours / events

### 6.8 Partner Resources
- Marketing assets (logos, badges)
- Partner program rules
- Best practices
- Case studies

---

# PANEL 7: POS / MOBILE APP (Year 2)

## Overview
- **Users:** Store owners selling offline (retail stores, market stalls, exhibitions)
- **Platform:** iOS + Android native apps
- **Tech:** React Native or Flutter (or native if budget allows)
- **Auth:** Same as merchant admin
- **Build phase:** Year 2

## Features (Brief — defer details to Year 2)
- Cash register / checkout
- Barcode scanning
- Product catalog (synced from main admin)
- Inventory at this location
- Customer lookup
- Payment via UPI QR, cards (with mPOS device), cash
- Receipt printing (Bluetooth printer)
- Daily reports
- Cash drawer management
- Returns processing
- Customer addition on the spot
- Sync with online store

---

# PANEL 8: DEVELOPER PORTAL / DOCS

## Overview
- **Users:** Developers (anyone building on your platform)
- **URL:** `developers.yourplatform.com` and `docs.yourplatform.com`
- **Tech:** Static site (Docusaurus, Nextra, or custom Next.js) + interactive API explorer
- **Auth:** Public (but personalized for logged-in partners)
- **Build phase:** Phase 6

## Sections

### 8.1 Getting Started
- Quickstart guides (5-minute, build your first app)
- Authentication overview
- Hello World examples (Node, Ruby, Python, PHP)

### 8.2 API Reference
- REST API (all endpoints, request/response, examples)
- GraphQL API (interactive schema explorer)
- Webhooks (all topics, payload shapes)
- Liquid reference (objects, tags, filters)
- Storefront API (headless commerce)

### 8.3 App Development
- App architecture
- OAuth flow
- Embedded apps (iframe in admin)
- Theme app extensions
- Checkout extensions
- Admin extensions
- App billing
- Best practices

### 8.4 Theme Development
- Theme architecture
- Sections & blocks
- Schema reference
- Theme app integration
- Theme Store submission guide
- Performance best practices

### 8.5 Tutorials
- Build a reviews app
- Build a subscription app
- Build a custom checkout
- Build a theme from scratch
- Migrate from Shopify (huge feature — pull customers)

### 8.6 SDKs & Libraries
- Official SDKs (Ruby, Node, Python, PHP, .NET, Go)
- Mobile SDKs (Swift, Kotlin)
- CLI tools

### 8.7 Changelog
- API versioning
- Deprecation notices
- New features
- Breaking changes

### 8.8 Community
- Forums (Discourse-based)
- Discord / Slack community
- Stack Overflow tag
- Events & meetups

### 8.9 Status Page
- Live system status (status.yourplatform.com)
- Incident history
- Subscribe to notifications

---

# CROSS-CUTTING FEATURES (All Panels)

These features touch multiple panels:

## Authentication & Authorization
- Single Sign-On (SSO) — Year 2
- Multi-factor authentication (2FA via TOTP + SMS)
- Session management (active sessions list, force logout)
- Password policies
- Login attempt rate limiting
- Suspicious login detection

## Notifications
- In-app notifications (bell icon, dropdown, history)
- Email notifications (with per-event toggles)
- Push notifications (mobile app — Year 2)
- WhatsApp notifications (for critical events)

## Search (Global)
- Universal search box (in admin) that searches orders, products, customers, blog posts, articles
- Power-user keyboard shortcuts (Cmd+K)

## Help & Support
- In-app help widget
- Contextual help (per-page guidance)
- Live chat (with your support team)
- Search knowledge base from any page
- Video tutorials embedded

## Activity Log / Audit Trail
- Every significant action logged
- Per-user activity log
- Per-resource history (e.g., "who changed this product's price?")
- Compliance / forensics

## Bulk Operations
- Most lists support bulk actions
- Bulk edit modal (change one field across many items)
- Bulk delete with confirmation
- CSV import & export
- Bulk operations job tracking (long-running)

## Localization
- Admin in English (Year 1), Hindi added Year 2
- Storefront in 8+ Indian languages (Year 1)
- Currency display (₹ primary, $ for international)
- Date/time formatting per locale
- Number formatting (₹1,00,000 vs ₹100,000)

## Performance & Loading
- Skeleton loaders (not spinners)
- Optimistic updates
- Pagination + infinite scroll
- Image lazy loading
- Code splitting (admin SPA)

## Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode

## Mobile (Admin)
- Year 1: responsive web (works on mobile but not optimized)
- Year 2: native mobile app for admin

---

# SUMMARY: FEATURE COUNT BY PANEL

| Panel | Top-level Sections | Total Features | Build Phase |
|-------|-------------------|----------------|-------------|
| 1. Merchant Admin | 11 | ~250 | Phases 1–10 |
| 2. Storefront | 12 | ~60 | Phase 1 |
| 3. Customer Portal | 8 | ~25 | Phase 2 |
| 4. Theme Editor | 11 | ~40 | Phase 5 |
| 5. Super Admin | 14 | ~120 | Phase 0 onwards |
| 6. Partner Dashboard | 8 | ~35 | Phase 6 |
| 7. POS Mobile | — | ~20 | Year 2 |
| 8. Developer Portal | 9 | ~20 | Phase 6 |
| **Cross-cutting** | — | ~30 | Ongoing |
| **TOTAL** | — | **~600 features** | 24+ months |

This is what "same to same Shopify" actually means in feature volume. About 600 distinct features across 8 panels. Shopify itself has 1,500+ if you count every preference, every modal, every workflow. So this 600 is a focused, India-optimized subset that achieves feature parity *for an Indian D2C merchant's needs*.

---

# RECOMMENDED BUILD ORDER (PANEL-WISE)

**Phase 1 (Months 4–9):** Build minimum viable versions of:
- Panel 1 (Merchant Admin): Products, Orders, Customers basic CRUD
- Panel 2 (Storefront): Home, Product, Collection, Cart, Checkout
- Panel 5 (Super Admin): Just merchant list, basic billing

**Phase 2 (Months 9–14):** Expand:
- Panel 1: Full Settings, Marketing, Discounts, basic Analytics
- Panel 2: Customer login, all pages
- Panel 3 (Customer Portal): Complete
- Panel 5: Trust & safety, support tools

**Phase 3 (Months 14–20):** Deepen + add:
- Panel 1: Complete (all 250 features)
- Panel 4 (Theme Editor): Build it
- Panel 5: Complete (all 120 features)
- Panel 8 (Dev Docs): Build it

**Phase 4 (Months 20–24):** Platform extensions:
- Panel 6 (Partner Dashboard): Build it
- App platform fully live
- Beta launch to first 50 merchants

**Phase 5 (Year 2):**
- Panel 7 (POS): Build it
- Polish everything
- Public launch

---

# CRITICAL NOTE: DON'T TRY TO BUILD ALL 600 FEATURES BEFORE LAUNCH

Bhai, yeh list complete inventory hai — Shopify ki 2026 reality. Lekin tu launch karega ~30% features ke saath, baki 70% post-launch iteration mein build karega.

**Launch-blocking features (must-have for v1 public launch):**
- Products + variants + collections
- Orders (full lifecycle)
- Cart + checkout (with Razorpay + COD)
- Customer accounts
- Basic shipping (Shiprocket)
- GST tax engine
- Email + SMS notifications
- Basic storefront (home, product, collection, cart, checkout, customer pages)
- Basic theme system (one default theme + ability to customize colors/fonts)
- Domains (subdomain + custom domain CNAME)
- Discounts (codes + automatic)
- Basic analytics dashboard
- Settings (the essential 10 out of 25 sub-sections)
- Super admin (merchant management, billing, basic support)

That's ~180 features. **180 features is your real Year 1 target.** Rest is Year 2+.

**The rest (Year 2+ as you scale):**
- Theme Editor (advanced)
- App Platform (full)
- Marketing automation
- Advanced analytics
- Multi-location
- Markets / multi-currency
- POS
- Subscriptions
- Gift cards
- Partner Dashboard

If you target 180 features in 18 months, you can do it with a team of 6. If you target 600 features, you need 30 people and 4 years.

**Discipline > Ambition.** Same advice as before: build the right 180 features brilliantly, ship publicly, iterate based on real merchant feedback.

---

*End of Panel & Feature Inventory v1.0*
