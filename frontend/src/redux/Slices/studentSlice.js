import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as studentService from "../../services/studentService";

export const fetchStudents = createAsyncThunk(
  "students/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const data = await studentService.getStudents(params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch student list."
      );
    }
  }
);

export const removeStudent = createAsyncThunk(
  "students/delete",
  async (id, { rejectWithValue }) => {
    try {
      await studentService.deleteStudent(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to delete student record."
      );
    }
  }
);

const studentSlice = createSlice({
  name: "students",
  initialState: {
    students: [],
    metrics: {
      totalStudents: 0,
      activeStudents: 0,
      boysCount: 0,
      girlsCount: 0,
      transferredCount: 0,
      passedOutCount: 0,
      avgAttendance: 85,
      feePendingCount: 0,
    },
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearStudentError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload.data || [];
        state.metrics = action.payload.metrics || {
          totalStudents: 0,
          activeStudents: 0,
          boysCount: 0,
          girlsCount: 0,
          transferredCount: 0,
          passedOutCount: 0,
          avgAttendance: 85,
          feePendingCount: 0,
        };
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(removeStudent.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(removeStudent.fulfilled, (state, action) => {
        state.saving = false;
        state.students = state.students.filter((s) => s._id !== action.payload);
      })
      .addCase(removeStudent.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const { clearStudentError } = studentSlice.actions;
export default studentSlice.reducer;
