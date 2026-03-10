import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DataProvider } from "@/contexts/DataContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import PageTransition from "@/components/PageTransition";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";
import AuthGate from "@/components/AuthGate";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import Orders from "@/pages/Orders";
import Workers from "@/pages/Workers";
import Measurements from "@/pages/Measurements";
import Payments from "@/pages/Payments";
import ReadySuits from "@/pages/ReadySuits";
import Reports from "@/pages/Reports";
import SettingsPage from "@/pages/Settings";
import CustomerPortal from "@/pages/CustomerPortal";
import NotFound from "./pages/NotFound";
import { useNotificationChecker } from "@/hooks/useNotificationChecker";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/customers" element={<PageTransition><Customers /></PageTransition>} />
        <Route path="/orders" element={<PageTransition><Orders /></PageTransition>} />
        <Route path="/workers" element={<PageTransition><Workers /></PageTransition>} />
        <Route path="/measurements" element={<PageTransition><Measurements /></PageTransition>} />
        <Route path="/payments" element={<PageTransition><Payments /></PageTransition>} />
        <Route path="/ready" element={<PageTransition><ReadySuits /></PageTransition>} />
        <Route path="/reports" element={<PageTransition><Reports /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
        <Route path="/portal" element={<PageTransition><CustomerPortal /></PageTransition>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

function StaffShell() {
  useNotificationChecker();

  return (
    <AuthGate>
      <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
        <TopBar />
        <main className="flex-1 px-4 py-4 pb-24">
          <AppRoutes />
        </main>
        <BottomNav />
        <InstallPrompt />
      </div>
    </AuthGate>
  );
}

function AppContent() {
  const location = useLocation();
  const isPublicPortal = location.pathname === '/portal';

  if (isPublicPortal) {
    return (
      <div className="min-h-screen bg-background">
        <AppRoutes />
      </div>
    );
  }

  return <StaffShell />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="kt-theme">
      <TooltipProvider>
        <LanguageProvider>
          <AuthProvider>
            <DataProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </DataProvider>
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
