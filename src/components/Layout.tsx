import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface LayoutProps {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

export default function Layout({ title, subtitle, rightContent }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Sidebar />
      
      <div className="ml-60 flex flex-col min-h-screen">
        <TopBar title={title} subtitle={subtitle} rightContent={rightContent} />
        
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
