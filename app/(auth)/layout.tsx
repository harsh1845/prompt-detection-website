import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-base">
      <header className="border-b border-hairline">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="font-display text-[17px] font-semibold tracking-tighter text-ink"
          >
            PromptGuard
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-widest text-mute">
            Console
          </span>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  );
}
