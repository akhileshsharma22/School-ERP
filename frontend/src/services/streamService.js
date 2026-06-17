import api from "./api";

export const getStreams = async () => {
  const response = await api.get("/master/streams");
  return response.data;
};

export const createStream = async (data) => {
  const response = await api.post(
    "/master/streams",
    data
  );
  return response.data;
};

export const updateStream = async (id, data) => {
  const response = await api.put(
    `/master/streams/${id}`,
    data
  );
  return response.data;
};

export const deleteStream = async (id) => {
  const response = await api.delete(
    `/master/streams/${id}`
  );
  return response.data;
};
