import React, { useState, useEffect } from 'react'
import { calendarService } from '../../services/calendarService'
import { useToast } from '../../contexts/ToastContext'
import LoadingSpinner from '../ui/LoadingSpinner'
import './TodayDailies.css'

import { ELEMENT_TYPE_ICONS, STATUS_ICONS } from '../../utils/imageUtils';

const pendingIcon = STATUS_ICONS.pending;
const completedIcon = STATUS_ICONS.completed;
const skippedIcon = STATUS_ICONS.skipped;
const dailiesIcon = ELEMENT_TYPE_ICONS.dailies;

const TodayDailies = ({ selectedCampaign }) => {
  const { showSuccess, showError } = useToast()
  const [dailies, setDailies] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}')
      return !userSettings.calendar?.dailiesAccordionOpen
    } catch {
      return false 
    }
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    loadTodayDailies()
  }, [selectedCampaign])

  useEffect(() => {
    const handleSettingsChange = () => {
      try {
        const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}')
        setIsCollapsed(!userSettings.calendar?.dailiesAccordionOpen)
      } catch {
        setIsCollapsed(false)
      }
    }

    window.addEventListener('userSettingsChanged', handleSettingsChange)
    return () => window.removeEventListener('userSettingsChanged', handleSettingsChange)
  }, [])

  useEffect(() => {
    const handleCalendarRefresh = (event) => {
      if (event.detail && event.detail.elementType === 'dailies') {
        loadTodayDailies()
      }
    }

    window.addEventListener('calendarRefresh', handleCalendarRefresh)
    return () => window.removeEventListener('calendarRefresh', handleCalendarRefresh)
  }, [selectedCampaign])

  const loadTodayDailies = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await calendarService.getTodayDailies(selectedCampaign)
      const activeDailies = data.filter(daily => daily.is_active)
      setDailies(activeDailies)
    } catch (error) {
      console.error('Error loading today dailies:', error)
      setError('Error al cargar las tareas diarias')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDailyAction = async (daily, action) => {
    const today = new Date().toISOString().split('T')[0]
    
    try {
      switch (action) {
        case 'complete':
          await calendarService.completeDaily(daily.id, today)
          showSuccess(`¡${daily.title} completada! ⚡ ${daily.energy_value} energía`)
          break
        case 'skip':
          await calendarService.skipDaily(daily.id, today)
          showSuccess(`${daily.title} saltada ⏭️ Guardada para mañana`)
          break
        case 'undo':
          await calendarService.undoDailyCompletion(daily.id, today)
          showSuccess(`${daily.title} restaurada ↶ Lista para completar`)
          break
        default:
          return
      }
      await loadTodayDailies()
    } catch (error) {
      console.error(`Error ${action} daily:`, error)
      const actionText = action === 'complete' ? 'completar' : action === 'skip' ? 'saltar' : 'deshacer'
      showError(`Error al ${actionText} la tarea diaria`)
      setError(`Error al ${actionText} la tarea diaria`)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return completedIcon
      case 'skipped': return skippedIcon
      default: return pendingIcon
    }
  }

  const getEnergyClass = (energyValue) => {
    return energyValue >= 0 ? 'positive-energy' : 'negative-energy'
  }



  if (error) {
    return (
      <div className="dailies-panel error-state">
        <div className="panel-header">
          <div className="panel-title">
            <img src={dailiesIcon} alt="Dailies" className="panel-icon panel-icon-image" />
            <span className="error-badge">Error</span>
          </div>
        </div>
        <div className="panel-content">
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button onClick={loadTodayDailies} className="retry-btn">
              <span className="btn-icon">🔄</span>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`dailies-panel ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <div className="panel-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="panel-title">
          <img src={dailiesIcon} alt="Dailies" className="panel-icon panel-icon-image" />
          <h3>Diarias</h3>
          <span className="dailies-count">
            {dailies.filter(d => d.today_status === 'completed').length}/{dailies.length}
          </span>
        </div>
        <div className="header-actions">        
          <button className="collapse-btn">
            <span className={`chevron ${isCollapsed ? 'down' : 'up'}`}>▼</span>
          </button>
        </div>
      </div>

      <div className="panel-content">
        {isLoading ? (
          <div className="loading-state">
            <LoadingSpinner size="small" />
            <p>Cargando tareas diarias...</p>
          </div>
        ) : dailies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h4>No hay tareas diarias activas</h4>
            <p>¡Perfecto momento para descansar, aventurero!</p>
          </div>
        ) : (
          <div className="dailies-container">
            <div className="dailies-scroll">
              {dailies.map(daily => (
                <div key={daily.id} className={`daily-card status-${daily.today_status}`}>
                  <div className="daily-header">
                    <div className="daily-info">
                      <div className="daily-title">{daily.title}</div>
                      <div className="daily-meta">                        
                        <span className={`energy-badge ${getEnergyClass(daily.energy_value)}`}>
                          {daily.energy_value > 0 ? '+' : ''}{daily.energy_value} ⚡
                        </span>
                      </div>
                    </div>
                    <div className="daily-status">
                      <img 
                        src={getStatusIcon(daily.today_status)} 
                        alt={daily.today_status}
                        className="status-icon"
                      />
                    </div>
                  </div>
                  
                  {daily.description && (
                    <div className="daily-description">{daily.description}</div>
                  )}
                  
                  <div className="daily-actions">
                    {daily.today_status === 'pending' && (
                      <>
                        <button
                          className="action-btn complete"
                          onClick={() => handleDailyAction(daily, 'complete')}
                        >
                          Completar
                        </button>
                        <button
                          className="action-btn skip"
                          onClick={() => handleDailyAction(daily, 'skip')}
                        >
                          Saltar
                        </button>
                      </>
                    )}
                    
                    {(daily.today_status === 'completed' || daily.today_status === 'skipped') && (
                      <button
                        className="action-btn undo"
                        onClick={() => handleDailyAction(daily, 'undo')}
                      >
                        Deshacer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TodayDailies