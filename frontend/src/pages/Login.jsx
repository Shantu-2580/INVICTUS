import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Cpu, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { toast } from '../components/Toast';
import './Login.css';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      toast.success('Login successful');
    } else {
      toast.error(result.error || 'Invalid credentials');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Cpu size={48} />
          </div>
          <h1 className="login-title">PCB Inventory Automation</h1>
          <p className="login-subtitle">Manufacturing Control Platform</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <User size={16} />
              Email
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={16} />
              Password
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="login-button"
          >
            Sign In
          </Button>
        </form>

        <div className="login-demo">
          <p className="demo-title">First Time Setup</p>
          <div className="demo-credentials">
            <div className="demo-item">
              <span className="demo-label">Step 1:</span>
              <code>Register an account</code>
            </div>
            <div className="demo-item">
              <span className="demo-label">Step 2:</span>
              <code>All users get admin access</code>
            </div>
          </div>
          <Link to="/register" style={{ display: 'block', marginTop: '1rem', textAlign: 'center', color: 'var(--color-primary-500)', textDecoration: 'none' }}>
            Don't have an account? Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
