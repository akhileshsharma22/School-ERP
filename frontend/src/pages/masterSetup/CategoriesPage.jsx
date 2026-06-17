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
  Eye,
  Filter,
  Info,
  Loader2,
  Plus,
  Search,
  Tag,
  Trash2,
} from "lucide-react";

import { toast } from "sonner";

import DashboardLayout from "../../layouts/DashboardLayout";
import CategoryModal from "../../components/masterSetup/CategoryModal";

import {
  createCategory,
  deleteCategory,
  fetchAllCategories,
  updateCategory,
} from "../../redux/slices/categorySlice";

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

const CategoriesPage = () => {
  const dispatch = useDispatch();

  const {
    categories,
    loading,
    saving,
    deletingId,
  } = useSelector(
    (state) => state.categories
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    dispatch(fetchAllCategories());
  }, [dispatch]);

  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.status === "Active").length;
    const inactive = categories.filter((c) => c.status === "Inactive").length;

    let mostUsed = "—";
    let maxCount = 0;
    categories.forEach((c) => {
      if (c.studentsCount && c.studentsCount > maxCount) {
        maxCount = c.studentsCount;
        mostUsed = `${c.name} (${c.studentsCount})`;
      }
    });

    return { total, active, inactive, mostUsed };
  }, [categories]);

  const filteredCategories = useMemo(() => {
    return [...categories]
      .filter((category) => {
        const query = searchTerm.trim().toLowerCase();

        if (!query) return true;

        return (
          category.name?.toLowerCase().includes(query) ||
          category.shortCode?.toLowerCase().includes(query) ||
          category.categoryType?.toLowerCase().includes(query)
        );
      })
      .filter((category) => {
        if (typeFilter === "All") return true;
        return category.categoryType === typeFilter;
      })
      .filter((category) => {
        if (statusFilter === "All") return true;
        return category.status === statusFilter;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, searchTerm, typeFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setModalMode("edit");
    setModalOpen(true);
  };

  const openViewModal = (category) => {
    setEditingCategory(category);
    setModalMode("view");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
  };

  const handleSave = async (payload) => {
    const action = editingCategory
      ? updateCategory({
          id: editingCategory._id,
          data: payload,
        })
      : createCategory(payload);

    const result = await dispatch(action);

    if (
      createCategory.fulfilled.match(result) ||
      updateCategory.fulfilled.match(result)
    ) {
      toast.success(
        editingCategory
          ? "Category updated successfully"
          : "Category created successfully"
      );
      closeModal();
      dispatch(fetchAllCategories());
      return;
    }

    toast.error(
      result.payload ||
        "Unable to save category"
    );
  };

  const permanentlyDeleteCategory = async (
    category
  ) => {
    const result = await dispatch(
      deleteCategory(category._id)
    );

    if (
      deleteCategory.fulfilled.match(result)
    ) {
      toast.success(
        "Category deleted successfully"
      );
      return;
    }

    toast.error(
      result.payload ||
        "Unable to delete category"
    );
  };

  const handleDelete = (category) => {
    toast("Delete category permanently?", {
      description: `${category.name} will be permanently removed.`,
      action: {
        label: "Delete",
        onClick: () =>
          permanentlyDeleteCategory(category),
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  const handleExport = () => {
    const rows = filteredCategories.map(
      (category) => ({
        "Category Name": category.name,
        "Short Code": category.shortCode,
        Type: category.categoryType,
        "Students Count": category.studentsCount || 0,
        Status: category.status,
        Description: category.description || "",
        "Created Date": formatDate(category.createdAt),
      })
    );

    const headers = Object.keys(
      rows[0] || {
        "Category Name": "",
        "Short Code": "",
        Type: "",
        "Students Count": "",
        Status: "",
        Description: "",
        "Created Date": "",
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
    link.download = "categories.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const categoryTypes = [
    "General",
    "OBC",
    "SC",
    "ST",
    "EWS",
    "Minority",
    "Management Quota",
    "Sports Quota",
    "Defence",
    "Physically Disabled",
    "Other",
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Master Setup
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              Categories
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage student categories used across admissions and student records.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            <Plus size={18} />
            Add Category
          </button>
        </header>

        <section className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <Info size={20} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Student Categories
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Create category options used during admission and student registration.
                Examples: General, OBC, SC, ST, EWS.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Categories"
            value={stats.total}
            helper="Total records"
          />
          <SummaryCard
            label="Active Categories"
            value={stats.active}
            helper="Currently active"
          />
          <SummaryCard
            label="Inactive Categories"
            value={stats.inactive}
            helper="Disabled categories"
          />
          <SummaryCard
            label="Most Used Category"
            value={stats.mostUsed}
            helper="Highest student count"
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
                placeholder="Search category name, code, type"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value)
                }
                className="h-11 w-[180px] rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer"
              >
                <option value="All">All Types</option>
                {categoryTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="h-11 w-[180px] rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

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
              Loading categories
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-slate-950">
                No categories found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Add student categories like General, OBC, SC, ST, EWS.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Category Name
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Short Code
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Type
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Students Count
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Status
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Created Date
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.map(
                    (category) => (
                      <tr
                        key={category._id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                              <Tag size={16} />
                            </div>
                            <p className="text-sm font-semibold text-slate-950">
                              {category.name}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                            {category.shortCode}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                          {category.categoryType}
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                          {category.studentsCount || 0}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                              category.status === "Active"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-100 text-slate-600"
                            }`}
                          >
                            {category.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-slate-500">
                          {formatDate(category.createdAt)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openViewModal(
                                  category
                                )
                              }
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950"
                            >
                              <Eye size={16} />
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  category
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
                                  category
                                )
                              }
                              disabled={
                                deletingId ===
                                category._id
                              }
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId ===
                              category._id ? (
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

      <CategoryModal
        open={modalOpen}
        mode={modalMode}
        initialData={editingCategory}
        loading={saving}
        onClose={closeModal}
        onSave={handleSave}
      />
    </DashboardLayout>
  );
};

export default CategoriesPage;
