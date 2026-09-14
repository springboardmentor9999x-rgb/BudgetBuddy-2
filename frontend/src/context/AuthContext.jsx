import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('budgetbuddy_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('budgetbuddy_token') || null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
  };

  const hideToast = () => {
    setToast(null);
  };

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('budgetbuddy_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Failed to load user profile:', err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = res.data;
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('budgetbuddy_token', access_token);
      localStorage.setItem('budgetbuddy_user', JSON.stringify(userData));
      showToast('success', 'Logged in successfully!');
      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      showToast('error', msg);
      return { success: false, message: msg, isUnverified: err.response?.status === 403 };
    }
  };

  const register = async (fullName, email, password, confirmPassword) => {
    try {
      const res = await api.post('/auth/register', {
        full_name: fullName,
        email,
        password,
        confirm_password: confirmPassword,
      });
      showToast('success', 'Registration successful! Verification OTP sent to email.');
      return { success: true, email };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed.';
      showToast('error', msg);
      return { success: false, message: msg };
    }
  };

  const verifyOTP = async (email, otp) => {
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      const { access_token, user: userData } = res.data;
      if (access_token) {
        setToken(access_token);
        localStorage.setItem('budgetbuddy_token', access_token);
      }
      if (userData) {
        setUser(userData);
        localStorage.setItem('budgetbuddy_user', JSON.stringify(userData));
      }
      showToast('success', 'Email verified successfully!');
      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid or expired OTP.';
      showToast('error', msg);
      return { success: false, message: msg };
    }
  };

  const resendOTP = async (email) => {
    try {
      await api.post('/auth/resend-otp', { email });
      showToast('info', 'New OTP code sent to your email.');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to resend OTP.';
      showToast('error', msg);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('budgetbuddy_token');
    localStorage.removeItem('budgetbuddy_user');
    showToast('info', 'Logged out safely.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        toast,
        showToast,
        hideToast,
        login,
        register,
        verifyOTP,
        resendOTP,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
