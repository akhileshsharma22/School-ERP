import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Calendar,
  Coins,
  FileText,
  Activity,
  Printer,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Upload,
  Clock,
  Trash2,
  Download
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  fetchStaffProfile,
  updateStaffProfile,
  fetchAttendance,
  saveAttendance,
  fetchLeaves,
  submitLeaveRequest,
  processLeaveStatus,
  fetchPayroll,
  createPayroll,
  fetchDocuments,
  addDocument,
  replaceDocument,
  removeDocument,
  fetchActivityLogs
} from "../../redux/slices/staffSlice";

const TAB_ITEMS = [
  { id: "overview", label: "Overview", icon: User },
  { id: "attendance", label: "Attendance", icon: Calendar },
  { id: "leaves", label: "Leaves", icon: Clock },
  { id: "payroll", label: "Payroll Slips", icon: Coins },
  { id: "documents", label: "KYC Documents", icon: FileText },
  { id: "timeline", label: "Activity Logs", icon: Activity },
];

const StaffProfilePage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    currentStaff,
    attendance,
    leaves,
    payrollList,
    documents,
    activityLogs,
    loading,
    saving,
    error
  } = useSelector((state) => state.staff);

  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("overview");

  // Tab specific states
  const [attendanceMonth, setAttendanceMonth] = useState(new Date().getMonth() + 1);
  const [attendanceYear, setAttendanceYear] = useState(new Date().getFullYear());
  const [markDate, setMarkDate] = useState(new Date().toISOString().split("T")[0]);
  const [markStatus, setMarkStatus] = useState("Present");
  const [markRemarks, setMarkRemarks] = useState("");

  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveActionId, setLeaveActionId] = useState(null);
  const [leaveActionRemarks, setLeaveActionRemarks] = useState("");

  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());
  const [payrollAllowances, setPayrollAllowances] = useState(0);
  const [payrollDeductions, setPayrollDeductions] = useState(0);

  const [docType, setDocType] = useState("Aadhaar Card");
  const [docFile, setDocFile] = useState(null);
  const [replaceDocId, setReplaceDocId] = useState(null);

  useEffect(() => {
    dispatch(fetchStaffProfile(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (activeTab === "attendance") {
      dispatch(fetchAttendance({ id, params: { year: attendanceYear, month: attendanceMonth } }));
    } else if (activeTab === "leaves") {
      dispatch(fetchLeaves(id));
    } else if (activeTab === "payroll") {
      dispatch(fetchPayroll(id));
    } else if (activeTab === "documents") {
      dispatch(fetchDocuments(id));
    } else if (activeTab === "timeline") {
      dispatch(fetchActivityLogs(id));
    }
  }, [dispatch, id, activeTab, attendanceMonth, attendanceYear]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Photo updates
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

    const result = await dispatch(updateStaffProfile({ id, formData: payload }));
    if (updateStaffProfile.fulfilled.match(result)) {
      toast.success("Profile photo updated successfully!");
      dispatch(fetchStaffProfile(id));
      if (activeTab === "timeline") dispatch(fetchActivityLogs(id));
    } else {
      toast.error(result.payload || "Failed to update profile photo.");
    }
  };

  // Attendance markup submission
  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    const result = await dispatch(saveAttendance({ id, data: { date: markDate, status: markStatus, remarks: markRemarks } }));
    if (saveAttendance.fulfilled.match(result)) {
      toast.success("Daily attendance marked successfully!");
      setMarkRemarks("");
      dispatch(fetchAttendance({ id, params: { year: attendanceYear, month: attendanceMonth } }));
    } else {
      toast.error(result.payload || "Failed to mark attendance.");
    }
  };

  // Leave application submission
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd || !leaveReason) {
      toast.error("Please fill in leave start date, end date, and reason.");
      return;
    }
    const result = await dispatch(submitLeaveRequest({ id, data: { leaveType, startDate: leaveStart, endDate: leaveEnd, reason: leaveReason } }));
    if (submitLeaveRequest.fulfilled.match(result)) {
      toast.success("Leave request submitted successfully!");
      setLeaveStart("");
      setLeaveEnd("");
      setLeaveReason("");
      dispatch(fetchLeaves(id));
    } else {
      toast.error(result.payload || "Failed to submit leave request.");
    }
  };

  // Leave approval process
  const handleProcessLeave = async (leaveId, status) => {
    const result = await dispatch(processLeaveStatus({ id, leaveId, data: { status, remarks: leaveActionRemarks } }));
    if (processLeaveStatus.fulfilled.match(result)) {
      toast.success(`Leave request status changed to ${status}`);
      setLeaveActionId(null);
      setLeaveActionRemarks("");
      dispatch(fetchLeaves(id));
      dispatch(fetchStaffProfile(id)); // refresh profile status to 'On Leave'
    } else {
      toast.error(result.payload || "Failed to update leave status.");
    }
  };

  // Payroll generation
  const handleGeneratePayroll = async (e) => {
    e.preventDefault();
    const result = await dispatch(createPayroll({ id, data: { month: payrollMonth, year: payrollYear, allowances: payrollAllowances, deductions: payrollDeductions } }));
    if (createPayroll.fulfilled.match(result)) {
      toast.success("Monthly payslip generated and set to Paid.");
      setPayrollAllowances(0);
      setPayrollDeductions(0);
      dispatch(fetchPayroll(id));
    } else {
      toast.error(result.payload || "Failed to generate payroll.");
    }
  };

  // Document management upload
  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docFile) {
      toast.error("Please select a document file to upload.");
      return;
    }

    const payload = new FormData();
    payload.append("docType", docType);
    payload.append("file", docFile);

    const result = await dispatch(addDocument({ id, formData: payload }));
    if (addDocument.fulfilled.match(result)) {
      toast.success("Document uploaded successfully!");
      setDocFile(null);
      dispatch(fetchDocuments(id));
    } else {
      toast.error(result.payload || "Failed to upload document.");
    }
  };

  // Document replace
  const handleReplaceDoc = async (docId, file) => {
    if (!file) return;

    const payload = new FormData();
    payload.append("file", file);

    const result = await dispatch(replaceDocument({ id, docId, formData: payload }));
    if (replaceDocument.fulfilled.match(result)) {
      toast.success("Document replaced successfully!");
      setReplaceDocId(null);
      dispatch(fetchDocuments(id));
    } else {
      toast.error(result.payload || "Failed to replace document.");
    }
  };

  // Document deletion
  const handleDeleteDoc = async (docId) => {
    if (window.confirm("Are you sure you want to permanently delete this document?")) {
      const result = await dispatch(removeDocument({ id, docId }));
      if (removeDocument.fulfilled.match(result)) {
        toast.success("Document record deleted.");
        dispatch(fetchDocuments(id));
      } else {
        toast.error(result.payload || "Failed to delete document.");
      }
    }
  };

  // PDF Print Trigger
  const handlePrintPayslip = (pay) => {
    const printWindow = window.open("", "_blank");
    const formattedDate = `${pay.month}/${pay.year}`;
    const staffName = `${currentStaff.firstName} ${currentStaff.lastName}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Payslip - ${staffName} - ${formattedDate}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; color: #1e293b; }
            .header p { margin: 5px 0 0 0; font-size: 14px; color: #64748b; }
            .dossier { margin: 30px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 13px; }
            .dossier span { font-weight: bold; }
            .salary-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            .salary-table th, .salary-table td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 13px; }
            .salary-table th { bg-color: #f8fafc; font-weight: bold; }
            .net-salary { margin-top: 30px; text-align: right; font-size: 18px; font-weight: bold; color: #1e293b; border-top: 2px solid #e2e8f0; padding-top: 15px; }
            .footer { margin-top: 80px; text-align: center; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SPRINGFIELD ACADEMY</h1>
            <p>Salary Slip for ${formattedDate}</p>
          </div>
          <div class="dossier">
            <div><span>Employee ID:</span> ${currentStaff.employeeId}</div>
            <div><span>Full Name:</span> ${staffName}</div>
            <div><span>Department:</span> ${currentStaff.department?.departmentName || "N/A"}</div>
            <div><span>Designation:</span> ${currentStaff.designation?.designationName || "N/A"}</div>
            <div><span>Staff Type:</span> ${currentStaff.staffType}</div>
            <div><span>Employment Status:</span> ${currentStaff.status}</div>
          </div>
          <table class="salary-table">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th>Earnings Category</th>
                <th>Amount (₹)</th>
                <th>Deductions / Taxes</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Basic Monthly Salary</td>
                <td>₹${pay.basicPay}</td>
                <td>Provident Fund (PF - 12%)</td>
                <td>₹${pay.pf}</td>
              </tr>
              <tr>
                <td>Allowances</td>
                <td>₹${pay.allowances}</td>
                <td>Employee State Insurance (ESI - 1.75%)</td>
                <td>₹${pay.esi}</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td>Professional Tax / Income Tax</td>
                <td>₹${pay.tax}</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td>Custom Deductions</td>
                <td>₹${pay.deductions}</td>
              </tr>
            </tbody>
          </table>
          <div class="net-salary">
            NET TAKE HOME SALARY: ₹${pay.netSalary}
          </div>
          <div class="footer">
            This is a computer-generated salary slip and requires no physical signature.
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Attendance calendar grid helpers
  const calendarDays = useMemo(() => {
    const days = [];
    const dateLogsMap = {};
    attendance.logs.forEach((log) => {
      const dayNum = new Date(log.date).getDate();
      dateLogsMap[dayNum] = log.status;
    });

    const daysInMonth = new Date(attendanceYear, attendanceMonth, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        status: dateLogsMap[i] || "Absent", // fallback default status if not marked
      });
    }
    return days;
  }, [attendance.logs, attendanceMonth, attendanceYear]);

  if (loading && !currentStaff) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center text-sm font-semibold text-slate-500">
          <Loader2 className="animate-spin mr-2" size={18} />
          Loading employee dossier...
        </div>
      </DashboardLayout>
    );
  }

  if (!currentStaff) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-700">
          <AlertCircle className="mx-auto" size={24} />
          <h3 className="mt-2 text-sm font-bold">Employee Record Missing</h3>
          <p className="text-xs mt-1">Dossier could not be located in database.</p>
        </div>
      </DashboardLayout>
    );
  }

  const staffName = `${currentStaff.firstName} ${currentStaff.lastName}`;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-12 print:p-0">
        
        {/* Back directory */}
        <button
          onClick={() => navigate("/staff")}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer print:hidden"
        >
          <ArrowLeft size={14} /> Back to Directory
        </button>

        {/* Profile Dossier Header */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 relative overflow-hidden flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-5 items-center text-center md:text-left">
            
            {/* Photo Container */}
            <div className="relative h-28 w-28 shrink-0 rounded-2xl bg-slate-50 border overflow-hidden flex items-center justify-center shadow-md group">
              {currentStaff.photoUrl ? (
                <>
                  <img
                    src={currentStaff.photoUrl.startsWith("http") ? currentStaff.photoUrl : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${currentStaff.photoUrl}`}
                    alt={staffName}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5 print:hidden">
                    <label className="text-[10px] font-bold text-blue-300 hover:text-blue-100 cursor-pointer">
                      Replace Photo
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

            {/* Profile Meta Header info */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">{staffName}</h1>
              <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                Employee Code: {currentStaff.employeeId} | {currentStaff.staffType}
              </p>
              
              <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {currentStaff.department?.departmentName || "General"}
                </span>
                <span className="inline-flex rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                  {currentStaff.designation?.designationName || "Employee"}
                </span>
                <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${currentStaff.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : currentStaff.status === "On Leave" ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                  {currentStaff.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Printer size={14} /> Print profile
            </button>
          </div>
        </section>

        {/* Navigation Tabs */}
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

        {/* Dynamic Dossier Component Views */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
          
          {/* T1. OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              
              {/* Personal Dossier */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div><span className="text-slate-400 text-xs font-semibold">Gender:</span><p className="font-bold text-slate-800">{currentStaff.gender}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Date of Birth:</span><p className="font-bold text-slate-800">{new Date(currentStaff.dateOfBirth).toLocaleDateString()}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Blood Group:</span><p className="font-bold text-slate-800">{currentStaff.bloodGroup || "—"}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Nationality:</span><p className="font-bold text-slate-800">{currentStaff.nationality}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Marital Status:</span><p className="font-bold text-slate-800">{currentStaff.maritalStatus}</p></div>
                </div>
              </div>

              {/* Contact Dossier */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Contact Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div><span className="text-slate-400 text-xs font-semibold">Mobile Number:</span><p className="font-bold text-slate-800">{currentStaff.mobile}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Alternate Mobile:</span><p className="font-bold text-slate-800">{currentStaff.alternateMobile || "—"}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Email Address:</span><p className="font-bold text-slate-800">{currentStaff.email}</p></div>
                  <div className="md:col-span-3"><span className="text-slate-400 text-xs font-semibold">Home Address:</span><p className="font-medium text-slate-800 mt-1">{currentStaff.address}, {currentStaff.city}, {currentStaff.state}, {currentStaff.country} - {currentStaff.pincode}</p></div>
                </div>
              </div>

              {/* Employment Dossier */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Employment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div><span className="text-slate-400 text-xs font-semibold">Employment Type:</span><p className="font-bold text-slate-800">{currentStaff.employmentType}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Date of Joining:</span><p className="font-bold text-slate-800">{new Date(currentStaff.dateOfJoining).toLocaleDateString()}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Monthly Salary:</span><p className="font-bold text-slate-800">₹{currentStaff.salary}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Highest Qualification:</span><p className="font-bold text-slate-800">{currentStaff.qualification || "—"}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Work Experience:</span><p className="font-bold text-slate-800">{currentStaff.experience || "—"}</p></div>
                  <div><span className="text-slate-400 text-xs font-semibold">Reporting Manager:</span><p className="font-bold text-slate-800">{currentStaff.reportingManager || "—"}</p></div>
                </div>
              </div>

            </div>
          )}

          {/* T2. ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="space-y-6">
              
              {/* Mark attendance section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Visual statistics */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Monthly Calendar Summary</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                      <span className="text-[10px] text-emerald-600 font-semibold uppercase block">Present</span>
                      <p className="text-xl font-bold text-emerald-900 mt-1">{attendance.summary.presentDays}</p>
                    </div>
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-center">
                      <span className="text-[10px] text-rose-600 font-semibold uppercase block">Absent</span>
                      <p className="text-xl font-bold text-rose-900 mt-1">{attendance.summary.absentDays}</p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center">
                      <span className="text-[10px] text-amber-600 font-semibold uppercase block">Late</span>
                      <p className="text-xl font-bold text-amber-900 mt-1">{attendance.summary.lateEntries}</p>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center">
                      <span className="text-[10px] text-blue-600 font-semibold uppercase block">Half Day</span>
                      <p className="text-xl font-bold text-blue-900 mt-1">{attendance.summary.halfDays}</p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase block">Rate (%)</span>
                      <p className="text-xl font-bold text-slate-900 mt-1">{attendance.summary.attendancePercent}%</p>
                    </div>
                  </div>

                  {/* Calendar monthly selector */}
                  <div className="flex items-center gap-2 mt-4 print:hidden">
                    <select
                      value={attendanceMonth}
                      onChange={(e) => setAttendanceMonth(Number(e.target.value))}
                      className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                        <option key={m} value={m}>
                          {new Date(0, m - 1).toLocaleString("default", { month: "long" })}
                        </option>
                      ))}
                    </select>

                    <select
                      value={attendanceYear}
                      onChange={(e) => setAttendanceYear(Number(e.target.value))}
                      className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none"
                    >
                      {[2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  {/* Grid view */}
                  <div className="mt-4 grid grid-cols-7 gap-2 max-w-md">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                      <div key={dayName} className="text-center text-[10px] font-bold text-slate-400 uppercase">
                        {dayName}
                      </div>
                    ))}
                    {calendarDays.map((item) => (
                      <div
                        key={item.day}
                        className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs border ${
                          item.status === "Present"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : item.status === "Absent"
                            ? "bg-rose-50 border-rose-200 text-rose-700"
                            : item.status === "Late"
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : item.status === "Half Day"
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : "bg-indigo-50 border-indigo-200 text-indigo-700"
                        }`}
                        title={item.status}
                      >
                        {item.day}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form to mark individual attendance */}
                <div className="border-l border-slate-100 pl-0 md:pl-6 print:hidden">
                  <h3 className="text-sm font-bold text-slate-900 border-b pb-2 mb-4">Mark Attendance</h3>
                  <form onSubmit={handleMarkAttendance} className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Date</label>
                      <input
                        type="date"
                        value={markDate}
                        onChange={(e) => setMarkDate(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Mark Status</label>
                      <select
                        value={markStatus}
                        onChange={(e) => setMarkStatus(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700"
                      >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Late">Late</option>
                        <option value="Half Day">Half Day</option>
                        <option value="Holiday">Holiday</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Remarks</label>
                      <input
                        type="text"
                        value={markRemarks}
                        onChange={(e) => setMarkRemarks(e.target.value)}
                        placeholder="Remarks..."
                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full h-10 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : "Save Mark Log"}
                    </button>
                  </form>
                </div>

              </div>

            </div>
          )}

          {/* T3. LEAVES */}
          {activeTab === "leaves" && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Leaves listing log */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Leave Request Logs</h3>
                  {leaves.length === 0 ? (
                    <p className="text-xs text-slate-400">No leave requests submitted for this employee.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b text-slate-500 text-xs font-bold">
                            <th className="p-3">Leave Type</th>
                            <th className="p-3">Start Date</th>
                            <th className="p-3">End Date</th>
                            <th className="p-3">Reason</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Approval</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-xs">
                          {leaves.map((lv) => {
                            const statusStyles = {
                              Pending: "bg-amber-50 text-amber-700 border-amber-100",
                              Approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
                              Rejected: "bg-red-50 text-red-700 border-red-100",
                              Cancelled: "bg-slate-50 text-slate-500 border-slate-100",
                            };

                            return (
                              <tr key={lv._id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-800">{lv.leaveType}</td>
                                <td className="p-3">{new Date(lv.startDate).toLocaleDateString()}</td>
                                <td className="p-3">{new Date(lv.endDate).toLocaleDateString()}</td>
                                <td className="p-3 truncate max-w-xs">{lv.reason}</td>
                                <td className="p-3">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusStyles[lv.status]}`}>
                                    {lv.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right whitespace-nowrap">
                                  {lv.status === "Pending" && (user?.role === "Admin" || user?.role === "Principal") ? (
                                    <div className="flex justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setLeaveActionId(lv._id)}
                                        className="px-2.5 py-1 rounded bg-slate-900 text-white text-[10px] font-bold hover:bg-slate-800"
                                      >
                                        Process Request
                                      </button>
                                    </div>
                                  ) : lv.status === "Approved" || lv.status === "Rejected" ? (
                                    <div className="text-[10px] text-slate-400 font-medium">
                                      {lv.approvedBy?.fullName || "Admin"}
                                    </div>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Submit new request */}
                <div className="border-l border-slate-100 pl-0 md:pl-6">
                  <h3 className="text-sm font-bold text-slate-900 border-b pb-2 mb-4">Request Leave</h3>
                  <form onSubmit={handleApplyLeave} className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Leave Category</label>
                      <select
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700"
                      >
                        <option value="Casual Leave">Casual Leave</option>
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Earned Leave">Earned Leave</option>
                        <option value="Maternity Leave">Maternity Leave</option>
                        <option value="Paternity Leave">Paternity Leave</option>
                        <option value="LWP (Leave Without Pay)">LWP (Leave Without Pay)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Start Date</label>
                      <input
                        type="date"
                        value={leaveStart}
                        onChange={(e) => setLeaveStart(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">End Date</label>
                      <input
                        type="date"
                        value={leaveEnd}
                        onChange={(e) => setLeaveEnd(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Reason for Leave</label>
                      <textarea
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        placeholder="State reason..."
                        rows={3}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700 resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full h-10 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 flex items-center justify-center gap-1.5 shadow"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : "Apply Request"}
                    </button>
                  </form>
                </div>

              </div>

              {/* Leave approval processing modal overlay */}
              {leaveActionId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                  <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Process Leave Request</h3>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Remarks / Note</label>
                      <input
                        type="text"
                        value={leaveActionRemarks}
                        onChange={(e) => setLeaveActionRemarks(e.target.value)}
                        placeholder="Add remarks (optional)..."
                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLeaveActionId(null);
                          setLeaveActionRemarks("");
                        }}
                        className="px-3 py-1.5 text-xs border rounded-lg hover:bg-slate-50 cursor-pointer font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProcessLeave(leaveActionId, "Rejected")}
                        className="px-3 py-1.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer font-semibold"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProcessLeave(leaveActionId, "Approved")}
                        className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer font-semibold"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* T4. PAYROLL */}
          {activeTab === "payroll" && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Payslips history table list */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Payslips History</h3>
                  {payrollList.length === 0 ? (
                    <p className="text-xs text-slate-400">No payslips have been generated yet for this employee.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b text-slate-500 text-xs font-bold">
                            <th className="p-3">Period</th>
                            <th className="p-3 text-right">Basic Pay</th>
                            <th className="p-3 text-right">Deductions</th>
                            <th className="p-3 text-right">Taxes/PF/ESI</th>
                            <th className="p-3 text-right">Net Salary</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-xs">
                          {payrollList.map((pay) => {
                            const monthName = new Date(0, pay.month - 1).toLocaleString("default", { month: "short" });
                            const deductionsCombined = pay.pf + pay.esi + pay.tax;

                            return (
                              <tr key={pay._id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-800">{monthName} {pay.year}</td>
                                <td className="p-3 text-right">₹{pay.basicPay}</td>
                                <td className="p-3 text-right text-rose-600">₹{pay.deductions}</td>
                                <td className="p-3 text-right text-rose-500">₹{deductionsCombined}</td>
                                <td className="p-3 text-right font-bold text-emerald-700">₹{pay.netSalary}</td>
                                <td className="p-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handlePrintPayslip(pay)}
                                    className="inline-flex h-7 items-center justify-center gap-1 px-3 border border-slate-200 bg-white rounded text-[10px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                                  >
                                    <Download size={10} />
                                    Payslip PDF
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Generate monthly payroll input structure */}
                <div className="border-l border-slate-100 pl-0 md:pl-6">
                  <h3 className="text-sm font-bold text-slate-900 border-b pb-2 mb-4">Generate Payslip</h3>
                  <form onSubmit={handleGeneratePayroll} className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Month</label>
                        <select
                          value={payrollMonth}
                          onChange={(e) => setPayrollMonth(Number(e.target.value))}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700"
                        >
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                            <option key={m} value={m}>{new Date(0, m - 1).toLocaleString("default", { month: "short" })}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Year</label>
                        <select
                          value={payrollYear}
                          onChange={(e) => setPayrollYear(Number(e.target.value))}
                          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700"
                        >
                          {[2025, 2026, 2027].map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-[10px] text-slate-500 space-y-1.5">
                      <p className="font-semibold text-slate-700">Automatic HRMS Formulas Applied:</p>
                      <p>• Basic Salary: ₹{currentStaff.salary}</p>
                      <p>• Provident Fund (PF): 12% basic</p>
                      <p>• ESI Medical Levy: 1.75% basic</p>
                      <p>• Professional Tax: 10% basic</p>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Custom Allowances (₹)</label>
                      <input
                        type="number"
                        value={payrollAllowances}
                        onChange={(e) => setPayrollAllowances(Number(e.target.value))}
                        placeholder="Allowances in INR"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Custom Deductions (₹)</label>
                      <input
                        type="number"
                        value={payrollDeductions}
                        onChange={(e) => setPayrollDeductions(Number(e.target.value))}
                        placeholder="Deductions in INR"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full h-10 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : "Generate & Pay Salary"}
                    </button>
                  </form>
                </div>

              </div>

            </div>
          )}

          {/* T5. DOCUMENTS */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Documents list */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Uploaded Document Dossier</h3>
                  {documents.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium">No verified files registered yet. Upload KYC to clear HR checklocks.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {documents.map((doc) => {
                        const fileUrl = doc.fileUrl.startsWith("http") ? doc.fileUrl : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${doc.fileUrl}`;
                        return (
                          <div key={doc._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between space-y-3">
                            <div>
                              <p className="text-xs font-bold text-slate-900">{doc.docType}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 truncate font-medium">{doc.fileName}</p>
                            </div>
                            <div className="flex gap-1.5 items-center justify-end">
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="h-7 px-2.5 rounded border border-slate-200 bg-white text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition inline-flex items-center"
                              >
                                View File
                              </a>
                              <button
                                type="button"
                                onClick={() => setReplaceDocId(doc._id)}
                                className="h-7 px-2.5 rounded border border-slate-200 bg-white text-[10px] font-bold text-blue-600 hover:bg-slate-50 transition"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDoc(doc._id)}
                                className="h-7 w-7 rounded border border-slate-200 bg-white text-rose-600 hover:bg-slate-50 transition flex items-center justify-center"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Upload KYC Document form */}
                <div className="border-l border-slate-100 pl-0 md:pl-6">
                  <h3 className="text-sm font-bold text-slate-900 border-b pb-2 mb-4">Upload KYC Document</h3>
                  <form onSubmit={handleUploadDoc} className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Document Type</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700"
                      >
                        <option value="Aadhaar Card">Aadhaar Card</option>
                        <option value="PAN Card">PAN Card</option>
                        <option value="Degree Certificate">Degree Certificate</option>
                        <option value="Experience Letter">Experience Letter</option>
                        <option value="Employment Agreement">Employment Agreement</option>
                        <option value="Background verification">Background verification</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Upload File</label>
                      <div className="relative h-20 w-full rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center group cursor-pointer hover:border-slate-300">
                        {docFile ? (
                          <span className="text-[10px] text-slate-600 font-bold max-w-xs truncate px-3">{docFile.name}</span>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 text-[10px]">
                            <Upload size={14} className="mb-1" />
                            <span>Click or Drag File</span>
                          </div>
                        )}
                        <input
                          type="file"
                          onChange={(e) => setDocFile(e.target.files[0])}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <p className="mt-1.5 text-[9px] text-slate-400 font-medium leading-normal">
                        Supported: PDF, JPG, PNG, DOCX up to 10MB
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full h-10 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition flex items-center justify-center gap-1.5 shadow"
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : "Upload Document"}
                    </button>
                  </form>
                </div>

              </div>

              {/* Replace file modal overlay */}
              {replaceDocId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                  <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Replace Document File</h3>
                    
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Select New File</label>
                      <input
                        type="file"
                        onChange={(e) => handleReplaceDoc(replaceDocId, e.target.files[0])}
                        className="w-full text-xs font-semibold text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setReplaceDocId(null)}
                        className="px-4 py-2 text-xs border rounded-lg hover:bg-slate-50 cursor-pointer font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* T6. TIMELINE / ACTIVITY LOGS */}
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
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                      <p className="font-bold text-slate-800 mt-0.5">{log.action}</p>
                      <p className="text-slate-600 mt-1 leading-5">{log.details}</p>
                      {log.performedBy && (
                        <span className="text-[10px] text-slate-400 mt-1 block font-semibold">
                          Action performed by: {log.performedBy?.fullName} ({log.performedBy?.role})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {activityLogs.length === 0 && (
                  <p className="text-xs text-slate-400 border-l-0 pl-0 -ml-4">No audit logs recorded for this employee.</p>
                )}
              </div>
            </div>
          )}

        </section>

      </div>
    </DashboardLayout>
  );
};

export default StaffProfilePage;
