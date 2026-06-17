import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BookOpen,
  Loader2,
  Plus,
  X,
} from "lucide-react";

import { toast } from "sonner";

const CLASS_OPTIONS = ["Class 11", "Class 12"];

const SUBJECT_SUGGESTIONS = [
  "Accounts",
  "Biology",
  "Business Studies",
  "Chemistry",
  "Computer Science",
  "Economics",
  "English",
  "Geography",
  "History",
  "Informatics Practices",
  "Mathematics",
  "Physical Education",
  "Physics",
  "Political Science",
  "Psychology",
  "Sociology",
];

const EMPTY_FORM = {
  streamName: "",
  streamCode: "",
  description: "",
  applicableClasses: [],
  compulsorySubjects: [],
  optionalSubjects: [],
  status: "Active",
};

const EMPTY_ERRORS = {
  streamName: "",
  streamCode: "",
  applicableClasses: "",
  compulsorySubjects: "",
  optionalSubjects: "",
};

const inputClass = (error) =>
  `mt-1.5 h-11 w-full rounded-xl border bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:ring-4 ${
    error
      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
      : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
  }`;

const ErrorText = ({ message }) =>
  message ? (
    <p className="mt-1.5 text-xs font-medium text-rose-600">
      {message}
    </p>
  ) : null;

const SubjectSelector = ({
  label,
  required = false,
  values,
  blockedValues,
  error,
  onChange,
}) => {
  const [query, setQuery] = useState("");

  const normalizedValues = values.map((value) =>
    value.toLowerCase()
  );
  const normalizedBlocked = blockedValues.map((value) =>
    value.toLowerCase()
  );
  const normalizedQuery = query
    .trim()
    .replace(/\s+/g, " ");

  const availableSuggestions =
    SUBJECT_SUGGESTIONS.filter((subject) => {
      const key = subject.toLowerCase();
      return (
        !normalizedValues.includes(key) &&
        !normalizedBlocked.includes(key) &&
        (!normalizedQuery ||
          key.includes(normalizedQuery.toLowerCase()))
      );
    }).slice(0, 6);

  const addSubject = (subject) => {
    const normalizedSubject = subject
      .trim()
      .replace(/\s+/g, " ");
    const key = normalizedSubject.toLowerCase();

    if (!normalizedSubject) return;

    if (normalizedValues.includes(key)) {
      toast.error(
        `${normalizedSubject} is already selected`
      );
      return;
    }

    if (normalizedBlocked.includes(key)) {
      toast.error(
        `${normalizedSubject} is already used in the other subject group`
      );
      return;
    }

    onChange([...values, normalizedSubject]);
    setQuery("");
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" ||
      event.key === ","
    ) {
      event.preventDefault();
      addSubject(normalizedQuery);
    }
  };

  return (
    <section
      className={`rounded-xl border p-4 ${
        error
          ? "border-rose-300 bg-rose-50/30"
          : "border-slate-200 bg-slate-50/60"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            {label} {required && "*"}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Search a common subject or enter a custom one.
          </p>
        </div>

        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
          {values.length} selected
        </span>
      </div>

      {values.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((subject) => (
            <span
              key={subject}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-1.5 text-xs font-semibold text-slate-700"
            >
              <span className="truncate">
                {subject}
              </span>
              <button
                type="button"
                aria-label={`Remove ${subject}`}
                onClick={() =>
                  onChange(
                    values.filter(
                      (item) => item !== subject
                    )
                  )
                }
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative mt-3">
        <input
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Type subject name and press Enter"
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-3 pr-12 text-sm font-medium outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
        />
        <button
          type="button"
          aria-label={`Add ${label.toLowerCase()}`}
          onClick={() => addSubject(normalizedQuery)}
          disabled={!normalizedQuery}
          className="absolute right-1.5 top-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus size={15} />
        </button>
      </div>

      {query && availableSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {availableSuggestions.map((subject) => (
            <button
              type="button"
              key={subject}
              onClick={() => addSubject(subject)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
            >
              + {subject}
            </button>
          ))}
        </div>
      )}

      <ErrorText message={error} />
    </section>
  );
};

const StreamModal = ({
  open,
  mode = "create",
  initialData = null,
  loading = false,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState(() =>
    initialData
      ? {
          streamName: initialData.streamName || "",
          streamCode: initialData.streamCode || "",
          description: initialData.description || "",
          applicableClasses:
            initialData.applicableClasses || [],
          compulsorySubjects:
            initialData.compulsorySubjects || [],
          optionalSubjects:
            initialData.optionalSubjects || [],
          status: initialData.status || "Active",
        }
      : EMPTY_FORM
  );
  const [errors, setErrors] =
    useState(EMPTY_ERRORS);
  const streamNameRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(
      () => streamNameRef.current?.focus(),
      80
    );

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );
    return () =>
      document.removeEventListener(
        "keydown",
        handleEscape
      );
  }, [loading, onClose, open]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => ({
      ...current,
      [field]: "",
    }));
  };

  const toggleClass = (className) => {
    updateField(
      "applicableClasses",
      form.applicableClasses.includes(className)
        ? form.applicableClasses.filter(
            (item) => item !== className
          )
        : [...form.applicableClasses, className]
    );
  };

  const validate = () => {
    const nextErrors = { ...EMPTY_ERRORS };

    if (!form.streamName.trim()) {
      nextErrors.streamName =
        "Stream name is required";
    }

    if (!form.streamCode.trim()) {
      nextErrors.streamCode =
        "Stream code is required";
    } else if (
      !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(
        form.streamCode.trim()
      )
    ) {
      nextErrors.streamCode =
        "Use letters, numbers, hyphens, or underscores";
    }

    if (!form.applicableClasses.length) {
      nextErrors.applicableClasses =
        "Select at least one applicable class";
    }

    if (!form.compulsorySubjects.length) {
      nextErrors.compulsorySubjects =
        "Add at least one compulsory subject";
    }

    setErrors(nextErrors);
    return Object.values(nextErrors).every(
      (message) => !message
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      toast.error(
        "Please complete the required stream details"
      );
      return;
    }

    onSave({
      ...form,
      streamName: form.streamName
        .trim()
        .replace(/\s+/g, " "),
      streamCode: form.streamCode
        .trim()
        .toUpperCase(),
      description: form.description.trim(),
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-3 py-4 backdrop-blur-sm sm:px-5">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 cursor-default"
        onClick={() => !loading && onClose()}
      />

      <div className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              {mode === "edit"
                ? "Edit Stream"
                : "Add Stream"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Configure the academic pathway and its subject combination.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-5 py-5 sm:px-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-semibold text-slate-700">
                Stream Name *
              </span>
              <div className="relative">
                <BookOpen
                  className="absolute left-3 top-[22px] -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  ref={streamNameRef}
                  value={form.streamName}
                  onChange={(event) =>
                    updateField(
                      "streamName",
                      event.target.value
                    )
                  }
                  placeholder="Science"
                  maxLength={100}
                  className={`${inputClass(
                    errors.streamName
                  )} pl-9`}
                />
              </div>
              <ErrorText
                message={errors.streamName}
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Stream Code *
              </span>
              <input
                value={form.streamCode}
                onChange={(event) =>
                  updateField(
                    "streamCode",
                    event.target.value.toUpperCase()
                  )
                }
                placeholder="SCI"
                maxLength={20}
                className={inputClass(
                  errors.streamCode
                )}
              />
              <ErrorText
                message={errors.streamCode}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <label>
              <span className="text-sm font-semibold text-slate-700">
                Description
              </span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                placeholder="Briefly describe this academic pathway"
                maxLength={500}
                rows={3}
                className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Status
              </span>
              <select
                value={form.status}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target.value
                  )
                }
                className={inputClass(false)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </label>
          </div>

          <section
            className={`rounded-xl border p-4 ${
              errors.applicableClasses
                ? "border-rose-300 bg-rose-50/30"
                : "border-slate-200"
            }`}
          >
            <h3 className="text-sm font-semibold text-slate-800">
              Applicable Classes *
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Streams are available only for senior secondary classes.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {CLASS_OPTIONS.map((className) => (
                <label
                  key={className}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-semibold transition ${
                    form.applicableClasses.includes(
                      className
                    )
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.applicableClasses.includes(
                      className
                    )}
                    onChange={() =>
                      toggleClass(className)
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {className}
                </label>
              ))}
            </div>
            <ErrorText
              message={errors.applicableClasses}
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <SubjectSelector
              label="Compulsory Subjects"
              required
              values={form.compulsorySubjects}
              blockedValues={form.optionalSubjects}
              error={errors.compulsorySubjects}
              onChange={(subjects) =>
                updateField(
                  "compulsorySubjects",
                  subjects
                )
              }
            />
            <SubjectSelector
              label="Optional Subjects"
              values={form.optionalSubjects}
              blockedValues={
                form.compulsorySubjects
              }
              error={errors.optionalSubjects}
              onChange={(subjects) =>
                updateField(
                  "optionalSubjects",
                  subjects
                )
              }
            />
          </div>
        </form>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <Loader2
                className="animate-spin"
                size={16}
              />
            )}
            {loading
              ? "Saving..."
              : mode === "edit"
                ? "Update Stream"
                : "Create Stream"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StreamModal;
