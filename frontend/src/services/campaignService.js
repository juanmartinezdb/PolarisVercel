import { apiClient } from './apiClient'

export const campaignService = {
  async getCampaigns() {
    const response = await apiClient.get('/campaigns')
    return response.data
  },

  async createCampaign(campaignData) {
    const response = await apiClient.post('/campaigns', campaignData)
    return response.data
  },

  async updateCampaign(campaignId, campaignData) {
    const response = await apiClient.put(`/campaigns/${campaignId}`, campaignData)
    return response.data
  },

  async deleteCampaign(campaignId, transferItems = true) {
    await apiClient.delete(`/campaigns/${campaignId}?transfer_items=${transferItems}`)
  }
}