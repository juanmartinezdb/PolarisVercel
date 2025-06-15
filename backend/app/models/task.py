from app import db
from datetime import datetime
from enum import Enum

class TaskType(Enum):
    OPEN_QUEST = 'open_quest'
    CLOSED_QUEST = 'closed_quest'
    COMMISSION = 'commission'
    RUMOR = 'rumor'

class TaskStatus(Enum):
    PENDING = 'pending'
    COMPLETED = 'completed'
    SKIPPED = 'skipped'

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    task_type = db.Column(db.Enum(TaskType), nullable=False)
    status = db.Column(db.Enum(TaskStatus), default=TaskStatus.PENDING)
    energy_value = db.Column(db.Integer, nullable=False)  
    
    due_date = db.Column(db.Date)  
    due_time = db.Column(db.Time) 
    estimated_duration = db.Column(db.Integer)  
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    def complete(self):
        self.status = TaskStatus.COMPLETED
        self.completed_at = datetime.utcnow()
        self.user.add_xp(abs(self.energy_value))
        db.session.commit()
    
    def to_dict(self):
        due_datetime = None
        if self.due_date and self.due_time:
            due_datetime = datetime.combine(self.due_date, self.due_time).isoformat()
        elif self.due_date:
            due_datetime = self.due_date.isoformat()
            
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'task_type': self.task_type.value,
            'status': self.status.value,
            'energy_value': self.energy_value,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'due_time': self.due_time.isoformat() if self.due_time else None,
            'due_datetime': due_datetime,
            'due_date_only': self.due_date.isoformat() if self.due_date else None,
            'estimated_duration': self.estimated_duration,
            'user_id': self.user_id,
            'campaign_id': self.campaign_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }