import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email });
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      console.log('Login response:', response.data);
      
      if (response.data.token && response.data.user) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setUser(user);
        return { success: true };
      } else {
        console.error('Invalid response format:', response.data);
        return {
          success: false,
          error: 'Invalid server response'
        };
      }
    } catch (error) {
      console.error('Login error:', error.response || error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to connect to server'
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      console.log('Attempting registration with:', { username, email });
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        username,
        email,
        password
      });
      console.log('Registration response:', response.data);

      if (response.data.token && response.data.user) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setUser(user);
        return { success: true };
      } else {
        console.error('Invalid response format:', response.data);
        return {
          success: false,
          error: 'Invalid server response'
        };
      }
    } catch (error) {
      console.error('Registration error:', error.response || error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to connect to server'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 