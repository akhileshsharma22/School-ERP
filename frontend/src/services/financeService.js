import api from "./api";

// Fee Categories
export const getFeeCategories = () => api.get("/finance/fee-categories").then(r => r.data);
export const createFeeCategory = (data) => api.post("/finance/fee-categories", data).then(r => r.data);
export const updateFeeCategory = (id, data) => api.put(`/finance/fee-categories/${id}`, data).then(r => r.data);
export const deleteFeeCategory = (id) => api.delete(`/finance/fee-categories/${id}`).then(r => r.data);

// Discounts
export const getDiscounts = () => api.get("/finance/discounts").then(r => r.data);
export const createDiscount = (data) => api.post("/finance/discounts", data).then(r => r.data);
export const updateDiscount = (id, data) => api.put(`/finance/discounts/${id}`, data).then(r => r.data);
export const deleteDiscount = (id) => api.delete(`/finance/discounts/${id}`).then(r => r.data);

// Structures
export const getStructures = () => api.get("/finance/structures").then(r => r.data);
export const createStructure = (data) => api.post("/finance/structures", data).then(r => r.data);
export const updateStructure = (id, data) => api.put(`/finance/structures/${id}`, data).then(r => r.data);
export const deleteStructure = (id) => api.delete(`/finance/structures/${id}`).then(r => r.data);

// Assignments
export const getAssignments = (params) => api.get("/finance/assignments", { params }).then(r => r.data);
export const triggerAssignment = (data) => api.post("/finance/assignments/trigger", data).then(r => r.data);
export const bulkTriggerAssignment = (data) => api.post("/finance/assignments/bulk-trigger", data).then(r => r.data);
export const runBulkAssignment = (data) => api.post("/finance/assignments/bulk-trigger", data).then(r => r.data);

// Invoices
export const getInvoices = (params) => api.get("/finance/invoices", { params }).then(r => r.data);
export const getInvoiceById = (id) => api.get(`/finance/invoices/${id}`).then(r => r.data);
export const applyConcession = (id, data) => api.post(`/finance/invoices/${id}/concession`, data).then(r => r.data);
export const collectPayment = (id, data) => api.post(`/finance/invoices/${id}/collect`, data).then(r => r.data);

// Receipts & Refunds
export const getReceipts = (params) => api.get("/finance/receipts", { params }).then(r => r.data);
export const refundReceipt = (id, data) => api.post(`/finance/receipts/${id}/refund`, data).then(r => r.data);

// Dashboard & Metrics
export const getDashboardMetrics = () => api.get("/finance/dashboard").then(r => r.data);
export const getAuditLogs = () => api.get("/finance/audit-logs").then(r => r.data);
