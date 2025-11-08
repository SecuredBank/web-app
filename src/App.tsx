import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@contexts/AuthContext'
import { ThemeProvider } from '@contexts/ThemeContext'
import { SecurityProvider } from '@contexts/SecurityContext'
import Layout from '@components/layout/Layout'
import LoginPage from '@pages/LoginPage'
import DashboardPage from '@pages/DashboardPage'
import SecurityMonitoringPage from '@pages/SecurityMonitoringPage'
import UserManagementPage from '@pages/UserManagementPage'
import ReportsPage from '@pages/ReportsPage'
import SettingsPage from '@pages/SettingsPage'
import ProtectedRoute from '@components/layout/ProtectedRoute'

function App() {
  return (
    <ThemeProvider>
      <SecurityProvider>
        <AuthProvider>
          <div className="min-h-screen bg-secondary-50">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="security" element={<SecurityMonitoringPage />} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </SecurityProvider>
    </ThemeProvider>
  )
}

export default App
