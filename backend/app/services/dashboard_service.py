from datetime import date, timedelta
from app.models.task import Task, TaskStatus
from app.models.daily import Daily, DailyCompletion, DailyStatus
from app.models.raid import Raid, RaidCompletion, RaidStatus
from app.models.logbook import LogbookEntry
from app.models.user import User
from app import db
from sqlalchemy import and_

class DashboardService:
    @staticmethod
    def get_today_summary(user_id):
        """Consolida todos los datos necesarios para el dashboard de hoy"""
        today = date.today()
        
        dailies = Daily.query.filter_by(user_id=user_id, is_active=True).all()
        dailies_data = []
        for daily in dailies:
            daily_dict = daily.to_dict()
            daily_dict['today_status'] = daily.get_status_for_date(today).value
            dailies_data.append(daily_dict)
        
        today_weekday = today.weekday()  
        raids = Raid.query.filter_by(
            user_id=user_id, 
            is_active=True, 
            day_of_week=today_weekday
        ).order_by(Raid.start_time).all()
        
        raids_data = []
        for raid in raids:
            raid_dict = raid.to_dict()
            completion = RaidCompletion.query.filter_by(
                raid_id=raid.id,
                completion_date=today
            ).first()
            raid_dict['today_status'] = completion.status.value if completion else 'pending'
            raids_data.append(raid_dict)
        
        due_today_tasks = Task.query.filter(
            Task.user_id == user_id,
            Task.due_date == today,
            Task.status != TaskStatus.COMPLETED
        ).all()
        
        overdue_tasks = Task.query.filter(
            Task.user_id == user_id,
            Task.due_date < today,
            Task.status != TaskStatus.COMPLETED
        ).all()
        
        today_logbook = LogbookEntry.query.filter_by(
            user_id=user_id,
            entry_date=today
        ).first()
        
        return {
            'date': today.isoformat(),
            'dailies': dailies_data,
            'raids': raids_data,
            'due_today_tasks': [task.to_dict() for task in due_today_tasks],
            'overdue_tasks': [task.to_dict() for task in overdue_tasks],
            'today_logbook': today_logbook.to_dict() if today_logbook else None
        }
    
    @staticmethod
    def get_recent_activity(user_id, days=7):
        """Obtiene actividad reciente de los últimos N días"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        activities = []
        
        completed_tasks = Task.query.filter(
            Task.user_id == user_id,
            Task.status == TaskStatus.COMPLETED,
            Task.completed_at >= start_date,
            Task.completed_at <= end_date
        ).order_by(Task.completed_at.desc()).limit(10).all()
        
        for task in completed_tasks:
            activities.append({
                'type': 'task_completed',
                'title': task.title,
                'date': task.completed_at.isoformat(),
                'energy_value': task.energy_value,
                'task_type': task.task_type.value
            })
        
        daily_completions = db.session.query(DailyCompletion, Daily).join(
            Daily, DailyCompletion.daily_id == Daily.id
        ).filter(
            Daily.user_id == user_id,
            DailyCompletion.status == DailyStatus.COMPLETED,
            DailyCompletion.completion_date >= start_date,
            DailyCompletion.completion_date <= end_date
        ).order_by(DailyCompletion.completion_date.desc()).limit(10).all()
        
        for completion, daily in daily_completions:
            activities.append({
                'type': 'daily_completed',
                'title': daily.title,
                'date': completion.completion_date.isoformat(),
                'energy_value': daily.energy_value
            })
        
        raid_completions = db.session.query(RaidCompletion, Raid).join(
            Raid, RaidCompletion.raid_id == Raid.id
        ).filter(
            Raid.user_id == user_id,
            RaidCompletion.status == RaidStatus.COMPLETED,
            RaidCompletion.completion_date >= start_date,
            RaidCompletion.completion_date <= end_date
        ).order_by(RaidCompletion.completion_date.desc()).limit(10).all()
        
        for completion, raid in raid_completions:
            activities.append({
                'type': 'raid_completed',
                'title': raid.title,
                'date': completion.completion_date.isoformat(),
                'energy_value': raid.energy_value,
                'difficulty': raid.difficulty.value
            })
        
        activities.sort(key=lambda x: x['date'], reverse=True)
        
        return activities[:20] 