import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Tag as TagIcon, DollarSign, Calendar, Globe, Server, AlertTriangle, ClipboardList, ExternalLink, CheckCircle } from 'lucide-react';
import { cloudAccounts, regions, applications } from '@/data/mockData';
import { useResourceStore } from '@/store/useResourceStore';
import { formatCurrency, getResourceTypeName, getProviderName, getTaskTypeName, getPriorityName } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge';
import TagBadge from '@/components/TagBadge';
import type { CloudResource, Tag } from '@/types';

interface ResourceDetailPanelProps {
  resource: CloudResource;
  onClose: () => void;
}

export default function ResourceDetailPanel({ resource, onClose }: ResourceDetailPanelProps) {
  const { updateResourceTags, addChangeLog, addTask } = useResourceStore();
  const navigate = useNavigate();
  const [showEditTagModal, setShowEditTagModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskCreated, setTaskCreated] = useState<{ type: string; priority: string; assignee: string } | null>(null);
  const [tagSaved, setTagSaved] = useState(false);
  const [editForm, setEditForm] = useState({
    Owner: resource.tags.find(t => t.key === 'Owner')?.value || '',
    Usage: resource.tags.find(t => t.key === 'Usage')?.value || '',
    Department: resource.tags.find(t => t.key === 'Department')?.value || '',
    Environment: resource.tags.find(t => t.key === 'Environment')?.value || '',
  });
  const [taskForm, setTaskForm] = useState({
    type: 'idle' as 'idle' | 'risk' | 'tag_missing' | 'other',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const account = cloudAccounts.find(a => a.id === resource.accountId);
  const region = regions.find(r => r.id === resource.regionId);
  const app = applications.find(a => a.id === resource.appId);

  const handleSaveTags = () => {
    const existingKeys = ['Owner', 'Usage', 'Department', 'Environment'];
    const otherTags = resource.tags.filter(t => !existingKeys.includes(t.key));
    const newTags: Tag[] = [
      ...otherTags,
      { key: 'Owner', value: editForm.Owner },
      { key: 'Usage', value: editForm.Usage },
      { key: 'Department', value: editForm.Department },
      { key: 'Environment', value: editForm.Environment },
    ].filter(t => t.value.trim() !== '');
    
    const changedTags: string[] = [];
    existingKeys.forEach(key => {
      const oldTag = resource.tags.find(t => t.key === key);
      const newValue = editForm[key as keyof typeof editForm];
      if ((oldTag?.value || '') !== newValue) {
        changedTags.push(key);
      }
    });

    const oldTagStr = resource.tags.length > 0 
      ? resource.tags.map(t => `${t.key}=${t.value}`).join(', ')
      : '（空）';
    const newTagStr = newTags.length > 0 
      ? newTags.map(t => `${t.key}=${t.value}`).join(', ')
      : '（空）';

    updateResourceTags(resource.id, newTags, false);
    
    if (changedTags.length > 0) {
      const changedDetails = changedTags.map(key => {
        const oldTag = resource.tags.find(t => t.key === key);
        const newValue = editForm[key as keyof typeof editForm] || '（空）';
        return `${key}: ${oldTag?.value || '（空）'} → ${newValue}`;
      }).join('；');

      addChangeLog({
        resourceId: resource.id,
        resourceName: resource.name,
        type: 'tag_update',
        field: 'tags',
        oldValue: oldTagStr,
        newValue: newTagStr,
        operator: '当前用户',
        timestamp: new Date().toISOString(),
        reason: `更新标签：${changedTags.join('、')} | ${changedDetails}`,
      });

      setTagSaved(true);
      setTimeout(() => setTagSaved(false), 3000);
    }

    setShowEditTagModal(false);
  };

  const handleAddTask = () => {
    const taskType = taskForm.type;
    const assignee = editForm.Owner || '未指定';
    
    addTask({
      title: `[${resource.name}] - ${taskForm.type === 'idle' ? '处理闲置资源' : taskForm.type === 'risk' ? '处理高风险资源' : taskForm.type === 'tag_missing' ? '补全资源标签' : '资源整理'}`,
      type: taskType,
      status: 'pending',
      resourceIds: [resource.id],
      priority: taskForm.priority,
      assignee,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      description: taskForm.description,
    });
    
    addChangeLog({
      resourceId: resource.id,
      resourceName: resource.name,
      type: 'task_create',
      field: 'task',
      oldValue: '（无）',
      newValue: `[${getPriorityName(taskForm.priority)}] ${getTaskTypeName(taskType)}`,
      operator: '当前用户',
      timestamp: new Date().toISOString(),
      reason: `加入待整理任务，负责人：${assignee}`,
    });

    setTaskCreated({ type: taskType, priority: taskForm.priority, assignee });
    setShowAddTaskModal(false);
  };

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
              <TagIcon size={12} />
              标签
            </h5>
            <button 
              onClick={() => setShowEditTagModal(true)}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >编辑标签</button>
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
        <button 
          onClick={() => setShowEditTagModal(true)}
          className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          编辑标签
        </button>
        <button 
          onClick={() => setShowAddTaskModal(true)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg border border-slate-700 transition-colors"
        >
          加入任务
        </button>
      </div>

      {tagSaved && (
        <div className="px-4 py-3 border-t border-emerald-500/30 bg-emerald-500/10 flex items-center gap-2">
          <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
          <span className="text-xs text-emerald-400">标签已保存，各页面已同步更新</span>
        </div>
      )}

      {taskCreated && (
        <div className="px-4 py-3 border-t border-cyan-500/30 bg-cyan-500/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-cyan-400 flex-shrink-0" />
              <span className="text-xs text-cyan-400">任务已创建</span>
            </div>
            <button
              onClick={() => { setTaskCreated(null); navigate('/changes'); }}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              前往任务页
              <ExternalLink size={12} />
            </button>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>类型：<span className="text-slate-200">{getTaskTypeName(taskCreated.type)}</span></span>
            <span>优先级：<span className="text-slate-200">{getPriorityName(taskCreated.priority)}</span></span>
            <span>负责人：<span className="text-slate-200">{taskCreated.assignee}</span></span>
          </div>
        </div>
      )}

      {showEditTagModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowEditTagModal(false)}>
          <div className="w-[450px] bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white">编辑标签</h3>
              <button onClick={() => setShowEditTagModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">负责人</label>
                <input
                  type="text"
                  value={editForm.Owner}
                  onChange={(e) => setEditForm(f => ({ ...f, Owner: e.target.value }))}
                  placeholder="输入负责人姓名"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">用途</label>
                <input
                  type="text"
                  value={editForm.Usage}
                  onChange={(e) => setEditForm(f => ({ ...f, Usage: e.target.value }))}
                  placeholder="如：生产环境、测试环境、开发环境"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">部门</label>
                <input
                  type="text"
                  value={editForm.Department}
                  onChange={(e) => setEditForm(f => ({ ...f, Department: e.target.value }))}
                  placeholder="如：研发部、运维部"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">环境</label>
                <select
                  value={editForm.Environment}
                  onChange={(e) => setEditForm(f => ({ ...f, Environment: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                >
                  <option value="">请选择</option>
                  <option value="生产">生产</option>
                  <option value="测试">测试</option>
                  <option value="开发">开发</option>
                  <option value="预发布">预发布</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowEditTagModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-sm font-medium rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveTags}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAddTaskModal(false)}>
          <div className="w-[450px] bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <ClipboardList size={18} className="text-cyan-400" />
                加入待整理任务
              </h3>
              <button onClick={() => setShowAddTaskModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">任务类型</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'idle', label: '闲置处理', color: 'amber' },
                    { value: 'risk', label: '风险处理', color: 'rose' },
                    { value: 'tag_missing', label: '补全标签', color: 'cyan' },
                    { value: 'other', label: '其他', color: 'slate' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setTaskForm(f => ({ ...f, type: opt.value as any }))}
                      className={cn(
                        'px-3 py-2 text-sm rounded-lg border transition-colors',
                        taskForm.type === opt.value
                          ? `bg-${opt.color}-500/15 text-${opt.color}-400 border-${opt.color}-500/30`
                          : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">优先级</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'low', label: '低' },
                    { value: 'medium', label: '中' },
                    { value: 'high', label: '高' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setTaskForm(f => ({ ...f, priority: opt.value as any }))}
                      className={cn(
                        'px-3 py-2 text-sm rounded-lg border transition-colors',
                        taskForm.priority === opt.value
                          ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                          : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">任务描述</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="请输入任务描述..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 resize-none"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-sm font-medium rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddTask}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                加入任务
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
