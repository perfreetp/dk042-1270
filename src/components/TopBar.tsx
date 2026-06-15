import { Bell, Settings, X } from 'lucide-react';
import { useFilterStore } from '@/store/useFilterStore';

interface TopBarProps {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

export default function TopBar({ title, subtitle, rightContent }: TopBarProps) {
  const { searchKeyword, setSearchKeyword } = useFilterStore();

  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      
      <div className="flex items-center gap-3">
        {rightContent}
        
        <div className="relative">
          {searchKeyword ? (
            <X
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer z-10"
              onClick={() => setSearchKeyword('')}
            />
          ) : null}
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="全局搜索资源名称..."
            className={cn(
              'w-64 h-9 pl-9 pr-9 bg-slate-800/80 border rounded-lg text-sm transition-all focus:outline-none',
              searchKeyword
                ? 'border-cyan-500/50 text-cyan-300 ring-1 ring-cyan-500/30'
                : 'border-slate-700/50 text-slate-200 placeholder-slate-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30'
            )}
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={searchKeyword ? 'M6 18L18 6M6 6l12 12' : 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'}
              className={searchKeyword ? 'text-slate-500' : 'text-slate-500'}
            />
          </svg>
        </div>
        
        {searchKeyword && (
          <div className="px-2 py-1 bg-cyan-500/15 border border-cyan-500/30 rounded-md">
            <span className="text-xs text-cyan-400 font-medium">
              已筛选
            </span>
          </div>
        )}
        
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

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
