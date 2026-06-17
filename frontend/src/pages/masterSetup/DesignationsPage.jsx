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
  Briefcase,
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
import DesignationModal from "../../components/masterSetup/DesignationModal";

import {
  createDesignation,
  deleteDesignation,
  fetchAllDesignations,
  updateDesignation,
} from "../../redux/slices/designationSlice";

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

const DesignationsPage = () => {
  const dispatch = useDispatch();

  const {
    designations,
    loading,
    saving,
    deletingId,
  } = useSelector(
    (state) => state.designations
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] =
    useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchAllDesignations());
  }, [dispatch]);

  const summary = useMemo(() => {
    const totalDesignations = designations.length;
    const totalDeptMappings = designations.reduce(
      (total, d) =>
        total + (d.departments?.length || 0),
      0
    );

    const uniqueDepts = new Set();
    for (const d of designations) {
      for (const dept of d.departments || []) {
        uniqueDepts.add(dept.departmentId);
      }
    }

    return {
      totalDesignations,
      totalDeptMappings,
      uniqueDepartments: uniqueDepts.size,
      avgDepts: totalDesignations
        ? (
            totalDeptMappings / totalDesignations
          ).toFixed(1)
        : "0.0",
    };
  }, [designations]);

  const filteredDesignations = useMemo(() => {
    return [...designations]
      .filter((d) => {
        const query = searchTerm
          .trim()
          .toLowerCase();

        if (!query) return true;

        return (
          d.designationName
            ?.toLowerCase()
            .includes(query) ||
          d.designationCode
            ?.toLowerCase()
            .includes(query) ||
          d.departments?.some((dept) =>
            dept.departmentName
              ?.toLowerCase()
              .includes(query)
          )
        );
      })
      .sort((a, b) =>
        a.designationName.localeCompare(
          b.designationName
        )
      );
  }, [designations, searchTerm]);

  const openCreateModal = () => {
    setEditingDesignation(null);
    setModalOpen(true);
  };

  const openEditModal = (designation) => {
    setEditingDesignation(designation);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDesignation(null);
  };

  const handleSave = async (payload) => {
    const action = editingDesignation
      ? updateDesignation({
          id: editingDesignation._id,
          data: payload,
        })
      : createDesignation(payload);

    const result = await dispatch(action);

    if (
      createDesignation.fulfilled.match(result) ||
      updateDesignation.fulfilled.match(result)
    ) {
      toast.success(
        editingDesignation
          ? "Designation updated successfully"
          : "Designation created successfully"
      );
      closeModal();
      dispatch(fetchAllDesignations());
      return;
    }

    toast.error(
      result.payload ||
        "Unable to save designation"
    );
  };

  const permanentlyDeleteDesignation = async (
    designation
  ) => {
    const result = await dispatch(
      deleteDesignation(designation._id)
    );

    if (
      deleteDesignation.fulfilled.match(result)
    ) {
      toast.success(
        "Designation deleted permanently"
      );
      return;
    }

    toast.error(
      result.payload ||
        "Unable to delete designation"
    );
  };

  const handleDelete = (designation) => {
    toast("Delete designation permanently?", {
      description: `${designation.designationName} will be permanently removed.`,
      action: {
        label: "Delete",
        onClick: () =>
          permanentlyDeleteDesignation(
            designation
          ),
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  const handleExport = () => {
    const rows = filteredDesignations.map(
      (d) => ({
        "Designation Name": d.designationName,
        Code: d.designationCode,
        Departments: (d.departments || [])
          .map((dept) => dept.departmentName)
          .join(" | "),
      })
    );

    const headers = Object.keys(
      rows[0] || {
        "Designation Name": "",
        Code: "",
        Departments: "",
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
    link.download = "designations.csv";
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
              Designations
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Define staff designations and map them to departments.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            <Plus size={18} />
            Add Designation
          </button>
        </header>

        <section className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <Info size={20} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Designations depend on Departments
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Each designation can belong to one or more departments. Create departments first, then define designations with department mapping.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Designations"
            value={summary.totalDesignations}
            helper="Active designation records"
          />
          <SummaryCard
            label="Dept Mappings"
            value={summary.totalDeptMappings}
            helper="Total department-designation links"
          />
          <SummaryCard
            label="Unique Departments"
            value={summary.uniqueDepartments}
            helper="Departments with designations"
          />
          <SummaryCard
            label="Avg Depts/Designation"
            value={summary.avgDepts}
            helper="Departments per designation"
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
                placeholder="Search designation or department"
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
              Loading designations
            </div>
          ) : filteredDesignations.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-slate-950">
                No designations found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Add designations and map them to departments.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Designation
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Code
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Departments
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredDesignations.map(
                    (designation) => (
                      <tr
                        key={designation._id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                              <Briefcase
                                size={16}
                              />
                            </div>
                            <p className="text-sm font-semibold text-slate-950">
                              {
                                designation.designationName
                              }
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                            {
                              designation.designationCode
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {designation.departments?.map(
                              (dept) => (
                                <span
                                  key={
                                    dept._id ||
                                    dept.departmentId
                                  }
                                  className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700"
                                >
                                  {
                                    dept.departmentName
                                  }
                                </span>
                              )
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  designation
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
                                  designation
                                )
                              }
                              disabled={
                                deletingId ===
                                designation._id
                              }
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId ===
                              designation._id ? (
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

      <DesignationModal
        open={modalOpen}
        mode={
          editingDesignation ? "edit" : "create"
        }
        initialData={editingDesignation}
        loading={saving}
        onClose={closeModal}
        onSave={handleSave}
      />
    </DashboardLayout>
  );
};

export default DesignationsPage;
