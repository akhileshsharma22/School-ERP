import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  TrendingUp,
  Users,
  Briefcase,
  Loader2,
  Calendar,
  AlertCircle,
  Percent,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { fetchAttendanceAnalytics } from "../../redux/slices/attendanceSlice";

const AttendanceAnalyticsPage = () => {
  const dispatch = useDispatch();
  const { analyticsList, loading } = useSelector((state) => state.attendance);

  const [analyticsType, setAnalyticsType] = useState("student"); // 'student' | 'staff'

  useEffect(() => {
    dispatch(fetchAttendanceAnalytics({ type: analyticsType }));
  }, [dispatch, analyticsType]);

  const summaryStats = useMemo(() => {
    if (!analyticsList || analyticsList.length === 0) {
      return { avgRate: 100, highestDay: "—", highestRate: 100, lowestDay: "—", lowestRate: 100, totalDays: 0 };
    }

    let totalRate = 0;
    let highest = { rate: -1, date: "" };
    let lowest = { rate: 101, date: "" };

    analyticsList.forEach((item) => {
      totalRate += item.rate;
      if (item.rate > highest.rate) {
        highest = { rate: item.rate, date: item.date };
      }
      if (item.rate < lowest.rate) {
        lowest = { rate: item.rate, date: item.date };
      }
    });

    const avgRate = Math.round(totalRate / analyticsList.length);

    // Format dates to friendly strings
    const formatDate = (dateStr) => {
      if (!dateStr) return "—";
      const parts = dateStr.split("-");
      if (parts.length !== 3) return dateStr;
      const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    return {
      avgRate,
      highestDay: formatDate(highest.date),
      highestRate: highest.rate,
      lowestDay: formatDate(lowest.date),
      lowestRate: lowest.rate,
      totalDays: analyticsList.length,
    };
  }, [analyticsList]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Analytics
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              Attendance Analytics Trends
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Inspect visual analytics logs and track periodic attendance health curves.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setAnalyticsType("student")}
              className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold transition cursor-pointer ${
                analyticsType === "student"
                  ? "bg-slate-950 text-white shadow-sm"
                  : "bg-white border text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Users size={14} /> Student Analytics
            </button>
            <button
              onClick={() => setAnalyticsType("staff")}
              className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold transition cursor-pointer ${
                analyticsType === "staff"
                  ? "bg-slate-950 text-white shadow-sm"
                  : "bg-white border text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Briefcase size={14} /> Staff Analytics
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-sm font-medium text-slate-500">Compiling statistical indices...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary statistics row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {/* Avg attendance rate */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Avg Attendance
                  </span>
                  <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                    <Percent size={16} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-950">
                    {summaryStats.avgRate}%
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">30-day average</span>
                </div>
              </div>

              {/* Highest Day */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Peak Attendance Day
                  </span>
                  <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                    <Sparkles size={16} />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-bold text-slate-950 block">
                    {summaryStats.highestRate}%
                  </span>
                  <span className="text-xs text-slate-400 font-semibold block mt-1">
                    On {summaryStats.highestDay}
                  </span>
                </div>
              </div>

              {/* Lowest Day */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Lowest Attendance Day
                  </span>
                  <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                    <AlertCircle size={16} />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-bold text-slate-950 block">
                    {summaryStats.lowestRate}%
                  </span>
                  <span className="text-xs text-slate-400 font-semibold block mt-1">
                    On {summaryStats.lowestDay}
                  </span>
                </div>
              </div>

              {/* Total evaluated days */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Tracked Roster Days
                  </span>
                  <div className="rounded-lg bg-violet-50 p-2 text-violet-600">
                    <Calendar size={16} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-950">
                    {summaryStats.totalDays}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">days recorded</span>
                </div>
              </div>
            </div>

            {analyticsList.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <h3 className="text-sm font-bold text-slate-900">No analytics data recorded</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Daily registers must be marked and saved to generate graphical trend curves.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Daily Attendance Rate Trend Area Chart */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp size={18} className="text-indigo-600" /> Daily Attendance Rate (%)
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Shows percentage attendance changes over the last 30 operational days.
                  </p>
                  <div className="mt-6 h-80 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={analyticsList}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis domain={[0, 100]} stroke="#94a3b8" />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="rate"
                          name="Attendance %"
                          stroke="#4f46e5"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorRate)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Late Arrivals Bar Chart */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Clock size={18} className="text-amber-600" /> Daily Late Arrivals Count
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Tracks the frequency of late arrival flags for biometric audit logs.
                  </p>
                  <div className="mt-6 h-80 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analyticsList}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="late"
                          name="Late Arrivals"
                          fill="#d97706"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AttendanceAnalyticsPage;
