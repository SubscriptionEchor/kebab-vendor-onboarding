import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthContextType, User } from '../types/auth';
import { sendPhoneOTP, verifyPhoneOTP } from '../services/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApplications } from '../services/restaurant';
import { useToast } from './ToastContext';

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(() => {
    // Try to restore user from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'active' | 'expired' | 'refreshing' | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(
    localStorage.getItem('authToken')
  );

  // Function to parse JWT and get expiration time
  const getTokenExpiration = (token: string): number => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
      console.error('Failed to parse token:', error);
      return 0;
    }
  };

  // Function to check if token needs refresh
  const needsRefresh = (expirationTime: number): boolean => {
    return Date.now() >= (expirationTime - SESSION_REFRESH_THRESHOLD);
  };

  // Function to refresh the session
  const refreshSession = async () => {
    if (!authToken || sessionStatus === 'refreshing') return;

    try {
      setSessionStatus('refreshing');
      // TODO: Implement actual token refresh logic here
      // For now, we'll just verify the current token
      const expirationTime = getTokenExpiration(authToken);
      
      if (Date.now() >= expirationTime) {
        throw new Error('Session expired');
      }
      
      setSessionStatus('active');
    } catch (error) {
      console.error('Session refresh failed:', error);
      handleSessionExpired();
    }
  };

  // Function to handle expired sessions
  const handleSessionExpired = () => {
    setSessionStatus('expired');
    logout();
    
    // Only show toast and redirect if not already on login page
    if (!location.pathname.includes('/login')) {
      showToast('Your session has expired. Please log in again.', 'error');
      navigate('/login', { 
        state: { from: location.pathname },
        replace: true 
      });
    }
  };

  const login = async (phone: string, countryCode: string) => {
    setIsLoading(true);
    try {
      const response = await sendPhoneOTP(phone);
      if (!response.sendPhoneOtpForOnboardingVendorLogin.result) {
        throw new Error(response.sendPhoneOtpForOnboardingVendorLogin.message);
      }
      
      const newUser = {
        id: '1',
        email: '',
        phone,
        name: `Restaurant Owner (${countryCode})`,
        role: 'owner',
      };
      
      setUser(newUser);
      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setSessionStatus('active');
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
    localStorage.removeItem('user');
    window.localStorage.removeItem('restaurantApplication');
    window.localStorage.removeItem('restaurantDocuments');
    window.localStorage.removeItem('authToken');
    window.sessionStorage.removeItem('currentStep');
    setUser(null);
    setSessionStatus(null);
    setAuthToken(null);
  };

  // Monitor token expiration
  useEffect(() => {
    if (authToken) {
      try {
        const expirationTime = getTokenExpiration(authToken);
        
        if (Date.now() >= expirationTime) {
          handleSessionExpired();
        } else if (needsRefresh(expirationTime)) {
          refreshSession();
        } else {
          setSessionStatus('active');
          
          // Set up refresh timer
          const refreshTime = expirationTime - SESSION_REFRESH_THRESHOLD;
          const refreshTimeout = setTimeout(() => {
            refreshSession();
          }, refreshTime - Date.now());
          
          // Set up expiration timer
          const expirationTimeout = setTimeout(() => {
            handleSessionExpired();
          }, expirationTime - Date.now());
          
          return () => {
            clearTimeout(refreshTimeout);
            clearTimeout(expirationTimeout);
          };
        }
      } catch (error) {
        console.error('Error parsing token:', error);
        handleSessionExpired();
      }
    }
  }, [authToken]);

  const verifyOTP = async (phone: string, otp: string) => {
    setIsLoading(true);
    try {
      console.log('[AuthContext] Verifying OTP for phone:', phone);
      const response = await verifyPhoneOTP(phone, otp);
      console.log('[AuthContext] OTP verification response:', response);
      
      if (response.verifyPhoneOtpForOnboardingVendorAndLogin.token) {
        const token = response.verifyPhoneOtpForOnboardingVendorAndLogin.token;
        const { potentialVendor, isNewVendor } = response.verifyPhoneOtpForOnboardingVendorAndLogin;
        
        // Store token
        console.log('[AuthContext] Storing auth token');
        localStorage.setItem('authToken', token);
        setAuthToken(token);
        
        // Store user info
        const userInfo = {
          id: potentialVendor._id,
          phone: potentialVendor.phoneNumber,
          email: '',
          name: 'Restaurant Owner',
          role: 'owner'
        };
        console.log('[AuthContext] Storing user info:', userInfo);
        localStorage.setItem('user', JSON.stringify(userInfo));
        setUser(userInfo);
        
        // Navigate based on user status
        console.log('[AuthContext] Navigating based on user status. isNewVendor:', isNewVendor);
        if (isNewVendor) {
          navigate('/verify-email');
        } else {
          navigate('/applications');
        }
        
        return response;
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!authToken,
        isLoading,
        login,
        verifyOTP,
        logout,
        sessionStatus
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