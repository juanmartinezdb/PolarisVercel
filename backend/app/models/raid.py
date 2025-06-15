from app import db
from datetime import datetime, time
from enum import Enum

class RaidStatus(Enum):
    PENDING = 'pending'
    COMPLETED = 'completed'
    SKIPPED = 'skipped'

class RaidDifficulty(Enum):
    EASY = 'easy'
    NORMAL = 'normal'
    HARD = 'hard'

class Raid(db.Model):
    __tablename__ = 'raids'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    energy_value = db.Column(db.Integer, nullable=False)
    difficulty = db.Column(db.Enum(RaidDifficulty), default=RaidDifficulty.NORMAL, nullable=False)

    day_of_week = db.Column(db.Integer, nullable=False)  
    start_time = db.Column(db.Time, nullable=False)
    duration = db.Column(db.Integer, nullable=False) 
    
    is_active = db.Column(db.Boolean, default=True)
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    completions = db.relationship('RaidCompletion', backref='raid', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'energy_value': self.energy_value,
            'difficulty': self.difficulty.value,
            'day_of_week': self.day_of_week,
            'start_time': self.start_time.isoformat(),
            'duration': self.duration,
            'is_active': self.is_active,
            'user_id': self.user_id,
            'campaign_id': self.campaign_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class RaidCompletion(db.Model):
    __tablename__ = 'raid_completions'
    
    id = db.Column(db.Integer, primary_key=True)
    raid_id = db.Column(db.Integer, db.ForeignKey('raids.id'), nullable=False)
    completion_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum(RaidStatus), nullable=False)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('raid_id', 'completion_date'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'raid_id': self.raid_id,
            'completion_date': self.completion_date.isoformat(),
            'status': self.status.value,
            'completed_at': self.completed_at.isoformat()
        }