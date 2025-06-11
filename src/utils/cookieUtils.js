import { useState, useEffect } from 'react';

/**
 * Utilidades para manejo seguro de cookies
 * Las cookies HttpOnly se envían automáticamente, no necesitan manipulación manual
 */

/**
 * Hace una petición autenticada usando las cookies automáticamente
 * @param {string} url - URL del endpoint
 * @param {object} options - Opciones adicionales para fetch
 * @returns {Promise<Response>}
 */
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

/**
 * Verifica si el usuario está autenticado haciendo una petición al endpoint de perfil
 * @returns {Promise<object|null>} - Información del usuario o null si no está autenticado
 */
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

/**
 * Hook para verificar autenticación del lado del cliente
 * @returns {object} - Estado de autenticación {user, loading, error}
 */
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
