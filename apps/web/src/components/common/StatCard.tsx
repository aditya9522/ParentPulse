// apps/web/src/components/common/StatCard.tsx
import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  accentColor?: "emerald" | "sky" | "amber" | "rose" | "purple";
  badge?: string;
}

const colorMap = {
  emerald: {
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/5",
  },
  sky: {
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-400",
    border: "border-sky-500/20",
    glow: "shadow-sky-500/5",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    border: "border-amber-500/20",
    glow: "shadow-amber-500/5",
  },
  rose: {
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
    border: "border-rose-500/20",
    glow: "shadow-rose-500/5",
  },
  purple: {
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    border: "border-purple-500/20",
    glow: "shadow-purple-500/5",
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = "sky",
  badge,
}) => {
  const c = colorMap[accentColor];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${c.border} bg-slate-900/60 backdrop-blur-xl p-5 shadow-lg ${c.glow} transition-all hover:bg-slate-900/80 hover:border-slate-700`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          {title}
        </span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.iconBg} ${c.iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
          {value}
        </span>
        {badge && (
          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300">
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {trend.value} {trend.label && <span className="text-slate-400 font-normal">{trend.label}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
