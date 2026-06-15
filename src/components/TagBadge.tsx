import { cn } from '@/lib/utils';

interface TagBadgeProps {
  label: string;
  value: string;
  variant?: 'default' | 'cyan' | 'emerald' | 'amber' | 'rose';
  size?: 'sm' | 'md';
}

const variantStyles: Record<string, string> = {
  default: 'bg-slate-700/50 text-slate-300 border-slate-600/50',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

export default function TagBadge({ label, value, variant = 'default', size = 'sm' }: TagBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center border rounded',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
        variantStyles[variant]
      )}
    >
      <span className="opacity-70 mr-1">{label}:</span>
      <span className="font-medium">{value}</span>
    </span>
  );
}
