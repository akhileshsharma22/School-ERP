import api from "./api";

export const getDesignations = async () => {
  const response = await api.get(
    "/master/designations"
  );
  return response.data;
};

export const createDesignation = async (data) => {
  const response = await api.post(
    "/master/designations",
    data
  );
  return response.data;
};

export const updateDesignation = async (
  id,
  data
) => {
  const response = await api.put(
    `/master/designations/${id}`,
    data
  );
  return response.data;
};

export const deleteDesignation = async (id) => {
  const response = await api.delete(
    `/master/designations/${id}`
  );
  return response.data;
};
