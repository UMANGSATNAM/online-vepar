# Online Vepar - Master Specification
**Seller Onboarding, Security, Real-Time Architecture & Store Customization**

---

## A. SELLER ONBOARDING FLOW

### A1. Account creation
- Email + mobile OTP verification (both mandatory)
- Phone number with country code, India default +91
- Strong password enforcement (min 12 chars, upper + lower + number + symbol)
- Show password strength meter live
- No card required for free trial / freemium signup
- reCAPTCHA v3 / Cloudflare Turnstile on signup
- Email verification link expires in 30 minutes
- OTP expires in 5 minutes, max 3 resends per 15 min
- Block disposable email domains (Mailinator, Tempmail etc.)
- Block signup from known VPN/Tor exit nodes (configurable)

### A2. Business profile (Step 2)
- Business type selector: Sole Proprietor / Partnership / LLP / Pvt Ltd / Public Ltd
- Brand name + legal name (separate fields)
- Store subdomain claim (e.g. yourstore.platformname.in)
- Subdomain availability check, real-time
- Business category selector (Fashion, Beauty, Jewellery, F&B, Electronics, etc.)
- Annual turnover band (drives plan suggestion)
- Number of SKUs band
- Currently selling on (Shopify / WooCommerce / Instagram / Offline / New)

### A3. KYC & verification (Step 3 — critical for trust)
- PAN number + live verification via NSDL/Karza API
- GSTIN field (optional under ₹40L turnover, mandatory above)
- GSTIN live verification via GST API
- Aadhaar eKYC (optional but recommended for sole prop) — OTP based
- CIN verification for Pvt Ltd / LLP via MCA API
- Bank account number + IFSC + penny-drop verification (₹1 deposit + name match)
- Cancelled cheque OR bank statement upload (PDF, max 5MB)
- Business address with pincode auto-fill
- Address proof upload (utility bill / rent agreement)
- Auto-flag mismatched name across PAN/GST/Bank for manual review

### A4. Store setup (Step 4)
- Logo upload (PNG/SVG, max 2MB, auto-resize)
- Favicon auto-generate from logo
- Brand color picker (primary, secondary, accent)
- Choose from 5–10 starter themes
- Theme preview before applying
- Pick storefront language (10+ Indian languages)
- Currency lock to INR (multi-currency in paid plans)

### A5. Product setup (Step 5)
- Add first product (guided wizard)
- OR import via CSV
- OR migrate from Shopify (1-click) — paste store URL + API key
- OR migrate from WooCommerce (1-click)
- OR start with sample data
- HSN code lookup helper
- GST rate auto-suggestion based on category

### A6. Payment + shipping (Step 6)
- Razorpay connect (one-click OAuth)
- Cashfree connect
- PhonePe Business connect
- Direct UPI VPA (for low-volume sellers)
- COD enable toggle (default ON for India)
- Shiprocket / Delhivery / Bluedart / Xpressbees connect
- Pickup address setup (multiple supported)
- Pre-configured shipping rate cards

### A7. Domain + go-live (Step 7)
- Free subdomain ready by default
- Custom domain connect (DNS guide)
- Free SSL auto-provisioned (Let's Encrypt)
- Pre-launch checklist (5 items: products, payment, shipping, domain, policies)
- Required policy pages auto-generated: Privacy, Terms, Refund, Shipping, Contact
- DPDP Act consent banner auto-enabled

### A8. Onboarding experience
- Progress bar across all steps
- "Save and continue later" on every step
- Skip-able non-critical steps
- In-app onboarding videos (2 min each)
- WhatsApp support button always visible
- Account Manager assigned for paid plans (₹5K+/mo)
- Welcome email + WhatsApp with credentials & next steps
- Demo store available to explore before adding own products
- Onboarding analytics (track drop-off per step)
- Re-engagement email sequence if user drops off

---

## B. AUTHENTICATION & ACCESS SECURITY

### B1. Password & login
- Argon2id or bcrypt (cost ≥12) for password hashing — never MD5/SHA1
- Block 10,000 most common passwords
- Check passwords against HaveIBeenPwned API on signup
- Mandatory 2FA for sellers (TOTP — Google Authenticator / Authy)
- SMS 2FA only as backup, never primary
- Backup codes (10 one-time codes) on 2FA setup
- Magic link login option (passwordless)
- Biometric login on mobile app (FaceID / Fingerprint)
- Auto-logout after 15 min idle, 24 hr absolute
- Re-auth required for: payout changes, password change, 2FA disable, API key generation, plan changes

### B2. Brute-force & abuse protection
- Rate limit login: 5 attempts per 15 min per IP+email
- Account lockout after 10 failed attempts (15-min cooldown)
- CAPTCHA after 3 failed attempts
- Login attempt logging (IP, device, geo, success/fail)
- Suspicious login alert via email + SMS + WhatsApp (new device, new country, impossible travel)
- New-device approval flow (email link confirmation)
- Active sessions list visible to seller, with revoke button
- Force logout all devices option
- IP allowlist option for admin panel (paid plans)

### B3. Session & token security
- JWT access tokens — 15 min expiry max
- Refresh tokens — 30 days, rotated on every use
- HttpOnly + Secure + SameSite=Strict cookies
- Token revocation on logout (blacklist in Redis)
- Device fingerprinting bound to session
- Logout invalidates token server-side, not just client-side

### B4. Role-based access (sub-users)
- Sub-user roles: Owner, Admin, Manager, Finance, Marketing, Staff, Read-only
- Granular permissions per module (orders, products, customers, payouts, settings)
- Owner cannot be deleted, only transferred
- All sub-users force 2FA
- Audit log of every privileged action
- Permission changes require Owner approval
- IP restrictions per sub-user (optional)

---

## C. APPLICATION SECURITY (OWASP TOP 10)

### C1. Input & output
- Server-side validation on every input (never trust client)
- Whitelist validation, not blacklist
- Parameterized queries everywhere (zero string-concat SQL)
- ORM with prepared statements (Prisma / Drizzle / TypeORM)
- Output encoding for all user-rendered content (XSS prevention)
- Strict Content-Security-Policy header
- HTML sanitization for rich-text fields (DOMPurify)
- File upload: extension + MIME + magic-byte check
- File upload size limits per type
- Uploaded files stored on S3 with random UUID names, never original filename
- ClamAV / VirusTotal scan on all uploads
- Image processing in sandbox (sharp/imagemagick CVE-aware)

### C2. HTTP security headers (mandatory on every response)
- Strict-Transport-Security (HSTS, max-age 1yr, includeSubDomains, preload)
- Content-Security-Policy (strict, nonce-based)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy (camera, mic, geo restricted)
- Cross-Origin-Opener-Policy: same-origin
- Cross-Origin-Resource-Policy: same-origin
- X-XSS-Protection: 0 (deprecated, rely on CSP)
- CORS: explicit allowlist, credentials only when needed

### C3. CSRF & request integrity
- CSRF tokens on all state-changing endpoints
- SameSite=Strict cookies
- Origin / Referer header validation
- Double-submit cookie pattern as backup

### C4. API security
- All APIs over HTTPS only, reject HTTP
- Rate limit per API key, per IP, per endpoint
- Tiered rate limits (free / paid / enterprise)
- API key rotation, max 90-day life
- HMAC-SHA256 signing for webhooks (with timestamp, replay protection ±5 min)
- Idempotency keys on POST endpoints (orders, payments)
- Pagination limits (max 250 per page)
- Query depth limits on GraphQL
- Disable introspection on prod GraphQL
- Versioned APIs (/v1, /v2)
- No PII in URLs or query strings — only POST body or headers

### C5. Bot & abuse protection
- WAF in front of every public endpoint (Cloudflare / AWS WAF)
- DDoS protection (Cloudflare Magic Transit / AWS Shield)
- Bot detection on signup, login, checkout (Turnstile / reCAPTCHA Enterprise)
- Honeypot fields on forms
- Behavioral analysis for fake order patterns
- Geo-blocking option (block countries you don't ship to)

---

## D. DATA SECURITY

### D1. Encryption
- TLS 1.3 minimum, TLS 1.2 only as fallback
- Auto-renew SSL (Let's Encrypt / ACM)
- AES-256 encryption at rest for DB
- Postgres TDE (Transparent Data Encryption)
- Encrypted backups
- Encrypted volumes (EBS encryption mandatory)
- PII column-level encryption (PAN, Aadhaar, bank account)
- Tokenization of card data — NEVER store full PAN, expiry, CVV
- All payment data via Razorpay/Cashfree tokens only
- PCI DSS scope minimization

### D2. Secrets management
- AWS Secrets Manager / HashiCorp Vault
- Zero secrets in code / .env in git
- Pre-commit hook: gitleaks / trufflehog
- Secret rotation every 90 days minimum
- Separate secrets per environment (dev/stage/prod)
- Audit log of every secret access

### D3. Backups & recovery
- Daily automated DB backup
- Hourly incremental backup
- Backup encryption + offsite copy
- Test backup restore monthly
- RPO ≤ 1 hour, RTO ≤ 4 hours
- Point-in-time recovery (PITR) for 35 days
- Cross-region replication for prod DB

### D4. Indian compliance (DPDP Act 2023 + RBI)
- Data residency in India (AWS Mumbai / GCP Mumbai)
- DPDP consent management (granular, withdrawable)
- Right to erasure workflow (delete on request, 30-day SLA)
- Right to data portability (export user data in JSON)
- Data fiduciary registration with DPB
- Children's data: explicit parental consent for under-18
- No card storage on own servers (RBI mandate, use Razorpay/Cashfree vault)
- CERT-In incident reporting (within 6 hours of any breach)
- CERT-In log retention (180 days minimum)
- Data Protection Officer (DPO) designated
- Privacy policy DPDP-compliant

---

## E. INFRASTRUCTURE SECURITY

### E1. Network
- All infra inside VPC, private subnets for DB
- Public subnets only for load balancer + NAT
- Security groups whitelist-only (no 0.0.0.0/0 except LB:443)
- DB never exposed to public internet
- Bastion host or AWS SSM for any SSH access
- No SSH keys in code, use SSM session manager
- VPN required for admin panel access (paid plans)
- Network segmentation: web tier / app tier / DB tier

### E2. Cloud / IAM
- Root account locked, MFA enforced, never used
- IAM least privilege (zero wildcard policies)
- MFA mandatory for every cloud admin
- No long-lived access keys, use IAM roles
- CloudTrail / audit log enabled, immutable, S3 + Glacier
- GuardDuty / Cloud Security Command Center always on
- Resource tagging enforced

### E3. Containers & runtime
- Distroless / minimal base images
- Run as non-root user
- Read-only filesystem where possible
- Image scanning in CI (Trivy / Snyk)
- Block deploys with critical CVEs
- Sign container images (Cosign / Notary)
- Runtime security (Falco / AWS Inspector)
- Resource limits set (no unbounded containers)

---

## F. CODE & SUPPLY CHAIN SECURITY
- Branch protection on main (require PR, 1+ reviewer, CI green)
- Signed commits (GPG / Sigstore)
- Mandatory code review for security-sensitive paths
- SAST in CI (SonarQube / Semgrep / Snyk Code)
- DAST weekly (OWASP ZAP / Burp Enterprise)
- Dependency scanning (Dependabot / Snyk)
- Auto-PR for security patches
- SBOM generation per release
- License compliance check
- Pen-testing quarterly (third-party)
- Bug bounty program (HackerOne / Bugcrowd) — even ₹5K/bug to start
- Public security.txt + responsible disclosure policy
- Incident response runbook
- Tabletop exercises every 6 months

---

## G. MONITORING, DETECTION & INCIDENT RESPONSE
- 24/7 application monitoring (Datadog / New Relic / Sentry)
- Error tracking with PII scrubbing
- SIEM for security logs (Wazuh / Splunk / Datadog Security)
- Anomaly detection on login, checkout, payouts
- Alert routing: PagerDuty / Opsgenie
- On-call rotation 24x7
- Public status page (status.yourplatform.in)
- Audit log immutable, 1 year retention minimum
- Per-seller activity log visible to seller
- DDoS auto-mitigation
- Fraud detection on checkout (velocity, geo, BIN, behavior)
- WAF rule auto-tuning monthly
- Incident response plan with severity levels (SEV1–SEV4)
- Customer breach notification template (DPDP mandate)

---

## H. CUSTOMER-SIDE STOREFRONT SECURITY
- Email verification on customer signup
- Phone OTP optional but recommended
- Order tracking links use UUID, never sequential IDs
- PII masked in admin views (last 4 of phone, partial email)
- 3D Secure mandatory for cards
- Fraud check before order confirmation
- No card data ever touches your servers
- Rate-limited "forgot password" (no user enumeration in error messages)
- HTTPS enforced on every storefront (no mixed content)
- CSP per storefront (allow merchant scripts via allowlist)

---

## I. SELLER-SIDE TRUST FEATURES
- Withdrawal cooling period (24 hr for new accounts)
- Bank account change requires email + SMS + 2FA
- Payout settings change locks withdrawals for 24 hr
- Email + WhatsApp alert on every payout
- Login activity dashboard
- "Was this you?" quick-deny links in alerts
- Account deletion with 30-day grace period
- Data export before deletion
- Insurance / liability coverage notice in T&C

---

## J. CERTIFICATIONS ROADMAP
- DPDP Act compliance — Day 1
- PCI DSS SAQ-A (since you don't store cards) — Month 6
- ISO 27001 — Year 1–2
- SOC 2 Type II — Year 2 (if targeting enterprise/global)
- CERT-In empanelled audit annually

---

## K. WEBSOCKET / REAL-TIME LAYER

### K1. Where WebSockets must be used (use cases)
#### Seller-side (admin dashboard)
- New order notification — instant ping + sound + browser notification
- Live order status updates (paid → confirmed → shipped → delivered)
- Real-time payment confirmation from gateway webhook → push to dashboard
- Low-stock / out-of-stock instant alerts
- Multi-warehouse inventory sync (one warehouse update broadcasts to all admin sessions)
- WhatsApp inbox — incoming customer messages real-time
- Live revenue counter + today's analytics ticker
- Online team members indicator (who's logged in right now)
- Collaborative editing lock (if Admin A is editing product X, Admin B sees "locked by A")
- Fraud / security alerts (failed login attempts, suspicious order, payout request)
- Live shipping carrier updates (Shiprocket → instant push)
- Quick-commerce sync status (Blinkit/Zepto inventory health)
- Cron job / bulk operation progress bars (CSV import, bulk price update)
- Onboarding co-pilot — real-time guidance during setup

#### Customer-side (storefront)
- Live order tracking page (no refresh needed)
- Cart sync across devices (logged-in users)
- Live stock counter on PDP ("Only 3 left!")
- "X people viewing this product right now" social proof
- Live chat with merchant (where enabled)
- Live commerce / shoppable live streams (influencer go-live → push notification → live viewer count)
- Flash sale countdown sync (server-authoritative, no client-side cheating)
- Real-time delivery ETA on tracking page
- Payment status during checkout (UPI intent / 3DS — instant feedback)

#### Platform-internal
- Real-time fraud signal pipeline (risky checkout → admin alert)
- Multi-device session sync (logout on device A → kill session on device B)
- Live deployment / status page updates
- System notifications / banners pushed to all sellers

### K2. Architecture decisions
- Socket.IO for full-featured rooms, fallback to long-polling, or uWebSockets.js / ws for raw performance — pick one, don't mix
- Separate microservice for WS (Node.js/Go/Elixir) — never bundle with main API server
- Redis Pub/Sub as backplane for horizontal scaling across WS nodes
- Sticky sessions on load balancer (cookie-based or IP-hash) — required if not using pub/sub
- Rooms / channels pattern: seller:{sellerId}, order:{orderId}, product:{productId}:viewers
- Server-Sent Events (SSE) for one-way push if bi-directional not needed (lighter, simpler) — use for storefront live tracking, live counters
- WebSocket for bi-directional (admin chat, collaborative editing, live commerce)
- MQTT over WSS for IoT / mobile-heavy use cases (low bandwidth, India 4G-friendly)
- Fall back gracefully to polling if WS blocked (corporate firewalls, weak networks)
- Connection limit per seller account: 10 concurrent (configurable per plan)
- Connection limit per IP: 50 concurrent (DDoS prevention)

### K3. WebSocket SECURITY
#### K3a. Connection establishment
- WSS only (TLS 1.3) — reject ws:// connections in production
- Origin header validation on handshake — reject any origin not in your allowlist
- JWT authentication on connect — pass token in Sec-WebSocket-Protocol header OR first message after open
- NEVER pass JWT in URL query string (logs leak it everywhere)
- Token verified on every WS connection, signature + expiry + revocation list
- Reject connection if token expired, no silent fallback
- Re-authentication on token refresh — disconnect & reconnect with new token, don't trust client to "update"
- Bind connection to single user_id + session_id at handshake; any mismatch = drop

#### K3b. Authorization (per-message)
- Authorize every single message, not just connection — message says subscribe order:123, server checks if this seller owns order 123
- Channel/room access control list (ACL) enforced server-side
- Never trust client to send their own user_id — always read from authenticated session
- Privilege escalation check on every action ("can this user fire this event?")
- Sub-user permissions enforced over WS same as REST

#### K3c. Rate limiting & abuse
- Per-connection rate limit: max 100 messages/sec
- Per-user rate limit: max 500 messages/sec across all connections
- Message size limit: 64 KB max (reject larger)
- Connection rate limit: max 10 new connections/min per IP
- Slowloris protection — kill connections with no data for 60 sec
- Heartbeat / ping-pong every 30 sec — disconnect dead connections
- Backpressure handling — if client can't keep up, drop messages (don't OOM your server)

#### K3d. Input & message validation
- Schema-validate every incoming message (JSON Schema / Zod / Joi)
- Reject malformed JSON immediately + log
- Sanitize all user content before broadcasting (XSS via WS is real)
- Never trust event names from client — whitelist allowed event types
- Versioned message protocol (v1.order.update)

#### K3e. Replay & integrity
- Sequence numbers on critical messages (order updates, payout events)
- Server-authoritative state — client sends intent, server decides outcome
- Idempotency for action messages (deduplicate by message_id)
- Sign sensitive payloads (HMAC) for high-value events

#### K3f. DDoS & connection abuse
- WAF in front of WS endpoint (Cloudflare WS support)
- CAPTCHA challenge before WS upgrade for storefront connections from suspicious IPs
- Block known VPN / Tor / botnet IPs at edge
- Auto-ban IPs that hammer the connection endpoint
- Geo-block at WS layer too (don't just rely on REST geo-block)
- Monitor for "ghost connections" (connected but never authenticated within 10 sec → drop)

#### K3g. Information disclosure
- No PII in broadcast messages — send IDs, let client fetch via authenticated REST
- No internal error messages leaked (Database connection failed at host db-prod-1 → bad)
- Mask sensitive fields (last 4 of phone, partial email) in any broadcast
- No card data, no full Aadhaar, no GSTIN in WS messages — ever

#### K3h. Disconnect & cleanup
- On logout → kill all WS connections for that user
- On password change → kill all WS connections globally
- On 2FA reset → kill all WS connections
- On suspicious activity flag → kill + alert
- On token expiry → graceful disconnect with reason code
- Garbage collect zombie rooms (no subscribers for 5 min)

### K4. Reliability & resilience
- Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Resume from last_seen_event_id on reconnect (no missed events)
- Offline queue on client — buffer events, replay on reconnect
- Server-side message replay — store last N events per channel in Redis (5 min window)
- Graceful degradation — if WS down, fall back to REST polling every 30s
- Circuit breaker on WS service — if overloaded, refuse new connections, keep existing alive
- Multi-region failover — Mumbai primary, Singapore secondary
- WS service health endpoint for load balancer
- Connection draining on deploy (don't drop active connections mid-deploy)

### K5. Observability for WS
- Track active connections count (per seller, per region, total)
- Track message throughput (msgs/sec in + out)
- Track auth failures, dropped connections, reconnect rate
- Alert on: connection spike (DDoS), connection drop spike (outage), auth failure spike (attack)
- Per-event latency tracking (time from event creation → client receipt)
- Log every connection: user_id, session_id, IP, user-agent, connected_at, disconnected_at, reason
- PII-scrubbed logs only

### K6. Indian-specific WebSocket considerations
- WS endpoint hosted in Mumbai region (low latency for tier-1 sellers)
- Optimize payload size — Indian 4G/5G is patchy outside metros
- Use binary protocols (MessagePack / Protobuf) over JSON for high-volume use cases — saves 30-40% bandwidth
- Mobile data-saver mode: throttle non-critical events (analytics ticker), keep critical (orders, payments) always on
- Test extensively on JIO 4G + Airtel 4G + spotty Wi-Fi
- Detect network change events (WiFi → 4G) and reconnect proactively
- Compress messages (permessage-deflate) for slow networks

### K7. WS-specific compliance
- CERT-In: log all WS connections with timestamp, IP, user (180-day retention)
- DPDP Act: WS messages count as data processing — consent applies
- No card data over WS — ever. RBI mandate applies to all channels.
- Audit trail for any payout / settings change pushed via WS

---

## L. STORE CREATION LOGIC (Shopify 1:1)

### L1. Multi-tenant data model
- Every entity (product, order, customer, theme, page) has shop_id foreign key — non-nullable, indexed
- Row-level security: every DB query enforces WHERE shop_id = :current_shop — no exception
- Tenant isolation tested: penetration test for IDOR (changing shop_id in URL must 404)
- Shop entity: id (UUID), handle, name, email, country, currency, timezone, iana_timezone, weight_unit, default_language, enabled_languages[], primary_domain, subdomains[], plan, status (trial/active/frozen/closed/fraud), created_at
- Shop handle = URL-safe, immutable after creation (lock it)
- Shop ID = UUID, never exposed in storefront URLs (only in admin/API)
- Soft-delete shops (mark closed_at, keep data 90 days, then hard purge per DPDP)

### L2. Provisioning workflow (what happens after seller clicks "Create store")
- Generate shop_id, claim subdomain ({handle}.yourplatform.in)
- Create shop record
- Provision dedicated SSL cert (auto)
- Seed default data:
  - Default published theme (your "Dawn equivalent" — call it Sahaj or whatever)
  - 1 sample product (visible only to admin, hidden from storefront unless they activate)
  - 5 default policy pages: Privacy, Terms, Refund, Shipping, Contact
  - 2 default menus: main-menu, footer
  - Default checkout config
  - Default tax classes (India: GST 0/5/12/18/28)
  - Default shipping zone (India + COD enabled)
  - Default email templates (16+: order confirmation, shipping, abandoned cart, etc.)
  - Default email/SMS/WhatsApp transactional templates
  - Default customer notification settings
- Create initial owner user with role owner
- Send welcome email + WhatsApp
- Fire shop.created webhook
- Create initial billing record (free trial)

### L3. Shop-scoped configuration (what every shop has)
- Currency settings (default + supported)
- Tax settings (region-based, GST class per product)
- Shipping zones + rates (zone-based pricing)
- Payment settings (gateways enabled per shop)
- Checkout settings (require account, customer accounts optional/required, marketing consent default)
- Notifications settings (which emails are sent)
- Locations (warehouses) with address + fulfillment capabilities
- Markets (multi-region selling) — international expansion later
- Files / asset library
- Domains (primary + aliases, with auto-redirect rules)
- Channels (online_store, POS, app_x)
- Languages enabled for storefront

---

## M. CATALOG MODEL (Shopify-equivalent)

### M1. Product entity
- Fields: id, shop_id, title, handle (URL slug), body_html, vendor, product_type, tags[], status (active/draft/archived), published_scope, published_at, seo_title, seo_description, template_suffix, created_at, updated_at
- Handle: auto-generated from title (slugify), unique per shop, editable, validated
- When handle changes → auto-create 301 redirect from old to new
- Up to 3 product options (e.g. Size, Color, Material)
- Each option has values; combinations = variants
- Featured image + image gallery (sortable, alt text)
- Metafields per product (custom data)
- Published-to-channels (online_store always; others toggleable)

### M2. Variant entity (Shopify's variant model is exact)
- Fields: id, product_id, title, sku, barcode, price, compare_at_price, cost, weight, weight_unit, requires_shipping, taxable, inventory_management (null/your_platform), inventory_policy (deny/continue), inventory_quantity, option1, option2, option3, position, image_id
- Default variant always exists (single-variant products use option1 = "Default Title")
- Inventory tracked per variant per location
- Variant image override (one of product images)

### M3. Collections
- Manual collection: curated list, manual position per product
- Smart collection: rule engine
  - Rule columns: product_title, product_type, vendor, tag, price, compare_at_price, weight, inventory_stock, variant_title
  - Relations: equals, not_equals, greater_than, less_than, starts_with, ends_with, contains, not_contains
  - disjunctive: true = OR (any rule), false = AND (all rules)
- Sort orders: manual, alpha-asc, alpha-desc, best-selling, created, created-desc, price-asc, price-desc
- Smart collection auto-recomputes membership on product update (background job)
- Collection metafields, SEO, image, template_suffix

### M4. Inventory model
- Multi-location: locations table (warehouses, stores, dropship)
- InventoryItem per variant, InventoryLevel per (item × location)
- available = on_hand - committed
- Atomic stock decrement on order placement (DB transaction or Redis-backed)
- Inventory reservation during checkout (10-min hold)
- Stock transfers between locations
- Inventory adjustment audit log

---

## N. THEME ARCHITECTURE (Shopify Online Store 2.0 — exact match)

### N1. File structure (mirror Shopify exactly)
```
/layout/
  theme.liquid          # main layout
  password.liquid       # password page
/templates/
  index.json            # homepage
  product.json
  collection.json
  page.json
  blog.json
  article.json
  cart.json
  search.json
  404.json
  list-collections.json
  customers/login.liquid
  customers/register.liquid
  customers/account.liquid
  customers/order.liquid
  customers/addresses.liquid
  customers/reset_password.liquid
  customers/activate_account.liquid
  gift_card.liquid
/sections/
  *.liquid              # modular sections with {% schema %}
/snippets/
  *.liquid              # partials, included via {% render %}
/assets/
  *.css *.js *.png *.svg *.woff2
/config/
  settings_schema.json  # global theme settings schema
  settings_data.json    # actual values for current theme
/locales/
  en.default.json
  hi.json, gu.json, etc.
```

### N2. JSON templates (the OS 2.0 magic)
- Each template is JSON describing which sections appear, in what order, with what settings
- Structure:
```json
{
  "sections": {
    "main": { "type": "main-product", "settings": {} },
    "related-products-1234": { "type": "related-products", "blocks": {}, "block_order": [] }
  },
  "order": ["main", "related-products-1234"]
}
```
- Section IDs are stable; theme editor mutates this JSON
- Per-template section limits (max 25 sections — match Shopify)
- Per-section block limits (defined in section schema)
- Multiple templates per resource type via template_suffix (e.g. product.contact-lens.json)

### N3. Section schema (1:1 with Shopify's {% schema %} block)
```json
{
  "name": "Image with text",
  "tag": "section",
  "class": "section",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading" },
    { "type": "image_picker", "id": "image", "label": "Image" }
  ],
  "blocks": [
    { "type": "feature", "name": "Feature", "settings": [] }
  ],
  "max_blocks": 12,
  "presets": [
    { "name": "Image with text", "blocks": [{"type": "feature"}] }
  ],
  "enabled_on": { "templates": ["index", "page"] },
  "disabled_on": { "templates": ["product"] }
}
```
- All Shopify input types must be supported: text, textarea, richtext, inline_richtext, number, range, checkbox, radio, select, image_picker, video, video_url, font_picker, color, color_scheme, color_background, html, url, page, blog, article, product, collection, collection_list, product_list, link_list, liquid, header, paragraph, metaobject, metaobject_list
- Each input type has its own UI control in theme editor
- Validation per type (URL format, color hex, image dimensions, etc.)

### N4. Liquid template engine (this is the hardest piece)
- Implement Liquid spec (use LiquidJS for Node, fork to add Shopify extensions, or port Ruby Liquid)
- Sandboxed execution — no arbitrary code, no eval, no FS access
- Per-render limits: max 100ms render, max 100k iterations, max recursion depth
- Standard tags: `{% if %}`, `{% unless %}`, `{% for %}`, `{% case %}`, `{% assign %}`, `{% capture %}`, `{% increment %}`, `{% decrement %}`, `{% comment %}`, `{% raw %}`, `{% include %}` (deprecated), `{% render %}`, `{% liquid %}`, `{% paginate %}`
- Shopify-specific tags (must implement): `{% section 'name' %}`, `{% sections 'group-name' %}`, `{% schema %}`, `{% style %}`, `{% javascript %}`, `{% stylesheet %}`, `{% form %}`, `{% layout %}`
- Shopify filters (full list — match exactly):
  - String: append, prepend, replace, replace_first, remove, truncate, truncatewords, escape, strip_html, handleize, camelize, pluralize, md5, sha1, sha256, hmac_sha256, base64_encode, base64_decode
  - Money: money, money_with_currency, money_without_currency, money_without_trailing_zeros
  - URL: link_to, asset_url, asset_img_url, file_url, img_url (deprecated), image_url, img_tag, script_tag, stylesheet_tag, payment_type_img_url, customer_login_link
  - Image: image_url with width/height/crop/format/scale params
  - Array: first, last, size, sort, sort_natural, reverse, map, where, uniq, compact, concat, join, split
  - Date: date, time_tag
  - Translation: t, default_errors, payment_terms_translate
  - Number: plus, minus, times, divided_by, modulo, round, ceil, floor, abs, at_least, at_most
  - Misc: default, json, weight_with_unit, format_address
- Drops (objects exposed in Liquid): shop, product, variant, collection, cart, customer, order, line_item, address, image, metafield, page, blog, article, comment, linklist, link, request, template, theme, settings, section, block, recommendations, predictive_search, localization, routes, country_option_tags, all_products, collections, pages, blogs, paginate, forloop

### N5. Theme settings system (config/settings_schema.json)
- Same schema syntax as section settings
- Grouped by sidebar tabs: Colors, Typography, Layout, Buttons, Cart, Social media, Favicon, Currency formatting, etc.
- Color schemes: predefined palettes (background, text, primary button, secondary button, accent) — sections reference scheme by ID
- Typography: font picker tied to your font CDN
- Settings accessed in Liquid via `{{ settings.X }}`
- Stored in config/settings_data.json per theme

---

## O. THEME EDITOR LOGIC (the visual customizer — 1:1)

### O1. Layout (logical, not visual)
- Three logical zones: section list (left), canvas iframe (center), settings panel (right or bottom on mobile)
- Top bar: template selector dropdown, device toggle (desktop/mobile/tablet), undo/redo, view, save, publish menu
- Sidebar shows section tree of current template, drag handles, eye icons (visibility), block expansion

### O2. Iframe ↔ editor protocol (postMessage)
- Iframe loads storefront URL with `?_ab=0&_fd=0&preview_theme_id=DRAFT_ID&editor=1`
- Storefront renders with `data-section-id`, `data-section-type`, `data-block-id` attributes on every section/block root element
- Editor → iframe messages:
  - scrollToSection(id) — smooth scroll
  - highlightSection(id) — overlay outline
  - selectBlock(id)
  - applySettingChange(sectionId, settingId, value) — live update without reload
  - requestPageReload
- Iframe → editor messages:
  - sectionClicked(id) — user clicked on storefront, select in sidebar
  - blockClicked(id)
  - linkClicked(url) — intercept navigation, ask editor to switch template
  - formSubmitted — block in editor mode

### O3. Editing operations (state machine)
- Add section: open picker → preview presets → click preset → POST to draft → re-render
- Delete section: confirm → DELETE from draft JSON → reload affected region
- Duplicate section: clone JSON entry with new ID
- Hide section: set disabled: true in section settings, render skipped
- Reorder section: drag handle → mutate order[] array → reload
- Add block: section schema lists allowed block types → picker → POST → render
- Reorder blocks: drag inside section
- Edit setting: form input → debounced PATCH → live re-render via Section Rendering API (no full reload)
- Theme settings: same flow but settings_data.json is the target
- All edits are against the draft theme — published theme unchanged until "Publish"

### O4. Save / Publish / Versioning
- Working copy: in-memory + auto-save every 5s to draft theme
- Draft theme: separate from published, stored in same theme storage
- Publish: atomic swap (current_theme_id flag flip on shop record)
- Theme versions / history: snapshot before every publish, last 20 versions retained
- Rollback: pick old version → restore as draft → review → publish
- Conflict detection: if 2 admins editing simultaneously, last-write-wins with conflict warning + user attribution
- Undo / redo: per-session in-memory stack, depth 50

### O5. Theme management page (admin)
- Current theme card (with Customize, Edit code, Actions)
- Theme library (uploaded themes)
- Actions: Customize, Preview, Edit code, Rename, Duplicate, Download, Delete, Publish
- Upload theme = ZIP with the file structure above; validate against schema before accepting
- Download theme = ZIP of all theme files
- Edit code (advanced): Monaco-based file tree + editor with Liquid syntax + JSON schema validation + diff view

### O6. App Blocks (OS 2.0 superpower)
- Apps register block extensions via your app SDK
- Each app block declares: target_section_types, schema, liquid_template
- App blocks appear in section's "Add block" picker, mixed with theme blocks
- App block runtime: sandboxed Liquid scope, app-provided assets loaded
- This is what kills "you can't extend the theme without code" — must-have for ecosystem

---

## P. NAVIGATION & CONTENT (Shopify-equivalent)

### P1. Menus
- Multiple menus per shop, each has handle (main-menu, footer, custom names)
- Menu items hierarchical (parent_id), drag-reorder
- Link types: home, collection, collections (all), product, page, blog, article, search, policy, http, customer_login
- Auto-resolve handle changes (link by ID, render by handle)

### P2. Pages, Blogs, Articles
- Pages: title, handle, body_html, template_suffix, published, SEO
- Blogs: title, handle, commentable, feedburner, template_suffix
- Articles: title, handle, author, body_html, summary_html, tags, image, published_at, template_suffix
- Rich-text editor (TipTap / Quill) → sanitized HTML
- Image uploads → asset library

### P3. URL routing (must match Shopify exactly so themes port over)
- /products/{handle}
- /products/{handle}.js (AJAX product JSON)
- /products/{handle}.json (REST)
- /collections/{handle}
- /collections/{handle}/products/{product-handle} (nested for breadcrumbs)
- /collections/all
- /pages/{handle}
- /blogs/{blog-handle}, /blogs/{blog-handle}/{article-handle}
- /cart, /cart.js, /cart/add.js, /cart/change.js, /cart/update.js, /cart/clear.js
- /checkout (your own, not Shopify's)
- /search?q=..., /search/suggest.json?q=...
- /account, /account/login, /account/register, /account/orders, /account/orders/{id}, /account/addresses
- /policies/{privacy-policy|terms-of-service|refund-policy|shipping-policy|legal-notice}
- /sitemap.xml, /robots.txt
- 301 redirects table (per shop) — auto on handle change + manual entries

### P4. Filtering & sorting on collection pages (Shopify Storefront Filters)
- Filter by: option (color, size), variant_inventory, price range, vendor, product_type
- URL state: `?filter.v.option.color=red&filter.v.price.gte=500&sort_by=price-ascending`
- Server-side filtering, indexed
- Filter UI auto-rendered from collection's available filter values

---

## Q. METAFIELDS & METAOBJECTS (Shopify's secret weapon — must replicate)

### Q1. Metafields
- Definitions per shop with: namespace, key, name, description, type, owner_resource, validations, access (storefront/admin)
- Owner resources: product, variant, collection, customer, order, page, blog, article, shop, location
- Types (full Shopify list): single_line_text_field, multi_line_text_field, number_integer, number_decimal, date, date_time, url, json, boolean, color, weight, volume, dimension, rating, money, file_reference, page_reference, product_reference, variant_reference, collection_reference, metaobject_reference, plus list.* variants of each
- Validations: min/max, regex, choices, file size/type
- Storefront access: `{{ product.metafields.namespace.key }}`
- Admin UI: auto-rendered form per type

### Q2. Metaobjects
- Definitions: like a custom DB table — name, fields (each is a metafield-style type)
- Entries: instances (e.g. Author #1 = {name, photo, bio})
- Reference metaobjects from products, sections, etc.
- Storefront API exposes them
- This is what enables FAQ sections, Author bios, Recipe cards, Testimonials without merchants touching code

---

## R. STOREFRONT RENDERING PIPELINE (Shopify-equivalent)

### R1. Request flow
1. HTTP request → resolve Host header → identify shop
2. Match URL to template type via routing table
3. Load shop's published theme (CDN-cached)
4. Load matching template (e.g. templates/product.json)
5. Resolve sections referenced in template JSON
6. Render layout/theme.liquid → `{{ content_for_layout }}` injected with rendered template
7. Section group sections (`{% sections 'header' %}`, `{% sections 'footer' %}`) rendered from sections/header-group.json
8. Each section renders its Liquid with settings + blocks
9. Snippets included via `{% render %}`
10. Filters apply formatting
11. HTML response sent

### R2. Caching strategy
- Edge cache (Cloudflare): full HTML cache for guest users, 60s TTL, surrogate-key purging
- Page cache invalidation: on product/collection/page update → purge associated keys
- Section cache: Liquid render cache per (section_id, settings_hash, locale, currency)
- Asset cache: long-cache (1yr) with versioned URLs
- Image transformation pipeline (image_url filter): on-the-fly resize/crop/format/quality with CDN cache

### R3. Section Rendering API (critical for live preview + dynamic UI)
- GET `/?sections=header,cart-drawer,product-recommendations`
- Returns JSON: `{ "header": "<rendered HTML>", "cart-drawer": "..." }`
- Used for: live cart updates, theme editor live preview, predictive search, filter changes
- Same auth/cache rules as full page

### R4. AJAX Cart API (Shopify-compatible — themes port directly)
- GET `/cart.js` — current cart JSON
- POST `/cart/add.js` — {id, quantity, properties} → adds line item
- POST `/cart/change.js` — {line, quantity} → updates qty
- POST `/cart/update.js` — bulk update
- POST `/cart/clear.js`
- GET `/products/{handle}.js`
- GET `/search/suggest.json?q=&resources[type]=product,collection,page&resources[limit]=10`
- Cart token in cookie, persists 14 days

---

## S. THEME DEVELOPER EXPERIENCE (you'll need this for ecosystem)

### S1. Theme CLI (mirror Shopify CLI)
- `platform-cli theme init` — scaffold new theme
- `platform-cli theme dev` — local dev server, hot reload, syncs to dev store
- `platform-cli theme push` — upload to store
- `platform-cli theme pull`
- `platform-cli theme check` — Liquid + JSON schema lint
- `platform-cli theme package` — ZIP for marketplace
- `platform-cli theme info, list, delete, rename`

### S2. Theme inspector (in-admin debug tool)
- Render time per section
- Liquid template breakdown (which sections, time each took)
- N+1 query detection
- Asset size warnings
- Toggle on for current admin only (cookie-based)

### S3. In-admin code editor
- Monaco Editor with file tree
- Liquid syntax highlighting + autocomplete (variables, filters, tags)
- JSON schema validation for templates + sections
- Diff view (current vs published)
- Edit on draft, save, publish
- File search across theme

### S4. Theme store / marketplace (year 2)
- Public theme catalog
- Third-party theme submissions with review
- Demo stores per theme
- One-click install
- Pricing model (one-time, your platform takes 30%)

---

## T. CRITICAL ARCHITECTURE NOTES
- Liquid is the entire moat. Get this 100% Shopify-compatible and themes port directly. Lose this and you have to rebuild the theme ecosystem from zero.
- Section/block model is what makes OS 2.0 magic. Without it you're back to 2018 Shopify.
- Metaobjects + metafields are 50% of why merchants stay on Shopify. They built their data model in there. Don't skip.
- The Section Rendering API is what makes everything feel "live". Without it, every cart change = full reload = bad UX.
- Theme editor postMessage protocol must be solid. This is where 80% of editor bugs live. Build it as a state machine, not ad-hoc handlers.
- Multi-tenant isolation is non-negotiable. One missed `WHERE shop_id = ?` and you'll have a CVE.
- Don't reinvent Liquid. Use LiquidJS, fork it for Shopify-specific tags/filters. Building Liquid from scratch will eat 6 months.

### Recommended tech stack for solo/small team to ship this:
- **Backend:** Node.js + NestJS or Remix (full-stack)
- **DB:** PostgreSQL 16 (with row-level security policies for tenant isolation)
- **Cache + queue:** Redis + BullMQ
- **Object storage:** S3 / Cloudflare R2 (theme files, assets)
- **Liquid:** LiquidJS (forked, extended)
- **Theme editor:** React + Zustand + Monaco
- **Storefront:** server-side rendered Liquid (don't go SPA — SEO + perf)
- **Search:** Meilisearch or Typesense (faster + cheaper than Elastic for your scale)
- **CDN:** Cloudflare
- **Hosting:** AWS Mumbai (data residency for DPDP)
- **Image pipeline:** imgproxy or Cloudflare Images
