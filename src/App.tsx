import React, { Suspense } from 'react';
import { ToastProvider } from './context';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ViewLoadingFallback } from './components/common/ViewLoadingFallback';
import { lazyWithRetry } from './components/common/helpers';
import { useAppData } from './hooks/useAppData';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ToastContainer } from './components/ui/Toast';
import { AuthView } from './modules/auth/AuthView';
import { ViewRouter } from './modules/ViewRouter';
import { GlobalModals } from './components/modals/GlobalModals';

const PublicStudentPortfolioView = lazyWithRetry(() => import('./modules/portfolio/PublicStudentPortfolioView'));

function AppContent() {
  const app = useAppData();

  // Public Student Portfolio View
  if (app.view === 'public-portfolio' && app.publicPortfolioRegNo) {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <PublicStudentPortfolioView registerNumber={app.publicPortfolioRegNo} onBack={() => app.setView('dashboard')} />
      </Suspense>
    );
  }

  // Unauthenticated Auth Screen
  if (!app.token || !app.user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col justify-center">
        <div id="app-logo-slot" className="logo-container" aria-label="Company Logo Slot"></div>
        <AuthView
          onLoginSuccess={(tok, usr) => {
            app.setToken(tok);
            app.setUser(usr);
            try {
              localStorage.setItem('token', tok);
              localStorage.setItem('user', JSON.stringify(usr));
            } catch {}
            app.setView('dashboard');
          }}
          onToast={app.addToast}
        />
        <ToastContainer toasts={app.toasts} removeToast={app.removeToast} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <Sidebar
        view={app.view}
        setView={app.setView}
        user={app.user}
        isAdmin={app.isAdmin}
        isHOD={app.isHOD}
        isAdvisor={app.isAdvisor}
        isStudent={app.isStudent}
        isCoordinator={app.isCoordinator}
        isFaculty={app.isFaculty}
        isIndustry={app.isIndustry}
        isDesktopSidebarOpen={app.isDesktopSidebarOpen}
        isMobileSidebarOpen={app.isMobileSidebarOpen}
        setIsMobileSidebarOpen={app.setIsMobileSidebarOpen}
        handleLogout={app.handleLogout}
        pendingIndustryList={app.pendingIndustryList}
        pendingVerificationCount={app.pendingVerificationCount}
        fetchNotices={app.fetchNotices}
      />

      <div className="flex-1 flex flex-col min-w-0 h-[100dvh]">
        <Header
          view={app.view}
          isIndustry={app.isIndustry}
          codingPlatformTab={app.codingPlatformTab}
          isAdmin={app.isAdmin}
          isHOD={app.isHOD}
          isAdvisor={app.isAdvisor}
          isCoordinator={app.isCoordinator}
          isStudent={app.isStudent}
          user={app.user}
          notifications={app.notifications}
          showNotifications={app.showNotifications}
          setShowNotifications={app.setShowNotifications}
          notificationDropdownRef={app.notificationDropdownRef}
          markNotificationsRead={app.markNotificationsRead}
          markSingleNotificationRead={app.markSingleNotificationRead}
          handleRespondInvitation={app.handleRespondInvitation}
          myInvitations={app.myInvitations}
          handleToggleSidebar={app.handleToggleSidebar}
          isMobileSidebarOpen={app.isMobileSidebarOpen}
          isDesktopSidebarOpen={app.isDesktopSidebarOpen}
          setShowExportModal={app.setShowExportModal}
          setShowTelegramLinkModal={app.setShowTelegramLinkModal}
        />

        <main className="flex-1 min-h-0 relative bg-[#F5F5F4] dark:bg-[#0f0f12] overflow-y-auto">
          <ErrorBoundary fallbackTitle="Portal View Error">
            <Suspense fallback={<ViewLoadingFallback />}>
              <ViewRouter app={app} />
            </Suspense>
          </ErrorBoundary>
        </main>

        <Footer onShowModal={(modalType) => app.setView(modalType)} />
      </div>

      <GlobalModals app={app} />
      <ToastContainer toasts={app.toasts} removeToast={app.removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}
