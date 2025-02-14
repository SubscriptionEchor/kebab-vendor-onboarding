import { API_CONFIG } from './config';
import type { APIResponse } from './types';
import { APIError, NetworkError, handleAPIError } from '../utils/api';

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

    const requestBody = JSON.stringify({
      query,
      variables: variables || {},
    });

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
      let errorData;
      
      try {
        errorData = JSON.parse(errorResponse);
      } catch {
        errorData = { message: errorResponse };
      }

      throw new APIError(
        response.status,
        errorData.errors?.[0]?.message || 'Request failed',
        errorData
      );
    }

    const result = await response.json() as APIResponse<T>;
    
    if (result.errors) {
      const error = result.errors[0];
      if (error.message.toLowerCase().includes('unauthorized')) {
        throw new APIError(401, 'Please log in again to continue');
      }

      if (error.message.includes('validation failed')) {
        const validationErrors = result.errors.reduce((acc, err) => {
          const field = err.path[err.path.length - 1];
          if (!acc[field]) acc[field] = [];
          acc[field].push(err.message);
          return acc;
        }, {} as Record<string, string[]>);

        throw new APIError(400, 'Validation failed', {
          errors: validationErrors
        });
      }

      if (error.message.includes('Internal Server Error')) {
        console.error('GraphQL Error Details:', result.errors);
        throw new APIError(
          500,
          'The server encountered an error. Please try again later.'
        );
      }

      throw new APIError(400, error.message);
    }

    if (process.env.NODE_ENV === 'development') {
      console.debug('GraphQL Response:', result);
    }

    return result.data;
  } catch (error) {
    return handleAPIError(error);
  }
}