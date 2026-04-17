import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import LoginPage from '@pages/LoginPage'
import AdminLayout from '@layouts/AdminLayout'
import OperatorLayout from '@layouts/OperatorLayout'
import ProtectedRoute from '@components/ProtectedRoute'

// Admin Pages
import Dashboard from '@pages/admin/Dashboard'
import PlanesEstrategicos from '@pages/admin/PlanesEstrategicos'
import CentrosCosto from '@pages/admin/CentrosCosto'
import Usuarios from '@pages/admin/Usuarios'
import ConfiguracionPlazos from '@pages/admin/ConfiguracionPlazos'
import ObjetivosAccionesEstrategicas from '@pages/admin/ObjetivosAccionesEstrategicas'
import Variables from '@pages/admin/Variables'
import Seguimiento from '@pages/admin/Seguimiento'

// Admin Reportes Pages
import AdminReportesVariables from '@pages/admin/ReportesVariables'
import AdminReportesUsuarios from '@pages/admin/ReportesUsuarios'
import ExceptionControl from '@pages/admin/ExceptionControl'
import FormulaConfiguration from '@pages/admin/FormulaConfiguration'
import AdminReportesCentrosCosto from '@pages/admin/ReportesCentrosCosto'
import AdminReportesPlanes from '@pages/admin/ReportesPlanes'

// Operator Pages
import OperatorDashboard from '@pages/operator/OperatorDashboard'
import OperatorSeguimiento from '@pages/operator/OperatorSeguimiento'
import OperatorReportes from '@pages/operator/OperatorReportes'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="planes" element={<PlanesEstrategicos />} />
            <Route path="centros-costo" element={<CentrosCosto />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="objetivos" element={<ObjetivosAccionesEstrategicas />} />
            <Route path="variables" element={<Variables />} />
            <Route path="seguimiento" element={<Seguimiento />} />
            <Route path="reportes/variables" element={<AdminReportesVariables />} />
            <Route path="reportes/usuarios" element={<AdminReportesUsuarios />} />
            <Route path="reportes/centros-costo" element={<AdminReportesCentrosCosto />} />
            <Route path="reportes/planes" element={<AdminReportesPlanes />} />
            <Route path="excepciones" element={<ExceptionControl />} />
            <Route path="formulas" element={<FormulaConfiguration />} />
            <Route path="configuracion/plazos" element={<ConfiguracionPlazos />} />
          </Route>
          
          {/* Operator Routes */}
          <Route path="/operator" element={
            <ProtectedRoute requiredRole="OPERATOR">
              <OperatorLayout />
            </ProtectedRoute>
          }>
            <Route index element={<OperatorDashboard />} />
            <Route path="seguimiento" element={<Navigate to="indicadores" replace />} />
            <Route path="seguimiento/indicadores" element={<OperatorSeguimiento />} />
            <Route path="reportes" element={<OperatorReportes />} />
          </Route>
          
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
