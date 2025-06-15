from datetime import date, timedelta
from calendar import monthrange
from app.models.task import Task, TaskStatus
from app.models.logbook import LogbookEntry
from app import db
from sqlalchemy import and_, extract

class CalendarService:
    @staticmethod
    def get_date_events(user_id, target_date):
        """Obtiene eventos para una fecha específica (solo tareas y logbook)"""
        if isinstance(target_date, str):
            target_date = date.fromisoformat(target_date)
        
        tasks = Task.query.filter(
            Task.user_id == user_id,
            Task.due_date == target_date
        ).order_by(Task.due_time.asc().nullslast()).all()
        
        logbook_entry = LogbookEntry.query.filter_by(
            user_id=user_id,
            entry_date=target_date
        ).first()
        
        return {
            'date': target_date.isoformat(),
            'tasks': [task.to_dict() for task in tasks],
            'logbook_entry': logbook_entry.to_dict() if logbook_entry else None,
            'has_events': len(tasks) > 0 or logbook_entry is not None
        }
    
    @staticmethod
    def get_month_overview(user_id, year, month):
        """Vista general del mes con días que tienen eventos"""
        first_day = date(year, month, 1)
        last_day_num = monthrange(year, month)[1]
        last_day = date(year, month, last_day_num)
        
        tasks = Task.query.filter(
            Task.user_id == user_id,
            Task.due_date >= first_day,
            Task.due_date <= last_day
        ).all()
        
        logbook_entries = LogbookEntry.query.filter(
            LogbookEntry.user_id == user_id,
            LogbookEntry.entry_date >= first_day,
            LogbookEntry.entry_date <= last_day
        ).all()
        
        days_with_events = {}
        
        for task in tasks:
            day_key = task.due_date.isoformat()
            if day_key not in days_with_events:
                days_with_events[day_key] = {
                    'date': day_key,
                    'tasks_count': 0,
                    'completed_tasks_count': 0,
                    'has_logbook': False,
                    'task_types': set()
                }
            
            days_with_events[day_key]['tasks_count'] += 1
            days_with_events[day_key]['task_types'].add(task.task_type.value)
            
            if task.status == TaskStatus.COMPLETED:
                days_with_events[day_key]['completed_tasks_count'] += 1
        
        for entry in logbook_entries:
            day_key = entry.entry_date.isoformat()
            if day_key not in days_with_events:
                days_with_events[day_key] = {
                    'date': day_key,
                    'tasks_count': 0,
                    'completed_tasks_count': 0,
                    'has_logbook': False,
                    'task_types': set()
                }
            
            days_with_events[day_key]['has_logbook'] = True
        
        for day_data in days_with_events.values():
            day_data['task_types'] = list(day_data['task_types'])
        
        return {
            'year': year,
            'month': month,
            'days_with_events': days_with_events,
            'total_days_with_events': len(days_with_events)
        }
    
    @staticmethod
    def get_week_overview(user_id, start_date):
        """Vista general de la semana"""
        if isinstance(start_date, str):
            start_date = date.fromisoformat(start_date)
        
        end_date = start_date + timedelta(days=6)
        
        week_data = []
        current_date = start_date
        
        while current_date <= end_date:
            day_events = CalendarService.get_date_events(user_id, current_date)
            week_data.append(day_events)
            current_date += timedelta(days=1)
        
        return {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'days': week_data
        }