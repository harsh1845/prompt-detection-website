"use client";

import { useState } from "react";

export default function CopyBlock({
  value,
  label,
  multiline = false,
}: {
  value: string;
  label?: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-sm border border-hairline bg-base">
      <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-mute">
          {label ?? "Snippet"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="font-mono text-[11px] text-signal transition-opacity hover:opacity-80"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre
        className={`overflow-x-auto px-3 py-3 font-mono text-[12px] leading-6 text-ink ${
          multiline ? "whitespace-pre" : "whitespace-pre-wrap break-all"
        }`}
      >
        {value}
      </pre>
    </div>
  );
}
