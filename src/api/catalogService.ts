import api from './axiosConfig';

export const catalogService = {
  getAllBikes: async (filters: any = {}) => {
    const response = await api.get('/api/bikes', { params: filters });
    return response.data;
  },

  getBikeById: async (id: number) => {
    const response = await api.get(`/api/bikes/${id}`);
    return response.data;
  },

  createBike: async (bikeData: any) => {
    const response = await api.post('/api/bikes', bikeData);
    return response.data;
  },

  updateBike: async (id: number, bikeData: any) => {
    const response = await api.patch(`/api/bikes/${id}`, bikeData);
    return response.data;
  },

  deleteBike: async (id: number) => {
    await api.delete(`/api/bikes/${id}`);
  }
};
