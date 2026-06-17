import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as studentService from "../../services/studentService";

export const fetchStudentProfile = createAsyncThunk(
  "studentProfile/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const data = await studentService.getStudentProfile(id);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch student profile."
      );
    }
  }
);

export const updateStudentProfile = createAsyncThunk(
  "studentProfile/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await studentService.updateStudentProfile(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to update student profile."
      );
    }
  }
);

export const processTransfer = createAsyncThunk(
  "studentProfile/transfer",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await studentService.transferStudent(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to process student transfer."
      );
    }
  }
);

const studentProfileSlice = createSlice({
  name: "studentProfile",
  initialState: {
    student: null,
    invoices: [],
    attendanceLogs: [],
    activityLogs: [],
    examResults: [],
    attendanceSummary: {
      totalWorking: 0,
      present: 0,
      absent: 0,
      late: 0,
      attendancePercent: 0,
    },
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearProfileError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudentProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.student = action.payload.student;
        state.invoices = action.payload.invoices || [];
        state.attendanceLogs = action.payload.attendanceLogs || [];
        state.activityLogs = action.payload.activityLogs || [];
        state.examResults = action.payload.examResults || [];
        state.attendanceSummary = action.payload.attendanceSummary || {
          totalWorking: 0,
          present: 0,
          absent: 0,
          late: 0,
          attendancePercent: 0,
        };
      })
      .addCase(fetchStudentProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateStudentProfile.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateStudentProfile.fulfilled, (state, action) => {
        state.saving = false;
        state.student = action.payload;
      })
      .addCase(updateStudentProfile.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(processTransfer.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(processTransfer.fulfilled, (state, action) => {
        state.saving = false;
        state.student = action.payload;
      })
      .addCase(processTransfer.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const { clearProfileError } = studentProfileSlice.actions;
export default studentProfileSlice.reducer;
