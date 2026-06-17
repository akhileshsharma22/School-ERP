import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice";
import academicYearReducer from "./slices/academicYearSlice";
import classSectionReducer from "./slices/classSectionSlice";
import streamReducer from "./slices/streamSlice";
import subjectReducer from "./slices/subjectSlice";
import departmentReducer from "./slices/departmentSlice";
import designationReducer from "./slices/designationSlice";
import categoryReducer from "./slices/categorySlice";
import examTypeReducer from "./slices/examTypeSlice";
import enquiryReducer from "./slices/enquirySlice";
import admissionReducer from "./slices/admissionSlice";
import documentVerificationReducer from "./slices/documentVerificationSlice";
import studentReducer from "./slices/studentSlice";
import studentProfileReducer from "./slices/studentProfileSlice";
import promotionReducer from "./slices/promotionSlice";
import documentReducer from "./slices/documentSlice";
import staffReducer from "./slices/staffSlice";
import attendanceReducer from "./slices/attendanceSlice";
import examReducer from "./slices/examSlice";
import financeReducer from "./slices/financeSlice";
import dashboardReducer from "./slices/dashboardSlice";

export const store =
  configureStore({
    reducer: {
      auth: authReducer,
      academicYear:
        academicYearReducer,
      classSections:
        classSectionReducer,
      streams: streamReducer,
      subjects: subjectReducer,
      departments: departmentReducer,
      designations: designationReducer,
      categories: categoryReducer,
      examTypes: examTypeReducer,
      enquiries: enquiryReducer,
      admissions: admissionReducer,
      documentVerification: documentVerificationReducer,
      students: studentReducer,
      studentProfile: studentProfileReducer,
      promotions: promotionReducer,
      studentDocuments: documentReducer,
      staff: staffReducer,
      attendance: attendanceReducer,
      exams: examReducer,
      finance: financeReducer,
      dashboard: dashboardReducer,
    },
  });
