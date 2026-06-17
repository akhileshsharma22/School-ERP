import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as dashboardService from "../../services/dashboardService";

export const fetchDashboardSummary = createAsyncThunk(
  "dashboard/fetchSummary",
  async (academicYearId, { rejectWithValue }) => {
    try {
      const data = await dashboardService.getDashboardSummary(academicYearId);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const searchDashboardData = createAsyncThunk(
  "dashboard/search",
  async ({ query, academicYearId }, { rejectWithValue }) => {
    try {
      const data = await dashboardService.searchDashboard(query, academicYearId);
      return data.results;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    summary: null,
    searchResults: { students: [], staff: [], admissions: [], finance: [], exams: [] },
    loading: false,
    searchLoading: false,
    error: null,
    searchError: null
  },
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = { students: [], staff: [], admissions: [], finance: [], exams: [] };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Dashboard Summary
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // Search Dashboard Data
      .addCase(searchDashboardData.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchDashboardData.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchDashboardData.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload || action.error.message;
      });
  }
});

export const { clearSearchResults } = dashboardSlice.actions;
export default dashboardSlice.reducer;
