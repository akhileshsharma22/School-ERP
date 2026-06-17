import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as admissionService from "../../services/admissionService";

export const fetchSetupDependencies = createAsyncThunk(
  "admissions/fetchSetupDependencies",
  async (_, { rejectWithValue }) => {
    try {
      const data = await admissionService.checkSetupDependencies();
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to verify Master Setup"
      );
    }
  }
);

export const fetchAdmissions = createAsyncThunk(
  "admissions/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const data = await admissionService.getAdmissions(params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch admissions list"
      );
    }
  }
);

export const createAdmission = createAsyncThunk(
  "admissions/create",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await admissionService.createAdmission(payload);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to submit admission application"
      );
    }
  }
);

export const approveAdmission = createAsyncThunk(
  "admissions/approve",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await admissionService.approveAdmission(id, data);
      return { id, details: response.data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to approve admission"
      );
    }
  }
);

const admissionSlice = createSlice({
  name: "admissions",
  initialState: {
    admissions: [],
    metrics: {
      totalCount: 0,
      pendingVerification: 0,
      approvedCount: 0,
      rejectedCount: 0,
      todayEnquiries: 0,
    },
    setupStatus: {
      hasAcademicYear: false,
      hasClassSection: false,
      hasCategory: false,
      hasStream: false,
      loading: false,
      error: null,
    },
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearAdmissionError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSetupDependencies.pending, (state) => {
        state.setupStatus.loading = true;
        state.setupStatus.error = null;
      })
      .addCase(fetchSetupDependencies.fulfilled, (state, action) => {
        state.setupStatus.loading = false;
        state.setupStatus.hasAcademicYear = action.payload.hasAcademicYear;
        state.setupStatus.hasClassSection = action.payload.hasClassSection;
        state.setupStatus.hasCategory = action.payload.hasCategory;
        state.setupStatus.hasStream = action.payload.hasStream;
      })
      .addCase(fetchSetupDependencies.rejected, (state, action) => {
        state.setupStatus.loading = false;
        state.setupStatus.error = action.payload;
      })
      .addCase(fetchAdmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdmissions.fulfilled, (state, action) => {
        state.loading = false;
        state.admissions = action.payload.data || [];
        state.metrics = action.payload.metrics || {
          totalCount: 0,
          pendingVerification: 0,
          approvedCount: 0,
          rejectedCount: 0,
          todayEnquiries: 0,
        };
      })
      .addCase(fetchAdmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createAdmission.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createAdmission.fulfilled, (state, action) => {
        state.saving = false;
        state.admissions.unshift(action.payload);
      })
      .addCase(createAdmission.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(approveAdmission.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(approveAdmission.fulfilled, (state, action) => {
        state.saving = false;
        const index = state.admissions.findIndex((a) => a._id === action.payload.id);
        if (index !== -1) {
          state.admissions[index].approvalStatus = "Approved";
          state.admissions[index].admissionNo = action.payload.details.admissionNo;
          state.admissions[index].studentId = action.payload.details.studentId;
        }
      })
      .addCase(approveAdmission.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdmissionError } = admissionSlice.actions;
export default admissionSlice.reducer;
