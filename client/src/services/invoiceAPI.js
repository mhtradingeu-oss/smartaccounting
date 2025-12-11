
import api from './api';

export const invoiceAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/invoices', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/api/invoices/${id}`);
    return response.data;
  },
  create: async (invoice) => {
    const response = await api.post('/api/invoices', invoice);
    return response.data;
  },
  update: async (id, invoice) => {
    const response = await api.put(`/api/invoices/${id}`, invoice);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/invoices/${id}`);
    return response.data;
  },
  downloadPDF: async (id) => {
    const response = await api.get(`/api/invoices/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },
  sendEmail: async (id, emailData) => {
    const response = await api.post(`/api/invoices/${id}/send`, emailData);
    return response.data;
  },
  markAsPaid: async (id, paymentData) => {
    const response = await api.patch(`/api/invoices/${id}/paid`, paymentData);
    return response.data;
  }
};

export default invoiceAPI;
