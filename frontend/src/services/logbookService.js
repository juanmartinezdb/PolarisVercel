import { apiClient } from './apiClient';

const LOGBOOK_ENDPOINTS = {
  ENTRIES: '/logbooks',
  SEARCH: '/logbooks/search'
};

export const logbookService = {
  getLogbookEntries: async (campaignId = null, date = null) => {
    const params = new URLSearchParams();
    if (campaignId) params.append('campaign_id', campaignId);
    if (date) params.append('date', date);
    
    const response = await apiClient.get(`${LOGBOOK_ENDPOINTS.ENTRIES}?${params}`);
    return response.data;
  },

  createLogbookEntry: async (entryData) => {
    const response = await apiClient.post(LOGBOOK_ENDPOINTS.ENTRIES, entryData);
    return response.data;
  },

  updateLogbookEntry: async (entryId, entryData) => {
    const response = await apiClient.put(`${LOGBOOK_ENDPOINTS.ENTRIES}/${entryId}`, entryData);
    return response.data;
  },

  deleteLogbookEntry: async (entryId) => {
    await apiClient.delete(`${LOGBOOK_ENDPOINTS.ENTRIES}/${entryId}`);
  },

  searchEntries: async (campaignId, searchTerm) => {
    const params = new URLSearchParams({
      campaign_id: campaignId,
      q: searchTerm
    });
    
    const response = await apiClient.get(`${LOGBOOK_ENDPOINTS.SEARCH}?${params}`);
    return response.data;
  }
};

export default logbookService;