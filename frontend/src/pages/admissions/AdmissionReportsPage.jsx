import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Loader2, TrendingUp, Users, CheckCircle, FileText } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { fetchAdmissions } from "../../redux/slices/admissionSlice";
import { fetchEnquiries } from "../../redux/slices/enquirySlice";

const CHART_COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899", "#64748B"];

const AdmissionReportsPage = () => {
  const dispatch = useDispatch();

  const { admissions, loading: admissionsLoading } = useSelector((state) => state.admissions);
  const { enquiries, loading: enquiriesLoading } = useSelector((state) => state.enquiries);

  useEffect(() => {
    dispatch(fetchAdmissions());
    dispatch(fetchEnquiries());
  }, [dispatch]);

  const stats = useMemo(() => {
    const totalLeads = enquiries.length;
    const totalApplications = admissions.length;
    const approvedAdmissions = admissions.filter((a) => a.approvalStatus === "Approved");
    const verifiedAdmissions = admissions.filter((a) => a.verificationStatus === "Verified");

    // 1. Class-wise counts
    const classMap = {};
    approvedAdmissions.forEach((a) => {
      classMap[a.classApplied] = (classMap[a.classApplied] || 0) + 1;
    });
    const classData = Object.keys(classMap).map((cls) => ({
      name: cls,
      Admissions: classMap[cls],
    })).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    // 2. Category-wise counts
    const categoryMap = {};
    approvedAdmissions.forEach((a) => {
      categoryMap[a.category] = (categoryMap[a.category] || 0) + 1;
    });
    const categoryData = Object.keys(categoryMap).map((cat) => ({
      name: cat,
      value: categoryMap[cat],
    }));

    // 3. Gender-wise counts
    const genderMap = {};
    approvedAdmissions.forEach((a) => {
      genderMap[a.gender] = (genderMap[a.gender] || 0) + 1;
    });
    const genderData = Object.keys(genderMap).map((gen) => ({
      name: gen,
      value: genderMap[gen],
    }));

    // 4. Stream-wise counts
    const streamMap = {};
    approvedAdmissions.forEach((a) => {
      if (a.streamApplied) {
        streamMap[a.streamApplied] = (streamMap[a.streamApplied] || 0) + 1;
      }
    });
    const streamData = Object.keys(streamMap).map((str) => ({
      name: str,
      Students: streamMap[str],
    }));

    // 5. Conversion rate & funnel
    const funnelData = [
      { stage: "Leads (Enquiries)", Count: totalLeads },
      { stage: "Applications Submitted", Count: totalApplications },
      { stage: "Verified Apps", Count: verifiedAdmissions.length },
      { stage: "Enrolled Students", Count: approvedAdmissions.length },
    ];

    const conversionRate = totalLeads > 0 ? ((approvedAdmissions.length / totalLeads) * 100).toFixed(1) : 0;

    return {
      totalLeads,
      totalApplications,
      approvedCount: approvedAdmissions.length,
      conversionRate,
      classData,
      categoryData,
      genderData,
      streamData,
      funnelData,
    };
  }, [admissions, enquiries]);

  const isLoading = admissionsLoading || enquiriesLoading;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Admissions
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">
            Admission Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Monitor real-time admission trends, demographic splits, and registration conversion rates.
          </p>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center p-20 text-sm font-medium text-slate-500 bg-white border rounded-2xl shadow-sm">
            <Loader2 className="animate-spin mr-2" size={18} />
            Recalculating analytics and trends...
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Analytics overview row */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border bg-white p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Admitted Student Count</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{stats.approvedCount}</p>
                </div>
                <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} />
                </div>
              </div>
              
              <div className="rounded-2xl border bg-white p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Form Submissions</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{stats.totalApplications}</p>
                </div>
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <FileText size={20} />
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Active Inquiry Leads</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{stats.totalLeads}</p>
                </div>
                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                  <Users size={20} />
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Conversion Rate</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{stats.conversionRate}%</p>
                </div>
                <div className="h-10 w-10 bg-violet-50 text-violet-600 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
              </div>
            </section>

            {/* Funnel conversion line/bar & stream stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Funnel chart */}
              <div className="lg:col-span-2 rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1">
                  <TrendingUp size={16} className="text-blue-600" />
                  Admission Conversion Funnel
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.funnelData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="stage" tick={{ fontSize: 11, fontWeight: 500 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="Count" stroke="#3B82F6" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Streams chart */}
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Class 11 & 12 Streams Allocation</h3>
                {stats.streamData.length === 0 ? (
                  <div className="flex h-80 items-center justify-center text-sm text-slate-400">
                    No streams allocated yet.
                  </div>
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.streamData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="Students" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

            </div>

            {/* Class Breakdown & demographics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Class-wise Bar chart */}
              <div className="lg:col-span-1 rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Approved Admissions By Class</h3>
                {stats.classData.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    No admissions logged.
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.classData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                        <Tooltip />
                        <Bar dataKey="Admissions" fill="#10B981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Category Pie chart */}
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Admissions By Category</h3>
                {stats.categoryData.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    No categories registered.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {stats.categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 border-t pt-3 max-h-36 overflow-y-auto space-y-2">
                      {stats.categoryData.map((cat, idx) => (
                        <div key={cat.name} className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                            <span>{cat.name}</span>
                          </div>
                          <span>{cat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Gender Pie chart */}
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Admissions By Gender</h3>
                {stats.genderData.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    No gender metrics available.
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.genderData}
                          cx="50%"
                          cy="50%"
                          innerRadius={0}
                          outerRadius={85}
                          dataKey="value"
                          label
                        >
                          {stats.genderData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} iconSize={10} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdmissionReportsPage;
