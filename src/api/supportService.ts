import api from './axiosConfig';

export const supportService = {
  getTickets: async (userId: number) => {
    const response = await api.get('/api/support-tickets', { params: { userId } });
    return response.data;
  },

  createTicket: async (ticketData: any) => {
    const response = await api.post('/api/support-tickets', ticketData);
    return response.data;
  }
};
