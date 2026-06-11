import DashboardLayout from "../../layouts/DashboardLayout";
import KpiCard from "../../components/dashboard/KpiCard";
import DashboardChartCard from "../../components/dashboard/DashboardChartCard";
import AttendanceOverviewChart from "../../components/dashboard/AttendanceOverviewChart";
import FeeCollectionChart from "../../components/dashboard/FeeCollectionChart";
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  FileBarChart,
  GraduationCap,
  IndianRupee,
  Megaphone,
  Plus,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

const kpis = [
  {
    title: "Total Students",
    value: "1,248",
    icon: Users,
    accent: "#2563EB",
    trend: "+8.2%",
    helper: "vs last term",
  },
  {
    title: "Total Staff",
    value: "86",
    icon: GraduationCap,
    accent: "#22C55E",
    trend: "+3",
    helper: "new hires",
  },
  {
    title: "Attendance Today",
    value: "91.4%",
    icon: ClipboardCheck,
    accent: "#22C55E",
    trend: "+2.1%",
    helper: "1,141 present",
  },
  {
    title: "Fee Collection",
    value: "Rs. 8.75L",
    icon: IndianRupee,
    accent: "#F59E0B",
    trend: "+14%",
    helper: "this month",
  },
  {
    title: "Pending Fees",
    value: "Rs. 2.18L",
    icon: ReceiptText,
    accent: "#EF4444",
    trend: "-6.5%",
    trendDirection: "down",
    helper: "312 invoices",
  },
];

const attendanceData = [
  { day: "Mon", attendance: 88 },
  { day: "Tue", attendance: 92 },
  { day: "Wed", attendance: 89 },
  { day: "Thu", attendance: 94 },
  { day: "Fri", attendance: 91 },
  { day: "Sat", attendance: 86 },
];

const feeData = [
  { month: "Jan", collected: 21, pending: 7 },
  { month: "Feb", collected: 34, pending: 9 },
  { month: "Mar", collected: 29, pending: 6 },
  { month: "Apr", collected: 46, pending: 11 },
  { month: "May", collected: 58, pending: 13 },
  { month: "Jun", collected: 72, pending: 16 },
];

const quickActions = [
  { title: "Add Student", icon: UserPlus },
  { title: "Add Staff", icon: GraduationCap },
  { title: "Collect Fee", icon: IndianRupee },
  { title: "Mark Attendance", icon: CalendarCheck },
  { title: "Create Notice", icon: Bell },
  { title: "Generate Report", icon: FileBarChart },
];

const activities = [
  {
    title: "Grade 8 attendance finalized",
    meta: "2 min ago by Meera S.",
    color: "bg-emerald-500",
  },
  {
    title: "New admission created for Aarav Menon",
    meta: "18 min ago by Admissions",
    color: "bg-blue-500",
  },
  {
    title: "Fee receipt INV-2841 generated",
    meta: "42 min ago by Finance",
    color: "bg-amber-500",
  },
  {
    title: "Transport route 4 updated",
    meta: "1 hr ago by Operations",
    color: "bg-slate-500",
  },
];

const announcements = [
  {
    title: "Unit test timetable released",
    tag: "High",
    tone: "bg-red-50 text-red-600",
  },
  {
    title: "PTM registrations close Friday",
    tag: "Medium",
    tone: "bg-amber-50 text-amber-600",
  },
  {
    title: "Library inventory audit",
    tag: "Info",
    tone: "bg-blue-50 text-blue-600",
  },
];

const events = [
  { date: "14", month: "Jun", title: "Parent Teacher Meeting", time: "10:00 AM" },
  { date: "18", month: "Jun", title: "Inter-house Debate", time: "12:30 PM" },
  { date: "22", month: "Jun", title: "Fee Due Date", time: "All day" },
];

const currentDate = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(new Date());

const DashboardHome = () => {
  return (
    <DashboardLayout>
      <div className="mx-auto grid max-w-[1600px] gap-4">
        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  <TrendingUp size={14} />
                  Live operations summary
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Welcome back, Akhilesh
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  Admissions, attendance, fees, and communication are healthy across the active academic session.
                </p>
              </div>

              <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#0F172A] text-white shadow-lg shadow-slate-300 md:flex">
                <ShieldCheck size={30} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 sm:grid-cols-3 xl:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Academic Year
              </p>
              <p className="mt-1 text-lg font-bold text-slate-950">2026-27</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Today
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{currentDate}</p>
            </div>
            <div className="col-span-2 flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 sm:col-span-1 xl:col-span-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Plus size={17} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-950">148 tasks</p>
                <p className="text-xs text-slate-500">open across departments</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map((item) => (
            <KpiCard key={item.title} {...item} />
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <DashboardChartCard title="Attendance Overview" meta="Daily student attendance rate">
            <AttendanceOverviewChart data={attendanceData} />
          </DashboardChartCard>

          <DashboardChartCard title="Monthly Fee Collection" meta="Collected and pending fees in lakhs">
            <FeeCollectionChart data={feeData} />
          </DashboardChartCard>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr_1fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-bold tracking-tight text-slate-950">
              Quick Actions
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.title}
                    className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Icon size={17} />
                    <span className="truncate">{action.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-bold tracking-tight text-slate-950">
              Recent Activities
            </h2>
            <div className="mt-3 space-y-3">
              {activities.map((activity) => (
                <div key={activity.title} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${activity.color}`} />
                    <span className="mt-1 h-full w-px bg-slate-200" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {activity.title}
                    </p>
                    <p className="text-xs text-slate-500">{activity.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-slate-950">
                Announcements
              </h2>
              <Megaphone size={18} className="text-slate-400" />
            </div>
            <div className="mt-3 space-y-2">
              {announcements.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {item.title}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${item.tone}`}>
                      {item.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-slate-950">
                Upcoming Events
              </h2>
              <CalendarDays size={18} className="text-slate-400" />
            </div>
            <div className="mt-3 space-y-2">
              {events.map((event) => (
                <div key={event.title} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white text-center shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-blue-600">
                      {event.month}
                    </span>
                    <span className="text-lg font-bold leading-5 text-slate-950">
                      {event.date}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {event.title}
                    </p>
                    <p className="text-xs text-slate-500">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;
