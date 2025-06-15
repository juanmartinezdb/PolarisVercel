from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.calendar_service import CalendarService
from datetime import date

calendar_bp = Blueprint('calendar', __name__)

@calendar_bp.route('/date/<date_str>', methods=['GET'])
@jwt_required()
def get_calendar_data(date_str):
    """Obtiene todos los elementos para una fecha específica"""
    current_user_id = get_jwt_identity()
    
    try:
        target_date = date.fromisoformat(date_str)
        events = CalendarService.get_date_events(current_user_id, target_date)
        return jsonify(events)
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@calendar_bp.route('/month/<int:year>/<int:month>', methods=['GET'])
@jwt_required()
def get_month_data(year, month):
    """Obtiene datos del calendario para un mes completo"""
    current_user_id = get_jwt_identity()
    
    try:
        if month < 1 or month > 12:
            return jsonify({'error': 'Invalid month. Must be between 1 and 12'}), 400
        
        overview = CalendarService.get_month_overview(current_user_id, year, month)
        return jsonify(overview)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@calendar_bp.route('/week/<date_str>', methods=['GET'])
@jwt_required()
def get_week_data(date_str):
    """Obtiene datos del calendario para una semana (empezando en la fecha dada)"""
    current_user_id = get_jwt_identity()
    
    try:
        start_date = date.fromisoformat(date_str)
        week_data = CalendarService.get_week_overview(current_user_id, start_date)
        return jsonify(week_data)
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@calendar_bp.route('/today', methods=['GET'])
@jwt_required()
def get_today_calendar():
    """Obtiene eventos del calendario para hoy"""
    current_user_id = get_jwt_identity()
    
    try:
        today = date.today()
        events = CalendarService.get_date_events(current_user_id, today)
        return jsonify(events)
    except Exception as e:
        return jsonify({'error': str(e)}), 500