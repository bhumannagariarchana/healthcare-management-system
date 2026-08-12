import API from './api';

const doctorService = {
  getAll: async (search = '') => {
    const response = await API.get(`/doctors?search=${search}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await API.get(`/doctors/${id}`);
    return response.data;
  },
  create: async (doctorData) => {
    const response = await API.post('/doctors', doctorData);
    return response.data;
  },
  update: async (id, doctorData) => {
    const response = await API.put(`/doctors/${id}`, doctorData);
    return response.data;
  },
  delete: async (id) => {
    const response = await API.delete(`/doctors/${id}`);
    return response.data;
  }
};

export default doctorService;
