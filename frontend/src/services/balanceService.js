import { apiClient } from './apiClient'

export const balanceService = {
  async getEnergyBalance() {
    const response = await apiClient.get('/balance/energy')
    return response.data
  }
}