import { useState, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  DollarSign, TrendingUp, TrendingDown, 
  BarChart3, PieChart as PieIcon, Calendar,
  Server, Database, HardDrive, Zap, Network
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { costRecords, costByType, cloudAccounts, regions, applications } from '@/data/mockData';
import { useResourceStore } from '@/store/useResourceStore';
import { useFilterStore } from '@/store/useFilterStore';
import { formatCurrency } from '@/utils/format';
import StatCard from '@/components/StatCard';

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#64748b'];

type ViewMode = 'account' | 'region' | 'app' | 'type';

export default function CostViewPage() {
  const { resources } = useResourceStore();
  const { accountIds, regionIds, appIds, resourceTypes, searchKeyword } = useFilterStore();
  const [viewMode, setViewMode] = useState<ViewMode>('type');
  const [period, setPeriod] = useState<'6m' | '12m'>('12m');

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      if (accountIds.length > 0 && !accountIds.includes(r.accountId)) return false;
      if (regionIds.length > 0 && !regionIds.includes(r.regionId)) return false;
      if (appIds.length > 0 && !appIds.includes(r.appId)) return false;
      if (resourceTypes.length > 0 && !resourceTypes.includes(r.type)) return false;
      if (searchKeyword && !r.name.toLowerCase().includes(searchKeyword.toLowerCase())) return false;
      return true;
    });
  }, [resources, accountIds, regionIds, appIds, resourceTypes, searchKeyword]);

  const totalMonthlyCost = useMemo(() => {
    return filteredResources.reduce((sum, r) => sum + r.monthlyCost, 0);
  }, [filteredResources]);

  const totalResources = filteredResources.length;
  
  const idleCost = useMemo(() => {
    return filteredResources.filter(r => r.isIdle).reduce((sum, r) => sum + r.monthlyCost, 0);
  }, [filteredResources]);

  const idleCostPercent = totalMonthlyCost > 0 ? Math.round((idleCost / totalMonthlyCost) * 100) : 0;
  const avgResourceCost = totalResources > 0 ? Math.round(totalMonthlyCost / totalResources) : 0;

  const trendData = period === '12m' ? costRecords : costRecords.slice(-6);
  
  const lastMonthCost = costRecords[costRecords.length - 1]?.amount || 0;
  const prevMonthCost = costRecords[costRecords.length - 2]?.amount || 0;
  const monthlyGrowth = prevMonthCost > 0 ? ((lastMonthCost - prevMonthCost) / prevMonthCost * 100).toFixed(1) : '0';

  const costByAccount = useMemo(() => {
    const map = new Map<string, number>();
    filteredResources.forEach(r => {
      map.set(r.accountId, (map.get(r.accountId) || 0) + r.monthlyCost);
    });
    return Array.from(map.entries()).map(([id, amount]) => ({
      name: cloudAccounts.find(a => a.id === id)?.name || id,
      amount,
      percentage: totalMonthlyCost > 0 ? Math.round((amount / totalMonthlyCost) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredResources, totalMonthlyCost]);

  const costByRegion = useMemo(() => {
    const map = new Map<string, number>();
    filteredResources.forEach(r => {
      map.set(r.regionId, (map.get(r.regionId) || 0) + r.monthlyCost);
    });
    return Array.from(map.entries()).map(([id, amount]) => ({
      name: regions.find(r => r.id === id)?.name || id,
      amount,
      percentage: totalMonthlyCost > 0 ? Math.round((amount / totalMonthlyCost) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount).slice(0, 8);
  }, [filteredResources, totalMonthlyCost]);

  const costByApp = useMemo(() => {
    const map = new Map<string, number>();
    filteredResources.forEach(r => {
      map.set(r.appId, (map.get(r.appId) || 0) + r.monthlyCost);
    });
    return Array.from(map.entries()).map(([id, amount]) => ({
      name: applications.find(a => a.id === id)?.name || id,
      amount,
      percentage: totalMonthlyCost > 0 ? Math.round((amount / totalMonthlyCost) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount).slice(0, 10);
  }, [filteredResources, totalMonthlyCost]);

  const costByTypeFiltered = useMemo(() => {
    const typeNames: Record<string, string> = {
      ecs: '云服务器', oss: '对象存储', slb: '负载均衡',
      rds: '云数据库', vpc: '私有网络', redis: '云缓存',
    };
    const map = new Map<string, number>();
    filteredResources.forEach(r => {
      map.set(r.type, (map.get(r.type) || 0) + r.monthlyCost);
    });
    return Array.from(map.entries()).map(([type, amount]) => ({
      name: typeNames[type] || type.toUpperCase(),
      amount,
      percentage: totalMonthlyCost > 0 ? Math.round((amount / totalMonthlyCost) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredResources, totalMonthlyCost]);

  const pieData = viewMode === 'account' ? costByAccount :
                   viewMode === 'region' ? costByRegion :
                   viewMode === 'app' ? costByApp : costByTypeFiltered;

  const topResources = useMemo(() => {
    return [...filteredResources]
      .sort((a, b) => b.monthlyCost - a.monthlyCost)
      .slice(0, 10);
  }, [filteredResources]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/95 backdrop-blur border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <p className="text-sm font-semibold text-white">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="本月总费用（筛选后）"
          value={formatCurrency(totalMonthlyCost)}
          subtitle={`较全量 ${totalMonthlyCost < lastMonthCost ? '减少' : '增加'} ${formatCurrency(Math.abs(lastMonthCost - totalMonthlyCost))}`}
          icon={<DollarSign size={20} className="text-cyan-400" />}
          color="cyan"
        />
        <StatCard
          title="资源总数"
          value={totalResources}
          subtitle="个云资源"
          icon={<Server size={20} className="text-emerald-400" />}
          color="emerald"
        />
        <StatCard
          title="闲置资源费用"
          value={formatCurrency(idleCost)}
          subtitle={`占比 ${idleCostPercent}%`}
          icon={<TrendingDown size={20} className="text-amber-400" />}
          color="amber"
        />
        <StatCard
          title="平均单资源费用"
          value={formatCurrency(avgResourceCost)}
          subtitle="每月"
          icon={<BarChart3 size={20} className="text-rose-400" />}
          color="rose"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-white">费用趋势</h3>
              <p className="text-xs text-slate-500 mt-0.5">近 {period === '12m' ? '12' : '6'} 个月费用走势</p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg">
              <button
                onClick={() => setPeriod('6m')}
                className={cn(
                  'px-3 py-1 text-xs rounded-md font-medium transition-all',
                  period === '6m' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                近6月
              </button>
              <button
                onClick={() => setPeriod('12m')}
                className={cn(
                  'px-3 py-1 text-xs rounded-md font-medium transition-all',
                  period === '12m' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                近12月
              </button>
            </div>
          </div>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#colorCost)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">费用分布</h3>
            <div className="flex gap-1">
              {(['type', 'account', 'region'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'px-2 py-1 text-[11px] rounded font-medium transition-all',
                    viewMode === mode 
                      ? 'bg-cyan-500/20 text-cyan-400' 
                      : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  {mode === 'type' ? '类型' : mode === 'account' ? '账号' : '区域'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="amount"
                >
                  {pieData.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-2">
            {pieData.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-xs text-slate-400 truncate max-w-[120px]">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 font-medium">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">Top 10 高费用业务系统</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costByApp} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                <XAxis 
                  type="number" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="amount" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">Top 10 高费用资源</h3>
          <div className="space-y-2">
            {topResources.length > 0 ? (
              topResources.map((resource, idx) => (
                <div 
                  key={resource.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-700/50 text-xs font-mono text-slate-400">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm text-white font-medium">{resource.name}</p>
                      <p className="text-xs text-slate-500">{resource.type?.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-400">{formatCurrency(resource.monthlyCost)}</p>
                    <p className="text-[11px] text-slate-500">/ 月</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <DollarSign size={36} className="mx-auto text-slate-700 mb-3" />
                <p className="text-sm text-slate-500">暂无符合筛选条件的资源</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
