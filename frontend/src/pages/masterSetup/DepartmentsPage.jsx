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
  Building2,
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
import DepartmentModal from "../../components/masterSetup/DepartmentModal";

import {
  createDepartment,
  deleteDepartment,
  fetchAllDepartments,
  updateDepartment,
} from "../../redux/slices/departmentSlice";

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

const DepartmentsPage = () => {
  const dispatch = useDispatch();

  const {
    departments,
    loading,
    saving,
    deletingId,
  } = useSelector(
    (state) => state.departments
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] =
    useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchAllDepartments());
  }, [dispatch]);

  const summary = useMemo(() => {
    return {
      totalDepartments: departments.length,
      withDescription: departments.filter(
        (d) => d.description?.trim()
      ).length,
    };
  }, [departments]);

  const filteredDepartments = useMemo(() => {
    return [...departments]
      .filter((dept) => {
        const query = searchTerm
          .trim()
          .toLowerCase();

        if (!query) return true;

        return (
          dept.departmentName
            ?.toLowerCase()
            .includes(query) ||
          dept.departmentCode
            ?.toLowerCase()
            .includes(query)
        );
      })
      .sort((a, b) =>
        a.departmentName.localeCompare(
          b.departmentName
        )
      );
  }, [departments, searchTerm]);

  const openCreateModal = () => {
    setEditingDept(null);
    setModalOpen(true);
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDept(null);
  };

  const handleSave = async (payload) => {
    const action = editingDept
      ? updateDepartment({
          id: editingDept._id,
          data: payload,
        })
      : createDepartment(payload);

    const result = await dispatch(action);

    if (
      createDepartment.fulfilled.match(result) ||
      updateDepartment.fulfilled.match(result)
    ) {
      toast.success(
        editingDept
          ? "Department updated successfully"
          : "Department created successfully"
      );
      closeModal();
      dispatch(fetchAllDepartments());
      return;
    }

    toast.error(
      result.payload ||
        "Unable to save department"
    );
  };

  const permanentlyDeleteDept = async (dept) => {
    const result = await dispatch(
      deleteDepartment(dept._id)
    );

    if (
      deleteDepartment.fulfilled.match(result)
    ) {
      toast.success(
        "Department deleted permanently"
      );
      return;
    }

    toast.error(
      result.payload ||
        "Unable to delete department"
    );
  };

  const handleDelete = (dept) => {
    toast("Delete department permanently?", {
      description: `${dept.departmentName} will be permanently removed.`,
      action: {
        label: "Delete",
        onClick: () =>
          permanentlyDeleteDept(dept),
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  const handleExport = () => {
    const rows = filteredDepartments.map(
      (dept) => ({
        "Department Name": dept.departmentName,
        Code: dept.departmentCode,
        Description: dept.description || "",
      })
    );

    const headers = Object.keys(
      rows[0] || {
        "Department Name": "",
        Code: "",
        Description: "",
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
    link.download = "departments.csv";
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
              Departments
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Organize staff into departments for management and reporting.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            <Plus size={18} />
            Add Department
          </button>
        </header>

        <section className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <Info size={20} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Departments structure staff organization
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Departments are used in Designations, Staff Profiles, Payroll,
                and reporting. Each staff member is linked to a department.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Departments"
            value={summary.totalDepartments}
            helper="Active department records"
          />
          <SummaryCard
            label="With Description"
            value={summary.withDescription}
            helper="Departments with details"
          />
          <SummaryCard
            label="Employee Count"
            value={0}
            helper="Linked from staff later"
          />
          <SummaryCard
            label="Designation Count"
            value={0}
            helper="Linked from designations"
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
                placeholder="Search department name or code"
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
              Loading departments
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-slate-950">
                No departments found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Add departments to organize staff structure.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Department
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Code
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Description
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredDepartments.map(
                    (dept) => (
                      <tr
                        key={dept._id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                              <Building2
                                size={16}
                              />
                            </div>
                            <p className="text-sm font-semibold text-slate-950">
                              {
                                dept.departmentName
                              }
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                            {dept.departmentCode}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-slate-500">
                          {dept.description ||
                            "—"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  dept
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
                                  dept
                                )
                              }
                              disabled={
                                deletingId ===
                                dept._id
                              }
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId ===
                              dept._id ? (
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

      <DepartmentModal
        open={modalOpen}
        mode={editingDept ? "edit" : "create"}
        initialData={editingDept}
        loading={saving}
        onClose={closeModal}
        onSave={handleSave}
      />
    </DashboardLayout>
  );
};

export default DepartmentsPage;
