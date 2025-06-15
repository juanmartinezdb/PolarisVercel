import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { 
  X, 
  Calendar, 
  BookOpen, 
  Save,
  Clock
} from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import './UserSettings.css';

const UserSettings = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    calendar: {
      dayStartHour: 6,
      statusesPending: true,
      statusesCompleted: true,
      statusesSkipped: false,
      raidsAccordionOpen: true,
      dailiesAccordionOpen: true
    },
    compendium: {
      statusesPending: true,
      statusesCompleted: true,
      statusesSkipped: false,
      onlyActiveRaidsAndDailies: true
    }
  });

  useEffect(() => {
    if (isOpen) {
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({
            calendar: {
              dayStartHour: parsed.calendar?.dayStartHour || 6,
              statusesPending: parsed.calendar?.statusesPending !== undefined ? parsed.calendar.statusesPending : true,
              statusesCompleted: parsed.calendar?.statusesCompleted !== undefined ? parsed.calendar.statusesCompleted : true,
              statusesSkipped: parsed.calendar?.statusesSkipped !== undefined ? parsed.calendar.statusesSkipped : false,
              raidsAccordionOpen: parsed.calendar?.raidsAccordionOpen !== undefined ? parsed.calendar.raidsAccordionOpen : true,
              dailiesAccordionOpen: parsed.calendar?.dailiesAccordionOpen !== undefined ? parsed.calendar.dailiesAccordionOpen : true
            },
            compendium: {
              statusesPending: parsed.compendium?.statusesPending !== undefined ? parsed.compendium.statusesPending : true,
              statusesCompleted: parsed.compendium?.statusesCompleted !== undefined ? parsed.compendium.statusesCompleted : true,
              statusesSkipped: parsed.compendium?.statusesSkipped !== undefined ? parsed.compendium.statusesSkipped : false,
              onlyActiveRaidsAndDailies: parsed.compendium?.onlyActiveRaidsAndDailies !== undefined ? parsed.compendium.onlyActiveRaidsAndDailies : true
            }
          });
        } catch (error) {
          console.error('Error parsing saved settings:', error);
        }
      }
    }
  }, [isOpen]);

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleSaveSettings = () => {
    setIsLoading(true)
    try {
      localStorage.setItem('userSettings', JSON.stringify(settings))
      
      window.dispatchEvent(new CustomEvent('userSettingsChanged', {
        detail: settings
      }))
      
      showToast('Configuración guardada correctamente', 'success')
      onClose()
    } catch (error) {
      showToast('Error al guardar la configuración', 'error')
    } finally {
      setIsLoading(false)
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-user-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2>Configuración</h2>
          <button className="settings-close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="settings-modal-content">
          <div className="settings-form-section">
            <h3>
              <Calendar size={18} />
              Calendar
            </h3>
            <div className="settings-form-group">
              <label>
                <Clock size={16} />
                Hora de inicio del día
              </label>
              <select
                value={settings.calendar.dayStartHour - 2}
                onChange={(e) => handleSettingChange('calendar', 'dayStartHour', parseInt(e.target.value) + 2)}
                className="settings-form-input"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
            
            <div className="settings-form-group">
              <label>Estados predefinidos marcados</label>
              <div className="settings-checkbox-group">
                <label className="settings-checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.calendar.statusesPending}
                    onChange={(e) => handleSettingChange('calendar', 'statusesPending', e.target.checked)}
                  />
                  <span>Pendiente</span>
                </label>
                <label className="settings-checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.calendar.statusesCompleted}
                    onChange={(e) => handleSettingChange('calendar', 'statusesCompleted', e.target.checked)}
                  />
                  <span>Completado</span>
                </label>
                <label className="settings-checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.calendar.statusesSkipped}
                    onChange={(e) => handleSettingChange('calendar', 'statusesSkipped', e.target.checked)}
                  />
                  <span>Saltado</span>
                </label>
              </div>
            </div>
            
            <div className="settings-form-group">
              <label>Acordeones por defecto</label>
              <div className="settings-checkbox-group">
                <label className="settings-checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.calendar.raidsAccordionOpen}
                    onChange={(e) => handleSettingChange('calendar', 'raidsAccordionOpen', e.target.checked)}
                  />
                  <span>Raids abierto por defecto</span>
                </label>
                <label className="settings-checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.calendar.dailiesAccordionOpen}
                    onChange={(e) => handleSettingChange('calendar', 'dailiesAccordionOpen', e.target.checked)}
                  />
                  <span>Dailies abierto por defecto</span>
                </label>
              </div>
            </div>
          </div>

          <div className="settings-form-section">
            <h3>
              <BookOpen size={18} />
              Compendium
            </h3>
            <div className="settings-form-group">
              <label>Estados predefinidos marcados</label>
              <div className="settings-checkbox-group">
                <label className="settings-checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.compendium.statusesPending}
                    onChange={(e) => handleSettingChange('compendium', 'statusesPending', e.target.checked)}
                  />
                  <span>Pendiente</span>
                </label>
                <label className="settings-checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.compendium.statusesCompleted}
                    onChange={(e) => handleSettingChange('compendium', 'statusesCompleted', e.target.checked)}
                  />
                  <span>Completado</span>
                </label>
                <label className="settings-checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.compendium.statusesSkipped}
                    onChange={(e) => handleSettingChange('compendium', 'statusesSkipped', e.target.checked)}
                  />
                  <span>Saltado</span>
                </label>
              </div>
            </div>
            
            <div className="settings-form-group">
              <label className="settings-checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.compendium.onlyActiveRaidsAndDailies}
                  onChange={(e) => handleSettingChange('compendium', 'onlyActiveRaidsAndDailies', e.target.checked)}
                />
                <span>Solo activo para Raids y Dailies</span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-modal-footer">
          <button 
            className="settings-btn settings-btn-secondary" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button 
            className="settings-btn settings-btn-primary" 
            onClick={handleSaveSettings}
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="small" /> : (
              <>
                <Save size={16} />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;