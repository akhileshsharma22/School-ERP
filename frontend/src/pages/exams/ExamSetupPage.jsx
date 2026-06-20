import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus, Search, Loader2, ClipboardList,
  Calendar, CheckCircle, Clock, Edit3, Trash2,
  AlertTriangle, Users,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  checkExamSetup, fetchExams, createExam, updateExam,
  updateExamStatus, deleteExam,
} from "../../redux/slices/examSlice";
import { fetchAcademicYears } from "../../redux/slices/academicYearSlice";
import { fetchAllExamTypes } from "../../redux/slices/examTypeSlice";
import { fetchAllClasses } from "../../redux/slices/classSectionSlice";

const STATUS_COLORS = {
  Draft:     "bg-slate-100 text-slate-600 border-slate-200",
  Scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  Active:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  Completed: "bg-violet-50 text-violet-700 border-violet-200",
  Published: "bg-green-50 text-green-700 border-green-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_TRANSITIONS = {
  Draft:     ["Scheduled", "Cancelled"],
  Scheduled: ["Active", "Cancelled"],
  Active:    ["Completed", "Cancelled"],
  Completed: ["Published"],
  Published: [],
  Cancelled: ["Draft"],
};

const StatCard = ({ label, value, helper, icon: Icon, colorClass }) => (
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

const EMPTY_FORM = {
  examName: "", examType: "", academicYear: "",
  applicableClasses: [], startDate: "", endDate: "",
  resultDeclareDate: "", passingPercentage: 33, instructions: "",
  status: "Draft",
};

const ExamSetupPage = () => {
  const dispatch = useDispatch();
  const { exams, examsLoading, examsSaving, setupMissing, setupLoading } =
    useSelector((s) => s.exams);
  const { academicYears } = useSelector((s) => s.academicYear);
  const { examTypes } = useSelector((s) => s.examTypes);
  const { classes } = useSelector((s) => s.classSections);
  const { user } = useSelector((s) => s.auth);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterAY, setFilterAY] = useState("");
  const [filterET, setFilterET] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "create", data: null });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(checkExamSetup());
    dispatch(fetchExams());
    dispatch(fetchAcademicYears());
    dispatch(fetchAllExamTypes());
    dispatch(fetchAllClasses());
  }, [dispatch]);

  const filtered = useMemo(() => {
    let list = [...exams];
    if (search) list = list.filter((e) => e.examName.toLowerCase().includes(search.toLowerCase()));
    if (filterStatus !== "All") list = list.filter((e) => e.status === filterStatus);
    if (filterAY) list = list.filter((e) => (e.academicYear?._id || e.academicYear) === filterAY);
    if (filterET) list = list.filter((e) => (e.examType?._id || e.examType) === filterET);
    return list;
  }, [exams, search, filterStatus, filterAY, filterET]);

  const stats = useMemo(() => ({
    total: exams.length,
    active: exams.filter((e) => e.status === "Active").length,
    scheduled: exams.filter((e) => e.status === "Scheduled").length,
    completed: exams.filter((e) => e.status === "Completed").length,
  }), [exams]);

  const requiredMissing = useMemo(() => {
    return setupMissing.filter((m) =>
      ["academicYear", "classes", "subjects", "examTypes"].includes(m.key)
    );
  }, [setupMissing]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setFormErrors({});
    setModal({ open: true, mode: "create", data: null });
  };

  const handleCreateExamClick = () => {
    const hasPermission = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
    if (!hasPermission) {
      toast.error("You do not have permission to create examinations.");
      return;
    }

    if (requiredMissing.length > 0) {
      const first = requiredMissing[0];
      let displayLabel = first.label;
      if (first.key === "examTypes") displayLabel = "Exam Types";
      else if (first.key === "classes") displayLabel = "Classes & Sections";
      toast.error(`Please configure ${displayLabel} before creating examinations.`);
      return;
    }

    openCreate();
  };

  const openEdit = (exam) => {
    setForm({
      examName: exam.examName || "",
      examType: exam.examType?._id || exam.examType || "",
      academicYear: exam.academicYear?._id || exam.academicYear || "",
      applicableClasses: exam.applicableClasses || [],
      startDate: exam.startDate ? exam.startDate.split("T")[0] : "",
      endDate: exam.endDate ? exam.endDate.split("T")[0] : "",
      resultDeclareDate: exam.resultDeclareDate ? exam.resultDeclareDate.split("T")[0] : "",
      passingPercentage: exam.passingPercentage ?? 33,
      instructions: exam.instructions || "",
      status: exam.status || "Draft",
    });
    setFormErrors({});
    setModal({ open: true, mode: "edit", data: exam });
  };

  const validate = () => {
    const errs = {};
    let hasMissingRequired = false;

    if (!form.examName?.trim()) {
      errs.examName = "Exam name is required";
      hasMissingRequired = true;
    }
    if (!form.examType) {
      errs.examType = "Exam type is required";
      hasMissingRequired = true;
    }
    if (!form.academicYear) {
      errs.academicYear = "Academic year is required";
      hasMissingRequired = true;
    }
    if (!form.startDate) {
      errs.startDate = "Start date is required";
      hasMissingRequired = true;
    }
    if (!form.endDate) {
      errs.endDate = "End date is required";
      hasMissingRequired = true;
    }
    if (!form.resultDeclareDate) {
      errs.resultDeclareDate = "Result declaration date is required";
      hasMissingRequired = true;
    }
    if (form.passingPercentage === undefined || form.passingPercentage === "" || form.passingPercentage === null) {
      errs.passingPercentage = "Passing percentage is required";
      hasMissingRequired = true;
    } else {
      const pct = Number(form.passingPercentage);
      if (isNaN(pct) || pct < 1 || pct > 100) {
        errs.passingPercentage = "Passing percentage must be between 1 and 100";
        hasMissingRequired = true;
      }
    }
    if (!form.applicableClasses || form.applicableClasses.length === 0) {
      errs.applicableClasses = "At least one class is required";
      hasMissingRequired = true;
    }

    let dateRangeError = false;
    if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) {
      errs.endDate = "End date must be after start date";
      dateRangeError = true;
    }
    if (form.endDate && form.resultDeclareDate && new Date(form.resultDeclareDate) < new Date(form.endDate)) {
      errs.resultDeclareDate = "Result declaration date cannot be before end date";
      dateRangeError = true;
    }

    setFormErrors(errs);

    if (hasMissingRequired) {
      toast.error("Please fill all required fields");
      return false;
    }
    if (dateRangeError) {
      toast.error("Invalid date range");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const payload = { ...form };
    let res;
    if (modal.mode === "create") {
      res = await dispatch(createExam(payload));
      if (createExam.fulfilled.match(res)) {
        toast.success("Examination created successfully.");
        setModal({ open: false, mode: "create", data: null });
        dispatch(fetchExams());
      } else {
        toast.error(res.payload || "Failed to create examination");
      }
    } else {
      res = await dispatch(updateExam({ id: modal.data._id, payload }));
      if (updateExam.fulfilled.match(res)) {
        toast.success("Exam updated successfully");
        setModal({ open: false, mode: "create", data: null });
        dispatch(fetchExams());
      } else {
        toast.error(res.payload || "Failed to update exam");
      }
    }
  };

  const handleStatusChange = async (exam, status) => {
    const res = await dispatch(updateExamStatus({ id: exam._id, status }));
    if (updateExamStatus.fulfilled.match(res)) {
      toast.success(`Status updated to ${status}`);
    } else {
      toast.error(res.payload || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await dispatch(deleteExam(deleteTarget._id));
    if (deleteExam.fulfilled.match(res)) {
      toast.success("Exam deleted successfully");
      setDeleteTarget(null);
    } else {
      toast.error(res.payload || "Failed to delete exam");
    }
  };

  const toggleClass = (cls) => {
    const already = form.applicableClasses.find((c) => c.classId === cls._id);
    if (already) {
      setForm((f) => ({ ...f, applicableClasses: f.applicableClasses.filter((c) => c.classId !== cls._id) }));
    } else {
      setForm((f) => ({
        ...f,
        applicableClasses: [...f.applicableClasses, { classId: cls._id, className: cls.className, sections: [] }],
      }));
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        {/* Header */}
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Examinations</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">Exam Setup</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create and manage examinations — Unit Tests, Half Yearly, Annual, Board Mocks.
            </p>
          </div>

          <div className="flex flex-col lg:items-end gap-3 shrink-0">
            {/* Dependency diagnostics */}
            {!setupLoading && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold select-none">
                {setupMissing.some(m => m.key === "academicYear") ? (
                  <span className="flex items-center gap-1 text-red-600">✗ Missing Academic Year</span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-600">✓ Academic Year Configured</span>
                )}

                {setupMissing.some(m => m.key === "classes") ? (
                  <span className="flex items-center gap-1 text-red-600">✗ Missing Classes & Sections</span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-600">✓ Classes Configured</span>
                )}

                {setupMissing.some(m => m.key === "subjects") ? (
                  <span className="flex items-center gap-1 text-red-600">✗ Missing Subjects</span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-600">✓ Subjects Configured</span>
                )}

                {setupMissing.some(m => m.key === "examTypes") ? (
                  <span className="flex items-center gap-1 text-red-600">✗ Missing Exam Types</span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-600">✓ Exam Types Configured</span>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateExamClick}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 cursor-pointer"
            >
              <Plus size={18} />
              Create Exam
            </button>
          </div>
        </header>

        {/* Dependency warning */}
        {!setupLoading && requiredMissing.length > 0 && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-slate-950">Missing Master Setup Configuration</h2>
                <div className="space-y-1">
                  {requiredMissing.map((m) => (
                    <p key={m.key} className="text-sm text-slate-700">
                      Please configure <span className="font-semibold text-amber-900">{m.label}</span> before creating examinations. — <a href={m.path} className="underline hover:text-amber-955 font-semibold">Set up now →</a>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Exams" value={stats.total} helper="All academic years" icon={ClipboardList} colorClass="bg-slate-100 text-slate-600" />
          <StatCard label="Active Exams" value={stats.active} helper="Currently ongoing" icon={Clock} colorClass="bg-emerald-100 text-emerald-600" />
          <StatCard label="Scheduled Exams" value={stats.scheduled} helper="Planned examinations" icon={Calendar} colorClass="bg-blue-100 text-blue-600" />
          <StatCard label="Completed Exams" value={stats.completed} helper="Awaiting results" icon={CheckCircle} colorClass="bg-violet-100 text-violet-600" />
        </section>

        {/* Table */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
          {/* Filters */}
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search exam name…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="All">All Statuses</option>
                {["Draft","Scheduled","Active","Completed","Published","Cancelled"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={filterAY} onChange={(e) => setFilterAY(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="">All Years</option>
                {academicYears.map((ay) => (
                  <option key={ay._id} value={ay._id}>{ay.name || ay.label || ay.year}</option>
                ))}
              </select>
              <select value={filterET} onChange={(e) => setFilterET(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="">All Types</option>
                {examTypes.map((et) => (
                  <option key={et._id} value={et._id}>{et.examName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table body */}
          {examsLoading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm font-medium text-slate-500">
              <Loader2 className="animate-spin" size={18} /> Loading exams…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardList className="mx-auto mb-4 text-slate-300" size={40} />
              <h3 className="text-lg font-semibold text-slate-950">No examinations created yet.</h3>
              <p className="mt-2 text-sm text-slate-500">Create your first exam to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    {["Exam Name","Type","Academic Year","Dates","Classes","Status","Actions"].map((h) => (
                      <th key={h} className={`px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((exam) => (
                    <tr key={exam._id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <ClipboardList size={16} />
                          </div>
                          <p className="text-sm font-semibold text-slate-950">{exam.examName}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                          {exam.examTypeName || exam.examType?.examName || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-600">
                        {exam.academicYearLabel || exam.academicYear?.label || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-600 space-y-0.5">
                          <p><span className="font-medium">Start:</span> {fmt(exam.startDate)}</p>
                          <p><span className="font-medium">End:</span> {fmt(exam.endDate)}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-600">
                        {exam.applicableClasses?.length > 0
                          ? <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                              <Users size={12} /> {exam.applicableClasses.length} class{exam.applicableClasses.length !== 1 ? "es" : ""}
                            </span>
                          : <span className="text-slate-400">All</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="relative group">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[exam.status]}`}>
                            {exam.status}
                          </span>
                          {STATUS_TRANSITIONS[exam.status]?.length > 0 && (
                            <div className="absolute top-full left-0 z-20 mt-1 hidden min-w-[140px] rounded-xl border border-slate-200 bg-white p-1 shadow-lg group-hover:block">
                              {STATUS_TRANSITIONS[exam.status].map((s) => (
                                <button key={s} onClick={() => handleStatusChange(exam, s)}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                  → {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(exam)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                            <Edit3 size={14} /> Edit
                          </button>
                          {["Draft","Cancelled"].includes(exam.status) && (
                            <button onClick={() => setDeleteTarget(exam)}
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100">
                              <Trash2 size={14} /> Delete
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

      {/* Create/Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-950">
                {modal.mode === "create" ? "Create New Exam" : "Edit Exam"}
              </h2>
              <button onClick={() => setModal({ open: false, mode: "create", data: null })}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">✕</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Exam Name *</label>
                  <input value={form.examName} onChange={(e) => setForm((f) => ({ ...f, examName: e.target.value }))}
                    placeholder="e.g. Half Yearly Exam 2024"
                    className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-4 focus:ring-slate-100 ${formErrors.examName ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-slate-400"}`} />
                  {formErrors.examName && <p className="mt-1 text-xs text-red-500">{formErrors.examName}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Exam Type *</label>
                  <select value={form.examType} onChange={(e) => setForm((f) => ({ ...f, examType: e.target.value }))}
                    className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-4 focus:ring-slate-100 cursor-pointer ${formErrors.examType ? "border-red-400" : "border-slate-200 focus:border-slate-400"}`}>
                    <option value="">Select Exam Type</option>
                    {examTypes.map((et) => <option key={et._id} value={et._id}>{et.examName}</option>)}
                  </select>
                  {formErrors.examType && <p className="mt-1 text-xs text-red-500">{formErrors.examType}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Academic Year *</label>
                  <select value={form.academicYear} onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))}
                    className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-4 focus:ring-slate-100 cursor-pointer ${formErrors.academicYear ? "border-red-400" : "border-slate-200 focus:border-slate-400"}`}>
                    <option value="">Select Academic Year</option>
                    {academicYears.map((ay) => <option key={ay._id} value={ay._id}>{ay.name || ay.label || ay.year}</option>)}
                  </select>
                  {formErrors.academicYear && <p className="mt-1 text-xs text-red-500">{formErrors.academicYear}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Start Date *</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-4 focus:ring-slate-100 ${formErrors.startDate ? "border-red-400" : "border-slate-200 focus:border-slate-400"}`} />
                  {formErrors.startDate && <p className="mt-1 text-xs text-red-500">{formErrors.startDate}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">End Date *</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                    className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-4 focus:ring-slate-100 ${formErrors.endDate ? "border-red-400" : "border-slate-200 focus:border-slate-400"}`} />
                  {formErrors.endDate && <p className="mt-1 text-xs text-red-500">{formErrors.endDate}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Result Declaration Date *</label>
                  <input type="date" value={form.resultDeclareDate} onChange={(e) => setForm((f) => ({ ...f, resultDeclareDate: e.target.value }))}
                    className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-4 focus:ring-slate-100 ${formErrors.resultDeclareDate ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-slate-400"}`} />
                  {formErrors.resultDeclareDate && <p className="mt-1 text-xs text-red-500">{formErrors.resultDeclareDate}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Passing Percentage (%) *</label>
                  <input type="number" value={form.passingPercentage} min={0} max={100}
                    onChange={(e) => setForm((f) => ({ ...f, passingPercentage: e.target.value }))}
                    className={`h-11 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-4 focus:ring-slate-100 ${formErrors.passingPercentage ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-slate-400"}`} />
                  {formErrors.passingPercentage && <p className="mt-1 text-xs text-red-500">{formErrors.passingPercentage}</p>}
                </div>
                {modal.mode === "edit" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Status</label>
                    <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                      <option value={modal.data.status}>{modal.data.status} (Current)</option>
                      {(STATUS_TRANSITIONS[modal.data.status] || []).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Applicable Classes *</label>
                  <div className={`flex flex-wrap gap-2 rounded-xl border bg-slate-50 p-3 ${formErrors.applicableClasses ? "border-red-400" : "border-slate-200"}`}>
                    {classes.map((cls) => {
                      const sel = !!form.applicableClasses.find((c) => c.classId === cls._id);
                      return (
                        <button key={cls._id} type="button" onClick={() => toggleClass(cls)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${sel ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                          {cls.className}
                        </button>
                      );
                    })}
                  </div>
                  {formErrors.applicableClasses ? (
                    <p className="mt-1 text-xs text-red-500">{formErrors.applicableClasses}</p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">Select at least one class for this examination.</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Instructions (optional)</label>
                  <textarea value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                    rows={3} placeholder="Any special instructions for this examination…"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 resize-none" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 p-6">
              <button onClick={() => setModal({ open: false, mode: "create", data: null })}
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={examsSaving}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                {examsSaving ? <Loader2 className="animate-spin" size={16} /> : null}
                {modal.mode === "create" ? "Create Exam" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 mb-4">
              <Trash2 size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-950">Delete Exam</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to permanently delete <span className="font-semibold">{deleteTarget.examName}</span>?
              This action cannot be undone and is only allowed if no schedules, marks, or results have been created.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700">
                Delete Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ExamSetupPage;
