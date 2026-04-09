"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
  secondary:
    "border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800",
  ghost:
    "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({
  variant = "primary",
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
