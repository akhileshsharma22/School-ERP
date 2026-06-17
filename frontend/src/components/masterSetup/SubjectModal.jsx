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
  BookOpen,
  CheckSquare,
  Hash,
  Loader2,
  Search,
  X,
} from "lucide-react";

import { toast } from "sonner";

import { fetchAllClasses } from "../../redux/slices/classSectionSlice";

const SUBJECT_TYPES = [
  "Core",
  "Elective",
  "Language",
  "Practical",
  "Optional",
];

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

const SubjectModal = ({
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

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectType, setSubjectType] = useState("Core");
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [classSearch, setClassSearch] = useState("");
  const [errors, setErrors] = useState({});

  const nameRef = useRef(null);
  const codeRef = useRef(null);

  useEffect(() => {
    dispatch(fetchAllClasses());
  }, [dispatch]);

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setSubjectName(initialData.subjectName || "");
      setSubjectCode(initialData.subjectCode || "");
      setSubjectType(initialData.subjectType || "Core");
      setSelectedClasses(
        (initialData.classAssignments || []).map(
          (assignment) => ({
            classId: assignment.classId,
            className: assignment.className,
            maxMarks: assignment.maxMarks || 100,
            passingMarks: assignment.passingMarks || 33,
          })
        )
      );
      setErrors({});
      return;
    }

    setSubjectName("");
    setSubjectCode("");
    setSubjectType("Core");
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
    const query = classSearch.trim().toLowerCase();

    if (!query) return classes;

    return classes.filter((cls) =>
      cls.className?.toLowerCase().includes(query)
    );
  }, [classes, classSearch]);

  const isClassSelected = (classId) =>
    selectedClasses.some(
      (item) => item.classId === classId
    );

  const toggleClass = (classItem) => {
    setErrors((current) => ({
      ...current,
      classAssignments: "",
    }));

    if (isClassSelected(classItem._id)) {
      setSelectedClasses((current) =>
        current.filter(
          (item) => item.classId !== classItem._id
        )
      );
      return;
    }

    setSelectedClasses((current) => [
      ...current,
      {
        classId: classItem._id,
        className: classItem.className,
        maxMarks: 100,
        passingMarks: 33,
      },
    ]);
  };

  const selectAllFiltered = () => {
    setErrors((current) => ({
      ...current,
      classAssignments: "",
    }));

    const newSelections = filteredClasses
      .filter((cls) => !isClassSelected(cls._id))
      .map((cls) => ({
        classId: cls._id,
        className: cls.className,
        maxMarks: 100,
        passingMarks: 33,
      }));

    setSelectedClasses((current) => [
      ...current,
      ...newSelections,
    ]);
  };

  const clearAllSelections = () => {
    setSelectedClasses([]);
  };

  const updateAssignment = (classId, field, value) => {
    setSelectedClasses((current) =>
      current.map((item) =>
        item.classId === classId
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const clearFieldError = (field) => {
    setErrors((current) => ({
      ...current,
      [field]: "",
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};
    const validationErrors = [];
    let firstRef = null;

    if (!subjectName.trim()) {
      nextErrors.subjectName = "Subject name is required";
      validationErrors.push("Subject name is required");
      if (!firstRef) firstRef = nameRef;
    }

    if (!subjectCode.trim()) {
      nextErrors.subjectCode = "Subject code is required";
      validationErrors.push("Subject code is required");
      if (!firstRef) firstRef = codeRef;
    }

    for (const assignment of selectedClasses) {
      if (
        !Number.isFinite(Number(assignment.maxMarks)) ||
        Number(assignment.maxMarks) <= 0
      ) {
        validationErrors.push(
          `Max marks for ${assignment.className} must be greater than 0`
        );
      }

      if (
        Number(assignment.passingMarks) < 0
      ) {
        validationErrors.push(
          `Passing marks for ${assignment.className} must be 0 or greater`
        );
      }

      if (
        Number(assignment.passingMarks) >
        Number(assignment.maxMarks)
      ) {
        validationErrors.push(
          `Passing marks cannot exceed max marks for ${assignment.className}`
        );
      }
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
      subjectName: subjectName.trim(),
      subjectCode: subjectCode.trim().toUpperCase(),
      subjectType,
      classAssignments: selectedClasses.map(
        (item) => ({
          classId: item.classId,
          className: item.className,
          maxMarks: Number(item.maxMarks),
          passingMarks: Number(item.passingMarks),
        })
      ),
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

      <div className="relative flex max-h-[92vh] w-full max-w-[680px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              {mode === "edit"
                ? "Edit Subject"
                : "Add Subject"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure subject details, type, and class assignments with marks.
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
                  Subject Name *
                </span>

                <div className="relative mt-1.5">
                  <BookOpen
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />

                  <input
                    ref={nameRef}
                    value={subjectName}
                    onChange={(event) => {
                      clearFieldError("subjectName");
                      setSubjectName(event.target.value);
                    }}
                    placeholder="Mathematics"
                    className={`${getInputClass(
                      errors.subjectName
                    )} pl-9`}
                  />
                </div>

                <ErrorText
                  message={errors.subjectName}
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-700">
                  Subject Code *
                </span>

                <div className="relative mt-1.5">
                  <Hash
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />

                  <input
                    ref={codeRef}
                    value={subjectCode}
                    onChange={(event) => {
                      clearFieldError("subjectCode");
                      setSubjectCode(
                        event.target.value.toUpperCase()
                      );
                    }}
                    placeholder="MATH"
                    className={`${getInputClass(
                      errors.subjectCode
                    )} pl-9`}
                  />
                </div>

                <ErrorText
                  message={errors.subjectCode}
                />
              </label>
            </div>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Subject Type *
              </span>

              <div className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {SUBJECT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSubjectType(type)}
                    className={`flex h-10 items-center justify-center rounded-lg border text-sm font-semibold transition ${
                      subjectType === type
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </label>

            <section className="overflow-hidden rounded-xl border border-slate-200">
              <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    Class Assignments
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    Assign to classes with max & passing marks.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
                    <CheckSquare
                      className="text-slate-400"
                      size={16}
                    />
                    {selectedClasses.length} Selected
                  </span>
                </div>
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
                        setClassSearch(event.target.value)
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
                    <span className="text-slate-300">·</span>
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
                        checked={isClassSelected(cls._id)}
                        onChange={() => toggleClass(cls)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-300"
                      />
                      <span className="truncate">
                        {cls.className}
                      </span>
                    </label>
                  ))}

                  {filteredClasses.length === 0 && (
                    <p className="py-4 text-center text-sm text-slate-400">
                      No classes found
                    </p>
                  )}
                </div>
              </div>

              {selectedClasses.length > 0 && (
                <div className="border-t border-slate-200 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Marks Configuration
                  </p>

                  <div className="space-y-2">
                    {selectedClasses.map((assignment) => (
                      <div
                        key={assignment.classId}
                        className="grid grid-cols-[1fr_100px_100px] gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2"
                      >
                        <div className="flex items-center text-sm font-semibold text-slate-700">
                          {assignment.className}
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">
                            Max
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={assignment.maxMarks}
                            onChange={(event) =>
                              updateAssignment(
                                assignment.classId,
                                "maxMarks",
                                event.target.value
                              )
                            }
                            className={getInputClass(false)}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">
                            Pass
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={assignment.passingMarks}
                            onChange={(event) =>
                              updateAssignment(
                                assignment.classId,
                                "passingMarks",
                                event.target.value
                              )
                            }
                            className={getInputClass(false)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </form>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-400">
            {selectedClasses.length} class
            {selectedClasses.length === 1
              ? ""
              : "es"}{" "}
            assigned · {subjectType}
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
                  ? "Update Subject"
                  : "Create Subject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectModal;
