import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import { toast } from "sonner";

import DashboardLayout from "../../layouts/DashboardLayout";

import AcademicYearModal from "../../components/masterSetup/AcademicYearModal";

import {
  fetchAcademicYears,
  fetchCurrentAcademicYear,
} from "../../redux/slices/academicYearSlice";

import {
  createAcademicYear,
  deleteAcademicYear,
  setCurrentAcademicYear,
} from "../../services/academicYearService";

const formatDate = (date) => {
  if (!date) return "Not set";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const sortAcademicYears = (years) =>
  [...years].sort(
    (firstYear, secondYear) =>
      new Date(secondYear.startDate) -
      new Date(firstYear.startDate)
  );

const MasterSetupWorkspace = ({
  title,
  description,
  action,
  children,
}) => (
  <div className="mx-auto max-w-6xl space-y-8 px-1 pb-10">
    <header className="flex flex-col gap-6 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
          Master Setup
        </p>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">
            {title}
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {action}
    </header>

    {children}
  </div>
);

const SectionHeader = ({ title, description }) => (
  <div className="flex flex-col gap-1">
    <h2 className="text-xl font-semibold tracking-tight text-slate-950">
      {title}
    </h2>

    {description && (
      <p className="text-sm text-slate-500">
        {description}
      </p>
    )}
  </div>
);

const StatusBadge = ({ current }) => {
  if (!current) {
    return (
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
      <CheckCircle2 size={14} />
      Current
    </span>
  );
};

const EmptyState = ({ loading }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm shadow-slate-200/60">
    {loading ? (
      <div className="flex items-center justify-center gap-3 text-sm font-medium text-slate-500">
        <Loader2
          className="animate-spin"
          size={18}
        />
        Loading academic years
      </div>
    ) : (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-950">
          No academic years yet
        </h3>

        <p className="text-sm text-slate-500">
          Create the first academic session to start configuring the ERP.
        </p>
      </div>
    )}
  </div>
);

const CurrentSessionPanel = ({ academicYear }) => (
  <section className="space-y-4">
    <SectionHeader title="Current Session" />

    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
      {academicYear ? (
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-3xl font-bold tracking-tight text-slate-950">
                {academicYear.name}
              </h3>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
                <CalendarDays
                  className="text-slate-400"
                  size={17}
                />
                <span>
                  {formatDate(academicYear.startDate)}
                </span>
                <span className="text-slate-300">
                  -
                </span>
                <span>
                  {formatDate(academicYear.endDate)}
                </span>
              </div>
            </div>

            <p className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white">
              Active Academic Session
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-950">
            No current session selected
          </h3>

          <p className="text-sm text-slate-500">
            Mark one academic year as current to activate session-aware ERP workflows.
          </p>
        </div>
      )}
    </div>
  </section>
);

const AcademicYearCard = ({
  year,
  busyAction,
  onSetCurrent,
  onDelete,
}) => {
  const isBusy = busyAction?.id === year._id;

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/80">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold tracking-tight text-slate-950">
              {year.name}
            </h3>

            <StatusBadge current={year.isCurrent} />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <CalendarDays
              className="text-slate-400"
              size={16}
            />
            <span>
              {formatDate(year.startDate)}
            </span>
            <span className="text-slate-300">
              -
            </span>
            <span>
              {formatDate(year.endDate)}
            </span>
          </div>

          {year.isCurrent && (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Current Session
            </p>
          )}
        </div>

        {!year.isCurrent && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => onSetCurrent(year._id)}
              disabled={isBusy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy &&
              busyAction.type === "current" ? (
                <Loader2
                  className="animate-spin"
                  size={16}
                />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Set Current
            </button>

            <button
              type="button"
              onClick={() => onDelete(year)}
              disabled={isBusy}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy &&
              busyAction.type === "delete" ? (
                <Loader2
                  className="animate-spin"
                  size={16}
                />
              ) : (
                <Trash2 size={16} />
              )}
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

const AcademicYearsPage = () => {
  const dispatch = useDispatch();

  const {
    academicYears,
    currentAcademicYear,
    loading,
  } = useSelector((state) => state.academicYear);

  const [openModal, setOpenModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busyAction, setBusyAction] = useState(null);

  const orderedAcademicYears = useMemo(
    () => sortAcademicYears(academicYears),
    [academicYears]
  );

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchCurrentAcademicYear());
  }, [dispatch]);

  const refreshData = () => {
    dispatch(fetchAcademicYears());
    dispatch(fetchCurrentAcademicYear());
  };

  const handleCreate = async (data) => {
    try {
      setCreating(true);

      await createAcademicYear(data);

      toast.success("Academic year created");
      setOpenModal(false);
      refreshData();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to create academic year"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSetCurrent = async (id) => {
    try {
      setBusyAction({
        id,
        type: "current",
      });

      await setCurrentAcademicYear(id);

      toast.success("Current academic year updated");
      refreshData();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to update session"
      );
    } finally {
      setBusyAction(null);
    }
  };

  const deleteAcademicYearRecord = async (id) => {
    try {
      setBusyAction({
        id,
        type: "delete",
      });

      await deleteAcademicYear(id);

      toast.success("✓ Academic year removed successfully");
      refreshData();
    } catch (error) {
      const errMsg = error?.response?.data?.message || "";
      if (errMsg.includes("records exist")) {
        toast.error("✗ Cannot delete academic year because records exist");
      } else {
        toast.error(
          errMsg || "Unable to delete academic year"
        );
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleDelete = (year) => {
    toast("Delete academic year permanently?", {
      description: `${year.name} will be permanently removed. This action cannot be undone.`,
      action: {
        label: "Delete",
        onClick: () => deleteAcademicYearRecord(year._id),
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  return (
    <DashboardLayout>
      <MasterSetupWorkspace
        title="Academic Year Management"
        description="Manage academic sessions used across the ERP."
        action={
          <button
            type="button"
            onClick={() => setOpenModal(true)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-slate-200"
          >
            <Plus size={18} />
            Add Academic Year
          </button>
        }
      >
        <CurrentSessionPanel academicYear={currentAcademicYear} />

        <section className="space-y-4">
          <SectionHeader
            title="Academic Years"
            description="Sessions are listed newest first for quick operational review."
          />

          {orderedAcademicYears.length > 0 ? (
            <div className="space-y-4">
              {orderedAcademicYears.map((year) => (
                <AcademicYearCard
                  key={year._id}
                  year={year}
                  busyAction={busyAction}
                  onSetCurrent={handleSetCurrent}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <EmptyState loading={loading} />
          )}
        </section>
      </MasterSetupWorkspace>

      <AcademicYearModal
        open={openModal}
        loading={creating}
        onClose={() => setOpenModal(false)}
        onSave={handleCreate}
      />
    </DashboardLayout>
  );
};

export default AcademicYearsPage;
