import { API_CONFIG } from './config';
import type { APIResponse } from './types';

class APIError extends Error {
  constructor(public errors: any[], message?: string) {
    super(message || 'API Error');
    this.name = 'APIError';
  }
}

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, any>,
  headers?: Record<string, string>
): Promise<T> {
  try {
    const requestHeaders = {
      ...API_CONFIG.HEADERS,
      ...headers,
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    // Ensure variables is never undefined
    const requestBody = JSON.stringify({
      query,
      variables: variables || {},
    });

    // Log request details only in development
    if (process.env.NODE_ENV === 'development') {
      console.debug('GraphQL Request:', {
        url: API_CONFIG.BASE_URL,
        headers: requestHeaders,
        body: requestBody,
      });
    }

    const response = await fetch(API_CONFIG.BASE_URL, {
      method: 'POST',
      headers: requestHeaders,
      body: requestBody,
      credentials: 'omit',
    });

    if (!response.ok) {
      const errorResponse = await response.text();
      let errorMessage = `Request failed with status ${response.status}`;
      
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      } else if (response.status === 400) {
        try {
          const errorData = JSON.parse(errorResponse);
          if (errorData.errors?.[0]?.message) {
            errorMessage = errorData.errors[0].message;
          }
        } catch (e) {
          // If parsing fails, use the raw error response
          errorMessage = errorResponse;
        }
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json() as APIResponse<T>;
    
    // Log response only in development
    if (result.errors) {
      const errorMessage = result.errors[0]?.message || 'An error occurred';
      if (errorMessage.toLowerCase().includes('unauthorized')) {
        throw new Error('Please log in again to continue');
      }
      // Format validation errors nicely
      if (errorMessage.includes('validation failed')) {
        const validationErrors = result.errors
          .map(error => error.message)
          .join('. ');
        throw new Error(`Validation failed: ${validationErrors}`);
      }
      // Handle internal server errors with more detail
      if (errorMessage.includes('Internal Server Error')) {
        console.error('GraphQL Error Details:', result.errors);
        throw new Error('The server encountered an error. Please try again later.');
      }
      throw new Error(errorMessage);
    }

    if (process.env.NODE_ENV === 'development') {
      console.debug('GraphQL Response:', result);
    }

    return result.data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    } else if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw error;
    }
    throw new Error('Failed to fetch data from API');
  }
}