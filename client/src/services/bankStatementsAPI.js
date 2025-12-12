import api from './api';

const inferFormat = (filename = '') => {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'csv' || ext === 'txt') {return 'CSV';}
  if (ext === 'mt940') {return 'MT940';}
  if (ext === 'xml' || ext === 'camt053') {return 'CAMT053';}
  return null;
};

export const bankStatementsAPI = {
  list: async () => {
    const response = await api.get('/bank-statements');
    return response.data;
  },
  upload: async (file) => {
    const format = inferFormat(file?.name);
    if (!file || !format) {
      throw new Error('Unsupported bank statement format for v0.1');
    }

    const formData = new FormData();
    formData.append('bankStatement', file);
    formData.append('format', format);

    const response = await api.post('/bank-statements/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  transactions: async (statementId) => {
    const response = await api.get(`/bank-statements/${statementId}/transactions`);
    return response.data;
  },
};

export default bankStatementsAPI;
