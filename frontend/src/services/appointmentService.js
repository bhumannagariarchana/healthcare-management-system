import API from './api';

const appointmentService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.doctor_id) params.append('doctor_id', filters.doctor_id);
    if (filters.patient_id) params.append('patient_id', filters.patient_id);
    if (filters.date_filter) params.append('date_filter', filters.date_filter);
    if (filters.status_filter) params.append('status_filter', filters.status_filter);
    if (filters.search) params.append('search', filters.search);

    const response = await API.get(`/appointments?${params.toString()}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await API.get(`/appointments/${id}`);
    return response.data;
  },
  create: async (appointmentData) => {
    const response = await API.post('/appointments', appointmentData);
    return response.data;
  },
  update: async (id, appointmentData) => {
    const response = await API.put(`/appointments/${id}`, appointmentData);
    return response.data;
  },
  delete: async (id) => {
    // Marks as Cancelled on the backend
    const response = await API.delete(`/appointments/${id}`);
    return response.data;
  }
};

export default appointmentService;
