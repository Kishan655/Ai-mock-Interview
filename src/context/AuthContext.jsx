import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('interviewai_token');
        if (token) {
          const res = await authAPI.getMe();
          if (res && res.user) {
            setUser(res.user);
          }
        }
      } catch (err) {
        console.warn('Auth token expired or invalid:', err.message);
        localStorage.removeItem('interviewai_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const register = async (name, email, password, targetRole, experienceLevel) => {
    const res = await authAPI.register({
      name,
      email,
      password,
      targetRole,
      experienceLevel,
    });
    if (res && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const updateUserState = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
