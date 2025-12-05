import api from './axiosConfig';

export const bookingService = {
  getReservations: async (filters: any = {}) => {
    const response = await api.get('/api/reservations', { params: filters });
    return response.data;
  },

  getReservationById: async (id: number) => {
    const response = await api.get(`/api/reservations/${id}`);
    return response.data;
  },

  createReservation: async (reservationData: any) => {
    const response = await api.post('/api/reservations', reservationData);
    return response.data;
  },

  updateStatus: async (id: number, newStatus: string) => {
    const response = await api.patch(`/api/reservations/${id}/status`, { newStatus });
    return response.data;
  }
};
