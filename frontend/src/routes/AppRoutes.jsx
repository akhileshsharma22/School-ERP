import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";
import ProfileSettingsPage from "../pages/auth/ProfileSettingsPage";
import UnauthorizedPage from "../pages/auth/UnauthorizedPage";

import DashboardHome from "../pages/dashboard/DashboardHome";

import AcademicYearsPage from "../pages/masterSetup/AcademicYearsPage";
import ClassSectionPage from "../pages/masterSetup/ClassSectionPage";
import StreamsPage from "../pages/masterSetup/StreamsPage";
import SubjectsPage from "../pages/masterSetup/SubjectsPage";
import DepartmentsPage from "../pages/masterSetup/DepartmentsPage";
import DesignationsPage from "../pages/masterSetup/DesignationsPage";
import CategoriesPage from "../pages/masterSetup/CategoriesPage";
import ExamTypesPage from "../pages/masterSetup/ExamTypesPage";

import EnquiriesPage from "../pages/admissions/EnquiriesPage";
import NewAdmissionPage from "../pages/admissions/NewAdmissionPage";
import AdmissionListPage from "../pages/admissions/AdmissionListPage";
import DocumentVerificationPage from "../pages/admissions/DocumentVerificationPage";
import AdmissionReportsPage from "../pages/admissions/AdmissionReportsPage";

import AllStudentsPage from "../pages/students/AllStudentsPage";
import StudentProfilePage from "../pages/students/StudentProfilePage";
import PromotionPage from "../pages/students/PromotionPage";

import AllStaffPage from "../pages/staff/AllStaffPage";
import AddStaffPage from "../pages/staff/AddStaffPage";
import StaffProfilePage from "../pages/staff/StaffProfilePage";
import LeaveManagementPage from "../pages/staff/LeaveManagementPage";
import StaffPayrollPage from "../pages/staff/StaffPayrollPage";

import DailyAttendanceDashboard from "../pages/attendance/DailyAttendanceDashboard";
import StudentAttendancePage from "../pages/attendance/StudentAttendancePage";
import StaffAttendanceRegisterPage from "../pages/attendance/StaffAttendancePage";
import AttendanceReportsPage from "../pages/attendance/AttendanceReportsPage";
import AttendanceAnalyticsPage from "../pages/attendance/AttendanceAnalyticsPage";

import ExamSetupPage from "../pages/exams/ExamSetupPage";
import ExamSchedulePage from "../pages/exams/ExamSchedulePage";
import MarksEntryPage from "../pages/exams/MarksEntryPage";
import ExamResultsPage from "../pages/exams/ExamResultsPage";
import ReportCardsPage from "../pages/exams/ReportCardsPage";
import ExamAnalyticsPage from "../pages/exams/ExamAnalyticsPage";
import GradeConfigPage from "../pages/exams/GradeConfigPage";

import FeeStructurePage from "../pages/fees/FeeStructurePage";
import FeeCollectionPage from "../pages/fees/FeeCollectionPage";
import FeeReportsPage from "../pages/fees/FeeReportsPage";

import TimetablePage from "../pages/academics/TimetablePage";

import ProtectedRoute from "./ProtectedRoute";

const AppRoutes = () => {
  return (
    <BrowserRouter>

      <Routes>

        {/* Login routes */}
        <Route
          path="/"
          element={<LoginPage />}
        />
        <Route
          path="/login"
          element={<LoginPage />}
        />
        <Route
          path="/unauthorized"
          element={<UnauthorizedPage />}
        />

        {/* Profile Settings */}
        <Route
          path="/profile/settings"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "TEACHER", "PARENT"]}>
              <ProfileSettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "TEACHER", "PARENT"]}>
              <DashboardHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/academic-years"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AcademicYearsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/classes-sections"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <ClassSectionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/classes"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <ClassSectionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/streams"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <StreamsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/sections"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <ClassSectionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/subjects"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <SubjectsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/departments"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <DepartmentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/designations"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <DesignationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/categories"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <CategoriesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/exam-types"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <ExamTypesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admissions/enquiries"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <EnquiriesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admissions/new"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <NewAdmissionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admissions/list"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdmissionListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admissions/verification"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <DocumentVerificationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admissions/reports"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdmissionReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "TEACHER"]}>
              <AllStudentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students/profile/:id"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "TEACHER", "PARENT"]}>
              <StudentProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students/promotion"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <PromotionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AllStaffPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/add"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AddStaffPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/profile/:id"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <StaffProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/leave"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <LeaveManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/payroll"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <StaffPayrollPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <DailyAttendanceDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance/students"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "TEACHER"]}>
              <StudentAttendancePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance/staff"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <StaffAttendanceRegisterPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance/reports"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AttendanceReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance/analytics"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AttendanceAnalyticsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/exams/setup"
          element={<ProtectedRoute allowedRoles={["ADMIN"]}><ExamSetupPage /></ProtectedRoute>}
        />
        <Route
          path="/examinations/setup"
          element={<ProtectedRoute allowedRoles={["ADMIN"]}><ExamSetupPage /></ProtectedRoute>}
        />
        <Route
          path="/examinations/schedule"
          element={<ProtectedRoute allowedRoles={["ADMIN", "TEACHER", "PARENT"]}><ExamSchedulePage /></ProtectedRoute>}
        />
        <Route
          path="/examinations/marks"
          element={<ProtectedRoute allowedRoles={["ADMIN", "TEACHER"]}><MarksEntryPage /></ProtectedRoute>}
        />
        <Route
          path="/examinations/results"
          element={<ProtectedRoute allowedRoles={["ADMIN", "TEACHER", "PARENT"]}><ExamResultsPage /></ProtectedRoute>}
        />
        <Route
          path="/examinations/report-cards"
          element={<ProtectedRoute allowedRoles={["ADMIN", "PARENT"]}><ReportCardsPage /></ProtectedRoute>}
        />
        <Route
          path="/examinations/analytics"
          element={<ProtectedRoute allowedRoles={["ADMIN"]}><ExamAnalyticsPage /></ProtectedRoute>}
        />
        <Route
          path="/examinations/grade-config"
          element={<ProtectedRoute allowedRoles={["ADMIN"]}><GradeConfigPage /></ProtectedRoute>}
        />

        <Route
          path="/fees/structure"
          element={<ProtectedRoute allowedRoles={["ADMIN"]}><FeeStructurePage /></ProtectedRoute>}
        />
        <Route
          path="/fees/collect"
          element={<ProtectedRoute allowedRoles={["ADMIN"]}><FeeCollectionPage /></ProtectedRoute>}
        />
        <Route
          path="/fees/reports"
          element={<ProtectedRoute allowedRoles={["ADMIN"]}><FeeReportsPage /></ProtectedRoute>}
        />

        {/* Redirect for generic fees path for parents */}
        <Route
          path="/fees"
          element={<ProtectedRoute allowedRoles={["ADMIN", "PARENT"]}><DashboardHome /></ProtectedRoute>}
        />

        <Route
          path="/academics/classes"
          element={<ProtectedRoute allowedRoles={["ADMIN"]}><ClassSectionPage /></ProtectedRoute>}
        />
        <Route
          path="/academics/subjects"
          element={<ProtectedRoute allowedRoles={["ADMIN"]}><SubjectsPage /></ProtectedRoute>}
        />
        <Route
          path="/academics/timetable"
          element={<ProtectedRoute allowedRoles={["ADMIN", "TEACHER", "PARENT"]}><TimetablePage /></ProtectedRoute>}
        />

      </Routes>

    </BrowserRouter>
  );
};

export default AppRoutes;
