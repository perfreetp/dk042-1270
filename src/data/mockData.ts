import type { CloudAccount, Region, Application, CloudResource, CostRecord, ChangeLog, Task, Tag } from '@/types';

const commonTags: Tag[] = [
  { key: 'Environment', value: 'Production' },
  { key: 'Department', value: '技术部' },
  { key: 'Owner', value: '张三' },
  { key: 'Usage', value: '业务系统' },
];

export const cloudAccounts: CloudAccount[] = [
  { id: 'acc-1', name: '生产主账号', provider: 'aliyun', status: 'active', regionCount: 4, resourceCount: 156, monthlyCost: 128500 },
  { id: 'acc-2', name: '测试账号', provider: 'aliyun', status: 'active', regionCount: 2, resourceCount: 48, monthlyCost: 15600 },
  { id: 'acc-3', name: 'AWS 海外账号', provider: 'aws', status: 'active', regionCount: 3, resourceCount: 89, monthlyCost: 78900 },
  { id: 'acc-4', name: '腾讯云账号', provider: 'tencent', status: 'active', regionCount: 2, resourceCount: 35, monthlyCost: 23400 },
];

export const regions: Region[] = [
  { id: 'reg-1', accountId: 'acc-1', name: '华东1(杭州)', nameEn: 'cn-hangzhou', appCount: 12, resourceCount: 68 },
  { id: 'reg-2', accountId: 'acc-1', name: '华北2(北京)', nameEn: 'cn-beijing', appCount: 8, resourceCount: 45 },
  { id: 'reg-3', accountId: 'acc-1', name: '华南1(深圳)', nameEn: 'cn-shenzhen', appCount: 6, resourceCount: 32 },
  { id: 'reg-4', accountId: 'acc-1', name: '华东2(上海)', nameEn: 'cn-shanghai', appCount: 4, resourceCount: 11 },
  { id: 'reg-5', accountId: 'acc-2', name: '华东1(杭州)', nameEn: 'cn-hangzhou', appCount: 5, resourceCount: 32 },
  { id: 'reg-6', accountId: 'acc-2', name: '华北2(北京)', nameEn: 'cn-beijing', appCount: 3, resourceCount: 16 },
  { id: 'reg-7', accountId: 'acc-3', name: 'US East', nameEn: 'us-east-1', appCount: 5, resourceCount: 42 },
  { id: 'reg-8', accountId: 'acc-3', name: 'US West', nameEn: 'us-west-2', appCount: 4, resourceCount: 28 },
  { id: 'reg-9', accountId: 'acc-3', name: 'Singapore', nameEn: 'ap-southeast-1', appCount: 3, resourceCount: 19 },
  { id: 'reg-10', accountId: 'acc-4', name: '广州', nameEn: 'ap-guangzhou', appCount: 4, resourceCount: 22 },
  { id: 'reg-11', accountId: 'acc-4', name: '上海', nameEn: 'ap-shanghai', appCount: 2, resourceCount: 13 },
];

export const applications: Application[] = [
  { id: 'app-1', regionId: 'reg-1', name: '电商交易系统', department: '电商事业部', owner: '李明', resourceCount: 18, monthlyCost: 28500 },
  { id: 'app-2', regionId: 'reg-1', name: '用户中心', department: '用户平台部', owner: '王芳', resourceCount: 12, monthlyCost: 15600 },
  { id: 'app-3', regionId: 'reg-1', name: '订单服务', department: '电商事业部', owner: '张伟', resourceCount: 15, monthlyCost: 22400 },
  { id: 'app-4', regionId: 'reg-2', name: '大数据分析平台', department: '数据部', owner: '刘强', resourceCount: 22, monthlyCost: 45800 },
  { id: 'app-5', regionId: 'reg-2', name: 'CRM 系统', department: '销售部', owner: '陈静', resourceCount: 8, monthlyCost: 8900 },
  { id: 'app-6', regionId: 'reg-3', name: '内容管理系统', department: '运营部', owner: '赵丽', resourceCount: 10, monthlyCost: 12300 },
  { id: 'app-7', regionId: 'reg-7', name: '海外电商', department: '国际事业部', owner: '周杰', resourceCount: 20, monthlyCost: 35600 },
  { id: 'app-8', regionId: 'reg-10', name: '微信小程序后端', department: '产品部', owner: '吴磊', resourceCount: 12, monthlyCost: 14500 },
];

const resourceNames = {
  ecs: ['web-server', 'app-server', 'db-proxy', 'cache-node', 'worker-node', 'api-gateway', 'task-scheduler'],
  oss: ['image-bucket', 'log-bucket', 'backup-bucket', 'static-assets', 'user-uploads'],
  slb: ['public-lb', 'internal-lb', 'api-lb', 'admin-lb'],
  rds: ['primary-db', 'readonly-db', 'analytics-db', 'cache-db'],
  redis: ['session-cache', 'data-cache', 'queue-redis', 'rate-limit-redis'],
  vpc: ['main-vpc', 'test-vpc', 'isolated-vpc'],
  eip: ['eip-gateway', 'eip-nat', 'eip-bastion'],
};

function generateResources(): CloudResource[] {
  const resources: CloudResource[] = [];
  let idCounter = 1;

  applications.forEach((app) => {
    const types: Array<'ecs' | 'oss' | 'slb' | 'rds' | 'redis' | 'vpc' | 'eip'> = ['ecs', 'oss', 'slb', 'rds', 'redis'];
    
    types.forEach((type) => {
      const count = type === 'ecs' ? Math.floor(Math.random() * 4) + 2 : 1;
      for (let i = 0; i < count; i++) {
        const names = resourceNames[type];
        const name = `${names[i % names.length]}-${app.name.slice(0, 4).toLowerCase()}`;
        const isIdle = Math.random() < 0.15;
        const isRisk = Math.random() < 0.1;
        const hasOwner = Math.random() > 0.2;
        const hasUsage = Math.random() > 0.25;

        const tags: Tag[] = [
          { key: 'AppName', value: app.name },
        ];
        if (hasOwner) tags.push({ key: 'Owner', value: app.owner });
        if (hasUsage) tags.push({ key: 'Usage', value: ['核心业务', '测试环境', '数据分析', '辅助工具'][Math.floor(Math.random() * 4)] });
        tags.push({ key: 'Environment', value: app.id.includes('test') ? 'Test' : 'Production' });

        const status = isIdle ? 'idle' : (Math.random() > 0.1 ? 'running' : 'stopped');

        const region = regions.find(r => r.id === app.regionId);

        resources.push({
          id: `res-${String(idCounter).padStart(4, '0')}`,
          appId: app.id,
          accountId: region?.accountId || 'acc-1',
          regionId: app.regionId,
          name,
          type,
          status,
          ip: type === 'ecs' || type === 'eip' ? `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}` : undefined,
          tags,
          createdAt: `202${3 + Math.floor(Math.random() * 3)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
          monthlyCost: Math.floor(Math.random() * 5000) + 200,
          isIdle,
          isRisk,
          riskReason: isRisk ? ['公网 IP 未绑定安全组', '安全组规则开放 0.0.0.0/0', '密钥对过期未轮换'][Math.floor(Math.random() * 3)] : undefined,
          spec: type === 'ecs' ? ['ecs.g6.large', 'ecs.g6.xlarge', 'ecs.c6.large'][Math.floor(Math.random() * 3)] : undefined,
        });
        idCounter++;
      }
    });
  });

  return resources;
}

export const resources: CloudResource[] = generateResources();

export const costRecords: CostRecord[] = [
  { month: '2025-07', amount: 185000 },
  { month: '2025-08', amount: 192000 },
  { month: '2025-09', amount: 178000 },
  { month: '2025-10', amount: 210000 },
  { month: '2025-11', amount: 205000 },
  { month: '2025-12', amount: 228000 },
  { month: '2026-01', amount: 215000 },
  { month: '2026-02', amount: 198000 },
  { month: '2026-03', amount: 225000 },
  { month: '2026-04', amount: 238000 },
  { month: '2026-05', amount: 245000 },
  { month: '2026-06', amount: 246400 },
];

export const costByType = [
  { type: 'ecs', name: '云服务器 ECS', amount: 98560, percentage: 40 },
  { type: 'rds', name: '云数据库 RDS', amount: 49280, percentage: 20 },
  { type: 'oss', name: '对象存储 OSS', amount: 24640, percentage: 10 },
  { type: 'redis', name: '云数据库 Redis', amount: 19712, percentage: 8 },
  { type: 'slb', name: '负载均衡 SLB', amount: 14784, percentage: 6 },
  { type: 'eip', name: '弹性公网 IP', amount: 9856, percentage: 4 },
  { type: 'other', name: '其他', amount: 29568, percentage: 12 },
];

export const changeLogs: ChangeLog[] = [
  { id: 'ch-1', resourceId: 'res-0001', resourceName: 'web-server-电商交', type: 'owner_change', before: '张三', after: '李四', operator: '管理员', time: '2026-06-14 10:30:00' },
  { id: 'ch-2', resourceId: 'res-0005', resourceName: 'db-proxy-电商交', type: 'tag_change', before: 'Usage: 未标记', after: 'Usage: 核心业务', operator: '管理员', time: '2026-06-13 16:45:00' },
  { id: 'ch-3', resourceId: 'res-0010', resourceName: 'primary-db-用户中', type: 'status_change', before: 'running', after: 'stopped', operator: '王五', time: '2026-06-12 09:15:00' },
  { id: 'ch-4', resourceId: 'res-0015', resourceName: 'cache-node-订单服', type: 'tag_change', before: 'Department: 未标记', after: 'Department: 电商事业部', operator: '管理员', time: '2026-06-11 14:20:00' },
  { id: 'ch-5', resourceId: 'res-0020', resourceName: 'api-gateway-大数据', type: 'owner_change', before: '赵六', after: '钱七', operator: '管理员', time: '2026-06-10 11:00:00' },
  { id: 'ch-6', resourceId: 'res-0025', resourceName: 'image-bucket-CRM ', type: 'tag_change', before: 'Environment: 未标记', after: 'Environment: Production', operator: '陈静', time: '2026-06-09 15:30:00' },
  { id: 'ch-7', resourceId: 'res-0030', resourceName: 'log-bucket-内容管', type: 'status_change', before: 'idle', after: 'running', operator: '赵丽', time: '2026-06-08 10:45:00' },
  { id: 'ch-8', resourceId: 'res-0035', resourceName: 'public-lb-海外电', type: 'owner_change', before: '孙八', after: '周杰', operator: '管理员', time: '2026-06-07 16:00:00' },
];

export const tasks: Task[] = [
  {
    id: 'task-1',
    title: '清理华东1区闲置 ECS 实例',
    type: 'idle_cleanup',
    status: 'pending',
    resourceIds: ['res-0003', 'res-0007', 'res-0012'],
    createdAt: '2026-06-10',
    dueDate: '2026-06-20',
    priority: 'high',
    description: '共 3 台闲置超过 30 天的 ECS 实例，建议确认后释放',
  },
  {
    id: 'task-2',
    title: '补全测试账号资源负责人标签',
    type: 'tag_complete',
    status: 'in_progress',
    assignee: '张三',
    resourceIds: ['res-0040', 'res-0041', 'res-0042', 'res-0043', 'res-0044'],
    createdAt: '2026-06-08',
    dueDate: '2026-06-18',
    priority: 'medium',
    description: '测试账号下 5 个资源缺少负责人标签，需补充',
  },
  {
    id: 'task-3',
    title: '修复公网 IP 安全组风险',
    type: 'risk_fix',
    status: 'pending',
    resourceIds: ['res-0050', 'res-0055'],
    createdAt: '2026-06-12',
    dueDate: '2026-06-15',
    priority: 'high',
    description: '2 个公网 IP 安全组开放 0.0.0.0/0，存在高风险',
  },
  {
    id: 'task-4',
    title: '标记电商事业部闲置存储',
    type: 'idle_cleanup',
    status: 'completed',
    assignee: '李明',
    resourceIds: ['res-0060', 'res-0062'],
    createdAt: '2026-06-01',
    dueDate: '2026-06-05',
    priority: 'low',
    description: '已清理 2 个闲置 OSS bucket，节省月费 ¥320',
  },
  {
    id: 'task-5',
    title: '补充业务系统用途标签',
    type: 'tag_complete',
    status: 'pending',
    resourceIds: ['res-0070', 'res-0071', 'res-0072', 'res-0073'],
    createdAt: '2026-06-14',
    dueDate: '2026-06-25',
    priority: 'medium',
    description: '4 个资源缺少用途标签，需要业务部门确认',
  },
];
