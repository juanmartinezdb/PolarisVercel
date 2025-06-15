import React, { useEffect, useRef } from 'react';
import './ContextMenu.css';

const ContextMenu = ({ position, options, onAction, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleAction = (action) => {
    onAction(action);
    onClose();
  };

  return (
    <div 
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 1000
      }}
    >
      <ul className="context-menu-list">
        {options.map((option, index) => (
          <li 
            key={index}
            className="context-menu-item"
            onClick={() => handleAction(option.action)}
          >
            {option.icon && <span className="menu-icon">{option.icon}</span>}
            <span className="menu-text">{option.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;