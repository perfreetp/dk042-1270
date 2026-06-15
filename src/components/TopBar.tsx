import { Search, Bell, Settings, Download, Filter } from 'lucide-react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

export default function TopBar({ title, subtitle, rightContent }: TopBarProps) {
  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      
      <div className="flex items-center gap-3">
        {rightContent}
        
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="搜索资源..."
            className="w-56 h-9 pl-9 pr-4 bg-slate-800/80 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
        </div>
        
        <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
          <Bell size={18} />
        </button>
        
        <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
