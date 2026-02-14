import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Cpu, Lock, User, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { toast } from '../components/Toast';
import './Login.css';

const Register = () => {
    const { register, isAuthenticated } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !email || !password || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        const result = await register(name, email, password);
        setLoading(false);

        if (result.success) {
            toast.success('Registration successful! You can now login.');
        } else {
            toast.error(result.error || 'Registration failed');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <Cpu size={48} />
                    </div>
                    <h1 className="login-title">Create Account</h1>
                    <p className="login-subtitle">Join the Manufacturing Control Platform</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">
                            <User size={16} />
                            Full Name
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Mail size={16} />
                            Email
                        </label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
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
                            placeholder="Create a password (min 6 characters)"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Lock size={16} />
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            className="form-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        loading={loading}
                        className="login-button"
                    >
                        Create Account
                    </Button>
                </form>

                <div className="login-demo">
                    <p className="demo-title">Already have an account?</p>
                    <Link to="/login" className="demo-link">
                        Sign in here
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
