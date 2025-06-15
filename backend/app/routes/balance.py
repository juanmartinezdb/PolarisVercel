from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.balance_service import BalanceService

balance_bp = Blueprint('balance', __name__)

@balance_bp.route('/energy', methods=['GET'])
@jwt_required()
def get_energy_balance():
    current_user_id = get_jwt_identity()
    
    percentage = BalanceService.calculate_energy_balance(current_user_id)
    state = BalanceService.get_balance_state(percentage)
    color = BalanceService.get_balance_color(percentage)
    
    return jsonify({
        'percentage': percentage,
        'state': state,
        'color': color
    })