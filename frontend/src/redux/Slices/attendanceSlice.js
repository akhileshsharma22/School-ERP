import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as attendanceService from "../../services/attendanceService";

// Check Setup Dependencies
export const fetchAttendanceDependencies = createAsyncThunk(
  "attendance/fetchDependencies",
  async (_, { rejectWithValue }) => {
    try {
      const data = await attendanceService.checkAttendanceDependencies();
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to check dependencies."
      );
    }
  }
);

// Fetch Dashboard totals
export const fetchAttendanceDashboard = createAsyncThunk(
  "attendance/fetchDashboard",
  async (params, { rejectWithValue }) => {
    try {
      const data = await attendanceService.getAttendanceDashboard(params);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch dashboard metrics."
      );
    }
  }
);

// Fetch Student Attendance List
export const fetchStudentAttendance = createAsyncThunk(
  "attendance/fetchStudentList",
  async (params, { rejectWithValue }) => {
    try {
      const data = await attendanceService.getStudentAttendanceList(params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch student list."
      );
    }
  }
);

// Save Student Daily Logs
export const markStudentAttendance = createAsyncThunk(
  "attendance/markStudents",
  async (data, { rejectWithValue }) => {
    try {
      const response = await attendanceService.saveStudentAttendance(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to save daily register."
      );
    }
  }
);

// Clear Student Logs
export const clearStudentAttendance = createAsyncThunk(
  "attendance/clearStudents",
  async (params, { rejectWithValue }) => {
    try {
      const response = await attendanceService.deleteStudentAttendance(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to delete student logs."
      );
    }
  }
);

// Fetch Staff Attendance List
export const fetchStaffAttendance = createAsyncThunk(
  "attendance/fetchStaffList",
  async (params, { rejectWithValue }) => {
    try {
      const data = await attendanceService.getStaffAttendanceList(params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch employee list."
      );
    }
  }
);

// Save Staff Daily Logs
export const markStaffAttendance = createAsyncThunk(
  "attendance/markStaff",
  async (data, { rejectWithValue }) => {
    try {
      const response = await attendanceService.saveStaffAttendance(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to save staff register."
      );
    }
  }
);

// Clear Staff Logs
export const clearStaffAttendance = createAsyncThunk(
  "attendance/clearStaff",
  async (params, { rejectWithValue }) => {
    try {
      const response = await attendanceService.deleteStaffAttendance(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to delete staff logs."
      );
    }
  }
);

// Fetch Reports
export const fetchAttendanceReports = createAsyncThunk(
  "attendance/fetchReports",
  async (params, { rejectWithValue }) => {
    try {
      const data = await attendanceService.getAttendanceReports(params);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch reports."
      );
    }
  }
);

// Fetch Analytics Curves
export const fetchAttendanceAnalytics = createAsyncThunk(
  "attendance/fetchAnalytics",
  async (params, { rejectWithValue }) => {
    try {
      const data = await attendanceService.getAttendanceAnalytics(params);
      return data.analytics;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch analytics."
      );
    }
  }
);

const attendanceSlice = createSlice({
  name: "attendance",
  initialState: {
    setupStatus: {
      hasAcademicYear: false,
      hasClassSection: false,
      hasStudents: false,
      hasStaff: false,
    },
    dashboard: {
      student: { total: 0, present: 0, absent: 0, late: 0, percentage: 100 },
      staff: { total: 0, present: 0, absent: 0, onLeave: 0, percentage: 100 },
    },
    studentList: [],
    studentLogs: [],
    staffList: [],
    staffLogs: [],
    reportsList: [],
    analyticsList: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearAttendanceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Setup Check
      .addCase(fetchAttendanceDependencies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceDependencies.fulfilled, (state, action) => {
        state.loading = false;
        state.setupStatus = action.payload;
      })
      .addCase(fetchAttendanceDependencies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Dashboard
      .addCase(fetchAttendanceDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchAttendanceDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Student List
      .addCase(fetchStudentAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.studentList = action.payload.students || [];
        state.studentLogs = action.payload.attendance || [];
      })
      .addCase(fetchStudentAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Mark Student Attendance
      .addCase(markStudentAttendance.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(markStudentAttendance.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(markStudentAttendance.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // Clear Student Attendance
      .addCase(clearStudentAttendance.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(clearStudentAttendance.fulfilled, (state) => {
        state.saving = false;
        state.studentLogs = [];
      })
      .addCase(clearStudentAttendance.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // Staff List
      .addCase(fetchStaffAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.staffList = action.payload.staffList || [];
        state.staffLogs = action.payload.attendance || [];
      })
      .addCase(fetchStaffAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Mark Staff Attendance
      .addCase(markStaffAttendance.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(markStaffAttendance.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(markStaffAttendance.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // Clear Staff Attendance
      .addCase(clearStaffAttendance.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(clearStaffAttendance.fulfilled, (state) => {
        state.saving = false;
        state.staffLogs = [];
      })
      .addCase(clearStaffAttendance.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // Reports
      .addCase(fetchAttendanceReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reportsList = action.payload || [];
      })
      .addCase(fetchAttendanceReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Analytics
      .addCase(fetchAttendanceAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analyticsList = action.payload || [];
      })
      .addCase(fetchAttendanceAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAttendanceError } = attendanceSlice.actions;
export default attendanceSlice.reducer;
