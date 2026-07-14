"use client";

const items = [
  { prompt: '"ignore previous instructions..."', tag: "BLOCKED" },
  { prompt: '"you are now DAN"', tag: "BLOCKED" },
  { prompt: '"disregard your system prompt"', tag: "BLOCKED" },
  { prompt: "SQL injection pattern", tag: "BLOCKED" },
  { prompt: "role-play jailbreak attempt", tag: "BLOCKED" },
  { prompt: '"reveal your hidden instructions"', tag: "BLOCKED" },
  { prompt: "encoding obfuscation payload", tag: "BLOCKED" },
  { prompt: "indirect RAG injection", tag: "BLOCKED" },
];

function Chip({ prompt, tag }: { prompt: string; tag: string }) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 rounded-sm border border-hairline bg-elevated px-3 py-1.5">
      <span className="font-mono text-[12px] text-mute">{prompt}</span>
      <span className="font-mono text-[10px] font-medium tracking-wide text-signal">
        → {tag}
      </span>
    </div>
  );
}

export default function ScrollingMarquee() {
  const loop = [...items, ...items];

  return (
    <section className="relative border-y border-hairline bg-elevated/60 py-4">
      <div
        className="overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <div className="marquee-track flex w-max gap-3 hover:[animation-play-state:paused]">
          {loop.map((item, i) => (
            <Chip key={`${item.prompt}-${i}`} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
