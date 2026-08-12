import API from './api';

const authService = {
  login: async (username, password) => {
    const response = await API.post('/login', { username, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify({
        username: response.data.username,
        role: response.data.role,
        user_id: response.data.user_id
      }));
    }
    return response.data;
  },

  register: async (patientData) => {
    const response = await API.post('/register', patientData);
    return response.data;
  },

  logout: async () => {
    try {
      await API.post('/logout');
    } catch (e) {
      console.warn("Logout endpoint error: ", e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getMe: async () => {
    const response = await API.get('/me');
    return response.data;
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  // Receptionist management (Admin only)
  getReceptionists: async () => {
    const response = await API.get('/receptionists');
    return response.data;
  },

  createReceptionist: async (username, password) => {
    const response = await API.post('/receptionists', { username, password });
    return response.data;
  },

  deleteReceptionist: async (id) => {
    const response = await API.delete(`/receptionists/${id}`);
    return response.data;
  }
};

export default authService;
