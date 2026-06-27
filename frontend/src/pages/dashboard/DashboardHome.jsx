import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Users,
  UserPlus,
  GraduationCap,
  ClipboardCheck,
  IndianRupee,
  ReceiptText,
  BookOpen,
  FileBarChart,
  AlertCircle,
  TrendingUp,
  Search,
  SearchCheck,
  Loader2
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { fetchDashboardSummary, searchDashboardData, clearSearchResults } from "../../redux/slices/dashboardSlice";
import { fetchAcademicYears } from "../../redux/slices/academicYearSlice";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const tooltipStyle = {
  border: "1px solid #E2E8F0",
  borderRadius: 12,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  backgroundColor: "#FFFFFF",
  fontSize: 12
};

const PIE_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const safePercentage = (val, total) => {
  if (!total) return 0;
  return Math.round((val / total) * 100);
};

const StatKpiCard = ({ title, value, icon: Icon, color, helper }) => (
  <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md duration-200">
    <div className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: color }} />
    <div className="flex items-start justify-between gap-2.5">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">{title}</p>
        <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-950">{value}</p>
      </div>
      <div className="h-8.5 w-8.5 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}10`, color }}>
        <Icon size={16} />
      </div>
    </div>
    <div className="mt-2.5 flex items-center justify-between gap-1 text-[11px] text-slate-400 font-semibold">
      <span>{helper}</span>
    </div>
  </div>
);

const KpiSkeleton = () => (
  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-3 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="space-y-2 w-2/3">
        <div className="h-3 bg-slate-250 rounded w-full"></div>
        <div className="h-5.5 bg-slate-250 rounded w-1/2"></div>
      </div>
      <div className="h-8 w-8 bg-slate-200 rounded-lg shrink-0"></div>
    </div>
    <div className="h-3 bg-slate-200 rounded w-3/4"></div>
  </div>
);

const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-3">
    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">{title}</h3>
    {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
  </div>
);

const EmptyStateWidget = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center text-slate-400 space-y-2">
    <AlertCircle size={22} className="text-slate-350" />
    <p className="text-xs font-semibold">{message || "No records found."}</p>
  </div>
);

const DashboardHome = () => {
  const dispatch = useDispatch();

  // Redux Selectors
  const { summary, searchResults, loading, searchLoading, error } = useSelector((s) => s.dashboard);
  const { academicYears } = useSelector((s) => s.academicYear);
  const { user } = useSelector((s) => s.auth);

  // Local state
  const [selectedAY, setSelectedAY] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  // Fetch academic years & initial summary on page load
  useEffect(() => {
    dispatch(fetchDashboardSummary());
    dispatch(fetchAcademicYears());
  }, [dispatch]);

  // Sync dropdown with active academic year loaded in summary
  useEffect(() => {
    if (summary?.data?.academicYear?.id && !selectedAY) {
      setSelectedAY(summary.data.academicYear.id);
    }
  }, [summary, selectedAY]);

  // Search input debouncer
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        dispatch(searchDashboardData({ query: searchQuery, academicYearId: selectedAY }));
        setShowSearchResults(true);
      } else {
        dispatch(clearSearchResults());
        setShowSearchResults(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery, selectedAY, dispatch]);

  const handleAYChange = (ayId) => {
    setSelectedAY(ayId);
    dispatch(fetchDashboardSummary(ayId));
  };

  const handleRetry = () => {
    dispatch(fetchDashboardSummary(selectedAY || undefined));
    dispatch(fetchAcademicYears());
  };

  const currentDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const summaryRole = summary?.role || user?.role;
  const summaryData = summary?.data;

  const pieData = useMemo(() => {
    if (!summaryData?.studentOverview?.categoryDistribution) return [];
    return summaryData.studentOverview.categoryDistribution.filter(c => c.count > 0);
  }, [summaryData]);

  const hasSearchResults = useMemo(() => {
    const r = searchResults;
    return r.students?.length > 0 || r.staff?.length > 0 || r.admissions?.length > 0 || r.finance?.length > 0 || r.exams?.length > 0;
  }, [searchResults]);

  // ==========================================
  // VIEW RENDERERS
  // ==========================================

  const renderTeacherDashboard = (data) => {
    if (!data) return <div className="text-center py-10 font-bold text-slate-500">No teacher summary data available.</div>;

    return (
      <div className="space-y-5">
        {/* KPI Cards */}
        <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
          <StatKpiCard
            title="Assigned Classes"
            value={data.kpis?.totalClasses || 0}
            icon={GraduationCap}
            color="#2563EB"
            helper="Classes taught this term"
          />
          <StatKpiCard
            title="Subjects Taught"
            value={data.kpis?.totalSubjects || 0}
            icon={BookOpen}
            color="#8B5CF6"
            helper="Academic subject modules"
          />
          <StatKpiCard
            title="Assigned Students"
            value={data.assignedStudentsCount || 0}
            icon={Users}
            color="#10B981"
            helper="Active student enrollment count"
          />
          <StatKpiCard
            title="Attendance Today"
            value={`${data.studentAttendanceRateToday || 0}%`}
            icon={ClipboardCheck}
            color="#F59E0B"
            helper="Student attendance average"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Today's Schedule */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader title="Today's Teaching Schedule" subtitle="Assigned classes and sessions for today" />
            <div className="mt-4 space-y-3">
              {data.todaysClasses?.length === 0 ? (
                <EmptyStateWidget message="No classes assigned for today." />
              ) : (
                data.todaysClasses?.map((cls, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 transition">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-900">{cls.className} - {cls.sectionName}</p>
                      <p className="text-xs text-slate-400 font-semibold">{cls.subjectName}</p>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                      {cls.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Marks Entry */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader title="Pending Marks Entry" subtitle="Exams requiring score entry submissions" />
            <div className="mt-4 space-y-3">
              {data.pendingMarksEntry?.length === 0 ? (
                <EmptyStateWidget message="All class marks have been submitted successfully!" />
              ) : (
                data.pendingMarksEntry?.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 transition">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-900">{entry.examName}</p>
                      <p className="text-xs text-slate-400 font-semibold">{entry.className} - {entry.sectionName} · {entry.subjectName}</p>
                    </div>
                    <Link
                      to={`/examinations/marks?exam=${entry.examId}&className=${entry.className}&section=${entry.sectionName}&subject=${entry.subjectId}`}
                      className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-650 px-3.5 py-1.5 rounded-lg hover:shadow transition"
                    >
                      Enter Marks
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Exams Schedule */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeader title="Upcoming Exams Schedule" subtitle="Scheduled tests and term examinations" />
          <div className="mt-4 overflow-x-auto">
            {data.upcomingExams?.length === 0 ? (
              <EmptyStateWidget message="No upcoming exams scheduled." />
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-250 text-xs font-bold text-slate-650">
                    <th className="px-4 py-2.5">Exam Name</th>
                    <th className="px-4 py-2.5">Start Date</th>
                    <th className="px-4 py-2.5">End Date</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs font-semibold text-slate-750">
                  {data.upcomingExams?.map((ex) => (
                    <tr key={ex._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900">{ex.examName}</td>
                      <td className="px-4 py-3">{new Date(ex.startDate).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3">{new Date(ex.endDate).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          {ex.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderParentDashboard = (data) => {
    if (!data || !data.children || data.children.length === 0) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 font-bold">
          No student profiles linked to this parent email found in the database.
        </div>
      );
    }

    const currentChild = data.children[selectedChildIndex];
    if (!currentChild) return null;

    const { student, kpis, upcomingExams, invoices, latestResultDetails } = currentChild;

    return (
      <div className="space-y-5">
        {/* Child Selector if multiple children */}
        {data.children.length > 1 && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Select Child:</span>
            <div className="flex gap-2">
              {data.children.map((c, idx) => (
                <button
                  key={c.student.id}
                  onClick={() => setSelectedChildIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedChildIndex === idx
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "bg-slate-50 border text-slate-650 hover:bg-slate-100"
                  }`}
                >
                  {c.student.fullName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Child Header Summary Card */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 bg-white p-5 border border-slate-200 rounded-xl">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="h-16 w-16 rounded-xl bg-slate-50 border overflow-hidden flex items-center justify-center shadow-inner">
              {student.photoUrl ? (
                <img src={`http://localhost:5000${student.photoUrl}`} alt={student.fullName} className="h-full w-full object-cover" />
              ) : (
                <Users className="text-slate-400" size={32} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{student.fullName}</h3>
              <p className="text-xs text-slate-450 font-semibold mt-0.5">Adm No: {student.admissionNo} | Class: {student.className}-{student.sectionName}</p>
              <p className="text-xs text-slate-450 font-semibold">Active Session: {student.academicYearName}</p>
            </div>
          </div>
          <Link
            to={`/students/profile/${student.id}`}
            className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-650 px-4 py-2 rounded-xl hover:shadow-lg transition cursor-pointer"
          >
            View Student dossier
          </Link>
        </div>

        {/* KPIs Cards */}
        <div className="grid gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
          <StatKpiCard
            title="Attendance Rate"
            value={`${kpis.attendancePercent || 0}%`}
            icon={ClipboardCheck}
            color="#2563EB"
            helper="Overall term attendance"
          />
          <StatKpiCard
            title="Pending Dues"
            value={`₹${kpis.feesDue?.toLocaleString("en-IN") || 0}`}
            icon={IndianRupee}
            color="#EF4444"
            helper={`Fee status: ${kpis.feeStatus}`}
          />
          <StatKpiCard
            title="Latest Exam Result"
            value={kpis.latestResult ? `${kpis.latestResult.percentage}%` : "—"}
            icon={FileBarChart}
            color="#10B981"
            helper={kpis.latestResult ? `Status: ${kpis.latestResult.resultStatus} (${kpis.latestResult.grade})` : "No exams published"}
          />
          <StatKpiCard
            title="Upcoming Exams"
            value={kpis.upcomingExamsCount || 0}
            icon={BookOpen}
            color="#F59E0B"
            helper="Scheduled exam papers"
          />
        </div>

        {/* Upcoming Exams & Invoices Lists */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Upcoming Exams */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader title="Upcoming Exams" subtitle="Schedules and test dates" />
            <div className="mt-4 space-y-3">
              {upcomingExams?.length === 0 ? (
                <EmptyStateWidget message="No upcoming exams scheduled." />
              ) : (
                upcomingExams?.slice(0, 4).map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 transition">
                    <p className="text-xs font-bold text-slate-800">{ex.examName}</p>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      {new Date(ex.startDate).toLocaleDateString("en-IN")} - {new Date(ex.endDate).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Invoices List */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader title="Fees & Invoices" subtitle="Billing statements and outstanding dues" />
            <div className="mt-4 space-y-2.5">
              {invoices?.length === 0 ? (
                <EmptyStateWidget message="No bills issued for this child." />
              ) : (
                invoices?.slice(0, 4).map((inv, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100">
                    <div>
                      <p className="font-extrabold text-slate-900">{inv.feeStructureName}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Due: {new Date(inv.dueDate).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-slate-950 text-sm">₹{inv.payableAmount}</span>
                      <span className={`block text-[9px] font-bold mt-0.5 ${inv.status === "Paid" ? "text-emerald-600" : "text-rose-600"}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAdminDashboard = (data) => {
    if (!data) return <div className="text-center py-10 font-bold text-slate-500">No dashboard data available.</div>;

    return (
      <>
        {/* SECOND ROW: KPI STATISTICS OVERVIEW */}
        <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <StatKpiCard
            title="Total Students"
            value={data.kpis.totalStudents.toLocaleString()}
            icon={Users}
            color="#2563EB"
            helper={`Active session profiles`}
          />
          <StatKpiCard
            title="New Admissions"
            value={data.kpis.newAdmissions.toLocaleString()}
            icon={UserPlus}
            color="#10B981"
            helper="Verified and approved"
          />
          <StatKpiCard
            title="Active Staff"
            value={data.kpis.totalStaff.toLocaleString()}
            icon={GraduationCap}
            color="#8B5CF6"
            helper="Teaching & administrative"
          />
          <StatKpiCard
            title="Today Attendance"
            value={`${data.kpis.studentAttendanceRateToday || 0}%`}
            icon={ClipboardCheck}
            color="#F59E0B"
            helper="Average student attendance rate"
          />
        </section>

        {/* THIRD ROW: CHARTS SECTION (ATTENDANCE & ACADEMIC BREAKDOWN) */}
        <section className="grid gap-4.5 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Attendance trends chart card */}
          <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm flex flex-col justify-between">
            <SectionHeader title="Daily Student Attendance Trend" subtitle="Percentage rate of student attendance over last 30 days" />
            <div className="h-48 w-full mt-3">
              {data.attendanceOverview.studentAttendanceTrend.length === 0 ? (
                <EmptyStateWidget message="No attendance entries recorded in past 30 days." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.attendanceOverview.studentAttendanceTrend} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}%`, "Attendance Rate"]} />
                    <Area type="monotone" dataKey="rate" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorRate)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Academic breakdown class distributions (Pie + stats) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm flex flex-col justify-between">
            <SectionHeader title="Academic Scope Breakdown" subtitle="Distribution of students by category & performance details" />
            <div className="grid sm:grid-cols-2 gap-4 items-center">
              <div className="h-44 w-full">
                {pieData.length === 0 ? (
                  <EmptyStateWidget message="No student records logged." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={2} dataKey="count" nameKey="category">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(val, name) => [val, `${name}`]} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="space-y-2.5">
                {pieData.length === 0 ? (
                  <p className="text-[10px] text-slate-400 font-semibold">Distribution will populate when student profiles are active.</p>
                ) : (
                  pieData.map((d, index) => (
                    <div key={d.category} className="flex justify-between items-center text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                        <span className="truncate">{d.category}</span>
                      </div>
                      <span className="font-extrabold text-slate-900">{d.count}</span>
                    </div>
                  ))
                )}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg">
                    <span className="text-[9px] uppercase tracking-wider text-blue-700 font-bold block">Top Class</span>
                    <span className="font-extrabold text-slate-900 truncate block mt-0.5">{data.examinationOverview.topPerformingClass}</span>
                  </div>
                  <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg">
                    <span className="text-[9px] uppercase tracking-wider text-rose-700 font-bold block">Lowest Performing</span>
                    <span className="font-extrabold text-slate-900 truncate block mt-0.5">{data.examinationOverview.lowestPerformingClass}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOURTH ROW: FEES & FINANCE OVERVIEW */}
        <section className="grid gap-4.5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm flex flex-col justify-between">
            <div>
              <SectionHeader title="Fees & Finance Status" subtitle="Invoices collection, category waivers, and expectations" />
              <div className="grid grid-cols-3 gap-3 text-center mb-4 font-bold text-xs">
                <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                  <span className="block text-slate-900 text-sm font-extrabold">₹{data.financeOverview.expectedCollection.toLocaleString("en-IN")}</span>
                  <span className="text-[10px] text-blue-600 uppercase font-bold">Expected Collection</span>
                </div>
                <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                  <span className="block text-slate-900 text-sm font-extrabold">₹{data.financeOverview.collectedAmount.toLocaleString("en-IN")}</span>
                  <span className="text-[10px] text-emerald-600 uppercase font-bold">Collected Amount</span>
                </div>
                <div className="bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                  <span className="block text-slate-900 text-sm font-extrabold">₹{data.financeOverview.pendingAmount.toLocaleString("en-IN")}</span>
                  <span className="text-[10px] text-rose-600 uppercase font-bold">Outstanding Pending</span>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-[1.3fr_1fr] gap-4.5 items-center">
              <div className="h-44 w-full">
                {data.financeOverview.monthlyCollectionTrend.length === 0 ? (
                  <EmptyStateWidget message="No fee payment collections processed this year." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.financeOverview.monthlyCollectionTrend} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
                      <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={v => [`₹${v.toLocaleString("en-IN")}`, "Collected"]} />
                      <Bar dataKey="collected" radius={[4, 4, 0, 0]} fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="space-y-3 font-semibold text-xs text-slate-700">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Collection Efficiency</span>
                  <span className="text-2xl font-extrabold text-emerald-700 block mt-1">{data.financeOverview.collectionPercentage}%</span>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${data.financeOverview.collectionPercentage}%` }} />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg font-bold">
                  <span>Assigned Discounts & Waivers:</span>
                  <span className="text-rose-600 font-extrabold">₹{data.financeOverview.totalDiscountAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm flex flex-col justify-between">
            <div>
              <SectionHeader title="Recent Payment Receipts" subtitle="5 latest transaction records verified in the database" />
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {data.financeOverview.recentCollections.length === 0 ? (
                  <EmptyStateWidget message="No transaction receipts verified." />
                ) : (
                  data.financeOverview.recentCollections.map((col) => (
                    <div key={col.receiptNumber} className="flex justify-between items-center text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-2 rounded-lg hover:bg-slate-100 transition border border-slate-100">
                      <div>
                        <p className="font-extrabold text-slate-900">{col.studentName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Rec: {col.receiptNumber} · {col.studentClass} ({col.paymentMode})</p>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-slate-950 text-sm">₹{col.amountPaid.toLocaleString("en-IN")}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{new Date(col.paymentDate).toLocaleDateString("en-IN")}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </>
    );
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1600px] space-y-5 pb-8">
        
        {/* TOP WELCOME & ACADEMIC YEAR SELECT BAR */}
        <section className="grid gap-3.5 md:grid-cols-[1fr_280px] items-center">
          <div className="rounded-xl border border-slate-250 bg-white p-4.5 shadow-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                <TrendingUp size={11} /> Live Command Center
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
                Welcome back, {user?.fullName || "User"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Operational metrics and logs updated for the current context.
              </p>
            </div>
            <div className="text-right text-xs font-semibold text-slate-500 hidden sm:block">
              <span className="block text-[10px] uppercase text-slate-400 tracking-wider">Date Today</span>
              <span>{currentDate}</span>
            </div>
          </div>

          {/* Academic Year Selection drop list (only for Admin role) */}
          <div className="rounded-xl border border-slate-250 bg-white p-4 text-center shadow-sm">
            <label className="block text-[10px] uppercase font-bold text-slate-400 text-left tracking-wider">
              Academic Term Session
            </label>
            <select
              value={selectedAY}
              disabled={summaryRole !== "ADMIN"}
              onChange={(e) => handleAYChange(e.target.value)}
              className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
            >
              {academicYears.map((ay) => (
                <option key={ay._id} value={ay._id}>
                  {ay.name} {ay.isCurrent ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* INSTANT FULL-TEXT DATABASE SEARCH BAR */}
        <section className="relative">
          <div className="flex h-11 w-full items-center gap-3 rounded-xl border border-slate-250 bg-white px-4 shadow-sm hover:border-slate-350 transition duration-200">
            <Search className="text-slate-400 shrink-0" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                summaryRole === "PARENT"
                  ? "Search invoices, exam schedules..."
                  : summaryRole === "TEACHER"
                  ? "Search students, exam schedules..."
                  : "Instant database lookup (students, admissions, invoices, exam schedules...)"
              }
              className="w-full text-xs font-medium text-slate-900 bg-transparent placeholder-slate-400 focus:outline-none"
            />
            {searchLoading && <Loader2 className="animate-spin text-blue-500 shrink-0" size={16} />}
          </div>

          {/* Search suggestions drawer panel overlay */}
          {showSearchResults && (
            <div className="absolute left-0 right-0 top-12 z-55 rounded-xl border border-slate-200 bg-white/95 backdrop-blur shadow-2xl p-4 space-y-4 max-h-[380px] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                  <SearchCheck size={12} /> Search results matches
                </span>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShowSearchResults(false);
                  }}
                  className="text-[10px] font-bold text-slate-450 hover:text-slate-900 cursor-pointer"
                >
                  Clear search
                </button>
              </div>

              {!hasSearchResults ? (
                <p className="text-xs text-slate-450 py-4 text-center font-semibold">
                  No matching database entries located for "{searchQuery}".
                </p>
              ) : (
                <div className="grid gap-4.5 sm:grid-cols-2 md:grid-cols-3">
                  {/* Students match results */}
                  {searchResults.students?.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-extrabold text-blue-650 uppercase tracking-wider mb-2">
                        Students ({searchResults.students.length})
                      </h4>
                      <div className="space-y-1.5">
                        {searchResults.students.map((res) => (
                          <Link
                            key={res.id}
                            to={`/students/profile/${res.id}`}
                            className="block p-2 rounded-lg bg-slate-50 hover:bg-blue-50 hover:border-blue-100 border border-transparent transition text-xs"
                          >
                            <p className="font-extrabold text-slate-900">{res.title}</p>
                            <p className="text-[10px] text-slate-450 mt-0.5">{res.subtitle}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admissions match results */}
                  {searchResults.admissions?.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-extrabold text-emerald-650 uppercase tracking-wider mb-2">
                        Admissions ({searchResults.admissions.length})
                      </h4>
                      <div className="space-y-1.5">
                        {searchResults.admissions.map((res) => (
                          <Link
                            key={res.id}
                            to={res.route}
                            className="block p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-100 border border-transparent transition text-xs"
                          >
                            <p className="font-extrabold text-slate-900">{res.title}</p>
                            <p className="text-[10px] text-slate-450 mt-0.5">{res.subtitle}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Staff match results */}
                  {searchResults.staff?.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-extrabold text-purple-650 uppercase tracking-wider mb-2">
                        Staff ({searchResults.staff.length})
                      </h4>
                      <div className="space-y-1.5">
                        {searchResults.staff.map((res) => (
                          <Link
                            key={res.id}
                            to={res.route}
                            className="block p-2 rounded-lg bg-slate-50 hover:bg-purple-50 hover:border-purple-100 border border-transparent transition text-xs"
                          >
                            <p className="font-extrabold text-slate-900">{res.title}</p>
                            <p className="text-[10px] text-slate-450 mt-0.5">{res.subtitle}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exams matches */}
                  {searchResults.exams?.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-extrabold text-amber-650 uppercase tracking-wider mb-2">
                        Exams ({searchResults.exams.length})
                      </h4>
                      <div className="space-y-1.5">
                        {searchResults.exams.map((res) => (
                          <Link
                            key={res.id}
                            to={res.route}
                            className="block p-2 rounded-lg bg-slate-50 hover:bg-amber-50 hover:border-amber-100 border border-transparent transition text-xs"
                          >
                            <p className="font-extrabold text-slate-900">{res.title}</p>
                            <p className="text-[10px] text-slate-450 mt-0.5">{res.subtitle}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Finance matches */}
                  {searchResults.finance?.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-extrabold text-rose-650 uppercase tracking-wider mb-2">
                        Finance Invoices ({searchResults.finance.length})
                      </h4>
                      <div className="space-y-1.5">
                        {searchResults.finance.map((res) => (
                          <Link
                            key={res.id}
                            to={res.route}
                            className="block p-2 rounded-lg bg-slate-50 hover:bg-rose-50 hover:border-rose-100 border border-transparent transition text-xs"
                          >
                            <p className="font-extrabold text-slate-900">{res.title}</p>
                            <p className="text-[10px] text-slate-450 mt-0.5">{res.subtitle}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* LOADING AND ERROR HANDLERS */}
        {loading && !summaryData && (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-800">
            <AlertCircle className="mx-auto" size={24} />
            <h3 className="mt-2 text-sm font-bold">Failed to load dashboard summaries</h3>
            <p className="text-xs mt-1 text-red-650">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-red-700 cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* MAIN SUMMARY DASHBOARD RENDERER FOR CURRENT USER ROLE */}
        {summaryData && (
          <>
            {summaryRole === "TEACHER" && renderTeacherDashboard(summaryData)}
            {summaryRole === "PARENT" && renderParentDashboard(summaryData)}
            {summaryRole === "ADMIN" && renderAdminDashboard(summaryData)}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;
