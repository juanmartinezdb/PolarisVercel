import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Shield } from 'lucide-react';
import { getImagePath } from '../../utils/imageUtils';
import './AvatarDropdown.css';

const DROPDOWN_MENU_ITEMS = [
  { id: 'profile', label: 'Ver Perfil', icon: User },
  { id: 'settings', label: 'Configuración', icon: Settings },
  { id: 'privacy', label: 'Privacidad', icon: Shield },
  { id: 'logout', label: 'Cerrar Sesión', icon: LogOut, variant: 'danger' }
];

const AvatarDropdown = ({ onProfileClick, onSettingsClick }) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuItemClick = (itemId) => {
    setIsDropdownOpen(false);
    
    switch (itemId) {
      case 'profile':
        onProfileClick?.();
        break;
      case 'settings':
        onSettingsClick?.();
        break;
      case 'privacy': //implementar al final como una pagina con lo tipico d contacto y cosas asi
        break;
      case 'logout':
        logout();
        break;
      default:
        break;
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="avatar-dropdown" ref={dropdownRef}>
      <button 
        className="avatar-button" 
        onClick={toggleDropdown}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <div className="avatar">
          {user?.avatar_url ? (
            <img src={getImagePath(user.avatar_url)} alt={user.username} />
          ) : (
            <div className="avatar-placeholder">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </button>

      {isDropdownOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <div className="user-info">
              <span className="username">{user?.username}</span>
              <span className="level">Nivel {user?.level}</span>
            </div>
          </div>
          
          <div className="dropdown-divider" />
          
          <div className="dropdown-items">
            {DROPDOWN_MENU_ITEMS.map(({ id, label, icon: Icon, variant }) => (
              <button
                key={id}
                className={`dropdown-item ${variant || ''}`}
                onClick={() => handleMenuItemClick(id)}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarDropdown;