import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Plus, Trash2, Loader2, AlertTriangle,
  Clock, LayoutGrid, List, Zap, Edit2, Eye, Copy, Printer
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  fetchExams, fetchSchedule, createScheduleEntry, bulkGenerateSchedule,
  updateScheduleEntry, deleteScheduleEntry,
} from "../../redux/slices/examSlice";
import { fetchAcademicYears } from "../../redux/slices/academicYearSlice";
import { fetchAllClasses } from "../../redux/slices/classSectionSlice";
import { fetchAllSubjects } from "../../redux/slices/subjectSlice";
import { fetchStaffList } from "../../redux/slices/staffSlice";
import { fetchAllExamTypes } from "../../redux/slices/examTypeSlice";

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  const hh = h.toString().padStart(2, "0");
  return `${hh}:${m}`;
});

const EMPTY_ENTRY = {
  academicYear: "", exam: "", examType: "", examTypeName: "", classId: "", className: "", section: "", subject: "", subjectName: "",
  examDate: "", startTime: "09:00", endTime: "12:00",
  room: "", invigilator: "", maxMarks: "", passingMarks: "", instructions: "", status: "Scheduled"
};

// Helper: safely extract an ID string from a value that may be an ObjectId, object, or string
const toIdStr = (val) => {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && val._id) return String(val._id);
  return String(val);
};

const getScheduleStatus = (dateStr, status) => {
  let finalStatus = status;
  if (!finalStatus) {
    if (!dateStr) {
      finalStatus = "Scheduled";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const examDate = new Date(dateStr);
      examDate.setHours(0, 0, 0, 0);
      if (examDate < today) finalStatus = "Completed";
      else if (examDate.getTime() === today.getTime()) finalStatus = "Ongoing";
      else finalStatus = "Scheduled";
    }
  }

  if (finalStatus === "Completed") {
    return { label: "Completed", class: "bg-emerald-50 border-emerald-200 text-emerald-700" };
  }
  if (finalStatus === "Ongoing") {
    return { label: "Ongoing", class: "bg-amber-50 border-amber-200 text-amber-700" };
  }
  return { label: "Scheduled", class: "bg-blue-50 border-blue-200 text-blue-700" };
};

const ExamSchedulePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { exams, schedule, scheduleLoading, scheduleSaving } = useSelector((s) => s.exams);
  const { academicYears } = useSelector((s) => s.academicYear);
  const { classes } = useSelector((s) => s.classSections);
  const { subjects } = useSelector((s) => s.subjects);
  const { staffList } = useSelector((s) => s.staff);
  const { examTypes } = useSelector((s) => s.examTypes);

  const [filterExam, setFilterExam] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [modal, setModal] = useState({ open: false, mode: "create", data: null });
  const [bulkModal, setBulkModal] = useState(false);
  const [viewDetail, setViewDetail] = useState(null);
  const [form, setForm] = useState(EMPTY_ENTRY);
  const [bulkForm, setBulkForm] = useState({ exam: "", classId: "", className: "", section: "", startTime: "09:00", endTime: "12:00", room: "", entries: [] });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    dispatch(fetchExams({ limit: 100 }));
    dispatch(fetchAcademicYears());
    dispatch(fetchAllClasses());
    dispatch(fetchAllSubjects());
    dispatch(fetchStaffList({ limit: 1000 }));
    dispatch(fetchAllExamTypes());
  }, [dispatch]);

  const refreshSchedules = () => {
    if (filterExam) {
      dispatch(fetchSchedule({
        examId: filterExam,
        ...(filterClass ? { classId: filterClass } : {}),
        ...(filterSection ? { section: filterSection } : {}),
      }));
    }
  };

  useEffect(() => {
    refreshSchedules();
  }, [filterExam, filterClass, filterSection, dispatch]);

  // ─── Cascading memos ────────────────────────────────────────────────────────

  // Filter bar: sections of the selected class (ClassSection model stores sections as objects)
  const selectedClassSections = useMemo(() => {
    const cls = classes.find((c) => c._id === filterClass);
    if (!cls || !cls.sections) return [];
    return cls.sections.map((s) => (typeof s === "string" ? s : s.sectionName)).filter(Boolean);
  }, [classes, filterClass]);

  // Form: exams matching the selected academic year
  // NOTE: getExams API populates academicYear as an object {_id, year, label}
  // so we must compare using the _id string
  const formFilteredExams = useMemo(() => {
    if (!form.academicYear) return exams; // show all if no year selected yet
    return exams.filter((e) => toIdStr(e.academicYear) === form.academicYear);
  }, [exams, form.academicYear]);

  // Form: classes applicable to the selected exam
  const formExamClasses = useMemo(() => {
    const examObj = exams.find((e) => e._id === form.exam);
    if (!examObj || !examObj.applicableClasses) return [];
    return classes.filter((c) =>
      examObj.applicableClasses.some((ac) => toIdStr(ac.classId) === c._id)
    );
  }, [exams, form.exam, classes]);

  // Form: sections for the selected class from the Exam's applicableClasses
  // sections in Exam model are [String] (section names, not objects)
  const formClassSections = useMemo(() => {
    const examObj = exams.find((e) => e._id === form.exam);
    const appClass = examObj?.applicableClasses?.find((ac) => toIdStr(ac.classId) === form.classId);
    return appClass?.sections || [];
  }, [exams, form.exam, form.classId]);

  // Form: subjects assigned to the selected class
  const formClassSubjects = useMemo(() => {
    if (!form.classId) return [];
    return subjects.filter((s) =>
      s.classAssignments?.some((a) => toIdStr(a.classId) === form.classId)
    );
  }, [subjects, form.classId]);

  // Form: teaching staff for invigilator selection
  const formAvailableTeachers = useMemo(() => {
    return staffList.filter((s) => s.staffType === "Teaching Staff");
  }, [staffList]);

  // Bulk: subjects for the selected class
  const bulkClassSubjects = useMemo(() => {
    if (!bulkForm.classId) return subjects;
    return subjects.filter((s) =>
      s.classAssignments?.some((a) => toIdStr(a.classId) === bulkForm.classId)
    );
  }, [subjects, bulkForm.classId]);

  // Bulk: sections for selected class (ClassSection model stores sections as objects)
  const bulkClassSections = useMemo(() => {
    const cls = classes.find((c) => c._id === bulkForm.classId);
    if (!cls || !cls.sections) return [];
    return cls.sections.map((s) => (typeof s === "string" ? s : s.sectionName)).filter(Boolean);
  }, [classes, bulkForm.classId]);

  // Missing dependencies check
  const missingDependencies = useMemo(() => {
    const list = [];
    if (!academicYears || academicYears.length === 0) list.push("Academic Year");
    if (!exams || exams.length === 0) list.push("Exam");
    if (!classes || classes.length === 0) list.push("Class");
    const hasSections = classes && classes.some((c) => c.sections && c.sections.length > 0);
    if (!hasSections) list.push("Section");
    if (!subjects || subjects.length === 0) list.push("Subject");
    return list;
  }, [academicYears, exams, classes, subjects]);

  const filteredSchedule = useMemo(() => {
    return schedule.filter((s) => {
      const term = searchTerm.toLowerCase();
      return (
        (s.subjectName || "").toLowerCase().includes(term) ||
        (s.room || "").toLowerCase().includes(term) ||
        (s.invigilator || "").toLowerCase().includes(term) ||
        (s.className || "").toLowerCase().includes(term) ||
        (s.section || "").toLowerCase().includes(term) ||
        (s.examName || "").toLowerCase().includes(term)
      );
    });
  }, [schedule, searchTerm]);

  const grouped = useMemo(() => {
    const map = {};
    filteredSchedule.forEach((s) => {
      const dateKey = s.examDate ? new Date(s.examDate).toDateString() : "Unknown";
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(s);
    });
    return Object.entries(map).sort(([a], [b]) => new Date(a) - new Date(b));
  }, [filteredSchedule]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleAcademicYearChange = (e) => {
    const val = e.target.value;
    setForm((f) => ({
      ...f,
      academicYear: val,
      exam: "",
      examType: "",
      examTypeName: "",
      classId: "",
      className: "",
      section: "",
      subject: "",
      subjectName: "",
      maxMarks: "",
      passingMarks: ""
    }));
  };

  const handleExamChange = (e) => {
    const val = e.target.value;
    const examObj = exams.find((ex) => ex._id === val);
    setForm((f) => ({
      ...f,
      exam: val,
      examType: toIdStr(examObj?.examType) || "",
      examTypeName: examObj?.examTypeName || "",
      classId: "",
      className: "",
      section: "",
      subject: "",
      subjectName: "",
      maxMarks: "",
      passingMarks: ""
    }));
  };

  const handleClassChange = (e) => {
    const val = e.target.value;
    const cls = classes.find((c) => c._id === val);
    setForm((f) => ({
      ...f,
      classId: val,
      className: cls?.className || "",
      section: "",
      subject: "",
      subjectName: "",
      maxMarks: "",
      passingMarks: ""
    }));
  };

  const handleSectionChange = (e) => {
    const sectionName = e.target.value;
    // Try to find default class teacher from ClassSection model
    const cls = classes.find((c) => c._id === form.classId);
    const secObj = cls?.sections?.find((s) => {
      const name = typeof s === "string" ? s : s.sectionName;
      return name === sectionName;
    });
    const defaultTeacher = typeof secObj === "object" ? (secObj?.classTeacher || "") : "";

    setForm((f) => ({
      ...f,
      section: sectionName,
      invigilator: defaultTeacher || f.invigilator,
      subject: "",
      subjectName: "",
      maxMarks: "",
      passingMarks: ""
    }));
  };

  const handleSubjectChange = (e) => {
    const subId = e.target.value;
    const sub = subjects.find((s) => s._id === subId);
    const assignment = sub?.classAssignments?.find((ca) => toIdStr(ca.classId) === form.classId);

    setForm((f) => ({
      ...f,
      subject: subId,
      subjectName: sub?.subjectName || "",
      maxMarks: assignment?.maxMarks !== undefined ? String(assignment.maxMarks) : "",
      passingMarks: assignment?.passingMarks !== undefined ? String(assignment.passingMarks) : "",
    }));
  };

  const handleEditClick = (entry) => {
    const examObj = exams.find((e) => e._id === toIdStr(entry.exam));
    setForm({
      academicYear: toIdStr(examObj?.academicYear) || toIdStr(entry.academicYear) || "",
      exam: toIdStr(entry.exam),
      examType: toIdStr(entry.examType) || "",
      examTypeName: entry.examTypeName || "",
      classId: toIdStr(entry.classId),
      className: entry.className,
      section: entry.section,
      subject: toIdStr(entry.subject) || "",
      subjectName: entry.subjectName,
      examDate: entry.examDate ? new Date(entry.examDate).toISOString().split("T")[0] : "",
      startTime: entry.startTime || "09:00",
      endTime: entry.endTime || "12:00",
      room: entry.room || "",
      invigilator: entry.invigilator || "",
      maxMarks: entry.maxMarks !== undefined ? String(entry.maxMarks) : "",
      passingMarks: entry.passingMarks !== undefined ? String(entry.passingMarks) : "",
      instructions: entry.instructions || "",
      status: entry.status || "Scheduled",
    });
    setModal({ open: true, mode: "edit", data: entry });
  };

  const handleDuplicateClick = (entry) => {
    const examObj = exams.find((e) => e._id === toIdStr(entry.exam));
    setForm({
      academicYear: toIdStr(examObj?.academicYear) || toIdStr(entry.academicYear) || "",
      exam: toIdStr(entry.exam),
      examType: toIdStr(entry.examType) || "",
      examTypeName: entry.examTypeName || "",
      classId: toIdStr(entry.classId),
      className: entry.className,
      section: entry.section,
      subject: toIdStr(entry.subject) || "",
      subjectName: entry.subjectName,
      examDate: entry.examDate ? new Date(entry.examDate).toISOString().split("T")[0] : "",
      startTime: entry.startTime || "09:00",
      endTime: entry.endTime || "12:00",
      room: entry.room || "",
      invigilator: entry.invigilator || "",
      maxMarks: entry.maxMarks !== undefined ? String(entry.maxMarks) : "",
      passingMarks: entry.passingMarks !== undefined ? String(entry.passingMarks) : "",
      instructions: entry.instructions || "",
      status: "Scheduled",
    });
    setModal({ open: true, mode: "create", data: null });
  };

  const handleSave = async () => {
    let targetAcademicYear = form.academicYear;
    if (!targetAcademicYear) {
      const currentAY = academicYears.find((ay) => ay.isCurrent);
      targetAcademicYear = currentAY?._id || academicYears[0]?._id || "";
    }

    if (!targetAcademicYear) {
      return toast.error("Academic Year is required");
    }
    if (!form.examType) {
      return toast.error("Please select an exam type.");
    }
    if (form.maxMarks === undefined || form.maxMarks === null || form.maxMarks === "") {
      return toast.error("Maximum Marks is required");
    }
    if (form.passingMarks === undefined || form.passingMarks === null || form.passingMarks === "") {
      return toast.error("Passing Marks is required");
    }

    if (!form.exam || !form.classId || !form.section || !form.subject || !form.examDate || !form.startTime || !form.endTime) {
      return toast.error("Please fill all required fields");
    }

    const marksMax = Number(form.maxMarks);
    const marksPass = Number(form.passingMarks);
    if (isNaN(marksMax) || isNaN(marksPass) || marksMax < 1 || marksPass < 0 || marksPass > marksMax) {
      return toast.error("Passing marks cannot exceed maximum marks.");
    }

    const startMin = TIME_OPTIONS.indexOf(form.startTime);
    const endMin = TIME_OPTIONS.indexOf(form.endTime);
    if (startMin >= endMin) {
      return toast.error("End time must be after start time");
    }

    const payload = {
      academicYear: targetAcademicYear,
      exam: form.exam,
      examType: form.examType,
      examTypeName: form.examTypeName,
      classId: form.classId,
      className: form.className,
      section: form.section,
      subject: form.subject,
      subjectName: form.subjectName,
      examDate: form.examDate,
      startTime: form.startTime,
      endTime: form.endTime,
      room: form.room,
      invigilator: form.invigilator,
      maxMarks: marksMax,
      passingMarks: marksPass,
      status: form.status,
      instructions: form.instructions,
    };

    if (modal.mode === "create") {
      const res = await dispatch(createScheduleEntry(payload));
      if (createScheduleEntry.fulfilled.match(res)) {
        toast.success("✓ Exam scheduled successfully");
        setModal({ open: false, mode: "create", data: null });
        setForm(EMPTY_ENTRY);
        refreshSchedules();
      } else {
        toast.error(res.payload || "Failed to save schedule");
      }
    } else {
      const res = await dispatch(updateScheduleEntry({ id: modal.data._id, payload }));
      if (updateScheduleEntry.fulfilled.match(res)) {
        toast.success("✓ Exam scheduled successfully");
        setModal({ open: false, mode: "create", data: null });
        setForm(EMPTY_ENTRY);
        refreshSchedules();
      } else {
        toast.error(res.payload || "Failed to save schedule");
      }
    }
  };

  const handleBulkGenerate = async () => {
    if (!bulkForm.exam || !bulkForm.classId || !bulkForm.section || !bulkForm.entries.length)
      return toast.error("Please fill all required fields and select subjects");

    const cls = classes.find((c) => c._id === bulkForm.classId);
    const res = await dispatch(bulkGenerateSchedule({
      ...bulkForm, className: cls?.className || "",
      entries: bulkForm.entries.map((e) => ({
        subjectId: e.subjectId, subjectName: e.subjectName, examDate: e.examDate,
      })),
    }));
    if (bulkGenerateSchedule.fulfilled.match(res)) {
      toast.success("Schedule generated successfully");
      setBulkModal(false);
      setBulkForm({ exam: "", classId: "", className: "", section: "", startTime: "09:00", endTime: "12:00", room: "", entries: [] });
      dispatch(fetchSchedule({ examId: filterExam }));
    } else {
      toast.error(res.payload || "Failed to generate schedule");
    }
  };

  const handleDelete = async () => {
    const res = await dispatch(deleteScheduleEntry(deleteTarget._id));
    if (deleteScheduleEntry.fulfilled.match(res)) {
      toast.success("Schedule deleted successfully");
      setDeleteTarget(null);
      refreshSchedules();
    } else {
      toast.error(res.payload || "Failed to delete schedule");
    }
  };

  const toggleBulkSubject = (sub) => {
    setBulkForm((f) => {
      const exists = f.entries.find((e) => e.subjectId === sub._id);
      if (exists) return { ...f, entries: f.entries.filter((e) => e.subjectId !== sub._id) };
      return { ...f, entries: [...f.entries, { subjectId: sub._id, subjectName: sub.subjectName, examDate: "" }] };
    });
  };

  const updateBulkDate = (subjectId, date) => {
    setBulkForm((f) => ({
      ...f,
      entries: f.entries.map((e) => e.subjectId === subjectId ? { ...e, examDate: date } : e),
    }));
  };

  const handlePrint = (entry) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Exam Schedule - ${entry.subjectName}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
            .label { font-weight: bold; color: #666; }
            .value { font-size: 16px; margin-top: 3px; }
            .instructions { margin-top: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #333; }
          </style>
        </head>
        <body>
          <div class="header"><div class="title">School ERP - Examination Schedule</div></div>
          <div class="details">
            <div><span class="label">Examination:</span><div class="value">${entry.examName}</div></div>
            <div><span class="label">Class & Section:</span><div class="value">${entry.className} - ${entry.section}</div></div>
            <div><span class="label">Subject:</span><div class="value">${entry.subjectName}</div></div>
            <div><span class="label">Date:</span><div class="value">${new Date(entry.examDate).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</div></div>
            <div><span class="label">Time:</span><div class="value">${entry.startTime} to ${entry.endTime}</div></div>
            <div><span class="label">Room:</span><div class="value">${entry.room || "—"}</div></div>
            <div><span class="label">Invigilator:</span><div class="value">${entry.invigilator || "—"}</div></div>
            <div><span class="label">Max Marks:</span><div class="value">${entry.maxMarks}</div></div>
            <div><span class="label">Passing Marks:</span><div class="value">${entry.passingMarks}</div></div>
            <div><span class="label">Status:</span><div class="value">${entry.status}</div></div>
          </div>
          ${entry.instructions ? `<div class="instructions"><strong>Instructions:</strong><br/>${entry.instructions}</div>` : ""}
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) : "—";

  const openAddModal = () => {
    const currentExamObj = exams.find((e) => e._id === filterExam);
    setForm({
      ...EMPTY_ENTRY,
      academicYear: toIdStr(currentExamObj?.academicYear) || toIdStr(academicYears[0]?._id) || "",
      exam: filterExam || exams[0]?._id || "",
      examType: toIdStr(currentExamObj?.examType) || "",
      examTypeName: currentExamObj?.examTypeName || ""
    });
    setModal({ open: true, mode: "create", data: null });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        {/* Header */}
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Examinations</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">Exam Schedule</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create and manage exam timetables with automatic conflict detection.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setBulkModal(true); setBulkForm({ exam: "", classId: "", className: "", section: "", startTime: "09:00", endTime: "12:00", room: "", entries: [] }); }}
              disabled={missingDependencies.length > 0}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <Zap size={18} className="text-amber-500" /> Bulk Generate
            </button>
            <button
              onClick={openAddModal}
              disabled={missingDependencies.length > 0}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <Plus size={18} /> Add Entry
            </button>
          </div>
        </header>

        {/* Missing Dependencies Warning */}
        {missingDependencies.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 animate-pulse">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-900">Missing Setup Dependencies</h3>
                <p className="mt-2 text-sm text-amber-700 leading-relaxed font-medium">
                  {missingDependencies.includes("Exam")
                    ? "Please create an Examination before scheduling papers."
                    : "Please configure all required master settings before creating exam schedules."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {missingDependencies.map((dep) => (
                    <span key={dep} className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-sm">
                      ✗ Missing {dep}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterExam}
              onChange={(e) => { setFilterExam(e.target.value); setFilterClass(""); setFilterSection(""); }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer"
            >
              <option value="">Select Exam *</option>
              {exams.map((e) => (
                <option key={e._id} value={e._id}>{e.examName}</option>
              ))}
            </select>

            <select
              value={filterClass}
              onChange={(e) => { setFilterClass(e.target.value); setFilterSection(""); }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.className}</option>
              ))}
            </select>

            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer"
            >
              <option value="">All Sections</option>
              {selectedClassSections.map((sName, idx) => (
                <option key={`${sName}-${idx}`} value={sName}>{sName}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search by subject, room, invigilator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-full max-w-xs rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 placeholder:text-slate-400"
            />

            <div className="ml-auto flex gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition cursor-pointer ${viewMode === "list" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition cursor-pointer ${viewMode === "grid" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Schedule content */}
        {!filterExam ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <Calendar className="mx-auto mb-4 text-slate-300" size={40} />
            <h3 className="text-lg font-semibold text-slate-950">Select an Exam</h3>
            <p className="mt-2 text-sm text-slate-500 font-medium">Choose an exam from the filter above to view or create schedule entries.</p>
          </div>
        ) : scheduleLoading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm font-medium text-slate-500">
            <Loader2 className="animate-spin" size={18} /> Loading schedule…
          </div>
        ) : schedule.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <Calendar className="mx-auto mb-4 text-slate-300" size={40} />
            <h3 className="text-lg font-semibold text-slate-950 font-bold">No Schedule Created</h3>
            <p className="mt-2 text-sm text-slate-500 font-medium">No examination schedules created yet.</p>
            <button
              onClick={openAddModal}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 cursor-pointer"
            >
              Create Schedule
            </button>
          </div>
        ) : viewMode === "list" ? (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 overflow-hidden">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[1000px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Exam</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Class</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Section</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Subject</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Date</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Start Time</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">End Time</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Room</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Invigilator</th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Status</th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSchedule.map((entry) => {
                    const statusBadge = getScheduleStatus(entry.examDate, entry.status);
                    return (
                      <tr key={entry._id} className="transition hover:bg-slate-50/80">
                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">{entry.examName}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">{entry.className}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{entry.section}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700">
                            {entry.subjectName}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">{fmt(entry.examDate)}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{entry.startTime}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{entry.endTime}</td>
                        <td className="px-5 py-4 text-sm text-slate-500">{entry.room || "—"}</td>
                        <td className="px-5 py-4 text-sm text-slate-500">{entry.invigilator || "—"}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadge.class}`}>
                            {entry.status || statusBadge.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setViewDetail(entry)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer" title="View Details">
                              <Eye size={14} className="text-slate-600" />
                            </button>
                            <button onClick={() => handleEditClick(entry)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer" title="Edit">
                              <Edit2 size={12} className="text-slate-600" />
                            </button>
                            <button onClick={() => handleDuplicateClick(entry)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer" title="Duplicate">
                              <Copy size={13} className="text-slate-600" />
                            </button>
                            <button onClick={() => handlePrint(entry)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer" title="Print">
                              <Printer size={13} className="text-slate-600" />
                            </button>
                            <button onClick={() => setDeleteTarget(entry)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 cursor-pointer" title="Delete">
                              <Trash2 size={14} className="text-rose-700" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <div className="space-y-4">
            {grouped.map(([date, entries]) => (
              <section key={date} className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
                    <Calendar size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-950">
                    {new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                  </h3>
                  <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {entries.length} exam{entries.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {entries.map((e) => {
                    const statusBadge = getScheduleStatus(e.examDate, e.status);
                    return (
                      <div key={e._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">{e.subjectName}</span>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusBadge.class}`}>
                                {e.status || statusBadge.label}
                              </span>
                              <button onClick={() => setViewDetail(e)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><Eye size={14} /></button>
                              <button onClick={() => handleEditClick(e)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><Edit2 size={14} /></button>
                              <button onClick={() => handleDuplicateClick(e)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><Copy size={13} /></button>
                              <button onClick={() => handlePrint(e)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><Printer size={13} /></button>
                              <button onClick={() => setDeleteTarget(e)} className="text-slate-400 hover:text-red-500 cursor-pointer"><Trash2 size={14} /></button>
                            </div>
                          </div>
                          <p className="mt-3 text-xs font-medium text-slate-600">{e.className} · {e.section}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Clock size={12} />{e.startTime} – {e.endTime}</p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-500 space-y-1">
                          {e.room && <p>Room: <span className="font-semibold text-slate-700">{e.room}</span></p>}
                          {e.invigilator && <p>Invigilator: <span className="font-semibold text-slate-700">{e.invigilator}</span></p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* ── Add / Edit Entry Modal ── */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-950">
                {modal.mode === "create" ? "Add Schedule Entry" : "Edit Schedule Entry"}
              </h2>
              <button onClick={() => { setModal({ open: false, mode: "create", data: null }); setForm(EMPTY_ENTRY); }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">

                {/* 1. Academic Year */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Academic Year *</label>
                  <select value={form.academicYear} onChange={handleAcademicYearChange}
                    disabled={modal.mode === "edit"}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer disabled:bg-slate-50 disabled:text-slate-500">
                    <option value="">Select Academic Year</option>
                    {academicYears.map((ay) => (
                      <option key={ay._id} value={ay._id}>{ay.name}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Examination */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Examination *</label>
                  <select value={form.exam} onChange={handleExamChange}
                    disabled={modal.mode === "edit"}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer disabled:bg-slate-50 disabled:text-slate-500">
                    <option value="">
                      {form.academicYear ? "Select Exam" : "Select Academic Year first"}
                    </option>
                    {formFilteredExams.map((e) => (
                      <option key={e._id} value={e._id}>{e.examName}</option>
                    ))}
                  </select>
                  {form.academicYear && formFilteredExams.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600 font-medium">No exams found for this academic year.</p>
                  )}
                </div>

                {/* 3. Exam Type */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Exam Type *</label>
                  <select value={form.examType} onChange={(e) => {
                    const selectedType = examTypes.find((t) => t._id === e.target.value);
                    setForm((f) => ({ ...f, examType: e.target.value, examTypeName: selectedType?.examName || "" }));
                  }}
                    disabled={modal.mode === "edit" || !form.exam || examTypes.length === 0}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer disabled:bg-slate-50 disabled:text-slate-500">
                    {examTypes.length === 0 ? (
                      <option value="">No Exam Types Found</option>
                    ) : (
                      <>
                        <option value="">Select Exam Type</option>
                        {examTypes.map((et) => (
                          <option key={et._id} value={et._id}>{et.examName}</option>
                        ))}
                      </>
                    )}
                  </select>
                  {examTypes.length === 0 && (
                    <div className="mt-2 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-semibold text-amber-800">
                      <span>No Exam Types Found</span>
                      <button
                        type="button"
                        onClick={() => navigate("/master-setup/exam-types")}
                        className="rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white shadow hover:bg-amber-700 transition cursor-pointer"
                      >
                        Go To Exam Types
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. Class */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Class *</label>
                  <select value={form.classId} onChange={handleClassChange}
                    disabled={modal.mode === "edit" || !form.exam}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer disabled:bg-slate-50 disabled:text-slate-500">
                    <option value="">Select Class</option>
                    {formExamClasses.length > 0 ? (
                      formExamClasses.map((c) => (
                        <option key={c._id} value={c._id}>{c.className}</option>
                      ))
                    ) : form.exam ? (
                      classes.map((c) => (
                        <option key={c._id} value={c._id}>{c.className}</option>
                      ))
                    ) : null}
                  </select>
                </div>

                {/* 5. Section */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Section *</label>
                  <select value={form.section} onChange={handleSectionChange}
                    disabled={modal.mode === "edit" || !form.classId}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer disabled:bg-slate-50 disabled:text-slate-500">
                    <option value="">Select Section</option>
                    {formClassSections.length > 0 ? (
                      formClassSections.map((sName, idx) => (
                        <option key={`${sName}-${idx}`} value={sName}>{sName}</option>
                      ))
                    ) : form.classId ? (
                      // Fallback: load sections from ClassSection model
                      (() => {
                        const cls = classes.find((c) => c._id === form.classId);
                        const secs = cls?.sections?.map((s) => typeof s === "string" ? s : s.sectionName).filter(Boolean) || [];
                        return secs.map((sName, idx) => (
                          <option key={`fallback-${sName}-${idx}`} value={sName}>{sName}</option>
                        ));
                      })()
                    ) : null}
                  </select>
                  {form.classId && formClassSections.length === 0 && (
                    <p className="mt-1 text-xs text-slate-500">Sections from class configuration.</p>
                  )}
                </div>

                {/* 6. Subject */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Subject *</label>
                  <select value={form.subject} onChange={handleSubjectChange}
                    disabled={modal.mode === "edit" || !form.section}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer disabled:bg-slate-50 disabled:text-slate-500">
                    <option value="">Select Subject</option>
                    {formClassSubjects.length > 0 ? (
                      formClassSubjects.map((s) => (
                        <option key={s._id} value={s._id}>{s.subjectName} ({s.subjectCode})</option>
                      ))
                    ) : form.classId ? (
                      subjects.map((s) => (
                        <option key={s._id} value={s._id}>{s.subjectName} ({s.subjectCode})</option>
                      ))
                    ) : null}
                  </select>
                  {form.classId && formClassSubjects.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600 font-medium">No subjects assigned to this class. Showing all subjects.</p>
                  )}
                </div>

                {/* 7. Exam Date */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Exam Date *</label>
                  <input type="date" value={form.examDate}
                    onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100" />
                </div>

                {/* 8. Room Number */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Room Number</label>
                  <input value={form.room}
                    onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                    placeholder="e.g. Hall A, Room 101"
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100" />
                </div>

                {/* 9. Start Time */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Start Time *</label>
                  <select value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* 10. End Time */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">End Time *</label>
                  <select value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* 11. Invigilator */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Invigilator (Teacher)</label>
                  <select value={form.invigilator}
                    onChange={(e) => setForm((f) => ({ ...f, invigilator: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                    <option value="">Select Invigilator</option>
                    {formAvailableTeachers.length > 0 ? (
                      formAvailableTeachers.map((s) => (
                        <option key={s._id} value={`${s.firstName} ${s.lastName}`.trim()}>
                          {s.firstName} {s.lastName}
                        </option>
                      ))
                    ) : (
                      <option disabled>No teaching staff found</option>
                    )}
                  </select>
                  {/* Manual invigilator entry if no staff loaded */}
                  {formAvailableTeachers.length === 0 && (
                    <input
                      value={form.invigilator}
                      onChange={(e) => setForm((f) => ({ ...f, invigilator: e.target.value }))}
                      placeholder="Enter invigilator name manually"
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />
                  )}
                </div>

                {/* 12. Status */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Status</label>
                  <select value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                    <option value="Scheduled">Scheduled</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* 13. Maximum Marks */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Maximum Marks *</label>
                  <input type="number" value={form.maxMarks}
                    onChange={(e) => setForm((f) => ({ ...f, maxMarks: e.target.value }))}
                    placeholder="e.g. 100" min="1"
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100" />
                </div>

                {/* 14. Passing Marks */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Passing Marks *</label>
                  <input type="number" value={form.passingMarks}
                    onChange={(e) => setForm((f) => ({ ...f, passingMarks: e.target.value }))}
                    placeholder="e.g. 33" min="0"
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100" />
                </div>

                {/* 15. Instructions */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Instructions</label>
                  <textarea value={form.instructions || ""}
                    onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                    placeholder="Special instructions for students (optional)"
                    className="h-20 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 resize-none" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 p-6">
              <button
                onClick={() => { setModal({ open: false, mode: "create", data: null }); setForm(EMPTY_ENTRY); }}
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >Cancel</button>
              <button onClick={handleSave} disabled={scheduleSaving}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 cursor-pointer">
                {scheduleSaving ? <Loader2 className="animate-spin" size={16} /> : null}
                {modal.mode === "create" ? "Add Entry" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Detailed Schedule Modal ── */}
      {viewDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Exam Schedule Details</h3>
              <button onClick={() => setViewDetail(null)} className="text-slate-500 hover:text-slate-700 font-bold cursor-pointer">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-semibold text-slate-400 text-xs">Exam Name</span><p className="font-bold text-slate-800 mt-0.5">{viewDetail.examName}</p></div>
              <div><span className="font-semibold text-slate-400 text-xs">Exam Type</span><p className="font-bold text-slate-800 mt-0.5">{viewDetail.examTypeName || "—"}</p></div>
              <div><span className="font-semibold text-slate-400 text-xs">Class & Section</span><p className="font-bold text-slate-800 mt-0.5">{viewDetail.className} - {viewDetail.section}</p></div>
              <div><span className="font-semibold text-slate-400 text-xs">Subject</span><p className="font-bold text-slate-800 mt-0.5">{viewDetail.subjectName}</p></div>
              <div><span className="font-semibold text-slate-400 text-xs">Date</span><p className="font-bold text-slate-800 mt-0.5">{fmt(viewDetail.examDate)}</p></div>
              <div><span className="font-semibold text-slate-400 text-xs">Time</span><p className="font-bold text-slate-800 mt-0.5">{viewDetail.startTime} to {viewDetail.endTime}</p></div>
              <div><span className="font-semibold text-slate-400 text-xs">Room Number</span><p className="font-bold text-slate-800 mt-0.5">{viewDetail.room || "—"}</p></div>
              <div><span className="font-semibold text-slate-400 text-xs">Invigilator</span><p className="font-bold text-slate-800 mt-0.5">{viewDetail.invigilator || "—"}</p></div>
              <div><span className="font-semibold text-slate-400 text-xs">Maximum Marks</span><p className="font-bold text-slate-800 mt-0.5">{viewDetail.maxMarks}</p></div>
              <div><span className="font-semibold text-slate-400 text-xs">Passing Marks</span><p className="font-bold text-slate-800 mt-0.5">{viewDetail.passingMarks}</p></div>
              <div className="col-span-2"><span className="font-semibold text-slate-400 text-xs">Status</span><p className="font-bold text-slate-800 mt-0.5">{viewDetail.status || "Scheduled"}</p></div>
              {viewDetail.instructions && (
                <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-400 text-xs">Instructions</span>
                  <p className="text-slate-700 mt-1 leading-relaxed font-medium">{viewDetail.instructions}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button onClick={() => handlePrint(viewDetail)} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
                <Printer size={13} /> Print Schedule
              </button>
              <button onClick={() => setViewDetail(null)} className="h-10 rounded-xl bg-slate-950 px-5 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Generate Modal ── */}
      {bulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-950">Bulk Generate Schedule</h2>
              <button onClick={() => setBulkModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Exam */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Exam *</label>
                  <select value={bulkForm.exam}
                    onChange={(e) => setBulkForm((f) => ({ ...f, exam: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 cursor-pointer">
                    <option value="">Select Exam</option>
                    {exams.map((e) => (
                      <option key={e._id} value={e._id}>{e.examName}</option>
                    ))}
                  </select>
                </div>
                {/* Class */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Class *</label>
                  <select value={bulkForm.classId}
                    onChange={(e) => {
                      const cls = classes.find((c) => c._id === e.target.value);
                      setBulkForm((f) => ({ ...f, classId: e.target.value, className: cls?.className || "", section: "", entries: [] }));
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 cursor-pointer">
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>{c.className}</option>
                    ))}
                  </select>
                </div>
                {/* Section - fixed: using bulkClassSections which extracts sectionName properly */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Section *</label>
                  <select value={bulkForm.section}
                    onChange={(e) => setBulkForm((f) => ({ ...f, section: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 cursor-pointer">
                    <option value="">Select Section</option>
                    {bulkClassSections.length > 0 ? (
                      bulkClassSections.map((sName, idx) => (
                        <option key={`bulk-sec-${sName}-${idx}`} value={sName}>{sName}</option>
                      ))
                    ) : (
                      <option disabled>Select a class first</option>
                    )}
                  </select>
                </div>
                {/* Room */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Default Room</label>
                  <input value={bulkForm.room}
                    onChange={(e) => setBulkForm((f) => ({ ...f, room: e.target.value }))}
                    placeholder="Exam Hall 1"
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400" />
                </div>
                {/* Start Time */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Start Time</label>
                  <select value={bulkForm.startTime}
                    onChange={(e) => setBulkForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 cursor-pointer">
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {/* End Time */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">End Time</label>
                  <select value={bulkForm.endTime}
                    onChange={(e) => setBulkForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-400 cursor-pointer">
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Subjects & Dates */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Subjects & Dates *{" "}
                  <span className="font-normal text-slate-400">— select subjects and assign exam dates</span>
                </label>
                {!bulkForm.classId ? (
                  <p className="text-sm text-slate-400 font-medium py-4 text-center">Select a class to see available subjects.</p>
                ) : bulkClassSubjects.length === 0 ? (
                  <p className="text-sm text-amber-600 font-medium py-4 text-center">No subjects found for this class.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {bulkClassSubjects.map((sub) => {
                      const entry = bulkForm.entries.find((e) => e.subjectId === sub._id);
                      return (
                        <div key={sub._id} className={`flex items-center gap-3 rounded-xl border p-3 transition ${entry ? "border-slate-900 bg-slate-50" : "border-slate-200"}`}>
                          <input type="checkbox" checked={!!entry} onChange={() => toggleBulkSubject(sub)}
                            className="h-4 w-4 cursor-pointer accent-slate-900" />
                          <span className="flex-1 text-sm font-medium text-slate-700">{sub.subjectName}</span>
                          {entry && (
                            <input type="date" value={entry.examDate}
                              onChange={(e) => updateBulkDate(sub._id, e.target.value)}
                              className="h-9 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-slate-400" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 p-6">
              <button onClick={() => setBulkModal(false)}
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={handleBulkGenerate} disabled={scheduleSaving}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 cursor-pointer">
                {scheduleSaving ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                Generate Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-950">Delete Schedule Entry?</h3>
            <p className="mt-2 text-sm text-slate-600 font-medium">
              Remove <span className="font-semibold text-slate-800">{deleteTarget.subjectName}</span> schedule for {deleteTarget.className} {deleteTarget.section}?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={handleDelete}
                className="h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ExamSchedulePage;
