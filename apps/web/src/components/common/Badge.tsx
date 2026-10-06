// apps/web/src/components/common/Badge.tsx
import React from "react";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "purple" | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string; border: string }> = {
  success: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    border: "border-emerald-500/20",
  },
  warning: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-400",
    border: "border-amber-500/20",
  },
  danger: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    dot: "bg-rose-400",
    border: "border-rose-500/20",
  },
  info: {
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    dot: "bg-sky-400",
    border: "border-sky-500/20",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    dot: "bg-purple-400",
    border: "border-purple-500/20",
  },
  neutral: {
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    dot: "bg-slate-400",
    border: "border-slate-500/20",
  },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "md",
  className = "",
  dot = false,
}) => {
  const styles = variantStyles[variant];
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />}
      {children}
    </span>
  );
};
