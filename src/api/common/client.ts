// Common API client wrapper with consistent error handling and retry logic

import apiClient from '../../services/apiClient';
import { handleApiError, TimeoutError } from './errors';

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// Default options
const defaultOptions: Required<RequestOptions> = {
  timeout: 10000, // 10 seconds
  retries: 3,
  retryDelay: 1000 // 1 second
};

// Retry helper with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry client errors (4xx)
      if (error instanceof Error && /4\d\d/.test(error.message)) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw handleApiError(lastError, `Operation failed after ${maxRetries} attempts`);
}

// Timeout wrapper
async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([operation(), timeoutPromise]);
}

// Main API request wrapper
export async function makeApiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };

  try {
    return await withTimeout(
      () => withRetry(async () => {
        const response = await apiClient.request(endpoint, method, data);
        return response.data as T;
      }, opts.retries, opts.retryDelay),
      opts.timeout
    );
  } catch (error) {
    throw handleApiError(error, `${method} ${endpoint}`);
  }
}

// Convenience methods
export const apiGet = <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
  makeApiRequest<T>(endpoint, 'GET', undefined, options);

export const apiPost = <T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> =>
  makeApiRequest<T>(endpoint, 'POST', data, options);

export const apiPut = <T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> =>
  makeApiRequest<T>(endpoint, 'PUT', data, options);

export const apiDelete = <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
  makeApiRequest<T>(endpoint, 'DELETE', undefined, options);

// Specialized methods for common patterns
export async function fetchPaginatedData<T>(
  endpoint: string,
  params: Record<string, unknown> = {},
  options?: RequestOptions
): Promise<T> {
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>)
  ).toString();

  const url = queryString ? `${endpoint}?${queryString}` : endpoint;
  return apiGet<T>(url, options);
}

export async function uploadFile<T>(
  endpoint: string,
  formData: FormData,
  options?: RequestOptions
): Promise<T> {
  const uploadOptions = { 
    timeout: 60000, // 60 seconds for uploads
    retries: 1, // Fewer retries for uploads
    ...options 
  };

  return makeApiRequest<T>(endpoint, 'POST', formData, uploadOptions);
}