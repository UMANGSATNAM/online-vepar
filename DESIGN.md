# Design System: Online Vepar (OmniBuilder)
**Project ID:** 001_ONLINE_VEPAR_GLOBAL

## 1. Visual Theme & Atmosphere
**Atmosphere:** "Weightless, Architectural, and Hyper-Premium"
The UI embodies an international, enterprise-grade SaaS aesthetic inspired by platforms like Linear, Stripe, and Vercel. It prioritizes extreme clarity, spatial depth through soft diffused shadows, and subtle glassmorphism. The interface feels "alive" with micro-interactions, yet remains absolutely minimal and uncluttered. It uses an "Antigravity" approach where primary surfaces appear to gently float above a soft, slightly off-white foundation.

## 2. Color Palette & Roles
* **Foundation Background** (`#FAFAFA` / `zinc-50`): The absolute base of the application. Not pure white, giving a softer feel.
* **Surface White** (`#FFFFFF` / `bg-white`): Used for elevated cards, floating headers, and the sidebar to create subtle contrast against the foundation.
* **Absolute Blue** (`#0052FF` / `blue-600`): The primary action color. Highly vibrant, used sparingly for primary buttons, active states, and critical highlights.
* **Liquid Slate** (`#0F172A` / `slate-900`): Primary text color. Almost black, but softer for readability.
* **Muted Ash** (`#64748B` / `slate-500`): Secondary text, disabled states, and inactive icons.
* **Success Emerald** (`#10B981` / `emerald-500`): Used strictly for positive semantic states (Completed, Paid, Active).

## 3. Typography Rules
* **Family:** Inter / System UI (`font-sans`).
* **Headers:** Extremely crisp, often with `tracking-tight` (-0.025em letter spacing). Font weight `600` or `700`.
* **Body:** Clean, legible, font weight `400` or `500`. Sizes lean towards `text-sm` (14px) for dense data.

## 4. Component Stylings
* **Cards/Containers:** 
  - **Shape:** Gently curved edges (`rounded-xl` or `rounded-2xl`).
  - **Surface:** Pure white background with an ultra-thin, barely-there border (`border border-slate-200/60`).
  - **Elevation:** Whisper-soft diffused shadows (`shadow-[0_8px_30px_rgb(0,0,0,0.04)]`). Cards hover upwards slightly (`hover:-translate-y-0.5 transition-all`).
* **Buttons (Primary):**
  - **Shape:** Pill-shaped or softly rounded (`rounded-lg`).
  - **Color:** Absolute Blue background, white text.
  - **Behavior:** Subtle hover scale (`hover:scale-[1.02] active:scale-[0.98] transition-transform`).
* **Navbars/Headers (Glassmorphism):**
  - **Surface:** Semi-transparent white (`bg-white/70`).
  - **Effect:** Heavy background blur (`backdrop-blur-xl`).

## 5. Layout Principles & Antigravity Motion
* **Spacing:** Generous whitespace. Padding is mathematically consistent (`p-6` or `p-8` for major sections).
* **Sidebar Layout:** The sidebar does not feel boxed in. It uses a very light right border and a soft background.
* **Entrance Animations:** Content staggers in smoothly from the Y-axis. Lists fade and slide up sequentially (e.g., `animate-in fade-in slide-in-from-bottom-4 duration-500`).
