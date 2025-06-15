import { apiClient } from './apiClient';

const USER_ENDPOINTS = {
  PROFILE: '/users/profile',
  AVATAR: '/users/avatar',
  SETTINGS: '/users/settings'
};

export const userService = {
  async getProfile() {
    try {
      const response = await apiClient.get(USER_ENDPOINTS.PROFILE);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await apiClient.put(USER_ENDPOINTS.PROFILE, profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  async updateAvatar(avatarData) {
    try {
      if (avatarData.file) {
        const formData = new FormData();
        formData.append('file', avatarData.file);
        
        const response = await apiClient.post(USER_ENDPOINTS.AVATAR, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      }
      else {
        const response = await apiClient.post(USER_ENDPOINTS.AVATAR, avatarData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        return response.data;
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      throw error;
    }
  },

  async updateSettings(settings) {
    try {
      const response = await apiClient.put(USER_ENDPOINTS.SETTINGS, settings);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  async deleteAccount() {
    try {
      const response = await apiClient.delete(USER_ENDPOINTS.PROFILE);
      return response.data;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }
};