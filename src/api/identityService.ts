import api from './axiosConfig';

export const identityService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  register: async (registerData: any) => {
    const response = await api.post('/api/auth/register', registerData);
    return response.data;
  },

  getProfile: async (userId: number) => {
    const response = await api.get(`/api/profiles/user/${userId}`);
    return response.data;
  },

  updateRenterProfile: async (userId: number, data: any) => {
    const response = await api.put(`/api/profiles/renter/${userId}`, data);
    return response.data;
  },

  updateOwnerProfile: async (userId: number, data: any) => {
    const response = await api.put(`/api/profiles/owner/${userId}`, data);
    return response.data;
  },
  changePassword: async (userId: number, data: any) => {
    const response = await api.put(`/api/auth/change-password/${userId}`, data);
    return response.data;
  },
  forceResetPassword: async (email: string, newPassword: string) => {
    const response = await api.post('/api/auth/force-reset-password', { email, newPassword });
    return response.data;
  }
};
