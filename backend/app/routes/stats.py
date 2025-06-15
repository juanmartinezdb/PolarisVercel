from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.stats_service import StatsService
from app.models.user import User

stats_bp = Blueprint('stats', __name__)

@stats_bp.route('/xp-progress', methods=['GET'])
@jwt_required()
def get_xp_progress():
    """Progreso de XP y nivel actual"""
    current_user_id = get_jwt_identity()
    
    try:
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'current_level': user.get_level(),
            'total_xp': user.total_xp,
            'xp_for_current_level': user.get_xp_for_level(user.get_level()),
            'xp_for_next_level': user.get_xp_for_next_level(),
            'xp_progress_percentage': user.get_xp_progress(),
            'xp_needed_for_next': user.get_xp_for_next_level() - user.total_xp
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@stats_bp.route('/completion-streaks', methods=['GET'])
@jwt_required()
def get_completion_streaks():
    """Rachas de completación para dailies"""
    current_user_id = get_jwt_identity()
    
    try:
        streaks = StatsService.calculate_daily_streaks(current_user_id)
        return jsonify(streaks)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@stats_bp.route('/weekly-summary', methods=['GET'])
@jwt_required()
def get_weekly_summary():
    """Resumen semanal de actividad"""
    current_user_id = get_jwt_identity()
    weeks_back = request.args.get('weeks', 4, type=int)
    
    try:
        summary = StatsService.get_weekly_summary(current_user_id, weeks_back)
        return jsonify(summary)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@stats_bp.route('/completion-rate', methods=['GET'])
@jwt_required()
def get_completion_rate():
    """Tasa de completación de los últimos N días"""
    current_user_id = get_jwt_identity()
    days = request.args.get('days', 30, type=int)
    
    try:
        rate = StatsService.get_completion_rate(current_user_id, days)
        return jsonify(rate)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@stats_bp.route('/overview', methods=['GET'])
@jwt_required()
def get_stats_overview():
    """Vista general de estadísticas"""
    current_user_id = get_jwt_identity()
    
    try:
        user = User.query.get(current_user_id)
        streaks = StatsService.calculate_daily_streaks(current_user_id)
        completion_rate = StatsService.get_completion_rate(current_user_id, 30)
        weekly_summary = StatsService.get_weekly_summary(current_user_id, 4)
        
        return jsonify({
            'user_progress': {
                'level': user.get_level(),
                'total_xp': user.total_xp,
                'xp_progress': user.get_xp_progress()
            },
            'streaks': streaks,
            'completion_rate': completion_rate,
            'weekly_summary': weekly_summary
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500