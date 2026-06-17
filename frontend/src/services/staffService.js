import api from "./api";

// Verify setup dependencies
export const checkSetupDependencies = async () => {
  const response = await api.get("/staff/setup-check");
  return response.data;
};

// Fetch staff list with filters and metrics
export const getStaff = async (params) => {
  const response = await api.get("/staff", { params });
  return response.data;
};

// Create new staff
export const createStaff = async (data) => {
  const isFormData = data instanceof FormData;
  const response = await api.post("/staff", data, {
    headers: {
      "Content-Type": isFormData ? "multipart/form-data" : "application/json",
    },
  });
  return response.data;
};

// Fetch single staff profile detail
export const getStaffProfile = async (id) => {
  const response = await api.get(`/staff/${id}`);
  return response.data;
};

// Update staff profile details
export const updateStaffProfile = async (id, data) => {
  const isFormData = data instanceof FormData;
  const response = await api.put(`/staff/${id}`, data, {
    headers: {
      "Content-Type": isFormData ? "multipart/form-data" : "application/json",
    },
  });
  return response.data;
};

// Delete staff permanently (dependency checks enforced on backend)
export const deleteStaff = async (id) => {
  const response = await api.delete(`/staff/${id}`);
  return response.data;
};

// Fetch staff attendance logs & summaries
export const getStaffAttendance = async (id, params) => {
  const response = await api.get(`/staff/${id}/attendance`, { params });
  return response.data;
};

// Mark / Update staff daily attendance status
export const markStaffAttendance = async (id, data) => {
  const response = await api.post(`/staff/${id}/attendance`, data);
  return response.data;
};

// Fetch leave requests list
export const getStaffLeaves = async (id) => {
  const response = await api.get(`/staff/${id}/leaves`);
  return response.data;
};

// Submit leave request
export const createLeaveRequest = async (id, data) => {
  const response = await api.post(`/staff/${id}/leaves`, data);
  return response.data;
};

// Update leave request status (Approve/Reject workflow)
export const updateLeaveStatus = async (id, leaveId, data) => {
  const response = await api.put(`/staff/${id}/leaves/${leaveId}`, data);
  return response.data;
};

// Fetch payroll slips list
export const getStaffPayroll = async (id) => {
  const response = await api.get(`/staff/${id}/payroll`);
  return response.data;
};

// Generate monthly payroll (PF, ESI, Tax, Net Salary formulas)
export const generatePayroll = async (id, data) => {
  const response = await api.post(`/staff/${id}/payroll`, data);
  return response.data;
};

// Fetch uploaded documents list
export const getStaffDocuments = async (id) => {
  const response = await api.get(`/staff/${id}/documents`);
  return response.data;
};

// Upload document file
export const uploadStaffDocument = async (id, data) => {
  const isFormData = data instanceof FormData;
  const response = await api.post(`/staff/${id}/documents`, data, {
    headers: {
      "Content-Type": isFormData ? "multipart/form-data" : "application/json",
    },
  });
  return response.data;
};

// Replace document file
export const replaceStaffDocument = async (id, docId, data) => {
  const isFormData = data instanceof FormData;
  const response = await api.put(`/staff/${id}/documents/${docId}`, data, {
    headers: {
      "Content-Type": isFormData ? "multipart/form-data" : "application/json",
    },
  });
  return response.data;
};

// Delete document record & physical file
export const deleteStaffDocument = async (id, docId) => {
  const response = await api.delete(`/staff/${id}/documents/${docId}`);
  return response.data;
};

// Fetch audit activity logs timeline
export const getStaffActivityLogs = async (id) => {
  const response = await api.get(`/staff/${id}/activity-logs`);
  return response.data;
};

// System-wide Leaves
export const getAllLeaveRequestsAcrossSchool = async () => {
  const response = await api.get("/staff/leaves/all");
  return response.data;
};

// System-wide Attendance For Date
export const getAllStaffAttendanceForDate = async (params) => {
  const response = await api.get("/staff/attendance/all", { params });
  return response.data;
};

// Bulk Mark Attendance
export const bulkMarkStaffAttendance = async (data) => {
  const response = await api.post("/staff/attendance/bulk", data);
  return response.data;
};

// System-wide Payroll
export const getAllPayrollsAcrossSchool = async (params) => {
  const response = await api.get("/staff/payroll/all", { params });
  return response.data;
};
