import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as studentService from "../../services/studentService";

export const fetchPromotionCandidates = createAsyncThunk(
  "promotions/fetchCandidates",
  async (params, { rejectWithValue }) => {
    try {
      const data = await studentService.getPromotionCandidates(params);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch promotion candidates."
      );
    }
  }
);

export const promoteCandidate = createAsyncThunk(
  "promotions/promoteSingle",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await studentService.promoteStudent(id, data);
      return { id, updatedRecord: response.data };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to promote student."
      );
    }
  }
);

export const bulkPromote = createAsyncThunk(
  "promotions/promoteBulk",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await studentService.bulkPromoteStudents(payload);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to run bulk promotion."
      );
    }
  }
);

export const fetchPromotionHistory = createAsyncThunk(
  "promotions/fetchHistory",
  async (_, { rejectWithValue }) => {
    try {
      const data = await studentService.getPromotionHistory();
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch promotion history logs."
      );
    }
  }
);

const promotionSlice = createSlice({
  name: "promotions",
  initialState: {
    candidates: [],
    historyLogs: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearPromotionError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPromotionCandidates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPromotionCandidates.fulfilled, (state, action) => {
        state.loading = false;
        state.candidates = action.payload || [];
      })
      .addCase(fetchPromotionCandidates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(promoteCandidate.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(promoteCandidate.fulfilled, (state, action) => {
        state.saving = false;
        state.candidates = state.candidates.filter((c) => c._id !== action.payload.id);
      })
      .addCase(promoteCandidate.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(bulkPromote.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(bulkPromote.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(bulkPromote.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(fetchPromotionHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPromotionHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.historyLogs = action.payload || [];
      })
      .addCase(fetchPromotionHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPromotionError } = promotionSlice.actions;
export default promotionSlice.reducer;
