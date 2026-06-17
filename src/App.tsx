import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AdminRoute } from '@/components/layout/AdminRoute'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ExplorePage } from '@/pages/ExplorePage'
import { ServiceDetailPage } from '@/pages/ServiceDetailPage'
import { ServiceFormPage } from '@/pages/ServiceFormPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ContractsPage } from '@/pages/ContractsPage'
import { ContractDetailPage } from '@/pages/ContractDetailPage'
import { PricingPage } from '@/pages/PricingPage'
import { RequestQuotePage } from '@/pages/RequestQuotePage'
import { QuoteRequestsPage } from '@/pages/QuoteRequestsPage'
import { QuoteDetailPage } from '@/pages/QuoteDetailPage'
import { MyQuoteRequestsPage } from '@/pages/MyQuoteRequestsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { AdminPage } from '@/pages/AdminPage'
import { ReviewPage } from '@/pages/ReviewPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="cadastro" element={<RegisterPage />} />
            <Route path="explorar" element={<ExplorePage />} />
            <Route path="precos" element={<PricingPage />} />
            <Route path="servicos/:id" element={<ServiceDetailPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="painel" element={<DashboardPage />} />
              <Route path="painel/anuncios/novo" element={<ServiceFormPage />} />
              <Route path="painel/anuncios/:id/editar" element={<ServiceFormPage />} />
              <Route path="perfil" element={<ProfilePage />} />
              <Route path="contratos" element={<ContractsPage />} />
              <Route path="contratos/:id" element={<ContractDetailPage />} />
              <Route path="pedir-orcamento" element={<RequestQuotePage />} />
              <Route path="orcamentos/meus" element={<MyQuoteRequestsPage />} />
            </Route>

            <Route path="orcamentos" element={<QuoteRequestsPage />} />
            <Route path="orcamentos/:id" element={<QuoteDetailPage />} />

            <Route element={<AdminRoute allowedRoles={['admin']} />}>
              <Route path="admin" element={<AdminPage />} />
            </Route>
            <Route element={<AdminRoute allowedRoles={['admin', 'reviewer']} />}>
              <Route path="revisar" element={<ReviewPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
