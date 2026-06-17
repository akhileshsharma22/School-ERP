import api from "./api";

export const getEnquiries = async (params) => {
  const response = await api.get("/admissions/enquiries", { params });
  return response.data;
};

export const createEnquiry = async (data) => {
  const response = await api.post("/admissions/enquiries", data);
  return response.data;
};

export const updateEnquiry = async (id, data) => {
  const response = await api.put(`/admissions/enquiries/${id}`, data);
  return response.data;
};

export const convertEnquiry = async (id) => {
  const response = await api.post(`/admissions/enquiries/${id}/convert`);
  return response.data;
};
