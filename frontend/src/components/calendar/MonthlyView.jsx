import 'react';
import { useDrag, useDrop } from 'react-dnd';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import './MonthlyView.css';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const ITEM_TYPES = {
  TASK: 'task'
};

const MonthlyView = ({ 
  currentDate, 
  selectedDate,
  tasks = [], 
  dailies = [], 
  raids = [], 
  onDateClick,
  onTaskClick,
  onTaskDrop,
  onTaskTypeConversion,
  onTaskComplete,
  onTaskDelete,
  selectedCampaign 
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); 
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      if (task.task_type !== 'open_quest' && task.task_type !== 'closed_quest') return false;
      return isSameDay(new Date(task.due_date), date);
    });
  };

  const getDailiesForDate = (date) => {
    return dailies.filter(daily => daily.active);
  };

  const getRaidsForDate = (date) => {
    const dayOfWeek = format(date, 'EEEE').toLowerCase();
    return raids.filter(raid => 
      raid.active && 
      raid.schedule && 
      raid.schedule.some(schedule => schedule.day === dayOfWeek)
    );
  };

  const getEnergyIndicator = (items) => {
    if (items.length === 0) return null;
    
    const totalEnergy = items.reduce((sum, item) => sum + (item.energy_value || 0), 0);
    const positiveEnergy = items
      .filter(item => item.energy_type === 'positive')
      .reduce((sum, item) => sum + (item.energy_value || 0), 0);
    
    const percentage = totalEnergy > 0 ? (positiveEnergy / totalEnergy) * 100 : 50;
    
    if (percentage < 40) return 'negative';
    if (percentage > 60) return 'positive';
    return 'balanced';
  };

  const DraggableTaskItem = ({ task, onClick }) => {
    const [{ isDragging }, drag] = useDrag({
      type: ITEM_TYPES.TASK,
      item: { 
        id: task.id, 
        task_type: task.task_type,
        due_time: task.due_time,
        title: task.title,
        priority: task.priority,
        task: task
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const getTaskClassName = () => {
      let className = `monthly-item task-${task.task_type.replace('_', '-')} priority-${task.priority || 'medium'}`;
      if (isDragging) className += ' dragging';
      
      if (task.energy_value > 0) className += ' positive-energy';
      if (task.energy_value < 0) className += ' negative-energy';
      
      return className;
    };

    return (
      <div
        ref={drag}
        className={getTaskClassName()}
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick(task);
        }}
        title={task.title}
      >
        <div className="task-content">
          <span className="task-icon">{task.task_type === 'open_quest' ? '📜' : '⚔️'}</span>
          <span className="task-title">{task.title.length > 12 ? task.title.substring(0, 12) + '...' : task.title}</span>
        </div>
      </div>
    );
  };

  const DraggableDailyItem = ({ daily, onClick }) => {
    const [{ isDragging }, drag] = useDrag({
      type: ITEM_TYPES.TASK,
      item: { 
        id: daily.id, 
        task_type: 'daily',
        title: daily.title
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const getTaskClassName = () => {
      let className = 'monthly-item daily-item';
      if (isDragging) className += ' dragging';
      
      if (daily.energy_value > 0) className += ' positive-energy';
      if (daily.energy_value < 0) className += ' negative-energy';
      
      return className;
    };

    return (
      <div
        ref={drag}
        className={getTaskClassName()}
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick(daily);
        }}
        title={daily.title}
      >
        <div className="task-content">
          <span className="task-icon">📅</span>
          <span className="task-title">{daily.title.length > 12 ? daily.title.substring(0, 12) + '...' : daily.title}</span>
        </div>
      </div>
    );
  };

  const DraggableRaidItem = ({ raid, onClick }) => {
    const [{ isDragging }, drag] = useDrag({
      type: ITEM_TYPES.TASK,
      item: { 
        id: raid.id, 
        task_type: 'raid',
        title: raid.title
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const getTaskClassName = () => {
      let className = 'monthly-item raid-item';
      if (isDragging) className += ' dragging';
      
      if (raid.energy_value > 0) className += ' positive-energy';
      if (raid.energy_value < 0) className += ' negative-energy';
      
      return className;
    };

    return (
      <div
        ref={drag}
        className={getTaskClassName()}
        onClick={(e) => {
          e.stopPropagation();
          onClick && onClick(raid);
        }}
        title={raid.title}
      >
        <div className="task-content">
          <span className="task-icon">🏰</span>
          <span className="task-title">{raid.title.length > 12 ? raid.title.substring(0, 12) + '...' : raid.title}</span>
        </div>
      </div>
    );
  };

  const DayCell = ({ day }) => {
    const dayTasks = getTasksForDate(day);
    const dayDailies = getDailiesForDate(day);
    const dayRaids = getRaidsForDate(day);
    const allItems = [...dayTasks, ...dayDailies, ...dayRaids];
    const energyIndicator = getEnergyIndicator(allItems);
  
    const [{ isOver, canDrop }, drop] = useDrop({
      accept: ITEM_TYPES.TASK,
      drop: (item) => {
        if (onTaskDrop) {
          if (['commission', 'rumor'].includes(item.task_type)) {
            if (onTaskTypeConversion) {
              const newDateTime = {
                date: format(day, 'yyyy-MM-dd'),
                time: null 
              };
              onTaskTypeConversion(item.id, 'open_quest', newDateTime);
            }
          } else {
            const newDateTime = {
              date: format(day, 'yyyy-MM-dd'),
              time: item.due_time ? item.due_time.split(':').slice(0, 2).join(':') : null
            };
            onTaskDrop(item.id, newDateTime);
          }
        }
      },
      canDrop: (item) => {
        return ['open_quest', 'closed_quest', 'commission', 'rumor'].includes(item.task_type);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    });

    return (
      <div
        ref={drop}
        className={`monthly-day ${
          !isSameMonth(day, currentDate) ? 'other-month' : ''
        } ${isToday(day) ? 'today' : ''} ${
          allItems.length > 0 ? 'has-items' : ''
        } ${isOver && canDrop ? 'drop-target' : ''} ${
          canDrop ? 'can-drop' : ''
        }`}
        onClick={() => onDateClick && onDateClick(day)}
      >
        <div className="monthly-day-number">
          {format(day, 'd')}
        </div>
        
        {energyIndicator && (
          <div className={`energy-indicator energy-${energyIndicator}`} />
        )}
        
        <div className="monthly-day-items">
          {dayTasks.slice(0, 2).map(task => (
            <DraggableTaskItem
              key={task.id}
              task={task}
              onClick={onTaskClick}
            />
          ))}
          
          {dayDailies.slice(0, 1).map(daily => (
            <DraggableDailyItem
              key={daily.id}
              daily={daily}
              onClick={onTaskClick}
            />
          ))}
          
          {dayRaids.slice(0, 1).map(raid => (
            <DraggableRaidItem
              key={raid.id}
              raid={raid}
              onClick={onTaskClick}
            />
          ))}
          
          {allItems.length > 3 && (
            <div className="monthly-item-more">
              +{allItems.length - 3} más
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="monthly-view">
      <div className="monthly-header">
        {WEEKDAYS.map(day => (
          <div key={day} className="monthly-weekday">
            {day}
          </div>
        ))}
      </div>
      
      <div className="monthly-grid">
        {days.map(day => (
          <DayCell key={day.toISOString()} day={day} />
        ))}
      </div>
    </div>
  );
};

export default MonthlyView;