import api from "./api";

export const getCategories = async () => {
  const response = await api.get(
    "/master/categories"
  );
  return response.data;
};

export const createCategory = async (data) => {
  const response = await api.post(
    "/master/categories",
    data
  );
  return response.data;
};

export const updateCategory = async (id, data) => {
  const response = await api.put(
    `/master/categories/${id}`,
    data
  );
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(
    `/master/categories/${id}`
  );
  return response.data;
};
