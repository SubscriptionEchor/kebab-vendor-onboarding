import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthContextType, User } from '../types/auth';
import { sendPhoneOTP, verifyPhoneOTP } from '../services/auth';
import { getApplications } from '../services/restaurant';
import { useNavigate } from 'react-router-dom';
import { getCuisines } from '../services/restaurant'; 

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldFetchApplications, setShouldFetchApplications] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(
    localStorage.getItem('authToken')
  );
  const [cuisines, setCuisines] = useState<Array<{ name: string }>>([]);

  const fetchCuisines = async (token: string) => {
    console.log('Starting cuisine fetch with token:', token);

    // Try to load from cache first
    const cachedCuisines = localStorage.getItem('cachedCuisines');
    if (cachedCuisines) {
      try {
        const parsed = JSON.parse(cachedCuisines);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCuisines(parsed);
          return;
        }
      } catch (error) {
        console.warn('Failed to parse cached cuisines:', error);
        localStorage.removeItem('cachedCuisines');
      }
    }

    try {
      const response = await getCuisines();
      console.log('Raw cuisine response:', response);
      if (response?.vendorOnboardingBootstrap?.cuisines) {
        const uniqueCuisines = Array.from(
          new Set(response.vendorOnboardingBootstrap.cuisines.map(c => c.name))
        ).map(name => ({ name }));
        
        // Only update if we got valid data
        if (uniqueCuisines.length > 0) {
          console.log('Setting cuisines:', uniqueCuisines);
          setCuisines(uniqueCuisines);
          localStorage.setItem('cachedCuisines', JSON.stringify(uniqueCuisines));
          return;
        }
      }
      throw new Error('No cuisine data received from API');
    } catch (error) {
      // Provide default cuisines if fetch fails
      const defaultCuisines = [
        { name: 'Turkish' },
        { name: 'Indian' },
        { name: 'Italian' },
        { name: 'German' },
        { name: 'Mediterranean' },
        { name: 'Asian' },
        { name: 'Middle Eastern' },
        { name: 'International' }
      ];
      
      console.warn('Failed to fetch cuisines, using defaults:', error);
      setCuisines(defaultCuisines);
    }
  };

  // Fetch cuisines when auth token changes
  useEffect(() => {
    if (authToken) {
      if (cuisines.length === 0) {
        console.log('No cuisines loaded, fetching from API');
        fetchCuisines(authToken);
      }
    }
  }, [authToken, cuisines.length]);

  const login = async (phone: string, countryCode: string) => {
    setIsLoading(true);
    try {
      const response = await sendPhoneOTP(phone);
      if (!response.sendPhoneOtpForOnboardingVendorLogin.result) {
        throw new Error(response.sendPhoneOtpForOnboardingVendorLogin.message);
      }
      
      setUser({
        id: '1',
        email: '',
        phone,
        name: `Restaurant Owner (${countryCode})`,
        role: 'owner',
      });
      
      navigate('/verify-phone');
      return response.sendPhoneOtpForOnboardingVendorLogin.result;
    } catch (error) {
      console.error('Login failed:', error);
      if (error instanceof Error) {
        throw new Error(error.message || 'Failed to send verification code');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear application state on logout
    setShouldFetchApplications(false);
    window.localStorage.removeItem('restaurantApplication');
    window.localStorage.removeItem('restaurantDocuments');
    window.localStorage.removeItem('authToken');
    window.sessionStorage.removeItem('currentStep');
    setUser(null);
    setAuthToken(null);
  };

  const register = async (phone: string, countryCode: string, name: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement actual registration logic
      setUser({
        id: '1',
        email: '',
        phone,
        name,
        role: 'owner',
      });
    } finally {
      setIsLoading(false);
    }
  };
  // Monitor token expiration
  useEffect(() => {
    if (authToken) {
      try {
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        setShouldFetchApplications(true);
        
        if (Date.now() >= expirationTime) {
          logout();
        } else {
          // Set timeout to logout when token expires
          const timeout = setTimeout(() => {
            logout();
          }, expirationTime - Date.now());
          
          return () => clearTimeout(timeout);
        }
      } catch (error) {
        console.error('Error parsing token:', error);
        logout();
      }
    }
  }, [authToken, cuisines.length]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
        token: authToken,
        cuisines,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}