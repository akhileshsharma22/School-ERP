import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Loader2,
  Filter,
  CheckCircle,
  XCircle,
  TrendingUp,
  History,
  Info,
  Calendar,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  fetchPromotionCandidates,
  promoteCandidate,
  bulkPromote,
  fetchPromotionHistory,
} from "../../redux/slices/promotionSlice";
import { fetchAcademicYears } from "../../redux/slices/academicYearSlice";
import { fetchAllClasses } from "../../redux/slices/classSectionSlice";

const PromotionPage = () => {
  const dispatch = useDispatch();

  const { candidates, historyLogs, loading, saving } = useSelector((state) => state.promotions);
  const { academicYears } = useSelector((state) => state.academicYear);
  const { classes } = useSelector((state) => state.classSections);

  // Filter states
  const [academicYearId, setAcademicYearId] = useState("");
  const [className, setClassName] = useState("");
  const [sectionName, setSectionName] = useState("");

  // Tabs toggle: workspace vs logs history
  const [viewMode, setViewMode] = useState("workspace"); // 'workspace' | 'history'

  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Confirm Bulk Promotion Modal
  const [bulkPromoteModal, setBulkPromoteModal] = useState(false);
  const [targetAcademicYearId, setTargetAcademicYearId] = useState("");
  const [targetSectionName, setTargetSectionName] = useState("");

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchAllClasses());
  }, [dispatch]);

  useEffect(() => {
    if (viewMode === "history") {
      dispatch(fetchPromotionHistory());
    }
  }, [dispatch, viewMode]);

  const handleLoadCandidates = () => {
    if (!academicYearId || !className || !sectionName) {
      toast.error("Please select Academic Year, Class, and Section.");
      return;
    }
    dispatch(fetchPromotionCandidates({ academicYearId, className, sectionName }));
    setSelectedIds([]);
  };

  // Target next class calculator helper
  const nextClassDisplay = useMemo(() => {
    if (!className) return "—";
    if (className === "Class 12") return "Passed Out";
    const num = parseInt(className.replace(/[^0-9]/g, ""), 10);
    return !isNaN(num) ? `Class ${num + 1}` : className;
  }, [className]);

  const activeSections = useMemo(() => {
    const cls = classes.find((c) => c.className === className);
    return cls ? cls.sections : [];
  }, [classes, className]);

  // Handle single promote click
  const handleSinglePromote = async (student) => {
    if (!student.isEligible) {
      toast.error(`Student is not eligible for promotion: ${student.reason}`);
      return;
    }

    // Default next academic year to the first active year that is after current year
    const targetYear = academicYears.find((y) => y._id !== academicYearId) || academicYears[0];

    const confirmMsg = `Promote ${student.firstName} to ${student.nextClass}?`;
    if (window.confirm(confirmMsg)) {
      const result = await dispatch(
        promoteCandidate({
          id: student._id,
          data: {
            targetAcademicYearId: targetYear?._id,
            targetSection: student.sectionName,
          },
        })
      );

      if (promoteCandidate.fulfilled.match(result)) {
        toast.success("Promotion completed successfully!");
        handleLoadCandidates();
      } else {
        toast.error(result.payload || "Promotion failed.");
      }
    }
  };

  // Bulk promote selectors
  const eligibleCandidates = useMemo(() => {
    return candidates.filter((c) => c.isEligible);
  }, [candidates]);

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllEligible = (e) => {
    if (e.target.checked) {
      setSelectedIds(eligibleCandidates.map((c) => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleOpenBulkModal = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one eligible student.");
      return;
    }
    // Set target values default
    const nextYear = academicYears.find((y) => y._id !== academicYearId) || academicYears[0];
    setTargetAcademicYearId(nextYear?._id || "");
    setTargetSectionName(sectionName);
    setBulkPromoteModal(true);
  };

  const submitBulkPromote = async (e) => {
    e.preventDefault();
    if (!targetAcademicYearId || !targetSectionName) {
      toast.error("Please fill in target credentials.");
      return;
    }

    const result = await dispatch(
      bulkPromote({
        studentIds: selectedIds,
        targetAcademicYearId,
        targetSection: targetSectionName,
      })
    );

    if (bulkPromote.fulfilled.match(result)) {
      toast.success("Batch promotion completed successfully!");
      setBulkPromoteModal(false);
      handleLoadCandidates();
    } else {
      toast.error(result.payload || "Bulk promotion failed.");
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        
        {/* Header */}
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Students
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              Promotion Management
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Promote students to next academic session based on final examination results.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("workspace")}
              className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold transition cursor-pointer ${
                viewMode === "workspace"
                  ? "bg-slate-950 text-white shadow-sm"
                  : "bg-white border text-slate-600 hover:bg-slate-50"
              }`}
            >
              <TrendingUp size={14} /> Workspace
            </button>
            <button
              onClick={() => setViewMode("history")}
              className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold transition cursor-pointer ${
                viewMode === "history"
                  ? "bg-slate-950 text-white shadow-sm"
                  : "bg-white border text-slate-600 hover:bg-slate-50"
              }`}
            >
              <History size={14} /> Promotion Logs
            </button>
          </div>
        </header>

        {/* WORKSPACE VIEW */}
        {viewMode === "workspace" && (
          <div className="space-y-6">
            
            {/* Filter toolbar */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Academic Year */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Current Academic Year</label>
                  <select
                    value={academicYearId}
                    onChange={(e) => setAcademicYearId(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map((y) => (
                      <option key={y._id} value={y._id}>
                        {y.name} {y.isCurrent ? "(Current)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Current Class</label>
                  <select
                    value={className}
                    onChange={(e) => {
                      setClassName(e.target.value);
                      setSectionName("");
                    }}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls.className}>
                        {cls.className}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Section</label>
                  <select
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    disabled={!className}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white disabled:opacity-60"
                  >
                    <option value="">Select Section</option>
                    {activeSections.map((sec) => (
                      <option key={sec._id} value={sec.sectionName}>
                        {sec.sectionName}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  onClick={handleLoadCandidates}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Load Promotion Candidates
                </button>
              </div>
            </section>

            {/* Candidates Table */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 p-4 gap-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Info size={16} className="text-slate-400" /> Target Next Class: **{nextClassDisplay}**
                </span>
                
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleOpenBulkModal}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                  >
                    Bulk Promote Selected ({selectedIds.length})
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center p-12 text-sm font-medium text-slate-400">
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Evaluating promotion eligibilities...
                </div>
              ) : candidates.length === 0 ? (
                <div className="p-12 text-center">
                  <h3 className="text-sm font-bold text-slate-900">No candidates loaded</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select academic filters above and click Load to pull candidate scorecards.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[950px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/85">
                        <th className="px-4 py-3.5 w-10">
                          <input
                            type="checkbox"
                            checked={selectedIds.length === eligibleCandidates.length && eligibleCandidates.length > 0}
                            onChange={handleSelectAllEligible}
                            className="rounded border-slate-300 text-blue-600"
                          />
                        </th>
                        <th className="px-4 py-3.5 text-xs font-semibold uppercase text-slate-500">Student Name</th>
                        <th className="px-4 py-3.5 text-xs font-semibold uppercase text-slate-500">Student ID</th>
                        <th className="px-4 py-3.5 text-xs font-semibold uppercase text-slate-500 text-right">Exam %</th>
                        <th className="px-4 py-3.5 text-xs font-semibold uppercase text-slate-500 text-right">Result Status</th>
                        <th className="px-4 py-3.5 text-xs font-semibold uppercase text-slate-500 text-center">Eligibility</th>
                        <th className="px-4 py-3.5 text-xs font-semibold uppercase text-slate-500">Next Class Target</th>
                        <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase text-slate-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {candidates.map((cand) => (
                        <tr key={cand._id} className="transition hover:bg-slate-50/50">
                          <td className="px-4 py-3.5">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(cand._id)}
                              onChange={() => handleSelectRow(cand._id)}
                              disabled={!cand.isEligible}
                              className="rounded border-slate-300 text-blue-600 disabled:opacity-40"
                            />
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-900">
                            {cand.firstName} {cand.lastName}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-700">{cand.studentId}</td>
                          <td className="px-4 py-3.5 text-right font-bold text-slate-800">{cand.finalPercentage}%</td>
                          <td className="px-4 py-3.5 text-right">
                            <span className={`px-2 py-0.5 rounded font-bold ${
                              cand.resultStatus === "PASS"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}>
                              {cand.resultStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex flex-col items-center">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 font-bold ${
                                  cand.isEligible
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : "bg-rose-50 text-rose-700 border border-rose-100"
                                }`}
                              >
                                {cand.isEligible ? "Eligible" : "Not Eligible"}
                              </span>
                              {cand.reason && (
                                <span className="text-[10px] text-slate-400 mt-1 block max-w-[180px] truncate" title={cand.reason}>
                                  {cand.reason}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-800 flex items-center gap-1">
                            {cand.currentClass} <ChevronRight size={12} className="text-slate-400" /> {cand.nextClass}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleSinglePromote(cand)}
                              disabled={!cand.isEligible}
                              className={`inline-flex h-8 items-center justify-center rounded px-3 text-xs font-bold cursor-pointer ${
                                cand.isEligible
                                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                  : "bg-slate-100 text-slate-400 cursor-not-allowed border"
                              }`}
                            >
                              Promote
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

          </div>
        )}

        {/* PROMOTION LOGS HISTORY VIEW */}
        {viewMode === "history" && (
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
            {loading ? (
              <div className="flex items-center justify-center p-12 text-sm font-medium text-slate-500">
                <Loader2 className="animate-spin mr-2" size={16} />
                Loading promotion history...
              </div>
            ) : historyLogs.length === 0 ? (
              <div className="p-12 text-center">
                <h3 className="text-sm font-bold text-slate-900">No promotion logs found</h3>
                <p className="text-xs text-slate-400 mt-1">No batch promotions have been run in this term.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead>
                    <tr className="border-b bg-slate-50/80">
                      <th className="px-5 py-4 text-xs font-bold text-slate-500">Student Name / ID</th>
                      <th className="px-5 py-4 text-xs font-bold text-slate-500">Session Year</th>
                      <th className="px-5 py-4 text-xs font-bold text-slate-500">Source Class</th>
                      <th className="px-5 py-4 text-xs font-bold text-slate-500">Promoted Target</th>
                      <th className="px-5 py-4 text-xs font-bold text-slate-500 text-right">Score</th>
                      <th className="px-5 py-4 text-xs font-bold text-slate-500 text-right">Log Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {historyLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="font-bold text-slate-950">{log.studentName}</p>
                            <span className="text-[10px] font-mono text-slate-400">{log.studentId}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">{log.academicYear}</td>
                        <td className="px-5 py-3.5">{log.previousClass}</td>
                        <td className="px-5 py-3.5 font-bold text-emerald-700">{log.newClass}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-800">{log.finalPercentage}% ({log.resultStatus})</td>
                        <td className="px-5 py-3.5 text-right text-slate-500">{new Date(log.promotionDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

      </div>

      {/* CONFIRM BULK PROMOTION MODAL */}
      {bulkPromoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-1.5 text-emerald-800">
              <ShieldCheck size={20} /> Confirm Batch Promotion
            </h2>

            <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3 flex gap-2">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 leading-4">
                You are promoting **{selectedIds.length}** eligible students to next class levels. Confirm academic year configuration below.
              </p>
            </div>

            <form onSubmit={submitBulkPromote} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600">Select Target Academic Year</label>
                <select
                  value={targetAcademicYearId}
                  onChange={(e) => setTargetAcademicYearId(e.target.value)}
                  required
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map((y) => (
                    <option key={y._id} value={y._id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600">Assign Target Section *</label>
                <input
                  value={targetSectionName}
                  onChange={(e) => setTargetSectionName(e.target.value)}
                  required
                  placeholder="e.g. A"
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setBulkPromoteModal(false)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                >
                  {saving && <Loader2 className="animate-spin" size={12} />}
                  Confirm Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default PromotionPage;
