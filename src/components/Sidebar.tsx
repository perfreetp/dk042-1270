import { NavLink } from 'react-router-dom';
import { 
  Network, 
  List, 
  DollarSign, 
  Tags, 
  History,
  Cloud,
  Settings,
  Bell,
  Search,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '资源地图', icon: Network },
  { path: '/inventory', label: '资源清单', icon: List },
  { path: '/cost', label: '成本视图', icon: DollarSign },
  { path: '/governance', label: '标签治理', icon: Tags },
  { path: '/changes', label: '变更记录', icon: History },
  { path: '/dashboard', label: '治理看板', icon: LayoutDashboard },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-slate-900/80 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-glow-cyan">
            <Cloud size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">云资源地图</h1>
            <p className="text-[11px] text-slate-500">Cloud Resource Map</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="text-[11px] uppercase text-slate-500 font-semibold px-3 mb-2 tracking-wider">
          导航
        </div>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={18} className={cn('transition-colors')} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow-cyan" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-xs font-bold text-slate-900">
            管
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">云管理员</p>
            <p className="text-[11px] text-slate-500 truncate">admin@company.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
