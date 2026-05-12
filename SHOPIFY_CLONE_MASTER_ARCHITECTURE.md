# Master Architecture Document: Building a Shopify-Class Commerce Platform

**Project Codename:** TBD (placeholder — your platform)
**Target Market:** India-first D2C, then global
**Stack:** Ruby on Rails (Shopify's exact stack)
**Author:** Architecture spec for Umang
**Version:** 1.0
**Date:** May 2026

---

## 0. How to Read This Document

This is your **north star document** for the next 2–3 years. Not a tutorial. Not a marketing pitch. This is an engineering specification that:

- Mirrors Shopify's actual architecture (not a simplified version)
- Sequences the build so you can **finish**, not just start
- Tells you what to hire, when, and what skills
- Calls out the dangerous parts (PCI, GST, fraud) before you hit them
- Gives India-specific layers Shopify itself doesn't have

**Read order:** Sections 1–4 first for context. Sections 5–11 are reference (deep-dive when you're working on that area). Sections 12–16 are operational (revisit every quarter).

---

## 1. Honest Reality Check (Based On Your Choices)

You chose: **Funding/team hire karunga + Family/friends funding + Ruby on Rails (Shopify's exact stack).**

Let me translate this into engineering reality without sugar-coating:

### What's in your favor
- **You're already a Shopify expert.** You know Liquid, theme architecture, the merchant pain points, Indian D2C reality (COD, GST, pincode checkers, WhatsApp). Most people building a Shopify competitor don't have this. This is a 12-18 month head start.
- **Rails choice is correct.** Yes, you'll hear "Rails is dead" — ignore it. Shopify, GitHub, Stripe, Airbnb, Instacart still run on Rails. It's the highest-leverage stack for a small team building commerce because the framework gives you 60% of CRUD-heavy work for free.
- **Family funding = patient capital.** You're not on a VC clock. You can build the right thing, not the fundable thing.

### What you must accept
- **Timeline:** Minimum **18–24 months** to a launchable product that's safe to take real money on. Not "a working demo" — *safe to take real money*. There's a difference.
- **Money:** Family/friends funding typically means ₹25–80 lakh range. You will burn it on (a) salaries, (b) infra during dev, (c) compliance, (d) legal. Detailed budget in Section 14.
- **Team size:** Solo for first 3 months (architecture, foundation). Then you need minimum **3 engineers + 1 designer** to make real progress. By month 12 ideally **6–8 people**.
- **You cannot "same to same" Shopify in features for v1.** What you CAN do is match Shopify's *architecture and quality bar*, while building a focused feature set that's better than Shopify for Indian D2C specifically. That's how you actually win — not by copying their 2026 feature set, but by matching their 2010 feature set with 2026 India-native depth.

### The mental model
Don't think "Shopify clone." Think "**Indian Shopify, built right from day one.**" Shopify in 2010 had products, cart, checkout, basic themes, a few payment integrations. That's your year-1 target — but with WhatsApp-native, GST-native, COD-native, pincode-native everything baked in. That's a defensible product. A literal Shopify clone is not.

---

## 2. Vision & Scope

### Product Vision
A multi-tenant SaaS commerce platform where any Indian D2C brand can launch a fully-featured online store in under 30 minutes, with COD, GST invoicing, WhatsApp order updates, and pincode-based shipping working out of the box — no apps required.

### Scope: What "Full Product" Means (Year 1)
Not an MVP. A real product. Year 1 = everything below works.

**Merchant-facing features:**
- Multi-tenant store creation (subdomain + custom domain)
- Product catalog (variants, collections, inventory, multi-location)
- Cart + Checkout (one-page, mobile-optimized, COD + prepaid)
- Payment integrations: Razorpay, Cashfree, PayU, UPI direct
- Order management (full lifecycle including RTO)
- Customer accounts (with OTP login)
- Discount engine (codes, automatic, BOGO, tiered)
- Theme system (Liquid-based, your existing themes should work)
- Theme editor (drag-drop sections, settings, live preview)
- App platform (with OAuth, scopes, webhooks, billing)
- Admin panel (full merchant dashboard)
- Analytics & reports
- GST-compliant invoicing with HSN codes
- Shipping integrations: Shiprocket, Delhivery, Bluedart, Xpressbees
- WhatsApp Business API integration (order confirmations, abandoned cart)
- Email + SMS notifications
- SEO controls (meta tags, sitemap, structured data)
- Multi-language support (Hindi, English, regional)
- Multi-currency (₹ primary, USD/AED secondary)

**Platform-side (your operations):**
- Super admin panel
- Tenant provisioning automation
- Billing & subscriptions
- Plan management (Starter / Growth / Pro / Enterprise)
- Trust & safety (fraud detection, flagged merchants)
- Support ticket system
- Theme store
- App store
- Domain & DNS management

### Out of Scope (Year 1 — explicit deferrals)
- POS hardware integration
- B2B wholesale workflows
- Marketplace/multi-vendor (you're SaaS, not Amazon)
- Headless storefront framework (Hydrogen-equivalent — defer to year 2)
- AI features (defer to year 2 once core is stable)
- International expansion (focus India, can serve diaspora via USD)

This list will tempt you. Discipline matters more than features.

---

## 3. Architecture Philosophy: The Modular Monolith

### Why monolith, not microservices

The single biggest architectural decision Shopify made was: **stay monolithic, modularize internally.** Most startups choose microservices and die from operational complexity before they reach product-market fit. Shopify proved you can scale a single Rails app to billions of dollars.

**Rule for you:** Build a monolith. One Rails app. One codebase. One deployment. Use Rails Engines and Packwerk-style boundaries for internal modularity. You move to services only when:
- A specific component has 10x the load of others
- A team is large enough that the monolith causes coordination cost
- A component genuinely needs a different language (e.g., search in Go, ML in Python)

Until then: **one app**. This is non-negotiable for a team of 6–8.

### The four architectural layers

```
┌─────────────────────────────────────────────────────┐
│  STOREFRONT LAYER (public, customer-facing)         │
│  Liquid templates rendered → HTML/JSON for SPA      │
│  CDN-cached, sub-50ms p50                           │
├─────────────────────────────────────────────────────┤
│  ADMIN LAYER (merchant + super-admin)               │
│  React + TypeScript + Polaris-style design system   │
│  Authenticated, GraphQL backend                     │
├─────────────────────────────────────────────────────┤
│  CORE PLATFORM LAYER (the monolith)                 │
│  Ruby on Rails 8 + Sorbet + Rails Engines           │
│  REST + GraphQL APIs                                │
│  Business logic, domain models, workflows           │
├─────────────────────────────────────────────────────┤
│  DATA + INFRASTRUCTURE LAYER                        │
│  MySQL (sharded into pods) + Redis + Memcached      │
│  Kafka (later), S3, ElasticSearch (later)           │
│  Kubernetes on GCP/AWS                              │
└─────────────────────────────────────────────────────┘
```

### Module boundaries inside the monolith

Inside the Rails monolith, code organizes into **bounded contexts** (Domain-Driven Design). Each is a Rails Engine, with strict imports enforced by Packwerk-style tooling.

Suggested initial modules:

```
app/
├── billing/          # Subscriptions, invoices, dunning
├── catalog/          # Products, variants, collections, inventory
├── checkout/         # Cart, checkout sessions, order creation
├── customer/         # Customer accounts, addresses, segments
├── discount/         # Discount rules, evaluation engine
├── fulfillment/      # Shipping, tracking, returns
├── identity/         # Auth, staff users, permissions, OAuth
├── merchant/         # Tenant lifecycle, settings
├── notification/     # Email, SMS, WhatsApp orchestration
├── payment/          # Gateway abstractions, transactions
├── platform/         # Super-admin, plans, support
├── search/           # Catalog search, faceting
├── shipping/         # Carrier integrations, rate calc
├── shop/             # Store config, domain, theme assignment
├── tax/              # GST calculation, HSN, e-invoicing
├── theme/            # Theme storage, Liquid renderer hooks
└── webhook/          # Outbound event delivery
```

Each module has its own models, services, controllers, and *cannot* directly access another module's tables. Cross-module communication = service calls only. This is what keeps a Rails monolith from becoming a "Rails mess" at scale.

---

## 4. The Tech Stack — Detailed

### Backend
| Component | Choice | Notes |
|-----------|--------|-------|
| Language | Ruby 3.3+ | Use YJIT (production flag), it's 30%+ faster than vanilla |
| Framework | Rails 8 | Latest stable. Active Record + Solid Queue + Solid Cache |
| Type checking | Sorbet + Tapioca | Worth the upfront cost. Catches 70% of dumb bugs |
| Background jobs | Sidekiq (Pro license worth it) | Solid Queue for non-critical |
| API | GraphQL (graphql-ruby) + REST (Grape or Rails API) | Match Shopify's pattern |
| Auth | Devise + custom JWT layer + OAuth2 (Doorkeeper) | |
| Modularity | Packwerk + Rails Engines | Enforces module boundaries |

### Frontend
| Component | Choice | Notes |
|-----------|--------|-------|
| Admin SPA | React 18 + TypeScript + Vite | |
| Admin design system | Build your own Polaris equivalent (use shadcn/ui or Mantine as base) | This is a major investment, ~3 months for 1 designer + 1 frontend |
| State | Zustand or React Query | Avoid Redux unless you really need it |
| Forms | React Hook Form + Zod | |
| Storefront rendering | Server-side Liquid (Rails) | Optional Next.js layer later for headless |

### Database
| Component | Choice | Notes |
|-----------|--------|-------|
| Primary OLTP | MySQL 8 (Vitess later for sharding) | Shopify uses MySQL. PostgreSQL is also valid — pick one and commit |
| Caching | Redis (data) + Memcached (page fragments) | |
| Search | Meilisearch initially → Elasticsearch at scale | |
| Analytics warehouse | ClickHouse or BigQuery | Year 2 problem |
| Object storage | AWS S3 or Cloudflare R2 | |

> **Note on MySQL vs Postgres:** Shopify chose MySQL in 2004 partly for replication maturity. In 2026, PostgreSQL is equally production-grade and has better JSON, RLS for multi-tenancy, and richer ecosystem. Either is a defensible choice. Pick one and stop debating. My recommendation if you don't already have MySQL ops experience: **PostgreSQL**.

### Infrastructure
| Component | Choice | Notes |
|-----------|--------|-------|
| Cloud | AWS Mumbai (primary) + Singapore (DR) | Mumbai for data residency, compliance |
| Container orchestration | Kubernetes (EKS) | Overkill at first, right by month 12 |
| CDN | Cloudflare | India PoPs are critical |
| DNS | Cloudflare + Route53 | Custom domain handling needs both |
| Email | AWS SES (transactional) + Resend (developer-friendly) | |
| SMS | MSG91 (primary) + Gupshup (backup) | India-specific |
| WhatsApp | Direct WhatsApp Business API (via Meta) or WATI/Interakt as middleware | |
| Monitoring | Datadog or New Relic + Sentry (errors) | |
| Logs | Datadog Logs or self-hosted Loki | |
| Secrets | AWS Secrets Manager + Doppler | |
| CI/CD | GitHub Actions + ArgoCD | |

### Developer tooling
| Component | Choice |
|-----------|--------|
| Source control | GitHub (private org) |
| Code review | GitHub PRs + CODEOWNERS |
| Documentation | Notion (team) + auto-generated API docs |
| Project mgmt | Linear (engineering) + Notion (product) |
| Design | Figma |
| Communication | Slack |

---

## 5. Data Model — The Critical 30 Tables

Here are the foundational entities. This is not exhaustive (you'll have 200+ tables by year 1) but these are the load-bearing ones. Schema shown in simplified form.

### Tenancy & Identity
```
shops                  -- the tenant itself
  id, handle, name, plan_id, status, primary_domain, country, currency, created_at

shop_domains           -- multiple domains per shop (custom + myshopify-style)
  id, shop_id, hostname, is_primary, ssl_status

staff_users            -- users who manage a shop (merchant team)
  id, shop_id, email, password_digest, role_id, locale, last_login_at

roles                  -- RBAC
  id, shop_id, name, permissions (JSON)

platform_users         -- your team (super admin)
  id, email, password_digest, role
```

### Catalog
```
products
  id, shop_id, title, handle, description, vendor, product_type, status, seo_title, seo_description

product_variants
  id, product_id, sku, barcode, price, compare_at_price, weight, requires_shipping, taxable, inventory_quantity, inventory_policy

product_options          -- e.g. "Size", "Color"
  id, product_id, name, position

product_option_values    -- e.g. "S", "M", "L"
  id, product_option_id, value, position

variant_option_values    -- which option values map to which variant
  variant_id, option_value_id

collections
  id, shop_id, title, handle, type (manual|smart), rules (JSON for smart)

collection_products      -- manual collection memberships
  collection_id, product_id, position

inventory_items
  id, variant_id, sku, tracked, cost

inventory_levels         -- per-location stock
  id, inventory_item_id, location_id, available, committed

locations
  id, shop_id, name, address, country, is_active, is_fulfillment_center
```

### Customer
```
customers
  id, shop_id, email, phone, first_name, last_name, accepts_marketing, accepts_marketing_sms, state (enabled|invited|disabled)

customer_addresses
  id, customer_id, first_name, last_name, address1, address2, city, province, country, zip, phone, is_default

customer_segments        -- saved queries
  id, shop_id, name, query (JSON)
```

### Cart, Checkout, Orders
```
carts                    -- pre-checkout
  id, shop_id, token, customer_id (nullable), line_items (JSON), note, created_at, updated_at

checkouts                -- a checkout session
  id, cart_id, shop_id, email, phone, shipping_address (JSON), billing_address (JSON), shipping_method, payment_method, totals (JSON), status, completed_at

orders
  id, shop_id, order_number, customer_id, email, phone, financial_status (pending|paid|partially_refunded|refunded|voided), fulfillment_status (unfulfilled|partial|fulfilled), total_price, subtotal, tax_total, shipping_total, discount_total, currency, source (web|pos|api|draft), tags, created_at

order_line_items
  id, order_id, variant_id, product_id, title, sku, quantity, price, total_discount, tax_lines (JSON)

order_addresses
  id, order_id, type (shipping|billing), first_name, last_name, address1, ..., phone

transactions             -- payment-side records
  id, order_id, kind (authorization|capture|sale|refund|void), gateway, amount, currency, status, gateway_transaction_id, error_code, processed_at

fulfillments
  id, order_id, status, tracking_number, tracking_company, tracking_url, location_id, line_items (JSON), shipped_at, delivered_at
```

### Discounts
```
price_rules              -- the rule definition
  id, shop_id, title, target_type (line_item|shipping), target_selection (all|entitled), allocation_method (across|each), value_type (percentage|fixed), value, customer_selection, prerequisite_subtotal_min, starts_at, ends_at, usage_limit, once_per_customer

discount_codes           -- codes attached to a rule
  id, price_rule_id, code, usage_count
```

### Theme & Storefront
```
themes
  id, shop_id, name, role (main|unpublished|demo), source (theme_store|uploaded), version

theme_files              -- store every theme file
  id, theme_id, path (e.g. "sections/header.liquid"), content, checksum

theme_assets             -- compiled CSS/JS, images uploaded by merchant
  id, theme_id, key, content_type, size_bytes, cdn_url

pages                    -- merchant-created pages
  id, shop_id, title, handle, body_html, published_at, seo_title, seo_description

navigation_menus
  id, shop_id, title, handle

navigation_menu_items
  id, menu_id, parent_id, title, url, position
```

### Apps & Webhooks
```
apps                     -- apps in the marketplace
  id, name, developer_id, scopes (JSON), redirect_urls (JSON), api_key, api_secret, public_listing

app_installations
  id, shop_id, app_id, scopes_granted (JSON), access_token, installed_at, uninstalled_at

webhooks                 -- merchant-subscribed webhooks
  id, shop_id, app_id (nullable), topic, address, format (json|xml), api_version, fields (JSON)

webhook_deliveries       -- audit log
  id, webhook_id, payload, response_code, response_body, attempts, delivered_at
```

### Multi-tenancy via `shop_id`
Every table that holds tenant data has a `shop_id` column. Every query MUST filter by `shop_id`. This is enforced via:
- Default scopes in models (`default_scope { where(shop_id: Current.shop.id) }`)
- A `Current` attribute that's set by middleware on every request
- Database-level Row-Level Security (RLS) as a defense-in-depth — if Postgres
- Lint rules that prevent raw SQL without shop_id

**Tenant isolation bugs are the worst kind of bug.** A leaked product list across merchants is a company-killer. Build paranoid testing from day one.

---

## 6. The Pod Architecture (When You Scale)

Year 1: single database, all shops in one MySQL/Postgres. Fine for first 5,000–10,000 shops.

Year 2+: implement pods. Here's how Shopify does it:

```
Pod 1                    Pod 2                    Pod N
├── MySQL primary        ├── MySQL primary        ├── MySQL primary
├── MySQL replicas       ├── MySQL replicas       ├── MySQL replicas
├── Redis cluster        ├── Redis cluster        ├── Redis cluster
└── Memcached            └── Memcached            └── Memcached

           ↑                       ↑
           └──────── Router ───────┘
                       │
                  Shop ID → Pod ID mapping (in a "global" DB)
```

**Implementation in Rails:**
- Use Rails' built-in `connects_to` API for multi-DB
- A `ShopPodResolver` middleware looks up `shop.pod_id` and sets the connection
- Shops never move pods (or only rarely, with a careful migration)
- Each pod has its own deployment, so a bad migration on Pod 5 doesn't affect Pod 1

**You don't need this on day one.** You need to *plan for it* on day one. Specifically:
- Don't write code that joins data across shops
- Don't write background jobs that iterate all shops in one process
- Don't use global IDs that assume a single sequence (use UUIDs or pod-prefixed IDs)

---

## 7. Core Subsystem Specifications

This section is the deep-dive. Each subsystem gets its own subsection with: purpose, entities, key flows, third-party integrations, gotchas.

### 7.1 Identity, Auth, RBAC

**Purpose:** Authenticate three classes of users (customers, staff, platform team) with appropriate session and permission models.

**Three auth flows:**
1. **Customer auth** — email/password, OTP (phone), social. Lightweight session.
2. **Staff auth** — staff of a merchant. RBAC inside their shop. 2FA required.
3. **Platform auth** — your team. Strong 2FA. IP allowlist. Audit logs on every action.
4. **App auth (OAuth)** — third-party apps acting on behalf of a shop.

**RBAC model:**
- Roles are shop-scoped (`shop_id` in roles table)
- Permissions are granular: `orders.read`, `orders.refund`, `products.write`, `staff.invite`, etc.
- Predefined roles: Owner, Admin, Staff, Limited Staff, Custom
- Permission check: middleware + decorator pattern in controllers

**OAuth2 for apps:**
- Use Doorkeeper gem
- Scopes per app installation (`read_products`, `write_orders`, etc.)
- Refresh token rotation
- Token revocation on uninstall

**Gotchas:**
- Don't ever store passwords reversibly. bcrypt with cost 12+.
- Session fixation, CSRF — Rails handles most, but verify with security audit.
- OTP rate limiting — abusers will burn your SMS budget in hours.

### 7.2 Catalog (Products, Variants, Collections, Inventory)

**Purpose:** Model the merchant's sellable goods and stock levels.

**Critical design decisions:**
- A product without variants doesn't exist internally. Even simple products have one default variant. This simplifies inventory, pricing, SKU logic.
- Variants are immutable in identity but mutable in content. You never "delete" a variant — you archive it.
- Inventory is tracked at the **variant + location** intersection. Two locations = two inventory_level rows per variant.
- Smart collections evaluate rules at query time (with caching). Don't materialize membership unless the collection is huge — then snapshot it.

**Key flows:**
- **Create product with variants:** validate option combinations, generate variant rows, validate SKU uniqueness within shop.
- **Update inventory:** locking is critical — use optimistic locking (`lock_version`) or pessimistic for high-contention SKUs (flash sales).
- **Bulk import:** CSV upload → background job → row-by-row validation → atomic-per-row writes with detailed error report.

**Gotchas:**
- Indian merchants will upload 50,000-row CSVs. Your importer must handle this — chunked, resumable, with progress.
- Inventory oversells during flash sales destroy trust. Use DB-level locks or Redis-based reservation counters.

### 7.3 Cart & Checkout

**Purpose:** Convert browsing into a paid order. This is where Shopify's billion-dollar moat lives.

**Architecture:**
- Cart = pre-checkout state, identified by a token cookie. Anonymous or customer-linked.
- Checkout = a state machine: `created → contact → shipping → payment → completed`
- Each step validates and persists state. Customer can abandon and resume.
- Tax, shipping, discount, and total are computed at every state transition.

**Cart-to-checkout transition:**
1. Customer hits "Checkout"
2. Cart is converted to a Checkout record (immutable line items snapshot)
3. Cart token transfers to checkout token
4. Pricing locked at checkout creation (prevents mid-checkout price changes)

**Payment integration:**
- Abstract `PaymentGateway` interface
- Concrete gateways: `Razorpay`, `Cashfree`, `PayU`, `Stripe` (for international), `Cash` (COD)
- Two-step flow: **authorize** → **capture** (or **sale** for single-step)
- Capture happens after order is created, sometimes after fulfillment
- 3D Secure flow: redirect → callback → verify

**One-page vs multi-step checkout:**
- Mobile (where 80% of Indian traffic is): one-page, all fields visible, address autocomplete from pincode
- Desktop: multi-step is fine
- Saved customer details: one-click second purchase

**Conversion-killers to avoid:**
- Mandatory account creation (offer guest + "create account on completion")
- Slow pincode → city autofill
- Hidden COD fees revealed at last step
- No express checkout (Shop Pay equivalent — build this in year 2)

**Gotchas:**
- Idempotency: payment webhooks fire multiple times. Every payment event needs an idempotency key.
- Order number generation: don't use auto-increment IDs as customer-facing numbers (leaks volume to competitors). Use a per-shop sequence: `#1001, #1002...`
- Checkout abandonment recovery: capture email/phone before payment step — abandoned cart emails are 20% of recoverable revenue.

### 7.4 Payment Processing

**Indian payment gateway integrations (priority order):**
1. **Razorpay** — most popular for D2C, easy onboarding, supports UPI/cards/wallets/EMI
2. **Cashfree** — cheaper for high volume, good for established merchants
3. **PayU** — enterprise merchants
4. **PhonePe Payment Gateway** — UPI-first
5. **Direct UPI** (UPI Intent) — for mobile checkouts, zero MDR

**For international cards (NRI customers, diaspora):**
- **Stripe** (now available in India for some segments)
- **PayPal** (rare but some merchants want it)

**Cash on Delivery (COD) is its own beast in India:**
- Requires phone OTP verification (build this)
- Requires RTO (Return to Origin) prediction — ML model in year 2, rule-based for year 1
- Pincode-based COD availability (some areas don't allow COD)
- COD charges (₹40–80 per order) — make this configurable per merchant
- COD-to-prepaid nudging (offer 5% discount for prepaying)

**PCI-DSS compliance:**
- You will NOT touch raw card data. All cards go directly to gateways via their JS SDKs (Razorpay Standard Checkout, etc.)
- This keeps you in PCI SAQ-A scope, which is the easiest. **Do not** build your own card collection forms unless you have ₹50L for compliance.

**Refunds and partial refunds:**
- Full refund: reverse the entire transaction
- Partial refund: refund specific line items (and proportional tax + shipping)
- Refund state machine: requested → processing → completed/failed
- Some gateways refund instantly, some take 5–7 days — manage merchant + customer expectations

### 7.5 Order Management

**Order lifecycle (state machine):**
```
draft → pending (payment pending)
     → paid (payment received)
     → partially_paid (partial payment, rare)
     → refunded / partially_refunded
     → voided

Fulfillment status (independent of payment):
unfulfilled → partial → fulfilled → restocked
```

**Fulfillment workflow:**
1. Merchant receives paid order
2. Merchant clicks "Fulfill" → selects location, items, carrier
3. System creates fulfillment record + label via shipping integration
4. Tracking number stored, customer notified
5. Webhooks from carrier update fulfillment status

**Returns & RTOs (huge in India):**
- Customer-initiated returns (manage from merchant admin)
- Carrier-initiated RTOs (delivery failed, customer not available) — need automatic handling
- Restocking logic: return triggers inventory increment

**Order editing:**
- Adding/removing line items post-purchase is a Shopify "Plus" feature. Build this in year 2.

### 7.6 Shipping Engine

**Integrations (build adapters for each):**
- Shiprocket (aggregator — easiest, supports 25+ carriers)
- Delhivery (direct API, lower margins)
- Bluedart (premium delivery)
- DTDC, Xpressbees, Ekart, India Post

**Two flows:**
1. **At checkout:** Customer enters pincode → query rate API → show shipping options + ETA
2. **At fulfillment:** Generate AWB (Air Waybill) + label PDF, push to carrier

**Rate calculation:**
- Weight × zone (origin pincode → destination pincode)
- Cached aggressively (rate doesn't change per minute)
- Fallback: merchant-defined flat rates if API fails

**Pincode serviceability:**
- Maintain a database of pincode → serviceable carriers (refresh weekly)
- Pre-checkout: show "Available for delivery" vs "Not available"
- This single feature is huge for Indian D2C trust

### 7.7 Tax Engine (GST)

**This is where most international platforms fail in India. Build this right.**

**GST rules:**
- CGST + SGST for intra-state sales (origin and destination same state)
- IGST for inter-state sales
- Rate determined by HSN code of the product (5%, 12%, 18%, 28%)
- Composition scheme merchants have different rules
- E-invoicing mandatory for merchants with turnover > ₹5 crore

**Architecture:**
- Every product has an HSN code
- Every product variant inherits or overrides parent's HSN
- Tax rates table: HSN → rate (with effective_from / effective_until dates — rates change in budgets)
- At checkout: compute tax per line item based on (HSN rate, origin state, destination state)

**E-invoicing:**
- Integration with NIC's IRP (Invoice Registration Portal)
- Generate IRN (Invoice Reference Number) and QR code
- Required within 24 hours of invoice
- Use providers like ClearTax, Masters India, or direct API

**GST returns:**
- Monthly GSTR-1 export per merchant
- Reconciliation reports

### 7.8 Discount Engine

**Discount types:**
- Code-based (customer enters code)
- Automatic (applies based on cart conditions)
- Promotion (e.g. "Buy 2 get 1 free", "Buy X get Y at 50% off")
- Shipping discounts (free shipping over ₹X)

**Discount evaluation flow:**
1. Cart updates → re-evaluate all applicable discounts
2. Order by priority (best for customer, or merchant-defined)
3. Check eligibility: customer segment, minimum cart, product/collection match, dates, usage limits
4. Apply allocation (across all items vs per-item)
5. Return final cart with discounts shown line-by-line

**Combinability:**
- Some discounts combine, some don't (mark each discount as combinable: product / order / shipping)
- Default: one product discount + one order discount + one shipping discount

**Gotchas:**
- "Stackable discounts" requests will multiply. Be opinionated about defaults.
- Discount-on-discount logic is a rabbit hole. Define rules upfront.
- Tax-on-discounted-price vs discount-on-tax-inclusive-price — clarify and document.

### 7.9 Theme System & Liquid

**You know this domain. Architecture is straightforward — but the rendering engine is the hard part.**

**Theme storage:**
- `themes` table: metadata per theme version
- `theme_files` table: every file stored with content + checksum (for efficient diffs)
- Compiled assets cached on CDN with versioned URLs

**Theme lifecycle:**
- Upload (ZIP validation — you've already mastered this pain)
- Customize (theme editor mutates `theme_files`)
- Publish (mark as live theme)
- Duplicate / version control
- Theme store (gallery + install flow)

**Liquid rendering:**
- Use Shopify's open-source [Liquid gem](https://github.com/Shopify/liquid)
- Build a custom **drop** layer: drops are Ruby objects that wrap your domain models and expose them to Liquid (e.g. `ProductDrop` wraps `Product`)
- All product/collection/cart access in Liquid goes through drops — never raw models. This is your security boundary.
- Cache rendered output at multiple levels (full page, fragment, section)

**Theme editor:**
- React-based admin UI
- Renders the storefront in an iframe
- Sections/blocks defined via JSON schema (same as Shopify)
- Drag-drop reordering, settings panels, live preview

**Performance:**
- Page p50 < 200ms TTFB
- Fragment caching with smart invalidation (when product updates → invalidate product page + collection pages + cart line items)
- CDN at edge for assets and HTML where cacheable

### 7.10 App Platform

**Mirror Shopify's app architecture from day one.** Even if you don't have apps for year 1, the platform must be extensible.

**App types:**
- **Public apps** — listed in your App Store, installable by any merchant
- **Custom apps** — built for one specific merchant
- **Private/dev apps** — for testing

**Installation flow (OAuth):**
1. Merchant clicks "Install" on app listing
2. Redirect to app's `auth_callback_url` with shop & state
3. App redirects to your OAuth authorize endpoint
4. Merchant approves scopes
5. You return auth code → app exchanges for access token
6. Token saved by app, used for API calls

**API access:**
- Apps call your REST + GraphQL APIs with their access token
- Scope-gated (`read_orders` ≠ `write_orders`)
- Rate limited per app installation

**Webhooks:**
- Apps subscribe to events (e.g. `orders/create`, `products/update`)
- Your platform fires HTTP POST to app's webhook URL
- Retry with exponential backoff on failure
- HMAC signature for verification

**App billing:**
- Apps can charge merchants via your billing API
- Recurring subscriptions, one-time charges, usage-based
- You take a revenue share (Shopify takes 0–15%)

**App extensions (advanced, year 2):**
- Theme app extensions (apps inject into themes)
- Checkout extensions
- Admin extensions (apps add UI to your admin panel)

### 7.11 Webhooks (Outbound)

**Purpose:** Reliably notify external systems of events.

**Architecture:**
- Event bus: every domain action publishes an event (use Rails ActiveSupport::Notifications or Wisper gem)
- Webhook dispatcher subscribes to events and fans out to webhook subscribers
- Async, retried, dead-lettered

**Reliability requirements:**
- Deliver at-least-once
- Idempotency keys in payload
- HMAC signatures
- Exponential backoff retry (5 attempts over 24 hours)
- Dead-letter queue for failed webhooks (visible to merchant in admin)

**Common topics:**
- `orders/create`, `orders/paid`, `orders/cancelled`, `orders/fulfilled`
- `products/create`, `products/update`, `products/delete`
- `customers/create`, `customers/update`
- `app/uninstalled`
- 30+ more

### 7.12 Notifications (Email + SMS + WhatsApp)

**Purpose:** Communicate with customers and merchants across channels.

**Architecture:**
- Notification trigger (e.g. order paid) → template rendering → channel router → provider API
- Templates per (event, language, channel) tuple
- Merchants can override templates in admin

**Channels:**
- **Email:** AWS SES + Resend. Transactional template editor in admin.
- **SMS:** MSG91 + Gupshup. DLT templates registered (TRAI requirement).
- **WhatsApp:** Approved templates via WhatsApp Business API. Critical for India D2C.

**Indian DLT compliance (huge gotcha):**
- All transactional SMS must use templates pre-registered with DLT (Distributed Ledger Technology) operators
- Each merchant might need their own DLT registration or use yours
- Build a template approval workflow

**WhatsApp Business API:**
- Approved templates only for proactive messages
- Free-form messages allowed within 24 hours of customer message
- Order confirmation, shipping update, delivery confirmation — all template-based
- Conversational support (live chat with merchant) — interesting addition

### 7.13 Search

**Year 1:** Meilisearch — easier to operate, sub-50ms response, supports typo tolerance, faceted search out of the box.

**Year 2+:** Migrate to Elasticsearch when you need ML ranking, semantic search, log analytics.

**Indexes:**
- Products (variants flattened in)
- Collections
- Pages, blog posts
- Orders (for merchant admin search)
- Customers (for merchant admin search)

**Features merchants expect:**
- Typo tolerance ("samsng" → Samsung)
- Synonyms ("phone" = "mobile")
- Redirects ("offer" → /collections/sale)
- Faceting (filter by brand, price range, color)
- "Did you mean"

### 7.14 Analytics & Reporting

**Three layers:**
1. **Real-time dashboards** (Merchant admin home) — today's sales, orders, sessions. Backed by Redis counters incremented in real time.
2. **Reports** (Merchant analytics tab) — yesterday, last 7d, 30d, 90d. Backed by daily aggregations stored in Postgres/ClickHouse.
3. **Custom reports / exports** — query language for power users (year 2)

**Standard reports:**
- Sales over time
- Sales by channel / referrer
- Sales by product
- Sessions, conversion rate
- Average order value
- Customer cohorts (new vs returning)
- Abandoned cart rate

**Funnel analysis:**
- Sessions → product view → add to cart → checkout started → checkout completed
- Drop-off rates at each stage

### 7.15 Domains & DNS

**Three domain modes:**
1. **Subdomain on your platform:** `storename.yourplatform.com` — given automatically
2. **Custom domain via CNAME:** merchant points their domain at your CNAME
3. **Custom domain managed by you:** sell domains, manage DNS for merchant

**SSL:**
- Use Let's Encrypt with auto-renewal
- Wildcard cert for your `*.yourplatform.com`
- Per-custom-domain certs (one per merchant domain)

**DNS:**
- Cloudflare API for custom domain provisioning
- Verification before SSL issuance
- Health checks

**Domain marketplace (year 2):**
- Integrate with registrar APIs (GoDaddy, Namecheap, Hover) for in-admin domain purchase

### 7.16 Super Admin (Your Platform Operations)

**Sections you'll need:**

**Merchants management:**
- List all shops with filters (plan, status, country, signup date, MRR)
- Detail view: full shop info, billing, support tickets, abuse flags
- Impersonation (log in as merchant to debug — audit trailed)
- Suspend/restore shop
- Hard delete (after 30-day soft delete)

**Plans & billing:**
- Plan management (create plans, pricing, limits)
- Transaction fees, app revenue share
- Failed payment retry workflows
- Invoice generation for your platform

**Trust & safety:**
- Fraud signals: suspicious order patterns, chargebacks, prohibited products
- Manual review queue
- Auto-flagging rules
- Compliance reports (KYC, PMLA)

**Theme store admin:**
- Theme submissions
- Review workflow
- Theme analytics

**App store admin:**
- App submissions
- Review workflow
- App revenue tracking

**Support tools:**
- Ticket inbox
- Macros, canned responses
- Escalation rules
- Internal notes on merchants

**Operational dashboards:**
- Platform-wide MRR, ARR, churn
- Active shops, dormant shops
- Infrastructure health
- Per-pod metrics

---

## 8. The India-Native Layer (Your Competitive Moat)

Shopify treats India as one of 175 markets. You treat India as the *only* market. This is your edge.

### 8.1 COD Native
- Pincode-based COD availability with merchant override
- COD-to-prepaid nudge UI (built into checkout, not an app)
- COD verification via OTP
- COD fee handling (merchant-defined)
- RTO prediction (rule-based v1, ML v2)

### 8.2 GST Native
- HSN required on every product
- Automatic CGST/SGST/IGST calc
- E-invoicing built in (not an app)
- GSTR-1 monthly export
- TDS for high-value orders (when applicable)

### 8.3 WhatsApp Native
- Order confirmation, shipping update, delivery confirmation via WhatsApp (template-based)
- Abandoned cart on WhatsApp (with merchant approval)
- Live chat module in storefront (merchant ↔ customer)
- WhatsApp commerce integration (catalog sync) — year 2

### 8.4 UPI-First Checkout
- UPI Intent for mobile checkout (one-tap to PhonePe/GPay/Paytm)
- UPI ID input fallback for desktop
- UPI displayed prominently above cards

### 8.5 Regional Languages
- Hindi, Gujarati, Tamil, Telugu, Marathi, Bengali, Kannada, Malayalam
- Storefront i18n (theme translations)
- Admin in English (your merchants will be okay with this in year 1)

### 8.6 Pincode Intelligence
- Pincode → city + state autofill
- Pincode → COD availability
- Pincode → serviceable carriers
- Pincode → ETA estimation

### 8.7 Local Logistics
- Shiprocket, Delhivery, Bluedart, DTDC, Xpressbees, Ekart adapters
- India Post for tier-3/4 cities
- Hyperlocal (Dunzo, Borzo) for same-city same-day — year 2

### 8.8 Local Marketing Channels
- Meta Ads pixel + Conversion API
- Google Ads conversion tracking
- Influencer affiliate tracking
- WhatsApp marketing (with consent)

---

## 9. Build Sequence — Full Product Phases (Not MVP)

This is the master roadmap. Time estimates assume a team of 4–6 engineers ramping up to 8 by month 12.

### Phase 0: Foundation (Months 1–3) — Solo or small team
**Goal:** Architectural foundation, no merchant-facing features yet.

- Project setup: Rails 8, Postgres, Redis, Sidekiq, Sorbet, Packwerk
- CI/CD pipeline (GitHub Actions → staging)
- Module skeleton (all 17 modules with empty Rails Engines)
- Multi-tenancy plumbing: `Current.shop`, default scopes, RLS
- Authentication system (Devise + JWT + OAuth2 via Doorkeeper)
- Admin shell (React + TypeScript app, login, layout)
- Storefront shell (Rails view, Liquid renderer integration)
- Basic observability (Sentry, Datadog)
- Local dev environment (Docker Compose + scripts)

**Deliverable end of Phase 0:** A "shop" can be created (CLI or seed). A staff user can log in. A storefront renders a "Hello World" Liquid template. Nothing else works yet.

### Phase 1: Catalog + Storefront (Months 4–6)
- Products, variants, options
- Collections (manual + smart)
- Inventory (single location)
- Theme upload + Liquid rendering
- Storefront pages: home, product, collection, cart
- Admin: product CRUD, collection CRUD
- Search (Meilisearch)

**Deliverable:** A merchant can upload a theme, add products, and customers can browse the storefront.

### Phase 2: Cart + Checkout + Payments (Months 6–9)
- Cart logic
- Checkout state machine
- Razorpay integration (cards, UPI, netbanking)
- COD with OTP verification
- Order creation
- Customer accounts (signup, login via OTP)
- Confirmation emails

**Deliverable:** End-to-end purchase works. Real money can flow. (Internally test, not yet public.)

### Phase 3: Fulfillment + Shipping (Months 9–11)
- Shiprocket integration
- Delhivery integration
- Pincode serviceability + rates
- Order fulfillment workflow
- Tracking + delivery webhooks
- Returns/RTO handling
- Multi-location inventory

**Deliverable:** Order → ship → deliver → return. Full lifecycle.

### Phase 4: Tax + Compliance (Months 10–12)
- GST engine (HSN, rates, CGST/SGST/IGST)
- E-invoicing integration
- GSTR-1 export
- Invoice templates (legal compliance)
- Receipts in customer email

**Deliverable:** Legally compliant order receipts and invoices. Merchant can file GST.

### Phase 5: Theme Editor + Discounts (Months 11–14)
- Theme editor UI (drag-drop sections, settings)
- Theme versioning
- Theme store (admin-curated)
- Discount engine (codes, automatic, BOGO)
- Discount evaluation in checkout

**Deliverable:** Merchants can customize their theme without code. Discounts work end-to-end.

### Phase 6: Apps Platform (Months 13–16)
- OAuth flow for apps
- Webhook system (outbound)
- App billing API
- App store admin
- App developer documentation
- Build 5 in-house apps to validate (Reviews, Email Marketing, Loyalty, Reorder Reminder, Bundle Builder)

**Deliverable:** Third-party developers can build apps. App Store has 5 first-party apps.

### Phase 7: WhatsApp + Notifications + Marketing (Months 15–17)
- WhatsApp Business API integration
- Approved template management
- Order/shipping notifications via WhatsApp
- Abandoned cart recovery (email + WhatsApp)
- SMS via MSG91 (DLT-compliant)
- Marketing automation (segments + flows)

**Deliverable:** Merchants can communicate with customers across email, SMS, WhatsApp.

### Phase 8: Analytics + Reports (Months 16–18)
- Real-time dashboard
- Standard reports (sales, traffic, customers)
- Funnel analysis
- Cohort analysis
- CSV exports

**Deliverable:** Merchants have data to make decisions.

### Phase 9: Domain Mgmt + SSL (Months 17–19)
- Custom domain CNAME flow
- Let's Encrypt cert provisioning
- Auto-renewal
- Domain marketplace (optional, integrate with registrar API)

**Deliverable:** Merchants can use their own domain.

### Phase 10: Polish + Performance + Launch Prep (Months 18–22)
- Performance optimization (target p50 < 200ms)
- Load testing (simulate Black Friday)
- Security audit (external pentest)
- PCI compliance audit (SAQ-A)
- Legal review (T&Cs, privacy policy, DPDP Act compliance)
- Support documentation
- Onboarding flow polish
- Beta merchants (10–20, hand-picked)
- Public launch (month 22–24)

**Deliverable:** Public launch. Real merchants, real money, real reliability.

### Beyond Year 2
- Pod architecture (when shop count crosses 5,000)
- Hydrogen-equivalent headless framework
- POS integration
- B2B/wholesale
- International expansion
- AI features (recommendations, fraud, copy generation, image generation)
- Marketplace mode (let merchants sell on each other's stores)

---

## 10. Team Hiring Plan

Given family/friends funding, you're optimizing for runway. Hire deliberately. Pay competitively but not lavishly. Equity matters.

### Month 1–3: Solo (you)
- You're the architect. Set foundations. Don't hire yet.
- Engage a fractional CTO or Rails consultant (₹50k–1L/month) for code reviews + architecture validation. Worth it.

### Month 4: First hire — Senior Rails Engineer
- 5+ years Rails, ideally e-commerce or fintech background
- Salary: ₹25–35 LPA (Tier 1 city) or ₹18–25 LPA (Tier 2/remote)
- Role: co-build the core monolith with you
- Equity: 1.5–3%

### Month 5: Second hire — Senior Frontend Engineer (React/TS)
- 5+ years React, design system experience preferred
- Salary: ₹22–30 LPA
- Role: builds the admin panel
- Equity: 1.5–2.5%

### Month 6–7: Third hire — Product Designer
- 3+ years SaaS / e-commerce product design
- Salary: ₹15–25 LPA
- Role: builds your design system (your "Polaris") and entire admin UX
- Equity: 1–2%

### Month 8: Fourth hire — Full-stack Engineer
- 3+ years Rails + React
- Salary: ₹18–25 LPA
- Role: features, integrations
- Equity: 0.5–1.5%

### Month 10: Fifth hire — DevOps / SRE
- 4+ years Kubernetes, AWS, observability
- Salary: ₹25–35 LPA
- Role: infrastructure, deployments, monitoring
- Equity: 1–2%

### Month 12: Sixth hire — Backend Engineer (junior-mid)
- 2+ years Rails
- Salary: ₹12–18 LPA
- Role: feature development
- Equity: 0.3–1%

### Month 14: Seventh hire — Customer Success / Support
- 2+ years SaaS support
- Salary: ₹8–15 LPA
- Role: merchant onboarding, support, documentation

### Month 15+: Sales, Growth, more engineering
- This depends on traction. Revisit quarterly.

### Hiring sources (India)
- AngelList Talent
- Cutshort
- Hasgeek (Rails/Ruby community)
- HackerRank Jobs
- LinkedIn (paid recruiter)
- Twitter (engineering DMs work well)
- Referrals from your network (Shopify partner community)

### Compensation philosophy
- Cash: market or slightly below
- Equity: meaningful (1–3% for early engineers)
- ESOP vesting: 4 years, 1 year cliff
- Cliff matters — don't give immediate equity

### Founder dilution math (rough)
- Pre-team: you own 100%
- Family/friends round (say ₹50L at ₹5cr valuation): give up 10%
- Employee ESOP pool: 10–15%
- After year 1: you own ~70%, family/friends 10%, ESOP 15% (granted progressively), 5% buffer

---

## 11. Infrastructure & Cost Estimates

### Year 1 monthly infra costs (estimated)

| Component | Monthly Cost (INR) | Notes |
|-----------|-------------------|-------|
| AWS compute (EC2/EKS) | ₹50,000–1,50,000 | Scales with merchants |
| RDS (PostgreSQL) | ₹40,000–1,00,000 | Multi-AZ + read replica |
| ElastiCache (Redis) | ₹15,000–40,000 | |
| S3 + CloudFront | ₹10,000–30,000 | Scales with theme assets |
| Cloudflare Pro | ₹2,000 | |
| Datadog (monitoring) | ₹30,000–80,000 | |
| Sentry (errors) | ₹5,000–15,000 | |
| Meilisearch hosted | ₹15,000–40,000 | |
| SES (email) | ₹3,000–15,000 | Per email volume |
| SMS (MSG91) | ₹20,000–1,00,000 | Per OTP/transactional volume |
| WhatsApp BSP | ₹15,000–50,000 | Per conversation volume |
| Domain SSL automation | ₹2,000 | |
| **Total Year 1 (peak)** | **₹2.5–6 lakh/month** | |

### Year 2+ (1000+ merchants)
- Scale to ₹15–30 lakh/month
- This is when revenue should cover it (1000 merchants × ₹2k avg plan = ₹20L/month)

### One-time costs
| Item | Cost (INR) |
|------|-----------|
| Company incorporation | ₹30,000–60,000 |
| Legal (T&Cs, contracts, ESOP setup) | ₹2–5 lakh |
| Trademark | ₹15,000 |
| Initial design system | ₹5–10 lakh (designer + 3 months) |
| Security audit (year 1, pre-launch) | ₹3–8 lakh |
| PCI SAQ-A self-assessment | ₹50,000 (mostly internal) |
| Initial marketing assets | ₹2–5 lakh |

### Salary burn (year 1, scaling team)
- Months 1–3: ₹0 (solo)
- Months 4–6: ₹3–4 lakh/month
- Months 7–9: ₹8–12 lakh/month
- Months 10–12: ₹12–18 lakh/month

**Total Year 1 cash burn (realistic):** ₹1.5–2.5 crore

This is why family/friends funding (typically ₹30L–1cr range) usually needs to be supplemented by:
- Founder bootstrap (your existing freelance income)
- Revenue from year 1 (if you launch by month 18)
- A small angel round at month 12 (₹1–3cr at ₹10–15cr valuation)

---

## 12. Compliance & Legal

You're handling money + personal data + GST. This is the boring section that keeps you out of jail. Don't skip it.

### Company structure
- **Private Limited Company** (best for fundraising, ESOP)
- Don't use sole proprietorship or LLP for a SaaS that takes money
- Register in Gujarat (your home state) or Karnataka/Maharashtra (better startup ecosystem)
- Get GST registration immediately

### Required registrations
- GST (mandatory above ₹20L turnover, do it immediately)
- Shop & Establishment registration
- Professional Tax (state-specific)
- ESIC & PF (when team > 10)
- MSME / Startup India recognition (for tax benefits)
- ISO 27001 (year 2, signal of trust)
- SOC 2 Type 1 (year 2)

### Data protection
- DPDP Act (Digital Personal Data Protection Act, 2023) compliance
  - Privacy policy
  - Consent flows
  - Data deletion on request
  - Data breach notification
- GDPR (if any EU customers' data flows through — likely yes via merchants serving NRIs)

### Payment compliance
- PCI-DSS SAQ-A scope (cards never touch your servers)
- RBI Payment Aggregator (PA) license — **only needed if you settle to merchants yourself**
  - For year 1, you do NOT do this. Use Razorpay's "Route" or similar, where they remain the PA.
  - At scale (₹500cr+ GMV/year), apply for your own PA license (₹15cr net worth requirement, 2-year process)

### Tax compliance (for your business)
- Quarterly advance tax
- Annual income tax + audit (above ₹1cr turnover)
- TDS deductions (when paying contractors)
- Section 80-IAC startup tax holiday (apply if eligible)

### Legal documents you need (engage a lawyer in month 2)
- Terms of Service for merchants
- Privacy Policy
- Data Processing Agreement (DPA)
- Cookie Policy
- Acceptable Use Policy
- Merchant Agreement (the big one)
- Refund Policy (your platform's, not merchants')
- ESOP plan
- Employee contracts + NDA + IP assignment
- Founder agreements (between you and any co-founders/team)

### Insurance
- Cyber liability insurance (year 1, ₹50k–2L premium)
- Director & Officer (D&O) insurance (when team grows or you raise)
- General liability

---

## 13. Go-to-Market Strategy

This document is engineering-focused, but a few GTM notes since they affect product:

### First 10 merchants — hand-picked beta
- Reach out to brands you have relationships with from your theme work
- Free for 6 months in exchange for feedback + case studies + permission to use logos
- Heavy hand-holding — your job is to learn, not to scale

### First 100 merchants — Indian D2C niches
- Gujarati ecosystem (you're in Gandhinagar — leverage it)
- Jewellery (you have OMNI/AURENE/Lumière experience)
- Grooming (Gentleman/GroomCraft experience)
- Apparel (ConvertX experience)
- Indian-style sweets, snacks, ayurveda
- Each merchant is a case study + referral source

### Channels
- Content marketing: "Building a D2C brand in India" content series
- YouTube: how-to videos, case studies
- Twitter (X): build in public, engage Indian D2C community
- WhatsApp groups: D2C founder communities
- Direct sales: SDR hire by month 14

### Pricing (suggested)
- **Starter:** ₹1,499/month — 2% transaction fee, basic features
- **Growth:** ₹4,999/month — 1% transaction fee, all features, basic apps free
- **Pro:** ₹14,999/month — 0.5% transaction fee, priority support, advanced features
- **Plus (enterprise):** Custom — for ₹5cr+ GMV merchants

Compare to Shopify India pricing (~₹2k–₹17k/month) — undercut slightly + India-native features = clear win.

### Sales motion
- Self-serve signup
- Free 14-day trial (no credit card)
- Onboarding call for trials > 7 days
- Win-back campaigns for churned merchants
- Migration service (paid) from Shopify/WooCommerce — huge differentiator

---

## 14. Risks & Mitigations

The most likely ways this fails — and what to do about them.

### Risk: You can't hire fast enough
**Mitigation:** Engage a Rails consulting firm in month 3 to augment hiring lag. Use them for 30–50% of work until you've hired 4 people. Costs more per hour but unblocks you.

### Risk: Compliance kills you before product-market fit
**Mitigation:** Don't try to be a PA. Use Razorpay's Route product. Don't custody money. This single decision saves you ₹2cr and 2 years.

### Risk: First merchants find a critical bug, you lose trust
**Mitigation:** Heavy QA before each beta merchant. Comprehensive automated tests. Bug bounty program by month 18. Hand-hold first 20 merchants personally.

### Risk: Family/friends money runs out before revenue
**Mitigation:** Have a Plan B angel round at month 9. Have a Plan C at month 14. Have a Plan D (revenue-based financing) at month 18. Never run with less than 3 months runway.

### Risk: You burn out
**Mitigation:** This is the highest risk. Set non-negotiables: no work on Sundays, exercise daily, sleep 7 hours. Hire a CEO/COO if you're better at engineering than running people. Therapy is engineering for the mind — use it.

### Risk: Shopify launches India-specific features that match yours
**Mitigation:** Likely. Your moat isn't features — it's *understanding India and being local*. Faster iteration cycles, better support, deeper integrations with Indian ecosystem (logistics, payments, government APIs). Move fast on partnerships Shopify can't easily replicate.

### Risk: Cofounder/early hire drama
**Mitigation:** Vesting cliffs. Clear written agreements. Cap table clarity. Difficult conversations early. Don't promise verbally — write everything down.

### Risk: You build the wrong thing
**Mitigation:** Talk to merchants weekly. Every week. Forever. The moment you stop talking to merchants is the moment you start building features no one wants.

---

## 15. Operational Cadence

### Daily
- 15-min team standup (async on Slack works)
- Sentry triage
- One merchant conversation

### Weekly
- Sprint planning (Mondays)
- Demo (Fridays — show what shipped)
- Office hours with beta merchants
- Metrics review

### Monthly
- Financial review (burn, runway, MRR)
- Product roadmap review
- Engineering retrospective
- 1:1 with every direct report

### Quarterly
- Strategic review (revisit this document)
- Performance reviews
- Board update (your family/friends investors)
- Security review

### Annually
- Pentest
- Compliance audit
- Comp adjustments
- Strategy offsite

---

## 16. The Honest Closing

Bhai, yeh document tujhe roadmap deta hai, lekin roadmap kabhi bhi territory nahi hota. Real-world mein 50% surprises aayenge — kuch achi, kuch buri.

Yeh kaam jeetne ke 4 cheezein chahiye:

1. **Patience.** Yeh 2-3 saal ka kaam hai. Shortcut nahi hai. Har month productive nahi feel hoga — kabhi kabhi mahino tak foundation ban rahi hogi aur kuch dikhega nahi. Yeh normal hai.

2. **Discipline.** Scope creep ka rakshas tujhe har hafte attack karega. "Bhai yeh ek feature add kar de" — har baar "no" bolna padega. Ya "phase 2 mein."

3. **Customer obsession.** Tu Shopify ka clone nahi bana raha. Tu Indian D2C merchants ke liye India ki Shopify bana raha hai. Har feature decision merchants ke saath baat karke aana chahiye, internal team meetings se nahi.

4. **Endurance.** Yeh family/friends ka paisa hai. Wapas dena hai, with returns. Yeh saadi responsibility hai. Iske liye long-term thinking chahiye — quarterly thinking nahi.

Aur ek last baat: **Tu pehle hi Shopify expert hai.** Iska matlab hai ki tujhe wo nukleae pata hain jo competitors ko aglee 3 saal mein samajh aayenge. Yeh teri shuruati edge hai. Use it.

Banayega bhai. Time lagega, lekin banega.

---

## Appendix A: Required Reading

Bhai yeh saari resources tu next 6 months mein consume kar le. Yeh tere CTO course hai.

### Books
- *The Rails 7 Way* (Obie Fernandez) — even though Rails 8 is out, the patterns are timeless
- *Designing Data-Intensive Applications* (Martin Kleppmann) — the bible for distributed systems
- *Working in Public* (Nadia Eghbal) — open-source dynamics, relevant for app platform
- *Domain-Driven Design Distilled* (Vaughn Vernon) — short, essential for module boundaries
- *The Software Engineer's Guidebook* (Gergely Orosz) — engineering management
- *The Hard Thing About Hard Things* (Ben Horowitz) — startup CEO reality

### Shopify Engineering Blog
- All of [shopify.engineering](https://shopify.engineering)
- Especially: "Deconstructing the Monolith", "Pods Architecture", "Shipping at Scale", "Modular Monolith"

### Other engineering blogs
- Stripe engineering blog
- GitLab engineering handbook (public)
- Basecamp / 37signals blog
- Hashicorp blog

### Podcasts
- Software Engineering Daily
- The Pragmatic Engineer (Gergely Orosz)
- Acquired (history of tech companies, including Shopify)

### Courses
- Shopify Partner Academy (free, useful even as you build a competitor)
- The Pragmatic Programmer book/course

### People to follow on Twitter/X
- DHH (Rails creator)
- Tobi Lütke (Shopify CEO)
- Gergely Orosz
- Will Larson
- Indian D2C operators: Boat, Mamaearth, SUGAR founders

---

## Appendix B: Module-by-Module Folder Skeleton

```
yourplatform/
├── app/
│   ├── billing/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── services/
│   │   ├── jobs/
│   │   ├── package.yml          # Packwerk module def
│   │   └── public/              # Public API of this module
│   ├── catalog/
│   │   ├── controllers/
│   │   │   ├── api/v1/
│   │   │   ├── api/graphql/
│   │   │   └── admin/
│   │   ├── models/
│   │   │   ├── product.rb
│   │   │   ├── variant.rb
│   │   │   ├── collection.rb
│   │   │   └── inventory_level.rb
│   │   ├── services/
│   │   │   ├── product_creator.rb
│   │   │   ├── variant_updater.rb
│   │   │   └── inventory_reservation_service.rb
│   │   ├── drops/               # Liquid drops
│   │   │   ├── product_drop.rb
│   │   │   └── collection_drop.rb
│   │   └── package.yml
│   ├── checkout/
│   │   └── ... (similar structure)
│   └── ...
├── config/
│   ├── application.rb
│   ├── routes.rb
│   ├── packwerk.yml
│   └── ...
├── db/
│   ├── migrate/
│   └── schema.rb
├── frontend/                    # React admin
│   ├── src/
│   │   ├── design-system/
│   │   ├── pages/
│   │   │   ├── orders/
│   │   │   ├── products/
│   │   │   └── ...
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── lib/
│   └── ...
├── spec/                        # RSpec tests
├── docker-compose.yml
├── Gemfile
└── README.md
```

---

## Appendix C: Decision Log (Start This Day One)

Maintain a `DECISIONS.md` file in your repo. Every significant architecture decision goes here, in this format:

```markdown
## ADR-001: Use PostgreSQL instead of MySQL

**Date:** 2026-06-15
**Status:** Accepted
**Context:** We need a primary OLTP database...
**Decision:** Use PostgreSQL 16+
**Consequences:** [+] Better JSON, [+] RLS for tenancy, [-] Different from Shopify's choice...
```

In 2 years, you'll thank yourself for this discipline. New hires can read and onboard. You won't relitigate decisions.

---

**End of Master Architecture Document v1.0**

*"The best time to plant a tree was 20 years ago. The second best time is now."*

Bana de bhai. Tu kar sakta hai. Yeh document tera GPS hai — bas chalna shuru kar.
