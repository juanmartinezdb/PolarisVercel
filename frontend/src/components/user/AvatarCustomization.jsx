import React, { useState, useRef } from 'react';
import { userService } from '../../services/userService';
import { useToast } from '../../contexts/ToastContext';
import { X, Upload, Link as LinkIcon } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import { getImagePath } from '../../utils/imageUtils';
import './AvatarCustomization.css';

// Avatares predefinidos usando rutas públicas
const PRESET_AVATARS = [
  '/assets/images/avatars/def2.jpeg',
  '/assets/images/avatars/def3.jpeg',
  '/assets/images/avatars/def4.jpeg',
  '/assets/images/avatars/def5.jpeg',
  '/assets/images/avatars/def6.jpeg',
  '/assets/images/avatars/def7.jpeg',
  '/assets/images/avatars/def8.jpeg',
  '/assets/images/avatars/def9.jpeg',
  '/assets/images/avatars/def10.jpeg'
];

// Mapeo de avatares a nombres de archivo para el backend
const PRESET_AVATAR_NAMES = {
  '/assets/images/avatars/def2.jpeg': 'def2.jpeg',
  '/assets/images/avatars/def3.jpeg': 'def3.jpeg',
  '/assets/images/avatars/def4.jpeg': 'def4.jpeg',
  '/assets/images/avatars/def5.jpeg': 'def5.jpeg',
  '/assets/images/avatars/def6.jpeg': 'def6.jpeg',
  '/assets/images/avatars/def7.jpeg': 'def7.jpeg',
  '/assets/images/avatars/def8.jpeg': 'def8.jpeg',
  '/assets/images/avatars/def9.jpeg': 'def9.jpeg',
  '/assets/images/avatars/def10.jpeg': 'def10.jpeg'
};

const AVATAR_UPLOAD_LIMITS = {
  MAX_SIZE_MB: 5,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png']
};

const AvatarCustomization = ({ isOpen, onClose, onAvatarUpdate, currentAvatar }) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadPreview, setUploadPreview] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!AVATAR_UPLOAD_LIMITS.ALLOWED_TYPES.includes(file.type)) {
      showToast('Tipo de archivo no válido. Use JPG, JPEG o PNG.', 'error');
      return false;
    }

    if (file.size > AVATAR_UPLOAD_LIMITS.MAX_SIZE_MB * 1024 * 1024) {
      showToast(`El archivo es demasiado grande. Máximo ${AVATAR_UPLOAD_LIMITS.MAX_SIZE_MB}MB.`, 'error');
      return false;
    }

    return true;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!validateFile(file)) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadPreview(e.target.result);
      setSelectedAvatar(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (url) => {
    setAvatarUrl(url);
    if (url.trim()) {
      setSelectedAvatar(url.trim());
      setUploadPreview(null);
    }
  };

  const handlePresetSelect = (presetUrl) => {
    setSelectedAvatar(presetUrl);
    setAvatarUrl('');
    setUploadPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatar) {
      showToast('Selecciona un avatar primero', 'error');
      return;
    }

    setIsLoading(true);
    try {
      let avatarData;
      
      if (uploadPreview && fileInputRef.current?.files[0]) {
        avatarData = { file: fileInputRef.current.files[0] };
      } else if (PRESET_AVATARS.includes(selectedAvatar)) {
        const presetName = PRESET_AVATAR_NAMES[selectedAvatar];
        avatarData = { preset: presetName };
      } else {
        avatarData = { url: selectedAvatar };
      }

      const response = await userService.updateAvatar(avatarData);
      onAvatarUpdate(response.avatar_url);
      showToast('Avatar actualizado correctamente', 'success');
      onClose();
    } catch (error) {
      showToast('Error al actualizar el avatar', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="avatar-customization-overlay" onClick={onClose}>
      <div className="avatar-customization-modal" onClick={e => e.stopPropagation()}>
        <div className="avatar-customization-header">
          <h2>Personalizar Avatar</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="avatar-customization-content">
          <div className="current-avatar-section">
            <h3>Vista Previa</h3>
            {selectedAvatar ? (
              <img src={selectedAvatar} alt="Avatar preview" className="current-avatar" />
            ) : (
              <div className="current-avatar-placeholder">
                {currentAvatar ? currentAvatar.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>

          <div className="avatar-options">
            <div className="avatar-option">
              <div className="option-header">
                <Upload className="option-icon" size={18} />
                <h4>Subir Imagen</h4>
              </div>
              <p className="option-description">
                Sube tu propia imagen (máximo {AVATAR_UPLOAD_LIMITS.MAX_SIZE_MB}MB, formatos: JPG, JPEG, PNG)
              </p>
              <div className="file-input-wrapper">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="file-input"
                />
                <div className="file-input-button">
                  <Upload size={16} />
                  Seleccionar archivo
                </div>
              </div>
            </div>

            <div className="avatar-option">
              <div className="option-header">
                <LinkIcon className="option-icon" size={18} />
                <h4>URL de Imagen</h4>
              </div>
              <p className="option-description">
                Usa una imagen desde internet
              </p>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://ejemplo.com/mi-avatar.jpg"
                className="url-input"
              />
            </div>

            <div className="avatar-option">
              <div className="option-header">
                <h4>Avatares Predefinidos</h4>
              </div>
              <div className="preset-avatars">
                {PRESET_AVATARS.map((presetUrl, index) => (
                  <img
                    key={index}
                    src={presetUrl}
                    alt={`Preset ${index + 1}`}
                    className={`preset-avatar ${selectedAvatar === presetUrl ? 'selected' : ''}`}
                    onClick={() => handlePresetSelect(presetUrl)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="avatar-customization-actions">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSaveAvatar}
            disabled={isLoading || !selectedAvatar}
          >
            {isLoading ? <LoadingSpinner size="small" /> : 'Guardar Avatar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarCustomization;