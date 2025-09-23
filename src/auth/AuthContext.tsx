import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Static users - CHANGE THESE PASSWORDS IN PRODUCTION!
const STATIC_USERS = {
  'admin@company.com': {
    password: 'admin123',
    role: 'admin',
    name: 'Admin User'
  },
  'user@company.com': {
    password: 'user123',
    role: 'user',
    name: 'Regular User'
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('invoiceAppUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    const userData = STATIC_USERS[email as keyof typeof STATIC_USERS];
    
    if (userData && userData.password === password) {
      const userInfo: User = {
        email,
        name: userData.name,
        role: userData.role
      };
      
      setUser(userInfo);
      localStorage.setItem('invoiceAppUser', JSON.stringify(userInfo));
      return { success: true };
    }
    
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('invoiceAppUser');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
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