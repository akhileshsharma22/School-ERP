import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Loader2,
  Database,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  fetchAttendanceDependencies,
  fetchAttendanceDashboard,
} from "../../redux/slices/attendanceSlice";

const DailyAttendanceDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { setupStatus, dashboard, loading, error } = useSelector(
    (state) => state.attendance
  );

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    dispatch(fetchAttendanceDependencies());
  }, [dispatch]);

  useEffect(() => {
    if (selectedDate) {
      dispatch(fetchAttendanceDashboard({ date: selectedDate }));
    }
  }, [dispatch, selectedDate]);

  const hasMissingDependencies =
    !setupStatus.hasAcademicYear ||
    !setupStatus.hasClassSection ||
    !setupStatus.hasStudents ||
    !setupStatus.hasStaff;

  const handleDateChange = (e) => {
    const dateStr = e.target.value;
    const selected = new Date(dateStr);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (selected > today) {
      toast.error("Cannot view or mark attendance for future dates.");
      return;
    }
    setSelectedDate(dateStr);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Attendance Module
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              Daily Attendance Overview
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Monitor real-time attendance status and rates for students and staff.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">Select Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              max={new Date().toISOString().split("T")[0]}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
            />
          </div>
        </header>

        {/* Master Setup Warnings */}
        {hasMissingDependencies && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
            <div className="flex gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-amber-900">
                  Complete Master Setup before using the Attendance Module
                </h3>
                <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                  Before you can mark student or staff attendance, ensure that the following baseline directories are registered in the ERP database.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
                  <div className="flex items-center gap-2 rounded-lg bg-white p-2.5 shadow-sm border border-slate-100">
                    {setupStatus.hasAcademicYear ? (
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-4.5 w-4.5 text-rose-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-slate-700">Academic Year</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white p-2.5 shadow-sm border border-slate-100">
                    {setupStatus.hasClassSection ? (
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-4.5 w-4.5 text-rose-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-slate-700">Classes & Sections</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white p-2.5 shadow-sm border border-slate-100">
                    {setupStatus.hasStudents ? (
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-4.5 w-4.5 text-rose-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-slate-700">Student Directory</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white p-2.5 shadow-sm border border-slate-100">
                    {setupStatus.hasStaff ? (
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-4.5 w-4.5 text-rose-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-slate-700">Staff Records</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-sm font-medium text-slate-500">Loading daily metrics...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Student Attendance Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      dashboard.student.percentage >= 90
                        ? "bg-emerald-50 text-emerald-700"
                        : dashboard.student.percentage >= 75
                        ? "bg-amber-50 text-amber-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {dashboard.student.percentage}% Attendance Rate
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-xl font-bold text-slate-900">Student Daily Summary</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Aggregate attendance state for active students on selected date.
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Total Active</span>
                    <span className="mt-1 text-2xl font-bold text-slate-900 block">
                      {dashboard.student.total}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Present</span>
                    <span className="mt-1 text-2xl font-bold text-emerald-600 block">
                      {dashboard.student.present}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Absent</span>
                    <span className="mt-1 text-2xl font-bold text-rose-600 block">
                      {dashboard.student.absent}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-slate-600">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span>Late Arrivals: <strong>{dashboard.student.late}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-600">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <span>Status Evaluated</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => navigate("/attendance/students")}
                  disabled={hasMissingDependencies}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-750 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Go to Student Register <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Staff Attendance Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      dashboard.staff.percentage >= 90
                        ? "bg-emerald-50 text-emerald-700"
                        : dashboard.staff.percentage >= 75
                        ? "bg-amber-50 text-amber-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {dashboard.staff.percentage}% Attendance Rate
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-xl font-bold text-slate-900">Staff Daily Summary</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Aggregate biometric & check-in state for staff members.
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Total Staff</span>
                    <span className="mt-1 text-2xl font-bold text-slate-900 block">
                      {dashboard.staff.total}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Present / WFH</span>
                    <span className="mt-1 text-2xl font-bold text-emerald-600 block">
                      {dashboard.staff.present}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block">Absent</span>
                    <span className="mt-1 text-2xl font-bold text-rose-600 block">
                      {dashboard.staff.absent}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-slate-600">
                    <Briefcase className="h-4 w-4 text-indigo-500" />
                    <span>On Approved Leave: <strong>{dashboard.staff.onLeave}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-600">
                    <Database className="h-4 w-4 text-violet-500" />
                    <span>Biometric Override Ready</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => navigate("/attendance/staff")}
                  disabled={hasMissingDependencies}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-750 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Go to Staff Register <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DailyAttendanceDashboard;
