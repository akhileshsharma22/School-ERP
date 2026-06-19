import { createSlice } from "@reduxjs/toolkit";

const savedUser = localStorage.getItem("user");
const savedToken = localStorage.getItem("token");

const initialState = {
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken || null,
  isAuthenticated: !!savedToken,
  sessionExpired: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.isAuthenticated = true;
      state.sessionExpired = false;

      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("token", action.payload.accessToken);

      if (action.payload.refreshToken) {
        localStorage.setItem("refreshToken", action.payload.refreshToken);
      }
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.sessionExpired = false;

      // Clear all auth-related storage
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("permissions");
      sessionStorage.clear();
    },

    sessionExpired: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.sessionExpired = true;

      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("permissions");
      sessionStorage.clear();
    },
  },
});

export const { loginSuccess, logout, sessionExpired } = authSlice.actions;

export default authSlice.reducer;