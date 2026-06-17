import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Loader2,
  X,
} from "lucide-react";

const formatPreviewDate = (date) => {
  if (!date) return "Select date";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const generateSessionName = (startDate, endDate) => {
  if (!startDate || !endDate) return "";

  const startYear = new Date(startDate).getFullYear();
  const endYear = new Date(endDate).getFullYear();

  return `${startYear}-${String(endYear).slice(-2)}`;
};

const AcademicYearModal = ({
  open,
  onClose,
  onSave,
  loading = false,
}) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const sessionName = useMemo(
    () => generateSessionName(startDate, endDate),
    [startDate, endDate]
  );

  const hasInvalidRange =
    startDate &&
    endDate &&
    new Date(endDate) <= new Date(startDate);

  useEffect(() => {
    if (!open) {
      setStartDate("");
      setEndDate("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [loading, onClose, open]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (hasInvalidRange || !startDate || !endDate) {
      return;
    }

    onSave({
      startDate,
      endDate,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 px-4 py-4 backdrop-blur-sm sm:items-center">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Add Academic Year
            </h2>

            <p className="text-sm leading-6 text-slate-500">
              Define the session dates used by admissions, fees, attendance, and exams.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 px-6 py-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Start Date
              </span>

              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                End Date
              </span>

              <input
                type="date"
                value={endDate}
                onChange={(event) =>
                  setEndDate(event.target.value)
                }
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                required
              />
            </label>
          </div>

          {hasInvalidRange && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              End date must be later than start date.
            </p>
          )}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-600">
                  Generated Session
                </p>

                <div className="inline-flex min-h-14 min-w-32 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-2xl font-bold tracking-tight text-slate-950 shadow-sm">
                  {sessionName || "----"}
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <CalendarDays
                    className="text-slate-400"
                    size={16}
                  />
                  <span>
                    {formatPreviewDate(startDate)}
                  </span>
                </div>

                <div className="pl-6 text-slate-300">
                  to
                </div>

                <div className="flex items-center gap-2">
                  <CalendarDays
                    className="text-slate-400"
                    size={16}
                  />
                  <span>
                    {formatPreviewDate(endDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                !startDate ||
                !endDate ||
                hasInvalidRange
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <Loader2
                  className="animate-spin"
                  size={16}
                />
              )}
              Create Academic Year
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcademicYearModal;
