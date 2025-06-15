import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { campaignService } from '../../services/campaignService';
import { getContrastColor } from '../../utils/colorUtils';
import EnergySlider from './formElements/EnergySlider';
import TimeSlider from './formElements/TimeSlider';
import ColorPicker from './formElements/ColorPicker';
import DurationSelector from './formElements/DurationSelector';
// Importar iconos PNG
import campaignsIcon from '../../assets/images/types/campaigns.png';
import openQuestIcon from '../../assets/images/types/openquest.png';
import closedQuestIcon from '../../assets/images/types/closedquest.png';
import commissionIcon from '../../assets/images/types/commission.png';
import dailiesIcon from '../../assets/images/types/dailies.png';
import raidsIcon from '../../assets/images/types/raid.png';
import rumorIcon from '../../assets/images/types/rumor.png';

import './Modal.css';

const TIMEZONE_OFFSET_HOURS = 2; // CEST es UTC+2
const DEFAULT_TIME = '12:00';

const ELEMENT_TYPES = {
  CAMPAIGNS: 'campaigns',
  OPEN_QUEST: 'open_quest',
  CLOSED_QUEST: 'closed_quest',
  DAILIES: 'dailies',
  RAIDS: 'raids',
  COMMISSION: 'commission',
  RUMOR: 'rumor'
};

const ELEMENT_TYPE_LABELS = {
  [ELEMENT_TYPES.CAMPAIGNS]: 'Campaña',
  [ELEMENT_TYPES.OPEN_QUEST]: 'Misión Abierta',
  [ELEMENT_TYPES.CLOSED_QUEST]: 'Misión Cerrada',
  [ELEMENT_TYPES.DAILIES]: 'Diaria',
  [ELEMENT_TYPES.RAIDS]: 'Raid',
  [ELEMENT_TYPES.COMMISSION]: 'Encargo',
  [ELEMENT_TYPES.RUMOR]: 'Rumor'
};

const STORAGE_KEY = 'unifiedElementModal_formData';

const UnifiedElementModal = ({ 
  elementType, 
  onSubmit, 
  onClose, 
  isVisible = true, 
  editItem = null,
  mode = 'create'
}) => {
  const [formData, setFormData] = useState(() => {
    if (mode === 'edit' && editItem) {
      const processedItem = { ...editItem };
      // Convertir start_time de formato ISO (HH:MM:SS) a formato HH:MM para TimeSlider
      if (processedItem.start_time && processedItem.start_time.includes(':')) {
        const timeParts = processedItem.start_time.split(':');
        processedItem.start_time = `${timeParts[0]}:${timeParts[1]}`;
      }
      return processedItem;
    }
    if (mode === 'create' && editItem) {
      // Para modo create con datos pre-llenados (como fecha/hora desde time slot)
      const initialData = getInitialFormData(elementType);
      return { ...initialData, ...editItem };
    }
    const savedData = getSavedFormData(elementType);
    return savedData || getInitialFormData(elementType);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [campaigns, setCampaigns] = useState([]);
  const [defaultCampaign, setDefaultCampaign] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (elementType) {
      if (mode === 'edit' && editItem) {
        const processedItem = { ...editItem };
        // Convertir start_time de formato ISO (HH:MM:SS) a formato HH:MM para TimeSlider
        if (processedItem.start_time && processedItem.start_time.includes(':')) {
          const timeParts = processedItem.start_time.split(':');
          processedItem.start_time = `${timeParts[0]}:${timeParts[1]}`;
        }
        setFormData(processedItem);
      } else if (mode === 'create' && editItem) {
        // Para modo create con datos pre-llenados (como fecha/hora desde time slot)
        const initialData = getInitialFormData(elementType);
        setFormData({ ...initialData, ...editItem });
      } else {
        const savedData = getSavedFormData(elementType);
        if (savedData) {
          setFormData(savedData);
        } else {
          setFormData(getInitialFormData(elementType));
        }
      }
    }
  }, [elementType, editItem, mode]);

  useEffect(() => {
    if (elementType && formData && mode === 'create') {
      saveFormData(elementType, formData);
    }
  }, [formData, elementType, mode]);

  const loadCampaigns = async () => {
    try {
      const campaignList = await campaignService.getCampaigns();
      setCampaigns(campaignList);
      
      const storyMode = campaignList.find(campaign => campaign.is_default);
      if (storyMode) {
        setDefaultCampaign(storyMode);
        if (!formData.campaign_id && mode === 'create' && elementType !== ELEMENT_TYPES.CAMPAIGNS) {
          handleInputChange('campaign_id', storyMode.id);
        }
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  // Actualizar campaña seleccionada cuando cambie campaign_id
  useEffect(() => {
    if (formData.campaign_id && campaigns.length > 0) {
      const campaign = campaigns.find(c => c.id === parseInt(formData.campaign_id));
      setSelectedCampaign(campaign);
    } else {
      setSelectedCampaign(null);
    }
  }, [formData.campaign_id, campaigns]);

  const handleEditSubmit = async (formData) => {
    try {
      let updatedItem;
      
      switch (selectedType) {
        case ELEMENT_TYPES.CAMPAIGNS:
          updatedItem = await campaignService.updateCampaign(selectedItem.id, formData);
          break;
        case ELEMENT_TYPES.OPEN_QUEST:
        case ELEMENT_TYPES.CLOSED_QUEST:
        case ELEMENT_TYPES.COMMISSION:
        case ELEMENT_TYPES.RUMOR:
          const taskData = {
            ...formData,
            task_type: selectedType === ELEMENT_TYPES.OPEN_QUEST ? 'open_quest' : 
                      selectedType === ELEMENT_TYPES.CLOSED_QUEST ? 'closed_quest' :
                      selectedType === ELEMENT_TYPES.COMMISSION ? 'commission' : 'rumor'
          };
          updatedItem = await taskService.updateTask(selectedItem.id, taskData);
          break;
        case ELEMENT_TYPES.DAILIES:
          updatedItem = await taskService.updateDaily(selectedItem.id, formData);
          break;
        case ELEMENT_TYPES.RAIDS:
          updatedItem = await taskService.updateRaid(selectedItem.id, formData);
          break;
        default:
          throw new Error('Tipo de elemento no soportado');
      }
      
      setData(prev => prev.map(item => 
        item.id === selectedItem.id ? updatedItem : item
      ));
      
      setShowEditModal(false);
      setSelectedItem(null);
      showSuccess(`${ELEMENT_TYPE_LABELS[selectedType]} actualizado exitosamente`);
    } catch (error) {
      console.error('Error updating item:', error);
      showError('Error al actualizar el elemento');
    }
  };

  function getInitialFormData(type) {
    const baseData = {
      title: '',
      description: ''
    };

    switch (type) {
      case ELEMENT_TYPES.CAMPAIGNS:
        return {
          name: '',
          description: '',
          color: '#d4af37'
        };
      case ELEMENT_TYPES.OPEN_QUEST:
      case ELEMENT_TYPES.CLOSED_QUEST:
      case ELEMENT_TYPES.COMMISSION:
      case ELEMENT_TYPES.RUMOR:
        return {
          ...baseData,
          task_type: type === ELEMENT_TYPES.OPEN_QUEST ? 'open_quest' : 
                    type === ELEMENT_TYPES.CLOSED_QUEST ? 'closed_quest' :
                    type === ELEMENT_TYPES.COMMISSION ? 'commission' : 'rumor',
          energy_value: 1,
          campaign_id: null,
          due_date: type === ELEMENT_TYPES.OPEN_QUEST || type === ELEMENT_TYPES.CLOSED_QUEST ? '' : null,
          due_time: type === ELEMENT_TYPES.CLOSED_QUEST ? '12:00' : null,
          estimated_duration: type === ELEMENT_TYPES.CLOSED_QUEST ? 60 : null
        };
      case ELEMENT_TYPES.DAILIES:
        return {
          ...baseData,
          energy_value: 1,
          campaign_id: null,
          is_active: true
        };
      case ELEMENT_TYPES.RAIDS:
        return {
          ...baseData,
          energy_value: 1,
          campaign_id: null,
          difficulty: 'normal',
          day_of_week: 1,
          start_time: '12:00',
          duration: 60,
          is_active: true
        };
      default:
        return baseData;
    }
  }

  function getSavedFormData(type) {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${type}`);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading saved form data:', error);
      return null;
    }
  }

  function saveFormData(type, data) {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${type}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  }

  function clearSavedFormData(type) {
    try {
      localStorage.removeItem(`${STORAGE_KEY}_${type}`);
    } catch (error) {
      console.error('Error clearing saved form data:', error);
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const getElementIcon = (type) => {
    const iconMap = {
      [ELEMENT_TYPES.CAMPAIGNS]: campaignsIcon,
      [ELEMENT_TYPES.OPEN_QUEST]: openQuestIcon,
      [ELEMENT_TYPES.CLOSED_QUEST]: closedQuestIcon,
      [ELEMENT_TYPES.COMMISSION]: commissionIcon,
      [ELEMENT_TYPES.DAILIES]: dailiesIcon,
      [ELEMENT_TYPES.RAIDS]: raidsIcon,
      [ELEMENT_TYPES.RUMOR]: rumorIcon
    };
    return iconMap[type] || openQuestIcon;
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    switch (elementType) {
      case ELEMENT_TYPES.CAMPAIGNS:
        if (!formData.name?.trim()) {
          newErrors.name = 'El nombre es requerido';
        }
        break;
      case ELEMENT_TYPES.OPEN_QUEST:
        if (!formData.title?.trim()) {
          newErrors.title = 'El título es requerido';
        }
        if (!formData.campaign_id) {
          newErrors.campaign_id = 'La campaña es requerida';
        }
        if (!formData.due_date?.trim()) {
          newErrors.due_date = 'La fecha límite es requerida para misiones abiertas';
        }
        break;
      case ELEMENT_TYPES.CLOSED_QUEST:
        if (!formData.title?.trim()) {
          newErrors.title = 'El título es requerido';
        }
        if (!formData.campaign_id) {
          newErrors.campaign_id = 'La campaña es requerida';
        }
        if (!formData.due_date?.trim()) {
          newErrors.due_date = 'La fecha límite es requerida para misiones cerradas';
        }
        if (!formData.due_time?.trim()) {
          newErrors.due_time = 'La hora límite es requerida para misiones cerradas';
        }
        break;
      case ELEMENT_TYPES.DAILIES:
      case ELEMENT_TYPES.COMMISSION:
      case ELEMENT_TYPES.RUMOR:
        if (!formData.title?.trim()) {
          newErrors.title = 'El título es requerido';
        }
        if (!formData.campaign_id) {
          newErrors.campaign_id = 'La campaña es requerida';
        }
        break;
      case ELEMENT_TYPES.RAIDS:
        if (!formData.title?.trim()) {
          newErrors.title = 'El título es requerido';
        }
        if (!formData.campaign_id) {
          newErrors.campaign_id = 'La campaña es requerida';
        }
        if (!formData.start_time?.trim()) {
          newErrors.start_time = 'La hora de inicio es requerida';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = { ...formData };
      
      // Ajustar zona horaria para campos de tiempo
      if (submitData.due_time && submitData.due_date) {
        // Para closed quests: combinar fecha y hora y ajustar para CEST
        const combinedDateTime = new Date(`${submitData.due_date}T${submitData.due_time}`);
        // Ajustar 2 horas para compensar la conversión CEST -> UTC
        combinedDateTime.setHours(combinedDateTime.getHours() + TIMEZONE_OFFSET_HOURS);
        submitData.due_time = combinedDateTime.toTimeString().slice(0, 5); // HH:MM format
      }
      
      // Para raids: NO ajustar la hora ya que solo se maneja hora sin fecha
      // El ajuste de zona horaria solo es necesario cuando se combina fecha + hora
      
      if ([ELEMENT_TYPES.OPEN_QUEST, ELEMENT_TYPES.CLOSED_QUEST, ELEMENT_TYPES.COMMISSION, ELEMENT_TYPES.RUMOR].includes(elementType)) {
        submitData.task_type = elementType === ELEMENT_TYPES.OPEN_QUEST ? 'open_quest' : 
                              elementType === ELEMENT_TYPES.CLOSED_QUEST ? 'closed_quest' :
                              elementType === ELEMENT_TYPES.COMMISSION ? 'commission' : 'rumor';
      }
      
      await onSubmit(submitData);
      
      if (mode === 'create') {
        clearSavedFormData(elementType);
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormFields = () => {
    switch (elementType) {
      case ELEMENT_TYPES.CAMPAIGNS:
        return (
          <>
            <div className="form-group">
              <label htmlFor="name">Nombre *</label>
              <input
                type="text"
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'error' : ''}
                placeholder="Nombre de la campaña"
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Descripción</label>
              <textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descripción de la campaña"
                rows={3}
              />
            </div>

            <div className="form-group">
              <ColorPicker
                value={formData.color || '#FFD700'}
                onChange={(color) => handleInputChange('color', color)}
              />
            </div>
          </>
        );

      case ELEMENT_TYPES.OPEN_QUEST:
      case ELEMENT_TYPES.CLOSED_QUEST:
        return (
          <>
            <div className="form-group">
              <label htmlFor="title">Título *</label>
              <input
                type="text"
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? 'error' : ''}
                placeholder="Título de la misión"
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Descripción</label>
              <textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descripción de la misión"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="campaign_id">Campaña *</label>
              <select
                id="campaign_id"
                value={formData.campaign_id || ''}
                onChange={(e) => {
                  const campaignId = e.target.value || null;
                  handleInputChange('campaign_id', campaignId);
                  if (campaignId && !formData.quest_type) {
                    handleInputChange('quest_type', 'story_mode');
                  }
                }}
                className={errors.campaign_id ? 'error' : ''}
              >
                <option value="">Seleccionar campaña...</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              {errors.campaign_id && <span className="error-message">{errors.campaign_id}</span>}
            </div>
            
            <div className="form-group">
              <EnergySlider
                value={formData.energy_value || 0}
                onChange={(value) => handleInputChange('energy_value', value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="due_date">Fecha límite *</label>
                <input
                  type="date"
                  id="due_date"
                  value={formData.due_date || ''}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  className={errors.due_date ? 'error' : ''}
                />
                {errors.due_date && <span className="error-message">{errors.due_date}</span>}
              </div>
              {elementType === ELEMENT_TYPES.CLOSED_QUEST && (
                <>
                  <div className="form-group">                    
                    <TimeSlider
                      value={formData.due_time || DEFAULT_TIME}
                      onChange={(value) => handleInputChange('due_time', value)}
                    />
                    {errors.due_time && <span className="error-message">{errors.due_time}</span>}
                  </div>
                  <div className="form-group">
                    <DurationSelector
                      value={formData.estimated_duration || 60}
                      onChange={(value) => handleInputChange('estimated_duration', value)}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        );

      case ELEMENT_TYPES.DAILIES:
        return (
          <>
            <div className="form-group">
              <label htmlFor="title">Título *</label>
              <input
                type="text"
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? 'error' : ''}
                placeholder="Título de la diaria"
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Descripción</label>
              <textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descripción de la diaria"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="campaign_id">Campaña *</label>
              <select
                id="campaign_id"
                value={formData.campaign_id || ''}
                onChange={(e) => handleInputChange('campaign_id', e.target.value)}
                className={errors.campaign_id ? 'error' : ''}
              >
                <option value="">Seleccionar campaña</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              {errors.campaign_id && <span className="error-message">{errors.campaign_id}</span>}
            </div>

            <div className="form-group">
              <EnergySlider
                value={formData.energy_value || 0}
                onChange={(value) => handleInputChange('energy_value', value)}
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.is_active || false}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="form-checkbox"
                />
                <span>Activa</span>
              </label>
            </div>
          </>
        );

      case ELEMENT_TYPES.RAIDS:
        return (
          <>
            <div className="form-group">
              <label htmlFor="title">Título *</label>
              <input
                type="text"
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? 'error' : ''}
                placeholder="Título del raid"
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Descripción</label>
              <textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descripción del raid"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="campaign_id">Campaña *</label>
              <select
                id="campaign_id"
                value={formData.campaign_id || ''}
                onChange={(e) => handleInputChange('campaign_id', e.target.value)}
                className={errors.campaign_id ? 'error' : ''}
              >
                <option value="">Seleccionar campaña</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              {errors.campaign_id && <span className="error-message">{errors.campaign_id}</span>}
            </div>

            <div className="form-group">
              <EnergySlider
                value={formData.energy_value || 0}
                onChange={(value) => handleInputChange('energy_value', value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="difficulty">Dificultad</label>
              <select
                id="difficulty"
                value={formData.difficulty || 'normal'}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
              >
                <option value="easy">Fácil</option>
                <option value="normal">Normal</option>
                <option value="hard">Difícil</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="day_of_week">Día de la semana</label>
                <select
                  id="day_of_week"
                  value={formData.day_of_week || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('day_of_week', value === '' ? null : parseInt(value));
                  }}
                >
                  <option value="">Seleccionar día</option>
                  <option value="1">Lunes</option>
                  <option value="2">Martes</option>
                  <option value="3">Miércoles</option>
                  <option value="4">Jueves</option>
                  <option value="5">Viernes</option>
                  <option value="6">Sábado</option>
                  <option value="0">Domingo</option>
                </select>
              </div>
              <div className="form-group">                
                <TimeSlider
                  value={formData.start_time || DEFAULT_TIME}
                  onChange={(value) => handleInputChange('start_time', value)}
                />
                {errors.start_time && <span className="error-message">{errors.start_time}</span>}
              </div>
              <div className="form-group">
                <DurationSelector
                  value={formData.duration || 60}
                  onChange={(value) => handleInputChange('duration', value)}
                />
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.is_active || false}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="form-checkbox"
                />
                <span>Activo</span>
              </label>
            </div>
          </>
        );

      case ELEMENT_TYPES.COMMISSION:
      case ELEMENT_TYPES.RUMOR:
        return (
          <>
            <div className="form-group">
              <label htmlFor="title">Título *</label>
              <input
                type="text"
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={errors.title ? 'error' : ''}
                placeholder={`Título ${elementType === ELEMENT_TYPES.COMMISSION ? 'de la encargo' : 'del rumor'}`}
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Descripción</label>
              <textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={`Descripción ${elementType === ELEMENT_TYPES.COMMISSION ? 'de la encargo' : 'del rumor'}`}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="campaign_id">Campaña *</label>
              <select
                id="campaign_id"
                value={formData.campaign_id || ''}
                onChange={(e) => handleInputChange('campaign_id', e.target.value)}
                className={errors.campaign_id ? 'error' : ''}
              >
                <option value="">Seleccionar campaña</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              {errors.campaign_id && <span className="error-message">{errors.campaign_id}</span>}
            </div>

            <div className="form-group">
              <EnergySlider
                value={formData.energy_value || 0}
                onChange={(value) => handleInputChange('energy_value', value)}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="form-modal">
        <div className="modal-header">
          <div className="modal-title-section">
            <img src={getElementIcon(elementType)} alt={ELEMENT_TYPE_LABELS[elementType]} className="modal-icon" />
            <div>
              <h2 className="modal-title">
                {mode === 'edit' ? 'Editar' : 'Crear'} {ELEMENT_TYPE_LABELS[elementType] || 'Elemento'}
              </h2>
              <div className="modal-subtitle">
                <span className="modal-type">{ELEMENT_TYPE_LABELS[elementType] || 'Elemento'}</span>
                {/* Mostrar campaña seleccionada con badge */}
                {selectedCampaign && elementType !== ELEMENT_TYPES.CAMPAIGNS && (
                  <span 
                    className="modal-campaign-badge"
                    style={{
                      backgroundColor: selectedCampaign.color,
                      color: getContrastColor(selectedCampaign.color)
                    }}
                  >
                    {selectedCampaign.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          {renderFormFields()}
          
          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="modal-btn cancel"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="modal-btn submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : (mode === 'edit' ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnifiedElementModal;

  // Función auxiliar para ajustar zona horaria
  const adjustTimeForTimezone = (timeString, offsetHours = TIMEZONE_OFFSET_HOURS) => {
    if (!timeString) return timeString;
    
    const timeDate = new Date(`2000-01-01T${timeString}`);
    timeDate.setHours(timeDate.getHours() + offsetHours);
    return timeDate.toTimeString().slice(0, 5); // HH:MM format
  };