import { useState, useMemo } from 'react';
import { 
  Tags, AlertTriangle, CheckCircle, XCircle, 
  TrendingUp, Trash2, Edit3, Shield, AlertCircle,
  ChevronDown, ChevronRight, Plus, Tag as TagIcon, Building2,
  Search, Eye, Zap, Copy, AlertOctagon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResourceStore } from '@/store/useResourceStore';
import { formatCurrency, getResourceTypeName } from '@/utils/format';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import TagBadge from '@/components/TagBadge';
import { applications } from '@/data/mockData';
import type { CloudResource } from '@/types';

type TabType = 'coverage' | 'idle' | 'risk' | 'editor' | 'audit';

export default function GovernancePage() {
  const { resources, tasks, updateResourceTags, addTask, setSelectedResource, toggleDetailPanel } = useResourceStore();
  const [activeTab, setActiveTab] = useState<TabType>('coverage');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [newTagKey, setNewTagKey] = useState('');
  const [newTagValue, setNewTagValue] = useState('');
  const [auditDimension, setAuditDimension] = useState<string>('Owner');
  const [auditView, setAuditView] = useState<'missing' | 'duplicate' | 'suspicious'>('missing');
  const [auditSearch, setAuditSearch] = useState('');

  const totalResources = resources.length;
  
  const coverageData = useMemo(() => {
    const withOwner = resources.filter(r => r.tags.some(t => t.key === 'Owner')).length;
    const withUsage = resources.filter(r => r.tags.some(t => t.key === 'Usage')).length;
    const withEnv = resources.filter(r => r.tags.some(t => t.key === 'Environment')).length;
    const withDept = resources.filter(r => r.tags.some(t => t.key === 'Department')).length;
    
    const ownerCov = totalResources > 0 ? Math.round((withOwner / totalResources) * 100) : 0;
    const usageCov = totalResources > 0 ? Math.round((withUsage / totalResources) * 100) : 0;
    const envCov = totalResources > 0 ? Math.round((withEnv / totalResources) * 100) : 0;
    const deptCov = totalResources > 0 ? Math.round((withDept / totalResources) * 100) : 0;
    const avgCov = Math.round((ownerCov + usageCov + envCov + deptCov) / 4);
    
    return {
      withOwner, withUsage, withEnv, withDept,
      ownerCov, usageCov, envCov, deptCov, avgCov,
    };
  }, [resources, totalResources]);

  const idleResources = resources.filter(r => r.isIdle);
  const idleCost = idleResources.reduce((sum, r) => sum + r.monthlyCost, 0);
  
  const riskResources = resources.filter(r => r.isRisk);

  const appCoverageData = useMemo(() => {
    return applications.map(app => {
      const appResources = resources.filter(r => r.appId === app.id);
      if (appResources.length === 0) return { name: app.name, value: 0 };
      
      const tagged = appResources.filter(r => 
        r.tags.some(t => t.key === 'Owner') &&
        r.tags.some(t => t.key === 'Usage')
      ).length;
      return {
        name: app.name,
        value: Math.round((tagged / appResources.length) * 100),
        resourceCount: appResources.length,
      };
    }).filter(a => a.resourceCount > 0).sort((a, b) => b.value - a.value);
  }, [resources]);

  const departmentDistribution = useMemo(() => {
    const map = new Map<string, number>();
    resources.forEach(r => {
      const deptTag = r.tags.find(t => t.key === 'Department');
      if (deptTag && deptTag.value) {
        map.set(deptTag.value, (map.get(deptTag.value) || 0) + 1);
      }
    });
    const withDept = Array.from(map.values()).reduce((a, b) => a + b, 0);
    return Array.from(map.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: withDept > 0 ? Math.round((count / withDept) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [resources]);

  const auditDimensions = [
    { key: 'Owner', label: '负责人', color: 'emerald' },
    { key: 'Usage', label: '用途', color: 'amber' },
    { key: 'Department', label: '部门', color: 'violet' },
    { key: 'Environment', label: '环境', color: 'cyan' },
  ];

  const dimColorClasses: Record<string, string> = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    violet: 'bg-violet-500/15 text-violet-400 border border-violet-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  };

  const auditData = useMemo(() => {
    const missing = resources.filter(r => !r.tags.some(t => t.key === auditDimension && t.value.trim()));
    
    const valueMap = new Map<string, CloudResource[]>();
    resources.forEach(r => {
      const tag = r.tags.find(t => t.key === auditDimension);
      if (tag && tag.value.trim()) {
        const val = tag.value.trim();
        if (!valueMap.has(val)) valueMap.set(val, []);
        valueMap.get(val)!.push(r);
      }
    });
    
    const duplicates = Array.from(valueMap.entries())
      .filter(([_, resList]) => resList.length > 3)
      .map(([value, resList]) => ({ value, resources: resList, count: resList.length }))
      .sort((a, b) => b.count - a.count);
    
    const suspiciousPatterns: { value: string; resources: CloudResource[]; reason: string }[] = [];
    valueMap.forEach((resList, value) => {
      if (value.length < 2) {
        suspiciousPatterns.push({ value, resources: resList, reason: '值过短' });
      }
      if (/^(test|tmp|temp|demo|example|123|aaa|test123)$/i.test(value)) {
        suspiciousPatterns.push({ value, resources: resList, reason: '疑似测试值' });
      }
      if (/^[\u4e00-\u9fa5]/.test(value) && value.length > 15) {
        suspiciousPatterns.push({ value, resources: resList, reason: '值过长' });
      }
    });
    
    return {
      missing,
      duplicates,
      suspicious: suspiciousPatterns.sort((a, b) => b.resources.length - a.resources.length),
      missingCount: missing.length,
      duplicateValueCount: duplicates.length,
      suspiciousValueCount: suspiciousPatterns.length,
      duplicateResourceCount: duplicates.reduce((s, d) => s + d.count, 0),
      suspiciousResourceCount: suspiciousPatterns.reduce((s, d) => s + d.resources.length, 0),
    };
  }, [resources, auditDimension]);

  const handleOpenResource = (resourceId: string) => {
    setSelectedResource(resourceId);
    toggleDetailPanel(true);
  };

  const ownerCoverage = coverageData.ownerCov;
  const usageCoverage = coverageData.usageCov;
  const envCoverage = coverageData.envCov;
  const avgCoverage = coverageData.avgCov;

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleSelectResource = (id: string) => {
    setSelectedResources(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleBatchTag = () => {
    if (selectedResources.length > 0 && newTagKey && newTagValue) {
      selectedResources.forEach(resId => {
        const resource = resources.find(r => r.id === resId);
        if (resource) {
          const newTags = [...resource.tags.filter(t => t.key !== newTagKey), { key: newTagKey, value: newTagValue }];
          updateResourceTags(resId, newTags);
        }
      });
      setNewTagKey('');
      setNewTagValue('');
      setSelectedResources([]);
    }
  };

  const handleGenerateTask = (type: 'idle_cleanup' | 'risk_fix', resourceIds: string[]) => {
    addTask({
      title: type === 'idle_cleanup' ? `清理 ${resourceIds.length} 个闲置资源` : `修复 ${resourceIds.length} 个风险项`,
      type,
      status: 'pending',
      resourceIds,
      priority: type === 'risk_fix' ? 'high' : 'medium',
      description: type === 'idle_cleanup' ? '自动识别的闲置资源，建议核查后清理' : '自动识别的高风险暴露项，需及时修复',
    });
    alert('任务已生成！可在「变更记录」中查看');
  };

  const tabs = [
    { key: 'coverage', label: '标签覆盖率', icon: <Tags size={16} /> },
    { key: 'audit', label: '标签审计', icon: <Shield size={16} />, badge: auditData.missingCount + auditData.duplicateValueCount + auditData.suspiciousValueCount },
    { key: 'idle', label: '闲置资源', icon: <AlertCircle size={16} />, badge: idleResources.length },
    { key: 'risk', label: '风险暴露项', icon: <Shield size={16} />, badge: riskResources.length },
    { key: 'editor', label: '批量标签编辑', icon: <Edit3 size={16} /> },
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      {activeTab === 'coverage' && (
        <>
          <div className="grid grid-cols-5 gap-4">
            <StatCard
              title="综合标签覆盖率"
              value={`${avgCoverage}%`}
              subtitle="四项标签平均覆盖率"
              trend={5.2}
              icon={<Tags size={20} className="text-cyan-400" />}
              color="cyan"
            />
            <StatCard
              title="负责人标签"
              value={`${ownerCoverage}%`}
              subtitle={`${coverageData.withOwner} / ${totalResources} 个资源`}
              icon={<CheckCircle size={20} className="text-emerald-400" />}
              color="emerald"
            />
            <StatCard
              title="用途标签"
              value={`${usageCoverage}%`}
              subtitle={`${coverageData.withUsage} / ${totalResources} 个资源`}
              icon={<TagIcon size={20} className="text-amber-400" />}
              color="amber"
            />
            <StatCard
              title="环境标签"
              value={`${envCoverage}%`}
              subtitle={`${coverageData.withEnv} / ${totalResources} 个资源`}
              icon={<Shield size={20} className="text-rose-400" />}
              color="rose"
            />
            <StatCard
              title="部门标签"
              value={`${coverageData.deptCov}%`}
              subtitle={`${coverageData.withDept} / ${totalResources} 个资源`}
              icon={<Building2 size={20} className="text-violet-400" />}
              color="cyan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-4">各维度标签覆盖率</h3>
              <div className="space-y-5">
                {[
                  { label: '负责人标签 (Owner)', value: ownerCoverage, color: 'emerald', count: coverageData.withOwner },
                  { label: '用途标签 (Usage)', value: usageCoverage, color: 'amber', count: coverageData.withUsage },
                  { label: '环境标签 (Environment)', value: envCoverage, color: 'cyan', count: coverageData.withEnv },
                  { label: '部门标签 (Department)', value: coverageData.deptCov, color: 'rose', count: coverageData.withDept },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300">{item.label}</span>
                      <span className="text-sm font-semibold text-white">{item.value}% <span className="text-slate-500 font-normal">({item.count})</span></span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={cn('h-full rounded-full transition-all duration-700', 
                          item.color === 'emerald' && 'bg-emerald-500',
                          item.color === 'amber' && 'bg-amber-500',
                          item.color === 'cyan' && 'bg-cyan-500',
                          item.color === 'rose' && 'bg-rose-500',
                        )}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-4">按业务系统覆盖率</h3>
              <div className="space-y-3">
                {appCoverageData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <span className="text-sm text-slate-300">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-white w-10 text-right">{item.value}%</span>
                    </div>
                  </div>
                ))}
                {appCoverageData.length === 0 && (
                  <div className="py-8 text-center text-slate-500 text-sm">暂无数据</div>
                )}
              </div>
            </div>
          </div>

          {departmentDistribution.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-4">部门资源分布</h3>
              <div className="space-y-3">
                {departmentDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="text-sm text-slate-300 w-32 flex-shrink-0">{item.name}</span>
                    <div className="flex-1 h-6 bg-slate-800 rounded-md overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500/60 to-cyan-500/60 rounded-md flex items-center justify-end pr-2 transition-all duration-500"
                        style={{ width: `${Math.max(item.percentage, 10)}%` }}
                      >
                        <span className="text-[11px] font-medium text-white">{item.percentage}%</span>
                      </div>
                    </div>
                    <span className="text-sm text-slate-400 w-16 text-right">{item.count} 个</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              title="缺失标签资源"
              value={auditData.missingCount}
              subtitle={`${auditDimension === 'Owner' ? '负责人' : auditDimension === 'Usage' ? '用途' : auditDimension === 'Department' ? '部门' : '环境'}标签缺失`}
              icon={<XCircle size={20} className="text-rose-400" />}
              color="rose"
            />
            <StatCard
              title="重复值数量"
              value={auditData.duplicateValueCount}
              subtitle={`涉及 ${auditData.duplicateResourceCount} 个资源`}
              icon={<Copy size={20} className="text-amber-400" />}
              color="amber"
            />
            <StatCard
              title="可疑值数量"
              value={auditData.suspiciousValueCount}
              subtitle={`涉及 ${auditData.suspiciousResourceCount} 个资源`}
              icon={<AlertTriangle size={20} className="text-violet-400" />}
              color="cyan"
            />
            <StatCard
              title="标签总数"
              value={resources.length}
              subtitle="全部资源基数"
              icon={<Tags size={20} className="text-emerald-400" />}
              color="emerald"
            />
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Shield size={20} className="text-cyan-400" />
                  标签审计
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  按维度审查标签质量，发现缺失、重复和可疑值
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="搜索资源名..."
                    className="w-48 h-8 pl-8 pr-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/30">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {auditDimensions.map((dim) => (
                    <button
                      key={dim.key}
                      onClick={() => setAuditDimension(dim.key)}
                      className={cn(
                        'px-4 py-1.5 text-xs font-medium rounded-lg transition-all',
                        auditDimension === dim.key
                          ? dimColorClasses[dim.color]
                          : 'text-slate-400 hover:text-slate-200 border border-transparent'
                      )}
                    >
                      {dim.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 p-1 bg-slate-800/60 rounded-lg">
                  {[
                    { key: 'missing', label: '缺失标签', icon: <XCircle size={12} /> },
                    { key: 'duplicate', label: '重复值', icon: <Copy size={12} /> },
                    { key: 'suspicious', label: '可疑值', icon: <AlertOctagon size={12} /> },
                  ].map((view) => (
                    <button
                      key={view.key}
                      onClick={() => setAuditView(view.key as any)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all',
                        auditView === view.key
                          ? 'bg-slate-900 text-cyan-400'
                          : 'text-slate-400 hover:text-slate-200'
                      )}
                    >
                      {view.icon}
                      {view.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 max-h-[500px] overflow-y-auto">
              {auditView === 'missing' && (
                <div className="space-y-2">
                  {auditData.missing.filter(r => !auditSearch || r.name.toLowerCase().includes(auditSearch.toLowerCase())).length === 0 ? (
                    <div className="py-12 text-center">
                      <CheckCircle size={40} className="mx-auto text-emerald-500/40 mb-3" />
                      <p className="text-sm text-slate-500">暂无缺失 {auditDimension} 标签的资源</p>
                    </div>
                  ) : (
                    auditData.missing
                      .filter(r => !auditSearch || r.name.toLowerCase().includes(auditSearch.toLowerCase()))
                      .map((resource) => (
                        <div
                          key={resource.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          onClick={() => handleOpenResource(resource.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                              <XCircle size={14} className="text-rose-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{resource.name}</p>
                              <p className="text-xs text-slate-500">{getResourceTypeName(resource.type)} · {resource.id}</p>
                            </div>
                          </div>
                          <button className="flex items-center gap-1 px-2.5 py-1 text-xs bg-rose-500/20 text-rose-400 rounded-md hover:bg-rose-500/30 transition-colors">
                            <Edit3 size={12} />
                            补标签
                          </button>
                        </div>
                      ))
                  )}
                </div>
              )}

              {auditView === 'duplicate' && (
                <div className="space-y-3">
                  {auditData.duplicates.length === 0 ? (
                    <div className="py-12 text-center">
                      <CheckCircle size={40} className="mx-auto text-emerald-500/40 mb-3" />
                      <p className="text-sm text-slate-500">暂无高度重复的 {auditDimension} 标签值</p>
                    </div>
                  ) : (
                    auditData.duplicates.map((dup, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-700 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-amber-500/5 border-b border-slate-700">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                              <Copy size={14} className="text-amber-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{dup.value}</p>
                              <p className="text-xs text-slate-500">被 {dup.count} 个资源使用</p>
                            </div>
                          </div>
                          <span className="text-xs text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                            高度重复
                          </span>
                        </div>
                        <div className="p-3 max-h-40 overflow-y-auto space-y-1.5">
                          {dup.resources
                            .filter(r => !auditSearch || r.name.toLowerCase().includes(auditSearch.toLowerCase()))
                            .slice(0, 10)
                            .map((r) => (
                              <div
                                key={r.id}
                                className="flex items-center justify-between px-3 py-2 rounded-md bg-slate-800/40 hover:bg-slate-800 transition-colors cursor-pointer"
                                onClick={() => handleOpenResource(r.id)}
                              >
                                <span className="text-xs text-slate-300">{r.name}</span>
                                <span className="text-[11px] text-slate-500">{getResourceTypeName(r.type)}</span>
                              </div>
                            ))}
                          {dup.resources.length > 10 && (
                            <div className="text-center text-xs text-slate-500 pt-1">
                              +{dup.resources.length - 10} 个更多资源
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {auditView === 'suspicious' && (
                <div className="space-y-3">
                  {auditData.suspicious.length === 0 ? (
                    <div className="py-12 text-center">
                      <CheckCircle size={40} className="mx-auto text-emerald-500/40 mb-3" />
                      <p className="text-sm text-slate-500">暂无可疑的 {auditDimension} 标签值</p>
                    </div>
                  ) : (
                    auditData.suspicious.map((item, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-700 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-violet-500/5 border-b border-slate-700">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                              <AlertTriangle size={14} className="text-violet-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{item.value}</p>
                              <p className="text-xs text-slate-500">涉及 {item.resources.length} 个资源</p>
                            </div>
                          </div>
                          <span className="text-xs text-violet-400 bg-violet-500/15 px-2 py-0.5 rounded border border-violet-500/30">
                            {item.reason}
                          </span>
                        </div>
                        <div className="p-3 max-h-40 overflow-y-auto space-y-1.5">
                          {item.resources
                            .filter(r => !auditSearch || r.name.toLowerCase().includes(auditSearch.toLowerCase()))
                            .slice(0, 10)
                            .map((r) => (
                              <div
                                key={r.id}
                                className="flex items-center justify-between px-3 py-2 rounded-md bg-slate-800/40 hover:bg-slate-800 transition-colors cursor-pointer"
                                onClick={() => handleOpenResource(r.id)}
                              >
                                <span className="text-xs text-slate-300">{r.name}</span>
                                <span className="text-[11px] text-slate-500">{getResourceTypeName(r.type)}</span>
                              </div>
                            ))}
                          {item.resources.length > 10 && (
                            <div className="text-center text-xs text-slate-500 pt-1">
                              +{item.resources.length - 10} 个更多资源
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'idle' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <AlertCircle size={20} className="text-amber-400" />
                闲置资源列表
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                共 {idleResources.length} 个闲置资源，月费用 {formatCurrency(idleCost)}
              </p>
            </div>
            <button
              onClick={() => handleGenerateTask('idle_cleanup', idleResources.map(r => r.id))}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus size={16} />
              生成清理任务
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {idleResources.map((resource) => (
              <div key={resource.id}>
                <div 
                  className="p-4 flex items-center justify-between hover:bg-slate-800/30 cursor-pointer transition-colors"
                  onClick={() => toggleExpand(resource.id)}
                >
                  <div className="flex items-center gap-4">
                    {expandedRows.includes(resource.id) ? (
                      <ChevronDown size={16} className="text-slate-500" />
                    ) : (
                      <ChevronRight size={16} className="text-slate-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">{resource.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">{resource.id}</p>
                    </div>
                    <span className="text-xs text-slate-500">{getResourceTypeName(resource.type)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status="idle" size="sm" />
                    <span className="text-sm text-amber-400 font-medium">{formatCurrency(resource.monthlyCost)}/月</span>
                  </div>
                </div>
                {expandedRows.includes(resource.id) && (
                  <div className="px-4 pb-4 pt-2 bg-slate-800/20">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">创建时间</span>
                        <p className="text-slate-300 mt-1">{resource.createdAt}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">当前状态</span>
                        <p className="text-slate-300 mt-1">{resource.status}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">标签数量</span>
                        <p className="text-slate-300 mt-1">{resource.tags.length} 个</p>
                      </div>
                      <div>
                        <span className="text-slate-500">预估年浪费</span>
                        <p className="text-amber-400 font-medium mt-1">{formatCurrency(resource.monthlyCost * 12)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button className="px-3 py-1.5 bg-rose-500/20 text-rose-400 text-xs font-medium rounded-md hover:bg-rose-500/30 transition-colors">
                        <Trash2 size={12} className="inline mr-1" />
                        释放资源
                      </button>
                      <button className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 text-xs font-medium rounded-md hover:bg-cyan-500/30 transition-colors">
                        查看详情
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'risk' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Shield size={20} className="text-rose-400" />
                高风险暴露项
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                共 {riskResources.length} 个高风险资源，需及时处理
              </p>
            </div>
            <button
              onClick={() => handleGenerateTask('risk_fix', riskResources.map(r => r.id))}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus size={16} />
              生成修复任务
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">资源名称</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">类型</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">风险描述</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">风险等级</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody>
                {riskResources.map((resource, idx) => (
                  <tr key={resource.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-white">{resource.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{resource.id}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{getResourceTypeName(resource.type)}</td>
                    <td className="px-4 py-3 text-sm text-rose-400">{resource.riskReason}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-rose-500/15 text-rose-400 text-xs font-medium rounded border border-rose-500/30">
                        高风险
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                        修复
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'editor' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Edit3 size={20} className="text-cyan-400" />
              批量标签编辑
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">选择资源后批量添加或更新标签</p>
          </div>

          <div className="p-5">
            <div className="mb-5 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">标签键</label>
                  <select
                    value={newTagKey}
                    onChange={(e) => setNewTagKey(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="">选择标签键...</option>
                    <option value="Owner">负责人 (Owner)</option>
                    <option value="Usage">用途 (Usage)</option>
                    <option value="Environment">环境 (Environment)</option>
                    <option value="Department">部门 (Department)</option>
                    <option value="Project">项目 (Project)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">标签值</label>
                  <input
                    type="text"
                    value={newTagValue}
                    onChange={(e) => setNewTagValue(e.target.value)}
                    placeholder="输入标签值..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <button
                  onClick={handleBatchTag}
                  disabled={!newTagKey || !newTagValue || selectedResources.length === 0}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  应用到 {selectedResources.length} 个资源
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">
                已选择 <span className="text-cyan-400 font-medium">{selectedResources.length}</span> 个资源
              </span>
              <button
                onClick={() => setSelectedResources(selectedResources.length === resources.length ? [] : resources.map(r => r.id))}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                {selectedResources.length === resources.length ? '取消全选' : '全选'}
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto border border-slate-800 rounded-lg">
              {resources.map((resource) => (
                <div 
                  key={resource.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 border-b border-slate-800/50 last:border-b-0 cursor-pointer transition-colors',
                    selectedResources.includes(resource.id) ? 'bg-cyan-500/5' : 'hover:bg-slate-800/30'
                  )}
                  onClick={() => toggleSelectResource(resource.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedResources.includes(resource.id)}
                    onChange={() => toggleSelectResource(resource.id)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/30"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{resource.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{resource.id}</p>
                  </div>
                  <span className="text-xs text-slate-500">{getResourceTypeName(resource.type)}</span>
                  <div className="flex gap-1">
                    {resource.tags.slice(0, 2).map((tag, idx) => (
                      <TagBadge key={idx} label={tag.key} value={tag.value} size="sm" />
                    ))}
                    {resource.tags.length > 2 && (
                      <span className="text-xs text-slate-500">+{resource.tags.length - 2}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-slate-900 text-cyan-400 shadow-inner'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
