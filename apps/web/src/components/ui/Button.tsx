import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "completed";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60",
  secondary:
    "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60",
  danger:
    "border-transparent bg-red-600 text-white hover:bg-red-700 disabled:opacity-60",
  completed:
    "border-emerald-600 bg-white text-emerald-700 hover:bg-emerald-50 disabled:border-emerald-600 disabled:bg-white disabled:text-emerald-700 disabled:opacity-100 disabled:cursor-default",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold shadow-sm transition-colors disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        className,
      ].join(" ")}
      {...props}
    />
  );
}