import React, { useState } from 'react'
import { useDrop } from 'react-dnd'
import TaskItem from './TaskItem'
import './GuildBoard.css'

const GUILD_BOARD_TABS = {
  COMMISSION: 'commission',
  RUMOR: 'rumor'
}

const ITEM_TYPES = {
  TASK: 'task'
}

const GuildBoard = ({ 
  tasks, 
  onTaskDrop, 
  onTaskTypeConversion, 
  onTaskClick, 
  onTaskComplete, 
  onTaskDelete,
  onTaskStatusChange,
  onTaskView,
  onTaskEdit,
  onTaskDeleteConfirm
}) => {
  const [activeTab, setActiveTab] = useState(GUILD_BOARD_TABS.COMMISSION)

  const getTasksByType = (type) => {
    // eslint-disable-next-line react/prop-types
    return tasks.filter(task => task.task_type === type)
  }

  const [{ isOverConversion, canDropConversion }, dropConversion] = useDrop({
    accept: ITEM_TYPES.TASK,
    drop: (item) => {
      if (activeTab === GUILD_BOARD_TABS.COMMISSION && item.task_type === 'commission') {
        onTaskTypeConversion(item.id, 'rumor')
      } else if (activeTab === GUILD_BOARD_TABS.RUMOR && item.task_type === 'rumor') {
        onTaskTypeConversion(item.id, 'commission')
      }
    },
    canDrop: (item) => {
      return (activeTab === GUILD_BOARD_TABS.COMMISSION && item.task_type === 'commission') ||
             (activeTab === GUILD_BOARD_TABS.RUMOR && item.task_type === 'rumor')
    },
    collect: (monitor) => ({
      isOverConversion: monitor.isOver(),
      canDropConversion: monitor.canDrop()
    })
  })

  const [{ isOverCommission, canDropCommission }, dropCommission] = useDrop({
    accept: ITEM_TYPES.TASK,
    drop: (item) => {
      if (item.task_type === 'commission') return
      
      if (['rumor', 'open_quest', 'closed_quest'].includes(item.task_type)) {
        onTaskTypeConversion(item.id, 'commission')
      }
    },
    canDrop: (item) => {
      return ['rumor', 'open_quest', 'closed_quest'].includes(item.task_type)
    },
    collect: (monitor) => ({
      isOverCommission: monitor.isOver(),
      canDropCommission: monitor.canDrop()
    })
  })

  const [{ isOverRumor, canDropRumor }, dropRumor] = useDrop({
    accept: ITEM_TYPES.TASK,
    drop: (item) => {
      if (item.task_type === 'rumor') return
      
      if (['commission', 'open_quest', 'closed_quest'].includes(item.task_type)) {
        onTaskTypeConversion(item.id, 'rumor')
      }
    },
    canDrop: (item) => {
      return ['commission', 'open_quest', 'closed_quest'].includes(item.task_type)
    },
    collect: (monitor) => ({
      isOverRumor: monitor.isOver(),
      canDropRumor: monitor.canDrop()
    })
  })

  const getCommissionTabClassName = () => {
    let className = `guild-tab ${activeTab === GUILD_BOARD_TABS.COMMISSION ? 'active' : ''}`
    if (activeTab === GUILD_BOARD_TABS.COMMISSION) {
      if (isOverCommission && canDropCommission) className += ' drop-target'
      if (canDropCommission) className += ' can-drop'
    }
    return className
  }

  const getRumorTabClassName = () => {
    let className = `guild-tab ${activeTab === GUILD_BOARD_TABS.RUMOR ? 'active' : ''}`
    if (activeTab === GUILD_BOARD_TABS.RUMOR) {
      if (isOverRumor && canDropRumor) className += ' drop-target'
      if (canDropRumor) className += ' can-drop'
    }
    return className
  }

  const getContentClassName = () => {
    let className = 'guild-content'
    if (activeTab === GUILD_BOARD_TABS.COMMISSION) {
      if (isOverCommission && canDropCommission) className += ' drop-target'
    } else if (activeTab === GUILD_BOARD_TABS.RUMOR) {
      if (isOverRumor && canDropRumor) className += ' drop-target'
    }
    return className
  }

  const getConversionSlotClassName = () => {
    let className = 'conversion-slot'
    if (isOverConversion && canDropConversion) className += ' drop-target'
    if (canDropConversion) className += ' can-drop'
    return className
  }

  const getConversionText = () => {
    if (activeTab === GUILD_BOARD_TABS.COMMISSION) {
      return 'Convertir a Rumor'
    } else {
      return 'Convertir a Encargo'
    }
  }

  return (
    <div className="guild-board">
      <div className="guild-board-header">
        <h3 className="guild-board-title">Tablón del Gremio</h3>
      </div>
      
      <div className="guild-tabs">
        <button
          ref={activeTab === GUILD_BOARD_TABS.COMMISSION ? dropCommission : null}
          className={getCommissionTabClassName()}
          onClick={() => setActiveTab(GUILD_BOARD_TABS.COMMISSION)}
        >
          Encargos
        </button>
        <button
          ref={activeTab === GUILD_BOARD_TABS.RUMOR ? dropRumor : null}
          className={getRumorTabClassName()}
          onClick={() => setActiveTab(GUILD_BOARD_TABS.RUMOR)}
        >
          Rumores
        </button>
      </div>

      <div 
        ref={dropConversion}
        className={getConversionSlotClassName()}
      >
        <div className="conversion-text">{getConversionText()}</div>
      </div>

      <div 
        ref={activeTab === GUILD_BOARD_TABS.COMMISSION ? dropCommission : dropRumor}
        className={getContentClassName()}
      >
        {activeTab === GUILD_BOARD_TABS.COMMISSION && (
          <div className="commission-section">
            <div className="guild-list">
              {getTasksByType('commission').map(task => (
                <TaskItem
                key={task.id}
                task={task}
                taskType={task.task_type}
                isDraggable={true}
                onTaskClick={onTaskClick}
                onTaskComplete={onTaskComplete}
                onTaskDelete={onTaskDelete}
                onTaskStatusChange={onTaskStatusChange}
                onTaskView={onTaskView}
                onTaskEdit={onTaskEdit}
                onTaskDeleteConfirm={onTaskDeleteConfirm}
              />
              ))}
              {getTasksByType('commission').length === 0 && (
                <div className="empty-state">
                  <p>No hay encargos disponibles</p>
                  <p className="drop-hint">Arrastra tareas aquí para convertirlas en encargos</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === GUILD_BOARD_TABS.RUMOR && (
          <div className="rumor-section">
            <div className="guild-list">
              {getTasksByType('rumor').map(task => (
                <TaskItem
                key={task.id}
                task={task}
                taskType={task.task_type}
                isDraggable={true}
                onTaskClick={onTaskClick}
                onTaskComplete={onTaskComplete}
                onTaskDelete={onTaskDelete}
                onTaskStatusChange={onTaskStatusChange}
                onTaskView={onTaskView}
                onTaskEdit={onTaskEdit}
                onTaskDeleteConfirm={onTaskDeleteConfirm}
              />
              ))}
              {getTasksByType('rumor').length === 0 && (
                <div className="empty-state">
                  <p>No hay rumores disponibles</p>
                  <p className="drop-hint">Arrastra tareas aquí para convertirlas en rumores</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GuildBoard