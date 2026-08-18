# Website Features

Public marketing and conversion site for PromptGuard.

Treat the current site as a **static shell**: a homepage, some copy, and a fake console screenshot. This document lists every feature the website needs so a small-to-medium company can understand the product, try it, trust it, and sign up. None of this is the signed-in product. Live customer traffic, API keys, and operations belong in `docs/dashboard-features.md`.

**Website job:** believe → try → convert.
**Dashboard job:** run the product on their traffic.

---

## 1. What the website is for

A visitor should be able to:

1. Understand what PromptGuard is in 10 seconds (AI + software security for SMBs).
2. Try detection on a prompt without creating an account.
3. See the full product suite (gateway, red teaming, DLP, shadow AI, compliance, access visibility).
4. Compare plans and start self-serve or book a demo.
5. Read enough docs and trust material to put an API key in a real app.
6. Sign up / log in into the dashboard.

If a feature requires an org, an API key, or their production data, it is **not** a website feature.

---

## 2. Information architecture

```
/                       Home
/product                Suite overview
/product/gateway        Prompt injection gateway
/product/red-teaming    Continuous AI red teaming
/product/dlp            Prompt + output DLP
/product/shadow-ai      Shadow AI discovery
/product/compliance     OWASP / NIST reports
/product/access         AI access visibility (read-only)
/test                   Public detector test lab
/pricing
/docs                   Docs index
/docs/quickstart
/docs/api
/docs/sdks
/docs/self-host
/trust                  Security, privacy, subprocessors
/privacy
/terms
/login                  Redirect into dashboard
/signup                 Redirect into dashboard
/contact                Demo / sales form
```

Optional later: `/blog`, `/changelog`, `/about`. Do not block launch on these.

---

## 3. Features to add

### 3.1 Home

Static homepage is not enough. Home must convert.

**Add**

- Clear positioning: AI-security for teams too small for an enterprise security org. Lead with measured prompt-injection detection, not generic “enterprise scale.”
- Primary CTA: **Test the detector**. Secondary: **View pricing** or **Get API key**.
- Proof strip: real eval numbers (recall, precision, latency from held-out tests), not invented traffic stats.
- Short suite map: six product modules with links to `/product/*`.
- Console **preview** (static mock only) that matches the real Phase 1 dashboard: allow/block, tier, confidence, latency — not fake “2.4M requests / 47 models.”
- Threat coverage (injection, jailbreak, prompt leak, obfuscation, indirect injection, DLP, etc.) as explanation, not as a live SOC.
- Final CTA: start free vs book a demo.

**Do not add on home**

- Live customer event feeds.
- Org switcher, API key manager, billing portal.

---

### 3.2 Public detector test lab (`/test`)

This is the wedge. It is the one interactive feature the website should have.

**Add**

- Prompt input (paste a user prompt, system message, or document excerpt).
- One-click example cases: obvious jailbreak, narrative wrapper, benign admin language.
- Result panel: allow/block, risk, confidence, which cascade tier fired, heuristic flags, latency, short explanation.
- Honest labeling: “Public demo uses the lightweight detector. Production uses the full cascade.”
- Post-scan CTAs:
  - If blocked → **Get an API key** / **See the dashboard**.
  - If allowed on a known-attack example → **Production model catches more of these**.
- Rate limit + max input length (already required for abuse).
- Disclaimer: do not paste secrets or real customer data.

**Do not add**

- Saving scans to an account (that is dashboard).
- Pointing the public lab at paying customers’ apps.
- Logging demo prompts into a tenant event store.

---

### 3.3 Product pages

The static site currently implies “we detect prompt injection.” The suite needs a page per module so SMB buyers can self-educate.

#### Suite overview (`/product`)

- One page that names every module, who it is for (developer vs IT vs compliance), and which plan includes it.
- Architecture diagram: website demo vs production gateway vs dashboard.

#### Gateway (`/product/gateway`)

- Inline proxy vs `POST /detect` vs SDK.
- Cascade explained in plain language (cheap rules → SVM → small model).
- Self-host / Docker option (important for SMBs who will not send prompts to a third party).
- Copy-paste `curl` example.
- Link to docs quickstart.

#### Red teaming (`/product/red-teaming`)

- What it is: scheduled attacks against *their* chatbot/endpoint.
- What they get: pass/fail over time, regressions when they change models.
- A **static sample report** (HTML or PDF) from an internal eval run.
- CTA: included on Team+, or “run a sample scan on a demo bot” — not a live scan of their production URL from the public site.

#### DLP (`/product/dlp`)

- Input: stop employees/apps pasting secrets, API keys, customer PII into prompts.
- Output: stop the model leaking secrets, PII, or the system prompt.
- Example detections (synthetic). No file-upload of real datasets on the marketing site.

#### Shadow AI (`/product/shadow-ai`)

- IT-buyer page: which SaaS AI tools people are using, and data-exposure risk.
- Different CTA: **Book an IT demo** (this buyer is not the person playing with `/test`).

#### Compliance (`/product/compliance`)

- Explain OWASP LLM Top 10 and NIST AI RMF mapping.
- Show a **sample** report PDF.
- Make it obvious the real generated report (with their evidence) lives in the dashboard.

#### Access visibility (`/product/access`)

- Short page: read-only view of who has LLM provider access, stale admins, MFA gaps.
- Explicitly **not** “we replace Okta / Google Workspace IAM.”

---

### 3.4 Pricing (`/pricing`)

Footer “Start Free Trial” and nav “Pricing” need a real page.

**Add**

| Plan | Website should say | Typical include |
|---|---|---|
| Free / Dev | Self-serve | Public test lab + rate-limited API key |
| Team | Self-serve | Production gateway, dashboard events, weekly red-team |
| Business | Sales-assist | DLP, shadow AI, compliance PDF, self-host |
| Enterprise | Talk to us | VPC, custom model, dedicated red-team |

Also add:

- Monthly LLM-call / request based language so SMBs can map cost.
- FAQ: data retention, self-host vs SaaS, what the public demo does not include.
- CTAs: **Start free** (signup) and **Get a demo** (contact form).

---

### 3.5 Docs

A static site without docs will not get an API key into production.

**Add**

- Docs index (`/docs`).
- Quickstart: create key (link to dashboard) → send one detect call → see it in the console.
- API reference: `POST /detect` request/response, status codes, rate limits.
- SDKs: at least `curl`, JavaScript/TypeScript, Python.
- Gateway vs library vs reverse-proxy integration patterns.
- Self-host: Docker Compose, env vars, what data leaves the box.
- Demo vs production detector (lightweight vs full cascade).
- Troubleshooting: 429, 413, false positives (point to dashboard FP feedback).

Keep docs public. Authenticated “your key / your apps” snippets belong in the dashboard onboarding.

---

### 3.6 Trust and legal

Security buyers bounce if Trust links are missing or fake.

**Add**

- `/trust`: how prompts are handled, retention defaults, encryption, subprocessors, self-host option.
- `/privacy` and `/terms`.
- DPA mention + “contact for DPA” for Business.
- SOC 2: only claim it when true. Until then omit or say “in progress.”
- No invented uptime or request-volume badges.

---

### 3.7 Signup, login, and contact

**Add**

- `/signup` and `/login`: website pages that hand off to the dashboard auth (Clerk/WorkOS/etc.). No org admin UI on the marketing site.
- `/contact` (or keep a Get-a-demo section): business email, company size, whether they already have a production LLM app, SaaS vs self-host preference, rough monthly call volume, free-text needs.
- Route Free/Team to self-serve signup; route Business/Enterprise to demo.

---

### 3.8 Navigation and global chrome

**Add** (even on a previously static page)

- Nav: Product, Test lab, Docs, Pricing, Trust, Login, primary CTA.
- Footer: Product module links, Docs, Company, Legal.
- Every link must go to a real page. No placeholder hashes.

---

## 4. Website vs dashboard (do not mix)

| On the website | Not on the website |
|---|---|
| Public test lab | Tenant event history |
| Sample red-team report | Scheduled scans of customer endpoints |
| Sample compliance PDF | Generated report with their evidence |
| Pricing and plan comparison | Stripe portal, invoices, usage meters |
| Docs and `curl` examples | Live API keys (show-once in dashboard) |
| Trust / privacy copy | Prompt retention toggles for an org |
| Signup / login links | Roles, SSO config, Slack alert destinations |
| Shadow-AI explainer | Employee inventory from the browser extension |
| Access-visibility explainer | Okta/Entra sync findings |

---

## 5. Suggested ship order for the website

1. **Conversion core:** home copy + real pricing + test lab + signup/login links + contact form.
2. **Trust core:** docs quickstart + API reference + privacy/trust pages (required before anyone uses an API key).
3. **Suite pages:** gateway, then red teaming (with sample report), then DLP.
4. **IT/compliance pages:** shadow AI, compliance, access visibility — after the developer funnel works.
5. **Later:** blog, changelog, about, careers.

---

## 6. Success criteria

The website is done enough to launch when a stranger can:

- Run a prompt in the test lab and understand the result.
- Pick a plan.
- Follow docs to a detect call.
- Open signup into the dashboard.
- Read how you handle their prompts.

Everything beyond that is extra marketing, not extra product.
