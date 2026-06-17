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
  Search,
  AlertCircle,
  TrendingUp,
  Award,
  BookOpenCheck,
  UserCheck,
  SearchCheck,
  Loader2,
  CalendarCheck
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
  Legend,
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

const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-3">
    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">{title}</h3>
    {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
  </div>
);

const EmptyStateWidget = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center text-slate-400 space-y-2">
    <AlertCircle size={22} className="text-slate-350" />
    <p className="text-xs font-semibold">{message || "No dynamic records found."}</p>
  </div>
);

const DashboardHome = () => {
  const dispatch = useDispatch();

  // Redux Selectors
  const { summary, searchResults, loading, searchLoading } = useSelector((s) => s.dashboard);
  const { academicYears } = useSelector((s) => s.academicYear);
  const { user } = useSelector((s) => s.auth);

  // Local state
  const [selectedAY, setSelectedAY] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Fetch academic years on mount
  useEffect(() => {
    dispatch(fetchAcademicYears());
  }, [dispatch]);

  // Set default current academic year
  useEffect(() => {
    if (academicYears.length > 0 && !selectedAY) {
      const current = academicYears.find(ay => ay.isCurrent) || academicYears[0];
      setSelectedAY(current._id);
    }
  }, [academicYears, selectedAY]);

  // Fetch dashboard summary when academic year selection changes
  useEffect(() => {
    if (selectedAY) {
      dispatch(fetchDashboardSummary(selectedAY));
    }
  }, [dispatch, selectedAY]);

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

  const currentDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  // Pie chart formatting helper
  const pieData = useMemo(() => {
    if (!summary?.studentOverview?.categoryDistribution) return [];
    return summary.studentOverview.categoryDistribution.filter(c => c.count > 0);
  }, [summary]);

  const hasSearchResults = useMemo(() => {
    const r = searchResults;
    return r.students?.length > 0 || r.staff?.length > 0 || r.admissions?.length > 0 || r.finance?.length > 0 || r.exams?.length > 0;
  }, [searchResults]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1600px] space-y-5 pb-8">
        
        {/* TOP COMMANDER CONTROLS & WELCOME BAR */}
        <section className="grid gap-3.5 md:grid-cols-[1fr_280px] items-center">
          <div className="rounded-xl border border-slate-250 bg-white p-4.5 shadow-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                <TrendingUp size={11} /> Live Command Center
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
                Welcome back, {user?.fullName || "Akhilesh"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Operational stats aggregates and real-time database queries are updated for today.
              </p>
            </div>
            <div className="text-right text-xs font-semibold text-slate-500 hidden sm:block">
              <span className="block text-[10px] uppercase text-slate-400 tracking-wider">Date Today</span>
              <span className="text-slate-900 font-bold mt-0.5 block">{currentDate}</span>
            </div>
          </div>

          {/* Academic Session Selector Widget */}
          <div className="rounded-xl border border-slate-250 bg-white p-3.5 shadow-sm flex flex-col justify-center">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Academic Year</label>
            <select
              value={selectedAY}
              onChange={(e) => setSelectedAY(e.target.value)}
              className="mt-1 h-9.5 w-full rounded-lg border border-slate-200 px-2.5 text-xs outline-none bg-white font-bold text-slate-800 focus:border-slate-450"
            >
              {academicYears.map((ay) => (
                <option key={ay._id} value={ay._id}>
                  {ay.name} {ay.isCurrent ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* SPOTLIGHT GLOBAL SEARCH */}
        <section className="relative">
          <div className="relative rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden focus-within:border-slate-400 transition">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Instant Global Search - type Student, Admission No, Staff ID, Bill Invoice, or Exam to search database..."
              className="h-10.5 w-full pl-9.5 pr-12 text-xs outline-none font-semibold text-slate-800"
            />
            {searchLoading && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-slate-450" size={14} />
            )}
          </div>

          {/* Search Dropdown Overlay */}
          {showSearchResults && (
            <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-[420px] overflow-y-auto rounded-xl border border-slate-250 bg-white p-3.5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <SearchCheck size={13} className="text-slate-500" /> Database Query Matches
                </span>
                <button
                  onClick={() => { setSearchQuery(""); setShowSearchResults(false); }}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
                >
                  Clear
                </button>
              </div>

              {!hasSearchResults ? (
                <div className="py-5 text-center text-xs text-slate-400 font-bold">
                  No records found matching "{searchQuery}"
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 text-xs font-semibold text-slate-700">
                  {/* Students Column */}
                  {searchResults.students?.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-600 border-b border-blue-50 pb-0.5">Students</h4>
                      {searchResults.students.map(s => (
                        <Link key={s.id} to={s.route} className="block p-1.5 hover:bg-slate-50 rounded-lg">
                          <p className="font-bold text-slate-900 truncate">{s.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">{s.subtitle}</p>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Admissions Column */}
                  {searchResults.admissions?.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 border-b border-emerald-50 pb-0.5">Admissions</h4>
                      {searchResults.admissions.map(a => (
                        <Link key={a.id} to={a.route} className="block p-1.5 hover:bg-slate-50 rounded-lg">
                          <p className="font-bold text-slate-900 truncate">{a.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">{a.subtitle}</p>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Staff Column */}
                  {searchResults.staff?.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-purple-600 border-b border-purple-50 pb-0.5">Staff</h4>
                      {searchResults.staff.map(st => (
                        <Link key={st.id} to={st.route} className="block p-1.5 hover:bg-slate-50 rounded-lg">
                          <p className="font-bold text-slate-900 truncate">{st.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">{st.subtitle}</p>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Fees/Finance Column */}
                  {searchResults.finance?.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-600 border-b border-rose-50 pb-0.5">Fees & Finance</h4>
                      {searchResults.finance.map(f => (
                        <Link key={f.id} to={f.route} className="block p-1.5 hover:bg-slate-50 rounded-lg">
                          <p className="font-bold text-slate-900 truncate">{f.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">{f.subtitle}</p>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Exams Column */}
                  {searchResults.exams?.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-600 border-b border-amber-50 pb-0.5">Examinations</h4>
                      {searchResults.exams.map(e => (
                        <Link key={e.id} to={e.route} className="block p-1.5 hover:bg-slate-50 rounded-lg">
                          <p className="font-bold text-slate-900 truncate">{e.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">{e.subtitle}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {loading && !summary ? (
          <div className="flex items-center justify-center py-20 text-slate-500 font-semibold gap-2">
            <Loader2 className="animate-spin text-blue-600" size={20} /> Fetching Command Center metrics...
          </div>
        ) : !summary ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            No statistics configured or loaded. Please select an active Academic Year.
          </div>
        ) : (
          <>
            {/* TOP KPI SECTION */}
            <section className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-8">
              <StatKpiCard
                title="Total Students"
                value={summary.kpis.totalStudents}
                icon={Users}
                color="#2563EB"
                helper="Active Enrollment"
              />
              <StatKpiCard
                title="New Admissions"
                value={summary.kpis.newAdmissions}
                icon={UserPlus}
                color="#10B981"
                helper="Approved admissions"
              />
              <StatKpiCard
                title="Total Staff"
                value={summary.kpis.totalStaff}
                icon={GraduationCap}
                color="#8B5CF6"
                helper="Active employees"
              />
              <StatKpiCard
                title="Attendance Today"
                value={`${summary.kpis.studentAttendanceRateToday}%`}
                icon={ClipboardCheck}
                color="#3B82F6"
                helper="Present percentage"
              />
              <StatKpiCard
                title="Fees Collected"
                value={`₹${(summary.kpis.feesCollected || 0).toLocaleString("en-IN")}`}
                icon={IndianRupee}
                color="#059669"
                helper="Collections to date"
              />
              <StatKpiCard
                title="Pending Fees"
                value={`₹${(summary.kpis.pendingFees || 0).toLocaleString("en-IN")}`}
                icon={ReceiptText}
                color="#EF4444"
                helper="Outstanding dues"
              />
              <StatKpiCard
                title="Active Classes"
                value={summary.kpis.activeClasses}
                icon={BookOpen}
                color="#6366F1"
                helper="Academic classes"
              />
              <StatKpiCard
                title="Upcoming Exams"
                value={summary.kpis.upcomingExams}
                icon={FileBarChart}
                color="#F59E0B"
                helper="Scheduled/Active"
              />
            </section>

            {/* FIRST ROW: ACADEMIC & ADMISSION OVERVIEW */}
            <section className="grid gap-4.5 md:grid-cols-2">
              {/* Academic Overview */}
              <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm flex flex-col justify-between">
                <div>
                  <SectionHeader title="Academic Overview" subtitle="Total master setup parameters and class capacities" />
                  <div className="grid grid-cols-4 gap-2.5 mb-4 text-center">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <span className="block text-lg font-bold text-slate-800">{summary.academicOverview.activeClasses}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Classes</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <span className="block text-lg font-bold text-slate-800">{summary.academicOverview.activeSections}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Sections</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <span className="block text-lg font-bold text-slate-800">{summary.academicOverview.activeStreams}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Streams</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <span className="block text-lg font-bold text-slate-800">{summary.academicOverview.activeSubjects}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Subjects</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 border-b pb-0.5">Students enrollment per class</h4>
                  {summary.academicOverview.studentsPerClass.length === 0 ? (
                    <EmptyStateWidget message="No classes set up with active student profiles." />
                  ) : (
                    summary.academicOverview.studentsPerClass.map((spc) => (
                      <div key={spc.className} className="flex justify-between items-center text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg">
                        <span>{spc.className}</span>
                        <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full text-[10px]">{spc.count} Students</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Admission Overview */}
              <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm flex flex-col justify-between">
                <div>
                  <SectionHeader title="Admissions & Enquiries" subtitle="Funnel conversions and conversion rates" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 text-center">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <span className="block text-lg font-bold text-slate-800">{summary.admissionOverview.totalEnquiries}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Total Enquiries</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <span className="block text-lg font-bold text-slate-800">{summary.admissionOverview.pendingEnquiries}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Pending Enquiries</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <span className="block text-lg font-bold text-slate-800">{summary.admissionOverview.approvedAdmissions}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Approved Admissions</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <span className="block text-lg font-bold text-slate-800">{summary.admissionOverview.rejectedAdmissions}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Rejected Admissions</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Conversion Rate</span>
                    <span className="text-xl font-extrabold text-slate-900">{summary.admissionOverview.admissionConversionRate}%</span>
                    <span className="text-[10px] text-slate-400 font-medium block">Approved / Total Enquiries</span>
                  </div>
                  <div className="w-32 bg-slate-200 rounded-full h-2 shadow-inner">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${summary.admissionOverview.admissionConversionRate}%` }} />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Current Month</span>
                    <span className="font-extrabold text-blue-600 block mt-0.5">{summary.admissionOverview.currentMonthAdmissions} New</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SECOND ROW: STUDENT & STAFF OVERVIEW */}
            <section className="grid gap-4.5 md:grid-cols-2">
              {/* Student Overview */}
              <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm flex flex-col justify-between">
                <div>
                  <SectionHeader title="Student Demographics" subtitle="Active gender breakdown and social category statistics" />
                  
                  {/* Gender Split Bar */}
                  <div className="space-y-1 mb-4.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span className="text-blue-600">Boys: {summary.studentOverview.boys}</span>
                      <span className="text-pink-600">Girls: {summary.studentOverview.girls}</span>
                    </div>
                    <div className="w-full flex rounded-full overflow-hidden h-2.5 bg-slate-100 shadow-inner">
                      <div className="bg-blue-500 transition-all" style={{ width: `${safePercentage(summary.studentOverview.boys, summary.studentOverview.totalStudents)}%` }} />
                      <div className="bg-pink-500 transition-all" style={{ width: `${safePercentage(summary.studentOverview.girls, summary.studentOverview.totalStudents)}%` }} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-[160px_1fr] gap-3 items-center min-h-[140px]">
                  {/* Category Pie Chart */}
                  <div className="w-full h-36">
                    {pieData.length === 0 ? (
                      <EmptyStateWidget message="No categories populated" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={28}
                            outerRadius={45}
                            dataKey="count"
                            nameKey="category"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Category Counts Listing */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                    {summary.studentOverview.categoryDistribution.map((cat, idx) => (
                      <div key={cat.category} className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded-lg">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                        <span className="truncate">{cat.category} ({cat.count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Staff Overview */}
              <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm flex flex-col justify-between">
                <div>
                  <SectionHeader title="Staff & Administration" subtitle="Human resources, department numbers, and attendance rate today" />
                  
                  <div className="grid grid-cols-3 gap-2.5 mb-4 text-center">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <span className="block text-lg font-bold text-slate-800">{summary.staffOverview.totalStaff}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Total Staff</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <span className="block text-lg font-bold text-slate-800">{summary.staffOverview.teachingStaff}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Teaching</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                      <span className="block text-lg font-bold text-slate-800">{summary.staffOverview.nonTeachingStaff}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Non-Teaching</span>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3.5 text-xs font-semibold text-slate-700">
                  {/* Department Staff Numbers */}
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 border-b pb-0.5">Department distribution</h4>
                    {summary.staffOverview.departmentDistribution.length === 0 ? (
                      <EmptyStateWidget message="No staff members allocated" />
                    ) : (
                      summary.staffOverview.departmentDistribution.map((dept) => (
                        <div key={dept.departmentName} className="flex justify-between items-center bg-slate-50 px-2.5 py-1 rounded-lg">
                          <span className="truncate max-w-[120px]">{dept.departmentName}</span>
                          <span className="font-bold text-slate-800">{dept.count}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Staff Attendance Summary Today */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 flex flex-col justify-center text-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Staff Present Today</span>
                    <span className="text-2xl font-extrabold text-purple-700 mt-1 block">{summary.staffOverview.staffAttendanceRateToday}%</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">Daily HR Attendance Check</span>
                  </div>
                </div>
              </div>
            </section>

            {/* THIRD ROW: ATTENDANCE & EXAMINATION OVERVIEW */}
            <section className="grid gap-4.5 md:grid-cols-[1.2fr_0.8fr]">
              {/* Attendance Overview */}
              <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm flex flex-col justify-between">
                <div>
                  <SectionHeader title="Daily Student Attendance Trends" subtitle="30-day tracking history and class attendance summaries" />
                  
                  {/* Today attendance summary */}
                  <div className="grid grid-cols-3 gap-2.5 mb-3.5 text-center text-xs font-bold">
                    <div className="bg-blue-50/50 p-1.5 rounded-lg border border-blue-100">
                      <span className="block text-slate-800 font-extrabold text-sm">{summary.attendanceOverview.presentStudents}</span>
                      <span className="text-[10px] text-blue-600 font-bold uppercase">Present Today</span>
                    </div>
                    <div className="bg-rose-50/50 p-1.5 rounded-lg border border-rose-100">
                      <span className="block text-slate-800 font-extrabold text-sm">{summary.attendanceOverview.absentStudents}</span>
                      <span className="text-[10px] text-rose-600 font-bold uppercase">Absent Today</span>
                    </div>
                    <div className="bg-amber-50/50 p-1.5 rounded-lg border border-amber-100">
                      <span className="block text-slate-800 font-extrabold text-sm">{summary.attendanceOverview.lateArrivals}</span>
                      <span className="text-[10px] text-amber-600 font-bold uppercase">Late Arrivals</span>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-[1.5fr_1fr] gap-4 items-center">
                  {/* Attendance Recharts graph */}
                  <div className="h-44 w-full">
                    {summary.attendanceOverview.studentAttendanceTrend.length === 0 ? (
                      <EmptyStateWidget message="No attendance data populated over the last 30 days." />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={summary.attendanceOverview.studentAttendanceTrend} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
                          <defs>
                            <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} />
                          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} tickFormatter={v => `${v}%`} />
                          <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}%`, "Rate"]} />
                          <Area type="monotone" dataKey="rate" stroke="#3B82F6" strokeWidth={2.5} fill="url(#attendanceGrad)" dot={{ r: 2 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Attendance rate by class */}
                  <div className="space-y-1.5 max-h-[176px] overflow-y-auto pr-1">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 border-b pb-0.5">Attendance by Class today</h4>
                    {summary.attendanceOverview.attendanceByClass.length === 0 ? (
                      <EmptyStateWidget message="No logs marked today" />
                    ) : (
                      summary.attendanceOverview.attendanceByClass.map((abc) => (
                        <div key={abc.className} className="flex justify-between items-center text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg">
                          <span>{abc.className}</span>
                          <span className={`font-bold ${abc.rate > 80 ? "text-emerald-600" : "text-amber-600"}`}>{abc.rate}%</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Examination Overview */}
              <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm flex flex-col justify-between">
                <div>
                  <SectionHeader title="Examination Performance" subtitle="Pass rates and overall exam statistics" />
                  
                  <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-150">
                      <span className="block text-slate-800 font-extrabold text-sm">{summary.examinationOverview.totalExams}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Total Exams</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-150">
                      <span className="block text-slate-800 font-extrabold text-sm">{summary.examinationOverview.resultsPublished}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Published</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {/* Overall Pass Percentage Indicator */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 flex items-center justify-between text-xs">
                    <div className="space-y-0.5 font-bold">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Overall Pass Rate</span>
                      <span className="text-xl font-extrabold text-slate-900">{summary.examinationOverview.overallPassRate}%</span>
                    </div>
                    <div className="w-20 bg-slate-250 rounded-full h-1.5 shadow-inner">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${summary.examinationOverview.overallPassRate}%` }} />
                    </div>
                  </div>

                  {/* Top & lowest performing indicators */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                    <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                      <span className="text-[9px] uppercase tracking-wider text-emerald-700 font-bold block">Top Performing</span>
                      <span className="font-extrabold text-slate-900 truncate block mt-0.5">{summary.examinationOverview.topPerformingClass}</span>
                    </div>
                    <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg">
                      <span className="text-[9px] uppercase tracking-wider text-rose-700 font-bold block">Lowest Performing</span>
                      <span className="font-extrabold text-slate-900 truncate block mt-0.5">{summary.examinationOverview.lowestPerformingClass}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* FOURTH ROW: FEES & FINANCE OVERVIEW */}
            <section className="grid gap-4.5 lg:grid-cols-[1.1fr_0.9fr]">
              {/* Financial Collection Summary */}
              <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm flex flex-col justify-between">
                <div>
                  <SectionHeader title="Fees & Finance Status" subtitle="Invoices collection, category waivers, and expectations" />
                  
                  {/* Expected, Paid, and Outstanding counts */}
                  <div className="grid grid-cols-3 gap-3 text-center mb-4 font-bold text-xs">
                    <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                      <span className="block text-slate-900 text-sm font-extrabold">₹{summary.financeOverview.expectedCollection.toLocaleString("en-IN")}</span>
                      <span className="text-[10px] text-blue-600 uppercase font-bold">Expected Collection</span>
                    </div>
                    <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                      <span className="block text-slate-900 text-sm font-extrabold">₹{summary.financeOverview.collectedAmount.toLocaleString("en-IN")}</span>
                      <span className="text-[10px] text-emerald-600 uppercase font-bold">Collected Amount</span>
                    </div>
                    <div className="bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                      <span className="block text-slate-900 text-sm font-extrabold">₹{summary.financeOverview.pendingAmount.toLocaleString("en-IN")}</span>
                      <span className="text-[10px] text-rose-600 uppercase font-bold">Outstanding Pending</span>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-[1.3fr_1fr] gap-4.5 items-center">
                  {/* Recharts collection Bar Chart */}
                  <div className="h-44 w-full">
                    {summary.financeOverview.monthlyCollectionTrend.length === 0 ? (
                      <EmptyStateWidget message="No fee payment collections processed this year." />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={summary.financeOverview.monthlyCollectionTrend} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
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
                      <span className="text-2xl font-extrabold text-emerald-700 block mt-1">{summary.financeOverview.collectionPercentage}%</span>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${summary.financeOverview.collectionPercentage}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg font-bold">
                      <span>Assigned Discounts & Waivers:</span>
                      <span className="text-rose-600 font-extrabold">₹{summary.financeOverview.totalDiscountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions Payments History */}
              <div className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm flex flex-col justify-between">
                <div>
                  <SectionHeader title="Recent Payment Receipts" subtitle="5 latest transaction records verified in the database" />
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {summary.financeOverview.recentCollections.length === 0 ? (
                      <EmptyStateWidget message="No transaction receipts verified." />
                    ) : (
                      summary.financeOverview.recentCollections.map((col) => (
                        <div key={col.receiptNumber} className="flex justify-between items-center text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-2 rounded-lg hover:bg-slate-100 transition">
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
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;
