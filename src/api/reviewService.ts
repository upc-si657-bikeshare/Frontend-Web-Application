import api from './axiosConfig';

export const reviewService = {
  getReviews: async (filters: any = {}) => {
    const response = await api.get('/api/reviews', { params: filters });
    return response.data;
  },

  createReview: async (reviewData: any) => {
    const response = await api.post('/api/reviews', reviewData);
    return response.data;
  }
};
