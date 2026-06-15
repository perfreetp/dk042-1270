import { X, Tag, DollarSign, Calendar, Globe, Server, AlertTriangle } from 'lucide-react';
import { cloudAccounts, regions, applications } from '@/data/mockData';
import { useResourceStore } from '@/store/useResourceStore';
import { formatCurrency, getResourceTypeName, getProviderName } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge';
import TagBadge from '@/components/TagBadge';
import type { CloudResource } from '@/types';

interface ResourceDetailPanelProps {
  resource: CloudResource;
  onClose: () => void;
}

export default function ResourceDetailPanel({ resource, onClose }: ResourceDetailPanelProps) {
  const { updateResourceTags } = useResourceStore();
  
  const account = cloudAccounts.find(a => a.id === resource.accountId);
  const region = regions.find(r => r.id === resource.regionId);
  const app = applications.find(a => a.id === resource.appId);

  const ownerTag = resource.tags.find(t => t.key === 'Owner');
  const usageTag = resource.tags.find(t => t.key === 'Usage');
  const envTag = resource.tags.find(t => t.key === 'Environment');

  return (
    <div className="w-96 bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden animate-slide-in-right flex flex-col">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">资源详情</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-mono">{resource.id}</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                <Server size={20} className="text-cyan-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">{resource.name}</h4>
                <p className="text-xs text-slate-500">{getResourceTypeName(resource.type)}</p>
              </div>
            </div>
            <StatusBadge status={resource.status} />
          </div>

          {(resource.isIdle || resource.isRisk) && (
            <div className="space-y-2 mt-3">
              {resource.isIdle && (
                <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-amber-400">资源处于闲置状态，建议确认用途</span>
                </div>
              )}
              {resource.isRisk && (
                <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                  <AlertTriangle size={14} className="text-rose-400 flex-shrink-0" />
                  <span className="text-xs text-rose-400">{resource.riskReason}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">基本信息</h5>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="text-xs text-slate-500 mb-1">云账号</div>
              <div className="text-sm text-white font-medium">{account?.name || '-'}</div>
              <div className="text-xs text-slate-500 mt-0.5">{account ? getProviderName(account.provider) : ''}</div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="text-xs text-slate-500 mb-1">区域</div>
              <div className="text-sm text-white font-medium">{region?.name || '-'}</div>
              <div className="text-xs text-slate-500 mt-0.5 font-mono">{region?.nameEn || ''}</div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="text-xs text-slate-500 mb-1">所属业务</div>
              <div className="text-sm text-white font-medium">{app?.name || '-'}</div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="text-xs text-slate-500 mb-1">月费用</div>
              <div className="text-sm text-emerald-400 font-semibold">{formatCurrency(resource.monthlyCost)}</div>
            </div>
          </div>

          {resource.ip && (
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="text-xs text-slate-500 mb-1">IP 地址</div>
              <div className="text-sm font-mono text-cyan-400">{resource.ip}</div>
            </div>
          )}

          {resource.spec && (
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="text-xs text-slate-500 mb-1">实例规格</div>
              <div className="text-sm font-mono text-slate-300">{resource.spec}</div>
            </div>
          )}

          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Calendar size={12} />
              创建时间
            </div>
            <div className="text-sm text-slate-300">{resource.createdAt}</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={12} />
              标签
            </h5>
            <button className="text-xs text-cyan-400 hover:text-cyan-300">编辑标签</button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {resource.tags.map((tag, idx) => (
              <TagBadge key={idx} label={tag.key} value={tag.value} variant="cyan" />
            ))}
            {resource.tags.length === 0 && (
              <span className="text-xs text-slate-500">暂无标签</span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">费用概览</h5>
          <div className="p-4 bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 rounded-lg border border-cyan-500/20">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-white">{formatCurrency(resource.monthlyCost)}</span>
              <span className="text-xs text-slate-500">/ 月</span>
            </div>
            <div className="text-xs text-slate-400">
              预估年费用：<span className="text-slate-300 font-medium">{formatCurrency(resource.monthlyCost * 12)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 flex gap-2">
        <button className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors">
          编辑标签
        </button>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg border border-slate-700 transition-colors">
          加入任务
        </button>
      </div>
    </div>
  );
}
