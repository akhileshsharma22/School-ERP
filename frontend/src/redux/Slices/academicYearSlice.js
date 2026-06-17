import {
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";

import * as academicYearService from "../../services/academicYearService";

export const fetchAcademicYears =
  createAsyncThunk(
    "academicYear/fetchAll",
    async () => {
      const data =
        await academicYearService.getAcademicYears();

      return data.academicYears;
    }
  );

export const fetchCurrentAcademicYear =
  createAsyncThunk(
    "academicYear/current",
    async () => {
      const data =
        await academicYearService.getCurrentAcademicYear();

      return data.academicYear;
    }
  );

const academicYearSlice =
  createSlice({
    name: "academicYear",

    initialState: {
      academicYears: [],
      currentAcademicYear: null,
      loading: false,
      error: null,
    },

    reducers: {},

    extraReducers: (builder) => {
      builder

        .addCase(
          fetchAcademicYears.pending,
          (state) => {
            state.loading = true;
          }
        )

        .addCase(
          fetchAcademicYears.fulfilled,
          (state, action) => {
            state.loading = false;

            state.academicYears =
              action.payload;
          }
        )

        .addCase(
          fetchAcademicYears.rejected,
          (state, action) => {
            state.loading = false;

            state.error =
              action.error.message;
          }
        )

        .addCase(
          fetchCurrentAcademicYear.fulfilled,
          (state, action) => {
            state.currentAcademicYear =
              action.payload;
          }
        );
    },
  });

export default academicYearSlice.reducer;