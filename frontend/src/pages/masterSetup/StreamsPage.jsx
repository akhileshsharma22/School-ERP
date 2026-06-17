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
  CheckCircle2,
  Edit3,
  Filter,
  GraduationCap,
  Info,
  Layers3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import { toast } from "sonner";

import StreamModal from "../../components/masterSetup/StreamModal";
import DashboardLayout from "../../layouts/DashboardLayout";

import {
  createStream,
  deleteStream,
  fetchStreams,
  updateStream,
} from "../../redux/slices/streamSlice";

const StatusBadge = ({ status }) => {
  const active = status === "Active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {status}
    </span>
  );
};

const SummaryCard = ({
  label,
  value,
  helper,
  icon: Icon,
}) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-500">
          {label}
        </p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          {value}
        </p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Icon size={19} />
      </div>
    </div>
    <p className="mt-2 text-xs font-medium text-slate-400">
      {helper}
    </p>
  </article>
);

const PillList = ({
  items,
  emptyLabel = "None",
  limit = 2,
}) => {
  if (!items?.length) {
    return (
      <span className="text-xs font-medium text-slate-400">
        {emptyLabel}
      </span>
    );
  }

  const visibleItems = items.slice(0, limit);
  const remaining = items.length - visibleItems.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleItems.map((item) => (
        <span
          key={item}
          title={item}
          className="inline-flex max-w-[150px] truncate rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"
        >
          {item}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
          +{remaining}
        </span>
      )}
    </div>
  );
};

const EmptyState = ({
  searching,
  onAdd,
  onReset,
}) => (
  <div className="px-6 py-14 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
      <Layers3 size={22} />
    </div>
    <h3 className="mt-4 text-lg font-semibold text-slate-950">
      {searching
        ? "No matching streams"
        : "No streams configured"}
    </h3>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
      {searching
        ? "Try another name, code, or status filter."
        : "Create the first senior secondary academic pathway for Class 11 or Class 12."}
    </p>
    <button
      type="button"
      onClick={searching ? onReset : onAdd}
      className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
    >
      {searching ? (
        <RefreshCw size={16} />
      ) : (
        <Plus size={16} />
      )}
      {searching ? "Reset Filters" : "Add Stream"}
    </button>
  </div>
);

const StreamActions = ({
  stream,
  deleting,
  onEdit,
  onDelete,
  compact = false,
}) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      aria-label={`Edit ${stream.streamName}`}
      onClick={() => onEdit(stream)}
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 ${
        compact ? "w-9" : "px-3"
      }`}
    >
      <Edit3 size={15} />
      {!compact && "Edit"}
    </button>
    <button
      type="button"
      aria-label={`Delete ${stream.streamName}`}
      onClick={() => onDelete(stream)}
      disabled={deleting}
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 ${
        compact ? "w-9" : "px-3"
      }`}
    >
      {deleting ? (
        <Loader2
          className="animate-spin"
          size={15}
        />
      ) : (
        <Trash2 size={15} />
      )}
      {!compact && "Delete"}
    </button>
  </div>
);

const StreamsPage = () => {
  const dispatch = useDispatch();
  const {
    streams,
    loading,
    saving,
    deletingId,
    error,
  } = useSelector((state) => state.streams);

  const [modalOpen, setModalOpen] =
    useState(false);
  const [editingStream, setEditingStream] =
    useState(null);
  const [searchTerm, setSearchTerm] =
    useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  useEffect(() => {
    dispatch(fetchStreams());
  }, [dispatch]);

  const summary = useMemo(() => {
    const coveredClasses = new Set();
    const linkedSubjects = new Set();

    streams.forEach((stream) => {
      stream.applicableClasses?.forEach(
        (className) => coveredClasses.add(className)
      );
      [
        ...(stream.compulsorySubjects || []),
        ...(stream.optionalSubjects || []),
      ].forEach((subject) =>
        linkedSubjects.add(subject.toLowerCase())
      );
    });

    return {
      total: streams.length,
      active: streams.filter(
        (stream) => stream.status === "Active"
      ).length,
      classes: coveredClasses.size,
      subjects: linkedSubjects.size,
    };
  }, [streams]);

  const filteredStreams = useMemo(() => {
    const query = searchTerm
      .trim()
      .toLowerCase();

    return [...streams]
      .filter((stream) => {
        if (!query) return true;
        return (
          stream.streamName
            ?.toLowerCase()
            .includes(query) ||
          stream.streamCode
            ?.toLowerCase()
            .includes(query)
        );
      })
      .filter((stream) =>
        statusFilter === "All"
          ? true
          : stream.status === statusFilter
      )
      .sort((first, second) =>
        first.streamName.localeCompare(
          second.streamName
        )
      );
  }, [searchTerm, statusFilter, streams]);

  const openCreateModal = () => {
    setEditingStream(null);
    setModalOpen(true);
  };

  const openEditModal = (stream) => {
    setEditingStream(stream);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingStream(null);
  };

  const handleSave = async (payload) => {
    const action = editingStream
      ? updateStream({
          id: editingStream._id,
          data: payload,
        })
      : createStream(payload);

    const result = await dispatch(action);

    if (
      createStream.fulfilled.match(result) ||
      updateStream.fulfilled.match(result)
    ) {
      toast.success(
        editingStream
          ? "Stream updated successfully"
          : "Stream created successfully"
      );
      setModalOpen(false);
      setEditingStream(null);
      return;
    }

    toast.error(
      result.payload || "Unable to save stream"
    );
  };

  const permanentlyDeleteStream = async (
    stream
  ) => {
    const result = await dispatch(
      deleteStream(stream._id)
    );

    if (deleteStream.fulfilled.match(result)) {
      toast.success(
        `${stream.streamName} deleted permanently`
      );
      return;
    }

    toast.error(
      result.payload || "Unable to delete stream"
    );
  };

  const handleDelete = (stream) => {
    toast("Delete stream permanently?", {
      description: `${stream.streamName} (${stream.streamCode}) and its subject mapping will be removed from MongoDB.`,
      action: {
        label: "Delete",
        onClick: () =>
          permanentlyDeleteStream(stream),
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
  };

  const searching =
    Boolean(searchTerm.trim()) ||
    statusFilter !== "All";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Master Setup
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              Streams Management
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage senior secondary streams and subject combinations.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            <Plus size={18} />
            Add Stream
          </button>
        </header>

        <section className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <Info size={20} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Senior secondary academic pathways
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Streams help organize Class 11 and 12 students into academic pathways with clear compulsory and optional subject choices.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Streams"
            value={summary.total}
            helper="Configured pathways"
            icon={Layers3}
          />
          <SummaryCard
            label="Active Streams"
            value={summary.active}
            helper="Available for assignment"
            icon={CheckCircle2}
          />
          <SummaryCard
            label="Classes Covered"
            value={summary.classes}
            helper="Class 11 and Class 12"
            icon={GraduationCap}
          />
          <SummaryCard
            label="Subjects Linked"
            value={summary.subjects}
            helper="Unique subject mappings"
            icon={BookOpen}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search by stream name or code"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <div className="relative w-full md:w-auto">
              <Filter
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-8 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 md:w-auto"
              >
                <option value="All">
                  All Status
                </option>
                <option value="Active">Active</option>
                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </div>
          </div>

          {error && !loading && (
            <div className="flex flex-col gap-3 border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => dispatch(fetchStreams())}
                className="inline-flex items-center gap-2 font-semibold"
              >
                <RefreshCw size={15} />
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-14 text-sm font-medium text-slate-500">
              <Loader2
                className="animate-spin"
                size={19}
              />
              Loading streams
            </div>
          ) : filteredStreams.length === 0 ? (
            <EmptyState
              searching={searching}
              onAdd={openCreateModal}
              onReset={resetFilters}
            />
          ) : (
            <>
              <div className="hidden lg:block">
                <table className="w-full table-fixed border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="w-[17%] px-4 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                        Stream
                      </th>
                      <th className="w-[9%] px-3 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                        Code
                      </th>
                      <th className="w-[13%] px-3 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                        Classes
                      </th>
                      <th className="w-[19%] px-3 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                        Compulsory Subjects
                      </th>
                      <th className="w-[18%] px-3 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                        Optional Subjects
                      </th>
                      <th className="w-[10%] px-3 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                        Status
                      </th>
                      <th className="w-[14%] px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStreams.map((stream) => (
                      <tr
                        key={stream._id}
                        className="align-top transition hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-4">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {stream.streamName}
                          </p>
                          <p
                            title={stream.description}
                            className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400"
                          >
                            {stream.description ||
                              "No description"}
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          <span className="inline-flex rounded-lg bg-slate-950 px-2.5 py-1 text-xs font-bold tracking-wide text-white">
                            {stream.streamCode}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <PillList
                            items={
                              stream.applicableClasses
                            }
                          />
                        </td>
                        <td className="px-3 py-4">
                          <PillList
                            items={
                              stream.compulsorySubjects
                            }
                          />
                        </td>
                        <td className="px-3 py-4">
                          <PillList
                            items={
                              stream.optionalSubjects
                            }
                          />
                        </td>
                        <td className="px-3 py-4">
                          <StatusBadge
                            status={stream.status}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            <StreamActions
                              stream={stream}
                              compact
                              deleting={
                                deletingId === stream._id
                              }
                              onEdit={openEditModal}
                              onDelete={handleDelete}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 lg:hidden">
                {filteredStreams.map((stream) => (
                  <article
                    key={stream._id}
                    className="space-y-4 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-slate-950">
                            {stream.streamName}
                          </h3>
                          <span className="rounded-md bg-slate-950 px-2 py-0.5 text-xs font-bold text-white">
                            {stream.streamCode}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-5 text-slate-500">
                          {stream.description ||
                            "No description provided."}
                        </p>
                      </div>
                      <StatusBadge
                        status={stream.status}
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Classes
                        </p>
                        <PillList
                          items={
                            stream.applicableClasses
                          }
                          limit={3}
                        />
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Compulsory
                        </p>
                        <PillList
                          items={
                            stream.compulsorySubjects
                          }
                          limit={3}
                        />
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Optional
                        </p>
                        <PillList
                          items={
                            stream.optionalSubjects
                          }
                          limit={3}
                        />
                      </div>
                    </div>

                    <StreamActions
                      stream={stream}
                      deleting={
                        deletingId === stream._id
                      }
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                    />
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {modalOpen && (
        <StreamModal
          open
          mode={editingStream ? "edit" : "create"}
          initialData={editingStream}
          loading={saving}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </DashboardLayout>
  );
};

export default StreamsPage;
