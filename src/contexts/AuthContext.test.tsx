import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import { renderHook } from '@testing-library/react-hooks'

describe('AuthContext', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'security_officer' as const,
    isActive: true,
    permissions: [],
    mfaEnabled: false,
    failedLoginAttempts: 0,
    lastPasswordChange: new Date(),
    passwordExpiryDate: new Date(),
    sessionTimeout: 30
  }

  const mockLoginResponse = {
    user: mockUser,
    token: 'fake-token',
    refreshToken: 'fake-refresh-token'
  }

  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage
    })
  })

  it('provides authentication state', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(typeof result.current.login).toBe('function')
    expect(typeof result.current.logout).toBe('function')
    expect(typeof result.current.refreshSession).toBe('function')
  })

  it('handles successful login', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockLoginResponse)
    })

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result } = renderHook(() => useAuth(), { wrapper })

    const credentials = {
      email: 'test@example.com',
      password: 'password123'
    }

    await act(async () => {
      await result.current.login(credentials)
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(mockUser)
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'fake-token')
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'fake-refresh-token')
  })

  it('handles login failure', async () => {
    const errorMessage = 'Invalid credentials'
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: errorMessage })
    })

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result } = renderHook(() => useAuth(), { wrapper })

    const credentials = {
      email: 'test@example.com',
      password: 'wrong-password'
    }

    try {
      await act(async () => {
        await result.current.login(credentials)
      })
    } catch (error) {
      expect(error.message).toBe(errorMessage)
    }

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.error).toBe(errorMessage)
  })

  it('handles logout', async () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result } = renderHook(() => useAuth(), { wrapper })

    // First login
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockLoginResponse)
    })

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    // Then logout
    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken')
  })

  it('refreshes session automatically', async () => {
    const mockNewToken = 'new-fake-token'
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLoginResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: mockNewToken })
      })

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result } = renderHook(() => useAuth(), { wrapper })

    // Login first
    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    // Mock token expiration
    await act(async () => {
      await result.current.refreshSession()
    })

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', mockNewToken)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('handles refresh token failure', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLoginResponse)
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid refresh token' })
      })

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result } = renderHook(() => useAuth(), { wrapper })

    // Login first
    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    // Attempt refresh
    await act(async () => {
      await result.current.refreshSession()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken')
  })

  it('maintains session across page reloads', async () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'fake-token'
      if (key === 'refreshToken') return 'fake-refresh-token'
      return null
    })

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: mockUser })
    })

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
    })
  })

  it('handles session timeout', async () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result } = renderHook(() => useAuth(), { wrapper })

    // Login
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockLoginResponse)
    })

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    // Fast-forward past session timeout
    vi.advanceTimersByTime((mockUser.sessionTimeout + 1) * 60 * 1000)

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken')
  })

  it('handles concurrent refresh token requests', async () => {
    const mockNewToken = 'new-fake-token'
    let refreshCount = 0
    
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('refresh')) {
        refreshCount++
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: mockNewToken })
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockLoginResponse)
      })
    })

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result } = renderHook(() => useAuth(), { wrapper })

    // Login first
    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    // Attempt multiple concurrent refreshes
    await Promise.all([
      result.current.refreshSession(),
      result.current.refreshSession(),
      result.current.refreshSession()
    ])

    expect(refreshCount).toBe(1) // Should only refresh once
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', mockNewToken)
  })
})