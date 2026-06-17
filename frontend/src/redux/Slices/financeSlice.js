import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as financeService from "../../services/financeService";

// Async Thunks
export const fetchFeeCategories = createAsyncThunk("finance/fetchFeeCategories", async (_, { rejectWithValue }) => {
  try { return await financeService.getFeeCategories(); } catch (e) { return rejectWithValue(e.message); }
});

export const addFeeCategory = createAsyncThunk("finance/addFeeCategory", async (data, { rejectWithValue }) => {
  try { return await financeService.createFeeCategory(data); } catch (e) { return rejectWithValue(e.message); }
});

export const editFeeCategory = createAsyncThunk("finance/editFeeCategory", async ({ id, data }, { rejectWithValue }) => {
  try { return await financeService.updateFeeCategory(id, data); } catch (e) { return rejectWithValue(e.message); }
});

export const removeFeeCategory = createAsyncThunk("finance/removeFeeCategory", async (id, { rejectWithValue }) => {
  try { await financeService.deleteFeeCategory(id); return id; } catch (e) { return rejectWithValue(e.message); }
});

export const fetchDiscounts = createAsyncThunk("finance/fetchDiscounts", async (_, { rejectWithValue }) => {
  try { return await financeService.getDiscounts(); } catch (e) { return rejectWithValue(e.message); }
});

export const addDiscount = createAsyncThunk("finance/addDiscount", async (data, { rejectWithValue }) => {
  try { return await financeService.createDiscount(data); } catch (e) { return rejectWithValue(e.message); }
});

export const editDiscount = createAsyncThunk("finance/editDiscount", async ({ id, data }, { rejectWithValue }) => {
  try { return await financeService.updateDiscount(id, data); } catch (e) { return rejectWithValue(e.message); }
});

export const removeDiscount = createAsyncThunk("finance/removeDiscount", async (id, { rejectWithValue }) => {
  try { await financeService.deleteDiscount(id); return id; } catch (e) { return rejectWithValue(e.message); }
});

export const fetchStructures = createAsyncThunk("finance/fetchStructures", async (_, { rejectWithValue }) => {
  try { return await financeService.getStructures(); } catch (e) { return rejectWithValue(e.message); }
});

export const addStructure = createAsyncThunk("finance/addStructure", async (data, { rejectWithValue }) => {
  try { return await financeService.createStructure(data); } catch (e) { return rejectWithValue(e.message); }
});

export const editStructure = createAsyncThunk("finance/editStructure", async ({ id, data }, { rejectWithValue }) => {
  try { return await financeService.updateStructure(id, data); } catch (e) { return rejectWithValue(e.message); }
});

export const removeStructure = createAsyncThunk("finance/removeStructure", async (id, { rejectWithValue }) => {
  try { await financeService.deleteStructure(id); return id; } catch (e) { return rejectWithValue(e.message); }
});

export const fetchAssignments = createAsyncThunk("finance/fetchAssignments", async (params = {}, { rejectWithValue }) => {
  try {
    return await financeService.getAssignments(params);
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || e.message);
  }
});

export const runAssignment = createAsyncThunk("finance/runAssignment", async (data, { rejectWithValue }) => {
  try {
    return await financeService.triggerAssignment(data);
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || e.message);
  }
});

export const runBulkAssignment = createAsyncThunk("finance/runBulkAssignment", async (data, { rejectWithValue }) => {
  try {
    return await financeService.runBulkAssignment(data);
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || e.message);
  }
});

export const fetchInvoices = createAsyncThunk("finance/fetchInvoices", async (params = {}, { rejectWithValue }) => {
  try { return await financeService.getInvoices(params); } catch (e) { return rejectWithValue(e.message); }
});

export const submitConcession = createAsyncThunk("finance/submitConcession", async ({ id, data }, { rejectWithValue }) => {
  try { return await financeService.applyConcession(id, data); } catch (e) { return rejectWithValue(e.message); }
});

export const submitPayment = createAsyncThunk("finance/submitPayment", async ({ id, data }, { rejectWithValue }) => {
  try { return await financeService.collectPayment(id, data); } catch (e) { return rejectWithValue(e.message); }
});

export const fetchReceipts = createAsyncThunk("finance/fetchReceipts", async (params = {}, { rejectWithValue }) => {
  try { return await financeService.getReceipts(params); } catch (e) { return rejectWithValue(e.message); }
});

export const submitRefund = createAsyncThunk("finance/submitRefund", async ({ id, data }, { rejectWithValue }) => {
  try { return await financeService.refundReceipt(id, data); } catch (e) { return rejectWithValue(e.message); }
});

export const fetchDashboardMetrics = createAsyncThunk("finance/fetchDashboardMetrics", async (_, { rejectWithValue }) => {
  try { return await financeService.getDashboardMetrics(); } catch (e) { return rejectWithValue(e.message); }
});

export const fetchAuditLogs = createAsyncThunk("finance/fetchAuditLogs", async (_, { rejectWithValue }) => {
  try { return await financeService.getAuditLogs(); } catch (e) { return rejectWithValue(e.message); }
});

const financeSlice = createSlice({
  name: "finance",
  initialState: {
    categories: [],
    discounts: [],
    structures: [],
    assignments: [],
    assignmentsTotal: 0,
    kpis: null,
    invoices: [],
    receipts: [],
    metrics: null,
    charts: null,
    auditLogs: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearFinanceError: (state) => { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      // Categories
      .addCase(fetchFeeCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.categories || [];
      })
      .addCase(addFeeCategory.fulfilled, (state, action) => {
        state.saving = false;
        state.loading = false;
        state.categories = [...state.categories, action.payload.feeCategory];
      })
      .addCase(editFeeCategory.fulfilled, (state, action) => {
        state.saving = false;
        state.loading = false;
        state.categories = state.categories.map((c) => c._id === action.payload.feeCategory._id ? action.payload.feeCategory : c);
      })
      .addCase(removeFeeCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = state.categories.filter((c) => c._id !== action.payload);
      })
      // Discounts
      .addCase(fetchDiscounts.fulfilled, (state, action) => {
        state.loading = false;
        state.discounts = action.payload.discounts || [];
      })
      .addCase(addDiscount.fulfilled, (state, action) => {
        state.saving = false;
        state.loading = false;
        state.discounts = [...state.discounts, action.payload.discount];
      })
      .addCase(editDiscount.fulfilled, (state, action) => {
        state.saving = false;
        state.loading = false;
        state.discounts = state.discounts.map((d) => d._id === action.payload.discount._id ? action.payload.discount : d);
      })
      .addCase(removeDiscount.fulfilled, (state, action) => {
        state.loading = false;
        state.discounts = state.discounts.filter((d) => d._id !== action.payload);
      })
      // Structures
      .addCase(fetchStructures.fulfilled, (state, action) => {
        state.loading = false;
        state.structures = action.payload.structures || [];
      })
      .addCase(addStructure.fulfilled, (state, action) => {
        state.saving = false;
        state.loading = false;
        state.structures = [...state.structures, action.payload.structure];
      })
      .addCase(editStructure.fulfilled, (state, action) => {
        state.saving = false;
        state.loading = false;
        state.structures = state.structures.map((s) => s._id === action.payload.structure._id ? action.payload.structure : s);
      })
      .addCase(removeStructure.fulfilled, (state, action) => {
        state.loading = false;
        state.structures = state.structures.filter((s) => s._id !== action.payload);
      })
      // Assignments
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.assignments = action.payload.assignments || [];
        state.assignmentsTotal = action.payload.total || 0;
        state.kpis = action.payload.kpis || null;
      })
      .addCase(runAssignment.fulfilled, (state) => {
        state.saving = false;
        state.loading = false;
      })
      .addCase(runBulkAssignment.fulfilled, (state) => {
        state.saving = false;
        state.loading = false;
      })
      // Invoices & collection
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload.invoices || [];
      })
      .addCase(submitConcession.fulfilled, (state, action) => {
        state.saving = false;
        state.loading = false;
        state.invoices = state.invoices.map((inv) => inv._id === action.payload.invoice._id ? action.payload.invoice : inv);
      })
      .addCase(submitPayment.fulfilled, (state, action) => {
        state.saving = false;
        state.loading = false;
        state.invoices = state.invoices.map((inv) => inv._id === action.payload.invoice._id ? action.payload.invoice : inv);
      })
      // Receipts
      .addCase(fetchReceipts.fulfilled, (state, action) => {
        state.loading = false;
        state.receipts = action.payload.receipts || [];
      })
      .addCase(submitRefund.fulfilled, (state, action) => {
        state.saving = false;
        state.loading = false;
        state.receipts = state.receipts.map((rec) => rec._id === action.payload.receipt._id ? action.payload.receipt : rec);
      })
      // Dashboard & Audits
      .addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload.metrics || null;
        state.charts = action.payload.charts || null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.auditLogs = action.payload.logs || [];
      })
      // General loading matchers
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.saving = false;
          state.error = action.payload;
        }
      );
  }
});

export const { clearFinanceError } = financeSlice.actions;
export default financeSlice.reducer;
