import API from './api';

const dashboardService = {
  getStats: async () => {
    const response = await API.get('/dashboard/stats');
    return response.data;
  }
};

export default dashboardService;
