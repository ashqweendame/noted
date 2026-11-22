import { useState } from 'react';
import {
  LayoutDashboard,
  Upload,
  FolderKanban,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import type { AppPage } from '../types/announcement';

interface SidebarNavProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  totalAnnouncements: number;
  pendingTasksCount: number;
  studentName: string;
  studentEmail: string;
  onSignOut: () => void;
}

const PAGE_TITLES: Record<AppPage, string> = {
  dashboard: 'Dashboard',
  upload: 'Upload Announcement',
  processing: 'AI Processing',
  review: 'Announcement Review',
  manage: 'Announcement Management',
};

export function SidebarNav({
  currentPage,
  onNavigate,
  totalAnnouncements,
  pendingTasksCount,
  studentName,
  studentEmail,
  onSignOut,
}: SidebarNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: AppPage; label: string; icon: typeof LayoutDashboard; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Notice', icon: Upload },
    {
      id: 'manage',
      label: 'All Announcements',
      icon: FolderKanban,
      count: totalAnnouncements,
    },
  ];

  const handleSelectPage = (page: AppPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside
        aria-label="Primary navigation"
        className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:border-r lg:border-slate-200 lg:bg-white lg:sticky lg:top-0 lg:h-screen"
      >
        <div className="h-16 px-6 flex items-center border-b border-slate-200">
          <button
            type="button"
            onClick={() => handleSelectPage('dashboard')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
          >
            Noted
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentPage === item.id ||
              (item.id === 'upload' &&
                (currentPage === 'processing' || currentPage === 'review'));

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPage(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                {typeof item.count === 'number' && (
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="px-2 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{studentName}</p>
            <p className="text-[11px] text-slate-500 truncate">{studentEmail}</p>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">
              {pendingTasksCount} pending {pendingTasksCount === 1 ? 'task' : 'tasks'}
            </p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap truncate">
            Noted
          </span>
        </div>

        {currentPage !== 'upload' && (
          <button
            type="button"
            onClick={() => handleSelectPage('upload')}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[40px] flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Quick Upload</span>
          </button>
        )}
      </header>

      {/* Mobile Slide-Down Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-14 z-20 bg-white border-b border-slate-200 shadow-lg px-4 py-4 space-y-2">
          <nav aria-label="Mobile navigation" className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentPage === item.id ||
                (item.id === 'upload' &&
                  (currentPage === 'processing' || currentPage === 'review'));
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectPage(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium min-h-[44px] ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                  {typeof item.count === 'number' && (
                    <span className="text-xs font-mono tabular-nums text-slate-500">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
            <span className="truncate">
              {studentName} · {PAGE_TITLES[currentPage]}
            </span>
            <button
              type="button"
              onClick={() => {
                onSignOut();
                setMobileMenuOpen(false);
              }}
              className="text-blue-700 font-medium py-1.5 px-2 hover:underline shrink-0"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
