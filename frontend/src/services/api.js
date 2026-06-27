import axios from "axios";
import { toast } from "sonner";
import { sessionExpired } from "../redux/slices/authSlice";

let store;

export const injectStore = (_store) => {
  store = _store;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (store) {
        store.dispatch(sessionExpired());
      } else {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("permissions");
        sessionStorage.clear();
      }
      toast.error("Session expired. Please login again.");
    } else if (error.response && error.response.status === 403) {
      window.location.href = "/unauthorized";
    }
    return Promise.reject(error);
  }
);

export default api;