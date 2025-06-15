from datetime import date, timedelta
from app.models.task import Task, TaskStatus
from app.models.daily import Daily, DailyCompletion, DailyStatus
from app.models.raid import Raid, RaidCompletion, RaidStatus
from app.models.user import User
from app import db
from sqlalchemy import func, and_

class StatsService:
    @staticmethod
    def calculate_daily_streaks(user_id):
        """Calcula rachas de dailies completados"""
        today = date.today()
        
        dailies = Daily.query.filter_by(user_id=user_id, is_active=True).all()
        
        streaks = []
        
        for daily in dailies:
            current_streak = 0
            longest_streak = 0
            check_date = today
            
            while True:
                completion = DailyCompletion.query.filter_by(
                    daily_id=daily.id,
                    completion_date=check_date,
                    status=DailyStatus.COMPLETED
                ).first()
                
                if completion:
                    current_streak += 1
                    longest_streak = max(longest_streak, current_streak)
                else:
                    break
                
                check_date -= timedelta(days=1)
                
                if (today - check_date).days > 365:
                    break
            
            all_completions = DailyCompletion.query.filter_by(
                daily_id=daily.id,
                status=DailyStatus.COMPLETED
            ).order_by(DailyCompletion.completion_date).all()
            
            if all_completions:
                temp_streak = 1
                max_historical_streak = 1
                
                for i in range(1, len(all_completions)):
                    prev_date = all_completions[i-1].completion_date
                    curr_date = all_completions[i].completion_date
                    
                    if (curr_date - prev_date).days == 1:
                        temp_streak += 1
                        max_historical_streak = max(max_historical_streak, temp_streak)
                    else:
                        temp_streak = 1
                
                longest_streak = max(longest_streak, max_historical_streak)
            
            streaks.append({
                'daily_id': daily.id,
                'daily_title': daily.title,
                'current_streak': current_streak,
                'longest_streak': longest_streak
            })
        
        return streaks
    
    @staticmethod
    def get_weekly_summary(user_id, weeks_back=4):
        """Resumen semanal de actividad"""
        today = date.today()
        start_date = today - timedelta(weeks=weeks_back)
        
        weekly_data = []
        
        for week in range(weeks_back):
            week_start = today - timedelta(weeks=week+1)
            week_end = today - timedelta(weeks=week)
            
            completed_tasks = Task.query.filter(
                Task.user_id == user_id,
                Task.status == TaskStatus.COMPLETED,
                Task.completed_at >= week_start,
                Task.completed_at < week_end
            ).count()
            
            completed_dailies = db.session.query(DailyCompletion).join(
                Daily, DailyCompletion.daily_id == Daily.id
            ).filter(
                Daily.user_id == user_id,
                DailyCompletion.status == DailyStatus.COMPLETED,
                DailyCompletion.completion_date >= week_start,
                DailyCompletion.completion_date < week_end
            ).count()
            
            completed_raids = db.session.query(RaidCompletion).join(
                Raid, RaidCompletion.raid_id == Raid.id
            ).filter(
                Raid.user_id == user_id,
                RaidCompletion.status == RaidStatus.COMPLETED,
                RaidCompletion.completion_date >= week_start,
                RaidCompletion.completion_date < week_end
            ).count()
            
            weekly_data.append({
                'week_start': week_start.isoformat(),
                'week_end': week_end.isoformat(),
                'completed_tasks': completed_tasks,
                'completed_dailies': completed_dailies,
                'completed_raids': completed_raids,
                'total_completions': completed_tasks + completed_dailies + completed_raids
            })
        
        return weekly_data
    
    @staticmethod
    def get_completion_rate(user_id, days=30):
        """Calcula tasa de completación de los últimos N días"""
        end_date = date.today()
        start_date = end_date - timedelta(days=days)
        
        total_tasks = Task.query.filter(
            Task.user_id == user_id,
            Task.created_at >= start_date,
            Task.created_at <= end_date
        ).count()
        
        completed_tasks = Task.query.filter(
            Task.user_id == user_id,
            Task.status == TaskStatus.COMPLETED,
            Task.created_at >= start_date,
            Task.created_at <= end_date
        ).count()
        
        active_dailies = Daily.query.filter_by(user_id=user_id, is_active=True).count()
        possible_daily_completions = active_dailies * days
        
        actual_daily_completions = db.session.query(DailyCompletion).join(
            Daily, DailyCompletion.daily_id == Daily.id
        ).filter(
            Daily.user_id == user_id,
            DailyCompletion.status == DailyStatus.COMPLETED,
            DailyCompletion.completion_date >= start_date,
            DailyCompletion.completion_date <= end_date
        ).count()
        
        return {
            'period_days': days,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'tasks': {
                'total': total_tasks,
                'completed': completed_tasks,
                'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            },
            'dailies': {
                'possible_completions': possible_daily_completions,
                'actual_completions': actual_daily_completions,
                'completion_rate': (actual_daily_completions / possible_daily_completions * 100) if possible_daily_completions > 0 else 0
            }
        }