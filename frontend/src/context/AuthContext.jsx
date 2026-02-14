import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback
} from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Initialize session on first load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  // 🔹 Login
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);

      const response = await axios.post(
        'http://localhost:5000/api/auth/login',
        { email, password }
      );

      if (response.data.success) {
        const { token: authToken, user: userData } = response.data.data;

        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));

        setToken(authToken);
        setUser(userData);

        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

        return { success: true, user: userData };
      }

      throw new Error('Login failed');
    } catch (error) {
      console.error('Login error:', error);
      const message =
        error.response?.data?.message ||
        error.message ||
        'Invalid credentials';

      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 Register
  const register = useCallback(async (name, email, password) => {
    try {
      setLoading(true);

      const response = await axios.post(
        'http://localhost:5000/api/auth/register',
        {
          name,
          email,
          password,
          role: 'admin'
        }
      );

      if (response.data.success) {
        const { token: authToken, user: userData } = response.data.data;

        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));

        setToken(authToken);
        setUser(userData);

        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

        return { success: true, user: userData };
      }

      throw new Error('Registration failed');
    } catch (error) {
      console.error('Registration error:', error);

      const message =
        error.response?.data?.message ||
        error.message ||
        'Registration failed';

      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 Logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    delete axios.defaults.headers.common['Authorization'];

    setToken(null);
    setUser(null);
  }, []);

  // 🔹 Auth state
  const value = useMemo(
    () => ({
      user,
      token,
      login,
      register,
      logout,
      loading,
      isAuthenticated: !!token,   // ✅ FIXED: only token determines auth
      isAdmin: user?.role === 'admin'
    }),
    [user, token, loading]
  );

  // 🔹 Prevent rendering until session check completes
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'monospace'
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
