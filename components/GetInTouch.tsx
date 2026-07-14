"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Step = "email" | "needs" | "success";

const stepIndex: Record<Step, number> = {
  email: 0,
  needs: 1,
  success: 2,
};

const totalFormSteps = 2;

const benefits = [
  "Sub-5ms detection with zero added inference latency",
  "Built for enterprise traffic — thousands to millions of req/day",
  "Catch jailbreaks and injections regex will miss",
  "Single pane of glass across every model and environment",
  "Talk to security engineers who ship this in production",
];

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="mt-0.5 shrink-0"
      aria-hidden
    >
      <path
        d="M2.5 8.5L6 12L13.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
    </svg>
  );
}

export default function GetInTouch() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [needs, setNeeds] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const progress =
    step === "success" ? 1 : (stepIndex[step] + 1) / (totalFormSteps + 1);

  const goNeeds = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid business email.");
      return;
    }
    setEmail(trimmed);
    setStep("needs");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (needs.trim().length < 10) {
      setError("Tell us a bit more about what you need (at least a sentence).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, needs: needs.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setStep("success");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative scroll-mt-0 border-t border-hairline"
    >
      <div id="demo" className="pointer-events-none absolute" aria-hidden />

      <div className="grid min-h-[640px] lg:grid-cols-2">
        {/* Left — value prop */}
        <div className="relative flex flex-col justify-between bg-[#F2F2F0] px-8 py-14 text-[#0A0A0C] md:px-12 lg:px-16 lg:py-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 0% 0%, rgba(255, 199, 138,0.18) 0%, transparent 58%)",
            }}
          />

          <div className="relative max-w-lg">
            <h2 className="font-display text-[34px] font-semibold leading-[1.12] tracking-tightest md:text-[42px] lg:text-[46px]">
              See what PromptGuard catches in your traffic
            </h2>
            <p className="mt-5 font-display text-[18px] font-medium leading-snug tracking-tighter text-[#0A0A0C]/90 md:text-[20px]">
              We&apos;ll follow up to book a personalized 1:1 demo for your stack.
            </p>

            <ul className="mt-10 space-y-4">
              {benefits.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 font-body text-[15px] leading-snug text-[#0A0A0C]/85"
                >
                  <span className="text-[#0A0A0C]">
                    <CheckIcon />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mt-14 border-t border-[#0A0A0C]/12 pt-6">
            <p className="font-mono text-[11px] text-[#0A0A0C]/45">
              Enterprise prompt injection detection · Sub-5ms · Zero added latency
            </p>
          </div>
        </div>

        {/* Right — form panel */}
        <div className="relative flex flex-col justify-between bg-base px-8 py-14 md:px-12 lg:px-16 lg:py-20">
          <div className="mx-auto w-full max-w-md">
            <div className="border-t border-ink/25 pt-5">
              <p className="font-body text-[15px] font-medium text-ink">
                Get a demo
              </p>
            </div>

            <div className="relative mt-10 min-h-[320px]">
              <AnimatePresence mode="wait">
                {step === "email" && (
                  <motion.form
                    key="email"
                    onSubmit={goNeeds}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <label
                      htmlFor="biz-email"
                      className="font-body text-[13px] text-ink"
                    >
                      Business Email
                      <span className="text-signal">*</span>
                    </label>
                    <input
                      id="biz-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="mt-2 w-full rounded-sm border-0 bg-ink px-3.5 py-3 font-body text-[15px] text-base outline-none placeholder:text-base/40 focus:ring-2 focus:ring-signal/60"
                    />

                    <div className="mt-5 h-[3px] w-full overflow-hidden rounded-[1px] bg-hairline">
                      <motion.div
                        className="h-full bg-signal"
                        initial={false}
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ duration: 0.35 }}
                      />
                    </div>

                    {error && (
                      <p className="mt-3 font-body text-[13px] text-crit">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="mt-6 rounded-sm bg-signal px-8 py-2.5 font-body text-[14px] font-semibold text-base transition-opacity hover:opacity-90"
                    >
                      Next
                    </button>
                  </motion.form>
                )}

                {step === "needs" && (
                  <motion.form
                    key="needs"
                    onSubmit={submit}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <label
                      htmlFor="needs"
                      className="font-body text-[13px] text-ink"
                    >
                      What do you need?
                      <span className="text-signal">*</span>
                    </label>
                    <textarea
                      id="needs"
                      required
                      rows={5}
                      value={needs}
                      onChange={(e) => setNeeds(e.target.value)}
                      placeholder="We’re evaluating prompt injection detection for our production LLM gateway…"
                      className="mt-2 w-full resize-none rounded-sm border-0 bg-ink px-3.5 py-3 font-body text-[15px] leading-relaxed text-base outline-none placeholder:text-base/40 focus:ring-2 focus:ring-signal/60"
                    />

                    <div className="mt-5 h-[3px] w-full overflow-hidden rounded-[1px] bg-hairline">
                      <motion.div
                        className="h-full bg-signal"
                        initial={false}
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ duration: 0.35 }}
                      />
                    </div>

                    {error && (
                      <p className="mt-3 font-body text-[13px] text-crit">
                        {error}
                      </p>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setError("");
                          setStep("email");
                        }}
                        className="rounded-sm border border-hairline px-5 py-2.5 font-body text-[14px] font-medium text-ink transition-colors hover:border-white/25"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-sm bg-signal px-8 py-2.5 font-body text-[14px] font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-60"
                      >
                        {submitting ? "Sending…" : "Send"}
                      </button>
                    </div>
                  </motion.form>
                )}

                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-start pt-2"
                  >
                    <div className="h-[3px] w-full overflow-hidden rounded-[1px] bg-hairline">
                      <motion.div
                        className="h-full bg-signal"
                        initial={{ width: "66%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>

                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 18,
                        delay: 0.08,
                      }}
                      className="relative mt-10 flex h-16 w-16 items-center justify-center rounded-full border border-signal/40 bg-signal/10"
                    >
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 28 28"
                        fill="none"
                        aria-hidden
                      >
                        <motion.path
                          d="M6 14.5L11.5 20L22 8"
                          stroke="#FFC78A"
                          strokeWidth="2.2"
                          strokeLinecap="square"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{
                            duration: 0.55,
                            delay: 0.2,
                            ease: "easeOut",
                          }}
                        />
                      </svg>
                      <motion.span
                        className="pointer-events-none absolute inset-0 rounded-full border border-signal/30"
                        initial={{ scale: 1, opacity: 0.6 }}
                        animate={{ scale: 1.55, opacity: 0 }}
                        transition={{
                          duration: 0.9,
                          delay: 0.15,
                          ease: "easeOut",
                        }}
                      />
                    </motion.div>

                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35, duration: 0.4 }}
                      className="mt-6 font-display text-[24px] font-semibold tracking-tighter text-ink"
                    >
                      Message sent
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.48, duration: 0.4 }}
                      className="mt-2 max-w-sm font-body text-[15px] leading-relaxed text-mute"
                    >
                      Thanks — we&apos;ve received your note and will be in touch
                      shortly.
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <p className="mx-auto mt-12 w-full max-w-md font-mono text-[11px] text-mute/60">
            We only use your email to follow up on this request.
          </p>
        </div>
      </div>
    </section>
  );
}
