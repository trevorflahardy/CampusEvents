/**
 * StatCard displays a single KPI metric with a label, value, and icon.
 * Used in the dashboard stats grid to show totals like event count and attendees.
 *
 * @module dashboard/StatCard
 */

import type { ReactNode } from "react";

/** Props for the {@link StatCard} component. */
export interface StatCardProps {
  /** Uppercase label shown above the value (e.g. "Total Events") */
  label: string;
  /** Numeric or string value displayed prominently */
  value: number | string;
  /** Icon element rendered inside a branded circle */
  icon: ReactNode;
}

/**
 * Renders a glassmorphism stat card with label, large value, and icon.
 * @param props - {@link StatCardProps}
 */
export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="glass rounded-3xl p-6 flex justify-between items-center animate-fade-in">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          {label}
        </p>
        <p className="text-4xl font-bold text-slate-900">{value}</p>
      </div>
      <div className="w-12 h-12 rounded-2xl bg-brand-glow flex items-center justify-center text-[#1a4f3b]">
        {icon}
      </div>
    </div>
  );
}
