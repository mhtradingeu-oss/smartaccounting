import api from './api';

export const companiesAPI = {
  async list() {
    // GET /companies
    const res = await api.get('/companies');
    return res.data;
  },
  // Add more company-related API methods as needed
};
