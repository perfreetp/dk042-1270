export type CloudProvider = 'aliyun' | 'aws' | 'tencent' | 'huawei';

export type ResourceType = 'ecs' | 'oss' | 'slb' | 'rds' | 'redis' | 'vpc' | 'eip';

export type ResourceStatus = 'running' | 'stopped' | 'idle' | 'error';

export type TaskType = 'idle_cleanup' | 'tag_complete' | 'risk_fix' | 'idle' | 'risk' | 'tag_missing' | 'other';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type TaskPriority = 'high' | 'medium' | 'low';

export type ChangeType = 'owner_change' | 'tag_change' | 'status_change' | 'tag_update' | 'task_create' | 'app_change';

export interface Tag {
  key: string;
  value: string;
}

export interface CloudAccount {
  id: string;
  name: string;
  provider: CloudProvider;
  status: 'active' | 'suspended';
  regionCount: number;
  resourceCount: number;
  monthlyCost: number;
}

export interface Region {
  id: string;
  accountId: string;
  name: string;
  nameEn: string;
  appCount: number;
  resourceCount: number;
}

export interface Application {
  id: string;
  regionId: string;
  name: string;
  department: string;
  owner: string;
  resourceCount: number;
  monthlyCost: number;
}

export interface CloudResource {
  id: string;
  appId: string;
  accountId: string;
  regionId: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  ip?: string;
  tags: Tag[];
  createdAt: string;
  monthlyCost: number;
  isIdle: boolean;
  isRisk: boolean;
  riskReason?: string;
  spec?: string;
}

export interface CostRecord {
  month: string;
  amount: number;
  accountId?: string;
  regionId?: string;
  appId?: string;
  resourceType?: string;
}

export interface ChangeLog {
  id: string;
  resourceId: string;
  resourceName: string;
  type: ChangeType;
  before: string;
  after: string;
  operator: string;
  time: string;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  assignee?: string;
  resourceIds: string[];
  createdAt: string;
  dueDate?: string;
  priority: TaskPriority;
  description?: string;
}

export interface FilterState {
  accountIds: string[];
  regionIds: string[];
  appIds: string[];
  resourceTypes: ResourceType[];
  searchKeyword: string;
  status?: ResourceStatus;
}

export interface TopologyNode {
  id: string;
  type: 'account' | 'region' | 'app' | 'resource';
  name: string;
  x: number;
  y: number;
  level: number;
  data?: CloudAccount | Region | Application | CloudResource;
}

export interface TopologyLink {
  source: string;
  target: string;
}
