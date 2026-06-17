import api from "./api";

export const checkSetupDependencies = async () => {
  const response = await api.get("/admissions/applications/setup-check");
  return response.data;
};

export const getAdmissions = async (params) => {
  const response = await api.get("/admissions/applications", { params });
  return response.data;
};

export const createAdmission = async (data) => {
  const response = await api.post("/admissions/applications", data);
  return response.data;
};

export const uploadDocument = async (formData, onUploadProgress) => {
  const response = await api.post("/admissions/applications/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });
  return response.data;
};

export const verifyAdmission = async (id, data) => {
  const response = await api.put(`/admissions/applications/${id}/verify`, data);
  return response.data;
};

export const approveAdmission = async (id, data) => {
  const response = await api.post(`/admissions/applications/${id}/approve`, data);
  return response.data;
};
