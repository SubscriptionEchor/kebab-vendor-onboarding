import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthContextType, User } from '../types/auth';
import { sendPhoneOTP } from '../services/auth';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(
    localStorage.getItem('authToken')
  );

  const login = async (phone: string, countryCode: string) => {
    setIsLoading(true);
    try {
      const response = await sendPhoneOTP(phone);
      if (!response.sendPhoneOtpForOnboardingVendorLogin.result) {
        throw new Error(response.sendPhoneOtpForOnboardingVendorLogin.message);
      }
      
      // Store token if provided in response
      if (response.sendPhoneOtpForOnboardingVendorLogin.token) {
        const token = response.sendPhoneOtpForOnboardingVendorLogin.token;
        localStorage.setItem('authToken', token);
        setAuthToken(token);
      }
      setUser({
        id: '1',
        email: '',
        phone,
        name: `Restaurant Owner (${countryCode})`,
        role: 'owner',
      });
      return response.sendPhoneOtpForOnboardingVendorLogin.result;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
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
  }, [authToken]);

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