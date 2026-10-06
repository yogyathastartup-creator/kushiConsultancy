import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl, logApiResolution } from '../utils/api';
import '../styles/AdminLogin.css';

const AdminLogin = () => {
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        logApiResolution('AdminLogin');
    }, []);

    // Credentials are sent as JSON and never rendered, so they are passed through
    // unchanged; altering them would make some valid passwords impossible to enter.
    const handleChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        if (!credentials.username.trim() || !credentials.password) {
            setError('Please enter your username and password');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${getApiUrl()}/auth/login`, {
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

            if (response.status === 401) {
                setError('Invalid username or password');
                setCredentials(prev => ({ ...prev, password: '' }));
                return;
            }

            if (response.status === 429) {
                setError('Too many login attempts. Please try again in 15 minutes.');
                return;
            }

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
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
            setError('Unable to reach the server. Please try again shortly.');
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
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
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
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
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
