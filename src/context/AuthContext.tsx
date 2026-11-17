import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
  logout: () => void;
  isAdmin: boolean;
  isHOD: boolean;
  isAdvisor: boolean;
  isStudent: boolean;
  isCoordinator: boolean;
  isIndustry: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{
  user: User | null;
  token: string | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
  onLogout?: () => void;
  children: React.ReactNode;
}> = ({ user, token, setUser, setToken, onLogout, children }) => {
  const logout = useCallback(() => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('app_cache_tasks');
    } catch {}
    setToken(null);
    setUser(null);
    if (onLogout) onLogout();
  }, [setToken, setUser, onLogout]);

  const isAdmin = user?.role === 'SUPREME_ADMIN';
  const isHOD = user?.role === 'HOD';
  const isAdvisor = user?.role === 'CLASS_ADVISOR';
  const isStudent = user?.role === 'STUDENT';
  const isCoordinator = Boolean(user?.is_coordinator);
  const isIndustry = user?.role === 'INDUSTRY';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        setUser,
        setToken,
        logout,
        isAdmin,
        isHOD,
        isAdvisor,
        isStudent,
        isCoordinator,
        isIndustry,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
