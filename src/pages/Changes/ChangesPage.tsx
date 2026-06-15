import { useState } from 'react';
import { 
  History, ListTodo, Clock, User, Tag, Settings,
  ChevronDown, ChevronRight, CheckCircle2, AlertCircle, 
  MoreHorizontal, Plus, Filter, ArrowRight, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResourceStore } from '@/store/useResourceStore';
import { getTaskTypeName, getPriorityName, getStatusName } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge';
import TagBadge from '@/components/TagBadge';

type TabType = 'changes' | 'tasks';

const changeTypeIcons: Record<string, React.ReactNode> = {
  owner_change: <User size={14} />,
  tag_change: <Tag size={14} />,
  status_change: <Settings size={14} />,
};

const changeTypeLabels: Record<string, string> = {
  owner_change: '负责人变更',
  tag_change: '标签变更',
  status_change: '状态变更',
};

const priorityColors: Record<string, string> = {
  high: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function ChangesPage() {
  const { changeLogs, tasks, updateTaskStatus } = useResourceStore();
  const [activeTab, setActiveTab] = useState<TabType>('changes');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = filterType === 'all' 
    ? changeLogs 
    : changeLogs.filter(log => log.type === filterType);

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

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
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">变更历史</h3>
              <p className="text-xs text-slate-500 mt-0.5">资源归属、标签、状态等变更记录</p>
            </div>
            <div className="flex items-center gap-2">
              {['all', 'owner_change', 'tag_change', 'status_change'].map((type) => (
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
                  {type === 'all' ? '全部' : changeTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-800" />
              
              <div className="space-y-1">
                {filteredLogs.map((log, idx) => (
                  <div key={log.id} className="relative flex gap-4 py-3">
                    <div className="relative z-10 w-12 h-12 flex-shrink-0 flex items-center justify-center">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2',
                        log.type === 'owner_change' && 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
                        log.type === 'tag_change' && 'bg-amber-500/10 border-amber-500/30 text-amber-400',
                        log.type === 'status_change' && 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                      )}>
                        {changeTypeIcons[log.type]}
                      </div>
                    </div>
                    
                    <div className="flex-1 bg-slate-800/40 rounded-lg p-4 border border-slate-800/60 hover:bg-slate-800/60 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-sm font-medium text-white">{log.resourceName}</span>
                          <TagBadge 
                            label="" 
                            value={changeTypeLabels[log.type]} 
                            variant={log.type === 'owner_change' ? 'cyan' : log.type === 'tag_change' ? 'amber' : 'emerald'}
                            size="sm"
                          />
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{log.time}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
                          {log.before}
                        </span>
                        <ArrowRight size={14} className="text-slate-600" />
                        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                          {log.after}
                        </span>
                        <span className="text-xs text-slate-500 ml-auto">
                          操作人：{log.operator}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {['all', 'pending', 'in_progress', 'completed'].map((status) => (
                <button
                  key={status}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-lg font-medium transition-all border',
                    status === 'all'
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
            {tasks.map((task) => (
              <div 
                key={task.id}
                className={cn(
                  'bg-slate-900/60 border rounded-xl p-5 card-hover transition-all',
                  task.status === 'completed' ? 'border-emerald-500/20 opacity-75' : 'border-slate-800'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
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
                      <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-slate-700/50 text-slate-400 border border-slate-600/50">
                        {getTaskTypeName(task.type)}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-slate-400 mb-3">{task.description}</p>
                    )}
                    
                    <div className="flex items-center gap-5 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        创建于 {task.createdAt}
                      </span>
                      {task.dueDate && (
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} />
                          截止 {task.dueDate}
                        </span>
                      )}
                      {task.assignee && (
                        <span className="flex items-center gap-1.5">
                          <User size={12} />
                          负责人：{task.assignee}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <ListTodo size={12} />
                        {task.resourceIds.length} 个资源
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
