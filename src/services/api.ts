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

    console.debug('GraphQL Request:', {
      url: API_CONFIG.BASE_URL,
      headers: requestHeaders,
      body: requestBody,
    });

    const response = await fetch(API_CONFIG.BASE_URL, {
      method: 'POST',
      headers: requestHeaders,
      body: requestBody,
      credentials: 'omit',
    });

    if (!response.ok) {
      const errorResponse = await response.text();
      console.error('GraphQL Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorResponse
      });
      
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      
      throw new Error(
        `Request failed with status ${response.status}: ${errorResponse}`
      );
    }

    const result = await response.json() as APIResponse<T>;
    console.debug('GraphQL Response:', result);

    if (result.errors) {
      const errorMessage = result.errors[0]?.message || 'An error occurred';
      if (errorMessage.toLowerCase().includes('unauthorized')) {
        throw new Error('Please log in again to continue');
      }
      throw new Error(errorMessage);
    }

    return result.data;
  } catch (error) {
    console.error('GraphQL Request Failed:', error);
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