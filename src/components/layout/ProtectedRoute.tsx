import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { useSecurity } from '@contexts/SecurityContext'
import LoadingSpinner from '@components/ui/LoadingSpinner'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const { sessionManager, csrf } = useSecurity()
  const location = useLocation()
  const [isSecurityValid, setIsSecurityValid] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const validateSecurity = async () => {
      try {
        // Get current session token and fingerprint from storage
        const sessionId = localStorage.getItem('session_id')
        const userId = localStorage.getItem('user_id')
        const fingerprint = localStorage.getItem('device_fingerprint')

        if (!sessionId || !userId || !fingerprint) {
          console.error('Missing session information')
          return false
        }

        // Validate session and CSRF token
        const session = sessionManager.getSession(sessionId, fingerprint)
        const storedCsrfToken = localStorage.getItem('csrf_token')
        const isCsrfValid = storedCsrfToken && csrf.validateToken(userId, storedCsrfToken)

        if (!session) {
          console.error('Session validation failed')
          return false
        }

        if (!isCsrfValid) {
          console.error('CSRF token validation failed')
          return false
        }

        // Generate new CSRF token
        const newToken = csrf.generateToken(userId)
        localStorage.setItem('csrf_token', newToken)
        
        return true
      } catch (error) {
        console.error('Security validation error:', error)
        return false
      } finally {
        setIsChecking(false)
      }
    }

    validateSecurity().then(setIsSecurityValid)
  }, [sessionManager, csrf, location.pathname])

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated || !isSecurityValid) {
    // Clear security tokens on failure
    localStorage.removeItem('session_id')
    localStorage.removeItem('csrf_token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('device_fingerprint')
    
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
