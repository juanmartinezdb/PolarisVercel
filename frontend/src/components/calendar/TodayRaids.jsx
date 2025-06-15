import React, { useState, useEffect } from 'react'
import { calendarService } from '../../services/calendarService'
import { taskService } from '../../services/taskService'
import { useToast } from '../../contexts/ToastContext'
import LoadingSpinner from '../ui/LoadingSpinner'
import FormModal from '../ui/FormModal'
import './TodayRaids.css'
// Importar icono de panel
import raidIcon from '../../assets/images/types/raid.png'
import skippedIcon from '../../assets/images/skipped.png'

const TodayRaids = ({ selectedCampaign }) => {
  const { showSuccess, showError } = useToast()
  const [raids, setRaids] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}')
      return !userSettings.calendar?.raidsAccordionOpen
    } catch {
      return false 
    }
  })
  const [error, setError] = useState(null)
  const [completedToday, setCompletedToday] = useState(new Set())
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedRaid, setSelectedRaid] = useState(null)

  const handleRaidClick = (raid, event) => {
    if (event.target.closest('.card-actions') || event.target.closest('.action-btn')) {
      return
    }
    
    setSelectedRaid(raid)
    setShowEditModal(true)
  }

  const handleEditSubmit = async (formData) => {
    try {
      const updatedRaid = await taskService.updateRaid(selectedRaid.id, formData)
      
      setRaids(prev => prev.map(raid => 
        raid.id === selectedRaid.id ? updatedRaid : raid
      ))
      
      setShowEditModal(false)
      setSelectedRaid(null)
      showSuccess('Raid actualizada exitosamente')
      
      await loadTodayRaids()
    } catch (error) {
      console.error('Error updating raid:', error)
      showError('Error al actualizar la raid')
    }
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSelectedRaid(null)
  }

  useEffect(() => {
    loadTodayRaids()
  }, [selectedCampaign])

  useEffect(() => {
    const handleSettingsChange = () => {
      try {
        const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}')
        setIsCollapsed(!userSettings.calendar?.raidsAccordionOpen)
      } catch {
        setIsCollapsed(false)
      }
    }

    window.addEventListener('userSettingsChanged', handleSettingsChange)
    return () => window.removeEventListener('userSettingsChanged', handleSettingsChange)
  }, [])

  useEffect(() => {
    const handleCalendarRefresh = (event) => {
      if (event.detail && event.detail.elementType === 'raids') {
        loadTodayRaids()
      }
    }

    window.addEventListener('calendarRefresh', handleCalendarRefresh)
    return () => window.removeEventListener('calendarRefresh', handleCalendarRefresh)
  }, [selectedCampaign])

  const loadTodayRaids = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await calendarService.getTodayRaids(selectedCampaign)
      setRaids(data)
      setCompletedToday(new Set())
    } catch (error) {
      console.error('Error loading today raids:', error)
      setError('Error al cargar las Raids')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRaidAction = async (raid, action) => {
    const today = new Date().toISOString().split('T')[0]
    
    try {
      switch (action) {
        case 'defeat':
          await calendarService.completeRaid(raid.id, today)
          setCompletedToday(prev => new Set([...prev, raid.id]))
          showSuccess(`¡${raid.title} derrotado! 🏆 ${raid.energy_value} de energía pa la saca!`)
          break
        case 'flee':
          await calendarService.skipRaid(raid.id, today)
          showSuccess(`Huida táctica de ${raid.title} 🏃‍♂️ Reagruparse para luchar otro día`)
          break
        case 'undo':
          await calendarService.undoRaidCompletion(raid.id, today)
          setCompletedToday(prev => {
            const newSet = new Set(prev)
            newSet.delete(raid.id)
            return newSet
          })
          showSuccess(`${raid.title} restaurado ↶ El jefe ha regresado`)
          break
        default:
          return
      }
      await loadTodayRaids()
    } catch (error) {
      console.error(`Error ${action} raid:`, error)
      const actionText = action === 'defeat' ? 'derrotar al jefe' : action === 'flee' ? 'huir' : 'deshacer'
      showError(`Error al ${actionText} la incursión`)
      setError(`Error al ${actionText} la incursión`)
    }
  }

  const getRaidImage = (difficulty, energyValue) => {
    const energyType = energyValue >= 0 ? 'positive' : 'negative'
    const difficultyName = difficulty || 'easy'
    return `/src/assets/images/raids/${difficultyName}-raid-${energyType}.png`
  }

  const getDefeatedImage = () => {
    return '/src/assets/images/raids/defeated.png'
  }

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'completed': return { text: 'Derrotado', icon: '✅', class: 'completed' }
      case 'skipped': return { text: 'Huida', icon: <img src={skippedIcon} alt="Huida" className="status-icon-image" />, class: 'skipped' }
      default: return { text: 'Pendiente', icon: '⏳', class: 'pending' }
    }
  }

  const getRaidStatus = (raid) => {
    if (completedToday.has(raid.id) || raid.today_status === 'completed') {
      return 'completed'
    }
    if (raid.today_status === 'skipped') {
      return 'skipped'
    }
    return 'pending'
  }

  const getBossStatus = (raidTime, duration = 60) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const [hours, minutes] = raidTime.split(':').map(Number)
    const raidStartTime = new Date(today.getTime() + hours * 60 * 60 * 1000 + minutes * 60 * 1000)
    const raidEndTime = new Date(raidStartTime.getTime() + duration * 60 * 1000)
    
    const timeDiffStart = raidStartTime.getTime() - now.getTime()
    const timeDiffEnd = raidEndTime.getTime() - now.getTime()
    
    if (timeDiffEnd <= 0) {
      return { status: 'expired', message: 'El boss ha expirado' }
    }
    
    if (timeDiffStart <= 0 && timeDiffEnd > 0) {
      return { status: 'active', message: 'Boss en curso' }
    }
    
    const totalSeconds = Math.floor(timeDiffStart / 1000)
    const hours_remaining = Math.floor(totalSeconds / 3600)
    const minutes_remaining = Math.floor((totalSeconds % 3600) / 60)
    const seconds_remaining = totalSeconds % 60
    const centiseconds = Math.floor((timeDiffStart % 1000) / 10)
    
    return {
      status: 'pending',
      hours: hours_remaining,
      minutes: minutes_remaining,
      seconds: seconds_remaining,
      centiseconds,
      totalMs: timeDiffStart
    }
  }

  const getTimerColor = (bossStatus) => {
    if (bossStatus.status === 'expired') return 'timer-expired'
    if (bossStatus.status === 'active') return 'timer-red'
    
    const totalHours = bossStatus.totalMs / (1000 * 60 * 60)
    if (totalHours > 2) return 'timer-green'
    if (totalHours > 1) return 'timer-orange'
    return 'timer-red'
  }

  const [currentTime, setCurrentTime] = useState(new Date())
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 100)
    
    return () => clearInterval(interval)
  }, [])

  const activeRaids = raids.filter(raid => 
    raid.today_status === 'pending' && !completedToday.has(raid.id)
  )
  const completedRaids = raids.filter(raid => 
    raid.today_status === 'completed' || completedToday.has(raid.id)
  )
  const skippedRaids = raids.filter(raid => raid.today_status === 'skipped')

  return (
    <div className={`raids-accordion-panel ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <div className="accordion-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="header-content">
          <div className="panel-icon-title">
            <img src={raidIcon} alt="Raids" className="panel-icon panel-icon-image" />
            <h2 className="panel-title">Raids Semanales</h2>
          </div>
          <div className="panel-stats">
            <div className="boss-counter">
              <span className="counter-label">Jefes Activos</span>
              <span className="counter-value">{activeRaids.length}</span>
            </div>
            {completedRaids.length > 0 && (
              <div className="victory-counter">
                <span className="counter-label">Derrotados</span>
                <span className="counter-value">{completedRaids.length}</span>
              </div>
            )}
          </div>
        </div>
        <div className="accordion-toggle">
          <span className={`toggle-icon ${isCollapsed ? 'collapsed' : 'expanded'}`}>
            {isCollapsed ? '▼' : '▲'}
          </span>
        </div>
      </div>
      
      <div className={`accordion-content ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        {isLoading ? (
          <div className="loading-state">
            <LoadingSpinner type="energy" size="medium" />
            <p>Explorando mazmorras...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button onClick={loadTodayRaids} className="retry-btn">
              Reintentar Exploración
            </button>
          </div>
        ) : raids.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🏰</span>
            <h3>No hay Raids programadas</h3>
            <p>¡Disfruta de un día de paz, aventurero!</p>
          </div>
        ) : (
          <div className="raids-grid-container">
            <div className="raids-grid">
              {raids.map(raid => {
                const status = getRaidStatus(raid)
                return (
                  <div 
                    key={raid.id} 
                    className={`raid-card ${raid.difficulty} ${status}`}
                    onClick={(e) => handleRaidClick(raid, e)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-header">
                      <div className="raid-header-info">
                        <h4 className="raid-title">{raid.title}</h4>
                        <div className="raid-time">
                          {status === 'skipped' && (
                            <span className="skip-indicator">Huida</span>
                          )}
                          <span className="time-display">{raid.start_time}</span>
                        </div>
                      </div>
                      {status === 'pending' && (() => {
                        const bossStatus = getBossStatus(raid.start_time, raid.duration || 60)
                        const timerColorClass = getTimerColor(bossStatus)
                        
                        return (
                          <div className={`raid-timer ${timerColorClass}`}>
                            <div className="timer-display">
                              {bossStatus.status === 'pending' ? (
                                `${String(bossStatus.hours).padStart(2, '0')}:${String(bossStatus.minutes).padStart(2, '0')}:${String(bossStatus.seconds).padStart(2, '0')}:${String(bossStatus.centiseconds).padStart(2, '0')}`
                              ) : (
                                bossStatus.message
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                    
                    <div className="card-body">
                      <div className="raid-image-container">
                        <img 
                          src={getRaidImage(raid.difficulty, raid.energy_value)} 
                          alt={`${raid.difficulty} raid`}
                          className={`raid-image ${status === 'pending' && getBossStatus(raid.start_time, raid.duration || 60).status === 'expired' ? 'expired' : ''}`}
                        />
                        {status === 'completed' && (
                          <img 
                            src={getDefeatedImage()} 
                            alt="Defeated"
                            className="defeated-overlay"
                          />
                        )}
                      </div>
                      
                      <p className="raid-description">{raid.description}</p>
                      
                      {status !== 'skipped' && (
                        <div className="energy-counter">
                          <span className="energy-label">Recompensa</span>
                          <div className={`energy-value ${raid.energy_value >= 0 ? 'positive' : 'negative'}`}>
                            <span className="energy-icon">⚡</span>
                            <span className="energy-amount">
                              {status === 'completed' ? '+' : ''}{Math.abs(raid.energy_value)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className={`card-actions ${status}`}>
                      {status === 'pending' && (
                        <>
                          <button 
                            className="action-btn primary"
                            onClick={() => handleRaidAction(raid, 'defeat')}
                          >
                            <span className="btn-icon">⚔️</span>
                            <span>Enfrentar</span>
                          </button>
                          <button 
                            className="action-btn secondary"
                            onClick={() => handleRaidAction(raid, 'flee')}
                          >
                            <span className="btn-icon"><img src={skippedIcon} alt="Huir" className="btn-icon-image" /></span>
                            <span>Huir</span>
                          </button>
                        </>
                      )}
                      
                      {status === 'completed' && (
                        <>
                          <div className="victory-message">
                            <span className="victory-icon">🏆</span>
                            <span>¡Victoria!</span>
                          </div>
                          <button 
                            className="action-btn undo"
                            onClick={() => handleRaidAction(raid, 'undo')}
                          >
                            <span className="btn-icon">↶</span>
                            <span>Deshacer</span>
                          </button>
                        </>
                      )}
                      
                      {status === 'skipped' && (
                        <button 
                          className="action-btn undo"
                          onClick={() => handleRaidAction(raid, 'undo')}
                        >
                          <span className="btn-icon">↶</span>
                          <span>Deshacer</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      
      {showEditModal && selectedRaid && (
        <FormModal
          elementType="raids"
          mode="edit"
          editItem={selectedRaid}
          onSubmit={handleEditSubmit}
          onClose={handleCloseEditModal}
        />
      )}
    </div>
  )
}

export default TodayRaids