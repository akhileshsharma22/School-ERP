import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Trash2, Save, Loader2, Info, Settings } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { fetchGradeConfig, saveGradeConfig } from "../../redux/slices/examSlice";
import { fetchAcademicYears } from "../../redux/slices/academicYearSlice";

const DEFAULT_GRADES = [
  { grade: "A1", minPercent: 91, maxPercent: 100, gradePoints: 10, remark: "Outstanding" },
  { grade: "A2", minPercent: 81, maxPercent: 90,  gradePoints: 9,  remark: "Excellent" },
  { grade: "B1", minPercent: 71, maxPercent: 80,  gradePoints: 8,  remark: "Very Good" },
  { grade: "B2", minPercent: 61, maxPercent: 70,  gradePoints: 7,  remark: "Good" },
  { grade: "C1", minPercent: 51, maxPercent: 60,  gradePoints: 6,  remark: "Average" },
  { grade: "C2", minPercent: 41, maxPercent: 50,  gradePoints: 5,  remark: "Satisfactory" },
  { grade: "D",  minPercent: 33, maxPercent: 40,  gradePoints: 4,  remark: "Below Average" },
  { grade: "F",  minPercent: 0,  maxPercent: 32,  gradePoints: 0,  remark: "Fail" },
];

const GRADE_BADGE_COLORS = {
  A1: "#10b981", A2: "#22c55e", B1: "#3b82f6", B2: "#60a5fa",
  C1: "#f59e0b", C2: "#fbbf24", D: "#f97316", F: "#ef4444",
};

const computePreviewGrade = (pct, grades) => {
  const sorted = [...grades].sort((a, b) => b.minPercent - a.minPercent);
  for (const g of sorted) {
    if (pct >= g.minPercent && pct <= g.maxPercent) return g;
  }
  return null;
};

const GradeConfigPage = () => {
  const dispatch = useDispatch();
  const { gradeConfig, gradeConfigLoading, gradeConfigSaving } = useSelector((s) => s.exams);
  const { academicYears } = useSelector((s) => s.academicYear);

  const [academicYear, setAcademicYear] = useState("");
  const [grades, setGrades] = useState(DEFAULT_GRADES);
  const [previewScore, setPreviewScore] = useState(75);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchGradeConfig({}));
  }, [dispatch]);

  useEffect(() => {
    if (gradeConfig?.grades?.length) {
      setGrades(gradeConfig.grades.map((g) => ({ ...g })));
      setIsDirty(false);
    }
  }, [gradeConfig]);

  const handleAYChange = async (ayId) => {
    setAcademicYear(ayId);
    const res = await dispatch(fetchGradeConfig(ayId ? { academicYear: ayId } : {}));
  };

  const updateGrade = (index, field, value) => {
    setGrades((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: field === "grade" || field === "remark" ? value : Number(value) };
      return next;
    });
    setIsDirty(true);
  };

  const addGrade = () => {
    setGrades((prev) => [...prev, { grade: "", minPercent: 0, maxPercent: 0, gradePoints: 0, remark: "" }]);
    setIsDirty(true);
  };

  const removeGrade = (index) => {
    setGrades((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleSave = async () => {
    // Validate
    for (const g of grades) {
      if (!g.grade?.trim()) return toast.error("Grade label cannot be empty");
      if (g.minPercent > g.maxPercent) return toast.error(`Grade ${g.grade}: min cannot exceed max`);
    }

    const res = await dispatch(saveGradeConfig({
      academicYear: academicYear || undefined,
      grades, label: academicYear ? "Custom Grading" : "Default Grading",
      isDefault: !academicYear,
    }));
    if (saveGradeConfig.fulfilled.match(res)) {
      toast.success("Grade configuration saved successfully");
      setIsDirty(false);
    } else {
      toast.error(res.payload || "Failed to save grade configuration");
    }
  };

  const resetToDefault = () => {
    setGrades(DEFAULT_GRADES.map((g) => ({ ...g })));
    setIsDirty(true);
    toast.success("Reset to CBSE default grading");
  };

  const previewGrade = computePreviewGrade(previewScore, grades);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 pb-10">
        {/* Header */}
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Examinations</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">Grade Configuration</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Configure grading thresholds for automatic grade assignment in marks entry.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={resetToDefault}
              className="h-12 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Reset to CBSE Default
            </button>
            <button onClick={handleSave} disabled={gradeConfigSaving || !isDirty}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60">
              {gradeConfigSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save Configuration
            </button>
          </div>
        </header>

        {/* Info */}
        <section className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <Info size={20} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-950">How Grade Configuration Works</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Grades are automatically calculated when marks are entered. You can configure different grading scales per academic year.
                If no year-specific config exists, the default CBSE grading (A1=91–100, A2=81–90, etc.) is applied.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Config panel */}
          <div className="lg:col-span-2 space-y-5">
            {/* Academic year selector */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
              <label className="mb-2 block text-sm font-bold text-slate-950">Academic Year (Optional)</label>
              <select value={academicYear} onChange={(e) => handleAYChange(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer">
                <option value="">Default (applies to all years)</option>
                {academicYears.map((ay) => <option key={ay._id} value={ay._id}>{ay.name || ay.label || ay.year}</option>)}
              </select>
              <p className="mt-2 text-xs text-slate-400">If a year is selected, this config overrides the default for that year only.</p>
            </section>

            {/* Grade ranges table */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="text-sm font-bold text-slate-950">Grade Ranges</h2>
                <button onClick={addGrade}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  <Plus size={14} /> Add Grade
                </button>
              </div>

              {gradeConfigLoading ? (
                <div className="flex items-center justify-center gap-3 p-10 text-sm text-slate-500">
                  <Loader2 className="animate-spin" size={18} /> Loading configuration…
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[580px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80">
                        {["Grade","Min %","Max %","Grade Points","Remark",""].map((h) => (
                          <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {grades.map((g, idx) => (
                        <tr key={idx} className="transition hover:bg-slate-50/50">
                          <td className="px-4 py-2.5">
                            <input value={g.grade} onChange={(e) => updateGrade(idx, "grade", e.target.value)}
                              className="h-9 w-16 rounded-lg border border-slate-200 px-3 text-center text-sm font-bold outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                              style={{ color: GRADE_BADGE_COLORS[g.grade] || "#64748b" }} />
                          </td>
                          <td className="px-4 py-2.5">
                            <input type="number" value={g.minPercent} min={0} max={100}
                              onChange={(e) => updateGrade(idx, "minPercent", e.target.value)}
                              className="h-9 w-20 rounded-lg border border-slate-200 px-3 text-center text-sm font-semibold outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100" />
                          </td>
                          <td className="px-4 py-2.5">
                            <input type="number" value={g.maxPercent} min={0} max={100}
                              onChange={(e) => updateGrade(idx, "maxPercent", e.target.value)}
                              className="h-9 w-20 rounded-lg border border-slate-200 px-3 text-center text-sm font-semibold outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100" />
                          </td>
                          <td className="px-4 py-2.5">
                            <input type="number" value={g.gradePoints} min={0} max={10}
                              onChange={(e) => updateGrade(idx, "gradePoints", e.target.value)}
                              className="h-9 w-16 rounded-lg border border-slate-200 px-3 text-center text-sm font-semibold outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100" />
                          </td>
                          <td className="px-4 py-2.5">
                            <input value={g.remark} onChange={(e) => updateGrade(idx, "remark", e.target.value)}
                              className="h-9 w-36 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100" />
                          </td>
                          <td className="px-4 py-2.5">
                            <button onClick={() => removeGrade(idx)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100">
                              <Trash2 size={14} />
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

          {/* Preview panel */}
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
              <h3 className="mb-4 text-sm font-bold text-slate-950">Grade Preview</h3>
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">Test Score (%)</label>
                <input type="range" min={0} max={100} value={previewScore}
                  onChange={(e) => setPreviewScore(Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer" />
                <div className="mt-2 text-center">
                  <span className="text-3xl font-black text-slate-950">{previewScore}%</span>
                </div>
              </div>
              {previewGrade ? (
                <div className="mt-4 rounded-xl p-4 text-center" style={{ background: `${GRADE_BADGE_COLORS[previewGrade.grade]}15` }}>
                  <p className="text-4xl font-black" style={{ color: GRADE_BADGE_COLORS[previewGrade.grade] || "#64748b" }}>
                    {previewGrade.grade}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{previewGrade.remark}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {previewGrade.minPercent}–{previewGrade.maxPercent}% · {previewGrade.gradePoints} points
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center">
                  <p className="text-sm text-slate-400">No matching grade</p>
                </div>
              )}
            </section>

            {/* Color legend */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
              <h3 className="mb-3 text-sm font-bold text-slate-950">Grade Legend</h3>
              <div className="space-y-2">
                {grades.map((g, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-bold w-8" style={{ color: GRADE_BADGE_COLORS[g.grade] || "#64748b" }}>
                      {g.grade}
                    </span>
                    <span className="flex-1 text-slate-500 text-xs">{g.remark}</span>
                    <span className="text-xs font-semibold text-slate-700">{g.minPercent}–{g.maxPercent}%</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GradeConfigPage;
