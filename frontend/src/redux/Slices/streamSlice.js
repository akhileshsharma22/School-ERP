import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import * as streamService from "../../services/streamService";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

export const fetchStreams = createAsyncThunk(
  "streams/fetchStreams",
  async (_, { rejectWithValue }) => {
    try {
      const data = await streamService.getStreams();
      return data.streams || [];
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Failed to fetch streams"
        )
      );
    }
  }
);

export const createStream = createAsyncThunk(
  "streams/createStream",
  async (payload, { rejectWithValue }) => {
    try {
      const data =
        await streamService.createStream(payload);
      return data.stream;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Failed to create stream"
        )
      );
    }
  }
);

export const updateStream = createAsyncThunk(
  "streams/updateStream",
  async (
    { id, data: payload },
    { rejectWithValue }
  ) => {
    try {
      const data =
        await streamService.updateStream(
          id,
          payload
        );
      return data.stream;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Failed to update stream"
        )
      );
    }
  }
);

export const deleteStream = createAsyncThunk(
  "streams/deleteStream",
  async (id, { rejectWithValue }) => {
    try {
      await streamService.deleteStream(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(
          error,
          "Failed to delete stream"
        )
      );
    }
  }
);

const upsertStream = (streams, stream) => {
  const index = streams.findIndex(
    (item) => item._id === stream._id
  );

  if (index >= 0) {
    streams[index] = stream;
  } else {
    streams.push(stream);
  }
};

const streamSlice = createSlice({
  name: "streams",
  initialState: {
    streams: [],
    loading: false,
    saving: false,
    deletingId: null,
    error: null,
  },
  reducers: {
    clearStreamError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStreams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchStreams.fulfilled,
        (state, action) => {
          state.loading = false;
          state.streams = action.payload;
        }
      )
      .addCase(
        fetchStreams.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )
      .addCase(createStream.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(
        createStream.fulfilled,
        (state, action) => {
          state.saving = false;
          upsertStream(
            state.streams,
            action.payload
          );
        }
      )
      .addCase(
        createStream.rejected,
        (state, action) => {
          state.saving = false;
          state.error = action.payload;
        }
      )
      .addCase(updateStream.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(
        updateStream.fulfilled,
        (state, action) => {
          state.saving = false;
          upsertStream(
            state.streams,
            action.payload
          );
        }
      )
      .addCase(
        updateStream.rejected,
        (state, action) => {
          state.saving = false;
          state.error = action.payload;
        }
      )
      .addCase(
        deleteStream.pending,
        (state, action) => {
          state.deletingId = action.meta.arg;
          state.error = null;
        }
      )
      .addCase(
        deleteStream.fulfilled,
        (state, action) => {
          state.deletingId = null;
          state.streams = state.streams.filter(
            (stream) =>
              stream._id !== action.payload
          );
        }
      )
      .addCase(
        deleteStream.rejected,
        (state, action) => {
          state.deletingId = null;
          state.error = action.payload;
        }
      );
  },
});

export const { clearStreamError } =
  streamSlice.actions;

export default streamSlice.reducer;
