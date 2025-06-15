from app import db
from datetime import datetime, date
from enum import Enum

class DailyStatus(Enum):
    PENDING = 'pending'
    COMPLETED = 'completed'
    SKIPPED = 'skipped'

class Daily(db.Model):
    __tablename__ = 'dailies'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    energy_value = db.Column(db.Integer, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    completions = db.relationship('DailyCompletion', backref='daily', lazy=True, cascade='all, delete-orphan')
    
    def get_status_for_date(self, target_date=None):
        if target_date is None:
            target_date = date.today()
        
        completion = DailyCompletion.query.filter_by(
            daily_id=self.id,
            completion_date=target_date
        ).first()
        
        return completion.status if completion else DailyStatus.PENDING
    
    def complete_for_date(self, target_date=None):
        if target_date is None:
            target_date = date.today()
        
        completion = DailyCompletion.query.filter_by(
            daily_id=self.id,
            completion_date=target_date
        ).first()
        
        if not completion:
            completion = DailyCompletion(
                daily_id=self.id,
                completion_date=target_date,
                status=DailyStatus.COMPLETED
            )
            db.session.add(completion)
        else:
            completion.status = DailyStatus.COMPLETED
        
        
        self.user.add_xp(abs(self.energy_value))
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'energy_value': self.energy_value,
            'is_active': self.is_active,
            'user_id': self.user_id,
            'campaign_id': self.campaign_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class DailyCompletion(db.Model):
    __tablename__ = 'daily_completions'
    
    id = db.Column(db.Integer, primary_key=True)
    daily_id = db.Column(db.Integer, db.ForeignKey('dailies.id'), nullable=False)
    completion_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum(DailyStatus), nullable=False)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('daily_id', 'completion_date'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'daily_id': self.daily_id,
            'completion_date': self.completion_date.isoformat(),
            'status': self.status.value,
            'completed_at': self.completed_at.isoformat()
        }