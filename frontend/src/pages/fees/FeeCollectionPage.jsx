import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Search, IndianRupee, Users, CheckCircle, Printer, Download,
  AlertTriangle, ArrowLeft, RefreshCw, HelpCircle,
  ChevronLeft, ChevronRight, FileSpreadsheet, Loader2, Eye, Clock, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  fetchAssignments, runAssignment, runBulkAssignment,
  fetchInvoices, submitConcession, submitPayment,
  fetchReceipts, fetchStructures
} from "../../redux/slices/financeSlice";
import { fetchAcademicYears } from "../../redux/slices/academicYearSlice";
import { fetchAllClasses } from "../../redux/slices/classSectionSlice";
import { fetchStudents } from "../../redux/slices/studentSlice";
import { fetchAllCategories } from "../../redux/slices/categorySlice";

// Utility for exporting data to CSV
const exportToCSV = (data, filename = "fee_assignments.csv") => {
  const headers = [
    "Admission No",
    "Student Name",
    "Class",
    "Section",
    "Category",
    "Fee Structure",
    "Total Fee",
    "Discount",
    "Payable Amount",
    "Paid Amount",
    "Balance",
    "Status",
    "Generated Date"
  ];
  
  const rows = data.map(as => {
    const name = as.student ? `${as.student.firstName} ${as.student.lastName}` : "—";
    const bal = as.totalPayable - as.totalPaid;
    const generatedDateStr = as.createdAt ? new Date(as.createdAt).toLocaleDateString() : "—";
    return [
      as.student?.admissionNo || "—",
      name,
      as.className || "—",
      as.sectionName || "—",
      as.category || "—",
      as.feeStructure?.name || "—",
      `₹${as.totalBaseAmount}`,
      `₹${as.totalDiscountAmount}`,
      `₹${as.totalPayable}`,
      `₹${as.totalPaid}`,
      `₹${bal}`,
      as.status || "—",
      generatedDateStr
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Safe currency formatter utility
const formatCurrency = (value) => Number(value || 0).toLocaleString("en-IN");

// StatCard Component
const StatCard = ({ label, value, helper, colorClass, icon: Icon }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm flex items-center justify-between transition hover:-translate-y-0.5 duration-200">
    <div className="space-y-0.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-lg font-bold tracking-tight text-slate-900">{value}</p>
      {helper && <p className="text-xs text-slate-400 font-medium">{helper}</p>}
    </div>
    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
      <Icon size={15} />
    </div>
  </div>
);

// EmptyState Component
const EmptyState = ({ onGenerate, onRefresh, loading }) => (
  <div className="rounded-xl border border-dashed border-slate-250 bg-white px-5 py-10 text-center shadow-sm max-w-md mx-auto my-6 space-y-3.5">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
      <HelpCircle size={24} />
    </div>
    <div>
      <h3 className="text-base font-bold text-slate-900">No Fee Records Found</h3>
      <p className="mt-1 text-xs text-slate-500">Possible Reasons:</p>
      <ul className="mt-2 text-xs text-slate-500 space-y-1 list-disc list-inside max-w-xs mx-auto text-left">
        <li>No students admitted</li>
        <li>No fee structure assigned</li>
        <li>Fee assignment not generated</li>
        <li>Filters returned no results</li>
      </ul>
    </div>
    <div className="mt-4 flex justify-center gap-2.5 pt-1">
      <button
        onClick={onGenerate}
        disabled={loading}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
      >
        Generate Fee Assignments
      </button>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
      >
        <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
        Refresh Records
      </button>
    </div>
  </div>
);

const FeeCollectionPage = () => {
  const dispatch = useDispatch();

  // Redux Selectors
  const { assignments, kpis, assignmentsTotal, invoices, receipts, structures, loading, saving } = useSelector((s) => s.finance);
  const { academicYears } = useSelector((s) => s.academicYear);
  const { classes } = useSelector((s) => s.classSections);
  const { students } = useSelector((s) => s.students);
  const { categories } = useSelector((s) => s.categories);

  // States
  const [filterAY, setFilterAY] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStructure, setFilterStructure] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [hasLoaded, setHasLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Navigation state: "list" | "student_detail" | "receipt_detail"
  const [view, setView] = useState("list");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Modals state
  const [showPayModal, setShowPayModal] = useState(null); // holds invoice being paid
  const [payForm, setPayForm] = useState({ amountPaid: "", paymentMode: "Cash", transactionId: "", remarks: "" });

  const [showConcessionModal, setShowConcessionModal] = useState(null); // holds invoice
  const [concessionForm, setConcessionForm] = useState({ concessionAmount: "", reason: "" });

  // Mount/Initialization loading
  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchAllClasses());
    dispatch(fetchStructures());
    dispatch(fetchStudents({ limit: 1 }));
    dispatch(fetchAllCategories());
  }, [dispatch]);

  // Set default academic year
  useEffect(() => {
    if (academicYears.length > 0 && !filterAY) {
      const current = academicYears.find(ay => ay.isCurrent);
      if (current) setFilterAY(current._id);
      else setFilterAY(academicYears[0]._id);
    }
  }, [academicYears, filterAY]);

  // Debounced search logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Clear loaded records if academic year changes
  useEffect(() => {
    setHasLoaded(false);
  }, [filterAY]);

  // Sections list based on selected class
  const sectionsList = useMemo(() => {
    const matchedClass = classes.find((c) => c.className === filterClass);
    return matchedClass ? matchedClass.sections : [];
  }, [classes, filterClass]);

  // Setup Check Warnings
  const activeAcademicYear = useMemo(() => academicYears.find(ay => ay.isCurrent), [academicYears]);
  const hasAcademicYear = !!activeAcademicYear;
  const hasStructures = structures && structures.length > 0;
  const hasStudents = students && students.length > 0;

  const missingStructures = useMemo(() => {
    if (!activeAcademicYear || !classes || !structures) return [];
    return classes.filter(cls => {
      return !structures.some(s => s.className === cls.className && s.academicYear?._id === activeAcademicYear._id);
    });
  }, [activeAcademicYear, classes, structures]);

  // Fetch action
  const loadFeeRecords = (targetPage = 1) => {
    if (!filterAY) {
      return toast.error("Please select Academic Year first.");
    }
    const params = {
      academicYear: filterAY,
      page: targetPage,
      limit
    };
    if (filterClass) params.className = filterClass;
    if (filterSection) params.sectionName = filterSection;
    if (filterCategory) params.category = filterCategory;
    if (filterStructure) params.feeStructure = filterStructure;
    if (filterStatus) params.status = filterStatus;
    if (debouncedSearch) params.search = debouncedSearch;

    dispatch(fetchAssignments(params)).then((res) => {
      if (fetchAssignments.fulfilled.match(res)) {
        toast.success("Fee records loaded successfully");
        setHasLoaded(true);
        setPage(targetPage);
      } else {
        toast.error(res.payload || "Failed to load fee records");
      }
    });
  };

  // Run Bulk Assignment Check
  const handleBulkAssign = async () => {
    if (!filterAY) {
      return toast.error("Please select Academic Year first.");
    }
    toast.loading("Generating fee assignments...", { id: "bulk-assign" });
    const res = await dispatch(runBulkAssignment({ academicYearId: filterAY, className: filterClass }));
    toast.dismiss("bulk-assign");
    if (runBulkAssignment.fulfilled.match(res)) {
      toast.success(res.payload?.message || "Fee assignments generated successfully");
      loadFeeRecords(1);
    } else {
      toast.error(res.payload || "Bulk assignment failed");
    }
  };

  // Re-run single student auto fee assignment
  const handleAutoAssign = async (studentId) => {
    if (!filterAY) return toast.error("Select Academic Year first");
    const res = await dispatch(runAssignment({ studentId, academicYearId: filterAY }));
    if (runAssignment.fulfilled.match(res)) {
      toast.success("Fee structure assigned successfully");
      loadFeeRecords(page);
    } else {
      toast.error(res.payload || "Fee assignment failed");
    }
  };

  // Student details click handler (View Ledger)
  const handleOpenStudentDetail = (student, focusHistory = false) => {
    setSelectedStudent(student);
    dispatch(fetchInvoices({ student: student._id }));
    dispatch(fetchReceipts({ student: student._id }));
    setView("student_detail");
    
    if (focusHistory) {
      setTimeout(() => {
        const element = document.getElementById("collection-receipts-section");
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  };

  // Collect Payment Directly from Row
  const handleCollectPaymentClick = async (student) => {
    setSelectedStudent(student);
    toast.loading("Fetching unpaid invoices...", { id: "fetch-invoices" });
    const res = await dispatch(fetchInvoices({ student: student._id }));
    toast.dismiss("fetch-invoices");
    if (fetchInvoices.fulfilled.match(res)) {
      const invoicesList = res.payload.invoices || [];
      const unpaidInvoice = invoicesList.find(inv => inv.status !== "Paid");
      if (unpaidInvoice) {
        setPayForm({
          amountPaid: (unpaidInvoice.payableAmount - unpaidInvoice.paidAmount).toString(),
          paymentMode: "Cash",
          transactionId: "",
          remarks: ""
        });
        setShowPayModal(unpaidInvoice);
      } else {
        toast.info("All installments are already fully paid for this student.");
      }
    } else {
      toast.error("Failed to retrieve student invoices.");
    }
  };

  // Print Receipt directly from Row
  const handlePrintReceiptClick = async (student) => {
    setSelectedStudent(student);
    toast.loading("Retrieving latest receipt...", { id: "fetch-receipts" });
    const res = await dispatch(fetchReceipts({ student: student._id }));
    toast.dismiss("fetch-receipts");
    if (fetchReceipts.fulfilled.match(res)) {
      const receiptsList = res.payload.receipts || [];
      if (receiptsList.length > 0) {
        setSelectedReceipt(receiptsList[0]);
        setView("receipt_detail");
      } else {
        toast.info("No payment receipt found for this student.");
      }
    } else {
      toast.error("Failed to retrieve student receipts.");
    }
  };

  // Payment Submit handler with full validations
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(payForm.amountPaid);
    if (isNaN(amt) || amt <= 0) {
      return toast.error("Cannot collect zero or negative payment amount.");
    }
    const maxAllowed = showPayModal.payableAmount - showPayModal.paidAmount;
    if (amt > maxAllowed + 0.05) {
      return toast.error(`Payment amount cannot exceed the balance due of ₹${maxAllowed.toFixed(2)}.`);
    }
    if (!payForm.paymentMode) {
      return toast.error("Please select a payment mode.");
    }
    const requiresRef = ["UPI", "Card", "Bank Transfer", "Cheque"].includes(payForm.paymentMode);
    if (requiresRef && !payForm.transactionId.trim()) {
      return toast.error(`Reference/Transaction number is required for payment mode: ${payForm.paymentMode}.`);
    }

    const res = await dispatch(submitPayment({
      id: showPayModal._id,
      data: {
        amountPaid: amt,
        paymentMode: payForm.paymentMode,
        transactionId: payForm.transactionId,
        remarks: payForm.remarks
      }
    }));

    if (submitPayment.fulfilled.match(res)) {
      toast.success("Payment collected successfully!");
      setShowPayModal(null);
      setPayForm({ amountPaid: "", paymentMode: "Cash", transactionId: "", remarks: "" });
      
      // Auto refresh table & metrics
      loadFeeRecords(page);
      
      if (selectedStudent) {
        dispatch(fetchInvoices({ student: selectedStudent._id }));
        dispatch(fetchReceipts({ student: selectedStudent._id }));
      }
    } else {
      toast.error(res.payload || "Payment processing failed");
    }
  };

  // Concession Submit handler
  const handleConcessionSubmit = async (e) => {
    e.preventDefault();
    if (!concessionForm.concessionAmount || Number(concessionForm.concessionAmount) < 0) {
      return toast.error("Please enter a valid concession amount.");
    }
    const res = await dispatch(submitConcession({
      id: showConcessionModal._id,
      data: {
        concessionAmount: Number(concessionForm.concessionAmount),
        reason: concessionForm.reason
      }
    }));

    if (submitConcession.fulfilled.match(res)) {
      toast.success("Fee concession applied!");
      setShowConcessionModal(null);
      setConcessionForm({ concessionAmount: "", reason: "" });
      dispatch(fetchInvoices({ student: selectedStudent._id }));
      loadFeeRecords(page);
    } else {
      toast.error(res.payload || "Failed to apply concession");
    }
  };

  // Print layout triggers
  const handlePrint = () => {
    window.print();
  };

  const handlePrintTable = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!assignments || assignments.length === 0) {
      toast.info("No fee records loaded to export.");
      return;
    }
    exportToCSV(assignments, "fee_assignments.csv");
  };

  const handleExportExcel = () => {
    if (!assignments || assignments.length === 0) {
      toast.info("No fee records loaded to export.");
      return;
    }
    exportToCSV(assignments, "fee_assignments.csv");
  };


  const handleResetFilters = () => {
    setFilterClass("");
    setFilterSection("");
    setFilterCategory("");
    setFilterStructure("");
    setFilterStatus("All");
    setSearchQuery("");
  };

  // Modal discount percentage calculation
  const discountPercent = useMemo(() => {
    if (!showPayModal || !showPayModal.amount) return 0;
    return Math.round((showPayModal.discountAmount / showPayModal.amount) * 100);
  }, [showPayModal]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10 print:p-0 print:m-0">
        {/* ─── LIST VIEW ───────────────────────────────────────────────── */}
        {view === "list" && (
          <>
            {/* Header */}
            <header className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:justify-between print:hidden">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Fees & Finance</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Collect Fees Dashboard</h1>
                <p className="text-xs text-slate-500 font-medium">Perform payment collection, review assignments, and manage discount waivers.</p>
              </div>
            </header>

            {/* Warnings Alert Stack */}
            {(!hasAcademicYear || !hasStructures || !hasStudents || missingStructures.length > 0) && (
              <section className="space-y-2.5 print:hidden">
                {!hasAcademicYear && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex items-center justify-between gap-4 text-amber-800 text-xs">
                    <span className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} /> Active Academic Year session is not configured.</span>
                    <a href="/master-setup/academic-years" className="shrink-0 inline-flex h-8 items-center justify-center bg-amber-950 text-white rounded-xl px-3.5 text-xs font-bold hover:bg-amber-900">Configure Academic Years</a>
                  </div>
                )}
                {hasAcademicYear && !hasStructures && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex items-center justify-between gap-4 text-amber-800 text-xs">
                    <span className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} /> No Fee Structures exist for the current academic session.</span>
                    <a href="/fees/structure" className="shrink-0 inline-flex h-8 items-center justify-center bg-amber-950 text-white rounded-xl px-3.5 text-xs font-bold hover:bg-amber-900">Create Fee Structure</a>
                  </div>
                )}
                {hasAcademicYear && hasStructures && !hasStudents && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex items-center justify-between gap-4 text-amber-800 text-xs">
                    <span className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} /> No student profiles registered in the system.</span>
                    <a href="/admissions/new" className="shrink-0 inline-flex h-8 items-center justify-center bg-amber-950 text-white rounded-xl px-3.5 text-xs font-bold hover:bg-amber-900">Admit Student</a>
                  </div>
                )}
                {hasAcademicYear && hasStructures && hasStudents && missingStructures.map(cls => (
                  <div key={cls._id} className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex items-center justify-between gap-4 text-amber-800 text-xs">
                    <span className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} /> No Fee Structure configured for Class {cls.className}.</span>
                    <a href="/fees/structure" className="shrink-0 inline-flex h-8 items-center justify-center bg-amber-950 text-white rounded-xl px-3.5 text-xs font-bold hover:bg-amber-900">Create Fee Structure</a>
                  </div>
                ))}
              </section>
            )}

            {/* Dashboard Statistics (KPI Cards) */}
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 print:hidden">
              <StatCard
                label="Assigned Students"
                value={hasLoaded && kpis ? `${kpis.totalAssignedStudents} Students` : "—"}
                helper="Filtered selection"
                colorClass="bg-slate-50 text-slate-700"
                icon={Users}
              />
              <StatCard
                label="Expected Collection"
                value={hasLoaded && kpis ? `₹${formatCurrency(kpis.expectedCollection)}` : "—"}
                helper="Post discount payable"
                colorClass="bg-blue-50 text-blue-700"
                icon={IndianRupee}
              />
              <StatCard
                label="Total Collected"
                value={hasLoaded && kpis ? `₹${formatCurrency(kpis.totalCollected)}` : "—"}
                helper="Collected to date"
                colorClass="bg-emerald-50 text-emerald-700"
                icon={CheckCircle}
              />
              <StatCard
                label="Outstanding Amount"
                value={hasLoaded && kpis ? `₹${formatCurrency(kpis.outstandingAmount)}` : "—"}
                helper="Dues outstanding"
                colorClass="bg-rose-50 text-rose-700"
                icon={AlertTriangle}
              />
              <StatCard
                label="Today's Collection"
                value={hasLoaded && kpis ? `₹${formatCurrency(kpis.todaysCollection)}` : "—"}
                helper="Daily collections"
                colorClass="bg-indigo-50 text-indigo-700"
                icon={TrendingUp}
              />
              <StatCard
                label="Overdue Accounts"
                value={hasLoaded && kpis ? `${kpis.overdueAccountsCount} Accounts` : "—"}
                helper="Accounts past due"
                colorClass="bg-red-50 text-red-700"
                icon={Clock}
              />
            </section>

            {/* Advanced Filters */}
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3.5 print:hidden">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                {/* Academic Year */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Academic Year *</label>
                  <select value={filterAY} onChange={(e) => setFilterAY(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs outline-none bg-white font-semibold text-slate-750 focus:border-slate-400">
                    <option value="">Select Session</option>
                    {academicYears.map(ay => (
                      <option key={ay._id} value={ay._id}>{ay.name} {ay.isCurrent ? "(Current)" : ""}</option>
                    ))}
                  </select>
                </div>
                {/* Class */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Class</label>
                  <select value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setFilterSection(""); }}
                    className="h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs outline-none bg-white font-semibold text-slate-750 focus:border-slate-400">
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c._id} value={c.className}>{c.className}</option>)}
                  </select>
                </div>
                {/* Section */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Section</label>
                  <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} disabled={!filterClass}
                    className="h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs outline-none bg-white font-semibold text-slate-750 focus:border-slate-400 disabled:opacity-50">
                    <option value="">All Sections</option>
                    {sectionsList.map(s => <option key={s._id} value={s.sectionName}>{s.sectionName}</option>)}
                  </select>
                </div>
                {/* Category */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Category</label>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs outline-none bg-white font-semibold text-slate-750 focus:border-slate-400">
                    <option value="">All Categories</option>
                    {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                  </select>
                </div>
                {/* Fee Structure */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Fee Structure</label>
                  <select value={filterStructure} onChange={(e) => setFilterStructure(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs outline-none bg-white font-semibold text-slate-750 focus:border-slate-400">
                    <option value="">All Structures</option>
                    {structures.map(str => <option key={str._id} value={str._id}>{str.name}</option>)}
                  </select>
                </div>
                {/* Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Status</label>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs outline-none bg-white font-semibold text-slate-750 focus:border-slate-400">
                    <option value="All">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                {/* Student Search */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Search Student</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Name, Adm No, Mobile..." className="h-9 w-full rounded-xl border border-slate-200 pl-8.5 pr-2.5 text-xs outline-none focus:border-slate-400 font-semibold" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
                <div className="flex gap-2">
                  <button onClick={handleResetFilters}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer">
                    Reset Filters
                  </button>
                  <button onClick={() => loadFeeRecords(1)} disabled={loading}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-5 text-xs font-bold text-white shadow hover:bg-slate-800 transition cursor-pointer disabled:opacity-60">
                    {loading ? <Loader2 size={12} className="animate-spin" /> : null}
                    Load Fee Records
                  </button>
                </div>

                {hasLoaded && assignments.length > 0 && (
                  <div className="flex gap-2">
                    <button onClick={handleExportCSV}
                      className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer">
                      <Download size={12} /> Export CSV
                    </button>
                    <button onClick={handleExportExcel}
                      className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer">
                      <FileSpreadsheet size={12} /> Export Excel
                    </button>
                    <button onClick={handlePrintTable}
                      className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer">
                      <Printer size={12} /> Print
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Assignments Table Section */}
            {!hasLoaded ? (
              <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 shadow-sm print:hidden">
                <IndianRupee className="mx-auto text-slate-300 mb-3" size={40} />
                <h3 className="text-lg font-bold text-slate-900">Fetch Fee Assignments</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Configure your filters above and click "Load Fee Records" to query matching students and load billing details.</p>
              </section>
            ) : assignments.length === 0 ? (
              <EmptyState onGenerate={handleBulkAssign} onRefresh={() => loadFeeRecords(1)} loading={loading} />
            ) : (
              <section id="printable-table-section" className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        {[
                          "Admission No", "Student Name", "Class / Section", "Category", 
                          "Fee Structure", "Total Fee", "Discount", "Final Payable", 
                          "Paid Amount", "Balance Due", "Due Date", "Status", "Actions"
                        ].map(h => (
                          <th key={h} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {assignments.map(as => {
                        const name = as.student ? `${as.student.firstName} ${as.student.lastName}` : "—";
                        const bal = as.totalPayable - as.totalPaid;
                        const dueDateStr = as.dueDate ? new Date(as.dueDate).toLocaleDateString() : "—";
                        
                        // Check if past due date and balance exists to classify as Overdue
                        const isOverdue = as.dueDate && new Date(as.dueDate) < new Date() && bal > 0;
                        const finalStatus = isOverdue ? "Overdue" : as.status;

                        return (
                          <tr key={as._id} className="hover:bg-slate-50/50 transition duration-150">
                            <td className="px-4 py-2 font-bold text-slate-800">{as.student?.admissionNo || "—"}</td>
                            <td className="px-4 py-2 font-extrabold text-slate-950 text-sm">{name}</td>
                            <td className="px-4 py-2 font-semibold text-slate-700">{as.className} {as.sectionName ? `· ${as.sectionName}` : ""}</td>
                            <td className="px-4 py-2 font-medium text-slate-600">{as.category}</td>
                            <td className="px-4 py-2 font-semibold text-slate-700">{as.feeStructure?.name || "—"}</td>
                            <td className="px-4 py-2 font-semibold text-slate-800">₹{formatCurrency(as.totalBaseAmount)}</td>
                            <td className="px-4 py-2 font-bold text-emerald-600">₹{formatCurrency(as.totalDiscountAmount)}</td>
                            <td className="px-4 py-2 font-bold text-slate-900">₹{formatCurrency(as.totalPayable)}</td>
                            <td className="px-4 py-2 font-bold text-blue-600">₹{formatCurrency(as.totalPaid)}</td>
                            <td className="px-4 py-2 font-extrabold text-slate-950 text-sm">₹{formatCurrency(bal)}</td>
                            <td className="px-4 py-2 font-semibold text-slate-500">{dueDateStr}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[9px] font-bold border ${
                                finalStatus === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                                finalStatus === "Partially Paid" ? "bg-amber-50 text-amber-700 border-amber-100" : 
                                finalStatus === "Overdue" ? "bg-red-100 text-red-900 border-red-200" : 
                                "bg-rose-50 text-rose-700 border-rose-100"
                              }`}>
                                {finalStatus}
                              </span>
                            </td>
                            <td className="px-4 py-2 print:hidden">
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => handleOpenStudentDetail(as.student)} 
                                  className="inline-flex h-8 items-center gap-1 bg-slate-950 px-2.5 text-[10px] font-bold text-white hover:bg-slate-800 rounded-lg cursor-pointer shadow-sm hover:shadow" 
                                  title="View Ledger">
                                  <Eye size={12} /> Ledger
                                </button>
                                <button onClick={() => handleCollectPaymentClick(as.student)}
                                  disabled={finalStatus === "Paid"}
                                  className="inline-flex h-8 items-center gap-1 border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer disabled:opacity-50"
                                  title="Collect Payment">
                                  <IndianRupee size={11} /> Collect
                                </button>
                                <button onClick={() => handlePrintReceiptClick(as.student)}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 border border-slate-200"
                                  title="Print Latest Receipt">
                                  <Printer size={12} />
                                </button>
                                <button onClick={() => handleOpenStudentDetail(as.student, true)}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 border border-slate-200"
                                  title="View Payment History">
                                  <Clock size={12} />
                                </button>
                                <button onClick={() => handleAutoAssign(as.student?._id)} 
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 border border-slate-200" 
                                  title="Reset Fee Assignment Rules">
                                  <RefreshCw size={11} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Server-Side Pagination Controls */}
                <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between text-xs print:hidden">
                  <p className="text-slate-500 font-semibold">
                    Showing <span className="font-bold text-slate-800">{Math.min(assignmentsTotal, (page - 1) * limit + 1)}</span> to{" "}
                    <span className="font-bold text-slate-800">{Math.min(assignmentsTotal, page * limit)}</span> of{" "}
                    <span className="font-bold text-slate-800">{assignmentsTotal}</span> records
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadFeeRecords(page - 1)}
                      disabled={page === 1 || loading}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => loadFeeRecords(page + 1)}
                      disabled={page * limit >= assignmentsTotal || loading}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* ─── DETAIL VIEW: STUDENT ACCOUNT (LEDGER) ───────────────────────── */}
        {view === "student_detail" && selectedStudent && (
          <div className="space-y-6">
            <button onClick={() => { setView("list"); loadFeeRecords(page); }} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition">
              <ArrowLeft size={14} /> Back to Student Ledger Dashboard
            </button>

            {/* Profile Brief */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Account File Ledger</span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Admission No: {selectedStudent.admissionNo} · Class: {selectedStudent.className} · Category: {selectedStudent.category}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Outstanding Dues</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  ₹{formatCurrency(invoices.filter(i => i.status !== "Paid").reduce((s, i) => s + (i.payableAmount - i.paidAmount), 0))}
                </p>
              </div>
            </div>

            {/* Installments Bills */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 py-2.5 px-4 bg-slate-50">
                <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Installments & Billing Invoices</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs">
                      {["Bill Number", "Description/Installment", "Due Date", "Base Amount", "Discount", "Late Fine", "Concession", "Payable", "Paid Amount", "Balance Due", "Status", "Actions"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan="12" className="p-6 text-center text-slate-400">No installment invoices generated.</td>
                      </tr>
                    ) : (
                      invoices.map(inv => {
                        const bal = inv.payableAmount - inv.paidAmount;
                        return (
                          <tr key={inv._id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-semibold text-slate-700">{inv.invoiceNumber}</td>
                            <td className="px-4 py-2 text-slate-950 font-bold">{inv.installmentName}</td>
                            <td className="px-4 py-2 text-slate-500 font-semibold">{new Date(inv.dueDate).toLocaleDateString()}</td>
                            <td className="px-4 py-2 text-slate-700">₹{formatCurrency(inv.amount)}</td>
                            <td className="px-4 py-2 text-emerald-600">-₹{formatCurrency(inv.discountAmount)}</td>
                            <td className="px-4 py-2 text-amber-600">+₹{formatCurrency(inv.fineAmount)}</td>
                            <td className="px-4 py-2 text-rose-500">-₹{formatCurrency(inv.concessionAmount)}</td>
                            <td className="px-4 py-2 font-bold text-slate-800">₹{formatCurrency(inv.payableAmount)}</td>
                            <td className="px-4 py-2 text-blue-600 font-bold">₹{formatCurrency(inv.paidAmount)}</td>
                            <td className="px-4 py-2 font-extrabold text-slate-950 text-sm">₹{formatCurrency(bal)}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                inv.status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                                inv.status === "Partially Paid" ? "bg-amber-50 text-amber-700 border-amber-100" : 
                                "bg-rose-50 text-rose-700 border-rose-100"
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex gap-1.5">
                                {inv.status !== "Paid" && (
                                  <>
                                    <button onClick={() => {
                                      setPayForm({ amountPaid: bal.toString(), paymentMode: "Cash", transactionId: "", remarks: "" });
                                      setShowPayModal(inv);
                                    }}
                                      className="inline-flex h-7 items-center bg-slate-950 px-2.5 text-[10px] font-bold text-white hover:bg-slate-800 rounded-lg cursor-pointer">
                                      Pay
                                    </button>
                                    <button onClick={() => { setConcessionForm({ concessionAmount: "", reason: "" }); setShowConcessionModal(inv); }}
                                      className="inline-flex h-7 items-center border border-slate-200 px-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer">
                                      Concession
                                    </button>
                                  </>
                                )}
                                {inv.status === "Paid" && (
                                  <span className="text-[10px] font-bold text-emerald-600 inline-flex items-center gap-1"><CheckCircle size={10} /> Paid</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Payment Receipts History */}
            <section id="collection-receipts-section" className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 py-2.5 px-4 bg-slate-50">
                <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Payment Transaction Receipts</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs">
                      {["Receipt No", "Payment Date", "Payment Mode", "Ref Transaction", "Amount Paid", "Collected By", "Remarks", "Actions"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {receipts.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-6 text-center text-slate-400">No payment transaction records found.</td>
                      </tr>
                    ) : (
                      receipts.map(rec => (
                        <tr key={rec._id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2 font-bold text-slate-900">{rec.receiptNumber}</td>
                          <td className="px-4 py-2 text-slate-500">{new Date(rec.paymentDate).toLocaleString()}</td>
                          <td className="px-4 py-2 font-bold">{rec.paymentMode}</td>
                          <td className="px-4 py-2 text-slate-600">{rec.transactionId || "—"}</td>
                          <td className="px-4 py-2 font-bold text-slate-950 text-sm">₹{formatCurrency(rec.amountPaid)}</td>
                          <td className="px-4 py-2 text-slate-500">{rec.receivedBy?.fullName || "System"}</td>
                          <td className="px-4 py-2 text-slate-400 font-medium">{rec.remarks || "—"}</td>
                          <td className="px-4 py-2">
                            <button onClick={() => { setSelectedReceipt(rec); setView("receipt_detail"); }} 
                              className="inline-flex h-8 items-center gap-1 border border-slate-200 px-2.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer">
                              <Printer size={12} /> Print Receipt
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ─── DETAIL VIEW: RECEIPT PRINT ───────────────────────────────── */}
        {view === "receipt_detail" && selectedReceipt && (
          <div className="space-y-6">
            <button onClick={() => setView("student_detail")} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition print:hidden">
              <ArrowLeft size={14} /> Back to Student Account Ledger
            </button>
 
            <div className="max-w-3xl mx-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">SPRINGFIELD PUBLIC SCHOOL</h1>
                  <p className="text-xs text-slate-500 font-medium mt-1">Sector 12, Springfield Road, Punjab</p>
                  <p className="text-[10px] text-slate-400 font-medium">Email: accounts@springfield.edu · Phone: +91 9988776655</p>
                </div>
                <div className="text-right">
                  <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">FEES RECEIPT</h2>
                  <p className="text-xs font-bold text-slate-700 mt-1">Receipt No: {selectedReceipt.receiptNumber}</p>
                  <p className="text-[10px] text-slate-500">Date: {new Date(selectedReceipt.paymentDate).toLocaleDateString()}</p>
                </div>
              </div>
 
              {/* Student Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl">
                <div className="space-y-1">
                  <p className="text-slate-500"><span className="font-semibold text-slate-700">Student Name:</span> {selectedStudent.firstName} {selectedStudent.lastName}</p>
                  <p className="text-slate-500"><span className="font-semibold text-slate-700">Admission No:</span> {selectedStudent.admissionNo}</p>
                  <p className="text-slate-500"><span className="font-semibold text-slate-700">Class & Sec:</span> {selectedStudent.className} · {selectedStudent.sectionName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500"><span className="font-semibold text-slate-700">Student Category:</span> {selectedStudent.category}</p>
                  <p className="text-slate-500"><span className="font-semibold text-slate-700">Payment Mode:</span> {selectedReceipt.paymentMode}</p>
                  <p className="text-slate-500"><span className="font-semibold text-slate-700">Ref Txn ID:</span> {selectedReceipt.transactionId || "—"}</p>
                </div>
              </div>
 
              {/* Fee breakdown details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Fee Head Breakdown</h3>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Fee Head Category</th>
                      <th className="py-2 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Base Amount</th>
                      <th className="py-2 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Category Discount</th>
                      <th className="py-2 text-right text-[11px] font-bold uppercase tracking-wider text-slate-900">Net Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedReceipt.invoice?.feeBreakdown?.map((item, idx) => (
                      <tr key={idx} className="text-slate-600">
                        <td className="py-2 font-medium">{item.name}</td>
                        <td className="py-2 text-right">₹{formatCurrency(item.baseAmount)}</td>
                        <td className="py-2 text-right text-emerald-600">-₹{formatCurrency(item.discountAmount)}</td>
                        <td className="py-2 text-right font-semibold text-slate-900">₹{formatCurrency(item.finalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
 
              {/* Totals Summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 border-t border-slate-200 pt-4 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Term Base Amount:</span>
                    <span>₹{formatCurrency(selectedReceipt.invoice?.amount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount Applied:</span>
                    <span>-₹{formatCurrency(selectedReceipt.invoice?.discountAmount)}</span>
                  </div>
                  <div className="flex justify-between text-rose-500">
                    <span>Concession Waiver:</span>
                    <span>-₹{formatCurrency(selectedReceipt.invoice?.concessionAmount)}</span>
                  </div>
                  <div className="flex justify-between text-amber-600">
                    <span>Overdue Late Fine:</span>
                    <span>+₹{formatCurrency(selectedReceipt.invoice?.fineAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-900">
                    <span>Total Bill:</span>
                    <span>₹{formatCurrency(selectedReceipt.invoice?.payableAmount)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-blue-700 bg-blue-50/50 p-2 rounded-xl mt-1">
                    <span>Amount Paid:</span>
                    <span>₹{formatCurrency(selectedReceipt.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-1">
                    <span>Balance Due:</span>
                    <span>₹{formatCurrency(selectedReceipt.invoice ? selectedReceipt.invoice.payableAmount - selectedReceipt.amountPaid : 0)}</span>
                  </div>
                </div>
              </div>
 
              {/* Signatures */}
              <div className="flex justify-between items-end pt-10 text-xs">
                <div className="space-y-5">
                  <p className="text-slate-400">Paid and Cleared</p>
                  <p className="font-bold text-slate-800 border-t border-slate-200 pt-2 w-48 text-center">Student Signature</p>
                </div>
                <div className="text-right space-y-5">
                  <p className="text-slate-400">Cashier Signature</p>
                  <p className="font-bold text-slate-800 border-t border-slate-200 pt-2 w-48 text-center">Authorized Accountant</p>
                </div>
              </div>
 
              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-150 print:hidden">
                <button onClick={handlePrint} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer">
                  <Printer size={14} /> Print Bill Receipt
                </button>
              </div>
            </div>
          </div>
        )}

      {/* ─── MODAL: PAYMENT COLLECT FORM ────────────────────────────────── */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <form onSubmit={handlePaymentSubmit} className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="border-b border-slate-200 p-4 flex justify-between items-center bg-slate-50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950">Record Term Fee Collection</h2>
              <button type="button" onClick={() => setShowPayModal(null)} className="text-slate-400 hover:text-slate-650 font-bold cursor-pointer">✕</button>
            </div>
            <div className="p-4 space-y-3.5">
              {/* Redesigned Student & Billing Info Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block">Student Name</span>
                  <span className="text-slate-900 font-bold">{selectedStudent?.firstName} {selectedStudent?.lastName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Admission No</span>
                  <span className="text-slate-900 font-bold">{selectedStudent?.admissionNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Category</span>
                  <span className="text-slate-900 font-bold">{selectedStudent?.category || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Fee Structure</span>
                  <span className="text-slate-900 font-bold">{showPayModal?.feeStructureName || "—"}</span>
                </div>
                <div className="col-span-2 border-t border-slate-200 pt-2 grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-slate-400 font-semibold block">Original Fee</span>
                    <span className="text-slate-800 font-bold">₹{showPayModal?.amount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Discount ({discountPercent}%)</span>
                    <span className="text-emerald-600 font-bold">₹{showPayModal?.discountAmount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Already Paid</span>
                    <span className="text-blue-600 font-bold">₹{showPayModal?.paidAmount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Concession</span>
                    <span className="text-rose-600 font-bold">₹{showPayModal?.concessionAmount || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block">Late Fine</span>
                    <span className="text-amber-600 font-bold">₹{showPayModal?.fineAmount || 0}</span>
                  </div>
                  <div className="bg-slate-100 p-1.5 rounded-lg text-center">
                    <span className="text-slate-500 font-bold block">Final Balance</span>
                    <span className="text-slate-950 font-extrabold text-sm">₹{showPayModal?.payableAmount - showPayModal?.paidAmount}</span>
                  </div>
                </div>
              </div>
 
              {/* Inputs */}
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Payment Amount (₹) *</label>
                <input required type="number" min="0.01" step="0.01" value={payForm.amountPaid} onChange={(e) => setPayForm({ ...payForm, amountPaid: e.target.value })}
                  placeholder="Enter collect amount" className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 font-semibold" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Payment Mode *</label>
                <select required value={payForm.paymentMode} onChange={(e) => setPayForm({ ...payForm, paymentMode: e.target.value })}
                  className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none bg-white font-semibold text-slate-700">
                  {["Cash", "UPI", "Card", "Cheque", "Bank Transfer"].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Reference Number {["UPI", "Card", "Bank Transfer", "Cheque"].includes(payForm.paymentMode) ? "*" : ""}</label>
                <input value={payForm.transactionId} onChange={(e) => setPayForm({ ...payForm, transactionId: e.target.value })}
                  placeholder="Transaction Ref No / Cheque No..." className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 font-semibold" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Remarks / Memo</label>
                <textarea value={payForm.remarks} onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })}
                  placeholder="Record memo notes..." className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-slate-400 h-14 resize-none font-medium" />
              </div>
            </div>
            <div className="border-t border-slate-100 p-4 flex justify-end gap-2 bg-slate-50">
              <button type="button" onClick={() => setShowPayModal(null)} className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="h-9 rounded-xl bg-slate-950 px-5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer">Save Payment</button>
            </div>
          </form>
        </div>
      )}
 
      {/* ─── MODAL: CONCESSION WAIVER FORM ──────────────────────────────── */}
      {showConcessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <form onSubmit={handleConcessionSubmit} className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="border-b border-slate-200 p-4 flex justify-between items-center bg-slate-50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950">Record Custom Fee Waiver Concession</h2>
              <button type="button" onClick={() => setShowConcessionModal(null)} className="text-slate-400 hover:text-slate-650 font-bold cursor-pointer">✕</button>
            </div>
            <div className="p-4 space-y-3.5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2.5 text-xs text-amber-700">
                <AlertTriangle className="shrink-0 mt-0.5" size={15} />
                <p>Applying a concession directly reduces the net payable amount for this installment bill. This adjustment is logged in audit reports.</p>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Concession Amount (₹) *</label>
                <input required type="number" min="0" value={concessionForm.concessionAmount} onChange={(e) => setConcessionForm({ ...concessionForm, concessionAmount: e.target.value })}
                  placeholder="e.g. 1500" className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 font-semibold" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Reason for Waiver *</label>
                <textarea required value={concessionForm.reason} onChange={(e) => setConcessionForm({ ...concessionForm, reason: e.target.value })}
                  placeholder="e.g., EWS extra scholarship rebate..." className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-slate-400 h-16 resize-none font-medium" />
              </div>
            </div>
            <div className="border-t border-slate-100 p-4 flex justify-end gap-2 bg-slate-50">
              <button type="button" onClick={() => setShowConcessionModal(null)} className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="h-9 rounded-xl bg-slate-950 px-5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer">Apply Concession</button>
            </div>
          </form>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
};

export default FeeCollectionPage;
