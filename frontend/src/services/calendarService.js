import { apiClient } from './apiClient'

const CALENDAR_ENDPOINTS = {
  CALENDAR: '/calendar',
  TASKS: '/tasks',
  DAILIES: '/dailies',
  RAIDS: '/raids'
}

export const calendarService = {
  async getCalendarData(startDate, endDate, campaignId = null) {
    try {
      const [tasksResponse, raidsResponse] = await Promise.allSettled([
        apiClient.get(`${CALENDAR_ENDPOINTS.TASKS}`, {
          params: {
            ...(campaignId && { campaign_id: campaignId })
          }
        }),
        apiClient.get(`${CALENDAR_ENDPOINTS.RAIDS}/today`, {
          params: campaignId ? { campaign_id: campaignId } : {}
        })
      ])

      return {
        tasks: tasksResponse.status === 'fulfilled' ? tasksResponse.value.data : [],
        dailies: [],
        raids: raidsResponse.status === 'fulfilled' ? raidsResponse.value.data : [],
        logbookEntries: []
      }
    } catch (error) {
      console.error('Error loading calendar data:', error)
      return {
        tasks: [],
        dailies: [],
        raids: [],
        logbookEntries: []
      }
    }
  },

  async updateTaskDateTime(taskId, newDate, newTime = null) {
    const updateData = { due_date: newDate }
    
    if (newTime) {
      updateData.due_time = newTime
      updateData.task_type = 'closed_quest'
    } else {
      updateData.due_time = null
      updateData.task_type = 'open_quest'
    }
    
    const response = await apiClient.put(`${CALENDAR_ENDPOINTS.TASKS}/${taskId}`, updateData)
    return response.data
  },

  async convertTaskType(taskId, newType, dateTime = null) {
    const updateData = { task_type: newType }
    
    if (dateTime) {
      updateData.due_date = dateTime.date
      if (dateTime.time && newType === 'closed_quest') {
        updateData.due_time = dateTime.time
      }
    }
    
    const response = await apiClient.put(`${CALENDAR_ENDPOINTS.TASKS}/${taskId}`, updateData)
    return response.data
  },

  async completeTask(taskId) {
    const response = await apiClient.post(`${CALENDAR_ENDPOINTS.TASKS}/${taskId}/complete`)
    return response.data
  },

  async completeDaily(dailyId, date) {
    const response = await apiClient.post(`${CALENDAR_ENDPOINTS.DAILIES}/${dailyId}/complete`, { date })
    return response.data
  },

  async completeRaid(raidId, date) {
    const response = await apiClient.post(`${CALENDAR_ENDPOINTS.RAIDS}/${raidId}/complete`, { date })
    return response.data
  },

  async deleteTask(taskId) {
    await apiClient.delete(`${CALENDAR_ENDPOINTS.TASKS}/${taskId}`)
  },

  async deleteDaily(dailyId) {
    await apiClient.delete(`${CALENDAR_ENDPOINTS.DAILIES}/${dailyId}`)
  },

  async deleteRaid(raidId) {
    await apiClient.delete(`${CALENDAR_ENDPOINTS.RAIDS}/${raidId}`)
  },

  async createTask(taskData) {
    const response = await apiClient.post(`${CALENDAR_ENDPOINTS.TASKS}`, taskData)
    return response.data
  },

  async updateTask(taskId, taskData) {
    const response = await apiClient.put(`${CALENDAR_ENDPOINTS.TASKS}/${taskId}`, taskData)
    return response.data
  },

  async getGuildBoardTasks(campaignId = null) {
    const params = {
      type: 'commission,rumor'
    }
    if (campaignId) {
      params.campaign_id = campaignId
    }
    
    const response = await apiClient.get(`${CALENDAR_ENDPOINTS.TASKS}`, { params })
    return response.data
  },

  async getTodayDailies(campaignId = null) {
    const params = campaignId ? { campaign_id: campaignId } : {}
    const response = await apiClient.get(`${CALENDAR_ENDPOINTS.DAILIES}`, { params })
    return response.data
  },

  async skipDaily(dailyId, date) {
    const response = await apiClient.post(`${CALENDAR_ENDPOINTS.DAILIES}/${dailyId}/skip`, { date })
    return response.data
  },

  async undoDailyCompletion(dailyId, date) {
    const response = await apiClient.post(`${CALENDAR_ENDPOINTS.DAILIES}/${dailyId}/undo`, { date })
    return response.data
  },

  async getTodayRaids(campaignId = null) {
    const params = campaignId ? { campaign_id: campaignId } : {}
    const response = await apiClient.get(`${CALENDAR_ENDPOINTS.RAIDS}/today`, { params })
    return response.data
  },

  async skipRaid(raidId, date) {
    const response = await apiClient.post(`${CALENDAR_ENDPOINTS.RAIDS}/${raidId}/skip`, { date })
    return response.data
  },

  async undoRaidCompletion(raidId, date) {
    const response = await apiClient.post(`${CALENDAR_ENDPOINTS.RAIDS}/${raidId}/undo`, { date })
    return response.data
  }
}