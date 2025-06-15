from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.daily import Daily, DailyCompletion, DailyStatus
from datetime import date

dailies_bp = Blueprint('dailies', __name__)

@dailies_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_dailies():
    current_user_id = get_jwt_identity()
    campaign_id = request.args.get('campaign_id')
    
    query = Daily.query.filter_by(user_id=current_user_id)
    
    if campaign_id:
        query = query.filter_by(campaign_id=campaign_id)
    
    dailies = query.all()
    
    today = date.today()
    result = []
    for daily in dailies:
        daily_dict = daily.to_dict()
        daily_dict['today_status'] = daily.get_status_for_date(today).value
        result.append(daily_dict)
    
    return jsonify(result)

@dailies_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def create_daily():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    daily = Daily(
        title=data['title'],
        description=data.get('description'),
        energy_value=data['energy_value'],
        user_id=current_user_id,
        campaign_id=data['campaign_id'],
        is_active=data.get('is_active', True) 
    )
    
    db.session.add(daily)
    db.session.commit()
    
    return jsonify(daily.to_dict()), 201

@dailies_bp.route('/<int:daily_id>/complete', methods=['POST'])
@jwt_required()
def complete_daily(daily_id):
    current_user_id = get_jwt_identity()
    daily = Daily.query.filter_by(id=daily_id, user_id=current_user_id).first_or_404()
    
    target_date = request.get_json().get('date')
    if target_date:
        target_date = date.fromisoformat(target_date)
    else:
        target_date = date.today()
    
    daily.complete_for_date(target_date)
    
    daily_dict = daily.to_dict()
    daily_dict['today_status'] = daily.get_status_for_date(target_date).value
    
    return jsonify(daily_dict)

@dailies_bp.route('/<int:daily_id>', methods=['PUT'])
@jwt_required()
def update_daily(daily_id):
    current_user_id = get_jwt_identity()
    daily = Daily.query.filter_by(id=daily_id, user_id=current_user_id).first_or_404()
    
    data = request.get_json()
    
    daily.title = data.get('title', daily.title)
    daily.description = data.get('description', daily.description)
    daily.energy_value = data.get('energy_value', daily.energy_value)
    daily.campaign_id = data.get('campaign_id', daily.campaign_id)
    daily.is_active = data.get('is_active', daily.is_active)
    
    db.session.commit()
    return jsonify(daily.to_dict())

@dailies_bp.route('/<int:daily_id>', methods=['DELETE'])
@jwt_required()
def delete_daily(daily_id):
    current_user_id = get_jwt_identity()
    daily = Daily.query.filter_by(id=daily_id, user_id=current_user_id).first_or_404()
    
    db.session.delete(daily)
    db.session.commit()
    
    return '', 204

@dailies_bp.route('/<int:daily_id>/skip', methods=['POST'])
@jwt_required()
def skip_daily(daily_id):
    current_user_id = get_jwt_identity()
    daily = Daily.query.filter_by(id=daily_id, user_id=current_user_id).first_or_404()
    
    target_date = request.get_json().get('date')
    if target_date:
        target_date = date.fromisoformat(target_date)
    else:
        target_date = date.today()
    
    completion = DailyCompletion.query.filter_by(
        daily_id=daily.id,
        completion_date=target_date
    ).first()
    
    if not completion:
        completion = DailyCompletion(
            daily_id=daily.id,
            completion_date=target_date,
            status=DailyStatus.SKIPPED
        )
        db.session.add(completion)
    else:
        completion.status = DailyStatus.SKIPPED
    
    db.session.commit()
    
    daily_dict = daily.to_dict()
    daily_dict['today_status'] = daily.get_status_for_date(target_date).value
    
    return jsonify(daily_dict)


@dailies_bp.route('/<int:daily_id>/undo', methods=['POST'])
@jwt_required()
def undo_daily(daily_id):
    current_user_id = get_jwt_identity()
    daily = Daily.query.filter_by(id=daily_id, user_id=current_user_id).first_or_404()
    
    target_date = request.get_json().get('date')
    if target_date:
        target_date = date.fromisoformat(target_date)
    else:
        target_date = date.today()
    
    completion = DailyCompletion.query.filter_by(
        daily_id=daily.id,
        completion_date=target_date
    ).first()
    
    if completion:
        completion.status = DailyStatus.PENDING
        db.session.commit()
    
    daily_dict = daily.to_dict()
    daily_dict['today_status'] = daily.get_status_for_date(target_date).value
    
    return jsonify(daily_dict)