"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion-variants";

const features = [
  {
    title: "Detect in milliseconds",
    body: "Inline, streaming-compatible detection that adds no perceptible latency to your LLM calls.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <path
          d="M3 9.5L7 13.5L15 4.5"
          stroke="#FFC78A"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
      </svg>
    ),
  },
  {
    title: "Scale with your traffic",
    body: "Built for enterprise volume — thousands to millions of requests per day without slowing inference.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <path
          d="M3 14V9M7 14V5M11 14V7M15 14V3"
          stroke="#FFC78A"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
      </svg>
    ),
  },
  {
    title: "Catch what regex misses",
    body: "Semantic detection of jailbreaks, role-play attacks, and obfuscated injection attempts.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="5" stroke="#FFC78A" strokeWidth="1.5" />
        <path d="M12 12L15.5 15.5" stroke="#FFC78A" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: "See everything, act fast",
    body: "A single pane of glass for every flagged prompt across every model and environment.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <rect x="2.5" y="3.5" width="13" height="11" stroke="#FFC78A" strokeWidth="1.5" />
        <path d="M2.5 7H15.5" stroke="#FFC78A" strokeWidth="1.5" />
      </svg>
    ),
  },
];

const stats = [
  { label: "Requests scanned", value: "2.4M", tone: "safe" as const },
  { label: "Avg. detection latency", value: "3.2ms", tone: "safe" as const },
  { label: "Injection attempts blocked", value: "18,402", tone: "crit" as const },
  { label: "Active models monitored", value: "47", tone: "safe" as const },
];

const bars = [
  { label: "Prompt injection", value: 82, color: "#FF5D5D" },
  { label: "Jailbreak", value: 64, color: "#F5A623" },
  { label: "Data exfiltration", value: 41, color: "#F5A623" },
  { label: "Encoding attack", value: 28, color: "#FFC78A" },
];

export default function FeaturesDashboard() {
  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl items-start gap-14 px-6 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
        >
          <motion.p
            variants={fadeUp}
            className="font-mono text-[12px] uppercase tracking-widest text-signal"
          >
            Capabilities
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="mt-3 font-display text-[36px] font-semibold leading-tight tracking-tighter text-ink md:text-[44px]"
          >
            Detection built for
            <br />
            production traffic
          </motion.h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="border-t border-hairline pt-4"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-sm border border-hairline bg-card">
                  {f.icon}
                </div>
                <h3 className="font-display text-[16px] font-semibold tracking-tighter text-ink">
                  {f.title}
                </h3>
                <p className="mt-1.5 font-body text-[14px] leading-relaxed text-mute">
                  {f.body}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.a
            variants={fadeUp}
            href="#contact"
            className="mt-10 inline-flex rounded-sm bg-signal px-5 py-2.5 font-body text-[14px] font-semibold text-base transition-opacity hover:opacity-90"
          >
            Talk to our team
          </motion.a>
        </motion.div>

        {/* Dashboard mock */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="relative"
        >
          <div
            className="pointer-events-none absolute -inset-8 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse at 70% 40%, rgba(255, 199, 138,0.12) 0%, transparent 55%), radial-gradient(ellipse at 30% 80%, rgba(245,166,35,0.08) 0%, transparent 50%)",
            }}
          />

          <div className="relative overflow-hidden rounded-md border border-hairline bg-card shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-signal" />
                <span className="font-mono text-[11px] text-mute">
                  live · us-east-1
                </span>
              </div>
              <span className="font-mono text-[11px] text-mute">
                PromptGuard Console
              </span>
            </div>

            <div className="grid grid-cols-2 gap-px border-b border-hairline bg-hairline sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-card px-3 py-3.5">
                  <p className="font-body text-[11px] text-mute">{s.label}</p>
                  <p
                    className={`mt-1 font-mono text-[18px] font-medium tracking-tight ${
                      s.tone === "crit" ? "text-crit" : "text-signal"
                    }`}
                  >
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-display text-[14px] font-semibold tracking-tighter text-ink">
                  Attempts by category
                </p>
                <p className="font-mono text-[11px] text-mute">last 24h</p>
              </div>

              <div className="space-y-3">
                {bars.map((b) => (
                  <div key={b.label}>
                    <div className="mb-1 flex justify-between">
                      <span className="font-mono text-[11px] text-mute">
                        {b.label}
                      </span>
                      <span className="font-mono text-[11px] text-ink">
                        {b.value}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-[2px] bg-elevated">
                      <div
                        className="h-full rounded-[2px]"
                        style={{
                          width: `${b.value}%`,
                          backgroundColor: b.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 overflow-hidden rounded-sm border border-hairline">
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b border-hairline bg-elevated px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-mute">
                  <span>Event</span>
                  <span>Latency</span>
                  <span>Status</span>
                </div>
                {[
                  {
                    e: "role-play jailbreak · gpt-4o",
                    lat: "2.8ms",
                    st: "BLOCKED",
                    crit: true,
                  },
                  {
                    e: "system prompt leak · claude-3",
                    lat: "3.1ms",
                    st: "BLOCKED",
                    crit: true,
                  },
                  {
                    e: "clean request · llama-3.1",
                    lat: "2.4ms",
                    st: "PASS",
                    crit: false,
                  },
                  {
                    e: "obfuscated inject · gemini",
                    lat: "4.0ms",
                    st: "BLOCKED",
                    crit: true,
                  },
                ].map((row) => (
                  <div
                    key={row.e}
                    className="grid grid-cols-[1fr_auto_auto] gap-x-3 border-b border-hairline px-3 py-2 last:border-0"
                  >
                    <span className="truncate font-mono text-[11px] text-mute">
                      {row.e}
                    </span>
                    <span className="font-mono text-[11px] text-ink">
                      {row.lat}
                    </span>
                    <span
                      className={`font-mono text-[11px] ${
                        row.crit ? "text-crit" : "text-signal"
                      }`}
                    >
                      {row.st}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
