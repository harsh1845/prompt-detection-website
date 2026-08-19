"use client";

import { primaryButtonClass } from "@/components/dashboard/ui";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={primaryButtonClass}
    >
      Print / save PDF
    </button>
  );
}
