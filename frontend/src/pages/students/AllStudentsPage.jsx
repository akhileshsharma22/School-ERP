import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Eye,
  Edit3,
  Calendar,
  FileText,
  CreditCard,
  Send,
  Printer,
  Trash2,
  Plus,
  Loader2,
  Info,
  Users,
  CheckCircle,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { fetchStudents, removeStudent } from "../../redux/slices/studentSlice";
import { fetchAcademicYears } from "../../redux/slices/academicYearSlice";
import { fetchAllClasses } from "../../redux/slices/classSectionSlice";
import { fetchStreams } from "../../redux/slices/streamSlice";
import { fetchAllCategories } from "../../redux/slices/categorySlice";
import * as studentService from "../../services/studentService";
import StudentIdCard from "../../components/students/StudentIdCard";

const StatCard = ({ label, value, helper, colorClass, icon: Icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      {helper && <p className="mt-1 text-xs text-slate-400 font-medium">{helper}</p>}
    </div>
    <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${colorClass}`}>
      <Icon size={20} />
    </div>
  </div>
);

const AllStudentsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { students, metrics, loading } = useSelector((state) => state.students);
  const { academicYears } = useSelector((state) => state.academicYear);
  const { classes } = useSelector((state) => state.classSections);
  const { streams } = useSelector((state) => state.streams);
  const { categories } = useSelector((state) => state.categories);

  // Search & filter states
  const [search, setSearch] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [className, setClassName] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [stream, setStream] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [status, setStatus] = useState("Active");

  // Selection states for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  const [transferRecord, setTransferRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [printIdCardRecord, setPrintIdCardRecord] = useState(null);
  const [bulkPrintCards, setBulkPrintCards] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  // Transfer form state
  const [transferForm, setTransferForm] = useState({
    transferType: "Internal Transfer (Section Change)",
    toClass: "",
    toSection: "",
    reason: "",
    remarks: "",
    transferDate: new Date().toISOString().split("T")[0],
  });

  // Edit student form state
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    fatherName: "",
    fatherMobile: "",
    motherName: "",
    currentAddress: "",
    aadhaarNumber: "",
  });

  function loadStudents() {
    const params = { status };
    if (academicYearId) params.academicYearId = academicYearId;
    if (className) params.className = className;
    if (sectionName) params.sectionName = sectionName;
    if (stream) params.stream = stream;
    if (category) params.category = category;
    if (gender) params.gender = gender;
    if (search) params.search = search;

    dispatch(fetchStudents(params));
    setSelectedIds([]); // Reset selection
  }

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchAllClasses());
    dispatch(fetchStreams());
    dispatch(fetchAllCategories());
    loadStudents();
  }, [dispatch]);

  const handleResetFilters = () => {
    setSearch("");
    setAcademicYearId("");
    setClassName("");
    setSectionName("");
    setStream("");
    setCategory("");
    setGender("");
    setStatus("Active");
    setTimeout(() => loadStudents(), 50);
  };

  // Section dropdown filter
  const sectionsList = useMemo(() => {
    const matchedClass = classes.find((c) => c.className === className);
    return matchedClass ? matchedClass.sections : [];
  }, [classes, className]);

  // Checkbox handlers
  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(students.map((s) => s._id));
    } else {
      setSelectedIds([]);
    }
  };

  // row actions
  const openTransferModal = (student) => {
    setTransferRecord(student);
    setTransferForm({
      transferType: "Internal Transfer (Section Change)",
      toClass: student.className,
      toSection: "",
      reason: "",
      remarks: "",
      transferDate: new Date().toISOString().split("T")[0],
    });
  };

  const submitTransfer = async (e) => {
    e.preventDefault();
    if (transferForm.transferType !== "School Leaving Transfer" && !transferForm.toSection) {
      toast.error("Please specify a target class section.");
      return;
    }
    if (!transferForm.reason) {
      toast.error("Please provide a reason for the transfer.");
      return;
    }

    try {
      const response = await studentService.transferStudent(transferRecord._id, transferForm);
      if (response.success) {
        toast.success("Transfer processed successfully.");
        setTransferRecord(null);
        loadStudents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Transfer processing failed.");
    }
  };

  const openDeleteModal = (student) => {
    setDeleteRecord(student);
  };

  const confirmDelete = async () => {
    const result = await dispatch(removeStudent(deleteRecord._id));
    if (removeStudent.fulfilled.match(result)) {
      toast.success("Student profile permanently deleted.");
      setDeleteRecord(null);
      loadStudents();
    } else {
      toast.error(result.payload || "Delete failed due to active dependencies.");
    }
  };

  const openEditModal = (student) => {
    setEditRecord(student);
    setEditForm({
      firstName: student.firstName,
      lastName: student.lastName,
      fatherName: student.fatherName,
      fatherMobile: student.fatherMobile,
      motherName: student.motherName,
      currentAddress: student.currentAddress,
      aadhaarNumber: student.aadhaarNumber || "",
    });
  };

  const submitEditProfile = async (e) => {
    e.preventDefault();
    if (!editForm.firstName || !editForm.lastName || !editForm.fatherName || !editForm.fatherMobile) {
      toast.error("Please fill in required fields.");
      return;
    }

    try {
      const response = await studentService.updateStudentProfile(editRecord._id, editForm);
      if (response.success) {
        toast.success("Profile fields saved successfully.");
        setEditRecord(null);
        loadStudents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Profile update failed.");
    }
  };

  // Bulk Exports
  const handleBulkExportCSV = () => {
    const exportQueue = selectedIds.length > 0
      ? students.filter((s) => selectedIds.includes(s._id))
      : students;

    if (exportQueue.length === 0) {
      toast.info("No data to export");
      return;
    }

    const rows = exportQueue.map((s) => ({
      "Student ID": s.studentId,
      "Admission No": s.admissionNo,
      Name: `${s.firstName} ${s.lastName}`,
      Class: s.className,
      Section: s.sectionName,
      Stream: s.stream,
      Father: s.fatherName,
      Mobile: s.fatherMobile,
      Status: s.status,
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
    link.download = `Students_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkExportPDF = () => {
    toast.success("Renders printer layout... Press Ctrl+P to save as PDF.");
    window.print();
  };

  const bulkSelectedStudents = useMemo(() => {
    return students.filter((s) => selectedIds.includes(s._id));
  }, [students, selectedIds]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10 print:p-0">
        
        {/* Header */}
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between print:hidden">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Students
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              All Students
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage student records, enrollment and profiles
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admissions/new")}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-300 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md cursor-pointer"
          >
            <Plus size={18} />
            + New Admission
          </button>
        </header>

        {/* Dashboard statistics cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
          <StatCard
            label="Total Students"
            value={metrics.totalStudents || 0}
            helper="All active sessions"
            colorClass="bg-blue-50 text-blue-600"
            icon={Users}
          />
          <StatCard
            label="Active Students"
            value={metrics.activeStudents || 0}
            helper={`${metrics.boysCount || 0} Boys | ${metrics.girlsCount || 0} Girls`}
            colorClass="bg-emerald-50 text-emerald-600"
            icon={CheckCircle}
          />
          <StatCard
            label="Attendance Ratio"
            value={`${metrics.avgAttendance || 85}%`}
            helper="Average term attendance"
            colorClass="bg-indigo-50 text-indigo-600"
            icon={Calendar}
          />
          <StatCard
            label="Unpaid Invoices"
            value={metrics.feePendingCount || 0}
            helper="Students with pending fees"
            colorClass="bg-amber-50 text-amber-600"
            icon={FileText}
          />
        </section>

        {/* Advanced Filters Panel */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 space-y-4 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, mobile, Aadhaar, ID..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>

            {/* Academic Year */}
            <select
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="">Select Academic Year</option>
              {academicYears.map((y) => (
                <option key={y._id} value={y._id}>
                  {y.name} {y.isCurrent ? "(Current)" : ""}
                </option>
              ))}
            </select>

            {/* Class */}
            <select
              value={className}
              onChange={(e) => {
                setClassName(e.target.value);
                setSectionName("");
              }}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls.className}>
                  {cls.className}
                </option>
              ))}
            </select>

            {/* Section */}
            <select
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              disabled={!className}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 disabled:opacity-60"
            >
              <option value="">Select Section</option>
              {sectionsList.map((sec) => (
                <option key={sec._id} value={sec.sectionName}>
                  {sec.sectionName}
                </option>
              ))}
            </select>

            {/* Stream */}
            <select
              value={stream}
              onChange={(e) => setStream(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="">Select Stream</option>
              {streams.map((st) => (
                <option key={st._id} value={st.streamName}>
                  {st.streamName}
                </option>
              ))}
            </select>

            {/* Category */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Transferred">Transferred</option>
              <option value="Passed Out">Passed Out</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <button
              onClick={handleResetFilters}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              onClick={loadStudents}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-5 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
            >
              Load Students
            </button>
          </div>
        </section>

        {/* Bulk operations bar */}
        {selectedIds.length > 0 && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Info size={16} /> {selectedIds.length} students selected
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBulkPrintCards(true)}
                className="inline-flex h-8 items-center gap-1 rounded bg-white border border-blue-200 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100 cursor-pointer"
              >
                <CreditCard size={12} /> Bulk ID Print
              </button>
              <button
                type="button"
                onClick={handleBulkExportCSV}
                className="inline-flex h-8 items-center gap-1 rounded bg-white border border-blue-200 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100 cursor-pointer"
              >
                <FileSpreadsheet size={12} /> Bulk Export CSV
              </button>
              <button
                type="button"
                onClick={handleBulkExportPDF}
                className="inline-flex h-8 items-center gap-1 rounded bg-white border border-blue-200 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100 cursor-pointer"
              >
                <Printer size={12} /> Bulk Print PDF
              </button>
            </div>
          </div>
        )}

        {/* Table Listing */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-sm font-medium text-slate-500">
              <Loader2 className="animate-spin mr-2" size={18} />
              Loading student directory...
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-bold text-slate-900">No students registered</h3>
              <p className="text-xs text-slate-500 mt-1">
                Records are created automatically once Admissions are verified and approved.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-4 py-3.5 print:hidden">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === students.length}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-blue-600"
                      />
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Photo
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Student ID / Admission No
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Name
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Class & Sec
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Father Name
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Mobile Number
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 print:hidden">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => (
                    <tr key={s._id} className="transition hover:bg-slate-50/50">
                      <td className="px-4 py-3.5 print:hidden">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(s._id)}
                          onChange={() => handleSelectRow(s._id)}
                          className="rounded border-slate-300 text-blue-600"
                        />
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 border flex items-center justify-center overflow-hidden">
                          {s.photoUrl ? (
                            <img
                              src={`http://localhost:5000${s.photoUrl}`}
                              alt={s.firstName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-500 uppercase">
                              {s.firstName[0]}
                              {s.lastName[0]}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{s.studentId}</p>
                          <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                            Adm: {s.admissionNo}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-sm font-bold text-slate-950">
                        {s.firstName} {s.lastName}
                      </td>

                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {s.className} - {s.sectionName}
                          </p>
                          {s.stream && (
                            <span className="inline-flex rounded bg-blue-50 px-1 py-0.5 text-[9px] font-bold text-blue-700 mt-0.5">
                              {s.stream}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">
                        {s.fatherName}
                      </td>

                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">
                        {s.fatherMobile}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            s.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : s.status === "Transferred"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : s.status === "Failed"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 print:hidden">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/students/profile/${s._id}`)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-slate-600 hover:text-blue-600 cursor-pointer"
                            title="View Profile"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEditModal(s)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-slate-600 hover:text-amber-600 cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setPrintIdCardRecord(s);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-slate-600 hover:text-violet-600 cursor-pointer"
                            title="Generate ID Card"
                          >
                            <CreditCard size={14} />
                          </button>
                          <button
                            onClick={() => openTransferModal(s)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-slate-600 hover:text-amber-700 cursor-pointer"
                            title="Transfer"
                          >
                            <Send size={14} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(s)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                            title="Delete Permanently"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* TRANSFER MODAL */}
      {transferRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-1.5">
              <Send size={18} className="text-blue-600" /> Student Transfer Workflow
            </h2>
            <form onSubmit={submitTransfer} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600">Transfer Type</label>
                <select
                  value={transferForm.transferType}
                  onChange={(e) =>
                    setTransferForm((prev) => ({
                      ...prev,
                      transferType: e.target.value,
                      toClass: e.target.value === "School Leaving Transfer" ? "" : prev.toClass,
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                >
                  <option value="Internal Transfer (Section Change)">Internal Transfer (Section Change)</option>
                  <option value="Internal Transfer (Class Change)">Internal Transfer (Class Change)</option>
                  <option value="School Leaving Transfer">School Leaving (Issue Transfer Certificate)</option>
                </select>
              </div>

              {transferForm.transferType !== "School Leaving Transfer" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Target Class</label>
                    <select
                      value={transferForm.toClass}
                      onChange={(e) => setTransferForm((prev) => ({ ...prev, toClass: e.target.value }))}
                      disabled={transferForm.transferType === "Internal Transfer (Section Change)"}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none disabled:bg-slate-50"
                    >
                      {classes.map((c) => (
                        <option key={c._id} value={c.className}>
                          {c.className}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Target Section *</label>
                    <select
                      value={transferForm.toSection}
                      onChange={(e) => setTransferForm((prev) => ({ ...prev, toSection: e.target.value }))}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                    >
                      <option value="">Select Section</option>
                      {classes
                        .find((c) => c.className === transferForm.toClass)
                        ?.sections.map((s) => (
                          <option key={s._id} value={s.sectionName}>
                            {s.sectionName}
                          </option>
                        )) || []}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600">Reason for Transfer *</label>
                <input
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm((prev) => ({ ...prev, reason: e.target.value }))}
                  required
                  placeholder="e.g. Relocation, Promotion Adjustments"
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">Remarks</label>
                <textarea
                  value={transferForm.remarks}
                  onChange={(e) => setTransferForm((prev) => ({ ...prev, remarks: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setTransferRecord(null)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Process Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-1.5">
              <Edit3 size={18} className="text-blue-600" /> Edit Student Profile
            </h2>
            <form onSubmit={submitEditProfile} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600">First Name *</label>
                  <input
                    value={editForm.firstName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    required
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Last Name *</label>
                  <input
                    value={editForm.lastName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    required
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">Father Name *</label>
                <input
                  value={editForm.fatherName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, fatherName: e.target.value }))}
                  required
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">Father Mobile *</label>
                <input
                  value={editForm.fatherMobile}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, fatherMobile: e.target.value }))}
                  required
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">Aadhaar Number</label>
                <input
                  value={editForm.aadhaarNumber}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, aadhaarNumber: e.target.value }))}
                  placeholder="12 digit Aadhaar"
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">Contact Address *</label>
                <textarea
                  value={editForm.currentAddress}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, currentAddress: e.target.value }))}
                  required
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setEditRecord(null)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-5 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-1.5 text-rose-700">
              <Trash2 size={18} /> Confirm Permanent Delete
            </h2>
            <p className="text-xs text-slate-500 mt-3 leading-5">
              Are you sure you want to permanently delete student **{deleteRecord.firstName} {deleteRecord.lastName}**? This deletes their logins, activity logs, TCs, and attendance data. **This action cannot be undone.**
            </p>
            <div className="flex justify-end gap-2 border-t pt-4 mt-6">
              <button
                onClick={() => setDeleteRecord(null)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-rose-600 px-5 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE ID CARD RENDER MODAL */}
      {printIdCardRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 print:p-0">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl relative border flex flex-col items-center print:absolute print:inset-0 print:border-none print:shadow-none">
            <h3 className="text-sm font-bold text-slate-700 mb-4 print:hidden">ID Card Generator</h3>
            
            <StudentIdCard student={printIdCardRecord} />

            <div className="flex justify-end gap-2 border-t w-full pt-4 mt-6 print:hidden">
              <button
                onClick={() => setPrintIdCardRecord(null)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
              >
                <Printer size={12} /> Print Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK ID CARDS PRINT WORKSPACE */}
      {bulkPrintCards && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl print:shadow-none print:border-none">
            <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-2 flex justify-between items-center print:hidden">
              <span>Bulk ID Cards Print Workspace ({bulkSelectedStudents.length})</span>
              <button onClick={() => setBulkPrintCards(false)} className="text-slate-400">✕</button>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center max-h-[70vh] overflow-y-auto p-4 print:max-h-none print:grid-cols-2 print:gap-10">
              {bulkSelectedStudents.map((stud) => (
                <StudentIdCard key={stud._id} student={stud} />
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t pt-4 mt-6 print:hidden">
              <button
                onClick={() => setBulkPrintCards(false)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
              >
                <Printer size={14} /> Print All Cards
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default AllStudentsPage;
