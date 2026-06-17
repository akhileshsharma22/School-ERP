import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Download,
  Info,
  Loader2,
  Plus,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  FileCheck,
  Printer,
  Coins,
  Calendar,
  AlertCircle,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { fetchAdmissions, approveAdmission } from "../../redux/slices/admissionSlice";
import { fetchAllClasses } from "../../redux/slices/classSectionSlice";

const MetricCard = ({ label, value, helper, colorClass, icon: Icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      {helper && <p className="mt-2 text-xs font-semibold text-slate-400">{helper}</p>}
    </div>
    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colorClass}`}>
      <Icon size={22} />
    </div>
  </div>
);

const AdmissionListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { admissions, metrics, loading, saving } = useSelector((state) => state.admissions);
  const { classes } = useSelector((state) => state.classSections);

  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [verifyFilter, setVerifyFilter] = useState("");
  const [approveFilter, setApproveFilter] = useState("");

  // Modals state
  const [viewAdmission, setViewAdmission] = useState(null);
  const [approvingRecord, setApprovingRecord] = useState(null);
  const [approvalDetails, setApprovalDetails] = useState(null); // stores generated credentials after approval
  const [feeConfig, setFeeConfig] = useState({
    feeStructure: "Standard Annual Fee Structure",
    amount: "12000",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  useEffect(() => {
    dispatch(fetchAllClasses());
    loadAdmissions();
  }, [dispatch, classFilter, verifyFilter, approveFilter]);

  const loadAdmissions = () => {
    const params = {};
    if (classFilter) params.className = classFilter;
    if (verifyFilter) params.verificationStatus = verifyFilter;
    if (approveFilter) params.approvalStatus = approveFilter;
    dispatch(fetchAdmissions(params));
  };

  const filteredAdmissions = useMemo(() => {
    return admissions.filter((adm) => {
      const name = `${adm.firstName} ${adm.lastName}`.toLowerCase();
      const father = adm.fatherName?.toLowerCase() || "";
      const adNo = adm.admissionNo?.toLowerCase() || "";
      const aadh = adm.aadhaarNumber || "";
      const query = searchTerm.toLowerCase();

      return (
        !query ||
        name.includes(query) ||
        father.includes(query) ||
        adNo.includes(query) ||
        aadh.includes(query)
      );
    });
  }, [admissions, searchTerm]);

  const handleOpenApproveModal = (admission) => {
    if (admission.verificationStatus !== "Verified") {
      toast.error("Application must be verified by document checker before approval.");
      return;
    }
    setApprovingRecord(admission);
    setFeeConfig({
      feeStructure: `${admission.classApplied} Standard Fee Structure`,
      amount: admission.classApplied.includes("11") || admission.classApplied.includes("12") ? "15000" : "12000",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
  };

  const handleApproveConfirm = async (e) => {
    e.preventDefault();
    if (!feeConfig.feeStructure || !feeConfig.amount || !feeConfig.dueDate) {
      toast.error("Please fill in all fee billing fields.");
      return;
    }

    const payload = {
      feeStructure: feeConfig.feeStructure,
      amount: Number(feeConfig.amount),
      dueDate: new Date(feeConfig.dueDate),
    };

    const result = await dispatch(approveAdmission({ id: approvingRecord._id, data: payload }));
    if (approveAdmission.fulfilled.match(result)) {
      toast.success("✓ Admission approved successfully");
      toast.success("✓ Student created successfully");
      setApprovalDetails(result.payload.details);
      setApprovingRecord(null);
      loadAdmissions();
    } else {
      const payloadError = result.payload;
      if (payloadError === "Your session has expired. Please login again.") {
        toast.error("✗ Session expired");
      } else if (payloadError === "You do not have permission to approve admissions.") {
        toast.error("✗ Authorization failed");
      } else {
        toast.error(payloadError || "Failed to approve admission application.");
      }
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleExport = () => {
    if (filteredAdmissions.length === 0) {
      toast.info("No data to export");
      return;
    }
    const rows = filteredAdmissions.map((adm) => ({
      "Admission ID": adm.studentId || "—",
      "Admission Number": adm.admissionNo || "—",
      "Student Name": `${adm.firstName} ${adm.lastName}`,
      "Applied Class": adm.classApplied,
      "Applied Section": adm.sectionApplied,
      "Father Name": adm.fatherName,
      Mobile: adm.fatherMobile,
      "Verification Status": adm.verificationStatus,
      "Approval Status": adm.approvalStatus,
    }));
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Admissions_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        {/* Header */}
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Admissions
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              Admission List
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Review, verify, and approve student admission applications.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admissions/new")}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-300 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md cursor-pointer"
          >
            <Plus size={18} />
            New Admission Application
          </button>
        </header>

        {/* Dashboard Metrics Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            label="Total Applications"
            value={metrics.totalCount}
            helper="All active session records"
            colorClass="bg-blue-50 text-blue-600"
            icon={FileText}
          />
          <MetricCard
            label="Pending Verify"
            value={metrics.pendingVerification}
            helper="Requires document check"
            colorClass="bg-amber-50 text-amber-600"
            icon={AlertCircle}
          />
          <MetricCard
            label="Approved Students"
            value={metrics.approvedCount}
            helper="Enrolled this term"
            colorClass="bg-emerald-50 text-emerald-600"
            icon={CheckCircle}
          />
          <MetricCard
            label="Rejected Files"
            value={metrics.rejectedCount}
            helper="Incomplete or failed checks"
            colorClass="bg-rose-50 text-rose-600"
            icon={XCircle}
          />
          <MetricCard
            label="Today's Enquiries"
            value={metrics.todayEnquiries}
            helper="New potential prospects"
            colorClass="bg-sky-50 text-sky-600"
            icon={Printer}
          />
        </section>

        {/* Filter bar */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:max-w-xs">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, Aadhaar or admission no"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </div>

              {/* Class Filter */}
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls.className}>
                    {cls.className}
                  </option>
                ))}
              </select>

              {/* Verification Filter */}
              <select
                value={verifyFilter}
                onChange={(e) => setVerifyFilter(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option value="">Verification Status</option>
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
              </select>

              {/* Approval Filter */}
              <select
                value={approveFilter}
                onChange={(e) => setApproveFilter(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option value="">Approval Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
            >
              <Download size={16} />
              Export Excel
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm font-medium text-slate-500">
              <Loader2 className="animate-spin" size={18} />
              Loading admission applications...
            </div>
          ) : filteredAdmissions.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-slate-950">No applications found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Submit a new admission application or loosen your search criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Admission/Student Details
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Applied Class & Sec
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Father Name & Phone
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Verification
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Approval Status
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredAdmissions.map((adm) => (
                    <tr key={adm._id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-bold text-slate-950">
                            {adm.firstName} {adm.lastName}
                          </p>
                          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mt-1">
                            ID: {adm.studentId || "PENDING"} | NO: {adm.admissionNo || "PENDING"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {adm.classApplied} - {adm.sectionApplied}
                          </p>
                          {adm.streamApplied && (
                            <span className="inline-flex rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 mt-1">
                              {adm.streamApplied}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{adm.fatherName}</p>
                          <span className="text-xs text-slate-400">{adm.fatherMobile}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            adm.verificationStatus === "Verified"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : adm.verificationStatus === "Rejected"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}
                        >
                          {adm.verificationStatus}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            adm.approvalStatus === "Approved"
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : adm.approvalStatus === "Rejected"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {adm.approvalStatus}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setViewAdmission(adm)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            <Eye size={14} />
                            View
                          </button>

                          {adm.verificationStatus === "Pending" && (
                            <button
                              type="button"
                              onClick={() => navigate("/admissions/verification")}
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-amber-50 px-3 text-xs font-semibold text-amber-700 hover:bg-amber-100 cursor-pointer"
                            >
                              Verify Files
                            </button>
                          )}

                          {adm.verificationStatus === "Verified" && adm.approvalStatus === "Pending" && (
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(adm)}
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                            >
                              <FileCheck size={14} />
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* APPROVAL & FEE INTEGRATION MODAL */}
      {approvingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2 border-b pb-2">
              <Coins className="text-emerald-600" size={22} />
              Approve Admission
            </h2>

            <p className="text-xs text-slate-500 mt-2">
              Approve enrollment for <strong>{approvingRecord.firstName} {approvingRecord.lastName}</strong>. Approval creates credentials and maps the student to fee billing.
            </p>

            <form onSubmit={handleApproveConfirm} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600">Assign Fee Structure</label>
                <select
                  value={feeConfig.feeStructure}
                  onChange={(e) => setFeeConfig((prev) => ({ ...prev, feeStructure: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                >
                  <option value="Standard Annual Fee Structure">Standard Annual Fee Structure</option>
                  <option value="Class 11 Science Fee Structure">Class 11 Science Fee Structure</option>
                  <option value="Class 11 Commerce Fee Structure">Class 11 Commerce Fee Structure</option>
                  <option value="Class 12 Science Fee Structure">Class 12 Science Fee Structure</option>
                  <option value="Scholarship Discounted Structure">Scholarship Discounted Structure</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">First Invoice Amount (INR)</label>
                <input
                  type="number"
                  value={feeConfig.amount}
                  onChange={(e) => setFeeConfig((prev) => ({ ...prev, amount: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">Invoice Due Date</label>
                <input
                  type="date"
                  value={feeConfig.dueDate}
                  onChange={(e) => setFeeConfig((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setApprovingRecord(null)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                >
                  {saving && <Loader2 className="animate-spin" size={14} />}
                  Approve Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUTO GENERATED CREDENTIALS PRINT MODAL */}
      {approvalDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-emerald-100 relative print:absolute print:inset-0 print:shadow-none print:border-none">
            
            <div className="flex items-center gap-3 text-emerald-700 pb-3 border-b border-slate-100">
              <ShieldCheck size={28} />
              <div>
                <h2 className="text-lg font-bold">Admission Complete</h2>
                <p className="text-xs text-slate-500">Record saved and passwords generated.</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Admission Number</p>
                  <p className="font-bold text-slate-800">{approvalDetails.admissionNo}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Student ID</p>
                  <p className="font-bold text-slate-800">{approvalDetails.studentId}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Student Username</p>
                  <p className="font-mono text-slate-700">{approvalDetails.studentUsername}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Parent Username</p>
                  <p className="font-mono text-slate-700">{approvalDetails.parentUsername}</p>
                </div>
                <div className="col-span-2 border-t pt-2 mt-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Default Secure Password</p>
                  <p className="font-mono text-base font-bold text-blue-700">{approvalDetails.password}</p>
                </div>
              </div>

              {/* Fee Receipt details */}
              <div className="text-sm border border-slate-200 p-4 rounded-xl">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                  <Coins size={16} className="text-slate-400" />
                  First Invoice Generated
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-slate-500">Invoice Number:</span>
                  <span className="font-semibold text-slate-800 text-right">{approvalDetails.invoiceNumber}</span>
                  <span className="text-slate-500">Fee Assigned:</span>
                  <span className="font-semibold text-slate-800 text-right">{feeConfig.feeStructure}</span>
                  <span className="text-slate-500 font-bold text-slate-900">Amount Due:</span>
                  <span className="font-bold text-slate-950 text-right">INR {approvalDetails.amount}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4 mt-6 print:hidden">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <Printer size={14} />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setApprovalDetails(null)}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-5 text-xs font-semibold text-white hover:bg-slate-850 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL ADMISSION FORM VIEW MODAL */}
      {viewAdmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Application Detail — {viewAdmission.firstName} {viewAdmission.lastName}
              </h2>
              <button
                type="button"
                onClick={() => setViewAdmission(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-6 text-sm">
              {/* 1. Student Info */}
              <div>
                <h4 className="font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg mb-3">Student Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div><span className="text-slate-400 text-xs">Name:</span> <p className="font-bold text-slate-800">{viewAdmission.firstName} {viewAdmission.lastName}</p></div>
                  <div><span className="text-slate-400 text-xs">DOB:</span> <p className="font-bold text-slate-800">{new Date(viewAdmission.dateOfBirth).toLocaleDateString()}</p></div>
                  <div><span className="text-slate-400 text-xs">Gender:</span> <p className="font-bold text-slate-800">{viewAdmission.gender}</p></div>
                  <div><span className="text-slate-400 text-xs">Category:</span> <p className="font-bold text-slate-800">{viewAdmission.category}</p></div>
                  <div><span className="text-slate-400 text-xs">Aadhaar:</span> <p className="font-bold text-slate-800">{viewAdmission.aadhaarNumber || "—"}</p></div>
                  <div><span className="text-slate-400 text-xs">Blood Group:</span> <p className="font-bold text-slate-800">{viewAdmission.bloodGroup || "—"}</p></div>
                </div>
              </div>

              {/* 2. Academics */}
              <div>
                <h4 className="font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg mb-3">Academic Choices</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div><span className="text-slate-400 text-xs">Applying Class:</span> <p className="font-bold text-slate-800">{viewAdmission.classApplied}</p></div>
                  <div><span className="text-slate-400 text-xs">Applying Section:</span> <p className="font-bold text-slate-800">{viewAdmission.sectionApplied}</p></div>
                  <div><span className="text-slate-400 text-xs">Stream Applied:</span> <p className="font-bold text-slate-800">{viewAdmission.streamApplied || "—"}</p></div>
                  <div><span className="text-slate-400 text-xs">Previous School:</span> <p className="font-bold text-slate-800">{viewAdmission.previousSchool || "—"}</p></div>
                  <div><span className="text-slate-400 text-xs">Previous Board:</span> <p className="font-bold text-slate-800">{viewAdmission.previousBoard || "—"}</p></div>
                  <div><span className="text-slate-400 text-xs">Previous Percentage:</span> <p className="font-bold text-slate-800">{viewAdmission.previousPercentage ? `${viewAdmission.previousPercentage}%` : "—"}</p></div>
                </div>
              </div>

              {/* 3. Parents */}
              <div>
                <h4 className="font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg mb-3">Parents Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div><span className="text-slate-400 text-xs">Father Name:</span> <p className="font-bold text-slate-800">{viewAdmission.fatherName}</p></div>
                  <div><span className="text-slate-400 text-xs">Father Mobile:</span> <p className="font-bold text-slate-800">{viewAdmission.fatherMobile}</p></div>
                  <div><span className="text-slate-400 text-xs">Father Email:</span> <p className="font-bold text-slate-800">{viewAdmission.fatherEmail || "—"}</p></div>
                  <div><span className="text-slate-400 text-xs">Mother Name:</span> <p className="font-bold text-slate-800">{viewAdmission.motherName}</p></div>
                  <div><span className="text-slate-400 text-xs">Mother Mobile:</span> <p className="font-bold text-slate-800">{viewAdmission.motherMobile || "—"}</p></div>
                  <div><span className="text-slate-400 text-xs">Guardian Name:</span> <p className="font-bold text-slate-800">{viewAdmission.guardianName || "—"}</p></div>
                </div>
              </div>

              {/* 4. Address */}
              <div>
                <h4 className="font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg mb-3">Address & Contact Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><span className="text-slate-400 text-xs">Current Address:</span> <p className="font-medium text-slate-800">{viewAdmission.currentAddress}, {viewAdmission.city}, {viewAdmission.state} - {viewAdmission.pinCode}</p></div>
                  <div><span className="text-slate-400 text-xs">Permanent Address:</span> <p className="font-medium text-slate-800">{viewAdmission.permanentAddress || "—"}</p></div>
                </div>
              </div>

              {/* 5. Documents */}
              <div>
                <h4 className="font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg mb-3">Uploaded Attachments</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {viewAdmission.documents?.map((doc) => (
                    <div key={doc._id} className="flex items-center justify-between border rounded-lg p-2.5 bg-slate-50">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{doc.docType}</p>
                        <span className={`text-[10px] font-bold ${
                          doc.status === "Verified"
                            ? "text-emerald-600"
                            : doc.status === "Rejected"
                            ? "text-rose-600"
                            : "text-amber-600"
                        }`}>{doc.status}</span>
                      </div>
                      <a
                        href={`http://localhost:5000${doc.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white shadow-sm hover:text-blue-600"
                      >
                        <Eye size={14} />
                      </a>
                    </div>
                  ))}
                  {(!viewAdmission.documents || viewAdmission.documents.length === 0) && (
                    <p className="text-xs text-slate-400">No documents uploaded</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t pt-4 mt-6">
              <button
                type="button"
                onClick={() => setViewAdmission(null)}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-5 text-xs font-semibold text-white hover:bg-slate-850 cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdmissionListPage;
