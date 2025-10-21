import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

/**
 * Hash a password using bcrypt
 * @param password The plain text password to hash
 * @returns Promise<string> The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compare a plain text password with a hash
 * @param password The plain text password to check
 * @param hash The hash to compare against
 * @returns Promise<boolean> True if the password matches the hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
}

export interface PasswordValidationResult {
    isValid: boolean
    errors: string[]
}

/**
 * Validates password against security requirements:
 * - Between 8 and 25 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character (extended definition)
 * @param password The password to validate
 * @returns PasswordValidationResult with validation status and error messages
 */
export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = []

    if (!password) {
        errors.push('Password is required')
        return { isValid: false, errors }
    }

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long')
    }

    if (password.length > 25) {
        errors.push('Password must not exceed 25 characters')
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter')
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one digit')
    }

    // Extended special character definition - includes all non-alphanumeric characters
    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push('Password must contain at least one special character')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
} 