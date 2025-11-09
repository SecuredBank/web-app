import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  validatePhoneNumber,
} from './validation'

describe('validation utilities', () => {
  describe('validateEmail', () => {
    it('accepts valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.com',
        'user+tag@example.co.uk',
        'user123@sub.domain.org',
        '123.456@example.com',
        'firstname.lastname@example.com',
      ]

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true)
      })
    })

    it('rejects invalid email addresses', () => {
      const invalidEmails = [
        '',
        'notanemail',
        '@example.com',
        'test@',
        'test@.com',
        'test@com',
        'test@domain.',
        'test..test@example.com',
        'test@example..com',
        '.test@example.com',
        'test.@example.com',
        'te st@example.com',
        'test@exam ple.com',
      ]

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false)
      })
    })
  })

  describe('validatePassword', () => {
    it('accepts valid passwords', () => {
      const validPasswords = [
        'Password123!',
        'Complex1!Password',
        'Abcd123!@#',
        'P@ssw0rd',
        'SecureP@ss1',
        '1234!Abcd',
        'Test12!@',
      ]

      validPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(true)
      })
    })

    it('rejects invalid passwords', () => {
      const invalidPasswords = [
        '', // empty
        'short', // too short
        'password', // no uppercase
        'PASSWORD', // no lowercase
        'Password', // no number
        'Password1', // no special char
        'Pass 1!', // contains space
        'aaaaa1!A', // less than 8 chars
      ]

      invalidPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false)
      })
    })

    it('enforces minimum length', () => {
      expect(validatePassword('P@ss1', { minLength: 6 })).toBe(false)
      expect(validatePassword('P@ssw1', { minLength: 6 })).toBe(true)
    })

    it('can require special characters', () => {
      expect(validatePassword('Password123', { requireSpecial: true })).toBe(
        false
      )
      expect(validatePassword('Password123!', { requireSpecial: true })).toBe(
        true
      )
    })

    it('can require numbers', () => {
      expect(validatePassword('Password!', { requireNumbers: true })).toBe(
        false
      )
      expect(validatePassword('Password1!', { requireNumbers: true })).toBe(
        true
      )
    })

    it('can require mixed case', () => {
      expect(validatePassword('password1!', { requireMixedCase: true })).toBe(
        false
      )
      expect(validatePassword('PASSWORD1!', { requireMixedCase: true })).toBe(
        false
      )
      expect(validatePassword('Password1!', { requireMixedCase: true })).toBe(
        true
      )
    })
  })

  describe('validatePhoneNumber', () => {
    it('accepts valid phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '+44 7911 123456',
        '(123) 456-7890',
        '123-456-7890',
        '123.456.7890',
        '1234567890',
      ]

      validPhones.forEach(phone => {
        expect(validatePhoneNumber(phone)).toBe(true)
      })
    })

    it('rejects invalid phone numbers', () => {
      const invalidPhones = [
        '',
        'not a number',
        '123',
        '123456',
        '++1234567890',
        '+1234+567890',
        '(123)4567890',
        '123-456-789',
        '123.456.789',
        'abc-def-ghij',
      ]

      invalidPhones.forEach(phone => {
        expect(validatePhoneNumber(phone)).toBe(false)
      })
    })

    it('validates country codes', () => {
      expect(validatePhoneNumber('+1234567890', { countryCode: '+1' })).toBe(
        false
      )
      expect(validatePhoneNumber('+1234567890', { countryCode: '+123' })).toBe(
        true
      )
    })

    it('validates fixed length', () => {
      expect(validatePhoneNumber('123456789', { length: 10 })).toBe(false)
      expect(validatePhoneNumber('1234567890', { length: 10 })).toBe(true)
    })

    it('handles formatting options', () => {
      expect(
        validatePhoneNumber('1234567890', { format: 'xxx-xxx-xxxx' })
      ).toBe(false)
      expect(
        validatePhoneNumber('123-456-7890', { format: 'xxx-xxx-xxxx' })
      ).toBe(true)
    })
  })
})

