from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.campaign import Campaign

campaigns_bp = Blueprint('campaigns', __name__)

@campaigns_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_campaigns():
    current_user_id = get_jwt_identity()
    campaigns = Campaign.query.filter_by(user_id=current_user_id).order_by(Campaign.is_default.desc(), Campaign.name).all()
    return jsonify([campaign.to_dict() for campaign in campaigns])

@campaigns_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def create_campaign():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    campaign = Campaign(
        name=data['name'],
        description=data.get('description'),
        color=data.get('color', '#4F46E5'),
        user_id=current_user_id
    )
    
    db.session.add(campaign)
    db.session.commit()
    
    return jsonify(campaign.to_dict()), 201

@campaigns_bp.route('/<int:campaign_id>', methods=['PUT'])
@jwt_required()
def update_campaign(campaign_id):
    current_user_id = get_jwt_identity()
    campaign = Campaign.query.filter_by(id=campaign_id, user_id=current_user_id).first_or_404()
    
    data = request.get_json()
    
    campaign.name = data.get('name', campaign.name)
    campaign.description = data.get('description', campaign.description)
    campaign.color = data.get('color', campaign.color)
    
    db.session.commit()
    return jsonify(campaign.to_dict())

@campaigns_bp.route('/<int:campaign_id>', methods=['DELETE'])
@jwt_required()
def delete_campaign(campaign_id):
    current_user_id = get_jwt_identity()
    campaign = Campaign.query.filter_by(id=campaign_id, user_id=current_user_id).first_or_404()
    
    if campaign.is_default:
        return jsonify({'message': 'Cannot delete default campaign'}), 400
    
    transfer_items = request.args.get('transfer_items', 'true').lower() == 'true'
    
    from app.models.task import Task
    from app.models.daily import Daily
    from app.models.raid import Raid
    from app.models.logbook import LogbookEntry
    
    if transfer_items:
        default_campaign = Campaign.query.filter_by(
            user_id=current_user_id, 
            is_default=True
        ).first()
        
        if not default_campaign:
            return jsonify({'message': 'Default campaign not found'}), 400
        
        Task.query.filter_by(campaign_id=campaign_id).update({'campaign_id': default_campaign.id})
        Daily.query.filter_by(campaign_id=campaign_id).update({'campaign_id': default_campaign.id})
        Raid.query.filter_by(campaign_id=campaign_id).update({'campaign_id': default_campaign.id})
    else:
        Task.query.filter_by(campaign_id=campaign_id).delete()
        Daily.query.filter_by(campaign_id=campaign_id).delete()
        Raid.query.filter_by(campaign_id=campaign_id).delete()
    
    LogbookEntry.query.filter_by(campaign_id=campaign_id).delete()
    
    db.session.delete(campaign)
    db.session.commit()
    
    return '', 204