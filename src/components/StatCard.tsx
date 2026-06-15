import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: React.ReactNode;
  color?: 'cyan' | 'emerald' | 'amber' | 'rose';
  className?: string;
}

const colorClasses: Record<string, string> = {
  cyan: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 text-cyan-400',
  emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
  amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-400',
  rose: 'from-rose-500/10 to-rose-600/5 border-rose-500/20 text-rose-400',
};

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon, 
  color = 'cyan',
  className 
}: StatCardProps) {
  const isPositive = (trend ?? 0) >= 0;

  return (
    <div
      className={cn(
        'relative bg-gradient-to-br border rounded-xl p-5 card-hover overflow-hidden',
        colorClasses[color],
        className
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl bg-current" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm text-slate-400 font-medium">{title}</span>
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-slate-800/80 flex items-center justify-center border border-slate-700/50">
              {icon}
            </div>
          )}
        </div>
        
        <div className="text-2xl font-bold text-white mb-1">
          {value}
        </div>
        
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <span className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium',
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            )}>
              {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(trend)}%
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-slate-500">{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
}
