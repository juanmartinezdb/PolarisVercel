from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.task import Task, TaskType, TaskStatus
from app.models.campaign import Campaign
from datetime import datetime

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_tasks():
    current_user_id = get_jwt_identity()
    campaign_id = request.args.get('campaign_id')
    task_type = request.args.get('type')
    status = request.args.get('status')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Task.query.filter_by(user_id=current_user_id)
    
    if campaign_id:
        query = query.filter_by(campaign_id=campaign_id)
    if task_type:
        query = query.filter_by(task_type=TaskType(task_type))
    if status:
        query = query.filter_by(status=TaskStatus(status))
    
    if start_date and end_date:
        from datetime import datetime
        start_dt = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_dt = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        query = query.filter(
            db.or_(
                Task.task_type.in_([TaskType.COMMISSION, TaskType.RUMOR]),
                db.and_(
                    Task.task_type.in_([TaskType.OPEN_QUEST, TaskType.CLOSED_QUEST]),
                    db.or_(
                        Task.due_date.is_(None),
                        Task.due_date.between(start_dt, end_dt)
                    )
                )
            )
        )
    
    tasks = query.order_by(Task.created_at.desc()).all()
    return jsonify([task.to_dict() for task in tasks])

@tasks_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def create_task():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    task = Task(
        title=data['title'],
        description=data.get('description'),
        task_type=TaskType(data['task_type']),
        energy_value=data['energy_value'],
        user_id=current_user_id,
        campaign_id=data['campaign_id']
    )
    
    if data.get('due_date'):
        task.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
    if data.get('due_time'):
        task.due_time = datetime.strptime(data['due_time'], '%H:%M').time()
    if data.get('estimated_duration'):
        task.estimated_duration = data['estimated_duration']
    
    db.session.add(task)
    db.session.commit()
    
    return jsonify(task.to_dict()), 201

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    current_user_id = get_jwt_identity()
    task = Task.query.filter_by(id=task_id, user_id=current_user_id).first_or_404()
    
    data = request.get_json()
    
    task.title = data.get('title', task.title)
    task.description = data.get('description', task.description)
    task.energy_value = data.get('energy_value', task.energy_value)
    
    if 'task_type' in data:
        task.task_type = TaskType(data['task_type'])
    
    if 'status' in data:
        new_status = TaskStatus(data['status'])
        old_status = task.status
        task.status = new_status
        
        if new_status == TaskStatus.COMPLETED and old_status != TaskStatus.COMPLETED:
            task.completed_at = datetime.utcnow()
            task.user.add_xp(abs(task.energy_value))
        elif old_status == TaskStatus.COMPLETED and new_status != TaskStatus.COMPLETED:
            task.completed_at = None
        
    if 'due_date' in data:
        task.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data['due_date'] else None
    if 'due_time' in data:
        task.due_time = datetime.strptime(data['due_time'], '%H:%M').time() if data['due_time'] else None
    if 'estimated_duration' in data:
        task.estimated_duration = data['estimated_duration']
    
    db.session.commit()
    return jsonify(task.to_dict())

@tasks_bp.route('/<int:task_id>/complete', methods=['POST'])
@jwt_required()
def complete_task(task_id):
    current_user_id = get_jwt_identity()
    task = Task.query.filter_by(id=task_id, user_id=current_user_id).first_or_404()
    
    task.complete()
    db.session.commit()
    return jsonify(task.to_dict())

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    current_user_id = get_jwt_identity()
    task = Task.query.filter_by(id=task_id, user_id=current_user_id).first_or_404()
    
    db.session.delete(task)
    db.session.commit()
    
    return '', 204

@tasks_bp.route('/bulk-update', methods=['PUT'])
@jwt_required()
def bulk_update_tasks():
    """Actualización masiva de tareas"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'task_ids' not in data or 'updates' not in data:
        return jsonify({'error': 'task_ids and updates are required'}), 400
    
    task_ids = data['task_ids']
    updates = data['updates']
    
    try:
        tasks = Task.query.filter(
            Task.id.in_(task_ids),
            Task.user_id == current_user_id
        ).all()
        
        if len(tasks) != len(task_ids):
            return jsonify({'error': 'Some tasks not found or not owned by user'}), 404
        
        updated_tasks = []
        
        for task in tasks:
            if 'status' in updates:
                task.status = TaskStatus(updates['status'])
            if 'campaign_id' in updates:
                task.campaign_id = updates['campaign_id']
            if 'energy_value' in updates:
                task.energy_value = updates['energy_value']
            
            updated_tasks.append(task.to_dict())
        
        db.session.commit()
        
        return jsonify({
            'message': f'Updated {len(updated_tasks)} tasks',
            'updated_tasks': updated_tasks
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/bulk-complete', methods=['POST'])
@jwt_required()
def bulk_complete_tasks():
    """Completar múltiples tareas a la vez"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'task_ids' not in data:
        return jsonify({'error': 'task_ids is required'}), 400
    
    task_ids = data['task_ids']
    
    try:
        tasks = Task.query.filter(
            Task.id.in_(task_ids),
            Task.user_id == current_user_id,
            Task.status != TaskStatus.COMPLETED
        ).all()
        
        completed_tasks = []
        total_xp_gained = 0
        
        for task in tasks:
            task.complete()
            completed_tasks.append(task.to_dict())
            total_xp_gained += abs(task.energy_value)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Completed {len(completed_tasks)} tasks',
            'completed_tasks': completed_tasks,
            'total_xp_gained': total_xp_gained
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tasks_bp.route('/overdue', methods=['GET'])
@jwt_required()
def get_overdue_tasks():
    """Obtiene tareas vencidas (Rescue Missions)"""
    current_user_id = get_jwt_identity()
    campaign_id = request.args.get('campaign_id')
    
    query = Task.query.filter(
        Task.user_id == current_user_id,
        Task.due_date < date.today(),
        Task.status != TaskStatus.COMPLETED
    )
    
    if campaign_id:
        query = query.filter_by(campaign_id=campaign_id)
    
    tasks = query.order_by(Task.due_date.asc()).all()
    return jsonify([task.to_dict() for task in tasks])

@tasks_bp.route('/due-today', methods=['GET'])
@jwt_required()
def get_due_today_tasks():
    """Obtiene tareas que vencen hoy"""
    current_user_id = get_jwt_identity()
    campaign_id = request.args.get('campaign_id')
    
    query = Task.query.filter(
        Task.user_id == current_user_id,
        Task.due_date == date.today(),
        Task.status != TaskStatus.COMPLETED
    )
    
    if campaign_id:
        query = query.filter_by(campaign_id=campaign_id)
    
    tasks = query.order_by(Task.due_time.asc().nullslast()).all()
    return jsonify([task.to_dict() for task in tasks])