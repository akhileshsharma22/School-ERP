import api from "./api";

export const getAcademicYears =
  async () => {
    const response =
      await api.get(
        "/master/academic-years"
      );

    return response.data;
  };

export const getCurrentAcademicYear =
  async () => {
    const response =
      await api.get(
        "/master/academic-years/current"
      );

    return response.data;
  };

export const createAcademicYear =
  async (data) => {
    const response =
      await api.post(
        "/master/academic-years",
        data
      );

    return response.data;
  };

export const setCurrentAcademicYear =
  async (id) => {
    const response =
      await api.put(
        `/master/academic-years/${id}/current`
      );

    return response.data;
  };

export const deleteAcademicYear =
  async (id) => {
    const response =
      await api.delete(
        `/master/academic-years/${id}`
      );

    return response.data;
  };