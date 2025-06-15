import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Toast.css';

const ICONS = {
  success: '📜', 
  error: '☠️',   
  warning: '⚔️',  
  info: '⚜️'     
};

const Toast = ({ message, type, removeToast, id, duration }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const enterTimeout = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(enterTimeout);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [id, duration, removeToast]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => removeToast(id), 400);
  };

  const icon = ICONS[type] || ICONS.info;
  const toastClass = `toast toast-${type} ${isVisible ? 'toast-visible' : ''} ${isExiting ? 'toast-leaving' : ''}`;

  return (
    <div className={toastClass} role="alert" onClick={handleClose}>
      <div className="toast-icon">{icon}</div>
      <div className="toast-content">
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close-btn" onClick={handleClose} aria-label="Cerrar">×</button>
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']).isRequired,
  removeToast: PropTypes.func.isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  duration: PropTypes.number.isRequired,
};

export default Toast;