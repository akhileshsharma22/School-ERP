import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users, CheckCircle, XCircle, TrendingUp, BarChart2, Award, Trophy,
  ArrowDown, Loader2, RefreshCw, Filter
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line
} from "recharts";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  fetchExams, fetchAnalyticsOverview, fetchTopStudents
} from "../../redux/slices/examSlice";
import { fetchAcademicYears } from "../../redux/slices/academicYearSlice";
import { fetchAllClasses } from "../../redux/slices/classSectionSlice";
import { fetchAllExamTypes } from "../../redux/slices/examTypeSlice";
import { fetchAllSubjects } from "../../redux/slices/subjectSlice";


const GRADE_COLORS_MAP = {
  A1: "#10b981", A2: "#22c55e", B1: "#3b82f6", B2: "#60a5fa",
  C1: "#f59e0b", C2: "#fbbf24", D: "#f97316", F: "#ef4444",
};

const KPICard = ({ label, value, sub, icon: Icon, colorClass }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 hover:shadow-md transition duration-200">
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-2xl font-extrabold tracking-tight text-slate-900 truncate max-w-[160px]" title={value}>
          {value ?? "—"}
        </p>
        {sub && <p className="text-[11px] font-medium text-slate-400 truncate max-w-[170px]" title={sub}>{sub}</p>}
      </div>
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, children, hasData }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 flex flex-col justify-between">
    <div className="border-b border-slate-100 pb-3 mb-4">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    </div>
    <div className="flex-1 min-h-[220px] flex items-center justify-center">
      {hasData ? (
        children
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-400 space-y-2 py-8">
          <BarChart2 size={36} className="text-slate-300 stroke-[1.5]" />
          <p className="text-xs font-semibold">No performance data available</p>
        </div>
      )}
    </div>
  </div>
);

const ExamAnalyticsPage = () => {
  const dispatch = useDispatch();

  // Redux Selectors
  const { exams, analyticsOverview, analyticsLoading, topStudents, topStudentsLoading } = useSelector((s) => s.exams);
  const { academicYears } = useSelector((s) => s.academicYear);
  const { classes } = useSelector((s) => s.classSections);
  const { examTypes } = useSelector((s) => s.examTypes);
  const { subjects } = useSelector((s) => s.subjects);

  // Filters State
  const [filterAY, setFilterAY] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterET, setFilterET] = useState("");
  const [filterExam, setFilterExam] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  
  const [showBottom, setShowBottom] = useState(false);

  // Load Filters Option on Mount
  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchAllClasses());
    dispatch(fetchAllExamTypes());
    dispatch(fetchAllSubjects());
    dispatch(fetchExams({ limit: 100 }));
  }, [dispatch]);

  // Handler helpers to reset dependents
  const handleClassChange = (val) => {
    setFilterClass(val);
    setFilterSection("");
    setFilterSubject("");
  };

  const handleAYChange = (val) => {
    setFilterAY(val);
    setFilterExam("");
  };

  const handleETChange = (val) => {
    setFilterET(val);
    setFilterExam("");
  };

  // Memoized derived filters
  const classSections = useMemo(() => {
    if (!filterClass) return [];
    const cls = classes.find((c) => c.className === filterClass);
    return cls?.sections?.map((s) => (typeof s === "string" ? s : s.name)) || [];
  }, [classes, filterClass]);

  const filteredExams = useMemo(() => {
    let list = exams;
    if (filterAY) list = list.filter((e) => (e.academicYear?._id || e.academicYear) === filterAY);
    if (filterET) list = list.filter((e) => (e.examType?._id || e.examType) === filterET);
    return list;
  }, [exams, filterAY, filterET]);

  const classSubjects = useMemo(() => {
    if (!filterClass) return subjects;
    return subjects.filter((s) => s.classAssignments?.some((a) => a.className === filterClass));
  }, [subjects, filterClass]);

  // Fetch Action logic on filter changes
  const loadData = () => {
    const params = {};
    if (filterAY) params.academicYear = filterAY;
    if (filterClass) params.className = filterClass;
    if (filterSection) params.section = filterSection;
    if (filterET) params.examType = filterET;
    if (filterExam) params.exam = filterExam;
    if (filterSubject) params.subject = filterSubject;

    const fetchData = async () => {
      const res = await dispatch(fetchAnalyticsOverview(params));
      if (fetchAnalyticsOverview.rejected.match(res)) {
        toast.error(res.payload || "Failed to load analytics");
      }
      dispatch(fetchTopStudents({ ...params, limit: 10, order: showBottom ? "bottom" : "top" }));
    };
    fetchData();
  };

  useEffect(() => {
    loadData();
  }, [dispatch, filterAY, filterClass, filterSection, filterET, filterExam, filterSubject, showBottom]);

  // Derived chart data memoizations
  const passFailData = useMemo(() => {
    if (!analyticsOverview?.overview) return [];
    const passed = analyticsOverview.overview.passed || 0;
    const failed = analyticsOverview.overview.failed || 0;
    if (passed === 0 && failed === 0) return [];
    return [
      { name: "Passed", value: passed, color: "#10b981" },
      { name: "Failed", value: failed, color: "#ef4444" }
    ];
  }, [analyticsOverview]);

  const gradeData = useMemo(() => {
    return analyticsOverview?.gradeDistribution?.map((g) => ({
      grade: g.grade,
      count: g.count,
      fill: GRADE_COLORS_MAP[g.grade] || "#94a3b8",
    })) || [];
  }, [analyticsOverview]);

  const classPerformData = useMemo(() => {
    return analyticsOverview?.classPerformance?.map((c) => ({
      name: c.className,
      avg: c.avgPercent,
    })) || [];
  }, [analyticsOverview]);

  const sectionPerformData = useMemo(() => {
    return analyticsOverview?.sectionPerformance?.map((s) => ({
      name: s.sectionName,
      avg: s.avgPercent,
    })) || [];
  }, [analyticsOverview]);

  const subjectData = useMemo(() => {
    return (analyticsOverview?.subjectPerformance || []).slice(0, 10).map((s) => ({
      name: s.subjectName?.length > 12 ? s.subjectName.slice(0, 12) + "…" : s.subjectName,
      avg: s.avgPercent,
      pass: s.passPercent,
      fail: s.failPercent,
    }));
  }, [analyticsOverview]);

  const monthlyTrendData = useMemo(() => {
    return analyticsOverview?.monthlyTrend?.map((m) => ({
      name: m.month,
      avg: m.avgPercent,
      exams: m.examCount,
    })) || [];
  }, [analyticsOverview]);

  // Overall check if we have any total records
  const hasData = analyticsOverview?.overview?.total > 0;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-12">
        {/* Header */}
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Examinations</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">Exam Analytics</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Interactive reports, subject difficulty analysis, class rankings, and monthly performance trends.
            </p>
          </div>
          <button onClick={loadData} disabled={analyticsLoading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 shrink-0">
            <RefreshCw size={18} className={analyticsLoading ? "animate-spin" : ""} />
            Refresh Analytics
          </button>
        </header>

        {/* Filters Panel */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Filter size={14} />
            Filter Dashboards
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Academic Year</label>
              <select value={filterAY} onChange={(e) => handleAYChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="">All Years</option>
                {academicYears.map((ay) => <option key={ay._id} value={ay._id}>{ay.name || ay.label || ay.year}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Class</label>
              <select value={filterClass} onChange={(e) => handleClassChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="">All Classes</option>
                {classes.map((c) => <option key={c._id} value={c.className}>{c.className}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Section</label>
              <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} disabled={!filterClass}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed">
                <option value="">All Sections</option>
                {classSections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Exam Type</label>
              <select value={filterET} onChange={(e) => handleETChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="">All Types</option>
                {examTypes.map((et) => <option key={et._id} value={et._id}>{et.examName}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Examination</label>
              <select value={filterExam} onChange={(e) => setFilterExam(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="">All Exams</option>
                {filteredExams.map((e) => <option key={e._id} value={e._id}>{e.examName}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Subject</label>
              <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="">All Subjects</option>
                {classSubjects.map((s) => <option key={s._id} value={s._id}>{s.subjectName}</option>)}
              </select>
            </div>
          </div>
        </section>

        {analyticsLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
            <Loader2 className="animate-spin text-slate-900" size={32} />
            <p className="text-sm font-semibold">Aggregating database statistics…</p>
          </div>
        ) : !hasData ? (
          // Professional Empty State Illustration Card
          <section className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 px-6 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-400 shadow-inner">
              <BarChart2 size={40} className="stroke-[1.25]" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-900">No Examination Data Available</h2>
            <p className="mt-2 mx-auto max-w-md text-sm text-slate-500 leading-relaxed">
              We couldn't find any grading summary records for the selected filters. Complete marks entry and result processing to view analytics.
            </p>
            { (filterAY || filterClass || filterSection || filterET || filterExam || filterSubject) && (
              <button
                onClick={() => {
                  setFilterAY(""); setFilterClass(""); setFilterSection("");
                  setFilterET(""); setFilterExam(""); setFilterSubject("");
                }}
                className="mt-6 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Clear All Filters
              </button>
            )}
          </section>
        ) : (
          <>
            {/* 8 KPI Cards Grid */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPICard label="Total Candidates" value={analyticsOverview.overview.total} icon={Users} colorClass="bg-slate-100 text-slate-600" />
              <KPICard label="Passed Students" value={analyticsOverview.overview.passed} sub="Cleared passing thresholds" icon={CheckCircle} colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100" />
              <KPICard label="Failed Students" value={analyticsOverview.overview.failed} sub="Below minimum standards" icon={XCircle} colorClass="bg-red-50 text-red-600 border border-red-100" />
              <KPICard label="Pass Percentage" value={`${analyticsOverview.overview.passPercent}%`} icon={TrendingUp} colorClass="bg-teal-50 text-teal-600 border border-teal-100" />
              <KPICard label="Class Average" value={`${analyticsOverview.overview.classAvg}%`} sub="Mean percentage scored" icon={BarChart2} colorClass="bg-indigo-50 text-indigo-600 border border-indigo-100" />
              <KPICard label="Highest Score" value={`${analyticsOverview.overview.highest}%`} sub="Topper score" icon={Award} colorClass="bg-amber-50 text-amber-600 border border-amber-100" />
              <KPICard label="Lowest Score" value={`${analyticsOverview.overview.lowest}%`} sub="Minimum score recorded" icon={ArrowDown} colorClass="bg-rose-50 text-rose-600 border border-rose-100" />
              <KPICard label="Top Performer" value={analyticsOverview.overview.topper} sub="Overall top scorer" icon={Trophy} colorClass="bg-yellow-50 text-yellow-600 border border-yellow-100 animate-pulse" />
            </section>

            {/* Row 1 Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <ChartCard title="Pass vs Fail Distribution" hasData={passFailData.length > 0}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={passFailData} cx="50%" cy="55%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" nameKey="name">
                      {passFailData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Students`, "Count"]} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Grade Distribution Bracket" hasData={gradeData.length > 0}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={gradeData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="grade" tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                    <Tooltip cursor={{ fill: "#f8fafc" }} />
                    <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                      {gradeData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Row 2 Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <ChartCard title="Subject Performance Breakdown" hasData={subjectData.length > 0}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={subjectData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`]} />
                    <Legend />
                    <Bar dataKey="avg" name="Avg %" fill="#6366f1" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="pass" name="Pass %" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="fail" name="Fail %" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Class-wise Performance Average" hasData={classPerformData.length > 0}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={classPerformData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, "Class Avg"]} />
                    <Bar dataKey="avg" name="Class Average %" fill="#3b82f6" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Row 3 Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <ChartCard title="Section-wise Performance Breakdown" hasData={sectionPerformData.length > 0}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sectionPerformData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, "Section Avg"]} />
                    <Bar dataKey="avg" name="Section Average %" fill="#06b6d4" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Monthly Examination Performance Trend" hasData={monthlyTrendData.length > 0}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} domain={[0, 100]} />
                    <Tooltip formatter={(value, name) => [name === "avg" ? `${value}%` : value, name === "avg" ? "Avg %" : "Exams Conducted"]} />
                    <Legend />
                    <Area type="monotone" dataKey="avg" name="Average % Score" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" />
                    <Line type="monotone" dataKey="exams" name="Exams Count" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Subject Difficulty Analysis Details Table */}
            {analyticsOverview?.subjectPerformance?.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <h2 className="text-base font-bold text-slate-950">Subject Difficulty Analysis</h2>
                  <span className="text-xs text-slate-400">Sorted by failure rate</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80">
                        {["Subject","Avg Score %","Highest %","Lowest %","Pass Rate %","Failure Rate %","Status / Difficulty"].map((h) => (
                          <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...analyticsOverview.subjectPerformance].sort((a, b) => b.failPercent - a.failPercent).map((s, i) => (
                        <tr key={i} className="transition hover:bg-slate-50/80">
                          <td className="px-5 py-3 text-sm font-semibold text-slate-950">{s.subjectName}</td>
                          <td className="px-5 py-3 text-sm font-bold text-slate-700">{s.avgPercent}%</td>
                          <td className="px-5 py-3 text-sm text-emerald-600 font-semibold">{s.highest}%</td>
                          <td className="px-5 py-3 text-sm text-red-600 font-semibold">{s.lowest}%</td>
                          <td className="px-5 py-3 text-sm font-semibold text-emerald-700">{s.passPercent}%</td>
                          <td className="px-5 py-3 text-sm font-semibold text-red-700">{s.failPercent}%</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold
                              ${s.failPercent > 40 ? "border-red-200 bg-red-50 text-red-700" :
                                s.failPercent > 20 ? "border-amber-200 bg-amber-50 text-amber-700" :
                                "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                              {s.failPercent > 40 ? "High (Hard)" : s.failPercent > 20 ? "Medium" : "Low (Easy)"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Top / Bottom Students Rank List */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
              <div className="flex items-center gap-4 border-b border-slate-200 px-6 py-4">
                <h2 className="text-base font-bold text-slate-950 flex items-center gap-2">
                  <Trophy size={18} className="text-yellow-500" />
                  {showBottom ? "Academic Low Performers (Bottom 10)" : "Academic High Achievers (Top 10)"}
                </h2>
                <button onClick={() => setShowBottom((v) => !v)}
                  className="ml-auto h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm">
                  Show {showBottom ? "Top 10 Achievers" : "Bottom 10 Students"}
                </button>
              </div>
              {topStudentsLoading ? (
                <div className="flex items-center justify-center gap-3 p-12 text-sm font-medium text-slate-500">
                  <Loader2 className="animate-spin" size={18} /> Loading rankings…
                </div>
              ) : topStudents.length === 0 ? (
                <div className="p-12 text-center text-sm font-medium text-slate-400">
                  No rankings computed for selected filters
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80">
                        {["Rank / Pos","Adm. No","Student Name","Class & Section","Obtained Avg %","Final Grade","Status"].map((h) => (
                          <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {topStudents.map((r, i) => {
                        const name = r.student ? `${r.student.firstName} ${r.student.lastName}` : "—";
                        return (
                          <tr key={r._id || i} className="transition hover:bg-slate-50/80">
                            <td className="px-5 py-3">
                              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold
                                ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-200 text-slate-700" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}`}>
                                {r.rank || i + 1}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-sm font-semibold text-slate-700">{r.student?.admissionNo || "—"}</td>
                            <td className="px-5 py-3 text-sm font-semibold text-slate-950">{name}</td>
                            <td className="px-5 py-3 text-sm text-slate-600">{r.className} · {r.section}</td>
                            <td className="px-5 py-3 text-sm font-bold text-slate-950">{r.percentage?.toFixed(2)}%</td>
                            <td className="px-5 py-3 text-sm font-extrabold" style={{ color: GRADE_COLORS_MAP[r.grade] || "#64748b" }}>{r.grade}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold
                                ${r.resultStatus === "PASS" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                                {r.resultStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ExamAnalyticsPage;
