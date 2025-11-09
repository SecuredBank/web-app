import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UserForm from './UserForm'
import { User } from '../../types'

describe('UserForm', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    status: 'active',
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create form correctly', () => {
    render(<UserForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('renders edit form with user data', () => {
    render(<UserForm user={mockUser} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    expect(screen.getByLabelText(/first name/i)).toHaveValue(mockUser.firstName)
    expect(screen.getByLabelText(/last name/i)).toHaveValue(mockUser.lastName)
    expect(screen.getByLabelText(/email/i)).toHaveValue(mockUser.email)
    expect(screen.getByLabelText(/role/i)).toHaveValue(mockUser.role)
  })

  it('validates required fields', async () => {
    render(<UserForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('validates email format', async () => {
    render(<UserForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('submits valid form data', async () => {
    render(<UserForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john.doe@example.com' } })
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'user' } })

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: 'user'
      })
    })
  })

  it('calls onCancel when cancel button is clicked', () => {
    render(<UserForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('preserves entered data after failed submission', async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error('Submission failed'))

    render(<UserForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const firstName = 'John'
    const lastName = 'Doe'
    const email = 'john.doe@example.com'

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: firstName } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: lastName } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } })

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toHaveValue(firstName)
      expect(screen.getByLabelText(/last name/i)).toHaveValue(lastName)
      expect(screen.getByLabelText(/email/i)).toHaveValue(email)
    })
  })

  it('shows loading state during submission', async () => {
    mockOnSubmit.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<UserForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john.doe@example.com' } })

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    expect(saveButton).toBeDisabled()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })
  })

  it('handles errors during submission', async () => {
    const errorMessage = 'Failed to save user'
    mockOnSubmit.mockRejectedValueOnce(new Error(errorMessage))

    render(<UserForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john.doe@example.com' } })

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })
})
