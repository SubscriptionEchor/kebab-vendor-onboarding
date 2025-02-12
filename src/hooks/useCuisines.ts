import { useState, useEffect } from 'react';
import { getCuisines } from '../services/restaurant';

const CACHE_KEY = 'cachedCuisines';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CacheData {
  cuisines: Array<{ name: string }>;
  timestamp: number;
}

export function useCuisines() {
  const [cuisines, setCuisines] = useState<Array<{ name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCuisines = async () => {
      try {
        // Check cache first
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { cuisines: cachedCuisines, timestamp }: CacheData = JSON.parse(cachedData);
          
          // Check if cache is still valid
          if (Date.now() - timestamp < CACHE_DURATION && cachedCuisines.length > 0) {
            console.log('Using cached cuisines');
            setCuisines(cachedCuisines);
            setIsLoading(false);
            return;
          }
        }

        // Fetch fresh data
        const response = await getCuisines();
        if (response?.vendorOnboardingBootstrap?.cuisines) {
          const cuisineData = response.vendorOnboardingBootstrap.cuisines;
          const uniqueCuisines = [...new Set(cuisineData.map(c => c.name))]
            .map(name => ({ name: name.trim() }))
            .sort((a, b) => a.name.localeCompare(b.name));

          // Update cache
          const cacheData: CacheData = {
            cuisines: uniqueCuisines,
            timestamp: Date.now()
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

          setCuisines(uniqueCuisines);
        } else {
          throw new Error('No cuisine data received');
        }
      } catch (error) {
        console.error('Failed to fetch cuisines:', error);
        setError(error instanceof Error ? error : new Error('Failed to fetch cuisines'));
        
        // Use default cuisines as fallback
        setCuisines([
          { name: 'Turkish' },
          { name: 'Indian' },
          { name: 'Italian' },
          { name: 'German' },
          { name: 'Mediterranean' },
          { name: 'Asian' },
          { name: 'Middle Eastern' },
          { name: 'International' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCuisines();
  }, []);

  const refreshCuisines = async () => {
    setIsLoading(true);
    setError(null);
    localStorage.removeItem(CACHE_KEY);
    
    try {
      const response = await getCuisines();
      if (response?.vendorOnboardingBootstrap?.cuisines) {
        const cuisineData = response.vendorOnboardingBootstrap.cuisines;
        const uniqueCuisines = [...new Set(cuisineData.map(c => c.name))]
          .map(name => ({ name: name.trim() }))
          .sort((a, b) => a.name.localeCompare(b.name));

        const cacheData: CacheData = {
          cuisines: uniqueCuisines,
          timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

        setCuisines(uniqueCuisines);
      } else {
        throw new Error('No cuisine data received');
      }
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Failed to refresh cuisines'));
    } finally {
      setIsLoading(false);
    }
  };

  return { cuisines, isLoading, error, refreshCuisines };
}