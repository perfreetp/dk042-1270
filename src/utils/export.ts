import type { CloudResource } from '@/types';
import { getResourceTypeName, getStatusName } from './format';

export function exportToCSV(resources: CloudResource[], filename = 'resources.csv') {
  const headers = ['资源ID', '资源名称', '资源类型', '状态', 'IP地址', '所属应用', '负责人', '用途', '月费用', '创建时间'];
  
  const rows = resources.map(r => {
    const ownerTag = r.tags.find(t => t.key === 'Owner');
    const usageTag = r.tags.find(t => t.key === 'Usage');
    return [
      r.id,
      r.name,
      getResourceTypeName(r.type),
      getStatusName(r.status),
      r.ip || '-',
      r.appId,
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
