import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import ResourceMap from '@/pages/ResourceMap';
import Inventory from '@/pages/Inventory';
import CostView from '@/pages/CostView';
import Governance from '@/pages/Governance';
import Changes from '@/pages/Changes';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

const pageConfig: Record<string, { title: string; subtitle: string }> = {
  '/': { title: '资源地图', subtitle: '可视化展示账号、区域、业务与资源的拓扑关系' },
  '/inventory': { title: '资源清单', subtitle: '多维度筛选、搜索与管理所有云资源' },
  '/cost': { title: '成本视图', subtitle: '费用趋势分析与成本分布洞察' },
  '/governance': { title: '标签治理', subtitle: '标签覆盖率、闲置资源识别与风险管控' },
  '/changes': { title: '变更记录', subtitle: '资源归属变更历史与待整理任务追踪' },
};

function AppContent() {
  const location = useLocation();
  const config = pageConfig[location.pathname] || { title: '', subtitle: '' };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Sidebar />
      
      <div className="ml-60 flex flex-col min-h-screen">
        <TopBar title={config.title} subtitle={config.subtitle} />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="animate-fade-in-up">
            <Routes>
              <Route path="/" element={<ResourceMap />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/cost" element={<CostView />} />
              <Route path="/governance" element={<Governance />} />
              <Route path="/changes" element={<Changes />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
