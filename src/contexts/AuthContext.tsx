import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-toastify';

interface UserData {
  name: string;
  email: string;
  role: string;
  userId: string;
  phone?: string;
  gender?: string;
  dob?: string;
  profilePicture?: string;
  organizerId?: string;
  organizerName?: string;
  organizerType?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserData | null;
  login: (token: string, email: string, role: string, name: string, userId: string, additionalData?: Partial<UserData>) => void;
  logout: () => void;
  updateUserData: (data: Partial<UserData>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    // Check if user is logged in on mount and restore session
    const token = sessionStorage.getItem('token');
    const email = sessionStorage.getItem('email');
    const role = sessionStorage.getItem('role');
    const name = sessionStorage.getItem('name');
    const userId = sessionStorage.getItem('userId');
    const phone = sessionStorage.getItem('phone');
    const gender = sessionStorage.getItem('gender');
    const dob = sessionStorage.getItem('dob');
    const profilePicture = sessionStorage.getItem('profilePicture');
    const organizerId = sessionStorage.getItem('organizerId');
    const organizerName = sessionStorage.getItem('organizerName');
    const organizerType = sessionStorage.getItem('organizerType');

    if (token && email && role && name && userId) {
      const userData: UserData = {
        name,
        email,
        role,
        userId,
      };
      
      if (phone) userData.phone = phone;
      if (gender) userData.gender = gender;
      if (dob) userData.dob = dob;
      if (profilePicture) userData.profilePicture = profilePicture;
      if (organizerId) userData.organizerId = organizerId;
      if (organizerName) userData.organizerName = organizerName;
      if (organizerType) userData.organizerType = organizerType;

      setIsAuthenticated(true);
      setUser(userData);
    }
  }, []);

  const login = (token: string, email: string, role: string, name: string, userId: string, additionalData?: Partial<UserData>) => {
    // Store all session data
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('email', email);
    sessionStorage.setItem('role', role);
    sessionStorage.setItem('name', name);
    sessionStorage.setItem('userId', userId);
    
    // Store additional user data if provided
    if (additionalData) {
      if (additionalData.phone) sessionStorage.setItem('phone', additionalData.phone);
      if (additionalData.gender) sessionStorage.setItem('gender', additionalData.gender);
      if (additionalData.dob) sessionStorage.setItem('dob', additionalData.dob);
      if (additionalData.profilePicture) sessionStorage.setItem('profilePicture', additionalData.profilePicture);
      if (additionalData.organizerId) sessionStorage.setItem('organizerId', additionalData.organizerId);
      if (additionalData.organizerName) sessionStorage.setItem('organizerName', additionalData.organizerName);
      if (additionalData.organizerType) sessionStorage.setItem('organizerType', additionalData.organizerType);
    }

    const userData: UserData = {
      name,
      email,
      role,
      userId,
      ...additionalData,
    };

    setIsAuthenticated(true);
    setUser(userData);
  };

  const updateUserData = (data: Partial<UserData>) => {
    // Update session storage
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        sessionStorage.setItem(key, String(value));
      }
    });

    // Update state
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
    }
  };

  const logout = () => {
    // Logout functionality is disabled
    console.warn('Logout is currently disabled');
    toast.error('Logout is not allowed at this time', { position: 'top-right' });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateUserData }}>
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

