import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import SetupGuard from './components/SetupGuard'
import AppShell from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import SetupPage from './pages/SetupPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'

// Extraction Runs
import ExtractionRunListPage from './pages/ExtractionRunListPage'
import ExtractionRunFormPage from './pages/ExtractionRunFormPage'
import ExtractionRunDetailPage from './pages/ExtractionRunDetailPage'

// PCR Runs
import PCRRunListPage from './pages/PCRRunListPage'
import PCRRunFormPage from './pages/PCRRunFormPage'
import PCRRunDetailPage from './pages/PCRRunDetailPage'

// Sanger Runs
import SangerRunListPage from './pages/SangerRunListPage'
import SangerRunFormPage from './pages/SangerRunFormPage'
import SangerRunDetailPage from './pages/SangerRunDetailPage'

// Library Prep Runs
import LibraryPrepRunListPage from './pages/LibraryPrepRunListPage'
import LibraryPrepRunFormPage from './pages/LibraryPrepRunFormPage'
import LibraryPrepRunDetailPage from './pages/LibraryPrepRunDetailPage'

// NGS Runs
import NGSRunListPage from './pages/NGSRunListPage'
import NGSRunFormPage from './pages/NGSRunFormPage'

// Protocols
import ProtocolListPage from './pages/ProtocolListPage'
import ProtocolFormPage from './pages/ProtocolFormPage'
import ProtocolDetailPage from './pages/ProtocolDetailPage'

import PrimersPage from './pages/PrimersPage'
import ExportPage from './pages/ExportPage'
import HelpPage from './pages/HelpPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SetupGuard>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/" element={<DashboardPage />} />

            {/* Extraction Runs */}
            <Route path="/extraction-runs" element={<ExtractionRunListPage />} />
            <Route path="/extraction-runs/new" element={<ExtractionRunFormPage />} />
            <Route path="/extraction-runs/:id" element={<ExtractionRunDetailPage />} />
            <Route path="/extraction-runs/:id/edit" element={<ExtractionRunFormPage />} />

            {/* PCR Runs */}
            <Route path="/pcr-runs" element={<PCRRunListPage />} />
            <Route path="/pcr-runs/new" element={<PCRRunFormPage />} />
            <Route path="/pcr-runs/:id" element={<PCRRunDetailPage />} />
            <Route path="/pcr-runs/:id/edit" element={<PCRRunFormPage />} />

            {/* Sanger Runs */}
            <Route path="/sanger-runs" element={<SangerRunListPage />} />
            <Route path="/sanger-runs/new" element={<SangerRunFormPage />} />
            <Route path="/sanger-runs/:id" element={<SangerRunDetailPage />} />
            <Route path="/sanger-runs/:id/edit" element={<SangerRunFormPage />} />

            {/* Library Prep Runs */}
            <Route path="/library-prep-runs" element={<LibraryPrepRunListPage />} />
            <Route path="/library-prep-runs/new" element={<LibraryPrepRunFormPage />} />
            <Route path="/library-prep-runs/:id" element={<LibraryPrepRunDetailPage />} />
            <Route path="/library-prep-runs/:id/edit" element={<LibraryPrepRunFormPage />} />

            {/* NGS Runs */}
            <Route path="/ngs-runs" element={<NGSRunListPage />} />
            <Route path="/ngs-runs/new" element={<NGSRunFormPage />} />
            <Route path="/ngs-runs/:id/edit" element={<NGSRunFormPage />} />

            {/* Protocols */}
            <Route path="/protocols" element={<ProtocolListPage />} />
            <Route path="/protocols/new" element={<ProtocolFormPage />} />
            <Route path="/protocols/:id" element={<ProtocolDetailPage />} />
            <Route path="/protocols/:id/edit" element={<ProtocolFormPage />} />

            {/* Primers */}
            <Route path="/primers" element={<PrimersPage />} />

            <Route path="/export" element={<ExportPage />} />
            <Route path="/help" element={<HelpPage />} />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </SetupGuard>
      </BrowserRouter>
    </AuthProvider>
  )
}
