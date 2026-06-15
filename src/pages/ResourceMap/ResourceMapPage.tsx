import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Cloud, Globe, Box, Server, Database, HardDrive, 
  Network as NetworkIcon, Zap, Monitor, 
  ChevronDown, ZoomIn, ZoomOut, Maximize2, 
  Layers, Eye, EyeOff, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { cloudAccounts, regions, applications } from '@/data/mockData';
import { useResourceStore } from '@/store/useResourceStore';
import { useFilterStore } from '@/store/useFilterStore';
import { formatCurrency, getResourceTypeName, getProviderName } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge';
import TagBadge from '@/components/TagBadge';
import ResourceDetailPanel from './ResourceDetailPanel';

const levelColors = {
  account: { bg: 'from-cyan-500 to-cyan-600', border: 'border-cyan-400', text: 'text-cyan-400' },
  region: { bg: 'from-emerald-500 to-emerald-600', border: 'border-emerald-400', text: 'text-emerald-400' },
  app: { bg: 'from-amber-500 to-amber-600', border: 'border-amber-400', text: 'text-amber-400' },
  resource: { bg: 'from-slate-500 to-slate-600', border: 'border-slate-400', text: 'text-slate-400' },
};

const resourceIcons: Record<string, React.ReactNode> = {
  ecs: <Server size={14} />,
  oss: <HardDrive size={14} />,
  slb: <NetworkIcon size={14} />,
  rds: <Database size={14} />,
  redis: <Zap size={14} />,
  vpc: <Globe size={14} />,
  eip: <Monitor size={14} />,
};

interface NodeData {
  id: string;
  type: 'account' | 'region' | 'app' | 'resource';
  name: string;
  x: number;
  y: number;
  data: any;
}

interface LinkData {
  source: string;
  target: string;
}

export default function ResourceMapPage() {
  const { resources, selectedResourceId, setSelectedResource, showDetailPanel, toggleDetailPanel } = useResourceStore();
  const { accountIds, regionIds, appIds, resourceTypes, searchKeyword } = useFilterStore();
  
  const [scale, setScale] = useState(1);
  const [viewMode, setViewMode] = useState<'hierarchy' | 'force'>('hierarchy');
  const [showLabels, setShowLabels] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState<number[]>([0, 1, 2, 3]);
  const svgRef = useRef<SVGSVGElement>(null);

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      if (accountIds.length > 0 && !accountIds.includes(r.accountId)) return false;
      if (regionIds.length > 0 && !regionIds.includes(r.regionId)) return false;
      if (appIds.length > 0 && !appIds.includes(r.appId)) return false;
      if (resourceTypes.length > 0 && !resourceTypes.includes(r.type)) return false;
      if (searchKeyword && !r.name.toLowerCase().includes(searchKeyword.toLowerCase())) return false;
      return true;
    });
  }, [resources, accountIds, regionIds, appIds, resourceTypes, searchKeyword]);

  const { nodes, links } = useMemo(() => {
    if (viewMode === 'hierarchy') {
      const nodes: NodeData[] = [];
      const links: LinkData[] = [];
      
      const levelWidth = 280;
      const verticalGap = 90;
      
      const showAccounts = accountIds.length > 0 ? cloudAccounts.filter(a => accountIds.includes(a.id)) : cloudAccounts;
      let accountY = 100;
      
      showAccounts.forEach((account, accIdx) => {
        const accountNodeId = `acc-${account.id}`;
        nodes.push({
          id: accountNodeId,
          type: 'account',
          name: account.name,
          x: 80,
          y: accountY,
          data: account,
        });
        
        const showRegions = regions.filter(r => r.accountId === account.id && (regionIds.length === 0 || regionIds.includes(r.id)));
        let regionY = accountY - (showRegions.length - 1) * verticalGap / 2;
        
        showRegions.forEach((region, regIdx) => {
          const regionNodeId = `reg-${region.id}`;
          nodes.push({
            id: regionNodeId,
            type: 'region',
            name: region.name,
            x: 80 + levelWidth,
            y: regionY,
            data: region,
          });
          links.push({ source: accountNodeId, target: regionNodeId });
          
          const showApps = applications.filter(a => a.regionId === region.id && (appIds.length === 0 || appIds.includes(a.id)));
          let appY = regionY - (showApps.length - 1) * verticalGap / 2;
          
          showApps.forEach((app, appIdx) => {
            const appNodeId = `app-${app.id}`;
            nodes.push({
              id: appNodeId,
              type: 'app',
              name: app.name,
              x: 80 + levelWidth * 2,
              y: appY,
              data: app,
            });
            links.push({ source: regionNodeId, target: appNodeId });
            
            const appResources = filteredResources.filter(r => r.appId === app.id);
            let resY = appY - (Math.min(appResources.length, 8) - 1) * 40 / 2;
            
            appResources.slice(0, 8).forEach((res, resIdx) => {
              const resNodeId = `res-${res.id}`;
              nodes.push({
                id: resNodeId,
                type: 'resource',
                name: res.name,
                x: 80 + levelWidth * 3,
                y: resY + resIdx * 40,
                data: res,
              });
              links.push({ source: appNodeId, target: resNodeId });
            });
            
            appY += verticalGap;
          });
          
          regionY += verticalGap;
        });
        
        accountY += Math.max(showRegions.length, 1) * verticalGap * 1.5;
      });
      
      return { nodes, links };
    } else {
      const nodes: NodeData[] = [];
      const links: LinkData[] = [];
      
      const showApps = appIds.length > 0 
        ? applications.filter(a => appIds.includes(a.id))
        : applications.filter(a => filteredResources.some(r => r.appId === a.id));
      
      const svgWidth = 1400;
      const svgHeight = 900;
      const centerX = svgWidth / 2;
      const centerY = svgHeight / 2;
      const appCircleRadius = 200;
      const resourceCircleRadius = 100;
      
      showApps.forEach((app, appIdx) => {
        const appAngle = (appIdx / showApps.length) * Math.PI * 2;
        const appX = centerX + Math.cos(appAngle) * appCircleRadius;
        const appY = centerY + Math.sin(appAngle) * appCircleRadius;
        
        const appNodeId = `app-${app.id}`;
        nodes.push({
          id: appNodeId,
          type: 'app',
          name: app.name,
          x: appX,
          y: appY,
          data: app,
        });
        
        const appResources = filteredResources.filter(r => r.appId === app.id);
        const displayResources = appResources.slice(0, 12);
        
        displayResources.forEach((res, resIdx) => {
          const resourceAngle = (resIdx / displayResources.length) * Math.PI * 2;
          const distanceOffset = res.isRisk ? 0 : res.isIdle ? 20 : 0;
          const resX = appX + Math.cos(resourceAngle) * (resourceCircleRadius + distanceOffset);
          const resY = appY + Math.sin(resourceAngle) * (resourceCircleRadius + distanceOffset);
          
          const resNodeId = `res-${res.id}`;
          nodes.push({
            id: resNodeId,
            type: 'resource',
            name: res.name,
            x: resX,
            y: resY,
            data: res,
          });
          links.push({ source: appNodeId, target: resNodeId });
        });
      });
      
      const showAccounts = accountIds.length > 0 ? cloudAccounts.filter(a => accountIds.includes(a.id)) : cloudAccounts;
      showAccounts.forEach((account, accIdx) => {
        const accountX = 60;
        const accountY = 80 + accIdx * 70;
        const accountNodeId = `acc-${account.id}`;
        nodes.push({
          id: accountNodeId,
          type: 'account',
          name: account.name,
          x: accountX,
          y: accountY,
          data: account,
        });
        
        const showRegions = regions.filter(r => r.accountId === account.id && (regionIds.length === 0 || regionIds.includes(r.id)));
        showRegions.forEach((region, regIdx) => {
          const regionNodeId = `reg-${region.id}`;
          nodes.push({
            id: regionNodeId,
            type: 'region',
            name: region.name,
            x: 60,
            y: accountY + 30 + regIdx * 30,
            data: region,
          });
          links.push({ source: accountNodeId, target: regionNodeId });
        });
      });
      
      return { nodes, links };
    }
  }, [filteredResources, accountIds, regionIds, appIds, viewMode]);

  const handleNodeClick = (node: NodeData) => {
    if (node.type === 'resource') {
      setSelectedResource(node.data.id);
    }
  };

  const selectedResource = resources.find(r => r.id === selectedResourceId);

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-4">
      <div className="flex-1 relative bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden">
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-800/80 backdrop-blur rounded-lg border border-slate-700/50">
              <button
                onClick={() => setViewMode('hierarchy')}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-md font-medium transition-all',
                  viewMode === 'hierarchy' 
                    ? 'bg-cyan-500/20 text-cyan-400' 
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Layers size={14} className="inline mr-1.5" />
                层级视图
              </button>
              <button
                onClick={() => setViewMode('force')}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-md font-medium transition-all',
                  viewMode === 'force' 
                    ? 'bg-cyan-500/20 text-cyan-400' 
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <NetworkIcon size={14} className="inline mr-1.5" />
                力导向
              </button>
            </div>
            
            <button
              onClick={() => setShowLabels(!showLabels)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 backdrop-blur rounded-lg border border-slate-700/50 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              {showLabels ? <Eye size={14} /> : <EyeOff size={14} />}
              标签
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 p-1 bg-slate-800/80 backdrop-blur rounded-lg border border-slate-700/50">
              <button
                onClick={() => setScale(s => Math.min(s + 0.1, 2))}
                className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
              >
                <ZoomIn size={14} />
              </button>
              <span className="text-xs text-slate-500 w-12 text-center">{Math.round(scale * 100)}%</span>
              <button
                onClick={() => setScale(s => Math.max(s - 0.1, 0.5))}
                className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
              >
                <ZoomOut size={14} />
              </button>
              <div className="w-px h-4 bg-slate-700 mx-1" />
              <button
                onClick={() => setScale(1)}
                className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
              >
                <Maximize2 size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-4 p-3 bg-slate-800/80 backdrop-blur rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-500" />
            <span className="text-xs text-slate-400">云账号</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-400">区域</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-slate-400">业务系统</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-500" />
            <span className="text-xs text-slate-400">资源</span>
          </div>
          {viewMode === 'force' && (
            <>
              <div className="w-px h-4 bg-slate-700" />
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs text-slate-400">高风险</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs text-slate-400">闲置</span>
              </div>
            </>
          )}
        </div>

        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.08) 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        >
          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{ 
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(6, 182, 212, 0.1)" />
                <stop offset="50%" stopColor="rgba(6, 182, 212, 0.4)" />
                <stop offset="100%" stopColor="rgba(6, 182, 212, 0.1)" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g>
              {links.map((link, idx) => {
                const source = nodes.find(n => n.id === link.source);
                const target = nodes.find(n => n.id === link.target);
                if (!source || !target) return null;
                
                let sourceX = source.x;
                let sourceY = source.y;
                let targetX = target.x;
                let targetY = target.y;
                
                if (viewMode === 'hierarchy') {
                  sourceX += 80;
                  targetX -= 10;
                }
                
                const path = viewMode === 'hierarchy'
                  ? `M ${sourceX} ${sourceY} C ${sourceX + 60} ${sourceY}, ${targetX - 50} ${targetY}, ${targetX} ${targetY}`
                  : `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
                
                return (
                  <path
                    key={idx}
                    d={path}
                    fill="none"
                    stroke="rgba(6, 182, 212, 0.2)"
                    strokeWidth={1.5}
                    className={viewMode === 'hierarchy' ? 'flow-line' : ''}
                  />
                );
              })}
            </g>

            <g>
              {nodes.map((node) => {
                const colors = levelColors[node.type];
                const isSelected = selectedResourceId && node.data?.id === selectedResourceId;
                const isResource = node.type === 'resource';
                const isRisk = isResource && node.data?.isRisk;
                const isIdle = isResource && node.data?.isIdle;
                
                let nodeWidth = isResource ? 120 : 160;
                let nodeHeight = isResource ? 36 : 48;
                let cornerRadius = isResource ? 6 : 8;
                let strokeColor = isSelected ? '#06b6d4' :
                  node.type === 'account' ? 'rgba(6, 182, 212, 0.4)' :
                  node.type === 'region' ? 'rgba(16, 185, 129, 0.4)' :
                  node.type === 'app' ? 'rgba(245, 158, 11, 0.4)' :
                  'rgba(71, 85, 105, 0.4)';
                
                if (viewMode === 'force' && isResource) {
                  nodeWidth = 20;
                  nodeHeight = 20;
                  cornerRadius = 10;
                  if (isRisk) {
                    strokeColor = '#f43f5e';
                  } else if (isIdle) {
                    strokeColor = '#f59e0b';
                  }
                }
                
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => handleNodeClick(node)}
                    className="cursor-pointer"
                  >
                    {viewMode === 'force' && isResource ? (
                      <>
                        <circle
                          cx={0}
                          cy={0}
                          r={isRisk ? 12 : isIdle ? 10 : 8}
                          fill={isRisk ? '#7f1d1d' : isIdle ? '#78350f' : '#1e293b'}
                          stroke={isRisk ? '#f43f5e' : isIdle ? '#f59e0b' : 'rgba(71, 85, 105, 0.6)'}
                          strokeWidth={2}
                          filter={isSelected ? 'url(#glow)' : isRisk || isIdle ? 'url(#glow)' : undefined}
                          className={isRisk ? 'animate-pulse' : 'transition-all duration-200'}
                        />
                        {showLabels && (
                          <text
                            x={isRisk || isIdle ? 18 : 14}
                            y={4}
                            fontSize={10}
                            fill={isRisk ? '#fca5a5' : isIdle ? '#fcd34d' : '#94a3b8'}
                            fontFamily="Inter, sans-serif"
                          >
                            {node.name.length > 12 ? node.name.slice(0, 12) + '...' : node.name}
                          </text>
                        )}
                      </>
                    ) : (
                      <>
                        <rect
                          x={0}
                          y={-nodeHeight / 2}
                          width={nodeWidth}
                          height={nodeHeight}
                          rx={cornerRadius}
                          fill={node.type === 'resource' ? '#1e293b' : '#0f172a'}
                          stroke={strokeColor}
                          strokeWidth={isSelected ? 2 : 1}
                          filter={isSelected ? 'url(#glow)' : undefined}
                          className="transition-all duration-200"
                        />
                        
                        <g transform={`translate(10, 0)`}>
                          <g transform={`translate(0, -${node.type === 'resource' ? 7 : 10})`}>
                            {node.type === 'account' && <Cloud size={16} className="text-cyan-400" />}
                            {node.type === 'region' && <Globe size={16} className="text-emerald-400" />}
                            {node.type === 'app' && <Box size={16} className="text-amber-400" />}
                            {node.type === 'resource' && (
                              <span className={colors.text}>{resourceIcons[node.data.type] || <Server size={12} />}</span>
                            )}
                          </g>
                        </g>
                        
                        {showLabels && (
                          <g transform={`translate(${node.type === 'resource' ? 32 : 36}, -4)`}>
                            <text
                              x={0}
                              y={0}
                              fontSize={node.type === 'resource' ? 11 : 12}
                              fill={node.type === 'resource' ? '#94a3b8' : '#e2e8f0'}
                              fontFamily="Inter, sans-serif"
                              fontWeight={node.type === 'resource' ? 400 : 500}
                            >
                              {node.name.length > (node.type === 'resource' ? 10 : 12) ? node.name.slice(0, node.type === 'resource' ? 10 : 12) + '...' : node.name}
                            </text>
                            {node.type !== 'resource' && (
                              <text
                                x={0}
                                y={16}
                                fontSize={10}
                                fill="#64748b"
                                fontFamily="Inter, sans-serif"
                              >
                                {node.type === 'account' ? `${node.data.regionCount} 区域 · ${node.data.resourceCount} 资源` :
                                 node.type === 'region' ? `${node.data.appCount} 应用` :
                                 `${node.data.resourceCount} 资源 · ¥${(node.data.monthlyCost / 1000).toFixed(1)}k`}
                              </text>
                            )}
                          </g>
                        )}
                        
                        {node.type === 'resource' && node.data?.isRisk && (
                          <circle
                            cx={nodeWidth - 8}
                            cy={-nodeHeight / 2 + 8}
                            r={5}
                            fill="#f43f5e"
                            className="animate-pulse"
                          />
                        )}
                        {node.type === 'resource' && node.data?.isIdle && (
                          <circle
                            cx={nodeWidth - 8}
                            cy={nodeHeight / 2 - 8}
                            r={5}
                            fill="#f59e0b"
                          />
                        )}
                      </>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      {showDetailPanel && selectedResource && (
        <ResourceDetailPanel 
          resource={selectedResource} 
          onClose={() => toggleDetailPanel(false)} 
        />
      )}
    </div>
  );
}
