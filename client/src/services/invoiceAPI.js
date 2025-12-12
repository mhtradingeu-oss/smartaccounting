
import api from './api';

export const invoiceAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/invoices', { params });
    return response.data;
  },
  create: async (invoice) => {
    const response = await api.post('/invoices', invoice);
    return response.data;
  },
  update: async (id, invoice) => {
    const response = await api.put(`/invoices/${id}`, invoice);
    return response.data;
  },
};

export default invoiceAPI;
