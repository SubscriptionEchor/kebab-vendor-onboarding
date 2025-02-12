import { useState, useCallback } from 'react';
import { useAPIErrorHandler } from '../utils/api';

interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
}

export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOptions<T> = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  
  const handleError = useAPIErrorHandler();

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await asyncFunction(...args);
        setData(result);
        options.onSuccess?.(result);
        return result;
      } catch (error) {
        setError(error instanceof Error ? error : new Error('An error occurred'));
        handleError(error);
        options.onError?.(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFunction, options, handleError]
  );

  return {
    isLoading,
    error,
    data,
    execute
  };
}