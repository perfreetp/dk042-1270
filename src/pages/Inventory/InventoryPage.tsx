import { useState, useMemo } from 'react';
import { 
  Search, Filter, Download, ChevronDown, ChevronUp, 
  Server, HardDrive, Network, Database, Zap, Globe, Monitor,
  Check, X, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { cloudAccounts, regions, applications } from '@/data/mockData';
import { useResourceStore } from '@/store/useResourceStore';
import { useFilterStore } from '@/store/useFilterStore';
import { formatCurrency, getResourceTypeName } from '@/utils/format';
import { exportToCSV } from '@/utils/export';
import StatusBadge from '@/components/StatusBadge';
import TagBadge from '@/components/TagBadge';
import type { ResourceType, ResourceStatus } from '@/types';

const resourceTypeOptions: { value: ResourceType; label: string; icon: React.ReactNode }[] = [
  { value: 'ecs', label: '云服务器', icon: <Server size={14} /> },
  { value: 'oss', label: '对象存储', icon: <HardDrive size={14} /> },
  { value: 'slb', label: '负载均衡', icon: <Network size={14} /> },
  { value: 'rds', label: '云数据库', icon: <Database size={14} /> },
  { value: 'redis', label: '云缓存', icon: <Zap size={14} /> },
  { value: 'vpc', label: '专有网络', icon: <Globe size={14} /> },
  { value: 'eip', label: '弹性IP', icon: <Monitor size={14} /> },
];

const statusOptions: { value: ResourceStatus; label: string }[] = [
  { value: 'running', label: '运行中' },
  { value: 'stopped', label: '已停止' },
  { value: 'idle', label: '闲置' },
  { value: 'error', label: '异常' },
];

export default function InventoryPage() {
  const { resources, selectedResourceId, setSelectedResource } = useResourceStore();
  const { 
    accountIds, regionIds, appIds, resourceTypes, searchKeyword, status,
    setAccountIds, setRegionIds, setAppIds, setResourceTypes, setSearchKeyword, setStatus,
    resetFilters
  } = useFilterStore();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const pageSize = 10;

  const filteredResources = useMemo(() => {
    let result = resources.filter(r => {
      if (accountIds.length > 0 && !accountIds.includes(r.accountId)) return false;
      if (regionIds.length > 0 && !regionIds.includes(r.regionId)) return false;
      if (appIds.length > 0 && !appIds.includes(r.appId)) return false;
      if (resourceTypes.length > 0 && !resourceTypes.includes(r.type)) return false;
      if (status && r.status !== status) return false;
      if (searchKeyword && !r.name.toLowerCase().includes(searchKeyword.toLowerCase())) return false;
      return true;
    });

    result.sort((a, b) => {
      let aVal: any = a[sortField as keyof typeof a];
      let bVal: any = b[sortField as keyof typeof b];
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [resources, accountIds, regionIds, appIds, resourceTypes, status, searchKeyword, sortField, sortOrder]);

  const paginatedResources = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredResources.slice(start, start + pageSize);
  }, [filteredResources, currentPage]);

  const totalPages = Math.ceil(filteredResources.length / pageSize);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === paginatedResources.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedResources.map(r => r.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    const exportData = selectedRows.length > 0 
      ? filteredResources.filter(r => selectedRows.includes(r.id))
      : filteredResources;
    exportToCSV(exportData, '云资源清单.csv');
  };

  const toggleTypeFilter = (type: ResourceType) => {
    setResourceTypes(
      resourceTypes.includes(type)
        ? resourceTypes.filter(t => t !== type)
        : [...resourceTypes, type]
    );
  };

  const getAccountName = (id: string) => cloudAccounts.find(a => a.id === id)?.name || '-';
  const getRegionName = (id: string) => regions.find(r => r.id === id)?.name || '-';
  const getAppName = (id: string) => applications.find(a => a.id === id)?.name || '-';

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              showFilterPanel 
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' 
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
            )}
          >
            <Filter size={16} />
            筛选
          </button>
          
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索资源名称..."
              className="w-72 h-9 pl-9 pr-4 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <span className="text-sm text-slate-400">
              已选 <span className="text-cyan-400 font-medium">{selectedRows.length}</span> 项
            </span>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Download size={16} />
            导出清单
          </button>
        </div>
      </div>

      {showFilterPanel && (
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl animate-fade-in-up">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">云账号</label>
              <select
                multiple
                value={accountIds}
                onChange={(e) => setAccountIds(Array.from(e.target.selectedOptions, o => o.value))}
                className="w-full h-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
              >
                {cloudAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">区域</label>
              <select
                multiple
                value={regionIds}
                onChange={(e) => setRegionIds(Array.from(e.target.selectedOptions, o => o.value))}
                className="w-full h-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
              >
                {regions.map(reg => (
                  <option key={reg.id} value={reg.id}>{reg.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">业务系统</label>
              <select
                multiple
                value={appIds}
                onChange={(e) => setAppIds(Array.from(e.target.selectedOptions, o => o.value))}
                className="w-full h-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
              >
                {applications.map(app => (
                  <option key={app.id} value={app.id}>{app.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">状态</label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(status === opt.value ? undefined : opt.value)}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-lg font-medium transition-all border',
                      status === opt.value
                        ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">资源类型：</span>
              {resourceTypeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleTypeFilter(opt.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-all border',
                    resourceTypes.includes(opt.value)
                      ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                      : 'bg-slate-800/50 text-slate-500 border-slate-700/50 hover:text-slate-300'
                  )}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              重置筛选
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === paginatedResources.length && paginatedResources.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/30"
                  />
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    资源名称
                    {sortField === 'name' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">类型</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">所属业务</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">负责人</th>
                <th 
                  className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort('monthlyCost')}
                >
                  <div className="flex items-center justify-end gap-1">
                    月费用
                    {sortField === 'monthlyCost' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">风险</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResources.map((resource, idx) => {
                const ownerTag = resource.tags.find(t => t.key === 'Owner');
                return (
                  <tr 
                    key={resource.id}
                    className={cn(
                      'border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer',
                      idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-900/10',
                      selectedRows.includes(resource.id) && 'bg-cyan-500/5'
                    )}
                    onClick={() => setSelectedResource(resource.id)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(resource.id)}
                        onChange={() => toggleSelectRow(resource.id)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-white">{resource.name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{resource.id}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-300">{getResourceTypeName(resource.type)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={resource.status} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-300">{getAppName(resource.appId)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {ownerTag ? (
                        <span className="text-sm text-slate-300">{ownerTag.value}</span>
                      ) : (
                        <span className="text-xs text-rose-400">未标记</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-emerald-400">{formatCurrency(resource.monthlyCost)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {resource.isRisk ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/15">
                          <X size={14} className="text-rose-400" />
                        </span>
                      ) : resource.isIdle ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/15">
                          <ChevronDown size={14} className="text-amber-400" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15">
                          <Check size={14} className="text-emerald-400" />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paginatedResources.length === 0 && (
          <div className="py-16 text-center">
            <Server size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500">暂无符合条件的资源</p>
          </div>
        )}

        <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            共 <span className="text-slate-300 font-medium">{filteredResources.length}</span> 条资源
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-md text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              上一页
            </button>
            <span className="text-sm text-slate-400">
              {currentPage} / {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-md text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
