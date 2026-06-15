import { cn } from '@/lib/utils';
import { getStatusName } from '@/utils/format';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusColors: Record<string, string> = {
  running: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  stopped: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  suspended: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  idle: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  in_progress: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  error: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const statusDots: Record<string, string> = {
  running: 'bg-emerald-400',
  active: 'bg-emerald-400',
  completed: 'bg-emerald-400',
  stopped: 'bg-slate-400',
  suspended: 'bg-slate-400',
  idle: 'bg-amber-400',
  pending: 'bg-amber-400',
  in_progress: 'bg-cyan-400',
  error: 'bg-rose-400',
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colorClass = statusColors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  const dotClass = statusDots[status] || 'bg-slate-400';
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        colorClass
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', status === 'running' || status === 'active' ? 'animate-pulse' : '', dotClass)} />
      {getStatusName(status)}
    </span>
  );
}
