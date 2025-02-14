import { useToast } from '../context/ToastContext';

export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    public errors: Record<string, string[]>
  ) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export function handleAPIError(error: unknown): never {
  if (error instanceof APIError) {
    switch (error.statusCode) {
      case 400:
        throw new ValidationError(error.data?.errors || {});
      case 401:
      case 403:
        throw new AuthenticationError(error.message);
      default:
        throw new Error(error.message || 'An unexpected error occurred');
    }
  }

  if (error instanceof NetworkError) {
    throw new Error('Network error. Please check your connection and try again.');
  }

  if (error instanceof Error) {
    throw error;
  }

  throw new Error('An unexpected error occurred');
}

export function useAPIErrorHandler() {
  const { showToast } = useToast();

  return (error: unknown) => {
    if (error instanceof ValidationError) {
      const messages = Object.values(error.errors).flat();
      messages.forEach(message => showToast(message, 'error'));
      return;
    }

    if (error instanceof AuthenticationError) {
      showToast(error.message, 'error');
      // Redirect to login if needed
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return;
    }

    if (error instanceof NetworkError) {
      showToast('Network error. Please check your connection and try again.', 'error');
      return;
    }

    if (error instanceof Error) {
      showToast(error.message, 'error');
      return;
    }

    showToast('An unexpected error occurred', 'error');
  };
}