import React from 'react';
import { useDrop } from 'react-dnd';
import TaskItem from './TaskItem';
import './OpenQuestsSection.css';

const ITEM_TYPES = {
  TASK: 'task'
};

const OpenQuestsSection = ({ 
  date, 
  openQuests, 
  onTaskClick, 
  onTaskDrop, 
  onTaskComplete, 
  onTaskDelete,
  onTaskStatusChange,
  onTaskView,
  onTaskEdit,
  onTaskDeleteConfirm 
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPES.TASK,
    drop: (item) => {
      const newDateTime = {
        date: date.toISOString().split('T')[0],
        time: null 
      };
      onTaskDrop(item.id, newDateTime);
    },
    canDrop: (item) => {
      return ['open_quest', 'closed_quest', 'commission', 'rumor'].includes(item.task_type);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  const getSectionClassName = () => {
    let className = 'open-quests-section';
    if (isOver && canDrop) className += ' drop-target';
    if (canDrop) className += ' can-drop';
    return className;
  };

  return (
    <div ref={drop} className={getSectionClassName()}>
      <div className="quests-container">
        {openQuests.map(quest => (
          <TaskItem
            key={quest.id}
            task={quest}
            taskType="open_quest"
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
    </div>
  );
};

export default OpenQuestsSection;