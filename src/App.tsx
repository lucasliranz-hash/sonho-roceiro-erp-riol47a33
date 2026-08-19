import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { OnlineStatusProvider } from '@/hooks/use-online-status'
import { useSyncQueue } from '@/hooks/use-sync-queue'
import { OfflineIndicator } from '@/components/OfflineIndicator'
import { AuthProvider } from '@/hooks/use-auth'
import { FarmStoreProvider } from '@/hooks/use-farm-store'
import { ProtectedRoute } from '@/components/ProtectedRoute'

import Layout from './components/Layout'
import Index from './pages/Index'
import Auth from './pages/Auth'
import Lotes from './pages/Lotes'
import Estrutura from './pages/Estrutura'
import Despesas from './pages/Despesas'
import Estoque from './pages/Estoque'
import Racao from './pages/Racao'
import Pesagens from './pages/Pesagens'
import Mortalidade from './pages/Mortalidade'
import Ovos from './pages/Ovos'
import Chocadeira from './pages/Chocadeira'
import Energia from './pages/Energia'
import Matrizes from './pages/Matrizes'
import Acasalamentos from './pages/Acasalamentos'
import Vendas from './pages/Vendas'
import ClientesFornecedores from './pages/ClientesFornecedores'
import Financeiro from './pages/Financeiro'
import Producao from './pages/Producao'
import Indicadores from './pages/Indicadores'
import CustosPrecificacao from './pages/CustosPrecificacao'
import Patrimonio from './pages/Patrimonio'
import Alertas from './pages/Alertas'
import Configuracoes from './pages/Configuracoes'
import Equipe from './pages/Equipe'
import MinhaConta from './pages/MinhaConta'
import NotFound from './pages/NotFound'

function SyncManager() {
  useSyncQueue()
  return null
}

function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  return (
    <OnlineStatusProvider>
      <AuthProvider>
        <FarmStoreProvider>
          <BrowserRouter>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <OfflineIndicator />
              <SyncManager />
              <Routes>
                <Route path="/login" element={<Auth />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/lotes" element={<Lotes />} />
                    <Route path="/estrutura" element={<Estrutura />} />
                    <Route path="/despesas" element={<Despesas />} />
                    <Route path="/estoque" element={<Estoque />} />
                    <Route path="/racao" element={<Racao />} />
                    <Route path="/pesagens" element={<Pesagens />} />
                    <Route path="/mortalidade" element={<Mortalidade />} />
                    <Route path="/ovos" element={<Ovos />} />
                    <Route path="/chocadeira" element={<Chocadeira />} />
                    <Route path="/energia" element={<Energia />} />
                    <Route path="/matrizes" element={<Matrizes />} />
                    <Route path="/acasalamentos" element={<Acasalamentos />} />
                    <Route path="/vendas" element={<Vendas />} />
                    <Route path="/parceiros" element={<ClientesFornecedores />} />
                    <Route path="/financeiro" element={<Financeiro />} />
                    <Route path="/producao" element={<Producao />} />
                    <Route path="/indicadores" element={<Indicadores />} />
                    <Route path="/custos" element={<CustosPrecificacao />} />
                    <Route path="/patrimonio" element={<Patrimonio />} />
                    <Route path="/alertas" element={<Alertas />} />
                    <Route path="/equipe" element={<Equipe />} />
                    <Route path="/minha-conta" element={<MinhaConta />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </BrowserRouter>
        </FarmStoreProvider>
      </AuthProvider>
    </OnlineStatusProvider>
  )
}

export default App
