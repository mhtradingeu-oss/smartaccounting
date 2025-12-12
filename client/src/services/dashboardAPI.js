
import api from './api';


export const dashboardAPI = {
  getStats: async () => {
    try {
      const response = await api.get('/dashboard/stats');
      // 501 handled in catch
      if (response.data && response.data.status === 'ok') {
        return { data: response.data.data };
      }
      // If no data, treat as empty
      return { data: null };
    } catch (err) {
      if (err.response && err.response.status === 501) {
        // Feature disabled
        return { disabled: true };
      }
      // All other errors
      throw err;
    }
  },
};

export default dashboardAPI;