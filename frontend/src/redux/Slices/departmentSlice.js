import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import * as departmentService from "../../services/departmentService";

export const fetchAllDepartments = createAsyncThunk(
  "departments/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const data =
        await departmentService.getDepartments();

      return data.departments;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to fetch departments"
      );
    }
  }
);

export const createDepartment = createAsyncThunk(
  "departments/create",
  async (payload, { rejectWithValue }) => {
    try {
      const data =
        await departmentService.createDepartment(
          payload
        );

      return data.department;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to create department"
      );
    }
  }
);

export const updateDepartment = createAsyncThunk(
  "departments/update",
  async (
    { id, data: payload },
    { rejectWithValue }
  ) => {
    try {
      const data =
        await departmentService.updateDepartment(
          id,
          payload
        );

      return data.department;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to update department"
      );
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  "departments/delete",
  async (id, { rejectWithValue }) => {
    try {
      await departmentService.deleteDepartment(id);

      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to delete department"
      );
    }
  }
);

const upsertDepartment = (departments, department) => {
  const index = departments.findIndex(
    (item) => item._id === department._id
  );

  if (index >= 0) {
    departments[index] = department;
    return;
  }

  departments.push(department);
};

const departmentSlice = createSlice({
  name: "departments",

  initialState: {
    departments: [],
    loading: false,
    saving: false,
    deletingId: null,
    error: null,
  },

  reducers: {
    clearDepartmentError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(
        fetchAllDepartments.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addCase(
        fetchAllDepartments.fulfilled,
        (state, action) => {
          state.loading = false;
          state.departments = action.payload || [];
        }
      )
      .addCase(
        fetchAllDepartments.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )
      .addCase(
        createDepartment.pending,
        (state) => {
          state.saving = true;
          state.error = null;
        }
      )
      .addCase(
        createDepartment.fulfilled,
        (state, action) => {
          state.saving = false;
          upsertDepartment(
            state.departments,
            action.payload
          );
        }
      )
      .addCase(
        createDepartment.rejected,
        (state, action) => {
          state.saving = false;
          state.error = action.payload;
        }
      )
      .addCase(
        updateDepartment.pending,
        (state) => {
          state.saving = true;
          state.error = null;
        }
      )
      .addCase(
        updateDepartment.fulfilled,
        (state, action) => {
          state.saving = false;
          upsertDepartment(
            state.departments,
            action.payload
          );
        }
      )
      .addCase(
        updateDepartment.rejected,
        (state, action) => {
          state.saving = false;
          state.error = action.payload;
        }
      )
      .addCase(
        deleteDepartment.pending,
        (state, action) => {
          state.deletingId = action.meta.arg;
          state.error = null;
        }
      )
      .addCase(
        deleteDepartment.fulfilled,
        (state, action) => {
          state.deletingId = null;
          state.departments =
            state.departments.filter(
              (item) => item._id !== action.payload
            );
        }
      )
      .addCase(
        deleteDepartment.rejected,
        (state, action) => {
          state.deletingId = null;
          state.error = action.payload;
        }
      );
  },
});

export const { clearDepartmentError } =
  departmentSlice.actions;

export default departmentSlice.reducer;
