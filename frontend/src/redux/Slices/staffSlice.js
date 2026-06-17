import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as staffService from "../../services/staffService";

// Setup Check
export const fetchSetupCheck = createAsyncThunk(
  "staff/fetchSetupCheck",
  async (_, { rejectWithValue }) => {
    try {
      const data = await staffService.checkSetupDependencies();
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to check dependencies."
      );
    }
  }
);

// Staff Directory List
export const fetchStaffList = createAsyncThunk(
  "staff/fetchList",
  async (params, { rejectWithValue }) => {
    try {
      const data = await staffService.getStaff(params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch staff list."
      );
    }
  }
);

// Create Staff
export const addStaff = createAsyncThunk(
  "staff/create",
  async (formData, { rejectWithValue }) => {
    try {
      const data = await staffService.createStaff(formData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to add staff member."
      );
    }
  }
);

// Get Single Staff Profile
export const fetchStaffProfile = createAsyncThunk(
  "staff/fetchProfile",
  async (id, { rejectWithValue }) => {
    try {
      const data = await staffService.getStaffProfile(id);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch staff profile."
      );
    }
  }
);

// Update Staff Profile
export const updateStaffProfile = createAsyncThunk(
  "staff/updateProfile",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const data = await staffService.updateStaffProfile(id, formData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to update staff profile."
      );
    }
  }
);

// Delete Staff
export const removeStaff = createAsyncThunk(
  "staff/delete",
  async (id, { rejectWithValue }) => {
    try {
      await staffService.deleteStaff(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to delete staff member."
      );
    }
  }
);

// Fetch Attendance
export const fetchAttendance = createAsyncThunk(
  "staff/fetchAttendance",
  async ({ id, params }, { rejectWithValue }) => {
    try {
      const data = await staffService.getStaffAttendance(id, params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch attendance logs."
      );
    }
  }
);

// Mark Attendance
export const saveAttendance = createAsyncThunk(
  "staff/saveAttendance",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await staffService.markStaffAttendance(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to mark attendance."
      );
    }
  }
);

// Fetch Leave Requests
export const fetchLeaves = createAsyncThunk(
  "staff/fetchLeaves",
  async (id, { rejectWithValue }) => {
    try {
      const data = await staffService.getStaffLeaves(id);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch leave requests."
      );
    }
  }
);

// Create Leave Request
export const submitLeaveRequest = createAsyncThunk(
  "staff/submitLeave",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await staffService.createLeaveRequest(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to submit leave request."
      );
    }
  }
);

// Process Leave (Approve/Reject)
export const processLeaveStatus = createAsyncThunk(
  "staff/processLeave",
  async ({ id, leaveId, data }, { rejectWithValue }) => {
    try {
      const response = await staffService.updateLeaveStatus(id, leaveId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to process leave request."
      );
    }
  }
);

// Fetch Payroll Slips
export const fetchPayroll = createAsyncThunk(
  "staff/fetchPayroll",
  async (id, { rejectWithValue }) => {
    try {
      const data = await staffService.getStaffPayroll(id);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch payroll slips."
      );
    }
  }
);

// Generate Monthly Payroll
export const createPayroll = createAsyncThunk(
  "staff/generatePayroll",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await staffService.generatePayroll(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to generate payroll slip."
      );
    }
  }
);

// Fetch Documents
export const fetchDocuments = createAsyncThunk(
  "staff/fetchDocs",
  async (id, { rejectWithValue }) => {
    try {
      const data = await staffService.getStaffDocuments(id);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch documents."
      );
    }
  }
);

// Upload Document
export const addDocument = createAsyncThunk(
  "staff/uploadDoc",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const data = await staffService.uploadStaffDocument(id, formData);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to upload document."
      );
    }
  }
);

// Replace Document
export const replaceDocument = createAsyncThunk(
  "staff/replaceDoc",
  async ({ id, docId, formData }, { rejectWithValue }) => {
    try {
      const data = await staffService.replaceStaffDocument(id, docId, formData);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to replace document."
      );
    }
  }
);

// Delete Document
export const removeDocument = createAsyncThunk(
  "staff/deleteDoc",
  async ({ id, docId }, { rejectWithValue }) => {
    try {
      await staffService.deleteStaffDocument(id, docId);
      return docId;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to delete document."
      );
    }
  }
);

// Fetch Activity Logs
export const fetchActivityLogs = createAsyncThunk(
  "staff/fetchActivityLogs",
  async (id, { rejectWithValue }) => {
    try {
      const data = await staffService.getStaffActivityLogs(id);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch activity logs."
      );
    }
  }
);

// Fetch All Leaves Across School
export const fetchLeavesAcrossSchool = createAsyncThunk(
  "staff/fetchLeavesAcrossSchool",
  async (_, { rejectWithValue }) => {
    try {
      const data = await staffService.getAllLeaveRequestsAcrossSchool();
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch all leave requests."
      );
    }
  }
);

// Fetch Daily Attendance for Date
export const fetchAttendanceForDate = createAsyncThunk(
  "staff/fetchAttendanceForDate",
  async (params, { rejectWithValue }) => {
    try {
      const data = await staffService.getAllStaffAttendanceForDate(params);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch attendance logs."
      );
    }
  }
);

// Save Bulk Attendance
export const saveBulkAttendance = createAsyncThunk(
  "staff/saveBulkAttendance",
  async (data, { rejectWithValue }) => {
    try {
      const response = await staffService.bulkMarkStaffAttendance(data);
      return response;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to submit bulk attendance."
      );
    }
  }
);

// Fetch All Payroll Across School
export const fetchPayrollAcrossSchool = createAsyncThunk(
  "staff/fetchPayrollAcrossSchool",
  async (params, { rejectWithValue }) => {
    try {
      const data = await staffService.getAllPayrollsAcrossSchool(params);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch payroll register."
      );
    }
  }
);

const staffSlice = createSlice({
  name: "staff",
  initialState: {
    staffList: [],
    metrics: {
      totalStaff: 0,
      teachingStaff: 0,
      nonTeachingStaff: 0,
      activeStaff: 0,
      onLeave: 0,
      newJoinees: 0,
    },
    setupCheck: {
      hasAcademicYear: false,
      hasDepartment: false,
      hasDesignation: false,
    },
    currentStaff: null,
    attendance: {
      logs: [],
      summary: {
        presentDays: 0,
        absentDays: 0,
        lateEntries: 0,
        halfDays: 0,
        holidays: 0,
        attendancePercent: 100,
      },
    },
    leaves: [],
    payrollList: [],
    documents: [],
    activityLogs: [],
    allLeaves: [],
    dailyAttendance: [],
    allPayroll: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearStaffError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Setup Check
      .addCase(fetchSetupCheck.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSetupCheck.fulfilled, (state, action) => {
        state.loading = false;
        state.setupCheck = action.payload.data;
      })
      .addCase(fetchSetupCheck.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Staff List
      .addCase(fetchStaffList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffList.fulfilled, (state, action) => {
        state.loading = false;
        state.staffList = action.payload.data || [];
        state.metrics = action.payload.metrics || state.metrics;
      })
      .addCase(fetchStaffList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add Staff
      .addCase(addStaff.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(addStaff.fulfilled, (state, action) => {
        state.saving = false;
        state.staffList.unshift(action.payload.data);
      })
      .addCase(addStaff.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // Get Single Profile
      .addCase(fetchStaffProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentStaff = null;
      })
      .addCase(fetchStaffProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentStaff = action.payload.data;
      })
      .addCase(fetchStaffProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Staff Profile
      .addCase(updateStaffProfile.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateStaffProfile.fulfilled, (state, action) => {
        state.saving = false;
        state.currentStaff = action.payload.data;
        // Also update in staffList if present
        const index = state.staffList.findIndex((s) => s._id === action.payload.data._id);
        if (index !== -1) {
          state.staffList[index] = action.payload.data;
        }
      })
      .addCase(updateStaffProfile.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // Remove Staff
      .addCase(removeStaff.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(removeStaff.fulfilled, (state, action) => {
        state.saving = false;
        state.staffList = state.staffList.filter((s) => s._id !== action.payload);
        if (state.currentStaff && state.currentStaff._id === action.payload) {
          state.currentStaff = null;
        }
      })
      .addCase(removeStaff.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // Fetch Attendance
      .addCase(fetchAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.attendance.logs = action.payload.logs || [];
        state.attendance.summary = action.payload.summary || state.attendance.summary;
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Mark Attendance
      .addCase(saveAttendance.fulfilled, (state, action) => {
        const index = state.attendance.logs.findIndex((l) => l._id === action.payload._id);
        if (index !== -1) {
          state.attendance.logs[index] = action.payload;
        } else {
          state.attendance.logs.push(action.payload);
        }
      })

      // Fetch Leaves
      .addCase(fetchLeaves.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.leaves = action.payload.leaves || [];
      })
      .addCase(fetchLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Submit Leave
      .addCase(submitLeaveRequest.fulfilled, (state, action) => {
        state.leaves.unshift(action.payload);
      })

      // Process Leave
      .addCase(processLeaveStatus.fulfilled, (state, action) => {
        const index = state.leaves.findIndex((l) => l._id === action.payload._id);
        if (index !== -1) {
          state.leaves[index] = action.payload;
        }
        if (state.currentStaff && state.currentStaff._id === action.payload.staff && action.payload.status === "Approved") {
          state.currentStaff.status = "On Leave";
        }
      })

      // Fetch Payroll
      .addCase(fetchPayroll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayroll.fulfilled, (state, action) => {
        state.loading = false;
        state.payrollList = action.payload.payrolls || [];
      })
      .addCase(fetchPayroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Payroll
      .addCase(createPayroll.fulfilled, (state, action) => {
        const index = state.payrollList.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.payrollList[index] = action.payload;
        } else {
          state.payrollList.unshift(action.payload);
        }
      })

      // Fetch Documents
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload.documents || [];
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add Document
      .addCase(addDocument.fulfilled, (state, action) => {
        state.documents.unshift(action.payload);
      })

      // Replace Document
      .addCase(replaceDocument.fulfilled, (state, action) => {
        const index = state.documents.findIndex((d) => d._id === action.payload._id);
        if (index !== -1) {
          state.documents[index] = action.payload;
        }
      })

      // Remove Document
      .addCase(removeDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter((d) => d._id !== action.payload);
      })

      // Fetch Activity Logs
      .addCase(fetchActivityLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.activityLogs = action.payload.logs || [];
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Leaves Across School
      .addCase(fetchLeavesAcrossSchool.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeavesAcrossSchool.fulfilled, (state, action) => {
        state.loading = false;
        state.allLeaves = action.payload || [];
      })
      .addCase(fetchLeavesAcrossSchool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Attendance for Date
      .addCase(fetchAttendanceForDate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceForDate.fulfilled, (state, action) => {
        state.loading = false;
        state.dailyAttendance = action.payload || [];
      })
      .addCase(fetchAttendanceForDate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Save Bulk Attendance
      .addCase(saveBulkAttendance.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveBulkAttendance.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(saveBulkAttendance.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })

      // Fetch Payroll Across School
      .addCase(fetchPayrollAcrossSchool.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayrollAcrossSchool.fulfilled, (state, action) => {
        state.loading = false;
        state.allPayroll = action.payload || [];
      })
      .addCase(fetchPayrollAcrossSchool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearStaffError } = staffSlice.actions;
export default staffSlice.reducer;
