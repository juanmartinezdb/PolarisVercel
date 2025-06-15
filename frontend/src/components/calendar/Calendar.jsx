import React, { useState, useEffect, useCallback } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { campaignService } from '../../services/campaignService'
import { calendarService } from '../../services/calendarService'
import { taskService } from '../../services/taskService'
import { useToast } from '../../contexts/ToastContext'
import useLoading from '../../hooks/useLoading'
import LoadingSpinner from '../ui/LoadingSpinner'
import WeeklyView from './WeeklyView'
import MonthlyView from './MonthlyView'
import GuildBoard from './GuildBoard'
import TodayDailies from './TodayDailies'
import TodayRaids from './TodayRaids'
import TaskModal from './TaskModal'
import ItemModal from '../ui/ItemModal'
import FormModal from '../ui/FormModal'
import DeleteConfirmModal from '../ui/DeleteConfirmModal'
import chevLeftIcon from '../../assets/images/chevleft.png'
import chevRightIcon from '../../assets/images/chevright.png'
import './Calendar.css'

const CALENDAR_VIEWS = {
  WEEK: 'week',
  MONTH: 'month'
}

const TASK_STATUS_FILTERS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  SKIPPED: 'skipped'
}

const getUserSettings = () => {
  try {
    const savedSettings = localStorage.getItem('userSettings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      return {
        dayStartHour: parsed.calendar?.dayStartHour || 6,
        statusesPending: parsed.calendar?.statusesPending !== undefined ? parsed.calendar.statusesPending : true,
        statusesCompleted: parsed.calendar?.statusesCompleted !== undefined ? parsed.calendar.statusesCompleted : true,
        statusesSkipped: parsed.calendar?.statusesSkipped !== undefined ? parsed.calendar.statusesSkipped : false
      }
    }
  } catch (error) {
    console.error('Error parsing user settings:', error)
  }
  return {
    dayStartHour: 6, 
    statusesPending: true,
    statusesCompleted: true,
    statusesSkipped: false
  }
}

const Calendar = () => {
  const { showSuccess, showError } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState(CALENDAR_VIEWS.WEEK)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [scheduleStartHour, setScheduleStartHour] = useState(6)
  const [scheduleEndHour, setScheduleEndHour] = useState(30)
  const [calendarData, setCalendarData] = useState({
    tasks: [],
    dailies: [],
    raids: [],
    logbookEntries: []
  })
  const [campaigns, setCampaigns] = useState([])
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [modalMode, setModalMode] = useState('view') 
  const [showItemModal, setShowItemModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [formModalType, setFormModalType] = useState(null)
  const [selectedStatusFilters, setSelectedStatusFilters] = useState([])
  const [createTaskData, setCreateTaskData] = useState(null) 
  const { isLoading, startLoading, stopLoading } = useLoading()

  useEffect(() => {
    loadInitialData()
    loadUserSettings()
  }, [])


  const loadUserSettings = () => {
    const userSettings = getUserSettings()
    setScheduleStartHour(userSettings.dayStartHour)
    setScheduleEndHour(userSettings.dayStartHour + 24) 
    
   
    const statusFilters = []
    if (userSettings.statusesPending) statusFilters.push(TASK_STATUS_FILTERS.PENDING)
    if (userSettings.statusesCompleted) statusFilters.push(TASK_STATUS_FILTERS.COMPLETED)
    if (userSettings.statusesSkipped) statusFilters.push(TASK_STATUS_FILTERS.SKIPPED)
    setSelectedStatusFilters(statusFilters)
  }

 
  useEffect(() => {
    const handleSettingsChange = () => {
      loadUserSettings()
    }

    window.addEventListener('userSettingsChanged', handleSettingsChange)
    
    return () => {
      window.removeEventListener('userSettingsChanged', handleSettingsChange)
    }
  }, [])

  const loadInitialData = async () => {
    startLoading()
    try {
      const campaignsData = await campaignService.getCampaigns()
      setCampaigns(campaignsData)
      
  
      setSelectedCampaign(null)
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      stopLoading()
    }
  }

  const loadCalendarData = useCallback(async () => {
    try {
      const { startDate, endDate } = getDateRange()
      const data = await calendarService.getCalendarData(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        selectedCampaign
      )
      setCalendarData(data)
    } catch (error) {
      console.error('Error loading calendar data:', error)
    }
  }, [currentDate, calendarView, selectedCampaign])

  useEffect(() => {
    loadCalendarData()
  }, [currentDate, calendarView, selectedCampaign])


  useEffect(() => {
    const handleCalendarRefresh = (event) => {
      console.log('Calendar refresh triggered:', event.detail)
      loadCalendarData()
    }

    window.addEventListener('calendarRefresh', handleCalendarRefresh)
    
    return () => {
      window.removeEventListener('calendarRefresh', handleCalendarRefresh)
    }
  }, [loadCalendarData])

 
  const filterTasksByStatus = (tasks) => {
    if (selectedStatusFilters.length === 0) {
      return tasks
    }
    return tasks.filter(task => selectedStatusFilters.includes(task.status))
  }

  const getFilteredTasks = () => {
    return filterTasksByStatus(calendarData.tasks)
  }

  const handleStatusFilterToggle = (status) => {
    setSelectedStatusFilters(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status)
      } else {
        return [...prev, status]
      }
    })
  }

  const getDateRange = () => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    switch (calendarView) {
      case CALENDAR_VIEWS.MONTH:
        start.setDate(1)
        end.setMonth(end.getMonth() + 1, 0)
        break
      case CALENDAR_VIEWS.WEEK:
        const dayOfWeek = start.getDay()
        start.setDate(start.getDate() - dayOfWeek)
        end.setDate(start.getDate() + 6)
        break
    }

    return { startDate: start, endDate: end }
  }

  const handleTaskDrop = async (taskId, newDateTime) => {
    try {
      await calendarService.updateTaskDateTime(
        taskId,
        newDateTime.date,
        newDateTime.time
      )
      await loadCalendarData()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleTaskTypeConversion = async (taskId, newType, dateTime) => {
    try {
      await calendarService.convertTaskType(taskId, newType, dateTime)
      await loadCalendarData()
    } catch (error) {
      console.error('Error converting task type:', error)
    }
  }

  const handleTaskClick = (task, mode = 'view') => {
    setSelectedTask(task)
    setModalMode(mode)
    setShowTaskModal(true)
  }

  const handleTaskComplete = async (taskId, taskType) => {
    try {
      if (taskType === 'daily') {
        await calendarService.completeDaily(taskId, selectedDate.toISOString().split('T')[0])
        showSuccess('¡Tarea diaria completada! ⚡ Energía obtenida')
      } else if (taskType === 'raid') {
        await calendarService.completeRaid(taskId, selectedDate.toISOString().split('T')[0])
        showSuccess('¡Jefe derrotado! 🏆 Victoria!')
      } else {
        await calendarService.completeTask(taskId)
        showSuccess('¡Misión completada!')
      }
      await loadCalendarData()
    } catch (error) {
      console.error('Error completing task:', error)
      showError('Error al completar la tarea. Inténtalo de nuevo')
    }
  }

  const handleTaskDelete = async (taskId, taskType) => {
    try {
      if (taskType === 'daily') {
        await calendarService.deleteDaily(taskId)
        showSuccess('Tarea diaria eliminada del registro')
      } else if (taskType === 'raid') {
        await calendarService.deleteRaid(taskId)
        showSuccess('Raid eliminada del calendario')
      } else {
        await calendarService.deleteTask(taskId)
        showSuccess('Misión eliminada del tablón')
      }
      await loadCalendarData()
    } catch (error) {
      console.error('Error deleting task:', error)
      showError('Error al eliminar la tarea. Inténtalo de nuevo')
    }
  }

  const handleTaskSave = async (taskData) => {
    try {
      if (modalMode === 'create') {
        await calendarService.createTask(taskData)
        showSuccess('¡Nueva misión creada! 📋 Añadida al tablón')
      } else if (modalMode === 'edit') {
        await calendarService.updateTask(selectedTask.id, taskData)
        showSuccess('¡Misión actualizada! ✏️ Cambios guardados')
      }
      setShowTaskModal(false)
      await loadCalendarData()
    } catch (error) {
      console.error('Error saving task:', error)
      showError('Error al guardar la misión. Inténtalo de nuevo')
    }
  }

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus)
      
      switch (newStatus) {
        case 'completed':
          showSuccess('¡Misión completada!')
          break
        case 'skipped':
          showSuccess('Misión saltada, otro día tal vez')
          break
        case 'pending':
          showSuccess('Misión restaurada ↶')
          break
        default:
          showSuccess('Estado de misión actualizado')
      }
      
      await loadCalendarData()
    } catch (error) {
      console.error('Error updating task status:', error)
      showError('Error al actualizar el estado de la misión')
    }
  }

  const handleTaskView = (task) => {
    setSelectedItem(task)
    setShowItemModal(true)
  }

  const handleTaskEdit = (task) => {
    const adjustedTask = { ...task }
    
    if (adjustedTask.due_time) {
      const [hours, minutes] = adjustedTask.due_time.split(':')
      let adjustedHours = parseInt(hours) - 2
      
      if (adjustedHours < 0) {
        adjustedHours = 24 + adjustedHours
        if (adjustedTask.due_date) {
          const taskDate = new Date(adjustedTask.due_date)
          taskDate.setDate(taskDate.getDate() - 1)
          adjustedTask.due_date = taskDate.toISOString().split('T')[0]
        }
      }
      
      adjustedTask.due_time = `${adjustedHours.toString().padStart(2, '0')}:${minutes}`
    }
    
    setSelectedItem(adjustedTask)
    setFormModalType(task.task_type)
    setShowFormModal(true)
  }

  const handleTaskDeleteConfirm = (task) => {
    setSelectedItem(task)
    setShowDeleteModal(true)
  }

  const handleFormModalSubmit = async (formData) => {
    try {
      await taskService.updateTask(selectedItem.id, formData)
      setShowFormModal(false)
      setSelectedItem(null)
      showSuccess('¡Misión actualizada! ✏️ Cambios guardados')
      await loadCalendarData()
    } catch (error) {
      console.error('Error updating task:', error)
      showError('Error al actualizar la misión. Inténtalo de nuevo')
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      await taskService.deleteTask(selectedItem.id)
      setShowDeleteModal(false)
      setSelectedItem(null)
      showSuccess('¡Misión eliminada! 🗑️ Removida del tablón')
      await loadCalendarData()
    } catch (error) {
      console.error('Error deleting task:', error)
      showError('Error al eliminar la misión. Inténtalo de nuevo')
    }
  }

  const handleTimeSlotClick = (slotDateTime) => {
    setCreateTaskData({
      due_date: slotDateTime.date,
      due_time: slotDateTime.time
    })
    setFormModalType('closed_quest')
    setShowFormModal(true)
  }

  const handleCreateTaskSubmit = async (formData) => {
    try {
      await taskService.createTask({
        ...formData,
        task_type: 'closed_quest'
      })
      setShowFormModal(false)
      setCreateTaskData(null)
      setFormModalType(null)
      showSuccess('¡Misión cerrada creada! 📅 Programada en el calendario')
      await loadCalendarData()
    } catch (error) {
      console.error('Error creating task:', error)
      showError('Error al crear la misión. Inténtalo de nuevo')
    }
  }

  const handleItemUpdate = async (updatedItem) => {
    await loadCalendarData()
  }

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate)
    
    switch (calendarView) {
      case CALENDAR_VIEWS.MONTH:
        newDate.setMonth(newDate.getMonth() + direction)
        break
      case CALENDAR_VIEWS.WEEK:
        newDate.setDate(newDate.getDate() + (direction * 7))
        break
    }
    
    setCurrentDate(newDate)
  }

  const formatCurrentDate = () => {
    if (calendarView === CALENDAR_VIEWS.MONTH) {
      return currentDate.toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric'
      })
    } else {
      const { startDate, endDate } = getDateRange()
      return `${startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
  }

  if (isLoading) {
    return (
      <div className="calendar-container">
        <LoadingSpinner type="energy" size="large" />
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="calendar">
        {isLoading && <LoadingSpinner />}
        
        <div className="today-section">
          <div className="today-panels-container">
            <div className="gamified-panels-section">
              <TodayRaids selectedCampaign={selectedCampaign} />      
              <TodayDailies selectedCampaign={selectedCampaign} />
            </div>
          </div>
        </div>

        <div className="campaign-filter-bar">
          <div className="campaign-filter-content">
            <span className="campaign-filter-label">Filtrar por Campaña:</span>
            <div className="campaign-buttons">
              <button
                className={`campaign-btn ${selectedCampaign === null ? 'selected' : ''}`}
                onClick={() => setSelectedCampaign(null)}
              >
                <span className="campaign-indicator all-campaigns"></span>
                <span className="campaign-name">Todas</span>
              </button>
              {campaigns.map(campaign => {
                const isSelected = selectedCampaign === campaign.id;
                return (
                  <button
                    key={campaign.id}
                    className={`campaign-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedCampaign(campaign.id)}
                    style={{
                      '--campaign-color': campaign.color,
                      borderColor: isSelected ? campaign.color : 'transparent'
                    }}
                    title={campaign.name}
                  >
                    <span 
                      className="campaign-indicator" 
                      style={{ backgroundColor: campaign.color }}
                    ></span>
                    <span className="campaign-name">{campaign.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="calendar-panel">
          <div className="calendar-header">
            <div className="calendar-controls">
              <div className="view-selector">
                <button
                  className={`view-btn ${calendarView === CALENDAR_VIEWS.WEEK ? 'active' : ''}`}
                  onClick={() => setCalendarView(CALENDAR_VIEWS.WEEK)}
                >
                  Semana
                </button>
                <button
                  className={`view-btn ${calendarView === CALENDAR_VIEWS.MONTH ? 'active' : ''}`}
                  onClick={() => setCalendarView(CALENDAR_VIEWS.MONTH)}
                >
                  Mes
                </button>
              </div>
              
              <div className="date-navigation">
                <button className="nav-btn" onClick={() => navigateDate(-1)}>
                  <img src={chevLeftIcon} alt="Anterior" className="nav-icon" />
                </button>
                <div className="current-date">
                  {formatCurrentDate()}
                </div>
                <button className="nav-btn" onClick={() => navigateDate(1)}>
                  <img src={chevRightIcon} alt="Siguiente" className="nav-icon" />
                </button>
              </div>
              
              <div className="status-filter">
                <button
                  className={`calendar-status-btn ${selectedStatusFilters.includes(TASK_STATUS_FILTERS.PENDING) ? 'active' : ''}`}
                  onClick={() => handleStatusFilterToggle(TASK_STATUS_FILTERS.PENDING)}
                >
                  Pendientes
                </button>
                <button
                  className={`calendar-status-btn ${selectedStatusFilters.includes(TASK_STATUS_FILTERS.COMPLETED) ? 'active' : ''}`}
                  onClick={() => handleStatusFilterToggle(TASK_STATUS_FILTERS.COMPLETED)}
                >
                  Completadas
                </button>
                <button
                  className={`calendar-status-btn ${selectedStatusFilters.includes(TASK_STATUS_FILTERS.SKIPPED) ? 'active' : ''}`}
                  onClick={() => handleStatusFilterToggle(TASK_STATUS_FILTERS.SKIPPED)}
                >
                  Saltadas
                </button>
              </div>
            </div>
          </div>
        
          <div className="calendar-body">
            <div className="calendar-main">
              {calendarView === CALENDAR_VIEWS.WEEK && (
                <WeeklyView
                  currentDate={currentDate}
                  selectedDate={selectedDate}
                  calendarData={{
                    ...calendarData,
                    tasks: getFilteredTasks()
                  }}
                  scheduleStartHour={scheduleStartHour}
                  scheduleEndHour={scheduleEndHour}
                  onDateSelect={setSelectedDate}
                  onTaskClick={handleTaskClick}
                  onTaskDrop={handleTaskDrop}
                  onTaskTypeConversion={handleTaskTypeConversion}
                  onTaskComplete={handleTaskComplete}
                  onTaskDelete={handleTaskDelete}
                  onTaskStatusChange={handleTaskStatusChange}
                  onTaskView={handleTaskView}
                  onTaskEdit={handleTaskEdit}
                  onTaskDeleteConfirm={handleTaskDeleteConfirm}
                  onTimeSlotClick={handleTimeSlotClick}
                />
              )}
              
              {calendarView === CALENDAR_VIEWS.MONTH && (
                <MonthlyView
                  currentDate={currentDate}
                  selectedDate={selectedDate}
                  tasks={getFilteredTasks()}
                  dailies={calendarData.dailies}
                  raids={calendarData.raids}
                  onDateClick={setSelectedDate}
                  onTaskClick={handleTaskClick}
                  onTaskDrop={handleTaskDrop}
                  onTaskTypeConversion={handleTaskTypeConversion}
                  onTaskComplete={handleTaskComplete}
                  onTaskDelete={handleTaskDelete}
                  selectedCampaign={selectedCampaign}
                />
              )}
            </div>
            
            <div className="calendar-sidebar">
              <GuildBoard
                tasks={getFilteredTasks().filter(task => 
                  task.task_type === 'commission' || task.task_type === 'rumor'
                )}
                onTaskDrop={handleTaskDrop}
                onTaskTypeConversion={handleTaskTypeConversion}
                onTaskClick={handleTaskClick}
                onTaskComplete={handleTaskComplete}
                onTaskDelete={handleTaskDelete}
                onTaskStatusChange={handleTaskStatusChange}
                onTaskView={handleTaskView}
                onTaskEdit={handleTaskEdit}
                onTaskDeleteConfirm={handleTaskDeleteConfirm}
              />
            </div>
          </div>
        </div>
      
        {showTaskModal && (
          <TaskModal
            task={selectedTask}
            mode={modalMode}
            campaigns={campaigns}
            onSave={handleTaskSave}
            onClose={() => setShowTaskModal(false)}
          />
        )}

        {showItemModal && selectedItem && (
          <ItemModal
            item={selectedItem}
            onClose={() => {
              setShowItemModal(false)
              setSelectedItem(null)
            }}
            onItemUpdate={handleItemUpdate}
          />
        )}

        {showFormModal && selectedItem && (
          <FormModal
            elementType={formModalType}
            editItem={selectedItem}
            mode="edit"
            onSubmit={handleFormModalSubmit}
            onClose={() => {
              setShowFormModal(false)
              setSelectedItem(null)
              setFormModalType(null)
            }}
          />
        )}

        {showFormModal && createTaskData && (
          <FormModal
            elementType={formModalType}
            editItem={createTaskData}
            mode="create"
            onSubmit={handleCreateTaskSubmit}
            onClose={() => {
              setShowFormModal(false)
              setCreateTaskData(null)
              setFormModalType(null)
            }}
          />
        )}

        {showDeleteModal && selectedItem && (
          <DeleteConfirmModal
            elementType={selectedItem.task_type}
            item={selectedItem}
            onConfirm={handleDeleteConfirm}
            onClose={() => {
              setShowDeleteModal(false)
              setSelectedItem(null)
            }}
          />
        )}
      </div>
    </DndProvider>
  )
}

export default Calendar