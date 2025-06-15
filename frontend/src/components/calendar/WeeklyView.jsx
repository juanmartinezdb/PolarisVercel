import React, { useState } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import TaskItem from './TaskItem'
import OpenQuestsSection from './OpenQuestsSection'
import TimeSlot from './TimeSlot'
import './WeeklyView.css'

const ITEM_TYPES = {
  TASK: 'task'
}

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']


const WeeklyView = ({
  currentDate,
  selectedDate,
  calendarData,
  scheduleStartHour,
  scheduleEndHour,
  onDateSelect,
  onTaskClick,
  onTaskDrop,
  onTaskTypeConversion,
  onTaskComplete,
  onTaskDelete,
  onTaskStatusChange,
  onTaskView,
  onTaskEdit,
  onTaskDeleteConfirm,
  onTimeSlotClick 
}) => {
  const [draggedTask, setDraggedTask] = useState(null)
  
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate)
    const dayOfWeek = startOfWeek.getDay()
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 
    startOfWeek.setDate(startOfWeek.getDate() - daysFromMonday)
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }
    return days
  }

  const getTimeSlots = () => {
    const slots = []
    for (let hour = 0; hour < 24; hour++) {
      const actualHour = (hour + scheduleStartHour) % 24
      const displayHour = actualHour
      const labelHour = (actualHour - 2 + 24) % 24
      
      slots.push({
        hour: displayHour,
        actualHour: actualHour,
        label: `${labelHour.toString().padStart(2, '0')}:00`,
        dayOffset: hour + scheduleStartHour >= 24 ? 1 : 0
      })
    }
    return slots
  }

  const getEffectiveDate = (baseDate, hour) => {
    const effectiveDate = new Date(baseDate)
    
    if (hour < scheduleStartHour) {
      effectiveDate.setDate(effectiveDate.getDate() - 1)
    }
    
    return effectiveDate
  }

  const getTasksForDateAndTime = (date, hour, dayOffset = 0) => {
    const filtered = calendarData.tasks.filter(task => {
      if (task.task_type !== 'closed_quest') return false
      if (!task.due_date || !task.due_time) return false
      
      const taskDate = new Date(task.due_date)
      const taskHour = parseInt(task.due_time.split(':')[0])
      
      const targetDate = new Date(date)
      if (dayOffset > 0) {
        targetDate.setDate(targetDate.getDate() + dayOffset)
      }
      
      const dateMatch = taskDate.toDateString() === targetDate.toDateString()
      const hourMatch = taskHour === hour
      
      return dateMatch && hourMatch
    })
    
    return filtered
  }

  const getOpenQuestsForDate = (date) => {
    return calendarData.tasks.filter(task => {
      if (task.task_type !== 'open_quest') return false
      if (!task.due_date || task.due_time) return false
      
      const taskDate = new Date(task.due_date)
      
      return taskDate.toDateString() === date.toDateString()
    })
  }

  const weekDays = getWeekDays()
  const timeSlots = getTimeSlots()

  return (
    <div className="weekly-view">
      <div className="weekly-header">
        <div className="time-column-header">Hora</div>
        {weekDays.map((day, index) => (
          <div 
            key={index} 
            className={`day-header ${selectedDate.toDateString() === day.toDateString() ? 'selected' : ''}`}
            onClick={() => onDateSelect(day)}
          >
            <div className="day-name">{DAYS_OF_WEEK[index]}</div>
            <div className="day-number">{day.getDate()}</div>
          </div>
        ))}
      </div>

      <div className="open-quests-row">
        <div className="time-column-header">Misiones Abiertas</div>
        {weekDays.map((day, dayIndex) => (
          <OpenQuestsSection
            key={dayIndex}
            date={day}
            openQuests={getOpenQuestsForDate(day)}
            onTaskClick={onTaskClick}
            onTaskDrop={onTaskDrop}
            onTaskTypeConversion={onTaskTypeConversion}
            onTaskComplete={onTaskComplete}
            onTaskDelete={onTaskDelete}
            onTaskStatusChange={onTaskStatusChange}
            onTaskView={onTaskView}
            onTaskEdit={onTaskEdit}
            onTaskDeleteConfirm={onTaskDeleteConfirm}
          />
        ))}
      </div>

      <div className="time-schedule">
        {timeSlots.map((slot) => (
          <div key={slot.actualHour} className="time-row">
            <div className="time-label">{slot.label}</div>
            {weekDays.map((day, dayIndex) => {
              return (
                <TimeSlot
                  key={`${dayIndex}-${slot.actualHour}`}
                  date={day}
                  hour={slot.displayHour}
                  actualHour={slot.actualHour}
                  dayOffset={slot.dayOffset} 
                  tasks={getTasksForDateAndTime(day, slot.actualHour, slot.dayOffset)}
                  raids={[]}
                  onTaskClick={onTaskClick}
                  onTaskDrop={onTaskDrop}
                  onTaskComplete={onTaskComplete}
                  onTaskDelete={onTaskDelete}
                  onTaskStatusChange={onTaskStatusChange}
                  onTaskView={onTaskView}
                  onTaskEdit={onTaskEdit}
                  onTaskDeleteConfirm={onTaskDeleteConfirm}
                  onTimeSlotClick={onTimeSlotClick} 
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default WeeklyView
