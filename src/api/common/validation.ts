// Common parameter validation utilities

import { ValidationError } from './errors';

export interface ValidationRule<T = unknown> {
  field: string;
  value: T;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => boolean;
  message?: string;
}

export function validateField<T>(rule: ValidationRule<T>): void {
  const { field, value, required, minLength, maxLength, min, max, pattern, custom, message } = rule;

  // Check required
  if (required && (value === undefined || value === null || value === '')) {
    throw new ValidationError(message || `${field} is required`);
  }

  // Skip other validations if value is empty and not required
  if (!required && (value === undefined || value === null || value === '')) {
    return;
  }

  // String validations
  if (typeof value === 'string') {
    if (minLength !== undefined && value.length < minLength) {
      throw new ValidationError(message || `${field} must be at least ${minLength} characters long`);
    }
    if (maxLength !== undefined && value.length > maxLength) {
      throw new ValidationError(message || `${field} must be no more than ${maxLength} characters long`);
    }
    if (pattern && !pattern.test(value)) {
      throw new ValidationError(message || `${field} format is invalid`);
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (min !== undefined && value < min) {
      throw new ValidationError(message || `${field} must be at least ${min}`);
    }
    if (max !== undefined && value > max) {
      throw new ValidationError(message || `${field} must be no more than ${max}`);
    }
  }

  // Custom validation
  if (custom && !custom(value)) {
    throw new ValidationError(message || `${field} is invalid`);
  }
}

export function validateId(id: string, fieldName: string = 'ID'): string {
  validateField({
    field: fieldName,
    value: id,
    required: true,
    minLength: 1,
    pattern: /^[a-fA-F0-9]{24}$/,
    message: `${fieldName} must be a valid MongoDB ObjectId`
  });
  return id.trim();
}

export function validateEmail(email: string): string {
  validateField({
    field: 'Email',
    value: email,
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email format is invalid'
  });
  return email.trim().toLowerCase();
}

export function validatePagination(page?: number, limit?: number): { page: number; limit: number } {
  const validatedPage = page || 1;
  const validatedLimit = limit || 10;

  validateField({
    field: 'Page',
    value: validatedPage,
    min: 1,
    message: 'Page must be a positive number'
  });

  validateField({
    field: 'Limit',
    value: validatedLimit,
    min: 1,
    max: 100,
    message: 'Limit must be between 1 and 100'
  });

  return { page: validatedPage, limit: validatedLimit };
}

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

export function validateAndSanitizeQueryParams(params: Record<string, unknown>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'string' && value.trim()) {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'number') {
        sanitized[key] = value.toString();
      } else if (typeof value === 'boolean') {
        sanitized[key] = value.toString();
      }
    }
  });

  return sanitized;
}

export function createQueryString(params: Record<string, unknown>): string {
  const validatedParams = validateAndSanitizeQueryParams(params);
  return new URLSearchParams(validatedParams).toString();
}