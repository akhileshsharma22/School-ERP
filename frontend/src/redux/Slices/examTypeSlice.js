import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import * as examTypeService from "../../services/examTypeService";

export const fetchAllExamTypes = createAsyncThunk(
  "examTypes/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const data =
        await examTypeService.getExamTypes();
      console.log("Exam Types API:", data);
      return data.examTypes;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to fetch exam types"
      );
    }
  }
);

export const createExamType = createAsyncThunk(
  "examTypes/create",
  async (payload, { rejectWithValue }) => {
    try {
      const data =
        await examTypeService.createExamType(
          payload
        );

      return data.examType;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to create exam type"
      );
    }
  }
);

export const updateExamType = createAsyncThunk(
  "examTypes/update",
  async (
    { id, data: payload },
    { rejectWithValue }
  ) => {
    try {
      const data =
        await examTypeService.updateExamType(
          id,
          payload
        );

      return data.examType;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to update exam type"
      );
    }
  }
);

export const deleteExamType = createAsyncThunk(
  "examTypes/delete",
  async (id, { rejectWithValue }) => {
    try {
      await examTypeService.deleteExamType(id);

      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to delete exam type"
      );
    }
  }
);

const upsertExamType = (examTypes, examType) => {
  const index = examTypes.findIndex(
    (item) => item._id === examType._id
  );

  if (index >= 0) {
    examTypes[index] = examType;
    return;
  }

  examTypes.push(examType);
};

const examTypeSlice = createSlice({
  name: "examTypes",

  initialState: {
    examTypes: [],
    loading: false,
    saving: false,
    deletingId: null,
    error: null,
  },

  reducers: {
    clearExamTypeError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(
        fetchAllExamTypes.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addCase(
        fetchAllExamTypes.fulfilled,
        (state, action) => {
          state.loading = false;
          state.examTypes = action.payload || [];
        }
      )
      .addCase(
        fetchAllExamTypes.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )
      .addCase(createExamType.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(
        createExamType.fulfilled,
        (state, action) => {
          state.saving = false;
          upsertExamType(
            state.examTypes,
            action.payload
          );
        }
      )
      .addCase(
        createExamType.rejected,
        (state, action) => {
          state.saving = false;
          state.error = action.payload;
        }
      )
      .addCase(updateExamType.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(
        updateExamType.fulfilled,
        (state, action) => {
          state.saving = false;
          upsertExamType(
            state.examTypes,
            action.payload
          );
        }
      )
      .addCase(
        updateExamType.rejected,
        (state, action) => {
          state.saving = false;
          state.error = action.payload;
        }
      )
      .addCase(
        deleteExamType.pending,
        (state, action) => {
          state.deletingId = action.meta.arg;
          state.error = null;
        }
      )
      .addCase(
        deleteExamType.fulfilled,
        (state, action) => {
          state.deletingId = null;
          state.examTypes = state.examTypes.filter(
            (item) => item._id !== action.payload
          );
        }
      )
      .addCase(
        deleteExamType.rejected,
        (state, action) => {
          state.deletingId = null;
          state.error = action.payload;
        }
      );
  },
});

export const { clearExamTypeError } =
  examTypeSlice.actions;

export default examTypeSlice.reducer;
