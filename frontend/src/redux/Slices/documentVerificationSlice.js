import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as admissionService from "../../services/admissionService";
import { fetchAdmissions } from "./admissionSlice";

export const verifyApplication = createAsyncThunk(
  "documentVerification/verify",
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      const response = await admissionService.verifyAdmission(id, data);
      // Refresh list to sync changes
      dispatch(fetchAdmissions());
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to submit document verification"
      );
    }
  }
);

const documentVerificationSlice = createSlice({
  name: "documentVerification",
  initialState: {
    verifying: false,
    error: null,
  },
  reducers: {
    clearVerificationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(verifyApplication.pending, (state) => {
        state.verifying = true;
        state.error = null;
      })
      .addCase(verifyApplication.fulfilled, (state) => {
        state.verifying = false;
      })
      .addCase(verifyApplication.rejected, (state, action) => {
        state.verifying = false;
        state.error = action.payload;
      });
  },
});

export const { clearVerificationError } = documentVerificationSlice.actions;
export default documentVerificationSlice.reducer;
