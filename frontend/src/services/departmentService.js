import api from "./api";

export const getDepartments = async () => {
  const response = await api.get(
    "/master/departments"
  );
  return response.data;
};

export const createDepartment = async (data) => {
  const response = await api.post(
    "/master/departments",
    data
  );
  return response.data;
};

export const updateDepartment = async (id, data) => {
  const response = await api.put(
    `/master/departments/${id}`,
    data
  );
  return response.data;
};

export const deleteDepartment = async (id) => {
  const response = await api.delete(
    `/master/departments/${id}`
  );
  return response.data;
};
