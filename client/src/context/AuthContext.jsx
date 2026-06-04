import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import jsCookie from 'js-cookie';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Set default axios params & global interceptor
axios.defaults.baseURL = 'http://localhost:5000/api';

axios.interceptors.request.use(
  (config) => {
    const token = jsCookie.get('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = jsCookie.get('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get('/auth/me');
      setUser(res.data.user);
    } catch (error) {
      jsCookie.remove('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post('/auth/login', { email, password });
    jsCookie.set('token', res.data.token, { expires: 30 });
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (userData) => {
    const res = await axios.post('/auth/register', userData);
    jsCookie.set('token', res.data.token, { expires: 30 });
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    jsCookie.remove('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, fetchUser }}>
      {loading ? (
        <div className="h-screen w-full flex justify-center items-center text-xl font-semibold">
          Loading...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
