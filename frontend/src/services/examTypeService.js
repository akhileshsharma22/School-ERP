import api from "./api";

export const getExamTypes = async () => {
  const response = await api.get(
    "/master/exam-types"
  );
  return response.data;
};

export const createExamType = async (data) => {
  const response = await api.post(
    "/master/exam-types",
    data
  );
  return response.data;
};

export const updateExamType = async (id, data) => {
  const response = await api.put(
    `/master/exam-types/${id}`,
    data
  );
  return response.data;
};

export const deleteExamType = async (id) => {
  const response = await api.delete(
    `/master/exam-types/${id}`
  );
  return response.data;
};
