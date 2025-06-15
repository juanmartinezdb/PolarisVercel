from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.raid import Raid, RaidCompletion, RaidStatus, RaidDifficulty
from datetime import date, datetime

raids_bp = Blueprint('raids', __name__)

@raids_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_raids():
    current_user_id = get_jwt_identity()
    campaign_id = request.args.get('campaign_id')
    
    query = Raid.query.filter_by(user_id=current_user_id)
    
    if campaign_id:
        query = query.filter_by(campaign_id=campaign_id)
    
    raids = query.order_by(Raid.day_of_week, Raid.start_time).all()
    
    return jsonify([raid.to_dict() for raid in raids])

@raids_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def create_raid():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    raid = Raid(
        title=data['title'],
        description=data.get('description'),
        energy_value=data['energy_value'],
        day_of_week=data['day_of_week'],
        start_time=datetime.strptime(data['start_time'], '%H:%M').time(),
        duration=data['duration'],
        user_id=current_user_id,
        campaign_id=data['campaign_id'],
        is_active=data.get('is_active', True)  
    )

    if 'difficulty' in data:
        raid.difficulty = RaidDifficulty(data['difficulty'])

    db.session.add(raid)
    db.session.commit()
    
    return jsonify(raid.to_dict()), 201

@raids_bp.route('/<int:raid_id>', methods=['GET'])
@jwt_required()
def get_raid(raid_id):
    current_user_id = get_jwt_identity()
    raid = Raid.query.filter_by(id=raid_id, user_id=current_user_id).first_or_404()
    return jsonify(raid.to_dict())

@raids_bp.route('/<int:raid_id>', methods=['PUT'])
@jwt_required()
def update_raid(raid_id):
    current_user_id = get_jwt_identity()
    raid = Raid.query.filter_by(id=raid_id, user_id=current_user_id).first_or_404()
    
    data = request.get_json()
    
    raid.title = data.get('title', raid.title)
    raid.description = data.get('description', raid.description)
    raid.energy_value = data.get('energy_value', raid.energy_value)
    raid.day_of_week = data.get('day_of_week', raid.day_of_week)
    raid.duration = data.get('duration', raid.duration)
    raid.is_active = data.get('is_active', raid.is_active)
    
    if 'start_time' in data:
        raid.start_time = datetime.strptime(data['start_time'], '%H:%M').time()
    if 'difficulty' in data:
        raid.difficulty = RaidDifficulty(data['difficulty'])
        
    db.session.commit()
    return jsonify(raid.to_dict())

@raids_bp.route('/<int:raid_id>', methods=['DELETE'])
@jwt_required()
def delete_raid(raid_id):
    current_user_id = get_jwt_identity()
    raid = Raid.query.filter_by(id=raid_id, user_id=current_user_id).first_or_404()
    
    db.session.delete(raid)
    db.session.commit()
    
    return '', 204

@raids_bp.route('/<int:raid_id>/complete', methods=['POST'])
@jwt_required()
def complete_raid(raid_id):
    current_user_id = get_jwt_identity()
    raid = Raid.query.filter_by(id=raid_id, user_id=current_user_id).first_or_404()
    
    target_date = request.get_json().get('date')
    if target_date:
        target_date = date.fromisoformat(target_date)
    else:
        target_date = date.today()
    
    completion = RaidCompletion.query.filter_by(
        raid_id=raid.id,
        completion_date=target_date
    ).first()
    
    if not completion:
        completion = RaidCompletion(
            raid_id=raid.id,
            completion_date=target_date,
            status=RaidStatus.COMPLETED
        )
        db.session.add(completion)
    else:
        completion.status = RaidStatus.COMPLETED
    
    raid.user.add_xp(abs(raid.energy_value))
    db.session.commit()
    
    return jsonify(completion.to_dict())

@raids_bp.route('/<int:raid_id>/skip', methods=['POST'])
@jwt_required()
def skip_raid(raid_id):
    current_user_id = get_jwt_identity()
    raid = Raid.query.filter_by(id=raid_id, user_id=current_user_id).first_or_404()
    
    target_date = request.get_json().get('date')
    if target_date:
        target_date = date.fromisoformat(target_date)
    else:
        target_date = date.today()
    
    completion = RaidCompletion.query.filter_by(
        raid_id=raid.id,
        completion_date=target_date
    ).first()
    
    if not completion:
        completion = RaidCompletion(
            raid_id=raid.id,
            completion_date=target_date,
            status=RaidStatus.SKIPPED
        )
        db.session.add(completion)
    else:
        completion.status = RaidStatus.SKIPPED
    
    db.session.commit()
    return jsonify(completion.to_dict())


@raids_bp.route('/<int:raid_id>/undo', methods=['POST'])
@jwt_required()
def undo_raid(raid_id):
    current_user_id = get_jwt_identity()
    raid = Raid.query.filter_by(id=raid_id, user_id=current_user_id).first_or_404()
    
    target_date = request.get_json().get('date')
    if target_date:
        target_date = date.fromisoformat(target_date)
    else:
        target_date = date.today()
    
    completion = RaidCompletion.query.filter_by(
        raid_id=raid.id,
        completion_date=target_date
    ).first()
    
    if completion:
        completion.status = RaidStatus.PENDING
        db.session.commit()
    
    return jsonify(completion.to_dict())

@raids_bp.route('/today', methods=['GET'])
@jwt_required()
def get_today_raids():
    """Obtiene raids programados para hoy con su estado"""
    current_user_id = get_jwt_identity()
    campaign_id = request.args.get('campaign_id')
    

    today = date.today()
    python_weekday = today.weekday() 
    js_weekday = (python_weekday + 1) % 7
    
    query = Raid.query.filter_by(
        user_id=current_user_id, 
        is_active=True, 
        day_of_week=js_weekday
    )
    
    if campaign_id:
        query = query.filter_by(campaign_id=campaign_id)
    
    raids = query.order_by(Raid.start_time).all()
    
    result = []
    for raid in raids:
        raid_dict = raid.to_dict()
        
        completion = RaidCompletion.query.filter_by(
            raid_id=raid.id,
            completion_date=today
        ).first()
        
        raid_dict['today_status'] = completion.status.value if completion else 'pending'
        result.append(raid_dict)
    
    return jsonify(result)