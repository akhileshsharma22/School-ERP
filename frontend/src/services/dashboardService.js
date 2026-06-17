import api from "./api";

export const getDashboardSummary = async (academicYearId) => {
  const url = academicYearId ? `/dashboard/summary?academicYear=${academicYearId}` : "/dashboard/summary";
  const response = await api.get(url);
  return response.data;
};

export const searchDashboard = async (query, academicYearId) => {
  let url = `/dashboard/search?q=${encodeURIComponent(query)}`;
  if (academicYearId) {
    url += `&academicYear=${academicYearId}`;
  }
  const response = await api.get(url);
  return response.data;
};
