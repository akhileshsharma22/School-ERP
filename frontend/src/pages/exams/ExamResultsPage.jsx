import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Trophy, Users, CheckCircle, XCircle, TrendingUp, Search, Loader2,
  Eye, Printer, Send, Download, RefreshCw, BarChart2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  fetchExams, fetchResultsSummary, fetchResults, computeResults,
  publishResult, bulkPublishResults, fetchStudentsForMarks,
} from "../../redux/slices/examSlice";
import { fetchAcademicYears } from "../../redux/slices/academicYearSlice";
import { fetchAllClasses } from "../../redux/slices/classSectionSlice";

const toIdStr = (id) => {
  if (!id) return "";
  if (typeof id === "string") return id;
  if (typeof id === "object" && id._id) return id._id.toString();
  return id.toString();
};

const GRADE_BADGE = {
  A1: "border-emerald-200 bg-emerald-50 text-emerald-700",
  A2: "border-green-200 bg-green-50 text-green-700",
  B1: "border-blue-200 bg-blue-50 text-blue-700",
  B2: "border-blue-100 bg-blue-50 text-blue-600",
  C1: "border-amber-200 bg-amber-50 text-amber-700",
  C2: "border-amber-100 bg-amber-50 text-amber-600",
  D:  "border-orange-200 bg-orange-50 text-orange-700",
  F:  "border-red-200 bg-red-50 text-red-700",
};

const StatCard = ({ label, value, sub, colorClass, icon: Icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value ?? "—"}</p>
        {sub && <p className="mt-1 text-xs font-medium text-slate-400">{sub}</p>}
      </div>
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${colorClass}`}>
        <Icon size={20} />
      </div>
    </div>
  </div>
);

const ExamResultsPage = () => {
  const dispatch = useDispatch();
  const { exams, results, resultsTotal, resultsLoading, resultsSaving, resultsSummary, marksStudents } =
    useSelector((s) => s.exams);
  const { academicYears } = useSelector((s) => s.academicYear);
  const { classes } = useSelector((s) => s.classSections);

  const [filterAY, setFilterAY] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterExam, setFilterExam] = useState("");
  const [search, setSearch] = useState("");
  const [viewModal, setViewModal] = useState(null);
  const [computing, setComputing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Add temporary logs
  console.log("selectedClass", filterClass);
  console.log("selectedSection", filterSection);
  console.log("students", marksStudents);
  console.log("results", results);

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchAllClasses());
    dispatch(fetchExams({ limit: 100 }));
  }, [dispatch]);

  const filteredExams = useMemo(() => {
    if (!filterAY) return exams;
    return exams.filter((e) => toIdStr(e.academicYear) === toIdStr(filterAY));
  }, [exams, filterAY]);

  const classSections = useMemo(() => {
    const cls = classes.find((c) => c.className === filterClass);
    return cls?.sections || [];
  }, [classes, filterClass]);

  const handleAYChange = (val) => {
    setFilterAY(val);
    setFilterExam("");
    setFilterClass("");
    setFilterSection("");
    setLoaded(false);
  };

  const handleExamChange = (val) => {
    setFilterExam(val);
    setFilterClass("");
    setFilterSection("");
    setLoaded(false);
  };

  const handleClassChange = (val) => {
    setFilterClass(val);
    setFilterSection("");
    setLoaded(false);
  };

  const handleSectionChange = (val) => {
    setFilterSection(val);
    setLoaded(false);
  };

  const fetchData = () => {
    const selectedCls = classes.find((c) => c.className === filterClass);
    const selectedSec = selectedCls?.sections?.find((s) => s._id === filterSection);
    const sectionName = selectedSec ? selectedSec.sectionName : filterSection;

    const params = {};
    if (filterAY) params.academicYear = filterAY;
    if (filterClass) params.className = filterClass;
    if (sectionName) params.section = sectionName;
    if (filterExam) params.exam = filterExam;
    if (search) params.search = search;

    dispatch(fetchResults(params));
    dispatch(fetchResultsSummary(params));
    if (filterAY && filterClass && sectionName) {
      dispatch(fetchStudentsForMarks({ className: filterClass, section: sectionName, academicYear: filterAY }));
    }
  };

  const handleLoad = () => {
    if (!filterAY) return toast.error("Please select Academic Year");
    if (!filterExam) return toast.error("Please select Exam");
    if (!filterClass) return toast.error("Please select Class");
    if (!filterSection) return toast.error("Please select Section");

    const selectedCls = classes.find((c) => c.className === filterClass);
    const selectedSec = selectedCls?.sections?.find((s) => s._id === filterSection);
    const sectionName = selectedSec ? selectedSec.sectionName : filterSection;

    const params = {
      academicYear: filterAY,
      exam: filterExam,
      className: filterClass,
      section: sectionName,
    };
    if (search) params.search = search;

    dispatch(fetchResults(params));
    dispatch(fetchResultsSummary(params));
    dispatch(fetchStudentsForMarks({ className: filterClass, section: sectionName, academicYear: filterAY }));
    setLoaded(true);
  };

  const handleComputeResults = async () => {
    if (!filterExam || !filterClass || !filterSection)
      return toast.error("Please select Exam, Class, and Section to compute results");

    const selectedCls = classes.find((c) => c.className === filterClass);
    const selectedSec = selectedCls?.sections?.find((s) => s._id === filterSection);
    const sectionName = selectedSec ? selectedSec.sectionName : filterSection;

    setComputing(true);
    const res = await dispatch(computeResults({ exam: filterExam, className: filterClass, section: sectionName }));
    setComputing(false);
    if (computeResults.fulfilled.match(res)) {
      toast.success(res.payload.message || "Results computed successfully");
      fetchData();
    } else {
      toast.error(res.payload || "Failed to compute results");
    }
  };

  const handlePublish = async (result) => {
    const res = await dispatch(publishResult(result._id));
    if (publishResult.fulfilled.match(res)) {
      toast.success("Result published successfully");
      fetchData();
    } else {
      toast.error(res.payload || "Failed to publish result");
    }
  };

  const handleBulkPublish = async () => {
    if (!filterExam || !filterClass || !filterSection)
      return toast.error("Please select Exam, Class, and Section first");

    const selectedCls = classes.find((c) => c.className === filterClass);
    const selectedSec = selectedCls?.sections?.find((s) => s._id === filterSection);
    const sectionName = selectedSec ? selectedSec.sectionName : filterSection;

    const res = await dispatch(bulkPublishResults({ exam: filterExam, className: filterClass, section: sectionName }));
    if (bulkPublishResults.fulfilled.match(res)) {
      toast.success(res.payload.message || "All results published");
      fetchData();
    } else {
      toast.error(res.payload || "Failed to publish results");
    }
  };

  const exportCSV = () => {
    const rows = [["Rank","Adm. No","Student Name","Class","Section","Total Marks","Obtained","Percentage","Grade","Division","Status"]];
    results.forEach((r) => {
      const name = r.student ? `${r.student.firstName} ${r.student.lastName}` : "—";
      rows.push([r.rank, r.student?.admissionNo, name, r.className, r.section,
                 r.totalMaxMarks, r.totalMarksObtained, r.percentage, r.grade, r.division, r.resultStatus]);
    });
    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "results.csv"; a.click();
  };

  const fmt = (n) => n !== undefined && n !== null ? `${n}%` : "—";
  const fmtName = (r) => r.student ? `${r.student.firstName} ${r.student.lastName}` : "—";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        {/* Header */}
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Examinations</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">Results</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">View, compute, and publish student examination results.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleBulkPublish} disabled={!loaded || resultsSaving}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60">
              <Send size={18} className="text-emerald-600" /> Publish All
            </button>
            <button onClick={handleComputeResults} disabled={!loaded || computing || resultsSaving}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-slate-800 transition disabled:opacity-60">
              {computing ? <Loader2 className="animate-spin" size={18} /> : <BarChart2 size={18} />}
              Compute Results
            </button>
          </div>
        </header>

        {/* Stats */}
        {loaded && resultsSummary && (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Students" value={resultsSummary.total} sub="In selected filter" icon={Users} colorClass="bg-slate-100 text-slate-600" />
            <StatCard label="Passed" value={resultsSummary.passed} sub={`${resultsSummary.passPercent}% pass rate`} icon={CheckCircle} colorClass="bg-emerald-100 text-emerald-600" />
            <StatCard label="Failed" value={resultsSummary.failed} sub="Need attention" icon={XCircle} colorClass="bg-red-100 text-red-600" />
            <StatCard label="Class Average" value={fmt(resultsSummary.classAvg)} sub={`Highest: ${fmt(resultsSummary.highest)}`} icon={TrendingUp} colorClass="bg-blue-100 text-blue-600" />
          </section>
        )}
        {loaded && resultsSummary?.topper && (
          <section className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow">
                <Trophy size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Class Topper</p>
                <p className="mt-0.5 text-xl font-bold text-slate-950">{resultsSummary.topper.studentName}</p>
                <p className="text-sm font-medium text-amber-700">{resultsSummary.topper.percentage?.toFixed(2)}% · {resultsSummary.topper.grade} · {resultsSummary.topper.division} Division</p>
              </div>
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              <select value={filterAY} onChange={(e) => handleAYChange(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="">Select Year</option>
                {academicYears.map((ay) => <option key={ay._id} value={ay._id}>{ay.name || ay.label || ay.year}</option>)}
              </select>

              <select value={filterExam} onChange={(e) => handleExamChange(e.target.value)}
                disabled={!filterAY}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer disabled:bg-slate-50 disabled:text-slate-500">
                {!filterAY ? (
                  <option value="">Select Academic Year First</option>
                ) : filteredExams.length === 0 ? (
                  <option value="">No Exams Available</option>
                ) : (
                  <>
                    <option value="">Select Exam</option>
                    {filteredExams.map((e) => <option key={e._id} value={e._id}>{e.examName}</option>)}
                  </>
                )}
              </select>

              <select value={filterClass} onChange={(e) => handleClassChange(e.target.value)}
                disabled={!filterExam}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer disabled:bg-slate-50 disabled:text-slate-500">
                {!filterExam ? (
                  <option value="">Select Exam First</option>
                ) : (
                  <>
                    <option value="">Select Class</option>
                    {classes.map((c) => <option key={c._id} value={c.className}>{c.className}</option>)}
                  </>
                )}
              </select>

              <select value={filterSection} onChange={(e) => handleSectionChange(e.target.value)}
                disabled={!filterClass || classSections.length === 0}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer disabled:bg-slate-50 disabled:text-slate-500">
                {!filterClass ? (
                  <option value="">Select Class First</option>
                ) : classSections.length === 0 ? (
                  <option value="">No Sections Available</option>
                ) : (
                  <>
                    <option value="">Select Section</option>
                    {classSections.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.sectionName}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loaded && fetchData()}
                  placeholder="Search student…"
                  disabled={!loaded}
                  className="h-11 w-52 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 disabled:opacity-60" />
              </div>
              <button onClick={fetchData} disabled={!loaded}
                className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                <RefreshCw size={16} />
              </button>
              <button onClick={exportCSV} disabled={!loaded}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                <Download size={16} /> Export
              </button>
            </div>
          </div>

          <div className="border-b border-slate-100 p-4">
            <button onClick={handleLoad} disabled={resultsLoading}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
              {resultsLoading ? <Loader2 className="animate-spin" size={16} /> : <Users size={16} />}
              Load Students
            </button>
          </div>

          {/* Results table area */}
          {!loaded ? (
            <div className="p-12 text-center">
              <BarChart2 className="mx-auto mb-4 text-slate-300" size={40} />
              <h3 className="text-lg font-semibold text-slate-950">No Results Loaded</h3>
              <p className="mt-2 text-sm text-slate-500">Select Academic Year, Exam, Class, and Section, then click Load Students.</p>
            </div>
          ) : resultsLoading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm font-medium text-slate-500">
              <Loader2 className="animate-spin" size={18} /> Loading results…
            </div>
          ) : marksStudents.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto mb-4 text-slate-300" size={40} />
              <h3 className="text-lg font-semibold text-slate-950">No Students Found</h3>
              <p className="mt-2 text-sm text-slate-500">No students found for selected class and section.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart2 className="mx-auto mb-4 text-slate-300" size={40} />
              <h3 className="text-lg font-semibold text-slate-950">No Marks Available</h3>
              <p className="mt-2 text-sm text-slate-500">No marks available for this examination.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    {["Rank","Adm. No","Student Name","Class / Sec","Total","Obtained","%","Grade","Division","Status","Actions"].map((h) => (
                      <th key={h} className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 ${h === "Actions" ? "text-right" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r) => (
                    <tr key={r._id} className={`transition hover:bg-slate-50/80 ${r.resultStatus === "FAIL" ? "bg-red-50/40" : ""}`}>
                      <td className="px-4 py-3">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold
                          ${r.rank === 1 ? "bg-amber-100 text-amber-700" : r.rank === 2 ? "bg-slate-200 text-slate-700" : r.rank === 3 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}`}>
                          {r.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{r.student?.admissionNo || "—"}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-950">{fmtName(r)}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{r.className} · {r.section}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{r.totalMaxMarks}</td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-950">{r.totalMarksObtained}</td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-950">{r.percentage?.toFixed(1)}%</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${GRADE_BADGE[r.grade] || "bg-slate-100 text-slate-600"}`}>
                          {r.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{r.division || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold
                          ${r.resultStatus === "PASS" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                          {r.resultStatus === "PASS" ? <CheckCircle size={11} /> : <XCircle size={11} />}
                          {r.resultStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setViewModal(r)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                            <Eye size={12} /> View
                          </button>
                          {!r.isPublished && (
                            <button onClick={() => handlePublish(r)} disabled={resultsSaving}
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60">
                              <Send size={12} /> Publish
                            </button>
                          )}
                          {r.isPublished && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle size={12} /> Published
                            </span>
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

      {/* View Result Modal */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-950">Result Detail</h2>
              <button onClick={() => setViewModal(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 text-2xl font-bold">
                  {viewModal.student?.firstName?.[0]}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-950">{fmtName(viewModal)}</p>
                  <p className="text-sm text-slate-500">{viewModal.className} · Section {viewModal.section} · Rank #{viewModal.rank}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Total Marks</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">{viewModal.totalMaxMarks}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Obtained</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">{viewModal.totalMarksObtained}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Percentage</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">{viewModal.percentage?.toFixed(2)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`flex-1 rounded-xl border py-2 text-center text-sm font-bold ${GRADE_BADGE[viewModal.grade] || "bg-slate-100"}`}>
                  Grade: {viewModal.grade}
                </span>
                <span className={`flex-1 rounded-xl py-2 text-center text-sm font-bold ${viewModal.resultStatus === "PASS" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {viewModal.resultStatus}
                </span>
                <span className="flex-1 rounded-xl bg-slate-100 py-2 text-center text-sm font-semibold text-slate-700">
                  {viewModal.division} Division
                </span>
              </div>
              {viewModal.subjectResults?.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-bold text-slate-950">Subject-wise Performance</h3>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-2.5 text-xs font-semibold text-slate-500">Subject</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-center">Max</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-center">Obtained</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-center">Grade</th>
                          <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 text-center">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewModal.subjectResults.map((sr, i) => (
                          <tr key={i} className={sr.isAbsent ? "bg-slate-50" : !sr.isPassed ? "bg-red-50/50" : ""}>
                            <td className="px-4 py-2.5 text-sm font-medium text-slate-700">{sr.subjectName}</td>
                            <td className="px-4 py-2.5 text-center text-sm text-slate-600">{sr.maxMarks}</td>
                            <td className="px-4 py-2.5 text-center text-sm font-bold text-slate-950">{sr.isAbsent ? "AB" : sr.marksObtained}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`text-xs font-bold ${GRADE_BADGE[sr.grade] ? "" : ""}`}>{sr.grade}</span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {sr.isAbsent ? <span className="text-xs text-slate-500">Absent</span> :
                               sr.isPassed ? <CheckCircle size={14} className="mx-auto text-emerald-600" /> :
                               <XCircle size={14} className="mx-auto text-red-600" />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ExamResultsPage;
