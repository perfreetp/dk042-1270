import { create } from 'zustand';
import type { CloudResource, Task, ChangeLog } from '@/types';
import { resources as mockResources, tasks as mockTasks, changeLogs as mockChangeLogs } from '@/data/mockData';

interface ResourceStore {
  resources: CloudResource[];
  tasks: Task[];
  changeLogs: ChangeLog[];
  selectedResourceId: string | null;
  showDetailPanel: boolean;
  
  setSelectedResource: (id: string | null) => void;
  toggleDetailPanel: (show?: boolean) => void;
  updateResourceTags: (resourceId: string, tags: { key: string; value: string }[]) => void;
  addChangeLog: (log: Omit<ChangeLog, 'id' | 'time'>) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
}

export const useResourceStore = create<ResourceStore>((set) => ({
  resources: mockResources,
  tasks: mockTasks,
  changeLogs: mockChangeLogs,
  selectedResourceId: null,
  showDetailPanel: false,

  setSelectedResource: (id) => set({ selectedResourceId: id, showDetailPanel: id !== null }),
  
  toggleDetailPanel: (show) => set((state) => ({ 
    showDetailPanel: show !== undefined ? show : !state.showDetailPanel 
  })),

  updateResourceTags: (resourceId, tags) => set((state) => {
    const resource = state.resources.find(r => r.id === resourceId);
    const oldTags = resource?.tags || [];
    const oldTagStr = oldTags.map(t => `${t.key}: ${t.value}`).join(', ') || '无标签';
    const newTagStr = tags.map(t => `${t.key}: ${t.value}`).join(', ');

    const newLog = {
      id: `ch-${Date.now()}`,
      resourceId,
      resourceName: resource?.name || resourceId,
      type: 'tag_change' as const,
      before: oldTagStr,
      after: newTagStr,
      operator: '当前用户',
      time: new Date().toLocaleString('zh-CN'),
    };

    return {
      resources: state.resources.map(r =>
        r.id === resourceId ? { ...r, tags } : r
      ),
      changeLogs: [newLog, ...state.changeLogs],
    };
  }),

  addChangeLog: (log) => set((state) => ({
    changeLogs: [
      {
        ...log,
        id: `ch-${Date.now()}`,
        time: new Date().toLocaleString('zh-CN'),
      },
      ...state.changeLogs,
    ],
  })),

  updateTaskStatus: (taskId, status) => set((state) => ({
    tasks: state.tasks.map(t =>
      t.id === taskId ? { ...t, status } : t
    ),
  })),

  addTask: (task) => set((state) => ({
    tasks: [
      {
        ...task,
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      },
      ...state.tasks,
    ],
  })),
}));
