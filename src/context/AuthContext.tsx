import React, { createContext, useContext, useState } from 'react';
import type { AuthContextType, User } from '../types/auth';
import { sendPhoneOTP } from '../services/auth';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
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