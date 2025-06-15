from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.campaign import Campaign

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'API is running'}), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400
    
    user = User(
        username=data['username'],
        email=data['email']
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    default_campaign = Campaign(
        name='Story Mode',
        description='Por defecto tus aventuras se añadirán al modo historia, aquí también podras rescatar hazañas pendientes de otras camapañas cuando quieras prescindir de ellas si así lo deseas puedes modificar esta descripcion y el nombre de esta campaña a tu gusto, pero nunca podras borrar tu campaña princial de modo historia',
        is_default=True,
        user_id=user.id
    )
    db.session.add(default_campaign)
    db.session.commit()
    
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if user and user.check_password(data['password']):
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        })
    
    return jsonify({'message': 'Invalid credentials'}), 401

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    new_token = create_access_token(identity=current_user_id)
    return jsonify({'access_token': new_token})

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    
    try:
        current_user_id = int(current_user_id)
    except (ValueError, TypeError):
        return jsonify({"message": "Formato de identidad de usuario inválido en el token"}), 422

    user = User.query.get(current_user_id)

    if user is None:
        return jsonify({"message": "Usuario no encontrado"}), 404
    
    return jsonify(user.to_dict()), 200