import React, { useRef, useEffect } from 'react';
import './ContextMenu.css';

const TaskContextMenu = ({ 
  position, 
  task, 
  taskType, 
  onAction, 
  onClose 
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleAction = (action) => {
    onAction(action);
    onClose();
  };

  const getMenuOptions = () => {
    const options = [];
    
    if (task.status === 'pending') {
      options.push(
        {
          action: 'complete',
          label: 'Completar',
          icon: '✅'
        },
        {
          action: 'skip',
          label: 'Saltar',
          icon: '⏭️'
        }
      );
    } else if (task.status === 'completed') {
      options.push(
        {
          action: 'skip',
          label: 'Marcar como Saltada',
          icon: '⏭️'
        },
        {
          action: 'restore',
          label: 'Restaurar a Pendiente',
          icon: '🔄'
        }
      );
    } else if (task.status === 'skipped') {
      options.push(
        {
          action: 'restore',
          label: 'Restaurar a Pendiente',
          icon: '🔄'
        }
      );
    }

    // Separador si hay opciones de estado
    if (options.length > 0) {
      options.push({ separator: true });
    }

    // Opciones comunes para todas las tareas
    options.push(
      {
        action: 'view',
        label: 'Ver Detalles',
        icon: '👁️'
      },
      {
        action: 'edit',
        label: 'Editar',
        icon: '✏️'
      },
      {
        action: 'delete',
        label: 'Eliminar',
        icon: '🗑️'
      }
    );

    return options;
  };

  const menuOptions = getMenuOptions();

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
        {menuOptions.map((option, index) => {
          if (option.separator) {
            return (
              <li key={index} className="context-menu-separator">
                <hr />
              </li>
            );
          }
          
          return (
            <li 
              key={index}
              className="context-menu-item"
              onClick={() => handleAction(option.action)}
            >
              {option.icon && <span className="menu-icon">{option.icon}</span>}
              <span className="menu-text">{option.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default TaskContextMenu;