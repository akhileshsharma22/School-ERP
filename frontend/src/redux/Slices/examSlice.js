import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

const API = "/exams";

// ─── Async Thunks ───────────────────────────────────────────────

export const checkExamSetup = createAsyncThunk(
  "exams/checkSetup",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`${API}/setup-check`, { withCredentials: true });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const fetchExams = createAsyncThunk(
  "exams/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get(API, { params, withCredentials: true });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const fetchExamById = createAsyncThunk(
  "exams/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`${API}/${id}`, { withCredentials: true });
      return data.exam;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const createExam = createAsyncThunk(
  "exams/create",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post(API, payload, { withCredentials: true });
      return data.exam;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const updateExam = createAsyncThunk(
  "exams/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`${API}/${id}`, payload, { withCredentials: true });
      return data.exam;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const updateExamStatus = createAsyncThunk(
  "exams/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`${API}/${id}/status`, { status }, { withCredentials: true });
      return data.exam;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const deleteExam = createAsyncThunk(
  "exams/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${API}/${id}`, { withCredentials: true });
      return id;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

// Schedule
export const fetchSchedule = createAsyncThunk(
  "exams/fetchSchedule",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/exam-schedules", { params, withCredentials: true });
      return data.schedules;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const createScheduleEntry = createAsyncThunk(
  "exams/createSchedule",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/exam-schedules", payload, { withCredentials: true });
      return data.entry;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const bulkGenerateSchedule = createAsyncThunk(
  "exams/bulkSchedule",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`${API}/schedule/bulk`, payload, { withCredentials: true });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const updateScheduleEntry = createAsyncThunk(
  "exams/updateSchedule",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/exam-schedules/${id}`, payload, { withCredentials: true });
      return data.entry;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const deleteScheduleEntry = createAsyncThunk(
  "exams/deleteSchedule",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/exam-schedules/${id}`, { withCredentials: true });
      return id;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

// Marks
export const fetchStudentsForMarks = createAsyncThunk(
  "exams/fetchStudentsForMarks",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`${API}/marks/students`, { params, withCredentials: true });
      return data.students;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const fetchMarks = createAsyncThunk(
  "exams/fetchMarks",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`${API}/marks/list`, { params, withCredentials: true });
      return data.marks;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const saveBulkMarks = createAsyncThunk(
  "exams/saveBulkMarks",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`${API}/marks/bulk`, payload, { withCredentials: true });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const clearMarks = createAsyncThunk(
  "exams/clearMarks",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`${API}/marks/clear`, { params, withCredentials: true });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

// Results
export const fetchResultsSummary = createAsyncThunk(
  "exams/fetchResultsSummary",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`${API}/results/summary`, { params, withCredentials: true });
      return data.summary;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const fetchResults = createAsyncThunk(
  "exams/fetchResults",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`${API}/results/list`, { params, withCredentials: true });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const computeResults = createAsyncThunk(
  "exams/computeResults",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`${API}/results/compute`, payload, { withCredentials: true });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const publishResult = createAsyncThunk(
  "exams/publishResult",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`${API}/results/${id}/publish`, {}, { withCredentials: true });
      return { id, ...data };
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const bulkPublishResults = createAsyncThunk(
  "exams/bulkPublishResults",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`${API}/results/bulk-publish`, payload, { withCredentials: true });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

// Grade Config
export const fetchGradeConfig = createAsyncThunk(
  "exams/fetchGradeConfig",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`${API}/grade-config`, { params, withCredentials: true });
      return data.gradeConfig;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const saveGradeConfig = createAsyncThunk(
  "exams/saveGradeConfig",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`${API}/grade-config`, payload, { withCredentials: true });
      return data.gradeConfig;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

// Analytics
export const fetchAnalyticsOverview = createAsyncThunk(
  "exams/fetchAnalyticsOverview",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`${API}/analytics/overview`, { params, withCredentials: true });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

export const fetchTopStudents = createAsyncThunk(
  "exams/fetchTopStudents",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`${API}/analytics/top-students`, { params, withCredentials: true });
      return data.students;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || e.message);
    }
  }
);

// ─── Slice ──────────────────────────────────────────────────────

const examSlice = createSlice({
  name: "exams",
  initialState: {
    // Setup
    setupReady: false,
    setupMissing: [],
    setupLoading: false,
    // Exams
    exams: [],
    examsTotal: 0,
    currentExam: null,
    examsLoading: false,
    examsSaving: false,
    examsError: null,
    // Schedule
    schedule: [],
    scheduleLoading: false,
    scheduleSaving: false,
    // Marks
    marksStudents: [],
    marks: [],
    marksLoading: false,
    marksSaving: false,
    // Results
    resultsSummary: null,
    results: [],
    resultsTotal: 0,
    resultsLoading: false,
    resultsSaving: false,
    // Grade Config
    gradeConfig: null,
    gradeConfigLoading: false,
    gradeConfigSaving: false,
    // Analytics
    analyticsOverview: null,
    analyticsLoading: false,
    topStudents: [],
    bottomStudents: [],
    topStudentsLoading: false,
  },
  reducers: {
    clearExamError: (state) => { state.examsError = null; },
    clearCurrentExam: (state) => { state.currentExam = null; },
    clearMarksState: (state) => { state.marks = []; state.marksStudents = []; },
  },
  extraReducers: (builder) => {
    // Setup check
    builder
      .addCase(checkExamSetup.pending, (s) => { s.setupLoading = true; })
      .addCase(checkExamSetup.fulfilled, (s, a) => {
        s.setupLoading = false;
        s.setupReady = a.payload.ready;
        s.setupMissing = a.payload.missing || [];
      })
      .addCase(checkExamSetup.rejected, (s) => { s.setupLoading = false; });

    // Fetch exams
    builder
      .addCase(fetchExams.pending, (s) => { s.examsLoading = true; s.examsError = null; })
      .addCase(fetchExams.fulfilled, (s, a) => {
        s.examsLoading = false;
        s.exams = a.payload.exams || [];
        s.examsTotal = a.payload.total || 0;
      })
      .addCase(fetchExams.rejected, (s, a) => { s.examsLoading = false; s.examsError = a.payload; });

    // Fetch by id
    builder
      .addCase(fetchExamById.fulfilled, (s, a) => { s.currentExam = a.payload; });

    // Create exam
    builder
      .addCase(createExam.pending, (s) => { s.examsSaving = true; })
      .addCase(createExam.fulfilled, (s, a) => {
        s.examsSaving = false;
        s.exams = [a.payload, ...s.exams];
      })
      .addCase(createExam.rejected, (s, a) => { s.examsSaving = false; s.examsError = a.payload; });

    // Update exam
    builder
      .addCase(updateExam.pending, (s) => { s.examsSaving = true; })
      .addCase(updateExam.fulfilled, (s, a) => {
        s.examsSaving = false;
        const idx = s.exams.findIndex((e) => e._id === a.payload._id);
        if (idx >= 0) s.exams[idx] = a.payload;
        if (s.currentExam?._id === a.payload._id) s.currentExam = a.payload;
      })
      .addCase(updateExam.rejected, (s, a) => { s.examsSaving = false; s.examsError = a.payload; });

    // Update status
    builder
      .addCase(updateExamStatus.fulfilled, (s, a) => {
        const idx = s.exams.findIndex((e) => e._id === a.payload._id);
        if (idx >= 0) s.exams[idx] = a.payload;
      });

    // Delete exam
    builder
      .addCase(deleteExam.fulfilled, (s, a) => {
        s.exams = s.exams.filter((e) => e._id !== a.payload);
      });

    // Schedule
    builder
      .addCase(fetchSchedule.pending, (s) => { s.scheduleLoading = true; })
      .addCase(fetchSchedule.fulfilled, (s, a) => { s.scheduleLoading = false; s.schedule = a.payload; })
      .addCase(fetchSchedule.rejected, (s) => { s.scheduleLoading = false; });

    builder
      .addCase(createScheduleEntry.pending, (s) => { s.scheduleSaving = true; })
      .addCase(createScheduleEntry.fulfilled, (s, a) => {
        s.scheduleSaving = false;
        s.schedule = [...s.schedule, a.payload];
      })
      .addCase(createScheduleEntry.rejected, (s) => { s.scheduleSaving = false; });

    builder
      .addCase(bulkGenerateSchedule.pending, (s) => { s.scheduleSaving = true; })
      .addCase(bulkGenerateSchedule.fulfilled, (s) => { s.scheduleSaving = false; })
      .addCase(bulkGenerateSchedule.rejected, (s) => { s.scheduleSaving = false; });

    builder
      .addCase(deleteScheduleEntry.fulfilled, (s, a) => {
        s.schedule = s.schedule.filter((e) => e._id !== a.payload);
      });

    // Marks
    builder
      .addCase(fetchStudentsForMarks.pending, (s) => { s.marksLoading = true; })
      .addCase(fetchStudentsForMarks.fulfilled, (s, a) => { s.marksLoading = false; s.marksStudents = a.payload; })
      .addCase(fetchStudentsForMarks.rejected, (s) => { s.marksLoading = false; });

    builder
      .addCase(fetchMarks.pending, (s) => { s.marksLoading = true; })
      .addCase(fetchMarks.fulfilled, (s, a) => { s.marksLoading = false; s.marks = a.payload; })
      .addCase(fetchMarks.rejected, (s) => { s.marksLoading = false; });

    builder
      .addCase(saveBulkMarks.pending, (s) => { s.marksSaving = true; })
      .addCase(saveBulkMarks.fulfilled, (s) => { s.marksSaving = false; })
      .addCase(saveBulkMarks.rejected, (s) => { s.marksSaving = false; });

    // Results
    builder
      .addCase(fetchResultsSummary.pending, (s) => { s.resultsLoading = true; })
      .addCase(fetchResultsSummary.fulfilled, (s, a) => { s.resultsLoading = false; s.resultsSummary = a.payload; })
      .addCase(fetchResultsSummary.rejected, (s) => { s.resultsLoading = false; });

    builder
      .addCase(fetchResults.pending, (s) => { s.resultsLoading = true; })
      .addCase(fetchResults.fulfilled, (s, a) => {
        s.resultsLoading = false;
        s.results = a.payload.results || [];
        s.resultsTotal = a.payload.total || 0;
      })
      .addCase(fetchResults.rejected, (s) => { s.resultsLoading = false; });

    builder
      .addCase(computeResults.pending, (s) => { s.resultsSaving = true; })
      .addCase(computeResults.fulfilled, (s) => { s.resultsSaving = false; })
      .addCase(computeResults.rejected, (s) => { s.resultsSaving = false; });

    builder
      .addCase(publishResult.pending, (s) => { s.resultsSaving = true; })
      .addCase(publishResult.fulfilled, (s, a) => {
        s.resultsSaving = false;
        const idx = s.results.findIndex((r) => r._id === a.payload.id);
        if (idx >= 0) s.results[idx] = { ...s.results[idx], isPublished: true };
      })
      .addCase(publishResult.rejected, (s) => { s.resultsSaving = false; });

    builder
      .addCase(bulkPublishResults.pending, (s) => { s.resultsSaving = true; })
      .addCase(bulkPublishResults.fulfilled, (s) => {
        s.resultsSaving = false;
        s.results = s.results.map((r) => ({ ...r, isPublished: true }));
      })
      .addCase(bulkPublishResults.rejected, (s) => { s.resultsSaving = false; });

    // Grade Config
    builder
      .addCase(fetchGradeConfig.pending, (s) => { s.gradeConfigLoading = true; })
      .addCase(fetchGradeConfig.fulfilled, (s, a) => { s.gradeConfigLoading = false; s.gradeConfig = a.payload; })
      .addCase(fetchGradeConfig.rejected, (s) => { s.gradeConfigLoading = false; });

    builder
      .addCase(saveGradeConfig.pending, (s) => { s.gradeConfigSaving = true; })
      .addCase(saveGradeConfig.fulfilled, (s, a) => { s.gradeConfigSaving = false; s.gradeConfig = a.payload; })
      .addCase(saveGradeConfig.rejected, (s) => { s.gradeConfigSaving = false; });

    // Analytics
    builder
      .addCase(fetchAnalyticsOverview.pending, (s) => { s.analyticsLoading = true; })
      .addCase(fetchAnalyticsOverview.fulfilled, (s, a) => {
        s.analyticsLoading = false;
        s.analyticsOverview = a.payload;
      })
      .addCase(fetchAnalyticsOverview.rejected, (s) => { s.analyticsLoading = false; });

    builder
      .addCase(fetchTopStudents.pending, (s) => { s.topStudentsLoading = true; })
      .addCase(fetchTopStudents.fulfilled, (s, a) => { s.topStudentsLoading = false; s.topStudents = a.payload; })
      .addCase(fetchTopStudents.rejected, (s) => { s.topStudentsLoading = false; });
  },
});

export const { clearExamError, clearCurrentExam, clearMarksState } = examSlice.actions;
export default examSlice.reducer;
