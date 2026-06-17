import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as enquiryService from "../../services/enquiryService";

export const fetchEnquiries = createAsyncThunk(
  "enquiries/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const data = await enquiryService.getEnquiries(params);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch enquiries"
      );
    }
  }
);

export const createEnquiry = createAsyncThunk(
  "enquiries/create",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await enquiryService.createEnquiry(payload);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to capture enquiry"
      );
    }
  }
);

export const updateEnquiry = createAsyncThunk(
  "enquiries/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await enquiryService.updateEnquiry(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to update enquiry"
      );
    }
  }
);

export const convertEnquiry = createAsyncThunk(
  "enquiries/convert",
  async (id, { rejectWithValue }) => {
    try {
      const data = await enquiryService.convertEnquiry(id);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to convert enquiry"
      );
    }
  }
);

const enquirySlice = createSlice({
  name: "enquiries",
  initialState: {
    enquiries: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearEnquiryError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnquiries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnquiries.fulfilled, (state, action) => {
        state.loading = false;
        state.enquiries = action.payload || [];
      })
      .addCase(fetchEnquiries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createEnquiry.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createEnquiry.fulfilled, (state, action) => {
        state.saving = false;
        state.enquiries.unshift(action.payload);
      })
      .addCase(createEnquiry.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(updateEnquiry.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateEnquiry.fulfilled, (state, action) => {
        state.saving = false;
        const index = state.enquiries.findIndex((e) => e._id === action.payload._id);
        if (index !== -1) {
          state.enquiries[index] = action.payload;
        }
      })
      .addCase(updateEnquiry.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(convertEnquiry.fulfilled, (state, action) => {
        const index = state.enquiries.findIndex((e) => e._id === action.payload._id);
        if (index !== -1) {
          state.enquiries[index].status = "Converted";
        }
      });
  },
});

export const { clearEnquiryError } = enquirySlice.actions;
export default enquirySlice.reducer;
