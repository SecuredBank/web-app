import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginForm from './LoginForm'
import { AuthProvider } from '../../contexts/AuthContext'

// Mock useNavigate
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}))

// Mock auth context
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    isLoading: false,
    error: null
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

describe('LoginForm', () => {
  const mockOnSuccess = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form correctly', () => {
    render(
      <AuthProvider>
        <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
      </AuthProvider>
    )

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(
      <AuthProvider>
        <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
      </AuthProvider>
    )

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })

    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('validates email format', async () => {
    render(
      <AuthProvider>
        <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
      </AuthProvider>
    )

    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })

    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('validates password minimum length', async () => {
    render(
      <AuthProvider>
        <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
      </AuthProvider>
    )

    const passwordInput = screen.getByLabelText(/password/i)
    fireEvent.change(passwordInput, { target: { value: '123' } })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })

    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('handles successful login', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useAuth).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null
    })

    render(
      <AuthProvider>
        <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
      </AuthProvider>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false
      })
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('handles authentication failure', async () => {
    const errorMessage = 'Invalid credentials'
    vi.mocked(useAuth).mockReturnValue({
      login: vi.fn().mockRejectedValue(new Error(errorMessage)),
      isLoading: false,
      error: errorMessage
    })

    render(
      <AuthProvider>
        <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
      </AuthProvider>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(errorMessage)
    })
  })

  it('handles password visibility toggle', () => {
    render(
      <AuthProvider>
        <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
      </AuthProvider>
    )

    const passwordInput = screen.getByLabelText(/password/i)
    const toggleButton = screen.getByLabelText(/toggle password visibility/i)

    expect(passwordInput).toHaveAttribute('type', 'password')

    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')

    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('shows loading state during login', async () => {
    vi.mocked(useAuth).mockReturnValue({
      login: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100))),
      isLoading: true,
      error: null
    })

    render(
      <AuthProvider>
        <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
      </AuthProvider>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })
})
