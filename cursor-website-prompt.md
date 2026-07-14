

---

You are building a marketing website for an enterprise prompt-injection / LLM security detection product. The single biggest positioning point is **speed at enterprise scale** — this thing catches attacks in milliseconds without adding latency to production LLM traffic. The whole site is dark mode, no light mode toggle needed.

### Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS for styling
- Framer Motion for all animation (marquee, floating nodes, scroll reveals)
- Fonts loaded via Fontshare CDN (see below) — do not substitute Google Fonts defaults



### Non-negotiable design direction — read before writing any code

This needs to look like it was designed by a senior product designer, not generated. Specifically avoid every one of these "AI template" tells:

- **No purple/violet gradients or glow blobs.** This is the single most common AI-generated-site tell. Do not use `indigo-500`, `purple-600`, `violet`, or any blurred gradient orb in the hero background.
- **No default Tailwind Inter-everywhere look.** Use the two fonts specified below, nothing else.
- **No excessive rounded-3xl / rounded-full on every card.** Mix sharper corners (4–8px radius) for a more technical, security-product feel. Reserve fully rounded shapes for the lock icon module only.
- **No generic glassmorphism** (frosted blur cards on every section). Use it, if at all, in exactly one place.
- **No stock "shadow-2xl + gradient border" card pattern repeated everywhere.** Vary the treatment: some sections should be flat with 1px hairline borders, terminal/monospace-inflected, not soft and glowy.
- Overall reference feel: a hybrid of a security operations dashboard (Darktrace-style — dense, confident, data-forward) and a fast, no-nonsense infra/dev-tool site (think latency numbers, throughput stats, monospace accents) — **not** a generic AI-wrapper SaaS landing page.



### Color palette

- Background: near-black, not pure black — `#0A0A0C` base, `#111114` for elevated surfaces, `#17171B` for cards
- Text: off-white `#F2F2F0` for headlines, `#A0A0A8` for body/secondary
- Borders: 1px hairline, `#26262B`, low-opacity white on hover
- Accent (pick this ONE color and use it sparingly, never as a full-bleed gradient): a signal/terminal green — `#3DDC84` or a slightly desaturated `#2ED573` — used for "detected/blocked" states, live stats, and the primary CTA button only
- Secondary alert accent (used only inside the dashboard mock and threat-node section): a warm amber/red — `#F5A623` / `#FF5D5D` — for "critical" or "jailbreak attempt" indicators, so the dashboard reads like a real monitoring tool
- No purple anywhere in the palette.



### Typography

- Primary/display font: **Ranade** (Fontshare) — use for the hero headline, section headlines, and the nav logo. Load the variable weight via:
`<link href="https://api.fontshare.com/v2/css?f[]=ranade@400,500,600,700&display=swap" rel="stylesheet">`
- Secondary/body font: **Switzer** (Fontshare) — pairs naturally with Ranade (same foundry, matching x-height and geometric structure), use for body copy, nav links, buttons, and UI text:
`<link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600&display=swap" rel="stylesheet">`
- For stats, latency numbers, and dashboard data, use a monospace font (e.g. `JetBrains Mono` or `IBM Plex Mono`) to reinforce the technical/precision feel — this is the one deliberate contrast font in the system.
- Headlines: tight tracking (`-0.02em` to `-0.03em`), large scale (64–96px desktop hero), font-weight 600–700.

---



### Section 1 — Nav + Hero

Layout mirrors a clean SaaS nav: logo left, links center/right, CTA button far right (dark surface site, so invert the reference screenshot's light styling — dark bg, off-white text, green CTA button instead of black).

- Nav links: Features, Docs, Pricing, Security (or similar)
- Small pill badge above headline, e.g. "🟢 Sub-5ms detection at 10k+ req/s" — use the accent green, not a generic gradient badge
- Headline (Ranade, large): something like **"Stop prompt injection before it ever reaches your model"** or **"Enterprise-grade prompt injection detection. Zero added latency."** — keep it two lines, emphasize speed + enterprise in the same breath
- Subheadline (Switzer, muted gray): one to two sentences on real-time detection, jailbreak prevention, and scaling to enterprise traffic without slowing inference
- Two CTAs: primary solid green button ("Start Free Trial" / "Get a Demo"), secondary ghost/outline button ("View Docs" or "Watch Demo")
- Background: subtle, restrained — a faint grid or scanline texture at ~4% opacity, maybe a single soft radial vignette in the accent green at very low opacity behind the headline. No blurred color blobs.



### Cursor-reactive dot grid (Antigravity-style interaction, hero only)

Google's Antigravity landing page has a well-known interactive effect: a field of small elements that shift/scatter away from the cursor as if pushed by a physical force, then ease back into place once the cursor moves on. Recreate a restrained, professional version of that effect — **only** in the area directly behind/around the big Ranade headline, not the full page. It should read as a deliberate, subtle signature detail, not a gimmick.

- Render a grid of small dots (2px circles, ~24–32px spacing) confined to the hero headline area only — bounded to that container, not full-viewport
- Each dot has a fixed "home" position. On every animation frame, measure the distance from the cursor to each dot. Dots inside a radius (~120–160px) get displaced away from the cursor along the cursor→dot vector, with displacement strength falling off smoothly with distance (linear or inverse-square falloff — no hard cutoff/snapping)
- When the cursor moves away, dots should ease/spring back to their home position (lerp toward home position each frame, not an instant reset) — this is what makes it feel physical rather than mechanical
- **Implementation**: use a single `<canvas>` element with `requestAnimationFrame`, not one DOM node per dot — a few hundred dots on individual elements will jank. Track mouse position with a `mousemove` listener scoped to the hero container (get position relative to the canvas, not the whole page)
- Avoid CSS Houdini PaintWorklet for the core effect — it's Chrome-only; canvas keeps this working in every browser
- Dot color at rest: very low-opacity white/gray (`rgba(255,255,255,0.15)` to `0.25`); dots currently displaced/near the cursor can brighten slightly toward the accent green as a subtle "energized" cue — this ties the effect back into the product's palette instead of just copying Antigravity's look wholesale
- Z-index: dot canvas sits *behind* the headline text; text must stay fully crisp and legible on top at all times
- On touch devices, just render the static, undisplaced dot grid — no fake interaction, no scroll-position hack standing in for a cursor
- Component: `components/CursorDotGrid.tsx`, mounted only inside `Hero.tsx`, absolutely positioned behind the headline



### Section 2 — Horizontal scrolling marquee

Directly below the hero, a full-width infinite horizontal scroll strip.

- Content: placeholder text chips representing things being scanned/flagged in real time — e.g. `"ignore previous instructions..." → BLOCKED`, `"you are now DAN" → BLOCKED`, `"disregard your system prompt" → BLOCKED`, `SQL injection pattern → BLOCKED`, `role-play jailbreak attempt → BLOCKED`. Style each as a small monospace pill/card with a hairline border and a small green "blocked" or checkmark tag.
- Animation: seamless infinite loop (duplicate the list and translateX -100%, linear timing, ~30–40s duration), pause on hover, fade-mask the edges of the container so items appear/disappear smoothly rather than clipping hard.
- Keep this visually quiet — small type, muted background — it's a supporting detail, not a second hero.



### Section 3 — Features / "Get in touch" section with dashboard mock

Two-column layout, directly inspired by the reference: left column is a 2x2 (or stacked) feature list, right column is a live-looking product dashboard mockup.

- Left column, four feature blocks each with a small icon, bold Ranade micro-headline, and one line of Switzer body copy. Example set (swap in real product language):
  - **Detect in milliseconds** — inline, streaming-compatible detection that adds no perceptible latency to your LLM calls
  - **Scale with your traffic** — built to handle enterprise volume, from thousands to millions of requests per day
  - **Catch what regex misses** — semantic detection of jailbreaks, role-play attacks, and obfuscated injection attempts
  - **See everything, act fast** — a single pane of glass for every flagged prompt across every model and environment
  - Below the four blocks, a CTA button: "Talk to our team" / "Get in touch"
- Right column: a dashboard mockup card (dark surface, hairline border) showing:
  - A live-feeling stat row: `Requests scanned`, `Avg. detection latency (ms)`, `Injection attempts blocked`, `Active models monitored` — use the monospace font for the numbers, green for "safe" counters, amber/red for "blocked/critical" counters
  - A small chart or funnel (bar/line, muted colors, one green one amber) suggesting attack attempts over time or by category (prompt injection, jailbreak, data exfiltration, encoding attack)
  - A world-map or network glow accent behind/beside it at low opacity is fine here (this is the one section where a bit of atmospheric glow makes sense, echoing the reference screenshot) — keep it in green/amber tones, not purple



### Section 4 — Central lock hub with connected threat types

Recreate the "hub and spoke" reference layout, adapted to dark mode and to security content instead of design-system content.

- Center: a rounded-square dark badge with a lock icon in the middle (this is the one place fully-rounded corners belong)
- Surrounding it: 6–8 floating cards, each a hairline-bordered dark chip connected to the center by a thin line, labeling a threat category the product prevents:
  - Prompt Injection
  - Jailbreaking
  - Role-Play Exploits
  - Data Exfiltration
  - Encoding/Obfuscation Attacks
  - System Prompt Leakage
  - Indirect Injection (via RAG/tool output)
  - Denial-of-Service Prompts
- Connecting lines: thin (1px), low-opacity, optionally with a slow subtle pulse/traveling dot animation along the line to suggest active monitoring
- Animation: each card should float independently — small vertical bounce (translateY ±6–10px) on its own slow loop, using Framer Motion with a **different randomized duration (roughly 4–7s) and delay per card** so they never move in sync. Easing should be `easeInOut`, not linear, so it reads as a gentle drift rather than mechanical bouncing.
- Keep the card styling consistent with the rest of the site: dark surface, hairline border, small icon + label, no drop shadows — a subtle glow ring in the accent green on hover is enough interactivity.



### Section 5 — Footer

Simple dark footer: logo, a short one-line tagline, link columns (Product, Docs, Company, Security/Trust), and a final CTA row. Keep it minimal — no gradient, no extra flourish.

---



### Component/file structure suggestion

```
/app
  page.tsx
/components
  Nav.tsx
  Hero.tsx
  CursorDotGrid.tsx   // canvas dot grid, mounted inside Hero only
  ScrollingMarquee.tsx
  FeaturesDashboard.tsx
  ThreatHub.tsx
  Footer.tsx
/lib
  motion-variants.ts   // shared framer-motion configs (float, marquee, fade-in)
```



### Final checklist before you consider this done

- [ ] Zero purple/violet anywhere
- [ ] Ranade used for all headline-level text, Switzer for body/UI, monospace only for stats/data
- [ ] Dark background is off-black (#0A0A0C), not pure #000
- [ ] Marquee scrolls seamlessly and pauses on hover
- [ ] Dashboard mock reads as a real product screenshot, not a generic stat card grid
- [ ] Floating threat nodes bounce independently and slowly, not in sync
- [ ] Cursor dot grid is confined to the hero (not full-page), rendered on canvas (not per-dot DOM elements), and eases back to rest rather than snapping
- [ ] Every "AI template tell" in the checklist above has been deliberately avoided

---

