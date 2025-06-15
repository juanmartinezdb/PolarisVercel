import React from 'react'
import { useDrop } from 'react-dnd'
import TaskItem from './TaskItem'
import './TimeSlot.css'

const ITEM_TYPES = {
  TASK: 'task'
}

const TimeSlot = ({
  date,
  hour,
  actualHour,
  tasks,
  raids,
  onTaskClick,
  onTaskDrop,
  onTaskComplete,
  onTaskDelete,
  onTaskStatusChange,
  onTaskView,
  onTaskEdit,
  onTaskDeleteConfirm,
  onTimeSlotClick, 
  dayOffset = 0 
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPES.TASK,
    drop: (item) => {
      const targetDate = new Date(date)
      if (dayOffset > 0) {
        targetDate.setDate(targetDate.getDate() + dayOffset)
      }
      
      const hourToUse = actualHour >= 24 ? actualHour - 24 : actualHour
      const newDateTime = {
        date: targetDate.toISOString().split('T')[0],
        time: `${hourToUse.toString().padStart(2, '0')}:00`
      }
      onTaskDrop(item.id, newDateTime)
    },
    canDrop: (item) => {
      return ['open_quest', 'closed_quest', 'commission', 'rumor'].includes(item.task_type)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  })

  const getSlotClassName = () => {
    let className = 'time-slot'
    if (isOver && canDrop) className += ' drop-target'
    if (canDrop) className += ' can-drop'
    if (tasks.length > 0 || raids.length > 0) className += ' has-content'
    return className
  }

  const handleSlotClick = (e) => {
    if (e.target === e.currentTarget && onTimeSlotClick) {
      const targetDate = new Date(date)
      if (dayOffset > 0) {
        targetDate.setDate(targetDate.getDate() + dayOffset)
      }
      
      let hourToUse = actualHour >= 24 ? actualHour - 24 : actualHour
      hourToUse = hourToUse - 2
      
      if (hourToUse < 0) {
        hourToUse = 24 + hourToUse 
        targetDate.setDate(targetDate.getDate() - 1)
      }
      
      const slotDateTime = {
        date: targetDate.toISOString().split('T')[0],
        time: `${hourToUse.toString().padStart(2, '0')}:00`
      }
      
      onTimeSlotClick(slotDateTime)
    }
  }

  return (
    <div ref={drop} className={getSlotClassName()} onClick={handleSlotClick}>
      {raids.map(raid => (
        <TaskItem
          key={`raid-${raid.id}`}
          task={raid}
          taskType="raid"
          isDraggable={false}
          onTaskClick={onTaskClick}
          onTaskComplete={onTaskComplete}
          onTaskDelete={onTaskDelete}
          onTaskStatusChange={onTaskStatusChange}
          onTaskView={onTaskView}
          onTaskEdit={onTaskEdit}
          onTaskDeleteConfirm={onTaskDeleteConfirm}
        />
      ))}
      
      {tasks.map(task => (
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
    </div>
  )
}

export default TimeSlot