from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.logbook import LogbookEntry
from datetime import date

logbooks_bp = Blueprint('logbooks', __name__)

@logbooks_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_logbook_entries():
    current_user_id = get_jwt_identity()
    campaign_id = request.args.get('campaign_id')
    entry_date = request.args.get('date')
    
    query = LogbookEntry.query.filter_by(user_id=current_user_id)
    
    if campaign_id:
        query = query.filter_by(campaign_id=campaign_id)
    
    if entry_date:
        query = query.filter_by(entry_date=date.fromisoformat(entry_date))
    
    entries = query.order_by(LogbookEntry.entry_date.desc()).all()
    return jsonify([entry.to_dict() for entry in entries])

@logbooks_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def create_logbook_entry():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    if not data.get('campaign_id'):
        return jsonify({'error': 'campaign_id is required'}), 400
        
    if not data.get('entry_date'):
        return jsonify({'error': 'entry_date is required'}), 400
        
    if not data.get('title') or not data.get('title').strip():
        return jsonify({'error': 'title is required'}), 400
    
    try:
        campaign_id = int(data.get('campaign_id'))
        
        entry = LogbookEntry(
            title=data.get('title').strip(),
            content=data.get('content', ''),
            entry_date=date.fromisoformat(data['entry_date']),
            user_id=current_user_id,
            campaign_id=campaign_id
        )
        
        db.session.add(entry)
        db.session.commit()
        
        return jsonify(entry.to_dict()), 201
        
    except ValueError as e:
        return jsonify({'error': f'Invalid data format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@logbooks_bp.route('/<int:entry_id>', methods=['PUT'], strict_slashes=False)
@jwt_required()
def update_logbook_entry(entry_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    entry = LogbookEntry.query.filter_by(
        id=entry_id, 
        user_id=current_user_id
    ).first_or_404()
    
    entry.title = data.get('title', entry.title)
    entry.content = data.get('content', entry.content)
    if data.get('entry_date'):
        entry.entry_date = date.fromisoformat(data['entry_date'])
    if data.get('campaign_id'):
        entry.campaign_id = data['campaign_id']
    
    db.session.commit()
    return jsonify(entry.to_dict())

@logbooks_bp.route('/<int:entry_id>', methods=['DELETE'], strict_slashes=False)
@jwt_required()
def delete_logbook_entry(entry_id):
    current_user_id = get_jwt_identity()
    
    entry = LogbookEntry.query.filter_by(
        id=entry_id, 
        user_id=current_user_id
    ).first_or_404()
    
    db.session.delete(entry)
    db.session.commit()
    return '', 204

@logbooks_bp.route('/search', methods=['GET'], strict_slashes=False)
@jwt_required()
def search_logbook_entries():
    current_user_id = get_jwt_identity()
    campaign_id = request.args.get('campaign_id')
    search_term = request.args.get('q', '')
    
    if not search_term:
        return jsonify([])
    
    query = LogbookEntry.query.filter_by(user_id=current_user_id)
    
    if campaign_id:
        query = query.filter_by(campaign_id=campaign_id)
    
    search_filter = db.or_(
        LogbookEntry.title.ilike(f'%{search_term}%'),
        LogbookEntry.content.ilike(f'%{search_term}%')
    )
    
    entries = query.filter(search_filter).order_by(
        LogbookEntry.entry_date.desc()
    ).all()
    
    return jsonify([entry.to_dict() for entry in entries])