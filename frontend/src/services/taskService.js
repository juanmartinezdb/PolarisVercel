import { apiClient } from './apiClient';

export const taskService = {
  async getTasks(filters = {}) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value)
      }
    })
    
    const response = await apiClient.get(`/tasks?${params}`)
    return response.data
  },

  async createTask(taskData) {
    const response = await apiClient.post('/tasks', taskData)
    return response.data
  },

  async updateTask(taskId, taskData) {
    const response = await apiClient.put(`/tasks/${taskId}`, taskData)
    return response.data
  },

  async completeTask(taskId) {
    const response = await apiClient.post(`/tasks/${taskId}/complete`)
    return response.data
  },

  async deleteTask(taskId) {
    await apiClient.delete(`/tasks/${taskId}`)
  },
  
  async getDailies() {
    const response = await apiClient.get('/dailies');
    return response.data;
  },
  
  async createDaily(dailyData) {
    const response = await apiClient.post('/dailies', dailyData);
    return response.data;
  },

  async updateDaily(dailyId, dailyData) {
    const response = await apiClient.put(`/dailies/${dailyId}`, dailyData);
    return response.data;
  },

  async deleteDaily(dailyId) {
    await apiClient.delete(`/dailies/${dailyId}`);
  },

  async completeDaily(dailyId, date = null) {
    const payload = date ? { date } : {};
    const response = await apiClient.post(`/dailies/${dailyId}/complete`, payload);
    return response.data;
  },

  async skipDaily(dailyId, date = null) {
    const payload = date ? { date } : {};
    const response = await apiClient.post(`/dailies/${dailyId}/skip`, payload);
    return response.data;
  },
  
  async getRaids() {
    const response = await apiClient.get('/raids');
    return response.data;
  },

  async createRaid(raidData) {
    const response = await apiClient.post('/raids', raidData);
    return response.data;
  },

  async updateRaid(raidId, raidData) {
    const response = await apiClient.put(`/raids/${raidId}`, raidData);
    return response.data;
  },

  async deleteRaid(raidId) {
    await apiClient.delete(`/raids/${raidId}`);
  },

  async completeRaid(raidId, date = null) {
    const payload = date ? { date } : {};
    const response = await apiClient.post(`/raids/${raidId}/complete`, payload);
    return response.data;
  },

  async skipRaid(raidId, date = null) {
    const payload = date ? { date } : {};
    const response = await apiClient.post(`/raids/${raidId}/skip`, payload);
    return response.data;
  },

  async updateTaskStatus(taskId, status) {
    const response = await apiClient.put(`/tasks/${taskId}`, { status });
    return response.data;
  },

  async getTasksByType(taskType, filters = {}) {
    const allFilters = { ...filters, task_type: taskType };
    return this.getTasks(allFilters);
  },

  async getTodaysTasks() {
    const today = new Date().toISOString().split('T')[0];
    return this.getTasks({ due_date: today });
  },

  async getRecentCompletedTasks(limit = 10) {
    return this.getTasks({ status: 'completed', limit, order_by: 'completed_at', order_dir: 'desc' });
  },

  async getSkippedTasks() {
    return this.getTasks({ status: 'skipped' });
  },

  async getActiveTasks(limit = 10) {
    return this.getTasks({ 
      status: 'pending', 
      limit
    });
  }
};