import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as admissionService from "../../services/admissionService";

export const uploadStudentPortfolioDoc = createAsyncThunk(
  "documents/uploadDoc",
  async ({ formData, onProgress }, { rejectWithValue }) => {
    try {
      const data = await admissionService.uploadDocument(formData, onProgress);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Document upload failed."
      );
    }
  }
);

const documentSlice = createSlice({
  name: "documents",
  initialState: {
    uploading: false,
    progress: 0,
    error: null,
  },
  reducers: {
    clearDocError: (state) => {
      state.error = null;
    },
    resetProgress: (state) => {
      state.progress = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadStudentPortfolioDoc.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadStudentPortfolioDoc.fulfilled, (state) => {
        state.uploading = false;
        state.progress = 100;
      })
      .addCase(uploadStudentPortfolioDoc.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDocError, resetProgress } = documentSlice.actions;
export default documentSlice.reducer;
