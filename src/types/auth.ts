// Authentication Types
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  user: User
  token: string
  refreshToken: string
}

export interface RefreshTokenResponse {
  token: string
  refreshToken: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirmation {
  token: string
  newPassword: string
  confirmPassword: string
}

export interface TwoFactorAuthenticationResponse {
  tempToken: string
  method: '2fa_email' | '2fa_authenticator'
}

export interface TwoFactorVerificationRequest {
  tempToken: string
  code: string
}