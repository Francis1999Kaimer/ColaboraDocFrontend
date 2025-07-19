import { useState, useEffect } from 'react';

export const getJWTToken = async () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.token) {
        return userData.token;
      }
    }

    const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`);
    if (response.ok) {
      const data = await response.json();
      return data.token;
    }

    return null;
  } catch (error) {
    console.error('Error obteniendo token JWT:', error);
    return null;
  }
};

export const authenticatedFetch = async (url, options = {}) => {
  const defaultOptions = {
    credentials: 'include', 
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  return fetch(url, defaultOptions);
};

export const getCurrentUser = async () => {
  try {
    const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`);
    
    if (response.ok) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    return null;
  }
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { user, loading, error };
};
