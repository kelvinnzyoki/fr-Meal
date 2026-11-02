"use client";

import { useId, useState } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { ApiError } from "@/lib/apiClient";
import { friendlyError } from "@/lib/auth";

export type Status = { kind: "success" | "error"; text: string } | null;

// Prefer the first field-level validation message from the backend (zod) when
// there is one; otherwise fall back to the app-wide friendlyError().
export function errorText(err: unknown): string {
  if (err instanceof ApiError && err.errors?.length) return err.errors[0].message;
  return friendlyError(err);
}

// Collapsible section card. Closed by default so long pages (e.g. account
// settings) stay tidy; clicking the header toggles the content. Children stay
// mounted, so half-typed form values survive collapsing. Cards with no
// children render as a plain, non-interactive card.
export function Card({
  title,
  description,
  tone = "default",
  defaultOpen = false,
  collapsible = true,
  children,
}: {
  title: string;
  description?: string;
  tone?: "default" | "danger";
  defaultOpen?: boolean;
  collapsible?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const border = tone === "danger" ? "border-red-200" : "border-black/10";
  const heading = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-bold text-ink">{title}</span>
        {description && <span className="mt-1 block max-w-prose text-sm font-normal text-stone">{description}</span>}
      </span>
    </>
  );

  if (!children || !collapsible) {
    return (
      <section className={`bg-white rounded-card border p-5 sm:p-6 ${border}`}>
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
        {description && <p className="text-sm text-stone mt-1 max-w-prose">{description}</p>}
        {children && <div className="mt-4">{children}</div>}
      </section>
    );
  }

  return (
    <section className={`bg-white rounded-card border ${border}`}>
      <h2>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-3 rounded-card p-5 text-left transition-colors hover:bg-black/[0.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-marigold sm:p-6"
        >
          {heading}
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`h-5 w-5 flex-shrink-0 text-stone transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          >
            <path d="m5 7.5 5 5 5-5" />
          </svg>
        </button>
      </h2>
      {/* grid-rows 0fr -> 1fr animates height; `invisible` keeps hidden fields out of the tab order */}
      <div
        id={panelId}
        role="region"
        aria-label={title}
        className={`grid transition-[grid-template-rows,visibility] duration-300 ease-out ${
          open ? "grid-rows-[1fr] visible" : "grid-rows-[0fr] invisible"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink mb-1">{label}</span>
      <input
        {...props}
        className="w-full rounded-card border border-black/15 bg-white px-3 py-2.5 text-ink placeholder:text-stone focus:outline-none focus:ring-2 focus:ring-marigold disabled:bg-black/5 disabled:text-stone"
      />
      {hint && <span className="block text-xs text-stone mt-1">{hint}</span>}
    </label>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
};

export function Button({ variant = "primary", loading, children, disabled, className = "", ...rest }: ButtonProps) {
  const styles = {
    primary: "bg-marigold text-ink hover:bg-marigoldDark",
    secondary: "border border-black/15 text-ink hover:bg-black/5",
    danger: "bg-red-600 text-white hover:bg-red-700",
  }[variant];

  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-card px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-marigold disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

export function Notice({ status }: { status: Status }) {
  if (!status) return null;
  const tone =
    status.kind === "success"
      ? "bg-green-50 text-green-800 border-green-200"
      : "bg-red-50 text-red-700 border-red-200";
  return (
    <p
      role={status.kind === "error" ? "alert" : "status"}
      className={`text-sm rounded-card border px-3 py-2 ${tone}`}
    >
      {status.text}
    </p>
  );
}
