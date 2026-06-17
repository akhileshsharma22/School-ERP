import api from "./api";

// Check Master Setup dependencies
export const checkAttendanceDependencies = async () => {
  const response = await api.get("/attendance/setup-check");
  return response.data;
};

// Fetch Dashboard metrics counts
export const getAttendanceDashboard = async (params) => {
  const response = await api.get("/attendance/dashboard", { params });
  return response.data;
};

// Fetch Student Attendance List by class/section/date
export const getStudentAttendanceList = async (params) => {
  const response = await api.get("/attendance/students", { params });
  return response.data;
};

// Save Student daily logs
export const saveStudentAttendance = async (data) => {
  const response = await api.post("/attendance/students", data);
  return response.data;
};

// Clear Student daily logs
export const deleteStudentAttendance = async (params) => {
  const response = await api.delete("/attendance/students", { params });
  return response.data;
};

// Fetch Staff Attendance List by date/department/designation
export const getStaffAttendanceList = async (params) => {
  const response = await api.get("/attendance/staff", { params });
  return response.data;
};

// Save Staff daily logs (biometric checkin/checkout included)
export const saveStaffAttendance = async (data) => {
  const response = await api.post("/attendance/staff", data);
  return response.data;
};

// Clear Staff daily logs
export const deleteStaffAttendance = async (params) => {
  const response = await api.delete("/attendance/staff", { params });
  return response.data;
};

// Fetch Tabular reports
export const getAttendanceReports = async (params) => {
  const response = await api.get("/attendance/reports", { params });
  return response.data;
};

// Fetch Graphical analytics data curves
export const getAttendanceAnalytics = async (params) => {
  const response = await api.get("/attendance/analytics", { params });
  return response.data;
};
