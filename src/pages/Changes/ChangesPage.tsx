import { useState } from 'react';
import { 
  History, ListTodo, Clock, User, Tag as TagIcon, Settings,
  ChevronDown, ChevronRight, CheckCircle2, AlertCircle, 
  MoreHorizontal, Plus, Filter, ArrowRight, Calendar, ClipboardList, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { useResourceStore } from '@/store/useResourceStore';
import { getTaskTypeName, getPriorityName, getStatusName, getChangeTypeName, getResourceTypeName } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge';
import TagBadge from '@/components/TagBadge';
import { applications } from '@/data/mockData';

type TabType = 'changes' | 'tasks';

const changeTypeIcons: Record<string, React.ReactNode> = {
  owner_change: <User size={14} />,
  tag_change: <TagIcon size={14} />,
  tag_update: <TagIcon size={14} />,
  status_change: <Settings size={14} />,
  task_create: <ClipboardList size={14} />,
  app_change: <ArrowRight size={14} />,
};

const changeTypeColors: Record<string, string> = {
  owner_change: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  tag_change: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  tag_update: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  status_change: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  task_create: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
  app_change: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
};

const changeTypeBadgeVariants: Record<string, 'cyan' | 'amber' | 'emerald' | 'violet' | 'rose'> = {
  owner_change: 'cyan',
  tag_change: 'amber',
  tag_update: 'amber',
  status_change: 'emerald',
  task_create: 'cyan',
  app_change: 'cyan',
};

const priorityColors: Record<string, string> = {
  high: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

export default function ChangesPage() {
  const { changeLogs, tasks, updateTaskStatus, resources, setSelectedResource, toggleDetailPanel } = useResourceStore();
  const [activeTab, setActiveTab] = useState<TabType>('changes');
  const [filterType, setFilterType] = useState<string>('all');
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('all');
  const [taskFilterType, setTaskFilterType] = useState<string>('all');
  const [taskFilterPriority, setTaskFilterPriority] = useState<string>('all');
  const [taskFilterAssignee, setTaskFilterAssignee] = useState<string>('all');
  const [changeSearch, setChangeSearch] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    let result = filterType === 'all' ? changeLogs : changeLogs.filter(log => log.type === filterType);
    if (changeSearch) {
      const kw = changeSearch.toLowerCase();
      result = result.filter(log => 
        log.resourceName.toLowerCase().includes(kw) ||
        log.operator.toLowerCase().includes(kw)
      );
    }
    return result;
  }, [changeLogs, filterType, changeSearch]);

  const taskTypes = [
    { key: 'all', label: '全部类型' },
    { key: 'idle', label: '闲置清理' },
    { key: 'idle_cleanup', label: '闲置清理' },
    { key: 'risk', label: '风险修复' },
    { key: 'risk_fix', label: '风险修复' },
    { key: 'tag_missing', label: '标签补全' },
    { key: 'tag_complete', label: '标签补全' },
    { key: 'other', label: '其他' },
  ];

  const taskPriorities = [
    { key: 'all', label: '全部优先级' },
    { key: 'high', label: '高' },
    { key: 'medium', label: '中' },
    { key: 'low', label: '低' },
  ];

  const assignees = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (t.assignee) set.add(t.assignee);
    });
    return Array.from(set);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (taskFilterStatus !== 'all' && t.status !== taskFilterStatus) return false;
      if (taskFilterType !== 'all') {
        if (taskFilterType === 'idle' && !(t.type === 'idle' || t.type === 'idle_cleanup')) return false;
        if (taskFilterType === 'risk' && !(t.type === 'risk' || t.type === 'risk_fix')) return false;
        if (taskFilterType === 'tag_missing' && !(t.type === 'tag_missing' || t.type === 'tag_complete')) return false;
        if (taskFilterType === 'other' && t.type === 'other') return false;
        if (taskFilterType !== 'idle' && taskFilterType !== 'risk' && taskFilterType !== 'tag_missing' && taskFilterType !== 'other' && t.type !== taskFilterType) return false;
      }
      if (taskFilterPriority !== 'all' && t.priority !== taskFilterPriority) return false;
      if (taskFilterAssignee !== 'all' && t.assignee !== taskFilterAssignee) return false;
      return true;
    });
  }, [tasks, taskFilterStatus, taskFilterType, taskFilterPriority, taskFilterAssignee]);

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const availableChangeTypes = Array.from(new Set(changeLogs.map(l => l.type)));

  const tabs = [
    { key: 'changes', label: '变更历史', icon: <History size={16} />, count: changeLogs.length },
    { key: 'tasks', label: '待整理任务', icon: <ListTodo size={16} />, count: pendingTasks.length + inProgressTasks.length },
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">待处理任务</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <AlertCircle size={16} className="text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{pendingTasks.length}</p>
          <p className="text-xs text-slate-500 mt-1">需要跟进</p>
        </div>
        
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">进行中</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
              <Clock size={16} className="text-cyan-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{inProgressTasks.length}</p>
          <p className="text-xs text-slate-500 mt-1">正在处理</p>
        </div>
        
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">已完成</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{completedTasks.length}</p>
          <p className="text-xs text-slate-500 mt-1">本月完成</p>
        </div>
        
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">本月变更</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <History size={16} className="text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{changeLogs.length}</p>
          <p className="text-xs text-slate-500 mt-1">条变更记录</p>
        </div>
      </div>

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
            {tab.count > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-cyan-500/20 text-cyan-400">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'changes' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">变更历史</h3>
              <p className="text-xs text-slate-500 mt-0.5">资源归属、标签、状态等变更记录</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={changeSearch}
                  onChange={(e) => setChangeSearch(e.target.value)}
                  placeholder="搜索资源名或操作人..."
                  className="w-52 h-8 pl-8 pr-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              {['all', ...availableChangeTypes].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-lg font-medium transition-all',
                    filterType === type
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  )}
                >
                  {type === 'all' ? '全部' : getChangeTypeName(type)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {filteredLogs.length === 0 ? (
              <div className="py-16 text-center">
                <History size={40} className="mx-auto text-slate-700 mb-3" />
                <p className="text-sm text-slate-500">暂无变更记录</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-800" />
                
                <div className="space-y-1">
                  {filteredLogs.map((log, idx) => {
                    const oldVal = (log as any).before || (log as any).oldValue || '（空）';
                    const newVal = (log as any).after || (log as any).newValue || '（空）';
                    const time = (log as any).time || formatTimestamp((log as any).timestamp || log.time);
                    const hasValidContent = oldVal !== '（空）' || newVal !== '（空）';
                    const isExpanded = expandedLogId === log.id;
                    const relatedResource = resources.find(r => r.id === log.resourceId);
                    
                    return (
                      <div key={log.id} className="relative flex gap-4 py-3">
                        <div className="relative z-10 w-12 h-12 flex-shrink-0 flex items-center justify-center">
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center border-2 cursor-pointer transition-all hover:scale-110',
                            changeTypeColors[log.type] || 'bg-slate-500/10 border-slate-500/30 text-slate-400'
                          )}
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          >
                            {changeTypeIcons[log.type] || <Settings size={14} />}
                          </div>
                        </div>
                        
                        <div 
                          className={cn(
                            'flex-1 rounded-lg p-4 border hover:border-slate-700 transition-all cursor-pointer',
                            isExpanded ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-800/40 border-slate-800/60 hover:bg-slate-800/60'
                          )}
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-white">{log.resourceName}</span>
                              <TagBadge 
                                label="" 
                                value={getChangeTypeName(log.type)} 
                                variant={changeTypeBadgeVariants[log.type] || 'cyan'}
                                size="sm"
                              />
                              {(log as any).reason && (
                                <span className="text-xs text-slate-400 bg-slate-700/40 px-2 py-0.5 rounded truncate max-w-[200px]">
                                  {(log as any).reason}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                              <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                                {time}
                              </span>
                              <ChevronDown size={14} className={cn('text-slate-500 transition-transform', isExpanded && 'rotate-180')} />
                            </div>
                          </div>
                          
                          {hasValidContent ? (
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-500">变更前</span>
                                <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded max-w-[180px] truncate">
                                  {oldVal}
                                </span>
                              </div>
                              <ArrowRight size={14} className="text-slate-600 flex-shrink-0" />
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-500">变更后</span>
                                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 max-w-[180px] truncate">
                                  {newVal}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 ml-auto">
                                操作人：{log.operator}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end">
                              <span className="text-xs text-slate-500">
                                操作人：{log.operator}
                              </span>
                            </div>
                          )}

                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-slate-700/50 animate-fade-in-up">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-[11px] text-slate-500 mb-2">变更信息</div>
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-400">变更类型</span>
                                      <span className="text-slate-200">{getChangeTypeName(log.type)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-400">操作人</span>
                                      <span className="text-slate-200">{log.operator}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-400">变更时间</span>
                                      <span className="text-slate-200">{time}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-400">资源ID</span>
                                      <span className="text-slate-200 font-mono text-[11px]">{log.resourceId}</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[11px] text-slate-500 mb-2">关联资源</div>
                                  {relatedResource ? (
                                    <div 
                                      className="p-2.5 rounded-lg bg-slate-700/30 border border-slate-700/50 hover:bg-slate-700/50 cursor-pointer transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedResource(relatedResource.id);
                                        toggleDetailPanel(true);
                                      }}
                                    >
                                      <div className="text-xs font-medium text-white">{relatedResource.name}</div>
                                      <div className="text-[11px] text-slate-500 mt-0.5">{getResourceTypeName(relatedResource.type)} · {relatedResource.status}</div>
                                      <div className="text-[11px] text-cyan-400 mt-1">点击查看资源详情 →</div>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-slate-500">未找到关联资源</div>
                                  )}
                                </div>
                              </div>

                              {log.type === 'task_create' && (
                                <div className="mt-4 pt-3 border-t border-slate-700/50">
                                  <div className="text-[11px] text-slate-500 mb-2">关联任务</div>
                                  <div className="p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                                    <div className="text-xs text-violet-400 font-medium">{newVal}</div>
                                    <div className="text-[11px] text-slate-400 mt-1">可在「待整理任务」页查看详情</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Filter size={14} className="text-cyan-400" />
                任务筛选
              </h4>
              <span className="text-xs text-slate-500">
                共 {filteredTasks.length} 个任务
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1.5">任务类型</label>
                <select
                  value={taskFilterType}
                  onChange={(e) => setTaskFilterType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                >
                  {Array.from(new Set(taskTypes.map(t => t.label))).map(label => {
                    const first = taskTypes.find(t => t.label === label);
                    return <option key={first?.key} value={first?.key}>{label}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1.5">优先级</label>
                <select
                  value={taskFilterPriority}
                  onChange={(e) => setTaskFilterPriority(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                >
                  {taskPriorities.map(p => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1.5">负责人</label>
                <select
                  value={taskFilterAssignee}
                  onChange={(e) => setTaskFilterAssignee(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="all">全部负责人</option>
                  {assignees.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1.5">状态</label>
                <select
                  value={taskFilterStatus}
                  onChange={(e) => setTaskFilterStatus(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="all">全部状态</option>
                  <option value="pending">待处理</option>
                  <option value="in_progress">进行中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'in_progress', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setTaskFilterStatus(status)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-lg font-medium transition-all border',
                  taskFilterStatus === status
                    ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                    : 'bg-transparent text-slate-400 hover:text-slate-200 border-slate-700 hover:border-slate-600'
                )}
              >
                {status === 'all' ? '全部任务' : getStatusName(status)}
              </button>
            ))}
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus size={16} />
              创建任务
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredTasks.map((task) => {
              const relatedResources = resources.filter(r => task.resourceIds.includes(r.id));
              const relatedApps = new Set(relatedResources.map(r => applications.find(a => a.id === r.appId)?.name).filter(Boolean));
              const assignee = task.assignee || '未指定';
              const formattedCreated = task.createdAt ? formatTimestamp(task.createdAt) : '';
              const formattedDue = task.dueDate ? formatTimestamp(task.dueDate) : '';
              const taskTypeLabel = getTaskTypeName(task.type);
              const taskTypeColor = task.type === 'idle' || task.type === 'idle_cleanup' ? 'amber' :
                                    task.type === 'risk' || task.type === 'risk_fix' ? 'rose' :
                                    task.type === 'tag_missing' || task.type === 'tag_complete' ? 'cyan' : 'violet';
              
              return (
                <div 
                  key={task.id}
                  className={cn(
                    'bg-slate-900/60 border rounded-xl p-5 card-hover transition-all',
                    task.status === 'completed' ? 'border-emerald-500/20 opacity-75' : 'border-slate-800'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className={cn(
                          'text-base font-semibold',
                          task.status === 'completed' ? 'text-slate-400 line-through' : 'text-white'
                        )}>
                          {task.title}
                        </h4>
                        <span className={cn(
                          'px-2 py-0.5 text-[11px] font-medium rounded border',
                          priorityColors[task.priority]
                        )}>
                          {getPriorityName(task.priority)}
                        </span>
                        <span className={cn(
                          'px-2 py-0.5 text-[11px] font-medium rounded border',
                          taskTypeColor === 'amber' && 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                          taskTypeColor === 'rose' && 'bg-rose-500/15 text-rose-400 border-rose-500/30',
                          taskTypeColor === 'cyan' && 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
                          taskTypeColor === 'violet' && 'bg-violet-500/15 text-violet-400 border-violet-500/30'
                        )}>
                          {taskTypeLabel}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-slate-400 mb-3">{task.description}</p>
                      )}
                      
                      <div className="flex items-center gap-5 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} />
                          创建于 {formattedCreated}
                        </span>
                        {formattedDue && (
                          <span className="flex items-center gap-1.5">
                            <Clock size={12} />
                            截止 {formattedDue}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <User size={12} />
                          负责人：<span className="text-slate-300">{assignee}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <ListTodo size={12} />
                          关联 {task.resourceIds.length} 个资源
                        </span>
                        {relatedApps.size > 0 && (
                          <span className="flex items-center gap-1.5">
                            <TagIcon size={12} />
                            业务：<span className="text-slate-300">{Array.from(relatedApps).join('、')}</span>
                          </span>
                        )}
                      </div>

                      {relatedResources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-800">
                          <div className="text-[11px] text-slate-500 mb-2">关联资源：</div>
                          <div className="flex flex-wrap gap-1.5">
                            {relatedResources.slice(0, 6).map(r => (
                              <span 
                                key={r.id} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-slate-800 text-slate-300 rounded-md border border-slate-700">
                                {r.isRisk && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-0.5"></span>}
                                {r.isIdle && !r.isRisk && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-0.5"></span>}
                                {r.name}
                              </span>
                            ))}
                            {relatedResources.length > 6 && (
                              <span className="inline-flex items-center px-2 py-1 text-[11px] bg-slate-800 text-slate-400 rounded-md border border-slate-700">
                              +{relatedResources.length - 6} 个
                            </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <StatusBadge status={task.status} />
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>

                  {task.status !== 'completed' && (
                    <div className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                          className="px-3 py-1.5 text-xs bg-cyan-500/15 text-cyan-400 rounded-md hover:bg-cyan-500/25 transition-colors font-medium"
                        >
                          开始处理
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                          className="px-3 py-1.5 text-xs bg-emerald-500/15 text-emerald-400 rounded-md hover:bg-emerald-500/25 transition-colors font-medium"
                        >
                          标记完成
                        </button>
                      )}
                      <button className="px-3 py-1.5 text-xs bg-slate-700/50 text-slate-400 rounded-md hover:bg-slate-700 transition-colors">
                        查看详情
                      </button>
                      <button className="px-3 py-1.5 text-xs bg-slate-700/50 text-slate-400 rounded-md hover:bg-slate-700 transition-colors ml-auto">
                        分配给...
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredTasks.length === 0 && (
              <div className="py-16 text-center bg-slate-900/60 border border-slate-800 rounded-xl">
                <ListTodo size={40} className="mx-auto text-slate-700 mb-3" />
                <p className="text-sm text-slate-500">暂无符合条件的任务，通过资源详情或标签治理生成整理任务</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
