"use client";

import { useFormStatus } from "react-dom";
import { ghostButtonClass, primaryButtonClass } from "./ui";

export default function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  className = "",
  name,
  value,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "ghost";
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  const base = variant === "ghost" ? ghostButtonClass : primaryButtonClass;

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={`${base} ${className}`}
    >
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}
