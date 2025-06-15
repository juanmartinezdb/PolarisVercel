from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.dashboard_service import DashboardService
from app.services.balance_service import BalanceService
from app.models.user import User

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/today', methods=['GET'])
@jwt_required()
def get_today_dashboard():
    """Obtiene todos los datos necesarios para el dashboard de hoy"""
    current_user_id = get_jwt_identity()
    
    try:
        summary = DashboardService.get_today_summary(current_user_id)
        
        energy_balance = {
            'percentage': BalanceService.calculate_energy_balance(current_user_id),
            'state': None,
            'color': None
        }
        energy_balance['state'] = BalanceService.get_balance_state(energy_balance['percentage'])
        energy_balance['color'] = BalanceService.get_balance_color(energy_balance['percentage'])
        
        user = User.query.get(current_user_id)
        user_info = {
            'level': user.get_level(),
            'current_xp': user.total_xp,
            'xp_for_next_level': user.get_xp_for_next_level(),
            'xp_progress': user.get_xp_progress()
        }
        
        return jsonify({
            'summary': summary,
            'energy_balance': energy_balance,
            'user_info': user_info
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/recent-activity', methods=['GET'])
@jwt_required()
def get_recent_activity():
    """Obtiene actividad reciente"""
    current_user_id = get_jwt_identity()
    days = request.args.get('days', 7, type=int)
    
    try:
        activities = DashboardService.get_recent_activity(current_user_id, days)
        return jsonify(activities)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/rescue-missions', methods=['GET'])
@jwt_required()
def get_rescue_missions():
    """Obtiene tareas vencidas que necesitan atención urgente"""
    current_user_id = get_jwt_identity()
    
    try:
        from datetime import date
        from app.models.task import Task, TaskStatus
        
        overdue_tasks = Task.query.filter(
            Task.user_id == current_user_id,
            Task.due_date < date.today(),
            Task.status != TaskStatus.COMPLETED
        ).order_by(Task.due_date.asc()).all()
        
        return jsonify([task.to_dict() for task in overdue_tasks])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500