const productLinks = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#contact", label: "Get a Demo" },
];

const docsLinks = [
  { href: "#docs", label: "Documentation" },
  { href: "#docs", label: "API Reference" },
  { href: "#docs", label: "SDKs" },
];

const companyLinks = [
  { href: "#", label: "About" },
  { href: "#", label: "Careers" },
  { href: "#contact", label: "Contact" },
];

const trustLinks = [
  { href: "#security", label: "Security" },
  { href: "#", label: "SOC 2" },
  { href: "#", label: "Privacy" },
];

function LinkCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="font-display text-[13px] font-semibold tracking-tighter text-ink">
        {title}
      </p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="font-body text-[13px] text-mute transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer id="docs" className="border-t border-hairline bg-elevated">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <a
              href="#"
              className="font-display text-[17px] font-semibold tracking-tighter text-ink"
            >
              PromptGuard
            </a>
            <p className="mt-3 font-body text-[14px] leading-relaxed text-mute">
              Enterprise prompt injection detection. Sub-5ms. Zero added latency.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <LinkCol title="Product" links={productLinks} />
            <LinkCol title="Docs" links={docsLinks} />
            <LinkCol title="Company" links={companyLinks} />
            <LinkCol title="Trust" links={trustLinks} />
          </div>
        </div>

        <div
          id="pricing"
          className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-hairline pt-8 sm:flex-row sm:items-center"
        >
          <p className="font-body text-[14px] text-mute">
            Ready to secure your LLM traffic?
          </p>
          <a
            href="#contact"
            className="rounded-sm bg-signal px-5 py-2.5 font-body text-[14px] font-semibold text-base transition-opacity hover:opacity-90"
          >
            Start Free Trial
          </a>
        </div>

        <p className="mt-8 font-mono text-[11px] text-mute/70">
          © {new Date().getFullYear()} PromptGuard. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
