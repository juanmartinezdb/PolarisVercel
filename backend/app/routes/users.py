from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import shutil
import requests
from PIL import Image
from app import db
from app.models.user import User

users_bp = Blueprint('users', __name__)

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return jsonify(user.to_dict())

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    data = request.get_json()
    
    if 'username' in data:
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user and existing_user.id != user.id:
            return jsonify({'message': 'Username already exists'}), 400
        user.username = data['username']
    
    if 'email' in data:
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user and existing_user.id != user.id:
            return jsonify({'message': 'Email already exists'}), 400
        user.email = data['email']
    
    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url']
    
    db.session.commit()
    return jsonify(user.to_dict())

@users_bp.route('/avatar', methods=['POST'])
@jwt_required()
def update_avatar():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # En producción, usar un directorio temporal o servicio de almacenamiento
    if os.environ.get('FLASK_ENV') == 'production':
        # Para Railway, usar directorio temporal
        avatar_dir = os.path.join('/tmp', 'avatars')
    else:
        # En desarrollo, usar el directorio público del frontend
        backend_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        avatar_dir = os.path.join(backend_root, '..', 'frontend', 'public', 'assets', 'images', 'avatars')
        avatar_dir = os.path.abspath(avatar_dir)
    
    os.makedirs(avatar_dir, exist_ok=True)
    
    for ext in ['jpg', 'jpeg', 'png']:
        old_avatar_path = os.path.join(avatar_dir, f'user{current_user_id}.{ext}')
        if os.path.exists(old_avatar_path):
            os.remove(old_avatar_path)
    
    try:
        if 'file' in request.files:
            file = request.files['file']
            if file and file.filename:
                allowed_extensions = {'jpg', 'jpeg', 'png'}
                file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
                
                if file_ext not in allowed_extensions:
                    return jsonify({'message': 'Formato de archivo no permitido. Use JPG, JPEG o PNG.'}), 400
                
                file.seek(0, 2)
                file_size = file.tell()
                file.seek(0) 
                
                if file_size > 5 * 1024 * 1024:  
                    return jsonify({'message': 'El archivo es demasiado grande. Máximo 5MB.'}), 400
                
                filename = f'user{current_user_id}.{file_ext}'
                file_path = os.path.join(avatar_dir, filename)
                
                # Procesar imagen con PIL
                    image = Image.open(file)
                    if image.mode in ('RGBA', 'LA', 'P'):
                        background = Image.new('RGB', image.size, (255, 255, 255))
                        if image.mode == 'P':
                            image = image.convert('RGBA')
                        background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                        image = background
                    
                    max_size = (500, 500)
                    image.thumbnail(max_size, Image.Resampling.LANCZOS)
                    
                    image.save(file_path, format='JPEG' if file_ext in ['jpg', 'jpeg'] else 'PNG', quality=85)
                
                avatar_url = f'/assets/images/avatars/{filename}'
                
        elif request.json and 'preset' in request.json:
            preset_name = request.json['preset']
            
            preset_path = os.path.join(avatar_dir, preset_name)
            if not os.path.exists(preset_path):
                return jsonify({'message': 'Avatar predefinido no encontrado.'}), 400
            
            preset_ext = preset_name.rsplit('.', 1)[1].lower()
            
            user_filename = f'user{current_user_id}.{preset_ext}'
            user_avatar_path = os.path.join(avatar_dir, user_filename)
            
            shutil.copy2(preset_path, user_avatar_path)
            
            avatar_url = f'/assets/images/avatars/{user_filename}'
            
        elif request.json and 'url' in request.json:
            url = request.json['url']
            
            try:
                response = requests.get(url, timeout=10, stream=True)
                response.raise_for_status()
                
                content_type = response.headers.get('content-type', '')
                if not content_type.startswith('image/'):
                    return jsonify({'message': 'La URL no apunta a una imagen válida.'}), 400
                
                if 'jpeg' in content_type or 'jpg' in content_type:
                    ext = 'jpg'
                elif 'png' in content_type:
                    ext = 'png'
                else:
                    ext = 'jpg'  
                
                filename = f'user{current_user_id}.{ext}'
                file_path = os.path.join(avatar_dir, filename)
                
                # Procesar imagen con PIL
                    image = Image.open(response.raw)
                    
                    if image.mode in ('RGBA', 'LA', 'P'):
                        background = Image.new('RGB', image.size, (255, 255, 255))
                        if image.mode == 'P':
                            image = image.convert('RGBA')
                        background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                        image = background
                    
                    max_size = (500, 500)
                    image.thumbnail(max_size, Image.Resampling.LANCZOS)
                    
                    image.save(file_path, format='JPEG' if ext == 'jpg' else 'PNG', quality=85)
                
                avatar_url = f'/assets/images/avatars/{filename}'
                
            except requests.RequestException:
                return jsonify({'message': 'No se pudo descargar la imagen desde la URL.'}), 400
            except Exception:
                return jsonify({'message': 'Error al procesar la imagen desde la URL.'}), 400
        
        else:
            return jsonify({'message': 'No se proporcionó archivo, preset o URL.'}), 400
        
        user.avatar_url = avatar_url
        db.session.commit()
        
        return jsonify({
            'message': 'Avatar actualizado correctamente',
            'avatar_url': avatar_url
        })
        
    except Exception as e:
        return jsonify({'message': f'Error al procesar el avatar: {str(e)}'}), 500
