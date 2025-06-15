import React, { useState } from 'react';
import { getContrastColor } from '../../utils/colorUtils';
import { taskService } from '../../services/taskService';
import { useToast } from '../../contexts/ToastContext';
import { STATUS_ICONS } from '../../utils/imageUtils';
import ItemModal from '../ui/ItemModal';
import './CompendiumTable.css';

const editIcon = STATUS_ICONS.edit;
const deleteIcon = STATUS_ICONS.delete;

const CompendiumTable = ({ data, columns, sortConfig, onSort, elementType, onEdit, onDelete, onRefresh }) => {
  const { showSuccess, showError } = useToast();
  const [localData, setLocalData] = useState(data);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);

  React.useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleCloseModal = () => {
    setShowItemModal(false);
    setSelectedItem(null);
  };

  const handleItemUpdate = (updatedItem) => {
    setLocalData(prevData => 
      prevData.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      )
    );
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleStatusChange = async (task, taskIndex) => {
    const statusCycle = ['pending', 'completed', 'skipped'];
    const currentStatusIndex = statusCycle.indexOf(task.status);
    const nextStatus = statusCycle[(currentStatusIndex + 1) % statusCycle.length];

    try {
      await taskService.updateTaskStatus(task.id, nextStatus);
      
      const statusMessages = {
        'completed': 'Tarea marcada como COMPLETADA',
        'pending': 'Tarea marcada como PENDIENTE', 
        'skipped': 'Tarea SALTADA'
      };
      
      showSuccess(statusMessages[nextStatus] || 'Estado de tarea actualizado');
      

      setLocalData(prevData => 
        prevData.map((item, index) => 
          index === taskIndex ? { ...item, status: nextStatus } : item
        )
      );
      
    } catch (error) {
      console.error('Failed to update task status', error);
      showError('❌ Error al actualizar el estado de la tarea');
    }
  };

  const formatValue = (item, column, itemIndex) => {
    if (column.key === 'actions') {
      const isStoryMode = item.campaign?.is_default;
      return (
        <div className="action-buttons">
          <button 
            className="action-btn edit"
            onClick={() => onEdit && onEdit(item)}
            title="Editar"
          >
            <img src={editIcon} alt="Editar" className="action-icon" />
          </button>
          {!isStoryMode && (
            <button 
              className="action-btn delete"
              onClick={() => onDelete && onDelete(item)}
              title="Eliminar"
            >
              <img src={deleteIcon} alt="Eliminar" className="action-icon" />
            </button>
          )}
        </div>
      );
    }

    const value = getNestedValue(item, column.key);
    
    if (value === null || value === undefined) {
      return '-';
    }
    
    switch (column.key) {
      case 'color':
        return (
          <div className="color-display">
            <div 
              className="color-swatch"
              style={{ backgroundColor: value }}
              title={value}
            ></div>
            <span>{value}</span>
          </div>
        );
      case 'is_default':
      case 'is_active':
        if (column.key === 'is_default' && value) {
          return null;
        }
        return value 
          ? <span className="bool-true">Sí</span> 
          : <span className="bool-false">No</span>;
      case 'energy_value':
        const energyType = item.energy_value > 0 ? 'positive' : item.energy_value < 0 ? 'negative' : 'neutral';
        return (
          <span className={`energy-value ${energyType}`}>
            ⚡ {value}
          </span>
        );
      case 'difficulty':
        return (
          <span className={`difficulty ${value}`}>
            {getDifficultyIcon(value)} {formatDifficulty(value)}
          </span>
        );
      case 'day_of_week':
        return (
          <span className="day-of-week">
            {formatDayOfWeek(value)}
          </span>
        );
      case 'start_time':
      case 'time_of_day':
        return formatTimeOnly(value);
      case 'duration':
        return formatDuration(value);
      case 'status':
        if (['open_quest', 'closed_quest', 'commission', 'rumor'].includes(elementType)) {
          return (
            <button className={`status ${value}`} onClick={() => handleStatusChange(item, itemIndex)}>
             {formatStatus(value)}
            </button>
          );
        }
        return (
          <span className={`status ${value}`}>
            {formatStatus(value)}
          </span>
        );
      case 'created_at':
      case 'updated_at':
      case 'entry_date':
        return formatDate(value);
      case 'due_date_only':
        return formatDateOnly(item.due_date);
      case 'due_datetime':
        return formatDateTime(item.due_date, item.due_time);
      case 'campaign.name':
        return item.campaign?.name || '-';
      case 'name':
      case 'title':
        const displayValue = elementType === 'campaigns' && item.is_default ? `👑 ${value}` : value;
        const truncatedValue = typeof displayValue === 'string' && displayValue.length > 50 
          ? `${displayValue.substring(0, 50)}...` 
          : displayValue;
        
        return (
          <span title={value}>
            {truncatedValue}
          </span>
        );
      case 'description':
        const truncatedDesc = typeof value === 'string' && value.length > 50 
          ? `${value.substring(0, 50)}...` 
          : value;
        
        return (
          <span title={value}>
            {truncatedDesc}
          </span>
        );
      default:
        if (typeof value === 'string' && value.length > 50) {
          return (
            <span title={value}>
              {value.substring(0, 50)}...
            </span>
          );
        }
        return value;
    }
  };

  const getRowStyle = (item) => {
    const campaignColor = item.campaign?.color;
    const energyValue = item.energy_value;
    
    let style = {};
    
    if (campaignColor) {
      style.backgroundColor = campaignColor;
      style.color = getContrastColor(campaignColor);
      
      if (energyValue < 0) {
        style.background = `linear-gradient(rgba(255, 165, 0, 0.3), rgba(255, 165, 0, 0.3)), ${campaignColor}`;
      }
    }
    
    return style;
  };

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    date.setUTCHours(12);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return '-';
    
    let date;
    if (timeString) {
      const combinedDateTime = new Date(`${dateString}T${timeString}`);
      date = new Date(combinedDateTime.valueOf() + combinedDateTime.getTimezoneOffset() * 60000);
    } else {
      date = new Date(dateString);
      date.setUTCHours(12);
    }

    return date.toLocaleDateString('es-ES', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  const formatTimeOnly = (timeString) => {
    if (!timeString) return '-';
    if (timeString.includes('T') || timeString.includes(' ')) {
      const date = new Date(timeString);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
    }
    return timeString;
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return '⬍';
    }
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };
  

  const formatStatus = (status) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      case 'skipped': return 'Saltado';
      default: return status;
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '🗡️';
      case 'normal': return '⚔️';
      case 'hard': return '🔥';
      default: return '⚪';
    }
  };

  const formatDifficulty = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'normal': return 'Normal';
      case 'hard': return 'Difícil';
      default: return difficulty;
    }
  };

  const formatDayOfWeek = (dayNumber) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayNumber] || '-';
  };

  const formatDuration = (duration) => {
    if (!duration) return '-';
    
    if (typeof duration === 'number') {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      
      if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
      return `${minutes}m`;
    }
    
    return duration;
  };

  if (localData.length === 0) {
    return (
      <div className="compendium-table-empty">
        <div className="empty-icon">📭</div>
        <h3>No hay datos disponibles</h3>
        <p>No se encontraron elementos que coincidan con los filtros aplicados.</p>
      </div>
    );
  }

  return (
    <>
      <div className="compendium-table-container">
        <table className="compendium-table">
          <thead>
            <tr>
              {columns.map(column => (
                <th 
                  key={column.key}
                  data-column={column.key}
                  className={`${column.sortable ? 'sortable' : ''} ${sortConfig.key === column.key ? 'sorted' : ''}`}
                  onClick={() => column.sortable && onSort(column.key)}
                >
                  <div className="header-content">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <span className="sort-icon">
                        {getSortIcon(column.key)}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {localData.map((item, index) => (
              <tr 
                key={item.id || index} 
                className="table-row"
                style={getRowStyle(item)}
              >
                {columns.map(column => (
                <td 
                  key={column.key} 
                  data-column={column.key}
                  className={['name', 'title', 'description'].includes(column.key) ? 'clickable-cell' : ''}
                  onClick={['name', 'title', 'description'].includes(column.key) ? () => handleItemClick(item) : undefined}
                  style={['name', 'title', 'description'].includes(column.key) ? { cursor: 'pointer' } : {}}
                >
                  {formatValue(item, column, index)}
                </td>
              ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showItemModal && selectedItem && (
        <ItemModal
          item={selectedItem}
          onClose={handleCloseModal}
          onItemUpdate={handleItemUpdate}
        />
      )}
    </>
  );
};

export default CompendiumTable;