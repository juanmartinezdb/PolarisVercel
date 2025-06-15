from datetime import datetime, timedelta
from app.models.task import Task, TaskStatus
from app.models.daily import Daily, DailyCompletion, DailyStatus
from app.models.raid import Raid, RaidCompletion, RaidStatus
from app import db

class BalanceService:
    @staticmethod
    def calculate_energy_balance(user_id, days=7):
        """Calculate energy balance percentage for the last N days"""
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=days)
        
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        total_positive_energy = 0
        total_energy = 0
        
        completed_tasks = Task.query.filter(
            Task.user_id == user_id,
            Task.status == TaskStatus.COMPLETED,
            Task.completed_at >= start_datetime, 
            Task.completed_at <= end_datetime    
        ).all()
        
        for task in completed_tasks:
            energy = abs(task.energy_value)
            total_energy += energy
            if task.energy_value > 0:
                total_positive_energy += energy
        
        daily_completions = db.session.query(DailyCompletion, Daily).join(
            Daily, DailyCompletion.daily_id == Daily.id
        ).filter(
            Daily.user_id == user_id,
            DailyCompletion.status == DailyStatus.COMPLETED,
            DailyCompletion.completion_date >= start_date,
            DailyCompletion.completion_date <= end_date
        ).all()
        
        for completion, daily in daily_completions:
            energy = abs(daily.energy_value)
            total_energy += energy
            if daily.energy_value > 0:
                total_positive_energy += energy
        
        raid_completions = db.session.query(RaidCompletion, Raid).join(
            Raid, RaidCompletion.raid_id == Raid.id
        ).filter(
            Raid.user_id == user_id,
            RaidCompletion.status == RaidStatus.COMPLETED,
            RaidCompletion.completion_date >= start_date,
            RaidCompletion.completion_date <= end_date
        ).all()
        
        for completion, raid in raid_completions:
            energy = abs(raid.energy_value)
            total_energy += energy
            if raid.energy_value > 0:
                total_positive_energy += energy
        
        if total_energy == 0:
            return 50  
        
        balance_percentage = (total_positive_energy / total_energy) * 100
        return round(balance_percentage, 1)
    
    @staticmethod
    def get_balance_state(balance_percentage):
        """Get the balance state based on percentage"""
        if balance_percentage < 40:
            return 'burnout'
        elif balance_percentage > 60:
            return 'procrastination'
        else:
            return 'equilibrium'
    
    @staticmethod
    def get_balance_color(balance_percentage):
        """Get the color for the balance bar"""
        state = BalanceService.get_balance_state(balance_percentage)
        colors = {
            'burnout': '#EF4444',      
            'procrastination': '#6B7280',  
            'equilibrium': '#10B981'    
        }
        return colors[state]