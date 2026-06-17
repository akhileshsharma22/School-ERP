import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  TrendingUp, BarChart2, DollarSign, AlertCircle, Percent, Download, Search,
  FileText, RefreshCw, UserCheck, History, Calendar, Filter, ArrowUpRight,
  CreditCard, ShieldAlert, CheckCircle, XCircle, Users, Receipt
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from "recharts";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  fetchDashboardMetrics, fetchAuditLogs, fetchReceipts,
  fetchInvoices, fetchAssignments, submitRefund
} from "../../redux/slices/financeSlice";
import { fetchAcademicYears } from "../../redux/slices/academicYearSlice";
import { fetchAllClasses } from "../../redux/slices/classSectionSlice";

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const KPICard = ({ label, value, sub, icon: Icon, colorClass }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm flex items-center justify-between transition hover:-translate-y-0.5 duration-200">
    <div className="space-y-0.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-lg font-bold tracking-tight text-slate-900 truncate max-w-[160px]" title={value}>
        {value ?? "—"}
      </p>
      {sub && <p className="text-xs text-slate-400 font-medium truncate max-w-[170px]" title={sub}>{sub}</p>}
    </div>
    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
      <Icon size={15} />
    </div>
  </div>
);

const ChartCard = ({ title, children, hasData }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
    <div className="border-b border-slate-150 pb-2.5 mb-3.5">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    </div>
    <div className="flex-1 min-h-[240px] flex items-center justify-center">
      {hasData ? (
        children
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-400 space-y-2 py-8">
          <BarChart2 size={32} className="text-slate-300 stroke-[1.5]" />
          <p className="text-xs font-semibold">No collection trend data available</p>
        </div>
      )}
    </div>
  </div>
);

const FeeReportsPage = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Redux Selectors
  const { metrics, charts, auditLogs, receipts, invoices, assignments, loading, saving } = useSelector((s) => s.finance);
  const { academicYears } = useSelector((s) => s.academicYear);
  const { classes } = useSelector((s) => s.classSections);

  // Filters State
  const [filterAY, setFilterAY] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLedgerStudent, setSelectedLedgerStudent] = useState(null);

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(null); // holds receipt to refund
  const [refundForm, setRefundForm] = useState({ amount: "", reason: "", paymentMode: "Cash" });

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchAllClasses());
    loadDashboardAndData();
  }, [dispatch]);

  const loadDashboardAndData = () => {
    dispatch(fetchDashboardMetrics());
    dispatch(fetchAuditLogs());
    dispatch(fetchReceipts());
    dispatch(fetchInvoices());
    dispatch(fetchAssignments());
  };

  // Trigger refund submit
  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!refundForm.amount || Number(refundForm.amount) <= 0) {
      return toast.error("Please enter a valid amount.");
    }
    if (Number(refundForm.amount) > showRefundModal.amountPaid) {
      return toast.error(`Refund amount cannot exceed amount paid of ₹${showRefundModal.amountPaid}`);
    }

    const res = await dispatch(submitRefund({
      id: showRefundModal._id,
      data: {
        amount: Number(refundForm.amount),
        reason: refundForm.reason,
        paymentMode: refundForm.paymentMode
      }
    }));

    if (submitRefund.fulfilled.match(res)) {
      toast.success("Refund processed successfully!");
      setShowRefundModal(null);
      setRefundForm({ amount: "", reason: "", paymentMode: "Cash" });
      loadDashboardAndData();
    } else {
      toast.error(res.payload || "Refund processing failed");
    }
  };

  // Helper to trigger download of CSV
  const downloadCSV = (headers, rows, filename) => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export handlers
  const exportReceipts = () => {
    const headers = ["Receipt No", "Student Name", "Class & Sec", "Amount Paid", "Mode", "Transaction ID", "Received By", "Date", "Status"];
    const rows = filteredReceipts.map(r => {
      const studentName = r.student ? `"${r.student.firstName} ${r.student.lastName}"` : "—";
      const classSec = r.student ? `"${r.student.className || ""} ${r.student.sectionName || ""}"` : "—";
      return [
        r.receiptNumber,
        studentName,
        classSec,
        r.amountPaid,
        r.paymentMode,
        r.transactionId || "—",
        r.receivedBy?.fullName || "System",
        new Date(r.paymentDate).toLocaleDateString(),
        r.status
      ];
    });
    downloadCSV(headers, rows, "Collection_Receipts");
  };

  const exportDues = () => {
    const headers = ["Invoice No", "Student Name", "Class & Sec", "Installment", "Due Date", "Payable", "Paid", "Balance Due", "Status"];
    const rows = filteredDues.map(i => {
      const studentName = i.student ? `"${i.student.firstName} ${i.student.lastName}"` : "—";
      const classSec = i.student ? `"${i.student.className || ""} ${i.student.sectionName || ""}"` : "—";
      return [
        i.invoiceNumber,
        studentName,
        classSec,
        i.installmentName,
        new Date(i.dueDate).toLocaleDateString(),
        i.payableAmount,
        i.paidAmount,
        i.payableAmount - i.paidAmount,
        i.status
      ];
    });
    downloadCSV(headers, rows, "Outstanding_Dues");
  };

  const exportDiscounts = () => {
    const headers = ["Student Name", "Class", "Invoice No", "Installment", "Category Discount", "Concession Applied", "Due Date"];
    const rows = filteredDiscounts.map(i => {
      const studentName = i.student ? `"${i.student.firstName} ${i.student.lastName}"` : "—";
      return [
        studentName,
        i.student?.className || "—",
        i.invoiceNumber,
        i.installmentName,
        i.discountAmount || 0,
        i.concessionAmount || 0,
        new Date(i.dueDate).toLocaleDateString()
      ];
    });
    downloadCSV(headers, rows, "Discounts_Concessions");
  };

  const exportAuditLogs = () => {
    const headers = ["Timestamp", "Action", "User", "Details", "IP Address"];
    const rows = auditLogs.map(l => {
      return [
        new Date(l.createdAt).toLocaleString(),
        l.action,
        l.performedBy?.fullName || "System",
        `"${l.details?.replace(/"/g, '""') || ""}"`,
        l.ipAddress || "—"
      ];
    });
    downloadCSV(headers, rows, "Finance_Audit_Logs");
  };

  // Filters selectors
  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => {
      const matchesSearch = searchQuery
        ? (r.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.student && `${r.student.firstName} ${r.student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
          r.student?.admissionNo?.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      const matchesClass = filterClass ? (r.student?.className === filterClass) : true;
      return matchesSearch && matchesClass;
    });
  }, [receipts, searchQuery, filterClass]);

  const filteredDues = useMemo(() => {
    return invoices.filter(i => {
      const isUnpaid = i.status !== "Paid";
      const matchesSearch = searchQuery
        ? ((i.student && `${i.student.firstName} ${i.student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
          i.student?.admissionNo?.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      const matchesClass = filterClass ? (i.student?.className === filterClass) : true;
      return isUnpaid && matchesSearch && matchesClass;
    });
  }, [invoices, searchQuery, filterClass]);

  const filteredDiscounts = useMemo(() => {
    return invoices.filter(i => {
      const hasDiscountOrConcession = (i.discountAmount > 0 || i.concessionAmount > 0);
      const matchesSearch = searchQuery
        ? ((i.student && `${i.student.firstName} ${i.student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
          i.student?.admissionNo?.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      const matchesClass = filterClass ? (i.student?.className === filterClass) : true;
      return hasDiscountOrConcession && matchesSearch && matchesClass;
    });
  }, [invoices, searchQuery, filterClass]);

  const ledgerStudents = useMemo(() => {
    // Unique list of students who have fee assignments
    const map = new Map();
    assignments.forEach(as => {
      if (as.student) map.set(as.student._id, as.student);
    });
    return Array.from(map.values());
  }, [assignments]);

  const ledgerDetails = useMemo(() => {
    if (!selectedLedgerStudent) return null;
    const studentId = selectedLedgerStudent._id;
    const studentInvoices = invoices.filter(i => i.student?._id === studentId || i.student === studentId);
    const studentReceipts = receipts.filter(r => r.student?._id === studentId || r.student === studentId);
    const studentAssignment = assignments.find(as => as.student?._id === studentId || as.student === studentId);
    return {
      invoices: studentInvoices,
      receipts: studentReceipts,
      assignment: studentAssignment
    };
  }, [selectedLedgerStudent, invoices, receipts, assignments]);

  // Overall check if we have dashboard metrics
  const hasDashboardData = metrics && (metrics.totalCollection > 0 || metrics.outstandingDues > 0);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-12">
        {/* Header */}
        <header className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Finance Control</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Finance Reports & Terminal</h1>
            <p className="text-xs text-slate-500 font-medium">
              Audit collection receipts, track class outstanding lists, verify category concession logs, and review system audit trails.
            </p>
          </div>
          <button onClick={loadDashboardAndData} disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow hover:bg-slate-50 transition disabled:opacity-60 shrink-0">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Sync Ledger Book
          </button>
        </header>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 overflow-x-auto whitespace-nowrap">
          {[
            { id: "dashboard", label: "Dashboard Metrics & Trends", icon: TrendingUp },
            { id: "receipts", label: "Fee Receipts Log", icon: Receipt },
            { id: "dues", label: "Outstanding Dues", icon: AlertCircle },
            { id: "discounts", label: "Discounts & Concessions", icon: Percent },
            { id: "ledger", label: "Student Ledger Search", icon: UserCheck },
            { id: "audit", label: "Finance Audit Trail", icon: History }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition ${activeTab === tab.id ? "border-b-2 border-slate-950 text-slate-950" : "text-slate-500 hover:text-slate-800"}`}>
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─── TAB 1: DASHBOARD METRICS ───────────────────────────────── */}
        {activeTab === "dashboard" && (
          <>
            {loading && !metrics ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
                <RefreshCw className="animate-spin text-slate-900" size={32} />
                <p className="text-sm font-semibold">Consolidating books...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 6 KPI Cards Grid */}
                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <KPICard label="Total Net Collected" value={metrics?.totalCollection ? `₹${Number(metrics.totalCollection).toLocaleString("en-IN")}` : "₹0"} sub="Lifetime success transactions" icon={DollarSign} colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100" />
                  <KPICard label="Monthly Collections" value={metrics?.monthlyCollection ? `₹${Number(metrics.monthlyCollection).toLocaleString("en-IN")}` : "₹0"} sub="Current calendar month" icon={TrendingUp} colorClass="bg-blue-50 text-blue-600 border border-blue-100" />
                  <KPICard label="Daily Collections" value={metrics?.dailyCollection ? `₹${Number(metrics.dailyCollection).toLocaleString("en-IN")}` : "₹0"} sub="Collected today" icon={ArrowUpRight} colorClass="bg-teal-50 text-teal-600 border border-teal-100" />
                  <KPICard label="Total Outstanding Dues" value={metrics?.outstandingDues ? `₹${Number(metrics.outstandingDues).toLocaleString("en-IN")}` : "₹0"} sub="Uncollected installment balances" icon={AlertCircle} colorClass="bg-rose-50 text-rose-600 border border-rose-100" />
                  <KPICard label="Total Discounts & Concessions" value={metrics?.totalDiscountAmount ? `₹${Number(metrics.totalDiscountAmount).toLocaleString("en-IN")}` : "₹0"} sub="Rebates & waivers applied" icon={Percent} colorClass="bg-indigo-50 text-indigo-600 border border-indigo-100" />
                  <KPICard label="Late Fines Assessed" value={metrics?.fineCollection ? `₹${Number(metrics.fineCollection).toLocaleString("en-IN")}` : "₹0"} sub="Collected late penalty additions" icon={ShieldAlert} colorClass="bg-amber-50 text-amber-600 border border-amber-100" />
                </section>

                {/* Charts Area */}
                <div className="grid gap-4 md:grid-cols-2">
                  <ChartCard title="Monthly Collection Trend" hasData={charts?.monthlyTrend?.length > 0}>
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={charts?.monthlyTrend} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                        <Tooltip formatter={(value) => [`₹${value}`, "Amount Collected"]} />
                        <Area type="monotone" dataKey="collected" name="Collections" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorColl)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Collection vs Dues by Class" hasData={charts?.classWiseCollection?.length > 0}>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={charts?.classWiseCollection} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                        <Tooltip formatter={(value) => [`₹${value}`]} />
                        <Legend />
                        <Bar dataKey="Collected" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Dues" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="md:col-span-1">
                    <ChartCard title="Collection Split by Student Category" hasData={charts?.categoryWiseCollection?.length > 0}>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie data={charts?.categoryWiseCollection} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" nameKey="name">
                            {charts?.categoryWiseCollection?.map((entry, idx) => (
                              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`₹${value}`, "Collected"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  </div>
                  <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3.5">
                    <div className="border-b border-slate-150 pb-2 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-900">Recent Accounting Audits</h3>
                      <button onClick={() => setActiveTab("audit")} className="text-xs font-semibold text-blue-600 hover:text-blue-800">View All</button>
                    </div>
                    <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                      {auditLogs.slice(0, 5).map((log, idx) => (
                        <div key={log._id || idx} className="flex gap-3 text-xs leading-relaxed border-b border-slate-50 pb-2">
                          <span className={`inline-flex h-6 px-2.5 items-center rounded-full font-bold uppercase tracking-wider shrink-0
                            ${log.action.includes("COLLECT") ? "bg-emerald-50 text-emerald-700" :
                              log.action.includes("REFUND") ? "bg-rose-50 text-rose-700" :
                              log.action.includes("CONCESSION") ? "bg-amber-50 text-amber-700" :
                              "bg-slate-100 text-slate-700"}`}>
                            {log.action?.slice(0, 15)}
                          </span>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{log.details}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{new Date(log.createdAt).toLocaleString()} · User: {log.performedBy?.fullName || "System"}</p>
                          </div>
                        </div>
                      ))}
                      {auditLogs.length === 0 && <p className="text-slate-400 text-center py-10">No recent transactions recorded.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── TAB 2: RECEIPTS LOG ────────────────────────────────────── */}
        {activeTab === "receipts" && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl border border-slate-200 bg-white">
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Receipt or student..." className="h-9 w-full rounded-xl border border-slate-200 pl-8.5 pr-4 text-xs outline-none bg-white font-semibold" />
                </div>
                <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
                  className="h-9 rounded-xl border border-slate-200 px-3 text-xs outline-none bg-white font-semibold text-slate-600">
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c._id} value={c.className}>{c.className}</option>)}
                </select>
              </div>
              <button onClick={exportReceipts} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow transition">
                <Download size={12} /> Export CSV
              </button>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {["Receipt No", "Student Name", "Class & Sec", "Mode", "Transaction ID", "Amount Paid", "Collector", "Payment Date", "Status", "Actions"].map(h => (
                        <th key={h} className="px-4 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredReceipts.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="p-6 text-center text-slate-400 font-semibold">No fee receipts found for filters.</td>
                      </tr>
                    ) : (
                      filteredReceipts.map(rec => {
                        const name = rec.student ? `${rec.student.firstName} ${rec.student.lastName}` : "—";
                        return (
                          <tr key={rec._id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-semibold text-slate-900">{rec.receiptNumber}</td>
                            <td className="px-4 py-2 font-bold text-slate-900">{name}</td>
                            <td className="px-4 py-2 text-slate-650 font-medium">{rec.student?.className || "—"} {rec.student?.sectionName || ""}</td>
                            <td className="px-4 py-2 font-semibold text-slate-600">{rec.paymentMode}</td>
                            <td className="px-4 py-2 text-slate-500">{rec.transactionId || "—"}</td>
                            <td className="px-4 py-2 font-bold text-slate-900">₹{rec.amountPaid}</td>
                            <td className="px-4 py-2 text-slate-500">{rec.receivedBy?.fullName || "System"}</td>
                            <td className="px-4 py-2 text-slate-500">{new Date(rec.paymentDate).toLocaleDateString()}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider
                                ${rec.status === "Success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                {rec.status}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              {rec.status === "Success" ? (
                                <button onClick={() => { setRefundForm({ amount: rec.amountPaid.toString(), reason: "", paymentMode: "Cash" }); setShowRefundModal(rec); }}
                                  className="inline-flex h-7 items-center border border-rose-200 bg-rose-50 px-2 text-[10px] font-bold text-rose-700 hover:bg-rose-100 rounded-lg transition">
                                  Issue Refund
                                </button>
                              ) : (
                                <span className="text-[10px] font-semibold text-slate-400">Refunded</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: OUTSTANDING DUES ────────────────────────────────── */}
        {activeTab === "dues" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl border border-slate-200 bg-white">
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student name..." className="h-9 w-full rounded-xl border border-slate-200 pl-8.5 pr-4 text-xs outline-none bg-white font-semibold" />
                </div>
                <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
                  className="h-9 rounded-xl border border-slate-200 px-3 text-xs outline-none bg-white font-semibold text-slate-600">
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c._id} value={c.className}>{c.className}</option>)}
                </select>
              </div>
              <button onClick={exportDues} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow transition">
                <Download size={12} /> Export CSV
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {["Invoice Number", "Student Name", "Class & Sec", "Category", "Installment", "Due Date", "Total Payable", "Total Paid", "Remaining Due", "Status"].map(h => (
                        <th key={h} className="px-4 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredDues.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="p-6 text-center text-slate-400 font-semibold">No unpaid outstanding dues matching criteria.</td>
                      </tr>
                    ) : (
                      filteredDues.map(inv => {
                        const name = inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : "—";
                        const bal = inv.payableAmount - inv.paidAmount;
                        return (
                          <tr key={inv._id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-semibold text-slate-900">{inv.invoiceNumber}</td>
                            <td className="px-4 py-2 font-bold text-slate-900">{name}</td>
                            <td className="px-4 py-2 text-slate-650 font-medium">{inv.student?.className || "—"} {inv.student?.sectionName || ""}</td>
                            <td className="px-4 py-2 text-slate-650">{inv.student?.category || "—"}</td>
                            <td className="px-4 py-2 font-semibold text-slate-700">{inv.installmentName}</td>
                            <td className="px-4 py-2 text-slate-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                            <td className="px-4 py-2 font-medium">₹{inv.payableAmount}</td>
                            <td className="px-4 py-2 text-emerald-600">₹{inv.paidAmount}</td>
                            <td className="px-4 py-2 font-extrabold text-rose-600">₹{bal}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider
                                ${inv.status === "Partially Paid" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: DISCOUNTS & CONCESSIONS LOG ─────────────────────── */}
        {activeTab === "discounts" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl border border-slate-200 bg-white">
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student name..." className="h-9 w-full rounded-xl border border-slate-200 pl-8.5 pr-4 text-xs outline-none bg-white font-semibold" />
                </div>
              </div>
              <button onClick={exportDiscounts} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow transition">
                <Download size={12} /> Export CSV
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {["Student Name", "Class & Sec", "Category", "Invoice Number", "Installment", "Category Discount Amount", "Manual Concession", "Due Date"].map(h => (
                        <th key={h} className="px-4 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredDiscounts.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-6 text-center text-slate-400 font-semibold">No category discounts or manual concessions applied.</td>
                      </tr>
                    ) : (
                      filteredDiscounts.map(inv => {
                        const name = inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : "—";
                        return (
                          <tr key={inv._id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-bold text-slate-900">{name}</td>
                            <td className="px-4 py-2 text-slate-650 font-medium">{inv.student?.className || "—"} {inv.student?.sectionName || ""}</td>
                            <td className="px-4 py-2 text-slate-650">{inv.student?.category || "—"}</td>
                            <td className="px-4 py-2 font-semibold text-slate-900">{inv.invoiceNumber}</td>
                            <td className="px-4 py-2 text-slate-505 font-medium">{inv.installmentName}</td>
                            <td className="px-4 py-2 font-bold text-emerald-600">₹{inv.discountAmount || 0}</td>
                            <td className="px-4 py-2 font-bold text-indigo-650">₹{inv.concessionAmount || 0}</td>
                            <td className="px-4 py-2 text-slate-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 5: STUDENT LEDGER SEARCH ───────────────────────────── */}
        {activeTab === "ledger" && (
          <div className="space-y-6">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Search student accounts file ledger</label>
              <div className="flex gap-3 max-w-xl">
                <select value={selectedLedgerStudent?._id || ""} onChange={(e) => {
                  const stud = ledgerStudents.find(s => s._id === e.target.value);
                  setSelectedLedgerStudent(stud || null);
                }} className="h-9 flex-1 rounded-xl border border-slate-200 px-3 text-xs outline-none bg-white font-semibold text-slate-700">
                  <option value="">Select Student Profile</option>
                  {ledgerStudents.map(s => (
                    <option key={s._id} value={s._id}>{s.firstName} {s.lastName} (Adm: {s.admissionNo}) · {s.className}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setSelectedLedgerStudent(null)} className="h-9 px-4 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-500 bg-white cursor-pointer">
                  Reset
                </button>
              </div>
            </div>

            {selectedLedgerStudent && ledgerDetails ? (
              <div className="space-y-6">
                {/* Ledger summary header */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedLedgerStudent.firstName} {selectedLedgerStudent.lastName}</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">Admission No: {selectedLedgerStudent.admissionNo} · Class: {selectedLedgerStudent.className} · Category: {selectedLedgerStudent.category}</p>
                    {ledgerDetails.assignment && (
                      <p className="text-xs text-slate-400 mt-0.5">Assigned Structure: {ledgerDetails.assignment.feeStructure?.name || "—"} ({ledgerDetails.assignment.feeStructure?.installments})</p>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-center divide-x divide-slate-100">
                    <div className="px-4">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Contract</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">₹{ledgerDetails.assignment?.totalPayable || 0}</p>
                    </div>
                    <div className="px-4">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Paid</p>
                      <p className="text-lg font-bold text-blue-650 mt-1">₹{ledgerDetails.assignment?.totalPaid || 0}</p>
                    </div>
                    <div className="px-4">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Balance Due</p>
                      <p className="text-lg font-bold text-rose-650 mt-1">₹{(ledgerDetails.assignment?.totalPayable || 0) - (ledgerDetails.assignment?.totalPaid || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Ledgers Breakdown */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Bill Installments */}
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-200 py-2.5 px-4 bg-slate-50">
                      <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Installments Schedule</h3>
                    </div>
                    <div className="p-3.5 space-y-2.5">
                      {ledgerDetails.invoices.map(inv => (
                        <div key={inv._id} className="flex justify-between items-center text-xs border border-slate-100 p-2.5 rounded-xl hover:bg-slate-50/50">
                          <div>
                            <p className="font-bold text-slate-900">{inv.installmentName}</p>
                            <p className="text-slate-450 font-medium mt-0.5">Due: {new Date(inv.dueDate).toLocaleDateString()} · Inv: {inv.invoiceNumber}</p>
                            <div className="flex gap-2 mt-1.5 text-[10px]">
                              {inv.discountAmount > 0 && <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">Disc: -₹{inv.discountAmount}</span>}
                              {inv.concessionAmount > 0 && <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">Waiver: -₹{inv.concessionAmount}</span>}
                              {inv.fineAmount > 0 && <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-medium">Fine: +₹{inv.fineAmount}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900">₹{inv.payableAmount}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Paid: ₹{inv.paidAmount}</p>
                            <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase mt-1.5 border
                              ${inv.status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : inv.status === "Partially Paid" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>
                              {inv.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {ledgerDetails.invoices.length === 0 && <p className="text-slate-400 text-center py-6">No bills generated.</p>}
                    </div>
                  </div>

                  {/* Transaction receipts */}
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-200 py-2.5 px-4 bg-slate-50">
                      <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Receipts & Refund History</h3>
                    </div>
                    <div className="p-3.5 space-y-2.5">
                      {ledgerDetails.receipts.map(rec => (
                        <div key={rec._id} className="flex justify-between items-center text-xs border border-slate-100 p-2.5 rounded-xl hover:bg-slate-50/50">
                          <div>
                            <p className="font-bold text-slate-900">Receipt: {rec.receiptNumber}</p>
                            <p className="text-slate-450 font-medium mt-0.5">{new Date(rec.paymentDate).toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500 mt-1">Mode: {rec.paymentMode} {rec.transactionId ? `· Ref: ${rec.transactionId}` : ""}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900">₹{rec.amountPaid}</p>
                            <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase mt-1.5 border
                              ${rec.status === "Success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>
                              {rec.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {ledgerDetails.receipts.length === 0 && <p className="text-slate-400 text-center py-6">No payment records found.</p>}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-white text-slate-400">
                <Users size={32} className="mx-auto text-slate-350 mb-2 stroke-[1.25]" />
                <p className="text-xs font-semibold">Select a student account to view their ledger report file.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 6: FINANCE AUDIT TRAIL ─────────────────────────────── */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl border border-slate-200 bg-white">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-slate-400" />
                Immutable System Accounting logs
              </div>
              <button onClick={exportAuditLogs} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow transition">
                <Download size={12} /> Export CSV
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {["Timestamp", "Action", "Performed By", "Role", "Details", "IP Address"].map(h => (
                        <th key={h} className="px-4 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-6 text-center text-slate-400 font-semibold">No audit logs found.</td>
                      </tr>
                    ) : (
                      auditLogs.map((log, idx) => (
                        <tr key={log._id || idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-2 font-semibold">
                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border
                              ${log.action.includes("COLLECT") ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                log.action.includes("REFUND") ? "bg-rose-50 text-rose-700 border-rose-100" :
                                log.action.includes("CONCESSION") ? "bg-amber-50 text-amber-700 border-amber-100" :
                                "bg-slate-100 text-slate-700 border-slate-200"}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-bold text-slate-900">{log.performedBy?.fullName || "System"}</td>
                          <td className="px-4 py-2 text-slate-500">{log.performedBy?.role || "—"}</td>
                          <td className="px-4 py-2 text-slate-650 font-medium">{log.details}</td>
                          <td className="px-4 py-2 text-slate-500">{log.ipAddress || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL: PROCESS REFUND ────────────────────────────────────── */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <form onSubmit={handleRefundSubmit} className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="border-b border-slate-200 p-4 flex justify-between items-center bg-slate-50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950">Issue Fee Receipt Refund</h2>
              <button type="button" onClick={() => setShowRefundModal(null)} className="text-slate-400 hover:text-slate-650 font-bold cursor-pointer">✕</button>
            </div>
            <div className="p-4 space-y-3.5">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2.5 text-xs text-red-700">
                <AlertCircle className="shrink-0 mt-0.5" size={15} />
                <p>Warning: Issuing a refund reverts the corresponding invoice balance due and parent student assignment totals. This action cannot be undone.</p>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Refund Amount (₹) *</label>
                <input required type="number" min="1" value={refundForm.amount} onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                  placeholder={`Max ₹${showRefundModal.amountPaid}`} className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 font-semibold" />
                <span className="text-[10px] text-slate-400 font-medium mt-1 block">Receipt originally paid: ₹{showRefundModal.amountPaid}</span>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Refund Payment Mode *</label>
                <select required value={refundForm.paymentMode} onChange={(e) => setRefundForm({ ...refundForm, paymentMode: e.target.value })}
                  className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none bg-white font-semibold text-slate-700">
                  {["Cash", "UPI", "Card", "Bank Transfer"].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Reason for Refund *</label>
                <textarea required value={refundForm.reason} onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  placeholder="e.g. Admission cancellation or double payment rebate..." className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-slate-400 h-16 resize-none font-medium" />
              </div>
            </div>
            <div className="border-t border-slate-100 p-4 flex justify-end gap-2 bg-slate-50">
              <button type="button" onClick={() => setShowRefundModal(null)} className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="h-9 rounded-xl bg-slate-950 px-5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer">Confirm Refund</button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};

export default FeeReportsPage;
