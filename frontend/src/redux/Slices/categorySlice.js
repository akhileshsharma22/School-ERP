import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import * as categoryService from "../../services/categoryService";

export const fetchAllCategories = createAsyncThunk(
  "categories/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const data =
        await categoryService.getCategories();

      return data.categories;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to fetch categories"
      );
    }
  }
);

export const createCategory = createAsyncThunk(
  "categories/create",
  async (payload, { rejectWithValue }) => {
    try {
      const data =
        await categoryService.createCategory(
          payload
        );

      return data.category;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to create category"
      );
    }
  }
);

export const updateCategory = createAsyncThunk(
  "categories/update",
  async (
    { id, data: payload },
    { rejectWithValue }
  ) => {
    try {
      const data =
        await categoryService.updateCategory(
          id,
          payload
        );

      return data.category;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to update category"
      );
    }
  }
);

export const deleteCategory = createAsyncThunk(
  "categories/delete",
  async (id, { rejectWithValue }) => {
    try {
      await categoryService.deleteCategory(id);

      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to delete category"
      );
    }
  }
);

const upsertCategory = (categories, category) => {
  const index = categories.findIndex(
    (item) => item._id === category._id
  );

  if (index >= 0) {
    categories[index] = category;
    return;
  }

  categories.push(category);
};

const categorySlice = createSlice({
  name: "categories",

  initialState: {
    categories: [],
    loading: false,
    saving: false,
    deletingId: null,
    error: null,
  },

  reducers: {
    clearCategoryError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(
        fetchAllCategories.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addCase(
        fetchAllCategories.fulfilled,
        (state, action) => {
          state.loading = false;
          state.categories = action.payload || [];
        }
      )
      .addCase(
        fetchAllCategories.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )
      .addCase(createCategory.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(
        createCategory.fulfilled,
        (state, action) => {
          state.saving = false;
          upsertCategory(
            state.categories,
            action.payload
          );
        }
      )
      .addCase(
        createCategory.rejected,
        (state, action) => {
          state.saving = false;
          state.error = action.payload;
        }
      )
      .addCase(updateCategory.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(
        updateCategory.fulfilled,
        (state, action) => {
          state.saving = false;
          upsertCategory(
            state.categories,
            action.payload
          );
        }
      )
      .addCase(
        updateCategory.rejected,
        (state, action) => {
          state.saving = false;
          state.error = action.payload;
        }
      )
      .addCase(
        deleteCategory.pending,
        (state, action) => {
          state.deletingId = action.meta.arg;
          state.error = null;
        }
      )
      .addCase(
        deleteCategory.fulfilled,
        (state, action) => {
          state.deletingId = null;
          state.categories =
            state.categories.filter(
              (item) => item._id !== action.payload
            );
        }
      )
      .addCase(
        deleteCategory.rejected,
        (state, action) => {
          state.deletingId = null;
          state.error = action.payload;
        }
      );
  },
});

export const { clearCategoryError } =
  categorySlice.actions;

export default categorySlice.reducer;
