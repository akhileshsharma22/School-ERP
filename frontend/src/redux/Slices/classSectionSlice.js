import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import * as classSectionService from "../../services/classSectionService";

export const fetchAllClasses =
  createAsyncThunk(
    "classSections/fetchAll",
    async (_, { rejectWithValue }) => {
      try {
        const data =
          await classSectionService.getClassSections();

        return data.classes;
      } catch (error) {
        return rejectWithValue(
          error?.response?.data?.message ||
            "Failed to fetch classes"
        );
      }
    }
  );

export const createClass = createAsyncThunk(
  "classSections/create",
  async (payload, { rejectWithValue }) => {
    try {
      const data =
        await classSectionService.createClassSection(
          payload
        );

      return data.classSection;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to create class"
      );
    }
  }
);

export const updateClass = createAsyncThunk(
  "classSections/update",
  async (
    { id, data: payload },
    { rejectWithValue }
  ) => {
    try {
      const data =
        await classSectionService.updateClassSection(
          id,
          payload
        );

      return data.classSection;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to update class"
      );
    }
  }
);

export const deleteClass = createAsyncThunk(
  "classSections/delete",
  async (id, { rejectWithValue }) => {
    try {
      await classSectionService.deleteClassSection(
        id
      );

      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to delete class"
      );
    }
  }
);

const upsertClass = (classes, classSection) => {
  const index = classes.findIndex(
    (item) => item._id === classSection._id
  );

  if (index >= 0) {
    classes[index] = classSection;
    return;
  }

  classes.push(classSection);
};

const classSectionSlice = createSlice({
  name: "classSections",

  initialState: {
    classes: [],
    loading: false,
    saving: false,
    deletingId: null,
    error: null,
  },

  reducers: {
    clearClassSectionError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAllClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllClasses.fulfilled,
        (state, action) => {
          state.loading = false;
          state.classes = action.payload || [];
        }
      )
      .addCase(
        fetchAllClasses.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )
      .addCase(createClass.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(
        createClass.fulfilled,
        (state, action) => {
          state.saving = false;
          upsertClass(
            state.classes,
            action.payload
          );
        }
      )
      .addCase(
        createClass.rejected,
        (state, action) => {
          state.saving = false;
          state.error = action.payload;
        }
      )
      .addCase(updateClass.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(
        updateClass.fulfilled,
        (state, action) => {
          state.saving = false;
          upsertClass(
            state.classes,
            action.payload
          );
        }
      )
      .addCase(
        updateClass.rejected,
        (state, action) => {
          state.saving = false;
          state.error = action.payload;
        }
      )
      .addCase(
        deleteClass.pending,
        (state, action) => {
          state.deletingId = action.meta.arg;
          state.error = null;
        }
      )
      .addCase(
        deleteClass.fulfilled,
        (state, action) => {
          state.deletingId = null;
          state.classes = state.classes.filter(
            (item) => item._id !== action.payload
          );
        }
      )
      .addCase(
        deleteClass.rejected,
        (state, action) => {
          state.deletingId = null;
          state.error = action.payload;
        }
      );
  },
});

export const { clearClassSectionError } =
  classSectionSlice.actions;

export default classSectionSlice.reducer;
