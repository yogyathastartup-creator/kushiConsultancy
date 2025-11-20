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
            // Call secure backend API with robust error handling
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies
                body: JSON.stringify({
                    username: credentials.username,
                    password: credentials.password
                })
            })
            .then(response => {
                const contentType = response.headers.get('Content-Type');
                if (response.ok && contentType && contentType.includes('application/json')) {
                    return response.json();
                }
                // If not OK or not JSON, parse as text to see the error
                return response.text().then(text => {
                    throw new Error(`Server responded with ${response.status}: ${text}`);
                });
            })
            .then(data => {
                if (data.success) {
                    // Set admin session
                    sessionStorage.setItem('adminLoggedIn', 'true');
                    sessionStorage.setItem('adminUser', JSON.stringify(data.user));
                    sessionStorage.setItem('adminLoginTime', new Date().toISOString());
                    navigate('/admin/dashboard');
                } else {
                    // Handle application-level errors (e.g., wrong password)
                    setError(data.message || 'Invalid username or password');
                    setCredentials({ username: '', password: '' });
                }
            })
            .catch(err => {
                // Handle network errors or non-JSON responses
                console.error('Login fetch error:', err);
                setError(err.message || 'Network error. Please check the server and try again.');
            })
            .finally(() => {
                setLoading(false);
            });
        } catch (err) {
            // This outer catch is for synchronous errors before the fetch
            console.error('Login setup error:', err);
            setError('An unexpected error occurred. Please try again.');
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
