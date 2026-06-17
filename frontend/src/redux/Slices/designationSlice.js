import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import * as designationService from "../../services/designationService";

export const fetchAllDesignations = createAsyncThunk(
  "designations/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const data =
        await designationService.getDesignations();

      return data.designations;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to fetch designations"
      );
    }
  }
);

export const createDesignation = createAsyncThunk(
  "designations/create",
  async (payload, { rejectWithValue }) => {
    try {
      const data =
        await designationService.createDesignation(
          payload
        );

      return data.designation;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to create designation"
      );
    }
  }
);

export const updateDesignation = createAsyncThunk(
  "designations/update",
  async (
    { id, data: payload },
    { rejectWithValue }
  ) => {
    try {
      const data =
        await designationService.updateDesignation(
          id,
          payload
        );

      return data.designation;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to update designation"
      );
    }
  }
);

export const deleteDesignation = createAsyncThunk(
  "designations/delete",
  async (id, { rejectWithValue }) => {
    try {
      await designationService.deleteDesignation(id);

      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to delete designation"
      );
    }
  }
);

const upsertDesignation = (
  designations,
  designation
) => {
  const index = designations.findIndex(
    (item) => item._id === designation._id
  );

  if (index >= 0) {
    designations[index] = designation;
    return;
  }

  designations.push(designation);
};

const designationSlice = createSlice({
  name: "designations",

  initialState: {
    designations: [],
    loading: false,
    saving: false,
    deletingId: null,
    error: null,
  },

  reducers: {
    clearDesignationError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(
        fetchAllDesignations.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addCase(
        fetchAllDesignations.fulfilled,
        (state, action) => {
          state.loading = false;
          state.designations =
            action.payload || [];
        }
      )
      .addCase(
        fetchAllDesignations.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )
      .addCase(
        createDesignation.pending,
        (state) => {
          state.saving = true;
          state.error = null;
        }
      )
      .addCase(
        createDesignation.fulfilled,
        (state, action) => {
          state.saving = false;
          upsertDesignation(
            state.designations,
            action.payload
          );
        }
      )
      .addCase(
        createDesignation.rejected,
        (state, action) => {
          state.saving = false;
          state.error = action.payload;
        }
      )
      .addCase(
        updateDesignation.pending,
        (state) => {
          state.saving = true;
          state.error = null;
        }
      )
      .addCase(
        updateDesignation.fulfilled,
        (state, action) => {
          state.saving = false;
          upsertDesignation(
            state.designations,
            action.payload
          );
        }
      )
      .addCase(
        updateDesignation.rejected,
        (state, action) => {
          state.saving = false;
          state.error = action.payload;
        }
      )
      .addCase(
        deleteDesignation.pending,
        (state, action) => {
          state.deletingId = action.meta.arg;
          state.error = null;
        }
      )
      .addCase(
        deleteDesignation.fulfilled,
        (state, action) => {
          state.deletingId = null;
          state.designations =
            state.designations.filter(
              (item) => item._id !== action.payload
            );
        }
      )
      .addCase(
        deleteDesignation.rejected,
        (state, action) => {
          state.deletingId = null;
          state.error = action.payload;
        }
      );
  },
});

export const { clearDesignationError } =
  designationSlice.actions;

export default designationSlice.reducer;
