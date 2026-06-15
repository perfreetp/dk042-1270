import { useState, useMemo } from 'react';
import { 
  LayoutDashboard, Tags, AlertTriangle, Shield, Clock,
  User, Building2, ChevronDown, ChevronRight, ExternalLink,
  XCircle, AlertCircle, ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResourceStore } from '@/store/useResourceStore';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, getResourceTypeName } from '@/utils/format';
import StatCard from '@/components/StatCard';

type ViewMode = 'department' | 'owner';
type DrillType = 'tag_missing' | 'idle' | 'risk' | 'task' | null;

export default function DashboardPage() {
  const { resources, tasks, setSelectedResource, toggleDetailPanel } = useResourceStore();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('department');
  const [drillType, setDrillType] = useState<DrillType>(null);
  const [drillKey, setDrillKey] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const tagKeys = ['Owner', 'Usage', 'Department', 'Environment'];

  const totalTagMissing = resources.filter(r => tagKeys.some(k => !r.tags.some(t => t.key === k && t.value.trim()))).length;
  const totalIdle = resources.filter(r => r.isIdle).length;
  const totalRisk = resources.filter(r => r.isRisk).length;
  const totalPendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;

  const summaryData = useMemo(() => {
    if (viewMode === 'department') {
      const map = new Map<string, { name: string; resources: typeof resources; owner: string }>();
      resources.forEach(r => {
        const dept = r.tags.find(t => t.key === 'Department')?.value || '未分配部门';
        if (!map.has(dept)) {
          map.set(dept, { name: dept, resources: [], owner: '' });
        }
        map.get(dept)!.resources.push(r);
      });
      map.forEach((val) => {
        const owners = val.resources.map(r => r.tags.find(t => t.key === 'Owner')?.value).filter(Boolean);
        val.owner = Array.from(new Set(owners)).slice(0, 3).join('、') || '未指定';
      });
      return Array.from(map.values()).sort((a, b) => b.resources.length - a.resources.length);
    } else {
      const map = new Map<string, { name: string; resources: typeof resources; department: string }>();
      resources.forEach(r => {
        const owner = r.tags.find(t => t.key === 'Owner')?.value || '未指定负责人';
        if (!map.has(owner)) {
          map.set(owner, { name: owner, resources: [], department: '' });
        }
        map.get(owner)!.resources.push(r);
      });
      map.forEach((val) => {
        const depts = val.resources.map(r => r.tags.find(t => t.key === 'Department')?.value).filter(Boolean);
        val.department = Array.from(new Set(depts)).slice(0, 2).join('、') || '未分配';
      });
      return Array.from(map.values()).sort((a, b) => b.resources.length - a.resources.length);
    }
  }, [resources, viewMode]);

  const getItemStats = (resList: typeof resources) => {
    const tagMissing = resList.filter(r => tagKeys.some(k => !r.tags.some(t => t.key === k && t.value.trim()))).length;
    const idle = resList.filter(r => r.isIdle).length;
    const risk = resList.filter(r => r.isRisk).length;
    const relatedTasks = tasks.filter(t => 
      (t.status === 'pending' || t.status === 'in_progress') && 
      t.resourceIds.some(rid => resList.some(r => r.id === rid))
    ).length;
    return { tagMissing, idle, risk, pendingTasks: relatedTasks, total: resList.length };
  };

  const drillResources = useMemo(() => {
    if (!drillType || !drillKey) return [];
    const item = summaryData.find(s => s.name === drillKey);
    if (!item) return [];
    const resList = item.resources;

    switch (drillType) {
      case 'tag_missing':
        return resList.filter(r => tagKeys.some(k => !r.tags.some(t => t.key === k && t.value.trim())));
      case 'idle':
        return resList.filter(r => r.isIdle);
      case 'risk':
        return resList.filter(r => r.isRisk);
      case 'task': {
        const taskResourceIds = tasks
          .filter(t => (t.status === 'pending' || t.status === 'in_progress') && t.resourceIds.some(rid => resList.some(r => r.id === rid)))
          .flatMap(t => t.resourceIds);
        return resList.filter(r => taskResourceIds.includes(r.id));
      }
      default:
        return [];
    }
  }, [drillType, drillKey, summaryData, tasks]);

  const handleDrill = (type: DrillType, key: string) => {
    setDrillType(type);
    setDrillKey(key);
  };

  const handleOpenResource = (resourceId: string) => {
    setSelectedResource(resourceId);
    toggleDetailPanel(true);
  };

  const toggleExpand = (key: string) => {
    setExpandedRows(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="标签缺失资源"
          value={totalTagMissing}
          subtitle={`${resources.length} 个资源中`}
          icon={<Tags size={20} className="text-amber-400" />}
          color="amber"
        />
        <StatCard
          title="闲置资源"
          value={totalIdle}
          subtitle={`月浪费 ${formatCurrency(resources.filter(r => r.isIdle).reduce((s, r) => s + r.monthlyCost, 0))}`}
          icon={<AlertCircle size={20} className="text-orange-400" />}
          color="rose"
        />
        <StatCard
          title="高风险资源"
          value={totalRisk}
          subtitle="需及时处理"
          icon={<Shield size={20} className="text-rose-400" />}
          color="rose"
        />
        <StatCard
          title="待处理任务"
          value={totalPendingTasks}
          subtitle="需跟进完成"
          icon={<Clock size={20} className="text-cyan-400" />}
          color="cyan"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-xl">
          <button
            onClick={() => { setViewMode('department'); setDrillType(null); }}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              viewMode === 'department' ? 'bg-slate-900 text-cyan-400 shadow-inner' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Building2 size={16} />
            按部门
          </button>
          <button
            onClick={() => { setViewMode('owner'); setDrillType(null); }}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              viewMode === 'owner' ? 'bg-slate-900 text-cyan-400 shadow-inner' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <User size={16} />
            按负责人
          </button>
        </div>

        <button
          onClick={() => navigate('/changes')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg border border-slate-700 transition-colors"
        >
          <ClipboardList size={16} />
          前往任务中心
          <ExternalLink size={14} />
        </button>
      </div>

      {drillType && drillKey && (
        <div className="bg-slate-900/60 border border-cyan-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">{drillKey}</span>
              <span className="text-xs text-slate-400">-</span>
              <span className="text-xs text-cyan-400">
                {drillType === 'tag_missing' ? '标签缺失资源' : drillType === 'idle' ? '闲置资源' : drillType === 'risk' ? '高风险资源' : '待处理任务关联资源'}
              </span>
              <span className="text-xs text-slate-500">({drillResources.length} 个)</span>
            </div>
            <button onClick={() => { setDrillType(null); setDrillKey(''); }} className="text-xs text-slate-400 hover:text-slate-200">收起</button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-1.5">
            {drillResources.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">暂无资源</div>
            ) : (
              drillResources.map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 cursor-pointer transition-colors"
                  onClick={() => handleOpenResource(r.id)}
                >
                  <div className="flex items-center gap-2">
                    {r.isRisk && <span className="w-2 h-2 rounded-full bg-rose-400" />}
                    {r.isIdle && !r.isRisk && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                    <span className="text-sm text-white">{r.name}</span>
                    <span className="text-[11px] text-slate-500">{getResourceTypeName(r.type)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {drillType === 'tag_missing' && (
                      <div className="flex gap-1">
                        {tagKeys.filter(k => !r.tags.some(t => t.key === k && t.value.trim())).map(k => (
                          <span key={k} className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">{k}</span>
                        ))}
                      </div>
                    )}
                    <span className="text-xs text-emerald-400">{formatCurrency(r.monthlyCost)}</span>
                    <span className="text-[11px] text-cyan-400">补标签 →</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {summaryData.map((item) => {
          const stats = getItemStats(item.resources);
          const isExpanded = expandedRows.includes(item.name);
          const hasIssues = stats.tagMissing + stats.idle + stats.risk + stats.pendingTasks > 0;

          return (
            <div key={item.name} className={cn(
              'bg-slate-900/60 border rounded-xl overflow-hidden transition-all',
              hasIssues ? 'border-slate-700' : 'border-slate-800/50 opacity-75'
            )}>
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => toggleExpand(item.name)}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center border border-slate-700/50">
                  {viewMode === 'department' ? <Building2 size={18} className="text-cyan-400" /> : <User size={18} className="text-violet-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-semibold text-white">{item.name}</h4>
                    <span className="text-xs text-slate-500">{stats.total} 个资源</span>
                    {viewMode === 'department' && (
                      <span className="text-xs text-slate-500">负责人：{item.owner}</span>
                    )}
                    {viewMode === 'owner' && (
                      <span className="text-xs text-slate-500">部门：{(item as any).department}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDrill('tag_missing', item.name); }}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                        stats.tagMissing > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20' : 'bg-slate-800/40 text-slate-500 border-slate-700/50'
                      )}
                    >
                      <XCircle size={12} />
                      标签缺失 {stats.tagMissing}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDrill('idle', item.name); }}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                        stats.idle > 0 ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20' : 'bg-slate-800/40 text-slate-500 border-slate-700/50'
                      )}
                    >
                      <AlertTriangle size={12} />
                      闲置 {stats.idle}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDrill('risk', item.name); }}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                        stats.risk > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20' : 'bg-slate-800/40 text-slate-500 border-slate-700/50'
                      )}
                    >
                      <Shield size={12} />
                      风险 {stats.risk}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDrill('task', item.name); }}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                        stats.pendingTasks > 0 ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20' : 'bg-slate-800/40 text-slate-500 border-slate-700/50'
                      )}
                    >
                      <Clock size={12} />
                      待处理 {stats.pendingTasks}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm font-medium text-emerald-400">{formatCurrency(item.resources.reduce((s, r) => s + r.monthlyCost, 0))}</div>
                    <div className="text-[11px] text-slate-500">/ 月</div>
                  </div>
                  {isExpanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-800/50 pt-3 max-h-48 overflow-y-auto space-y-1.5">
                  {item.resources.slice(0, 15).map(r => {
                    const missingKeys = tagKeys.filter(k => !r.tags.some(t => t.key === k && t.value.trim()));
                    return (
                      <div
                        key={r.id}
                        className="flex items-center justify-between px-3 py-1.5 rounded-md bg-slate-800/30 hover:bg-slate-800/50 cursor-pointer transition-colors"
                        onClick={() => handleOpenResource(r.id)}
                      >
                        <div className="flex items-center gap-2">
                          {r.isRisk && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
                          {r.isIdle && !r.isRisk && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                          <span className="text-xs text-slate-300">{r.name}</span>
                          <span className="text-[10px] text-slate-500">{getResourceTypeName(r.type)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {missingKeys.length > 0 && (
                            <div className="flex gap-0.5">
                              {missingKeys.map(k => (
                                <span key={k} className="text-[9px] px-1 py-0.5 bg-amber-500/10 text-amber-400/70 rounded">{k[0]}</span>
                              ))}
                            </div>
                          )}
                          <span className="text-[11px] text-slate-500">{formatCurrency(r.monthlyCost)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {item.resources.length > 15 && (
                    <div className="text-center text-[11px] text-slate-500 pt-1">
                      {'+ '}{item.resources.length - 15}{' 个更多'}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {summaryData.length === 0 && (
          <div className="py-16 text-center bg-slate-900/60 border border-slate-800 rounded-xl">
            <LayoutDashboard size={40} className="mx-auto text-slate-700 mb-3" />
            <p className="text-sm text-slate-500">暂无数据</p>
          </div>
        )}
      </div>
    </div>
  );
}
