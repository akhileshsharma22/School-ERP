import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true,
});

export const loginUser = async (data) => {
  const response = await API.post("/auth/login", data);
  return response.data;
};

export default API;
