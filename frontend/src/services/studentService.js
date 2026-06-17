import api from "./api";

// Fetch student list with filters
export const getStudents = async (params) => {
  const response = await api.get("/students", { params });
  return response.data;
};

// Fetch single student profile detail
export const getStudentProfile = async (id) => {
  const response = await api.get(`/students/${id}`);
  return response.data;
};

// Update student profile details
export const updateStudentProfile = async (id, data) => {
  const isFormData = data instanceof FormData;
  const response = await api.put(`/students/${id}`, data, {
    headers: {
      "Content-Type": isFormData ? "multipart/form-data" : "application/json",
    },
  });
  return response.data;
};

// Transfer student (Class, Section change, School leaving TC)
export const transferStudent = async (id, data) => {
  const response = await api.post(`/students/${id}/transfer`, data);
  return response.data;
};

// Delete student permanently (Hard delete)
export const deleteStudent = async (id) => {
  const response = await api.delete(`/students/${id}`);
  return response.data;
};

// Get candidates eligible for promotions
export const getPromotionCandidates = async (params) => {
  const response = await api.get("/promotions/candidates", { params });
  return response.data;
};

// Promote a single student
export const promoteStudent = async (id, data) => {
  const response = await api.post(`/promotions/promote/${id}`, data);
  return response.data;
};

// Bulk promote lists
export const bulkPromoteStudents = async (data) => {
  const response = await api.post("/promotions/bulk-promote", data);
  return response.data;
};

// Fetch promotion histories log
export const getPromotionHistory = async () => {
  const response = await api.get("/promotions/history");
  return response.data;
};
