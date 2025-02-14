import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuthToken() {
  const navigate = useNavigate();
  
  // Monitor token expiration
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        
        if (Date.now() >= expirationTime) {
          clearToken();
        } else {
          const timeout = setTimeout(() => {
            clearToken();
          }, expirationTime - Date.now());
          
          return () => clearTimeout(timeout);
        }
      } catch (error) {
        console.error('Error parsing token:', error);
        clearToken();
      }
    }
  }, []);

  const getToken = useCallback(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      throw new Error('Please log in to continue');
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (Date.now() >= payload.exp * 1000) {
        clearToken();
        throw new Error('Session expired. Please log in again');
      }
    } catch (error) {
      clearToken();
      throw new Error('Invalid session. Please log in again');
    }
    
    return token;
  }, [navigate]);

  const getUserId = useCallback(() => {
    const token = getToken();
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.sub;
      if (!userId) {
        navigate('/login');
        throw new Error('Invalid token');
      }
      return userId;
    } catch {
      navigate('/login');
      throw new Error('Session expired');
    }
  }, [getToken, navigate]);

  const clearToken = useCallback(() => {
    localStorage.removeItem('authToken');
    navigate('/login');
  }, [navigate]);

  return { getToken, getUserId, clearToken };
}