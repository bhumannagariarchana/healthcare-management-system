import API from './api';

const prescriptionService = {
  getByPatientId: async (patientId) => {
    const response = await API.get(`/prescriptions/${patientId}`);
    return response.data;
  },
  create: async (prescriptionData) => {
    const response = await API.post('/prescriptions', prescriptionData);
    return response.data;
  }
};

export default prescriptionService;
