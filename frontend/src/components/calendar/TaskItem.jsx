import React, { useState, useEffect } from 'react'
import { useDrag } from 'react-dnd'
import { campaignService } from '../../services/campaignService'
import TaskContextMenu from './TaskContextMenu'
import './TaskItem.css'

const ITEM_TYPES = {
  TASK: 'task'
}

const TASK_TYPE_ICONS = {
  open_quest: '📋',
  closed_quest: '⏰',
  commission: '💼',
  rumor: '💭',
  daily: '🔄',
  raid: '⚔️'
}

const TaskItem = ({
  task,
  taskType,
  isDraggable = true,
  onTaskClick,
  onTaskComplete,
  onTaskDelete,
  onTaskStatusChange,
  onTaskEdit,
  onTaskView
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [campaign, setCampaign] = useState(null)

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!task.campaign_id) return;
      
      try {
        const campaigns = await campaignService.getCampaigns();
        const taskCampaign = campaigns.find(c => c.id === task.campaign_id);
        setCampaign(taskCampaign);
      } catch (error) {
        console.error('Error fetching campaign:', error);
      }
    };

    fetchCampaign();
  }, [task.campaign_id]);

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPES.TASK,
    item: { id: task.id, task_type: taskType, task },
    canDrag: isDraggable,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  const handleClick = (e) => {
    e.preventDefault()
    onTaskClick(task, 'view')
  }

  const handleRightClick = (e) => {
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
    setShowContextMenu(true)
  }

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    })
    setShowTooltip(true)
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  const handleContextMenuAction = (action) => {
    setShowContextMenu(false)
    
    switch (action) {
      case 'complete':
        if (onTaskStatusChange) {
          onTaskStatusChange(task.id, 'completed')
        } else if (onTaskComplete) {
          onTaskComplete(task.id, taskType)
        }
        break
      case 'skip':
        if (onTaskStatusChange) {
          onTaskStatusChange(task.id, 'skipped')
        }
        break
      case 'restore':
        if (onTaskStatusChange) {
          onTaskStatusChange(task.id, 'pending')
        }
        break
      case 'view':
        if (onTaskView) {
          onTaskView(task)
        } else if (onTaskClick) {
          onTaskClick(task, 'view')
        }
        break
      case 'edit':
        if (onTaskEdit) {
          onTaskEdit(task)
        } else if (onTaskClick) {
          onTaskClick(task, 'edit')
        }
        break
      case 'delete':
        if (onTaskDelete) {
          onTaskDelete(task.id, taskType)
        }
        break
    }
  }

  const getTaskClassName = () => {
    let className = `task-item task-${taskType}`
    if (isDragging) className += ' dragging'
    if (task.status === 'completed') className += ' completed'
    if (task.status === 'skipped') className += ' skipped'
    
    if (task.energy_value > 0) className += ' positive-energy'
    if (task.energy_value < 0) className += ' negative-energy'
    
    if (campaign?.color) {
      className += ' has-campaign'
    }
    
    return className
  }

  return (
    <>
      <div
        ref={isDraggable ? drag : null}
        className={getTaskClassName()}
        onClick={handleClick}
        onContextMenu={handleRightClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={campaign?.color ? { '--campaign-color': campaign.color } : {}}
      >
        <div className="task-content">
          <div className="task-title">{task.title}</div>
        </div>
        {task.priority && task.priority > 1 && (
          <div className="task-priority">
            {'★'.repeat(task.priority)}
          </div>
        )}
      </div>

      {showContextMenu && (
        <TaskContextMenu
          position={contextMenuPosition}
          task={task}
          taskType={taskType}
          onAction={handleContextMenuAction}
          onClose={() => setShowContextMenu(false)}
        />
      )}

      {showTooltip && (
        <div 
          className="task-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateX(-50%) translateY(-100%)',
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          {task.title}
        </div>
      )}
    </>
  )
}

export default TaskItem