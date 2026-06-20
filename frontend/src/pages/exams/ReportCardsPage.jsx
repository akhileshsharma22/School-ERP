import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FileText, Printer, Eye, Loader2, RefreshCw,
  QrCode, GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { fetchExams, fetchResults } from "../../redux/slices/examSlice";
import { fetchAcademicYears } from "../../redux/slices/academicYearSlice";
import { fetchAllClasses } from "../../redux/slices/classSectionSlice";

const SCHOOL_NAME = "Springfield International School";

const ReportCardPreview = ({ result, exam, onClose }) => {
  const student = result.student;
  const name = student ? `${student.firstName} ${student.lastName}` : "—";

  const GRADE_COLORS_RC = {
    A1: "#10b981", A2: "#22c55e", B1: "#3b82f6", B2: "#60a5fa",
    C1: "#f59e0b", C2: "#fbbf24", D: "#f97316", F: "#ef4444",
  };

  const handlePrint = () => {
    const printContent = document.getElementById("report-card-print-area");
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Report Card - ${name}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
        th { background: #f8fafc; font-weight: 600; font-size: 12px; }
        .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px; }
        .school-name { font-size: 24px; font-weight: bold; color: #1e293b; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
        @media print { body { margin: 0; padding: 10px; } }
      </style></head><body>
      ${printContent.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[94vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 className="text-lg font-bold text-slate-950">Report Card Preview</h2>
          <div className="flex gap-3">
            <button onClick={handlePrint}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">✕</button>
          </div>
        </div>

        <div id="report-card-print-area" className="p-6">
          {/* School header */}
          <div className="border-b-2 border-slate-900 pb-5 text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-950 text-white">
                <GraduationCap size={26} />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-black text-slate-950">{SCHOOL_NAME}</h1>
                <p className="text-xs text-slate-500">Affiliated to CBSE · Estd. 1995</p>
              </div>
            </div>
            <div className="mt-3 inline-block rounded-xl bg-slate-950 px-5 py-2">
              <p className="text-xs font-bold uppercase tracking-widest text-white">Report Card</p>
            </div>
          </div>

          {/* Student info */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {[
                ["Student Name", name],
                ["Admission No", student?.admissionNo || "—"],
                ["Class", result.className],
                ["Section", result.section],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2 text-sm">
                  <span className="w-32 font-semibold text-slate-500">{k}:</span>
                  <span className="font-bold text-slate-950">{v}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[
                ["Exam", exam?.examName || "—"],
                ["Rank", `#${result.rank}`],
                ["Division", result.division || "—"],
                ["Result", result.resultStatus],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2 text-sm">
                  <span className="w-32 font-semibold text-slate-500">{k}:</span>
                  <span className={`font-bold ${k === "Result" ? (result.resultStatus === "PASS" ? "text-emerald-700" : "text-red-700") : "text-slate-950"}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject marks table */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-bold text-slate-950">Subject-wise Performance</h3>
            <table className="w-full border-collapse rounded-xl overflow-hidden border border-slate-200">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-4 py-3 text-xs font-semibold text-left">Subject</th>
                  <th className="px-4 py-3 text-xs font-semibold text-center">Max Marks</th>
                  <th className="px-4 py-3 text-xs font-semibold text-center">Marks Obtained</th>
                  <th className="px-4 py-3 text-xs font-semibold text-center">Grade</th>
                  <th className="px-4 py-3 text-xs font-semibold text-center">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.subjectResults?.map((sr, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{sr.subjectName}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{sr.maxMarks}</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-slate-950">
                      {sr.isAbsent ? "AB" : sr.marksObtained}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block rounded-full px-3 py-0.5 text-xs font-bold"
                        style={{ background: `${GRADE_COLORS_RC[sr.grade]}20`, color: GRADE_COLORS_RC[sr.grade] || "#64748b" }}>
                        {sr.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-semibold">
                      {sr.isAbsent ? <span className="text-slate-500">Absent</span>
                       : sr.isPassed ? <span className="text-emerald-700">Pass</span>
                       : <span className="text-red-700">Fail</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100">
                  <td className="px-4 py-3 text-sm font-bold text-slate-950">TOTAL</td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-slate-950">{result.totalMaxMarks}</td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-slate-950">{result.totalMarksObtained}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-black"
                      style={{ color: GRADE_COLORS_RC[result.grade] || "#64748b" }}>{result.grade}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-bold ${result.resultStatus === "PASS" ? "text-emerald-700" : "text-red-700"}`}>
                      {result.resultStatus}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Summary stats */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">Percentage</p>
              <p className="mt-1 text-xl font-black text-slate-950">{result.percentage?.toFixed(2)}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">Class Rank</p>
              <p className="mt-1 text-xl font-black text-slate-950">#{result.rank}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">Division</p>
              <p className="mt-1 text-xl font-black text-slate-950">{result.division || "—"}</p>
            </div>
          </div>

          {/* Signatures & QR */}
          <div className="flex items-end justify-between border-t border-slate-200 pt-5">
            <div className="text-center">
              <div className="mb-2 h-10 border-b border-slate-400"></div>
              <p className="text-xs font-semibold text-slate-500">Class Teacher</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400">
                <QrCode size={28} />
              </div>
              <p className="text-xs text-slate-400">Verify Online</p>
            </div>
            <div className="text-center">
              <div className="mb-2 h-10 border-b border-slate-400"></div>
              <p className="text-xs font-semibold text-slate-500">Principal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportCardsPage = () => {
  const dispatch = useDispatch();
  const { exams, results, resultsLoading } = useSelector((s) => s.exams);
  const { academicYears } = useSelector((s) => s.academicYear);
  const { classes } = useSelector((s) => s.classSections);

  const [filterAY, setFilterAY] = useState("");
  const [filterExam, setFilterExam] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [previewResult, setPreviewResult] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchAllClasses());
    dispatch(fetchExams({ limit: 100 }));
  }, [dispatch]);

  const fetchData = () => {
    const params = { isPublished: "true" };
    if (filterAY) params.academicYear = filterAY;
    if (filterExam) params.exam = filterExam;
    if (filterClass) params.className = filterClass;
    if (filterSection) params.section = filterSection;
    dispatch(fetchResults(params));
  };

  useEffect(() => { fetchData(); }, [filterAY, filterExam, filterClass, filterSection]);

  const classSections = useMemo(() => {
    const cls = classes.find((c) => c.className === filterClass);
    return cls?.sections?.map((s) => (typeof s === "string" ? s : s.name)) || [];
  }, [classes, filterClass]);

  const selectedExam = useMemo(() => exams.find((e) => e._id === filterExam), [exams, filterExam]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleBulkPrint = () => {
    const selected = results.filter((r) => selectedIds.includes(r._id));
    if (!selected.length) return toast.error("No report cards selected");
    toast.success(`Printing ${selected.length} report cards…`);
    // In production: generate bulk PDF
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Examinations</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">Report Cards</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Generate and print professional report cards for published results.
            </p>
          </div>
          <div className="flex gap-3">
            {selectedIds.length > 0 && (
              <button onClick={handleBulkPrint}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                <Printer size={18} /> Print Selected ({selectedIds.length})
              </button>
            )}
          </div>
        </header>

        {/* Filters */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Academic Year</label>
              <select value={filterAY} onChange={(e) => setFilterAY(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="">All Years</option>
                {academicYears.map((ay) => <option key={ay._id} value={ay._id}>{ay.name || ay.label || ay.year}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Exam</label>
              <select value={filterExam} onChange={(e) => setFilterExam(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="">All Exams</option>
                {exams.map((e) => <option key={e._id} value={e._id}>{e.examName}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Class</label>
              <select value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setFilterSection(""); }}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="">All Classes</option>
                {classes.map((c) => <option key={c._id} value={c.className}>{c.className}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Section</label>
              <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="">All Sections</option>
                {classSections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={fetchData}
              className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </section>

        {/* Info card */}
        <section className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
          <div className="flex gap-3">
            <FileText className="text-blue-600 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-slate-600">
              Only <strong>published results</strong> appear here. Compute and publish results first from the Results page.
            </p>
          </div>
        </section>

        {/* Student grid */}
        {resultsLoading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm font-medium text-slate-500">
            <Loader2 className="animate-spin" size={18} /> Loading report cards…
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <FileText className="mx-auto mb-4 text-slate-300" size={40} />
            <h3 className="text-lg font-semibold text-slate-950">No Published Results</h3>
            <p className="mt-2 text-sm text-slate-500">Publish results first, then generate report cards here.</p>
          </div>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <p className="text-sm font-semibold text-slate-950">{results.length} published result{results.length !== 1 ? "s" : ""}</p>
              <div className="flex gap-2">
                <button onClick={() => setSelectedIds(results.map((r) => r._id))}
                  className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Select All
                </button>
                <button onClick={() => setSelectedIds([])}
                  className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Clear
                </button>
              </div>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((result) => {
                const student = result.student;
                const name = student ? `${student.firstName} ${student.lastName}` : "—";
                const selected = selectedIds.includes(result._id);
                return (
                  <div key={result._id}
                    className={`group relative cursor-pointer rounded-2xl border p-4 transition ${selected ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900 ring-offset-1" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"}`}
                    onClick={() => toggleSelect(result._id)}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-600">
                        {name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">{name}</p>
                        <p className="text-xs text-slate-500">{student?.admissionNo} · {result.className} {result.section}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`text-xs font-bold ${result.resultStatus === "PASS" ? "text-emerald-700" : "text-red-700"}`}>
                            {result.resultStatus}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs font-bold text-slate-950">{result.percentage?.toFixed(1)}%</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs font-semibold text-slate-500">#{result.rank}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewResult(result); }}
                      className="absolute right-3 top-3 hidden group-hover:flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                      <Eye size={12} /> Preview
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {previewResult && (
        <ReportCardPreview
          result={previewResult}
          exam={selectedExam}
          onClose={() => setPreviewResult(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default ReportCardsPage;
