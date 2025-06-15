import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Calendar, Clock, Zap, Users, CheckCircle, XCircle, SkipForward, Play, Pause } from 'lucide-react';
import { campaignService } from '../../services/campaignService';
import { taskService } from '../../services/taskService';
import { getContrastColor } from '../../utils/colorUtils';
import { useToast } from '../../contexts/ToastContext';
import campaignsIcon from '../../assets/images/types/campaigns.png';
import openQuestIcon from '../../assets/images/types/openquest.png';
import closedQuestIcon from '../../assets/images/types/closedquest.png';
import commissionIcon from '../../assets/images/types/commission.png';
import dailiesIcon from '../../assets/images/types/dailies.png';
import raidsIcon from '../../assets/images/types/raid.png';
import rumorIcon from '../../assets/images/types/rumor.png';
import './ItemModal.css';

const ItemModal = ({ item, onClose, onItemUpdate }) => {
  const [campaign, setCampaign] = useState(null);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { showSuccess, showError } = useToast();

  if (!item) return null;

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!item.campaign_id) return;
      
      try {
        setCampaignsLoading(true);
        const campaigns = await campaignService.getCampaigns();
        const itemCampaign = campaigns.find(c => c.id === item.campaign_id);
        setCampaign(itemCampaign);
      } catch (error) {
        console.error('Error fetching campaign:', error);
      } finally {
        setCampaignsLoading(false);
      }
    };

    fetchCampaign();
  }, [item.campaign_id]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      const updatedItem = await taskService.updateTaskStatus(item.id, newStatus);
      showSuccess(`Estado cambiado a ${getStatusLabel(newStatus)}`);
      if (onItemUpdate) {
        onItemUpdate(updatedItem);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      showError('Error al cambiar el estado de la tarea');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      setUpdating(true);
      const newActiveState = !item.is_active;
      let updatedItem;
      
      if (item.type === 'dailies') {
        updatedItem = await taskService.updateDaily(item.id, { is_active: newActiveState });
      } else if (item.type === 'raids') {
        updatedItem = await taskService.updateRaid(item.id, { is_active: newActiveState });
      }
      
      showSuccess(`${item.type === 'dailies' ? 'Diaria' : 'Raid'} ${newActiveState ? 'activada' : 'desactivada'}`);
      if (onItemUpdate) {
        onItemUpdate(updatedItem);
      }
    } catch (error) {
      console.error('Error toggling active state:', error);
      showError('Error al cambiar el estado activo');
    } finally {
      setUpdating(false);
    }
  };

  const getAvailableActions = () => {
    const actions = [];
    
    if (['open_quest', 'closed_quest', 'rumor', 'commission'].includes(item.type)) {
      if (item.status === 'pending') {
        actions.push(
          { 
            label: 'Completar', 
            icon: CheckCircle, 
            action: () => handleStatusChange('completed'),
            className: 'action-complete'
          },
          { 
            label: 'Saltar', 
            icon: SkipForward, 
            action: () => handleStatusChange('skipped'),
            className: 'action-skip'
          }
        );
      } else if (item.status === 'completed') {
        actions.push(
          { 
            label: 'Ya Completada', 
            icon: CheckCircle, 
            action: null,
            className: 'action-disabled',
            disabled: true
          }
        );
      } else if (item.status === 'skipped') {
        actions.push(
          { 
            label: 'Completar', 
            icon: CheckCircle, 
            action: () => handleStatusChange('completed'),
            className: 'action-complete'
          },
          { 
            label: 'Marcar Pendiente', 
            icon: Clock, 
            action: () => handleStatusChange('pending'),
            className: 'action-pending'
          }
        );
      }
    }
    
    if (['dailies', 'raids'].includes(item.type)) {
      actions.push({
        label: item.is_active ? 'Desactivar' : 'Activar',
        icon: item.is_active ? Pause : Play,
        action: handleToggleActive,
        className: item.is_active ? 'action-deactivate' : 'action-activate'
      });
    }
    
    return actions;
  };

  const getItemIcon = (type) => {
    const iconMap = {
      campaign: campaignsIcon,
      campaigns: campaignsIcon,
      open_quest: openQuestIcon,
      closed_quest: closedQuestIcon,
      commission: commissionIcon,
      daily: dailiesIcon,
      dailies: dailiesIcon,
      raid: raidsIcon,
      raids: raidsIcon,
      rumor: rumorIcon
    };
    return iconMap[type] || openQuestIcon;
  };

  const getItemTypeLabel = (type) => {
    const typeLabels = {
      campaigns: 'Campaña',
      open_quest: 'Misión Abierta',
      closed_quest: 'Misión Cerrada',
      commission: 'Encargo',
      dailies: 'Diaria',
      raids: 'Raid',
      rumor: 'Rumor'
    };
    return typeLabels[type] || type;
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'in_progress': return 'En Progreso';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelado';
      case 'skipped': return 'Saltado';
      default: return status;
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'normal': return 'Normal';
      case 'hard': return 'Difícil';
      default: return difficulty;
    }
  };

  const getDayOfWeekLabel = (dayNumber) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayNumber] || '-';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    
    let date;
    if (timeString.includes('T') || timeString.includes(' ')) {
      date = new Date(timeString);
    } else {
      const today = new Date();
      const [hours, minutes] = timeString.split(':');
      date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
    }
    
    date.setHours(date.getHours() - 2);
    
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  const availableActions = getAvailableActions();

  const modalContent = (
    <div className="search-modal-overlay" onClick={handleOverlayClick}>
      <div className="search-modal">
        <div className="search-modal-header">
          <div className="modal-title-section">
            <img src={getItemIcon(item.type)} alt={getItemTypeLabel(item.type)} className="modal-icon" />
            <div>
              <h2 className="modal-title">{item.title || item.name}</h2>
              <div className="modal-subtitle">
                <span className="modal-type">{getItemTypeLabel(item.type)}</span>
                {campaign && (
                  <span 
                    className="modal-campaign-badge"
                    style={{
                      backgroundColor: campaign.color,
                      color: getContrastColor(campaign.color),
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      marginLeft: '8px'
                    }}
                  >
                    {campaign.name}
                  </span>
                )}
                {campaignsLoading && (
                  <span className="modal-campaign-loading">Cargando campaña...</span>
                )}
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="search-modal-content">
          {availableActions.length > 0 && (
            <div className="modal-section actions-section">
              <div className="modal-actions">
                {availableActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <button
                      key={index}
                      className={`modal-action-btn ${action.className} ${action.disabled ? 'disabled' : ''}`}
                      onClick={action.action}
                      disabled={action.disabled || updating}
                    >
                      <IconComponent size={16} />
                      <span>{updating ? 'Actualizando...' : action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {campaign && (
            <div className="modal-section campaign-section">
              <div 
                className="campaign-info-card"
                style={{
                  backgroundColor: `${campaign.color}15`,
                  border: `2px solid ${campaign.color}`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px'
                }}
              >
                <div className="campaign-header">
                  <img src={campaignsIcon} alt="Campaña" className="campaign-icon" />
                  <div>
                    <h4 
                      className="campaign-name"
                      style={{ color: campaign.color, margin: '0 0 4px 0' }}
                    >
                      {campaign.name}
                    </h4>
                    {campaign.description && (
                      <p className="campaign-description" style={{ margin: 0, fontSize: '0.875rem', opacity: 0.8 }}>
                        {campaign.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {item.description && (
            <div className="modal-section">
              <h3>Descripción</h3>
              <p className="description-text">{item.description}</p>
            </div>
          )}

          <div className="modal-details-grid">
            {item.energy_value && (
              <div className="detail-item">
                <Zap className="detail-icon" size={16} />
                <span className="detail-label">Energía:</span>
                <span className="detail-value">{item.energy_value}</span>
              </div>
            )}

            {item.status && (
              <div className="detail-item">
                <div className={`status-indicator ${item.status}`}></div>
                <span className="detail-label">Estado:</span>
                <span className="detail-value">{getStatusLabel(item.status)}</span>
              </div>
            )}

            {item.due_date && (
              <div className="detail-item">
                <Calendar className="detail-icon" size={16} />
                <span className="detail-label">Fecha:</span>
                <span className="detail-value">{formatDate(item.due_date)}</span>
              </div>
            )}

            {item.due_time && (
              <div className="detail-item">
                <Clock className="detail-icon" size={16} />
                <span className="detail-label">Hora:</span>
                <span className="detail-value">{formatTime(item.due_time)}</span>
              </div>
            )}

            {item.difficulty && (
              <div className="detail-item">
                <span className="detail-label">Dificultad:</span>
                <span className={`detail-value difficulty-${item.difficulty}`}>
                  {getDifficultyLabel(item.difficulty)}
                </span>
              </div>
            )}

            {item.day_of_week !== undefined && (
              <div className="detail-item">
                <span className="detail-label">Día de la semana:</span>
                <span className="detail-value">{getDayOfWeekLabel(item.day_of_week)}</span>
              </div>
            )}

            {item.start_time && (
              <div className="detail-item">
                <Clock className="detail-icon" size={16} />
                <span className="detail-label">Hora de inicio:</span>
                <span className="detail-value">{formatTime(item.start_time)}</span>
              </div>
            )}

            {item.duration && (
              <div className="detail-item">
                <span className="detail-label">Duración:</span>
                <span className="detail-value">{item.duration} minutos</span>
              </div>
            )}

            {item.color && (
              <div className="detail-item">
                <div 
                  className="color-indicator" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="detail-label">Color:</span>
                <span className="detail-value">{item.color}</span>
              </div>
            )}

            {item.is_default !== undefined && (
              <div className="detail-item">
                <span className="detail-label">Campaña por defecto:</span>
                <span className="detail-value">{item.is_default ? 'Sí' : 'No'}</span>
              </div>
            )}

            {item.is_active !== undefined && (
              <div className="detail-item">
                <span className="detail-label">Activo:</span>
                <span className="detail-value">{item.is_active ? 'Sí' : 'No'}</span>
              </div>
            )}
          </div>

          <div className="modal-timestamps">
            {item.created_at && (
              <div className="timestamp-item">
                <span className="timestamp-label">Creado:</span>
                <span className="timestamp-value">{formatDate(item.created_at)}</span>
              </div>
            )}
            {item.updated_at && (
              <div className="timestamp-item">
                <span className="timestamp-label">Actualizado:</span>
                <span className="timestamp-value">{formatDate(item.updated_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ItemModal;