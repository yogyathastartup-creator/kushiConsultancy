import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sanitizeInput, validateUsername, validatePassword } from '../utils/validation';
import '../styles/AdminLogin.css';

const AdminLogin = () => {
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const sanitized = sanitizeInput(e.target.value);
        setCredentials({
            ...credentials,
            [e.target.name]: sanitized
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        // Client-side validation
        if (!validateUsername(credentials.username)) {
            setError('Invalid username format');
            setLoading(false);
            return;
        }

        const passwordValidation = validatePassword(credentials.password);
        if (!passwordValidation.valid) {
            setError(passwordValidation.message);
            setLoading(false);
            return;
        }

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: credentials.username,
                    password: credentials.password
                })
            });

            const contentType = response.headers.get('Content-Type');
            
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Server error: ${response.status} - ${text}`);
            }

            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                
                if (data.success) {
                    sessionStorage.setItem('adminLoggedIn', 'true');
                    sessionStorage.setItem('adminUser', JSON.stringify(data.user));
                    sessionStorage.setItem('adminLoginTime', new Date().toISOString());
                    navigate('/admin/dashboard');
                } else {
                    setError(data.message || 'Invalid username or password');
                    setCredentials({ username: '', password: '' });
                }
            } else {
                throw new Error('Server returned non-JSON response');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Network error. Please ensure the server is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-container">
                <div className="admin-login-header">
                    <h1>🔐 Admin Panel</h1>
                    <p>Kushi Consultancy Management</p>
                </div>

                {error && <div className="admin-error">{error}</div>}

                <form onSubmit={handleSubmit} className="admin-login-form">
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            name="username"
                            placeholder="Enter admin username"
                            value={credentials.username}
                            onChange={handleChange}
                            required
                            autoComplete="username"
                            disabled={loading}
                            maxLength="50"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Enter admin password"
                            value={credentials.password}
                            onChange={handleChange}
                            required
                            autoComplete="current-password"
                            disabled={loading}
                            maxLength="128"
                        />
                    </div>

                    <button type="submit" className="admin-login-btn" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login to Admin Panel'}
                    </button>
                </form>

                <div className="admin-note">
                    <p>⚠️ <strong>Secure Login:</strong></p>
                    <p>This login is now protected with secure authentication.</p>
                    <p>Contact your administrator for credentials.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
