// app/context/AuthContext.js
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie'; // Para manejar cookies si tu backend las usa para sesión

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Para saber si estamos verificando el estado inicial
  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8080';

  // Función para verificar el estado de autenticación al cargar la app
  const checkUserLoggedIn = async () => {
    setLoading(true);
    try {
      // Intenta obtener los datos del usuario si ya hay una sesión activa
      const res = await axios.get(`${apiUrl}/api/auth/me`, {
        withCredentials: true,
      });
      if (res.data && res.data.email) {
        setUser(res.data);
         // Opcional: Sincronizar con localStorage si lo deseas
        localStorage.setItem('user', JSON.stringify(res.data));
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.warn('AuthContext: No user session found or error fetching /me', error.response?.data || error.message);
      setUser(null);
      localStorage.removeItem('user');
      // No redirigir aquí, la página específica lo hará si es necesario
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Al montar el AuthProvider, verifica si hay un usuario logueado
    // Esto es útil para persistir la sesión entre recargas de página
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setLoading(false); // Ya tenemos el usuario del localStorage, podemos marcar como no cargando
            // Opcionalmente, podrías re-validar con /me aquí si quieres la data más fresca siempre
            // checkUserLoggedIn(); // Descomenta si quieres siempre validar con backend
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
            localStorage.removeItem('user');
            checkUserLoggedIn(); // Si falla el parseo, intenta con el backend
        }
    } else {
        checkUserLoggedIn();
    }
  }, []);


  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData)); // Guardar en localStorage
  };

  const logout = async () => {
    setLoading(true);
    try {
      await axios.post(`${apiUrl}/api/auth/logout`, {}, {
        withCredentials: true,
      });
      console.log('AuthContext: Logout successful on backend.');
    } catch (err) {
      console.error('AuthContext: Error during backend logout:', err.response?.data || err.message);
      // A pesar del error, procedemos a desloguear en el frontend
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      Cookies.remove('connect.sid'); // Asegúrate de que el nombre de la cookie sea el correcto
                                      // Si usas JWT en cookie, remueve esa cookie.
      setLoading(false);
      router.push('/login'); // Redirigir a login tras logout
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkUserLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};