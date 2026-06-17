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
  BookOpen,
  Download,
  Edit3,
  Filter,
  Info,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { toast } from "sonner";

import DashboardLayout from "../../layouts/DashboardLayout";
import SubjectModal from "../../components/masterSetup/SubjectModal";

import {
  createSubject,
  deleteSubject,
  fetchAllSubjects,
  updateSubject,
} from "../../redux/slices/subjectSlice";

const SUBJECT_TYPE_COLORS = {
  Core: "border-blue-200 bg-blue-50 text-blue-700",
  Elective:
    "border-violet-200 bg-violet-50 text-violet-700",
  Language:
    "border-amber-200 bg-amber-50 text-amber-700",
  Practical:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  Optional:
    "border-slate-200 bg-slate-100 text-slate-600",
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

const SubjectsPage = () => {
  const dispatch = useDispatch();

  const { subjects, loading, saving, deletingId } =
    useSelector((state) => state.subjects);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] =
    useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  useEffect(() => {
    dispatch(fetchAllSubjects());
  }, [dispatch]);

  const summary = useMemo(() => {
    const totalSubjects = subjects.length;
    const totalAssignments = subjects.reduce(
      (total, subject) =>
        total +
        (subject.classAssignments?.length || 0),
      0
    );

    const typeCounts = {};
    for (const subject of subjects) {
      typeCounts[subject.subjectType] =
        (typeCounts[subject.subjectType] || 0) + 1;
    }

    const topType =
      Object.entries(typeCounts).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0] || "—";

    return {
      totalSubjects,
      totalAssignments,
      avgAssignments: totalSubjects
        ? (totalAssignments / totalSubjects).toFixed(
            1
          )
        : "0.0",
      topType,
    };
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    return [...subjects]
      .filter((subject) => {
        const query = searchTerm
          .trim()
          .toLowerCase();

        if (!query) return true;

        return (
          subject.subjectName
            ?.toLowerCase()
            .includes(query) ||
          subject.subjectCode
            ?.toLowerCase()
            .includes(query)
        );
      })
      .filter((subject) =>
        typeFilter === "All"
          ? true
          : subject.subjectType === typeFilter
      )
      .sort((a, b) =>
        a.subjectName.localeCompare(b.subjectName)
      );
  }, [subjects, searchTerm, typeFilter]);

  const openCreateModal = () => {
    setEditingSubject(null);
    setModalOpen(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSubject(null);
  };

  const handleSave = async (payload) => {
    const action = editingSubject
      ? updateSubject({
          id: editingSubject._id,
          data: payload,
        })
      : createSubject(payload);

    const result = await dispatch(action);

    if (
      createSubject.fulfilled.match(result) ||
      updateSubject.fulfilled.match(result)
    ) {
      toast.success(
        editingSubject
          ? "Subject updated successfully"
          : "Subject created successfully"
      );
      closeModal();
      dispatch(fetchAllSubjects());
      return;
    }

    toast.error(
      result.payload || "Unable to save subject"
    );
  };

  const permanentlyDeleteSubject = async (
    subject
  ) => {
    const result = await dispatch(
      deleteSubject(subject._id)
    );

    if (deleteSubject.fulfilled.match(result)) {
      toast.success(
        "Subject deleted permanently"
      );
      return;
    }

    toast.error(
      result.payload ||
        "Unable to delete subject"
    );
  };

  const handleDelete = (subject) => {
    toast("Delete subject permanently?", {
      description: `${subject.subjectName} will be permanently removed.`,
      action: {
        label: "Delete",
        onClick: () =>
          permanentlyDeleteSubject(subject),
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  const handleExport = () => {
    const rows = filteredSubjects.map(
      (subject) => ({
        "Subject Name": subject.subjectName,
        Code: subject.subjectCode,
        Type: subject.subjectType,
        "Classes Assigned":
          subject.classAssignments?.length || 0,
        Classes: (
          subject.classAssignments || []
        )
          .map((a) => a.className)
          .join(" | "),
      })
    );

    const headers = Object.keys(
      rows[0] || {
        "Subject Name": "",
        Code: "",
        Type: "",
        "Classes Assigned": "",
        Classes: "",
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
    link.download = "subjects.csv";
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
              Subjects
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage subjects and assign them to classes with marks configuration.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            <Plus size={18} />
            Add Subject
          </button>
        </header>

        <section className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <Info size={20} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Subjects are the foundation of academic configuration
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Subjects created here are consumed by Streams, Timetable, Exams, Marks Entry, and Report Cards. Assign each subject to classes with max & passing marks.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Subjects"
            value={summary.totalSubjects}
            helper="Configured subject records"
          />
          <SummaryCard
            label="Class Assignments"
            value={summary.totalAssignments}
            helper="Total class-subject mappings"
          />
          <SummaryCard
            label="Avg Classes/Subject"
            value={summary.avgAssignments}
            helper="Classes per subject"
          />
          <SummaryCard
            label="Top Type"
            value={summary.topType}
            helper="Most common subject type"
          />
        </section>

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
                  setSearchTerm(event.target.value)
                }
                placeholder="Search subject name or code"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Filter
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />

                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(event.target.value)
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-white pl-10 pr-8 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="All">All Types</option>
                  <option value="Core">Core</option>
                  <option value="Elective">
                    Elective
                  </option>
                  <option value="Language">
                    Language
                  </option>
                  <option value="Practical">
                    Practical
                  </option>
                  <option value="Optional">
                    Optional
                  </option>
                </select>
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
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm font-medium text-slate-500">
              <Loader2
                className="animate-spin"
                size={18}
              />
              Loading subjects
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-slate-950">
                No subjects found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Add a subject to start building the academic structure.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Subject
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Code
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Type
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
                  {filteredSubjects.map(
                    (subject) => (
                      <tr
                        key={subject._id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                              <BookOpen
                                size={16}
                              />
                            </div>
                            <p className="text-sm font-semibold text-slate-950">
                              {
                                subject.subjectName
                              }
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                          {subject.subjectCode}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                              SUBJECT_TYPE_COLORS[
                                subject
                                  .subjectType
                              ] ||
                              SUBJECT_TYPE_COLORS.Optional
                            }`}
                          >
                            {subject.subjectType}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {subject.classAssignments
                              ?.slice(0, 4)
                              .map(
                                (assignment) => (
                                  <span
                                    key={
                                      assignment._id ||
                                      assignment.classId
                                    }
                                    className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600"
                                  >
                                    {
                                      assignment.className
                                    }
                                  </span>
                                )
                              )}
                            {(subject
                              .classAssignments
                              ?.length || 0) >
                              4 && (
                              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                                +
                                {subject
                                  .classAssignments
                                  .length - 4}{" "}
                                more
                              </span>
                            )}
                            {(!subject.classAssignments ||
                              subject
                                .classAssignments
                                .length ===
                                0) && (
                              <span className="text-xs font-medium text-slate-400">
                                Not assigned
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
                                  subject
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
                                  subject
                                )
                              }
                              disabled={
                                deletingId ===
                                subject._id
                              }
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId ===
                              subject._id ? (
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

      <SubjectModal
        open={modalOpen}
        mode={editingSubject ? "edit" : "create"}
        initialData={editingSubject}
        loading={saving}
        onClose={closeModal}
        onSave={handleSave}
      />
    </DashboardLayout>
  );
};

export default SubjectsPage;
