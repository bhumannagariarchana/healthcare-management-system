import API from './api';

const patientService = {
  getAll: async (search = '') => {
    const response = await API.get(`/patients?search=${search}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await API.get(`/patients/${id}`);
    return response.data;
  },
  create: async (patientData) => {
    const response = await API.post('/patients', patientData);
    return response.data;
  },
  update: async (id, patientData) => {
    const response = await API.put(`/patients/${id}`, patientData);
    return response.data;
  },
  delete: async (id) => {
    const response = await API.delete(`/patients/${id}`);
    return response.data;
  }
};

export default patientService;
