
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const apiUrl =  'https://localhost:8080';

  const checkUserLoggedIn = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/api/auth/me`, {
        withCredentials: true,
      });
      if (res.data && res.data.email) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.warn('AuthContext: No user session found or error fetching /me', error.response?.data || error.message);
      setUser(null);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setLoading(false); 
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
            localStorage.removeItem('user');
            checkUserLoggedIn();
        }
    } else {
        checkUserLoggedIn();
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
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
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      Cookies.remove('connect.sid'); 
      setLoading(false);
      router.push('/login'); 
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