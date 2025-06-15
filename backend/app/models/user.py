from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import math

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar_url = db.Column(db.String(255))
    total_xp = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    campaigns = db.relationship('Campaign', backref='user', lazy=True, cascade='all, delete-orphan')
    tasks = db.relationship('Task', backref='user', lazy=True, cascade='all, delete-orphan')
    dailies = db.relationship('Daily', backref='user', lazy=True, cascade='all, delete-orphan')
    raids = db.relationship('Raid', backref='user', lazy=True, cascade='all, delete-orphan')
    logbook_entries = db.relationship('LogbookEntry', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    @property
    def level(self):
        if self.total_xp == 0:
            return 1
        return int(math.log2(self.total_xp / 100 + 1)) + 1
    
    @property
    def xp_for_current_level(self):
        current_level = self.level
        return 100 * (2 ** (current_level - 1) - 1)
    
    @property
    def xp_for_next_level(self):
        current_level = self.level
        return 100 * (2 ** current_level - 1)
    
    @property
    def xp_progress(self):
        current_level_xp = self.xp_for_current_level
        next_level_xp = self.xp_for_next_level
        progress_xp = self.total_xp - current_level_xp
        level_xp_range = next_level_xp - current_level_xp
        return (progress_xp / level_xp_range) * 100 if level_xp_range > 0 else 0
    
    def add_xp(self, xp_amount):
        self.total_xp += xp_amount
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'avatar_url': self.avatar_url,
            'total_xp': self.total_xp,
            'level': self.level,
            'xp_progress': self.xp_progress,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }