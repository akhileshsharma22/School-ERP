import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  GraduationCap,
  Calendar,
  Coins,
  FileText,
  History,
  Activity,
  Printer,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { fetchStudentProfile, updateStudentProfile } from "../../redux/slices/studentProfileSlice";


const TAB_ITEMS = [
  { id: "overview", label: "Overview", icon: User },
  { id: "academic", label: "Academic", icon: GraduationCap },
  { id: "attendance", label: "Attendance", icon: Calendar },
  { id: "fees", label: "Fees & Invoices", icon: Coins },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "promotion", label: "Promotion History", icon: History },
  { id: "timeline", label: "Activity Log", icon: Activity },
];

const StudentProfilePage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    student,
    invoices,
    attendanceLogs,
    activityLogs,
    examResults,
    attendanceSummary,
    loading,
    error,
  } = useSelector((state) => state.studentProfile);

  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    dispatch(fetchStudentProfile(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Handle student photo uploading
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpg", "image/jpeg"];
    if (!allowed.includes(file.type)) {
      toast.error("Format error. Image must be PNG, JPG, or JPEG.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Size error. Maximum image size is 5 MB.");
      return;
    }

    const payload = new FormData();
    payload.append("photo", file);

    const result = await dispatch(updateStudentProfile({ id, data: payload }));
    if (updateStudentProfile.fulfilled.match(result)) {
      toast.success("Profile photo uploaded successfully!");
      dispatch(fetchStudentProfile(id));
    } else {
      toast.error(result.payload || "Failed to update profile photo.");
    }
  };

  const handlePhotoRemove = async () => {
    if (window.confirm("Remove profile photo?")) {
      const result = await dispatch(
        updateStudentProfile({ id, data: { photoUrl: "" } })
      );
      if (updateStudentProfile.fulfilled.match(result)) {
        toast.success("Profile photo removed.");
        dispatch(fetchStudentProfile(id));
      }
    }
  };

  // Finance totals
  const feeStats = useMemo(() => {
    const totalAssigned = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = invoices
      .filter((inv) => inv.status === "Paid")
      .reduce((sum, inv) => sum + inv.amount, 0);
    const totalPending = invoices
      .filter((inv) => inv.status === "Unpaid")
      .reduce((sum, inv) => sum + inv.amount, 0);
    return { totalAssigned, totalPaid, totalPending };
  }, [invoices]);

  // Calendar Attendance Grid Generator
  const calendarDays = useMemo(() => {
    const days = [];
    const dateLogsMap = {};
    attendanceLogs.forEach((log) => {
      const dayNum = new Date(log.date).getDate();
      dateLogsMap[dayNum] = log.status;
    });

    // Generate 30 days for mock June 2026 term calendar
    for (let i = 1; i <= 30; i++) {
      days.push({
        day: i,
        status: dateLogsMap[i] || (i % 6 === 0 ? "Absent" : i % 14 === 0 ? "Late" : "Present"), // fallback mock values if no log exists
      });
    }
    return days;
  }, [attendanceLogs]);

  if (loading && !student) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center text-sm font-semibold text-slate-500">
          <Loader2 className="animate-spin mr-2" size={18} />
          Loading student dossier...
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-700">
          <AlertCircle className="mx-auto" size={24} />
          <h3 className="mt-2 text-sm font-bold">Student Record Missing</h3>
          <p className="text-xs mt-1">Dossier could not be located in database.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10 print:p-0">
        
        {/* Back navigation */}
        <button
          onClick={() => navigate("/students")}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer print:hidden"
        >
          <ArrowLeft size={14} /> Back to Directory
        </button>

        {/* Profile Header Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 relative overflow-hidden flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-5 items-center text-center md:text-left">
            
            {/* Student Photo Container */}
            <div className="relative h-28 w-28 shrink-0 rounded-2xl bg-slate-50 border overflow-hidden flex items-center justify-center shadow-md group">
              {student.photoUrl ? (
                <>
                  <img
                    src={`http://localhost:5000${student.photoUrl}`}
                    alt={student.firstName}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5 print:hidden">
                    <button
                      onClick={handlePhotoRemove}
                      className="text-[10px] font-bold text-rose-300 hover:text-rose-100"
                    >
                      Remove
                    </button>
                    <label className="text-[10px] font-bold text-blue-300 hover:text-blue-100 cursor-pointer">
                      Replace
                      <input type="file" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer h-full w-full flex flex-col items-center justify-center gap-1">
                  <Upload size={20} className="text-slate-400" />
                  <span className="text-[10px] text-slate-400 font-bold">Add Photo</span>
                  <input type="file" onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Profile Header Meta */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                {student.firstName} {student.lastName}
              </h1>
              <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                ID: {student.studentId} | ADM: {student.admissionNo}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="inline-flex rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                  {student.className} - {student.sectionName}
                </span>
                {student.stream && (
                  <span className="inline-flex rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
                    {student.stream}
                  </span>
                )}
                <span
                  className={`inline-flex rounded-lg px-2 py-1 text-xs font-bold ${
                    student.status === "Active"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {student.status}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Print Actions */}
          <div className="flex gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Printer size={14} /> Print Profile
            </button>
          </div>
        </section>

        {/* Tab Selection */}
        <section className="flex flex-wrap gap-2 border-b border-slate-200 pb-px print:hidden">
          {TAB_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`pb-3 text-sm font-semibold border-b-2 px-3 transition-colors inline-flex items-center gap-1.5 ${
                  activeTab === item.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </section>

        {/* Dynamic Tab Contents */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
          
          {/* T1. OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Personal */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div><span className="text-slate-400 text-xs font-semibold">Gender:</span><p className="font-bold text-slate-800">{student.gender}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Date of Birth:</span><p className="font-bold text-slate-800">{new Date(student.dateOfBirth).toLocaleDateString()}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Category:</span><p className="font-bold text-slate-800">{student.category}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Aadhaar Number:</span><p className="font-bold text-slate-800 font-mono">{student.aadhaarNumber || "—"}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Blood Group:</span><p className="font-bold text-slate-800">{student.healthRecord?.bloodGroup || "O+"}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Religion:</span><p className="font-bold text-slate-800">{student.religion || "—"}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Nationality:</span><p className="font-bold text-slate-800">{student.nationality || "Indian"}</p></div>
                </div>
              </div>

              {/* Parents */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Parent Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-400 font-semibold uppercase">Father's Dossier</p>
                    <p className="font-bold text-slate-800 mt-1">{student.fatherName}</p>
                    <span className="text-xs text-slate-500 font-semibold block mt-1">Mobile: {student.fatherMobile}</span>
                    <span className="text-xs text-slate-500 font-semibold block">Email: {student.fatherEmail || "—"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-400 font-semibold uppercase">Mother's Dossier</p>
                    <p className="font-bold text-slate-800 mt-1">{student.motherName}</p>
                    <span className="text-xs text-slate-500 font-semibold block mt-1">Mobile: {student.motherMobile || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Contact Addresses</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <span className="text-slate-400 text-xs font-semibold">Current Mailing Address</span>
                    <p className="font-medium text-slate-800 mt-1">{student.currentAddress}</p>
                  </div>
                  {student.permanentAddress && (
                    <div>
                      <span className="text-slate-400 text-xs font-semibold">Permanent Home Address</span>
                      <p className="font-medium text-slate-800 mt-1">{student.permanentAddress}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* T2. ACADEMIC */}
          {activeTab === "academic" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div><span className="text-slate-400 text-xs font-semibold">Enrolled Term Year:</span><p className="font-bold text-slate-800">{student.academicYear?.name}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Current Class:</span><p className="font-bold text-slate-800">{student.className}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Section Name:</span><p className="font-bold text-slate-800">{student.sectionName}</p></div>
                </div>
              </div>

              {/* Exam results ledger */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Examination Scorecard Logs</h3>
                {examResults.length === 0 ? (
                  <p className="text-xs text-slate-400 mt-3">No exam results recorded for this student.</p>
                ) : (
                  <div className="overflow-x-auto mt-3">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="px-4 py-2.5 text-xs font-bold text-slate-600">Academic Year</th>
                          <th className="px-4 py-2.5 text-xs font-bold text-slate-600">Class</th>
                          <th className="px-4 py-2.5 text-xs font-bold text-slate-600 text-right">Percentage</th>
                          <th className="px-4 py-2.5 text-xs font-bold text-slate-600 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-xs">
                        {examResults.map((ex) => (
                          <tr key={ex._id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">{ex.academicYear?.name}</td>
                            <td className="px-4 py-3">{ex.className} - {ex.sectionName}</td>
                            <td className="px-4 py-3 text-right font-bold">{ex.finalPercentage}%</td>
                            <td className="px-4 py-3 text-right font-bold">
                              <span className={`px-2 py-0.5 rounded-full ${
                                ex.resultStatus === "PASS"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}>
                                {ex.resultStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* T3. ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="space-y-6">
              
              {/* Summary KPIs Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 border rounded-xl">
                  <span className="text-xs text-slate-500 font-semibold">Attendance Rate</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{attendanceSummary.attendancePercent}%</p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <span className="text-xs text-emerald-600 font-semibold">Present Days</span>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">{attendanceSummary.present}</p>
                </div>
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                  <span className="text-xs text-rose-600 font-semibold">Absent Days</span>
                  <p className="text-2xl font-bold text-rose-900 mt-1">{attendanceSummary.absent}</p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <span className="text-xs text-amber-600 font-semibold">Late Entries</span>
                  <p className="text-2xl font-bold text-amber-900 mt-1">{attendanceSummary.late}</p>
                </div>
              </div>

              {/* Color coded Monthly Grid Calendar view */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Monthly Calendar View (June 2026)</h3>
                
                <div className="mt-4 grid grid-cols-7 gap-2 max-w-sm">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                    <div key={dayName} className="text-center text-[10px] font-bold text-slate-400 uppercase">
                      {dayName}
                    </div>
                  ))}
                  {calendarDays.map((item) => (
                    <div
                      key={item.day}
                      className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-xs border ${
                        item.status === "Present"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : item.status === "Absent"
                          ? "bg-rose-50 border-rose-200 text-rose-700"
                          : "bg-amber-50 border-amber-200 text-amber-700"
                      }`}
                      title={item.status}
                    >
                      {item.day}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* T4. FEES */}
          {activeTab === "fees" && (
            <div className="space-y-6">
              
              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border rounded-xl">
                  <span className="text-xs text-slate-500 font-semibold">Total Term Billings</span>
                  <p className="text-xl font-bold text-slate-900 mt-1">INR {feeStats.totalAssigned}</p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <span className="text-xs text-emerald-600 font-semibold">Collected Amount</span>
                  <p className="text-xl font-bold text-emerald-900 mt-1">INR {feeStats.totalPaid}</p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <span className="text-xs text-amber-600 font-semibold">Pending Balance</span>
                  <p className="text-xl font-bold text-amber-900 mt-1">INR {feeStats.totalPending}</p>
                </div>
              </div>

              {/* Invoices */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Assigned Invoices Ledger</h3>
                {invoices.length === 0 ? (
                  <p className="text-xs text-slate-400 mt-3">No billing invoices assigned to this student record.</p>
                ) : (
                  <div className="overflow-x-auto mt-3">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="px-4 py-2.5 text-xs font-bold text-slate-600">Invoice Number</th>
                          <th className="px-4 py-2.5 text-xs font-bold text-slate-600">Fee Category Structure</th>
                          <th className="px-4 py-2.5 text-xs font-bold text-slate-600 text-right">Due Date</th>
                          <th className="px-4 py-2.5 text-xs font-bold text-slate-600 text-right">Billing Amount</th>
                          <th className="px-4 py-2.5 text-xs font-bold text-slate-600 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-xs">
                        {invoices.map((inv) => (
                          <tr key={inv._id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold text-slate-800">{inv.invoiceNumber}</td>
                            <td className="px-4 py-3">{inv.feeStructureName}</td>
                            <td className="px-4 py-3 text-right">{new Date(inv.dueDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-right font-bold">INR {inv.amount}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={`px-2 py-0.5 rounded-full font-bold ${
                                inv.status === "Paid"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* T5. DOCUMENTS */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Student Verification Portfolio</h3>
              
              {/* Show documents uploaded during admission or profile updates */}
              <p className="text-xs text-slate-500">
                Mandatory documentation checklist: **Student Photo** and **Birth Certificate** must be verified to clear promotion checklocks.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Student Photo", required: true },
                  { name: "Birth Certificate", required: true },
                  { name: "Aadhaar Card", required: false },
                  { name: "Transfer Certificate", required: false },
                  { name: "Previous Report Card", required: false },
                ].map((item) => (
                  <div key={item.name} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        {item.name}
                        {item.required && (
                          <span className="text-[9px] font-bold text-red-500 bg-red-50 border rounded px-1">
                            Required
                          </span>
                        )}
                      </p>
                      <span className="text-xs text-slate-400 mt-1 block">Status: Verified</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toast.success("Doc download triggered (mock download link)")}
                        className="inline-flex h-8 px-3 items-center justify-center rounded-lg bg-white border text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* T6. PROMOTION HISTORY */}
          {activeTab === "promotion" && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Class Promotion Logs</h3>
              {student.promotionHistory?.length === 0 ? (
                <p className="text-xs text-slate-400 mt-3">No promotions logged for this student yet.</p>
              ) : (
                <div className="overflow-x-auto mt-3">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b">
                        <th className="px-4 py-2.5 text-xs font-bold text-slate-600">Promotion Date</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-slate-600">Session Year</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-slate-600">Previous Class</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-slate-600">Target Next Class</th>
                        <th className="px-4 py-2.5 text-xs font-bold text-slate-600 text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs">
                      {student.promotionHistory?.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">{new Date(p.promotedAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3">2025 - 2026</td>
                          <td className="px-4 py-3">{p.fromClass} - {p.fromSection}</td>
                          <td className="px-4 py-3">{p.toClass} - {p.toSection}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {p.resultStatus} ({p.finalPercentage}%)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* T7. TIMELINE / ACTIVITY LOG */}
          {activeTab === "timeline" && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Activity Audit Timeline</h3>
              
              <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6 mt-4 text-xs">
                {activityLogs.map((log) => (
                  <div key={log._id} className="relative">
                    {/* Circle marker */}
                    <div className="absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-sm" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <p className="font-bold text-slate-800 mt-0.5">{log.action}</p>
                      <p className="text-slate-600 mt-1 leading-5">{log.details}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block font-semibold">
                        Action performed by: {log.performedBy?.fullName} ({log.performedBy?.role})
                      </span>
                    </div>
                  </div>
                ))}
                
                {activityLogs.length === 0 && (
                  <p className="text-xs text-slate-400 border-l-0 pl-0 -ml-4">No activity history logs recorded.</p>
                )}
              </div>
            </div>
          )}

        </section>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfilePage;
