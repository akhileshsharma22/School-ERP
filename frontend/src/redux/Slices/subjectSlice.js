import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import * as subjectService from "../../services/subjectService";

export const fetchAllSubjects = createAsyncThunk(
  "subjects/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const data =
        await subjectService.getSubjects();

      return data.subjects;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to fetch subjects"
      );
    }
  }
);

export const createSubject = createAsyncThunk(
  "subjects/create",
  async (payload, { rejectWithValue }) => {
    try {
      const data =
        await subjectService.createSubject(payload);

      return data.subject;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to create subject"
      );
    }
  }
);

export const updateSubject = createAsyncThunk(
  "subjects/update",
  async (
    { id, data: payload },
    { rejectWithValue }
  ) => {
    try {
      const data =
        await subjectService.updateSubject(
          id,
          payload
        );

      return data.subject;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to update subject"
      );
    }
  }
);

export const deleteSubject = createAsyncThunk(
  "subjects/delete",
  async (id, { rejectWithValue }) => {
    try {
      await subjectService.deleteSubject(id);

      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to delete subject"
      );
    }
  }
);

const upsertSubject = (subjects, subject) => {
  const index = subjects.findIndex(
    (item) => item._id === subject._id
  );

  if (index >= 0) {
    subjects[index] = subject;
    return;
  }

  subjects.push(subject);
};

const subjectSlice = createSlice({
  name: "subjects",

  initialState: {
    subjects: [],
    loading: false,
    saving: false,
    deletingId: null,
    error: null,
  },

  reducers: {
    clearSubjectError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(
        fetchAllSubjects.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addCase(
        fetchAllSubjects.fulfilled,
        (state, action) => {
          state.loading = false;
          state.subjects = action.payload || [];
        }
      )
      .addCase(
        fetchAllSubjects.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )
      .addCase(createSubject.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(
        createSubject.fulfilled,
        (state, action) => {
          state.saving = false;
          upsertSubject(
            state.subjects,
            action.payload
          );
        }
      )
      .addCase(
        createSubject.rejected,
        (state, action) => {
          state.saving = false;
          state.error = action.payload;
        }
      )
      .addCase(updateSubject.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(
        updateSubject.fulfilled,
        (state, action) => {
          state.saving = false;
          upsertSubject(
            state.subjects,
            action.payload
          );
        }
      )
      .addCase(
        updateSubject.rejected,
        (state, action) => {
          state.saving = false;
          state.error = action.payload;
        }
      )
      .addCase(
        deleteSubject.pending,
        (state, action) => {
          state.deletingId = action.meta.arg;
          state.error = null;
        }
      )
      .addCase(
        deleteSubject.fulfilled,
        (state, action) => {
          state.deletingId = null;
          state.subjects = state.subjects.filter(
            (item) => item._id !== action.payload
          );
        }
      )
      .addCase(
        deleteSubject.rejected,
        (state, action) => {
          state.deletingId = null;
          state.error = action.payload;
        }
      );
  },
});

export const { clearSubjectError } =
  subjectSlice.actions;

export default subjectSlice.reducer;
