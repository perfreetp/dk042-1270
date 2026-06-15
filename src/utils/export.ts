import type { CloudResource } from '@/types';
import { applications } from '@/data/mockData';
import { getResourceTypeName, getStatusName, formatCurrency } from './format';

interface DepartmentSummary {
  department: string;
  owner: string;
  apps: string[];
  resourceCount: number;
  totalCost: number;
  idleCount: number;
  riskCount: number;
  resources: CloudResource[];
}

export function exportToCSV(resources: CloudResource[], filename = 'resources.csv') {
  const headers = ['资源ID', '资源名称', '资源类型', '状态', 'IP地址', '所属应用', '负责人', '用途', '月费用', '创建时间'];
  
  const rows = resources.map(r => {
    const ownerTag = r.tags.find(t => t.key === 'Owner');
    const usageTag = r.tags.find(t => t.key === 'Usage');
    const app = applications.find(a => a.id === r.appId);
    return [
      r.id,
      r.name,
      getResourceTypeName(r.type),
      getStatusName(r.status),
      r.ip || '-',
      app?.name || r.appId,
      ownerTag?.value || '未标记',
      usageTag?.value || '未标记',
      `¥${r.monthlyCost}`,
      r.createdAt,
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function getDepartmentSummary(resources: CloudResource[]): DepartmentSummary[] {
  const deptMap = new Map<string, DepartmentSummary>();

  resources.forEach(resource => {
    const app = applications.find(a => a.id === resource.appId);
    if (!app) return;

    const department = app.department;
    if (!deptMap.has(department)) {
      deptMap.set(department, {
        department,
        owner: app.owner,
        apps: [],
        resourceCount: 0,
        totalCost: 0,
        idleCount: 0,
        riskCount: 0,
        resources: [],
      });
    }

    const summary = deptMap.get(department)!;
    if (!summary.apps.includes(app.name)) {
      summary.apps.push(app.name);
    }
    if (summary.owner !== app.owner) {
      summary.owner = '多位负责人';
    }
    summary.resourceCount++;
    summary.totalCost += resource.monthlyCost;
    if (resource.isIdle) summary.idleCount++;
    if (resource.isRisk) summary.riskCount++;
    summary.resources.push(resource);
  });

  return Array.from(deptMap.values()).sort((a, b) => b.totalCost - a.totalCost);
}

export function exportDepartmentSummary(resources: CloudResource[], filename = '部门资源清单.csv') {
  const summaries = getDepartmentSummary(resources);
  
  const headers = [
    '部门名称', 
    '部门负责人', 
    '涉及业务系统', 
    '资源总数', 
    '月费用合计', 
    '闲置资源数', 
    '风险资源数',
    '闲置月费用',
    '风险月费用',
  ];
  
  const rows = summaries.map(summary => {
    const idleCost = summary.resources.filter(r => r.isIdle).reduce((sum, r) => sum + r.monthlyCost, 0);
    const riskCost = summary.resources.filter(r => r.isRisk).reduce((sum, r) => sum + r.monthlyCost, 0);
    
    return [
      summary.department,
      summary.owner,
      summary.apps.join('；'),
      summary.resourceCount,
      `¥${summary.totalCost.toLocaleString()}`,
      summary.idleCount,
      summary.riskCount,
      `¥${idleCost.toLocaleString()}`,
      `¥${riskCost.toLocaleString()}`,
    ];
  });

  const totalRow = [
    '合计',
    '-',
    '-',
    summaries.reduce((sum, s) => sum + s.resourceCount, 0),
    `¥${summaries.reduce((sum, s) => sum + s.totalCost, 0).toLocaleString()}`,
    summaries.reduce((sum, s) => sum + s.idleCount, 0),
    summaries.reduce((sum, s) => sum + s.riskCount, 0),
    '-',
    '-',
  ];

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    totalRow.map(cell => `"${cell}"`).join(','),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
