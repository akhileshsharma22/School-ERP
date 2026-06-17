import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  ClipboardList,
  Download,
  Edit3,
  Info,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { toast } from "sonner";

import DashboardLayout from "../../layouts/DashboardLayout";
import ExamTypeModal from "../../components/masterSetup/ExamTypeModal";

import {
  createExamType,
  deleteExamType,
  fetchAllExamTypes,
  updateExamType,
} from "../../redux/slices/examTypeSlice";

const WEIGHTAGE_COLORS = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  high: "border-rose-200 bg-rose-50 text-rose-700",
};

const getWeightageColor = (weightage) => {
  if (weightage <= 15) return WEIGHTAGE_COLORS.low;
  if (weightage <= 35) return WEIGHTAGE_COLORS.medium;
  return WEIGHTAGE_COLORS.high;
};

const SummaryCard = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
    <p className="text-sm font-medium text-slate-500">
      {label}
    </p>

    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
      {value}
    </p>

    {helper && (
      <p className="mt-2 text-xs font-medium text-slate-400">
        {helper}
      </p>
    )}
  </div>
);

const ExamTypesPage = () => {
  const dispatch = useDispatch();

  const {
    examTypes,
    loading,
    saving,
    deletingId,
  } = useSelector((state) => state.examTypes);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExamType, setEditingExamType] =
    useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchAllExamTypes());
  }, [dispatch]);

  const summary = useMemo(() => {
    const totalExamTypes = examTypes.length;
    const totalWeightage = examTypes.reduce(
      (total, et) =>
        total + (et.weightage || 0),
      0
    );
    const totalClassAssignments = examTypes.reduce(
      (total, et) =>
        total +
        (et.applicableClasses?.length || 0),
      0
    );

    return {
      totalExamTypes,
      totalWeightage,
      totalClassAssignments,
      avgWeightage: totalExamTypes
        ? (
            totalWeightage / totalExamTypes
          ).toFixed(1)
        : "0.0",
    };
  }, [examTypes]);

  const filteredExamTypes = useMemo(() => {
    return [...examTypes]
      .filter((et) => {
        const query = searchTerm
          .trim()
          .toLowerCase();

        if (!query) return true;

        return (
          et.examName
            ?.toLowerCase()
            .includes(query) ||
          et.examCode
            ?.toLowerCase()
            .includes(query)
        );
      })
      .sort((a, b) =>
        a.examName.localeCompare(b.examName)
      );
  }, [examTypes, searchTerm]);

  const openCreateModal = () => {
    setEditingExamType(null);
    setModalOpen(true);
  };

  const openEditModal = (examType) => {
    setEditingExamType(examType);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingExamType(null);
  };

  const handleSave = async (payload) => {
    const action = editingExamType
      ? updateExamType({
          id: editingExamType._id,
          data: payload,
        })
      : createExamType(payload);

    const result = await dispatch(action);

    if (
      createExamType.fulfilled.match(result) ||
      updateExamType.fulfilled.match(result)
    ) {
      toast.success(
        editingExamType
          ? "Exam type updated successfully"
          : "Exam type created successfully"
      );
      closeModal();
      dispatch(fetchAllExamTypes());
      return;
    }

    toast.error(
      result.payload ||
        "Unable to save exam type"
    );
  };

  const permanentlyDeleteExamType = async (
    examType
  ) => {
    const result = await dispatch(
      deleteExamType(examType._id)
    );

    if (
      deleteExamType.fulfilled.match(result)
    ) {
      toast.success(
        "Exam type deleted permanently"
      );
      return;
    }

    toast.error(
      result.payload ||
        "Unable to delete exam type"
    );
  };

  const handleDelete = (examType) => {
    toast("Delete exam type permanently?", {
      description: `${examType.examName} will be permanently removed.`,
      action: {
        label: "Delete",
        onClick: () =>
          permanentlyDeleteExamType(examType),
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  const handleExport = () => {
    const rows = filteredExamTypes.map(
      (et) => ({
        "Exam Name": et.examName,
        Code: et.examCode,
        "Weightage (%)": et.weightage,
        "Applicable Classes":
          (et.applicableClasses || [])
            .map((c) => c.className)
            .join(" | "),
      })
    );

    const headers = Object.keys(
      rows[0] || {
        "Exam Name": "",
        Code: "",
        "Weightage (%)": "",
        "Applicable Classes": "",
      }
    );

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) =>
            `"${String(
              row[header] ?? ""
            ).replace(/"/g, '""')}"`
          )
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "exam-types.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Master Setup
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              Exam Types
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Configure examination architecture with weightage and class mapping.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            <Plus size={18} />
            Add Exam Type
          </button>
        </header>

        <section className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <Info size={20} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Exam types are the backbone of examination architecture
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Each exam type carries a weightage percentage used in marks entry, report card generation, and result computation. Ensure total weightage across all types sums to 100% for accurate grading.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Exam Types"
            value={summary.totalExamTypes}
            helper="Configured examination types"
          />
          <SummaryCard
            label="Total Weightage"
            value={`${summary.totalWeightage}%`}
            helper={
              summary.totalWeightage === 100
                ? "✓ Perfectly balanced"
                : summary.totalWeightage > 100
                  ? "⚠ Exceeds 100%"
                  : `${100 - summary.totalWeightage}% remaining`
            }
          />
          <SummaryCard
            label="Avg Weightage"
            value={`${summary.avgWeightage}%`}
            helper="Average per exam type"
          />
          <SummaryCard
            label="Class Assignments"
            value={summary.totalClassAssignments}
            helper="Total class-exam mappings"
          />
        </section>

        {summary.totalWeightage > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                Weightage Distribution
              </p>

              <p
                className={`text-sm font-bold ${
                  summary.totalWeightage === 100
                    ? "text-emerald-600"
                    : summary.totalWeightage > 100
                      ? "text-rose-600"
                      : "text-amber-600"
                }`}
              >
                {summary.totalWeightage}% / 100%
              </p>
            </div>

            <div className="mt-3 flex h-4 overflow-hidden rounded-full bg-slate-100">
              {examTypes.map((et, index) => {
                const colors = [
                  "bg-blue-500",
                  "bg-violet-500",
                  "bg-emerald-500",
                  "bg-amber-500",
                  "bg-rose-500",
                  "bg-cyan-500",
                  "bg-indigo-500",
                  "bg-pink-500",
                ];

                return (
                  <div
                    key={et._id}
                    className={`${
                      colors[index % colors.length]
                    } transition-all`}
                    style={{
                      width: `${Math.min(
                        et.weightage,
                        100
                      )}%`,
                    }}
                    title={`${et.examName}: ${et.weightage}%`}
                  />
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              {examTypes.map((et, index) => {
                const dotColors = [
                  "bg-blue-500",
                  "bg-violet-500",
                  "bg-emerald-500",
                  "bg-amber-500",
                  "bg-rose-500",
                  "bg-cyan-500",
                  "bg-indigo-500",
                  "bg-pink-500",
                ];

                return (
                  <div
                    key={et._id}
                    className="flex items-center gap-2 text-xs font-medium text-slate-600"
                  >
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${
                        dotColors[
                          index %
                            dotColors.length
                        ]
                      }`}
                    />
                    {et.examName} ({et.weightage}
                    %)
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />

              <input
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search exam name or code"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Download size={16} />
              Export
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm font-medium text-slate-500">
              <Loader2
                className="animate-spin"
                size={18}
              />
              Loading exam types
            </div>
          ) : filteredExamTypes.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-slate-950">
                No exam types found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Add exam types like Unit Test, Mid Term, Final Term with weightage.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Exam Type
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Code
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Weightage
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Classes
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredExamTypes.map(
                    (examType) => (
                      <tr
                        key={examType._id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                              <ClipboardList
                                size={16}
                              />
                            </div>
                            <p className="text-sm font-semibold text-slate-950">
                              {examType.examName}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                            {examType.examCode}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getWeightageColor(
                                examType.weightage
                              )}`}
                            >
                              {examType.weightage}
                              %
                            </span>

                            <div className="hidden h-2 w-20 overflow-hidden rounded-full bg-slate-100 sm:block">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  examType.weightage >
                                  50
                                    ? "bg-rose-500"
                                    : examType.weightage >
                                        25
                                      ? "bg-amber-500"
                                      : "bg-emerald-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    examType.weightage,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {examType.applicableClasses
                              ?.slice(0, 4)
                              .map((cls) => (
                                <span
                                  key={
                                    cls._id ||
                                    cls.classId
                                  }
                                  className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600"
                                >
                                  {cls.className}
                                </span>
                              ))}
                            {(examType
                              .applicableClasses
                              ?.length || 0) >
                              4 && (
                              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                                +
                                {examType
                                  .applicableClasses
                                  .length -
                                  4}{" "}
                                more
                              </span>
                            )}
                            {(!examType.applicableClasses ||
                              examType
                                .applicableClasses
                                .length ===
                                0) && (
                              <span className="text-xs font-medium text-slate-400">
                                All classes
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  examType
                                )
                              }
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950"
                            >
                              <Edit3
                                size={16}
                              />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  examType
                                )
                              }
                              disabled={
                                deletingId ===
                                examType._id
                              }
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId ===
                              examType._id ? (
                                <Loader2
                                  className="animate-spin"
                                  size={16}
                                />
                              ) : (
                                <Trash2
                                  size={16}
                                />
                              )}
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <ExamTypeModal
        open={modalOpen}
        mode={
          editingExamType ? "edit" : "create"
        }
        initialData={editingExamType}
        loading={saving}
        onClose={closeModal}
        onSave={handleSave}
      />
    </DashboardLayout>
  );
};

export default ExamTypesPage;
