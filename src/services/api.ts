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
    };

    const response = await fetch(API_CONFIG.BASE_URL, {
      method: 'POST',
      headers: requestHeaders,
      credentials: 'omit',
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed: ${errorText}`);
    }

    const result = await response.json() as APIResponse<T>;

    if (result.errors) {
      const errorMessage = result.errors[0]?.message || 'An error occurred';
      if (errorMessage.toLowerCase().includes('unauthorized')) {
        throw new Error('Please log in again to continue');
      }
      throw new Error(errorMessage);
    }

    return result.data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    } else if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch data from API');
  }
}