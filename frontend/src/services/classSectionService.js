import api from "./api";

export const getClassSections = async () => {
  const response = await api.get(
    "/master/classes-sections"
  );

  return response.data;
};

export const createClassSection = async (
  data
) => {
  const response = await api.post(
    "/master/classes-sections",
    data
  );

  return response.data;
};

export const updateClassSection = async (
  id,
  data
) => {
  const response = await api.put(
    `/master/classes-sections/${id}`,
    data
  );

  return response.data;
};

export const deleteClassSection = async (
  id
) => {
  const response = await api.delete(
    `/master/classes-sections/${id}`
  );

  return response.data;
};
