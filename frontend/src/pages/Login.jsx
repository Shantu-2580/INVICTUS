import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Cpu, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { toast } from '../components/Toast';
import './Login.css';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      toast.success('Login successful');
    } else {
      toast.error('Invalid credentials');
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
              Username
            </label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
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
          <p className="demo-title">Demo Credentials</p>
          <div className="demo-credentials">
            <div className="demo-item">
              <span className="demo-label">Admin:</span>
              <code>admin / admin</code>
            </div>
            <div className="demo-item">
              <span className="demo-label">Viewer:</span>
              <code>viewer / viewer</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
