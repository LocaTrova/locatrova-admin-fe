// Common API error handling

export class ApiError extends Error {
  public code: string;
  public statusCode?: number;
  public details?: unknown;

  constructor(message: string, code: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends ApiError {
  constructor(message: string = 'Network error occurred') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND_ERROR', 404);
    this.name = 'NotFoundError';
  }
}

export class ServerError extends ApiError {
  constructor(message: string = 'Internal server error') {
    super(message, 'SERVER_ERROR', 500);
    this.name = 'ServerError';
  }
}

export class TimeoutError extends ApiError {
  constructor(message: string = 'Request timeout') {
    super(message, 'TIMEOUT_ERROR', 408);
    this.name = 'TimeoutError';
  }
}

// Location-specific error class for backward compatibility
export class LocationAPIError extends ApiError {
  constructor(message: string, code: string, statusCode?: number) {
    super(message, code, statusCode);
    this.name = 'LocationAPIError';
  }
}

// Error factory function
export function createApiError(error: unknown, defaultMessage: string = 'An error occurred'): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return new NetworkError('Network connection error. Please check your internet connection.');
    }
    
    if (message.includes('401') || message.includes('unauthorized')) {
      return new AuthenticationError('Session expired. Please log in again.');
    }
    
    if (message.includes('403') || message.includes('forbidden')) {
      return new AuthorizationError('You do not have permission to perform this action.');
    }
    
    if (message.includes('404') || message.includes('not found')) {
      return new NotFoundError('The requested resource was not found.');
    }
    
    if (message.includes('400') || message.includes('bad request')) {
      return new ValidationError('Invalid request. Please check your input.');
    }
    
    if (message.includes('500') || message.includes('internal server')) {
      return new ServerError('Server error. Please try again later.');
    }
    
    if (message.includes('timeout')) {
      return new TimeoutError('Request timed out. Please try again.');
    }
    
    return new ApiError(error.message, 'UNKNOWN_ERROR');
  }

  return new ApiError(defaultMessage, 'UNKNOWN_ERROR');
}

// Error handler utility
export function handleApiError(error: unknown, context: string = 'API call'): never {
  const apiError = createApiError(error, `${context} failed`);
  console.error(`[${context}] ${apiError.name}:`, {
    message: apiError.message,
    code: apiError.code,
    statusCode: apiError.statusCode,
    details: apiError.details
  });
  throw apiError;
}