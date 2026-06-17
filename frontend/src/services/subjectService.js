import api from "./api";

export const getSubjects = async () => {
  const response = await api.get("/master/subjects");
  return response.data;
};

export const createSubject = async (data) => {
  const response = await api.post(
    "/master/subjects",
    data
  );
  return response.data;
};

export const updateSubject = async (id, data) => {
  const response = await api.put(
    `/master/subjects/${id}`,
    data
  );
  return response.data;
};

export const deleteSubject = async (id) => {
  const response = await api.delete(
    `/master/subjects/${id}`
  );
  return response.data;
};
