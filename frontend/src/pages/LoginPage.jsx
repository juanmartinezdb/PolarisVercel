// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Star, Eye, EyeOff } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import './AuthPages.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '', 
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login({
        username: formData.username,
        password: formData.password
      });
      navigate('/calendar');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <Star size={48} />
            <h1>Iter Polaris</h1>
          </div>
          <p className="auth-subtitle">Bienvenido, Aventurero</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Usuario</label> 
            <input
              type="text" // Tipo de input 'text'
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="small" /> : 'Comenzar aventura'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Eres nuevo?{' '}
            <Link to="/register" className="auth-link">
              Crea tu personaje
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;