import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EmpresaProvider } from "@/contexts/EmpresaContext";
import { ConnectionProvider } from "@/contexts/ConnectionContext";
import { SyncProvider } from "@/contexts/SyncContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import PDV from "./pages/PDV";
import Estoque from "./pages/Estoque";
import Producao from "./pages/Producao";
import Financeiro from "./pages/Financeiro";
import Clientes from "./pages/Clientes";
import Relatorios from "./pages/Relatorios";
import Usuarios from "./pages/Usuarios";
import Configuracoes from "./pages/Configuracoes";
import Comandas from "./pages/Comandas";
import Instalar from "./pages/Instalar";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ConnectionProvider checkInterval={30000}>
      <SyncProvider autoSyncInterval={30000}>
        <EmpresaProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/pdv" element={<PDV />} />
                <Route path="/comandas" element={<Comandas />} />
                <Route path="/instalar" element={<Instalar />} />
                <Route
                  path="/*"
                  element={
                    <MainLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/estoque" element={<Estoque />} />
                        <Route path="/producao" element={<Producao />} />
                        <Route path="/financeiro" element={<Financeiro />} />
                        <Route path="/clientes" element={<Clientes />} />
                        <Route path="/relatorios" element={<Relatorios />} />
                        <Route path="/usuarios" element={<Usuarios />} />
                        <Route path="/configuracoes" element={<Configuracoes />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </MainLayout>
                  }
                />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </EmpresaProvider>
      </SyncProvider>
    </ConnectionProvider>
  </QueryClientProvider>
);

export default App;
