export function formatCurrency(amount: number): string {
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(2)}万`;
  }
  return `¥${amount.toLocaleString()}`;
}

export function formatNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return num.toLocaleString();
}

export function formatDate(dateStr: string): string {
  return dateStr;
}

export function getResourceTypeName(type: string): string {
  const names: Record<string, string> = {
    ecs: '云服务器',
    oss: '对象存储',
    slb: '负载均衡',
    rds: '云数据库',
    redis: '云缓存',
    vpc: '专有网络',
    eip: '弹性公网IP',
  };
  return names[type] || type;
}

export function getStatusName(status: string): string {
  const names: Record<string, string> = {
    running: '运行中',
    stopped: '已停止',
    idle: '闲置',
    error: '异常',
    active: '活跃',
    suspended: '已暂停',
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
  };
  return names[status] || status;
}

export function getProviderName(provider: string): string {
  const names: Record<string, string> = {
    aliyun: '阿里云',
    aws: 'AWS',
    tencent: '腾讯云',
    huawei: '华为云',
  };
  return names[provider] || provider;
}

export function getTaskTypeName(type: string): string {
  const names: Record<string, string> = {
    idle_cleanup: '闲置清理',
    tag_complete: '标签补全',
    risk_fix: '风险修复',
  };
  return names[type] || type;
}

export function getPriorityName(priority: string): string {
  const names: Record<string, string> = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级',
  };
  return names[priority] || priority;
}
