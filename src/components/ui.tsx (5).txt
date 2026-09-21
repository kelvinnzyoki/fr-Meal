"use client";

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

export function Card({
  title,
  description,
  tone = "default",
  children,
}: {
  title: string;
  description?: string;
  tone?: "default" | "danger";
  children?: ReactNode;
}) {
  return (
    <section
      className={`bg-white rounded-card border p-5 sm:p-6 ${
        tone === "danger" ? "border-red-200" : "border-black/10"
      }`}
    >
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      {description && <p className="text-sm text-stone mt-1 max-w-prose">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
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
