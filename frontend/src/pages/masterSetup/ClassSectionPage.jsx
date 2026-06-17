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
  Download,
  Edit3,
  Filter,
  Info,
  Loader2,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";

import { toast } from "sonner";

import ClassSectionModal from "../../components/masterSetup/ClassSectionModal";
import DashboardLayout from "../../layouts/DashboardLayout";

import {
  createClass,
  deleteClass,
  fetchAllClasses,
  updateClass,
} from "../../redux/slices/classSectionSlice";

const getClassCapacity = (classItem) =>
  (classItem.sections || []).reduce(
    (total, section) =>
      total + Number(section.capacity || 0),
    0
  );

const getClassTeachers = (classItem) => {
  const teachers = [
    ...new Set(
      (classItem.sections || [])
        .map((section) =>
          String(section.classTeacher || "").trim()
        )
        .filter(Boolean)
    ),
  ];

  if (!teachers.length) return "Not assigned";
  if (teachers.length === 1) return teachers[0];

  return `${teachers.length} Teachers`;
};

const getStudentsCount = () => 0;

const StatusBadge = ({ status }) => {
  const active = status === "Active";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
};

const SummaryCard = ({
  label,
  value,
  helper,
}) => (
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

const ClassSectionPage = () => {
  const dispatch = useDispatch();

  const {
    classes,
    loading,
    saving,
    deletingId,
  } = useSelector(
    (state) => state.classSections
  );

  const [modalOpen, setModalOpen] =
    useState(false);
  const [editingClass, setEditingClass] =
    useState(null);
  const [searchTerm, setSearchTerm] =
    useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  useEffect(() => {
    dispatch(fetchAllClasses());
  }, [dispatch]);

  const summary = useMemo(() => {
    const totalClasses = classes.length;
    const totalSections = classes.reduce(
      (total, classItem) =>
        total + (classItem.sections?.length || 0),
      0
    );
    const totalCapacity = classes.reduce(
      (total, classItem) =>
        total + getClassCapacity(classItem),
      0
    );

    return {
      totalClasses,
      avgSections: totalClasses
        ? (totalSections / totalClasses).toFixed(1)
        : "0.0",
      totalStudents: classes.reduce(
        (total, classItem) =>
          total + getStudentsCount(classItem),
        0
      ),
      avgCapacity: totalClasses
        ? Math.round(totalCapacity / totalClasses)
        : 0,
    };
  }, [classes]);

  const filteredClasses = useMemo(() => {
    return [...classes]
      .filter((classItem) => {
        const query =
          searchTerm.trim().toLowerCase();

        if (!query) return true;

        return (
          classItem.className
            ?.toLowerCase()
            .includes(query) ||
          classItem.sections?.some((section) =>
            section.sectionName
              ?.toLowerCase()
              .includes(query)
          )
        );
      })
      .filter((classItem) =>
        statusFilter === "All"
          ? true
          : classItem.status === statusFilter
      )
      .sort(
        (firstClass, secondClass) =>
          Number(firstClass.displayOrder || 0) -
          Number(secondClass.displayOrder || 0)
      );
  }, [classes, searchTerm, statusFilter]);

  const openCreateModal = () => {
    setEditingClass(null);
    setModalOpen(true);
  };

  const openEditModal = (classItem) => {
    setEditingClass(classItem);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingClass(null);
  };

  const handleSave = async (payload) => {
    const action = editingClass
      ? updateClass({
          id: editingClass._id,
          data: payload,
        })
      : createClass(payload);

    const result = await dispatch(action);

    if (
      createClass.fulfilled.match(result) ||
      updateClass.fulfilled.match(result)
    ) {
      toast.success(
        editingClass
          ? "Class updated successfully"
          : "Class created successfully"
      );
      closeModal();
      dispatch(fetchAllClasses());
      return;
    }

    toast.error(
      result.payload ||
        "Unable to save class"
    );
  };

  const permanentlyDeleteClass = async (
    classItem
  ) => {
    const result = await dispatch(
      deleteClass(classItem._id)
    );

    if (deleteClass.fulfilled.match(result)) {
      toast.success(
        "Class deleted permanently"
      );
      return;
    }

    toast.error(
      result.payload ||
        "Unable to delete class"
    );
  };

  const handleDelete = (classItem) => {
    toast("Delete class permanently?", {
      description: `${classItem.className} and its sections will be permanently removed.`,
      action: {
        label: "Delete",
        onClick: () =>
          permanentlyDeleteClass(classItem),
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  const handleExport = () => {
    const rows = filteredClasses.map(
      (classItem) => ({
        Class: classItem.className,
        Sections: (classItem.sections || [])
          .map((section) => section.sectionName)
          .join(" | "),
        "Class Teacher":
          getClassTeachers(classItem),
        Students: getStudentsCount(classItem),
        Capacity: getClassCapacity(classItem),
        Status: classItem.status,
      })
    );

    const headers = Object.keys(
      rows[0] || {
        Class: "",
        Sections: "",
        "Class Teacher": "",
        Students: "",
        Capacity: "",
        Status: "",
      }
    );

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) =>
            `"${String(row[header] ?? "").replace(
              /"/g,
              '""'
            )}"`
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
    link.download = "classes-sections.csv";
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
              Classes & Sections
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage class structure and sections for your school.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            <Plus size={18} />
            Add
          </button>
        </header>

        <section className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <Info size={20} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Classes and sections are managed together
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Create each class once, then define its sections, teacher assignment, capacity, exam types, and active status from this workspace.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Classes"
            value={summary.totalClasses}
            helper="Configured class records"
          />
          <SummaryCard
            label="Avg Sections"
            value={summary.avgSections}
            helper="Sections per class"
          />
          <SummaryCard
            label="Total Students"
            value={summary.totalStudents}
            helper="Linked from admissions later"
          />
          <SummaryCard
            label="Avg Capacity"
            value={summary.avgCapacity}
            helper="Seats per class"
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
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search class or section"
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
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-white pl-10 pr-8 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                >
                  <option value="All">
                    All Status
                  </option>
                  <option value="Active">
                    Active
                  </option>
                  <option value="Inactive">
                    Inactive
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
              Loading classes and sections
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-slate-950">
                No classes found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Add a class structure to begin configuring sections.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Class
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Sections
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Class Teacher
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Students
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Capacity
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredClasses.map(
                    (classItem) => (
                      <tr
                        key={classItem._id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {classItem.className}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-400">
                              Order{" "}
                              {
                                classItem.displayOrder
                              }
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            {classItem.sections?.map(
                              (section) => (
                                <span
                                  key={
                                    section._id ||
                                    section.sectionName
                                  }
                                  className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                                >
                                  {
                                    section.sectionName
                                  }
                                </span>
                              )
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-slate-600">
                          {getClassTeachers(
                            classItem
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Users
                              className="text-slate-400"
                              size={16}
                            />
                            {getStudentsCount(
                              classItem
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                          {getClassCapacity(
                            classItem
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            status={
                              classItem.status
                            }
                          />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  classItem
                                )
                              }
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950"
                            >
                              <Edit3 size={16} />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  classItem
                                )
                              }
                              disabled={
                                deletingId ===
                                classItem._id
                              }
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId ===
                              classItem._id ? (
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

      <ClassSectionModal
        open={modalOpen}
        mode={editingClass ? "edit" : "create"}
        initialData={editingClass}
        loading={saving}
        onClose={closeModal}
        onSave={handleSave}
      />
    </DashboardLayout>
  );
};

export default ClassSectionPage;
