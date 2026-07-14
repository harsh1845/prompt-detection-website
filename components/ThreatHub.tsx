"use client";

import { motion } from "framer-motion";
import { fadeUp, floatVariant } from "@/lib/motion-variants";

type Threat = {
  label: string;
  x: number;
  y: number;
  duration: number;
  delay: number;
};

/** Percent positions within the hub container (0–100) */
const threats: Threat[] = [
  { label: "Prompt Injection", x: 6, y: 10, duration: 5.2, delay: 0.1 },
  { label: "Jailbreaking", x: 70, y: 6, duration: 6.1, delay: 0.4 },
  { label: "Role-Play Exploits", x: 0, y: 44, duration: 4.6, delay: 0.8 },
  { label: "Data Exfiltration", x: 74, y: 40, duration: 5.8, delay: 0.2 },
  { label: "Encoding Attacks", x: 8, y: 76, duration: 6.5, delay: 1.1 },
  { label: "System Prompt Leakage", x: 66, y: 74, duration: 4.9, delay: 0.6 },
  { label: "Indirect Injection", x: 36, y: 2, duration: 5.5, delay: 0.3 },
  { label: "DoS Prompts", x: 38, y: 86, duration: 6.8, delay: 0.9 },
];

function ThreatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M7 1.5L12 4V7.5C12 10.2 9.8 12.2 7 12.8C4.2 12.2 2 10.2 2 7.5V4L7 1.5Z"
        stroke="#F5A623"
        strokeWidth="1.2"
      />
      <path
        d="M7 5V7.5"
        stroke="#F5A623"
        strokeWidth="1.2"
        strokeLinecap="square"
      />
      <circle cx="7" cy="9.2" r="0.7" fill="#F5A623" />
    </svg>
  );
}

export default function ThreatHub() {
  return (
    <section id="security" className="relative overflow-hidden py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="font-mono text-[12px] uppercase tracking-widest text-signal"
        >
          Threat coverage
        </motion.p>
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mx-auto mt-3 max-w-2xl font-display text-[36px] font-semibold leading-tight tracking-tighter text-ink md:text-[44px]"
        >
          One control plane for every attack surface
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mx-auto mt-4 max-w-xl font-body text-[15px] text-mute"
        >
          Continuous monitoring across the threat categories that matter in
          production LLM systems — blocked before they reach the model.
        </motion.p>
      </div>

      <div className="relative mx-auto mt-16 h-[480px] w-full max-w-4xl px-4 sm:h-[540px] md:px-6">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFC78A" stopOpacity="0.08" />
              <stop offset="50%" stopColor="#FFC78A" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FFC78A" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          {threats.map((t) => {
            const tx = t.x + 8;
            const ty = t.y + 3;
            return (
              <g key={t.label}>
                <line
                  x1="50"
                  y1="50"
                  x2={tx}
                  y2={ty}
                  stroke="url(#lineGrad)"
                  strokeWidth="0.35"
                  vectorEffect="non-scaling-stroke"
                />
                <circle r="0.6" fill="#FFC78A" opacity="0.85">
                  <animateMotion
                    dur={`${t.duration}s`}
                    repeatCount="indefinite"
                    begin={`${t.delay}s`}
                    path={`M50,50 L${tx},${ty}`}
                  />
                </circle>
              </g>
            );
          })}
        </svg>

        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-hairline bg-elevated shadow-[0_0_40px_rgba(255, 199, 138,0.12)] md:h-28 md:w-28">
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              aria-hidden
            >
              <rect
                x="8"
                y="15"
                width="20"
                height="15"
                rx="3"
                stroke="#FFC78A"
                strokeWidth="1.8"
              />
              <path
                d="M12 15V12C12 8.686 14.686 6 18 6C21.314 6 24 8.686 24 12V15"
                stroke="#FFC78A"
                strokeWidth="1.8"
              />
              <circle cx="18" cy="22.5" r="2" fill="#FFC78A" />
            </svg>
          </div>
        </div>

        {threats.map((t) => (
          <motion.div
            key={t.label}
            className="absolute z-20"
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
            animate={floatVariant(t.duration, t.delay)}
          >
            <div className="group flex items-center gap-2 rounded-sm border border-hairline bg-card px-3 py-2 transition-shadow hover:shadow-[0_0_0_1px_rgba(255, 199, 138,0.45),0_0_20px_rgba(255, 199, 138,0.15)]">
              <ThreatIcon />
              <span className="whitespace-nowrap font-body text-[12px] font-medium text-ink md:text-[13px]">
                {t.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
