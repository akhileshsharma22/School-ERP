import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useSelector,
  useDispatch,
} from "react-redux";

import {
  CheckSquare,
  ClipboardList,
  Hash,
  Loader2,
  Percent,
  Search,
  X,
} from "lucide-react";

import { toast } from "sonner";

import { fetchAllClasses } from "../../redux/slices/classSectionSlice";

const inputBaseClass =
  "h-10 w-full rounded-lg border bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:ring-4";

const getInputClass = (error) =>
  `${inputBaseClass} ${
    error
      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
      : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
  }`;

const ErrorText = ({ message }) => {
  if (!message) return null;

  return (
    <p className="mt-1 text-xs font-medium text-rose-600">
      {message}
    </p>
  );
};

const ExamTypeModal = ({
  open,
  mode = "create",
  initialData = null,
  loading = false,
  onClose,
  onSave,
}) => {
  const dispatch = useDispatch();

  const { classes } = useSelector(
    (state) => state.classSections
  );

  const [examName, setExamName] = useState("");
  const [examCode, setExamCode] = useState("");
  const [weightage, setWeightage] = useState("");
  const [selectedClasses, setSelectedClasses] =
    useState([]);
  const [classSearch, setClassSearch] = useState("");
  const [errors, setErrors] = useState({});

  const nameRef = useRef(null);
  const codeRef = useRef(null);
  const weightageRef = useRef(null);

  useEffect(() => {
    dispatch(fetchAllClasses());
  }, [dispatch]);

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setExamName(initialData.examName || "");
      setExamCode(initialData.examCode || "");
      setWeightage(
        initialData.weightage
          ? String(initialData.weightage)
          : ""
      );
      setSelectedClasses(
        (initialData.applicableClasses || []).map(
          (cls) => ({
            classId: cls.classId,
            className: cls.className,
          })
        )
      );
      setErrors({});
      return;
    }

    setExamName("");
    setExamCode("");
    setWeightage("");
    setSelectedClasses([]);
    setClassSearch("");
    setErrors({});
  }, [initialData, open]);

  useEffect(() => {
    if (!open) return undefined;

    const timer = window.setTimeout(() => {
      nameRef.current?.focus();
    }, 80);

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

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [loading, onClose, open]);

  const filteredClasses = useMemo(() => {
    const query = classSearch
      .trim()
      .toLowerCase();

    if (!query) return classes;

    return classes.filter((cls) =>
      cls.className
        ?.toLowerCase()
        .includes(query)
    );
  }, [classes, classSearch]);

  const isClassSelected = (classId) =>
    selectedClasses.some(
      (item) => item.classId === classId
    );

  const toggleClass = (classItem) => {
    if (isClassSelected(classItem._id)) {
      setSelectedClasses((current) =>
        current.filter(
          (item) =>
            item.classId !== classItem._id
        )
      );
      return;
    }

    setSelectedClasses((current) => [
      ...current,
      {
        classId: classItem._id,
        className: classItem.className,
      },
    ]);
  };

  const selectAllFiltered = () => {
    const newSelections = filteredClasses
      .filter(
        (cls) => !isClassSelected(cls._id)
      )
      .map((cls) => ({
        classId: cls._id,
        className: cls.className,
      }));

    setSelectedClasses((current) => [
      ...current,
      ...newSelections,
    ]);
  };

  const clearAllSelections = () => {
    setSelectedClasses([]);
  };

  const clearFieldError = (field) => {
    setErrors((current) => ({
      ...current,
      [field]: "",
    }));
  };

  const weightageNum = Number(weightage) || 0;

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};
    const validationErrors = [];
    let firstRef = null;

    if (!examName.trim()) {
      nextErrors.examName =
        "Exam name is required";
      validationErrors.push(
        "Exam name is required"
      );
      if (!firstRef) firstRef = nameRef;
    }

    if (!examCode.trim()) {
      nextErrors.examCode =
        "Exam code is required";
      validationErrors.push(
        "Exam code is required"
      );
      if (!firstRef) firstRef = codeRef;
    }

    if (
      !Number.isFinite(weightageNum) ||
      weightageNum <= 0
    ) {
      nextErrors.weightage =
        "Weightage must be a positive number";
      validationErrors.push(
        "Weightage must be a positive number"
      );
      if (!firstRef) firstRef = weightageRef;
    }

    if (weightageNum > 100) {
      nextErrors.weightage =
        "Weightage cannot exceed 100%";
      validationErrors.push(
        "Weightage cannot exceed 100%"
      );
      if (!firstRef) firstRef = weightageRef;
    }

    setErrors(nextErrors);

    if (validationErrors.length) {
      [...new Set(validationErrors)].forEach(
        (message) => {
          toast.error(message);
        }
      );

      if (firstRef) {
        window.setTimeout(() => {
          firstRef.current?.focus();
        }, 0);
      }

      return;
    }

    onSave({
      examName: examName.trim(),
      examCode: examCode
        .trim()
        .toUpperCase(),
      weightage: weightageNum,
      applicableClasses: selectedClasses,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-3 py-4 backdrop-blur-sm sm:px-5">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      <div className="relative flex max-h-[92vh] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              {mode === "edit"
                ? "Edit Exam Type"
                : "Add Exam Type"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure exam type with weightage and applicable classes.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4"
        >
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-sm font-semibold text-slate-700">
                  Exam Name *
                </span>

                <div className="relative mt-1.5">
                  <ClipboardList
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />

                  <input
                    ref={nameRef}
                    value={examName}
                    onChange={(event) => {
                      clearFieldError("examName");
                      setExamName(
                        event.target.value
                      );
                    }}
                    placeholder="Unit Test 1"
                    className={`${getInputClass(
                      errors.examName
                    )} pl-9`}
                  />
                </div>

                <ErrorText
                  message={errors.examName}
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-700">
                  Exam Code *
                </span>

                <div className="relative mt-1.5">
                  <Hash
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />

                  <input
                    ref={codeRef}
                    value={examCode}
                    onChange={(event) => {
                      clearFieldError("examCode");
                      setExamCode(
                        event.target.value.toUpperCase()
                      );
                    }}
                    placeholder="UT1"
                    className={`${getInputClass(
                      errors.examCode
                    )} pl-9`}
                  />
                </div>

                <ErrorText
                  message={errors.examCode}
                />
              </label>
            </div>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Weightage (%) *
              </span>

              <div className="relative mt-1.5">
                <Percent
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />

                <input
                  ref={weightageRef}
                  type="number"
                  min="1"
                  max="100"
                  value={weightage}
                  onChange={(event) => {
                    clearFieldError("weightage");
                    setWeightage(
                      event.target.value
                    );
                  }}
                  placeholder="10"
                  className={`${getInputClass(
                    errors.weightage
                  )} pl-9`}
                />
              </div>

              <ErrorText
                message={errors.weightage}
              />

              {weightageNum > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        weightageNum > 100
                          ? "bg-rose-500"
                          : weightageNum > 50
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          weightageNum,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      weightageNum > 100
                        ? "text-rose-600"
                        : "text-slate-500"
                    }`}
                  >
                    {weightageNum}%
                  </span>
                </div>
              )}
            </label>

            <section className="overflow-hidden rounded-xl border border-slate-200">
              <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">
                    Applicable Classes
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    Select classes where this exam type applies.
                  </p>
                </div>

                <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600">
                  <CheckSquare
                    className="text-slate-400"
                    size={14}
                  />
                  {selectedClasses.length} selected
                </span>
              </div>

              <div className="p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-xs">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />

                    <input
                      value={classSearch}
                      onChange={(event) =>
                        setClassSearch(
                          event.target.value
                        )
                      }
                      placeholder="Search classes..."
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllFiltered}
                      className="text-xs font-semibold text-slate-600 transition hover:text-slate-950"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">
                      ·
                    </span>
                    <button
                      type="button"
                      onClick={clearAllSelections}
                      className="text-xs font-semibold text-slate-600 transition hover:text-slate-950"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="mt-3 max-h-[200px] space-y-1 overflow-y-auto">
                  {filteredClasses.map((cls) => (
                    <label
                      key={cls._id}
                      className="flex h-10 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={isClassSelected(
                          cls._id
                        )}
                        onChange={() =>
                          toggleClass(cls)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-300"
                      />
                      <span className="truncate">
                        {cls.className}
                      </span>
                    </label>
                  ))}

                  {filteredClasses.length ===
                    0 && (
                    <p className="py-4 text-center text-sm text-slate-400">
                      No classes found
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </form>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-400">
            {weightageNum > 0
              ? `${weightageNum}% weightage`
              : "No weightage set"}{" "}
            · {selectedClasses.length} class
            {selectedClasses.length === 1
              ? ""
              : "es"}
          </p>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
                  ? "Update Exam Type"
                  : "Create Exam Type"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamTypeModal;
