"use client";

import { motion } from "framer-motion";
import CursorDotGrid from "./CursorDotGrid";
import { fadeUp } from "@/lib/motion-variants";

export default function Hero() {
  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden py-28 md:min-h-[94vh] md:py-32">
      {/* Full-bleed circular dot field — Antigravity scale */}
      <CursorDotGrid />

      {/* Soft center vignette so copy stays crisp over the field */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[480px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(10,10,12,0.65) 0%, rgba(10,10,12,0.25) 42%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mb-6 flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-sm border border-hairline bg-elevated/80 px-3 py-1.5 font-mono text-[12px] text-signal backdrop-blur-[2px]">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
            Sub-5ms detection at 10k+ req/s
          </span>
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="max-w-4xl text-center font-display text-[42px] font-semibold leading-[1.05] tracking-tightest text-ink sm:text-[56px] md:text-[72px] lg:text-[84px]"
        >
          Stop prompt injection
          <br />
          before it reaches your model
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={{
            ...fadeUp,
            visible: {
              ...fadeUp.visible,
              transition: { ...fadeUp.visible.transition, delay: 0.12 },
            },
          }}
          className="mt-6 max-w-2xl text-center font-body text-[16px] leading-relaxed text-mute md:text-[18px]"
        >
          Real-time jailbreak and injection detection that scales with enterprise
          traffic — without adding perceptible latency to inference.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            ...fadeUp,
            visible: {
              ...fadeUp.visible,
              transition: { ...fadeUp.visible.transition, delay: 0.2 },
            },
          }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href="#test-lab"
            className="rounded-sm bg-signal px-5 py-2.5 font-body text-[14px] font-semibold text-base transition-opacity hover:opacity-90"
          >
            Test the Detector
          </a>
          <a
            href="#docs"
            className="rounded-sm border border-hairline bg-transparent px-5 py-2.5 font-body text-[14px] font-medium text-ink transition-colors hover:border-white/25"
          >
            View Docs
          </a>
        </motion.div>
      </div>
    </section>
  );
}
