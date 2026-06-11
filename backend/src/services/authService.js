import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const loginUser = async (
  payload
) => {
  const response = await API.post(
    "/auth/login",
    payload
  );

  return response.data;
};