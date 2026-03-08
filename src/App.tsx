import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DataProvider } from "@/contexts/DataContext";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import Orders from "@/pages/Orders";
import Workers from "@/pages/Workers";
import CustomerPortal from "@/pages/CustomerPortal";
import NotFound from "./pages/NotFound";
import { useNotificationChecker } from "@/hooks/useNotificationChecker";

const queryClient = new QueryClient();

function AppContent() {
  useNotificationChecker();
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      <TopBar />
      <main className="flex-1 px-4 py-4 pb-20">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/portal" element={<CustomerPortal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </DataProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
