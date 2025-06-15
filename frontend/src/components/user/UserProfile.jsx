import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { useToast } from '../../contexts/ToastContext';
import { X, Camera, User, Mail, Calendar, Trophy, Star, Lock, Eye, EyeOff } from 'lucide-react';
import AvatarCustomization from './AvatarCustomization';
import LoadingSpinner from '../ui/LoadingSpinner';
import { getImagePath } from '../../utils/imageUtils';
import './UserProfile.css';

const UserProfile = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showAvatarCustomization, setShowAvatarCustomization] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (isOpen && user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [isOpen, user]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!profileData.currentPassword) {
      showToast('Debes introducir tu contraseña actual para confirmar los cambios', 'error');
      return;
    }

    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      showToast('Las contraseñas nuevas no coinciden', 'error');
      return;
    }

    if (profileData.newPassword && profileData.newPassword.length < 6) {
      showToast('La nueva contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        username: profileData.username,
        email: profileData.email,
        currentPassword: profileData.currentPassword
      };

      if (profileData.newPassword) {
        updateData.newPassword = profileData.newPassword;
      }

      const updatedUser = await userService.updateProfile(updateData);
      updateUser(updatedUser);
      setIsEditing(false);
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      showToast('Perfil actualizado correctamente', 'success');
    } catch (error) {
      showToast(error.message || 'Error al actualizar el perfil', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileData({
      username: user?.username || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsEditing(false);
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
  };

  const handleAvatarUpdate = (newAvatarUrl) => {
    updateUser({ ...user, avatar_url: newAvatarUrl });
    setShowAvatarCustomization(false);
    showToast('Avatar actualizado correctamente', 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="user-profile-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Perfil de Usuario</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-content">
          <div className="profile-avatar-section">
            <div className="avatar-container">
              <div className="avatar-large">
                {user?.avatar_url ? (
                  <img src={getImagePath(user.avatar_url)} alt={user.username} />
                ) : (
                  <div className="avatar-placeholder-large">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button 
                className="avatar-edit-button-profile"
                onClick={() => setShowAvatarCustomization(true)}
              >
                <Camera size={16} />
                Cambiar Avatar
              </button>
            </div>

            <div className="user-stats-section">
              <div className="stat-card">
                <Trophy className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-label">Nivel</span>
                  <span className="stat-value">{user?.level}</span>
                </div>
              </div>
              <div className="stat-card">
                <Star className="stat-icon" />
                <div className="stat-info">
                  <span className="stat-label">Experiencia</span>
                  <span className="stat-value">{user?.total_xp?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-form-section">
            <div className="form-group">
              <label>
                <User size={16} />
                Nombre de Usuario
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="form-input-profile"
                />
              ) : (
                <div className="form-display">{user?.username}</div>
              )}
            </div>

            <div className="form-group">
              <label>
                <Mail size={16} />
                Correo Electrónico
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="form-input-profile"
                />
              ) : (
                <div className="form-display">{user?.email}</div>
              )}
            </div>

            <div className="form-group">
              <label>
                <Calendar size={16} />
                Miembro desde
              </label>
              <div className="form-display">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>

            {isEditing && (
              <>
                <div className="form-group">
                  <label>
                    <Lock size={16} />
                    Contraseña Actual *
                  </label>
                  <div className="password-input-container">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={profileData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      className="form-input-profile"
                      placeholder="Introduce tu contraseña actual"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    >
                      {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <Lock size={16} />
                    Nueva Contraseña (opcional)
                  </label>
                  <div className="password-input-container">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={profileData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      className="form-input-profile"
                      placeholder="Deja en blanco para mantener la actual"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    >
                      {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {profileData.newPassword && (
                  <div className="form-group">
                    <label>
                      <Lock size={16} />
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="password-input-container">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={profileData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="form-input-profile"
                        placeholder="Confirma tu nueva contraseña"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="modal-footer">
          {isEditing ? (
            <>
              <button 
                className="btn btn-secondary" 
                onClick={handleCancelEdit}
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="small" /> : 'Guardar Cambios'}
              </button>
            </>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={() => setIsEditing(true)}
            >
              Editar Perfil
            </button>
          )}
        </div>

        {showAvatarCustomization && (
          <AvatarCustomization
            isOpen={showAvatarCustomization}
            onClose={() => setShowAvatarCustomization(false)}
            onAvatarUpdate={handleAvatarUpdate}
            currentAvatar={user?.avatar_url}
          />
        )}
      </div>
    </div>
  );
};

export default UserProfile;