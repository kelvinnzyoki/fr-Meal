"use client";

import { useState, useId } from "react";

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <path d="M6.61 6.61A18.5 18.5 0 0 0 1 12s4 8 11 8a9.26 9.26 0 0 0 5.39-1.61" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3; // 0 = empty, 1 = weak, 2 = medium, 3 = strong
  label: string;
};

// Simple heuristic — no external dependency needed. Rewards length most
// (the single biggest factor in real-world crack resistance), then
// character variety on top.
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "" };

  let points = 0;
  if (password.length >= 8) points++;
  if (password.length >= 12) points++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points++;
  if (/\d/.test(password)) points++;
  if (/[^A-Za-z0-9]/.test(password)) points++;

  if (points <= 1) return { score: 1, label: "Weak" };
  if (points <= 3) return { score: 2, label: "Medium" };
  return { score: 3, label: "Strong" };
}

const STRENGTH_STYLES: Record<number, { bar: string; text: string }> = {
  0: { bar: "bg-ink/10", text: "text-stone" },
  1: { bar: "bg-chili", text: "text-chili" },
  2: { bar: "bg-marigold", text: "text-marigoldDark" },
  3: { bar: "bg-green-600", text: "text-green-700" },
};

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showStrength?: boolean;
  autoComplete?: string;
  required?: boolean;
}

export function PasswordField({
  value,
  onChange,
  placeholder = "Password",
  showStrength = false,
  autoComplete = "current-password",
  required,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const strength = showStrength ? getPasswordStrength(value) : null;
  const style = strength ? STRENGTH_STYLES[strength.score] : null;

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full border-2 border-ink/10 rounded-card px-4 py-3 pr-12 focus-ring"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-controls={id}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-ink transition-colors"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      {showStrength && strength && strength.score > 0 && (
        <div className="mt-2">
          <div className="flex gap-1">
            {[1, 2, 3].map((segment) => (
              <div
                key={segment}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  segment <= strength.score ? style!.bar : "bg-ink/10"
                }`}
              />
            ))}
          </div>
          <p className={`text-xs mt-1 font-semibold ${style!.text}`}>{strength.label} password</p>
        </div>
      )}
    </div>
  );
}
