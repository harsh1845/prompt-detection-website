"use client";

import { useEffect, useState } from "react";

const links = [
  { href: "#features", label: "Features" },
  { href: "#docs", label: "Docs" },
  { href: "#pricing", label: "Pricing" },
  { href: "#security", label: "Security" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-hairline bg-base/90 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a
          href="#"
          className="font-display text-[17px] font-semibold tracking-tighter text-ink"
        >
          PromptGuard
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="font-body text-[14px] font-medium text-mute transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contact"
          className="rounded-sm bg-signal px-3.5 py-2 font-body text-[13px] font-semibold text-base transition-opacity hover:opacity-90"
        >
          Get a Demo
        </a>
      </nav>
    </header>
  );
}
