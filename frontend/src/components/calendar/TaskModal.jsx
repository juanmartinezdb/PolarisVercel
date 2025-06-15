import React, { useState, useEffect } from 'react';
import './TaskModal.css';

const TASK_TYPES = {
  OPEN_QUEST: 'Open Quest',
  CLOSED_QUEST: 'Closed Quest',
  COMMISSION: 'Commission',
  RUMOR: 'Rumor'
};

const ENERGY_TYPES = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative'
};

const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

const TaskModal = ({ 
  isOpen, 
  onClose, 
  task, 
  mode,
  onSave, 
  onDelete,
  campaigns = [] 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: TASK_TYPES.OPEN_QUEST,
    energy_value: 1,
    energy_type: ENERGY_TYPES.POSITIVE,
    priority: PRIORITY_LEVELS.MEDIUM,
    due_date: '',
    due_time: '',
    duration: 60,
    campaign_id: null
  });
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        type: task.type || TASK_TYPES.OPEN_QUEST,
        energy_value: task.energy_value || 1,
        energy_type: task.energy_type || ENERGY_TYPES.POSITIVE,
        priority: task.priority || PRIORITY_LEVELS.MEDIUM,
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        due_time: task.due_time || '',
        duration: task.duration || 60,
        campaign_id: task.campaign_id || null
      });
    } else if (mode === 'create' && isOpen) {
      setFormData({
        title: '',
        description: '',
        type: TASK_TYPES.OPEN_QUEST,
        energy_value: 1,
        energy_type: ENERGY_TYPES.POSITIVE,
        priority: PRIORITY_LEVELS.MEDIUM,
        due_date: '',
        due_time: '',
        duration: 60,
        campaign_id: campaigns.find(c => c.name === 'Story Mode')?.id || null
      });
    }
  }, [task, isOpen, mode, campaigns]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return;
    
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(task.id);
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isReadOnly = mode === 'view';
  const isEditing = mode === 'edit' || mode === 'create';

  if (!isOpen) return null;

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal" onClick={e => e.stopPropagation()}>
        <div className="task-modal-header">
          <h2 className="task-modal-title">
            {mode === 'create' ? 'Create New Quest' : 
             mode === 'edit' ? 'Edit Quest' : 'Quest Details'}
          </h2>
          <button className="task-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="task-modal-content">
          <div className="form-group">
            <label>Title</label>
            {isReadOnly ? (
              <div className="form-value">{formData.title}</div>
            ) : (
              <input
                type="text"
                value={formData.title}
                onChange={e => handleInputChange('title', e.target.value)}
                placeholder="Enter quest title..."
                className="form-input"
              />
            )}
          </div>

          <div className="form-group">
            <label>Description</label>
            {isReadOnly ? (
              <div className="form-value">{formData.description}</div>
            ) : (
              <textarea
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder="Enter quest description..."
                className="form-textarea"
                rows={3}
              />
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              {isReadOnly ? (
                <div className="form-value">{formData.type}</div>
              ) : (
                <select
                  value={formData.type}
                  onChange={e => handleInputChange('type', e.target.value)}
                  className="form-select"
                >
                  {Object.values(TASK_TYPES).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label>Campaign</label>
              {isReadOnly ? (
                <div className="form-value">
                  {campaigns.find(c => c.id === formData.campaign_id)?.name || 'Story Mode'}
                </div>
              ) : (
                <select
                  value={formData.campaign_id || ''}
                  onChange={e => handleInputChange('campaign_id', e.target.value || null)}
                  className="form-select"
                >
                  {campaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Energy Value</label>
              {isReadOnly ? (
                <div className="form-value">{formData.energy_value}</div>
              ) : (
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.energy_value}
                  onChange={e => handleInputChange('energy_value', parseInt(e.target.value))}
                  className="form-input"
                />
              )}
            </div>

            <div className="form-group">
              <label>Energy Type</label>
              {isReadOnly ? (
                <div className={`form-value energy-${formData.energy_type}`}>
                  {formData.energy_type === ENERGY_TYPES.POSITIVE ? 'Positive' : 'Negative'}
                </div>
              ) : (
                <select
                  value={formData.energy_type}
                  onChange={e => handleInputChange('energy_type', e.target.value)}
                  className="form-select"
                >
                  <option value={ENERGY_TYPES.POSITIVE}>Positive</option>
                  <option value={ENERGY_TYPES.NEGATIVE}>Negative</option>
                </select>
              )}
            </div>

            <div className="form-group">
              <label>Priority</label>
              {isReadOnly ? (
                <div className={`form-value priority-${formData.priority}`}>
                  {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                </div>
              ) : (
                <select
                  value={formData.priority}
                  onChange={e => handleInputChange('priority', e.target.value)}
                  className="form-select"
                >
                  {Object.values(PRIORITY_LEVELS).map(priority => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {(formData.type === TASK_TYPES.CLOSED_QUEST || formData.type === TASK_TYPES.OPEN_QUEST) && (
            <div className="form-row">
              <div className="form-group">
                <label>Due Date</label>
                {isReadOnly ? (
                  <div className="form-value">{formData.due_date || 'Not set'}</div>
                ) : (
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={e => handleInputChange('due_date', e.target.value)}
                    className="form-input"
                  />
                )}
              </div>

              {formData.type === TASK_TYPES.CLOSED_QUEST && (
                <>
                  <div className="form-group">
                    <label>Time</label>
                    {isReadOnly ? (
                      <div className="form-value">{formData.due_time || 'Not set'}</div>
                    ) : (
                      <input
                        type="time"
                        value={formData.due_time}
                        onChange={e => handleInputChange('due_time', e.target.value)}
                        className="form-input"
                      />
                    )}
                  </div>

                  <div className="form-group">
                    <label>Duration (minutes)</label>
                    {isReadOnly ? (
                      <div className="form-value">{formData.duration}</div>
                    ) : (
                      <input
                        type="number"
                        min="15"
                        step="15"
                        value={formData.duration}
                        onChange={e => handleInputChange('duration', parseInt(e.target.value))}
                        className="form-input"
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="task-modal-footer">
          {isEditing && (
            <>
              <button 
                className="btn btn-primary"
                onClick={handleSave}
                disabled={isLoading || !formData.title.trim()}
              >
                {isLoading ? 'Saving...' : (mode === 'create' ? 'Create Quest' : 'Save Changes')}
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
            </>
          )}
          
          {mode === 'view' && (
            <>
              <button className="btn btn-primary" onClick={() => mode = 'edit'}>
                Edit Quest
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Quest
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-modal">
              <h3>Confirm Deletion</h3>
              <p>Are you sure you want to delete this quest? This action cannot be undone.</p>
              <div className="delete-confirm-buttons">
                <button 
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskModal;