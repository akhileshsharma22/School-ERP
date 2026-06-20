import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Search, RefreshCw, Loader2, Save, FileDown,
  CheckCircle, XCircle, AlertTriangle, Users, BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  checkExamSetup, fetchExams, fetchStudentsForMarks, fetchMarks,
  saveBulkMarks, clearMarksState, fetchSchedule
} from "../../redux/slices/examSlice";
import { fetchAcademicYears } from "../../redux/slices/academicYearSlice";
import { fetchAllExamTypes } from "../../redux/slices/examTypeSlice";
import { fetchAllClasses } from "../../redux/slices/classSectionSlice";
import { fetchAllSubjects } from "../../redux/slices/subjectSlice";

const toIdStr = (val) => {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && val._id) return String(val._id);
  return String(val);
};

const DEFAULT_GRADES = [
  { grade: "A1", min: 91 }, { grade: "A2", min: 81 }, { grade: "B1", min: 71 },
  { grade: "B2", min: 61 }, { grade: "C1", min: 51 }, { grade: "C2", min: 41 },
  { grade: "D", min: 33 },  { grade: "F", min: 0 },
];

const getGrade = (pct) => {
  for (const g of DEFAULT_GRADES) { if (pct >= g.min) return g.grade; }
  return "F";
};

const GRADE_COLORS = {
  A1: "text-emerald-700 font-bold", A2: "text-green-700 font-bold",
  B1: "text-blue-700 font-semibold", B2: "text-blue-600 font-semibold",
  C1: "text-amber-700 font-semibold", C2: "text-amber-600 font-semibold",
  D: "text-orange-600 font-semibold", F: "text-red-600 font-bold",
};

const MarksEntryPage = () => {
  const dispatch = useDispatch();
  const { exams, marksStudents, marks, marksLoading, marksSaving, setupReady, setupMissing, setupLoading, schedule } =
    useSelector((s) => s.exams);
  const { academicYears } = useSelector((s) => s.academicYear);
  const { examTypes } = useSelector((s) => s.examTypes);
  const { classes } = useSelector((s) => s.classSections);
  const { subjects } = useSelector((s) => s.subjects);

  // Filters
  const [academicYear, setAcademicYear] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [examType, setExamType] = useState("");
  const [examId, setExamId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Local marks state (student_id → marks)
  const [marksMap, setMarksMap] = useState({});

  useEffect(() => {
    dispatch(checkExamSetup());
    dispatch(fetchAcademicYears());
    dispatch(fetchAllExamTypes());
    dispatch(fetchAllClasses());
    dispatch(fetchAllSubjects());
    dispatch(fetchExams({ limit: 100 }));
    return () => dispatch(clearMarksState());
  }, [dispatch]);

  // Reactive schedule fetcher when Exam, Class, Section filter updates
  useEffect(() => {
    if (examId) {
      const cls = classes.find((c) => c.className === className);
      dispatch(fetchSchedule({
        examId,
        ...(cls ? { classId: cls._id } : {}),
        ...(section ? { section } : {})
      }));
    }
  }, [dispatch, examId, className, section, classes]);

  const filteredExams = useMemo(() => {
    let list = exams;
    if (academicYear) list = list.filter((e) => toIdStr(e.academicYear) === academicYear);
    if (examType) list = list.filter((e) => toIdStr(e.examType) === examType);
    return list;
  }, [exams, academicYear, examType]);

  const classSections = useMemo(() => {
    const cls = classes.find((c) => c.className === className);
    return cls?.sections?.map((s) => (typeof s === "string" ? s : s.sectionName)).filter(Boolean) || [];
  }, [classes, className]);

  const classSubjects = useMemo(() => {
    const cls = classes.find((c) => c.className === className);
    if (!cls) return [];
    
    // Base subjects assigned to this class
    let list = subjects.filter((s) => s.classAssignments?.some((a) => a.className === className));

    // If an exam is selected, filter to only scheduled subjects for this exam/class/section
    if (examId) {
      const filteredSchedules = schedule.filter((s) => {
        const sExamId = toIdStr(s.exam);
        const sClassId = toIdStr(s.classId);
        const matchesSection = section ? s.section === section : true;
        return sExamId === examId && sClassId === cls._id && matchesSection;
      });
      const uniqueSubjectIds = [...new Set(filteredSchedules.map((s) => toIdStr(s.subject)))];
      list = list.filter((s) => uniqueSubjectIds.includes(s._id));
    }
    return list;
  }, [subjects, classes, className, examId, section, schedule]);

  const selectedSubject = useMemo(() =>
    subjects.find((s) => s._id === subjectId), [subjects, subjectId]);

  const selectedSubjectMax = useMemo(() => {
    if (!selectedSubject) return 100;
    const assign = selectedSubject.classAssignments?.find((a) => a.className === className);
    return assign?.maxMarks || 100;
  }, [selectedSubject, className]);

  const handleLoad = async () => {
    if (!academicYear) return toast.error("Please select an academic year.");
    if (!examId) return toast.error("Please select an exam.");
    if (!className) return toast.error("Please select a class.");
    if (!section) return toast.error("Please select a section.");
    if (!subjectId) return toast.error("Please select a subject.");

    await Promise.all([
      dispatch(fetchStudentsForMarks({ className, section, academicYear })),
      dispatch(fetchMarks({ exam: examId, className, section, subject: subjectId })),
    ]);
    setLoaded(true);

    // Build marks map from existing entries
    const existingMarks = {};
    marks.forEach((m) => {
      existingMarks[m.student?._id || m.student] = {
        marksObtained: m.marksObtained ?? "",
        isAbsent: m.isAbsent || false,
        remarks: m.remarks || "",
      };
    });
    setMarksMap(existingMarks);
  };

  // After marks loaded, sync local state
  useEffect(() => {
    if (!loaded) return;
    const map = {};
    marks.forEach((m) => {
      map[m.student?._id || m.student] = {
        marksObtained: m.marksObtained ?? "",
        isAbsent: m.isAbsent || false,
        remarks: m.remarks || "",
      };
    });
    setMarksMap(map);
  }, [marks]);

  const setMark = (studentId, field, value) => {
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [field]: value },
    }));
  };

  const getDisplayedStudents = useMemo(() => {
    if (!search.trim()) return marksStudents;
    const q = search.toLowerCase();
    return marksStudents.filter((s) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.admissionNo?.toLowerCase().includes(q)
    );
  }, [marksStudents, search]);

  const markAllPresent = () => {
    const map = {};
    marksStudents.forEach((s) => {
      map[s._id] = { marksObtained: selectedSubjectMax, isAbsent: false, remarks: "" };
    });
    setMarksMap(map);
    toast.success("All students marked with maximum marks");
  };

  const markAllAbsent = () => {
    const map = {};
    marksStudents.forEach((s) => {
      map[s._id] = { marksObtained: 0, isAbsent: true, remarks: "Absent" };
    });
    setMarksMap(map);
    toast.success("All students marked absent");
  };


  const validateAndGetPayload = (isDraft = false) => {
    const marksData = [];
    for (const student of marksStudents) {
      const entry = marksMap[student._id] || {};
      const { marksObtained, isAbsent, remarks } = entry;

      if (!isDraft && !isAbsent) {
        if (marksObtained === "" || marksObtained === null || marksObtained === undefined) {
          toast.error(`Marks are blank for ${student.firstName} ${student.lastName}`);
          return null;
        }
        if (Number(marksObtained) < 0) {
          toast.error(`Negative marks not allowed for ${student.firstName} ${student.lastName}`);
          return null;
        }
        if (Number(marksObtained) > selectedSubjectMax) {
          toast.error(`Marks (${marksObtained}) exceed maximum marks (${selectedSubjectMax}) for ${student.firstName} ${student.lastName}`);
          return null;
        }
      }

      marksData.push({
        studentId: student._id,
        maxMarks: selectedSubjectMax,
        marksObtained: isAbsent ? 0 : Number(marksObtained || 0),
        isAbsent: !!isAbsent,
        remarks: remarks || "",
      });
    }
    return marksData;
  };

  const handleSave = async (isDraft = false) => {
    const marksData = validateAndGetPayload(isDraft);
    if (!marksData) return;

    const res = await dispatch(saveBulkMarks({
      exam: examId, subject: subjectId, academicYear, className, section, marksData, isDraft,
    }));
    if (saveBulkMarks.fulfilled.match(res)) {
      toast.success(isDraft ? "Marks draft saved" : "Marks saved successfully");
      dispatch(fetchMarks({ exam: examId, className, section, subject: subjectId }));
    } else {
      toast.error(res.payload || "Failed to save marks");
    }
  };

  const exportCSV = () => {
    const rows = [["Admission No","Student Name","Max Marks","Marks Obtained","Percentage","Grade","Result","Remarks"]];
    marksStudents.forEach((s) => {
      const entry = marksMap[s._id] || {};
      const obtained = entry.isAbsent ? "AB" : (entry.marksObtained ?? "");
      const pct = obtained !== "AB" && obtained !== "" ? ((Number(obtained) / selectedSubjectMax) * 100).toFixed(2) : "";
      const grade = pct !== "" ? getGrade(Number(pct)) : (entry.isAbsent ? "AB" : "");
      const result = entry.isAbsent ? "Absent" : (pct !== "" ? (Number(pct) >= 33 ? "Pass" : "Fail") : "");
      rows.push([s.admissionNo, `${s.firstName} ${s.lastName}`, selectedSubjectMax, obtained, pct, grade, result, entry.remarks || ""]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "marks.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setAcademicYear(""); setClassName(""); setSection(""); setExamType("");
    setExamId(""); setSubjectId(""); setSearch(""); setLoaded(false); setMarksMap({});
    dispatch(clearMarksState());
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        {/* Header */}
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Examinations</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">Marks Entry</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Enter and manage student examination marks with automatic grade calculation.</p>
          </div>
        </header>

        {/* Dependency warning */}
        {!setupLoading && !setupReady && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-4">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h2 className="text-sm font-semibold text-slate-950">Master Setup Incomplete</h2>
                <ul className="mt-2 space-y-1">
                  {setupMissing.map((m) => (
                    <li key={m.key} className="text-sm text-amber-700">• {m.label}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Filter bar */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <h3 className="mb-4 text-sm font-bold text-slate-950">Filter & Load Students</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Academic Year</label>
              <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="">Select Year</option>
                {academicYears.map((ay) => <option key={ay._id} value={ay._id}>{ay.name || ay.label || ay.year}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Class</label>
              <select value={className} onChange={(e) => { setClassName(e.target.value); setSection(""); setSubjectId(""); }}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="">Select Class</option>
                {classes.map((c) => <option key={c._id} value={c.className}>{c.className}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Section</label>
              <select value={section} onChange={(e) => setSection(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="">Select Section</option>
                {classSections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Exam Type</label>
              <select value={examType} onChange={(e) => { setExamType(e.target.value); setExamId(""); }}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="">All Types</option>
                {examTypes.map((et) => <option key={et._id} value={et._id}>{et.examName}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Exam</label>
              <select value={examId} onChange={(e) => setExamId(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="">Select Exam</option>
                {filteredExams.map((e) => <option key={e._id} value={e._id}>{e.examName}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Subject</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
                disabled={classSubjects.length === 0}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer disabled:bg-slate-50 disabled:text-slate-500">
                {classSubjects.length === 0 ? (
                  <option value="">No subjects assigned to this class.</option>
                ) : (
                  <>
                    <option value="">Select Subject</option>
                    {classSubjects.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.subjectName}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={handleLoad} disabled={marksLoading}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
              {marksLoading ? <Loader2 className="animate-spin" size={16} /> : <Users size={16} />}
              Load Students
            </button>
            <button onClick={handleReset}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              <RefreshCw size={16} /> Reset
            </button>
          </div>
        </section>

        {/* Marks table */}
        {loaded && (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search student…"
                    className="h-10 w-56 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100" />
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <BookOpen size={16} className="text-slate-400" />
                  Max: <span className="font-bold text-slate-950">{selectedSubjectMax}</span>
                  &nbsp;|&nbsp;
                  <Users size={16} className="text-slate-400" />
                  <span className="font-bold text-slate-950">{marksStudents.length}</span> students
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={markAllPresent}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                  <CheckCircle size={14} /> Mark All Max
                </button>
                <button onClick={markAllAbsent}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100">
                  <XCircle size={14} /> Mark All Absent
                </button>
                <button onClick={exportCSV}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <FileDown size={14} /> Export CSV
                </button>
                <button onClick={() => handleSave(true)} disabled={marksSaving}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                  {marksSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  Draft Save
                </button>
                <button onClick={() => handleSave(false)} disabled={marksSaving}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                  {marksSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                  Save All
                </button>
              </div>
            </div>

            {/* Student marks table */}
            {marksLoading ? (
              <div className="flex items-center justify-center gap-3 p-12 text-sm font-medium text-slate-500">
                <Loader2 className="animate-spin" size={18} /> Loading students…
              </div>
            ) : getDisplayedStudents.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="mx-auto mb-3 text-slate-300" size={36} />
                <p className="text-sm font-medium text-slate-500">No students found in selected section.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">#</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Adm. No</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Student Name</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Max Marks</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Marks Obtained</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">%</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Grade</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Result</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Absent</th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getDisplayedStudents.map((student, idx) => {
                      const entry = marksMap[student._id] || {};
                      const isAbsent = entry.isAbsent || false;
                      const obtained = isAbsent ? 0 : Number(entry.marksObtained || 0);
                      const hasMarks = !isAbsent && entry.marksObtained !== "" && entry.marksObtained !== undefined;
                      const pct = hasMarks ? parseFloat(((obtained / selectedSubjectMax) * 100).toFixed(1)) : null;
                      const grade = pct !== null ? getGrade(pct) : "—";
                      const passed = pct !== null ? pct >= 33 : null;
                      const isInvalid = !isAbsent && entry.marksObtained !== "" && (obtained < 0 || obtained > selectedSubjectMax);

                      return (
                        <tr key={student._id}
                          className={`transition ${isAbsent ? "bg-slate-50/80" : isInvalid ? "bg-red-50" : passed === false ? "bg-rose-50/60" : passed === true ? "bg-emerald-50/40" : ""}`}>
                          <td className="px-5 py-3 text-sm text-slate-500">{idx + 1}</td>
                          <td className="px-5 py-3 text-sm font-semibold text-slate-700">{student.admissionNo}</td>
                          <td className="px-5 py-3">
                            <p className="text-sm font-semibold text-slate-950">{student.firstName} {student.lastName}</p>
                            <p className="text-xs text-slate-400">{student.sectionName}</p>
                          </td>
                          <td className="px-5 py-3 text-center text-sm font-bold text-slate-700">{selectedSubjectMax}</td>
                          <td className="px-5 py-3">
                            <input
                              type="number"
                              min={0} max={selectedSubjectMax}
                              disabled={isAbsent}
                              value={isAbsent ? "AB" : (entry.marksObtained ?? "")}
                              onChange={(e) => setMark(student._id, "marksObtained", e.target.value)}
                              className={`h-10 w-24 rounded-xl border text-center text-sm font-bold outline-none transition focus:ring-4 focus:ring-slate-100 mx-auto block
                                ${isAbsent ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200" : isInvalid ? "border-red-400 bg-red-50 text-red-700 focus:border-red-500" : "border-slate-200 bg-white hover:border-slate-300 focus:border-slate-400"}`}
                            />
                          </td>
                          <td className="px-5 py-3 text-center text-sm font-semibold text-slate-700">
                            {isAbsent ? "—" : pct !== null ? `${pct}%` : "—"}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className={`text-sm ${GRADE_COLORS[grade] || "text-slate-600"}`}>{isAbsent ? "AB" : grade}</span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            {isAbsent ? (
                              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">Absent</span>
                            ) : passed === true ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"><CheckCircle size={11} />Pass</span>
                            ) : passed === false ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700"><XCircle size={11} />Fail</span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isAbsent}
                              onChange={(e) => {
                                setMark(student._id, "isAbsent", e.target.checked);
                                if (e.target.checked) setMark(student._id, "marksObtained", "");
                              }}
                              className="h-4 w-4 cursor-pointer accent-slate-900"
                            />
                          </td>
                          <td className="px-5 py-3">
                            <input
                              value={entry.remarks || ""}
                              onChange={(e) => setMark(student._id, "remarks", e.target.value)}
                              placeholder="Optional…"
                              className="h-10 w-36 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom save bar */}
            {!marksLoading && marksStudents.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
                <p className="text-sm text-slate-500">
                  {marksStudents.filter((s) => marksMap[s._id]?.marksObtained !== "" && marksMap[s._id]?.marksObtained !== undefined).length} / {marksStudents.length} entries filled
                </p>
                <div className="flex gap-3">
                  <button onClick={() => handleSave(true)} disabled={marksSaving}
                    className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                    Save Draft
                  </button>
                  <button onClick={() => handleSave(false)} disabled={marksSaving}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                    {marksSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Save All Marks
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MarksEntryPage;
