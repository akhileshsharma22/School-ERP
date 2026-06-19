import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";
import ProfileSettingsPage from "../pages/auth/ProfileSettingsPage";

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

        {/* Profile Settings */}
        <Route
          path="/profile/settings"
          element={
            <ProtectedRoute>
              <ProfileSettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardHome />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/academic-years"
          element={
            <ProtectedRoute>
              <AcademicYearsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/classes-sections"
          element={
            <ProtectedRoute>
              <ClassSectionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/classes"
          element={
            <ProtectedRoute>
              <ClassSectionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/streams"
          element={
            <ProtectedRoute>
              <StreamsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/sections"
          element={
            <ProtectedRoute>
              <ClassSectionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/subjects"
          element={
            <ProtectedRoute>
              <SubjectsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/departments"
          element={
            <ProtectedRoute>
              <DepartmentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/designations"
          element={
            <ProtectedRoute>
              <DesignationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/categories"
          element={
            <ProtectedRoute>
              <CategoriesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/master-setup/exam-types"
          element={
            <ProtectedRoute>
              <ExamTypesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admissions/enquiries"
          element={
            <ProtectedRoute>
              <EnquiriesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admissions/new"
          element={
            <ProtectedRoute>
              <NewAdmissionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admissions/list"
          element={
            <ProtectedRoute>
              <AdmissionListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admissions/verification"
          element={
            <ProtectedRoute>
              <DocumentVerificationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admissions/reports"
          element={
            <ProtectedRoute>
              <AdmissionReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <AllStudentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students/profile/:id"
          element={
            <ProtectedRoute>
              <StudentProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students/promotion"
          element={
            <ProtectedRoute>
              <PromotionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff"
          element={
            <ProtectedRoute>
              <AllStaffPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/add"
          element={
            <ProtectedRoute>
              <AddStaffPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/profile/:id"
          element={
            <ProtectedRoute>
              <StaffProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/leave"
          element={
            <ProtectedRoute>
              <LeaveManagementPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff/payroll"
          element={
            <ProtectedRoute>
              <StaffPayrollPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance/dashboard"
          element={
            <ProtectedRoute>
              <DailyAttendanceDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance/students"
          element={
            <ProtectedRoute>
              <StudentAttendancePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance/staff"
          element={
            <ProtectedRoute>
              <StaffAttendanceRegisterPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance/reports"
          element={
            <ProtectedRoute>
              <AttendanceReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance/analytics"
          element={
            <ProtectedRoute>
              <AttendanceAnalyticsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/exams/setup"
          element={<ProtectedRoute><ExamSetupPage /></ProtectedRoute>}
        />
        <Route
          path="/examinations/setup"
          element={<ProtectedRoute><ExamSetupPage /></ProtectedRoute>}
        />
        <Route
          path="/examinations/schedule"
          element={<ProtectedRoute><ExamSchedulePage /></ProtectedRoute>}
        />
        <Route
          path="/examinations/marks"
          element={<ProtectedRoute><MarksEntryPage /></ProtectedRoute>}
        />
        <Route
          path="/examinations/results"
          element={<ProtectedRoute><ExamResultsPage /></ProtectedRoute>}
        />
        <Route
          path="/examinations/report-cards"
          element={<ProtectedRoute><ReportCardsPage /></ProtectedRoute>}
        />
        <Route
          path="/examinations/analytics"
          element={<ProtectedRoute><ExamAnalyticsPage /></ProtectedRoute>}
        />
        <Route
          path="/examinations/grade-config"
          element={<ProtectedRoute><GradeConfigPage /></ProtectedRoute>}
        />

        <Route
          path="/fees/structure"
          element={<ProtectedRoute><FeeStructurePage /></ProtectedRoute>}
        />
        <Route
          path="/fees/collect"
          element={<ProtectedRoute><FeeCollectionPage /></ProtectedRoute>}
        />
        <Route
          path="/fees/reports"
          element={<ProtectedRoute><FeeReportsPage /></ProtectedRoute>}
        />

        <Route
          path="/academics/classes"
          element={<ProtectedRoute><ClassSectionPage /></ProtectedRoute>}
        />
        <Route
          path="/academics/subjects"
          element={<ProtectedRoute><SubjectsPage /></ProtectedRoute>}
        />
        <Route
          path="/academics/timetable"
          element={<ProtectedRoute><TimetablePage /></ProtectedRoute>}
        />

      </Routes>

    </BrowserRouter>
  );
};

export default AppRoutes;
