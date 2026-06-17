import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BookOpen,
  Loader2,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { toast } from "sonner";

const EXAM_TYPE_OPTIONS = [
  "Unit Test",
  "Half Yearly",
  "Annual Exam",
  "Practical",
];

const createEmptySection = () => ({
  sectionName: "",
  capacity: "",
  classTeacher: "",
});

const emptyErrors = {
  className: "",
  status: "",
  examTypes: "",
  sections: [],
};

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

const ClassSectionModal = ({
  open,
  mode = "create",
  initialData = null,
  loading = false,
  onClose,
  onSave,
}) => {
  const [className, setClassName] =
    useState("");
  const [status, setStatus] =
    useState("Active");
  const [examTypes, setExamTypes] =
    useState([]);
  const [sections, setSections] = useState([
    createEmptySection(),
  ]);
  const [displayOrder, setDisplayOrder] =
    useState(null);
  const [errors, setErrors] =
    useState(emptyErrors);

  const classNameRef = useRef(null);
  const statusRef = useRef(null);
  const examTypesRef = useRef(null);
  const sectionNameRefs = useRef([]);
  const capacityRefs = useRef([]);

  const totalCapacity = useMemo(
    () =>
      sections.reduce(
        (total, section) =>
          total + Number(section.capacity || 0),
        0
      ),
    [sections]
  );

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setClassName(initialData.className || "");
      setStatus(initialData.status || "Active");
      setExamTypes(initialData.examTypes || []);
      setSections(
        initialData.sections?.length
          ? initialData.sections.map(
              (section) => ({
                sectionName:
                  section.sectionName || "",
                capacity:
                  section.capacity || "",
                classTeacher:
                  section.classTeacher || "",
              })
            )
          : [createEmptySection()]
      );
      setDisplayOrder(
        initialData.displayOrder || null
      );
      setErrors(emptyErrors);
      return;
    }

    setClassName("");
    setStatus("Active");
    setExamTypes([]);
    setSections([createEmptySection()]);
    setDisplayOrder(null);
    setErrors(emptyErrors);
  }, [initialData, open]);

  useEffect(() => {
    if (!open) return undefined;

    const timer = window.setTimeout(() => {
      classNameRef.current?.focus();
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

  const clearFieldError = (field) => {
    setErrors((current) => ({
      ...current,
      [field]: "",
    }));
  };

  const clearSectionError = (index, field) => {
    setErrors((current) => {
      const nextSectionErrors = [
        ...current.sections,
      ];

      nextSectionErrors[index] = {
        ...(nextSectionErrors[index] || {}),
        [field]: "",
      };

      return {
        ...current,
        sections: nextSectionErrors,
      };
    });
  };

  const updateSection = (
    index,
    field,
    value
  ) => {
    clearSectionError(index, field);

    setSections((current) =>
      current.map((section, sectionIndex) =>
        sectionIndex === index
          ? {
              ...section,
              [field]: value,
            }
          : section
      )
    );
  };

  const addSection = () => {
    setSections((current) => [
      ...current,
      createEmptySection(),
    ]);

    setErrors((current) => ({
      ...current,
      sections: [...current.sections, {}],
    }));
  };

  const removeSection = (index) => {
    setSections((current) =>
      current.length === 1
        ? current
        : current.filter(
            (_, sectionIndex) =>
              sectionIndex !== index
          )
    );

    setErrors((current) => ({
      ...current,
      sections: current.sections.filter(
        (_, sectionIndex) =>
          sectionIndex !== index
      ),
    }));
  };

  const toggleExamType = (examType) => {
    clearFieldError("examTypes");

    setExamTypes((current) =>
      current.includes(examType)
        ? current.filter(
            (item) => item !== examType
          )
        : [...current, examType]
    );
  };

  const focusInvalidField = (target) => {
    window.setTimeout(() => {
      if (target.field === "className") {
        classNameRef.current?.focus();
        return;
      }

      if (target.field === "status") {
        statusRef.current?.focus();
        return;
      }

      if (target.field === "examTypes") {
        examTypesRef.current?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
        return;
      }

      if (target.field === "sectionName") {
        sectionNameRefs.current[
          target.index
        ]?.focus();
        return;
      }

      if (target.field === "capacity") {
        capacityRefs.current[
          target.index
        ]?.focus();
      }
    }, 0);
  };

  const validateForm = () => {
    const nextErrors = {
      className: "",
      status: "",
      examTypes: "",
      sections: sections.map(() => ({})),
    };
    const validationErrors = [];
    let firstInvalidTarget = null;

    const addError = (
      message,
      target,
      assign
    ) => {
      validationErrors.push(message);
      assign();

      if (!firstInvalidTarget) {
        firstInvalidTarget = target;
      }
    };

    if (!className.trim()) {
      addError(
        "Class Name is required",
        {
          field: "className",
        },
        () => {
          nextErrors.className =
            "Class Name is required";
        }
      );
    }

    if (!status) {
      addError(
        "Status is required",
        {
          field: "status",
        },
        () => {
          nextErrors.status =
            "Status is required";
        }
      );
    }

    if (!examTypes.length) {
      addError(
        "Exam Type is required",
        {
          field: "examTypes",
        },
        () => {
          nextErrors.examTypes =
            "Exam Type is required";
        }
      );
    }

    if (!sections.length) {
      addError(
        "At least one section is required",
        {
          field: "sectionName",
          index: 0,
        },
        () => {
          nextErrors.sections = [
            {
              sectionName:
                "At least one section is required",
            },
          ];
        }
      );
    }

    const sectionNames = new Map();

    sections.forEach((section, index) => {
      if (!section.sectionName.trim()) {
        addError(
          "Section Name is required",
          {
            field: "sectionName",
            index,
          },
          () => {
            nextErrors.sections[index] = {
              ...nextErrors.sections[index],
              sectionName:
                "Section Name is required",
            };
          }
        );
      }

      if (Number(section.capacity) <= 0) {
        addError(
          "Capacity must be greater than 0",
          {
            field: "capacity",
            index,
          },
          () => {
            nextErrors.sections[index] = {
              ...nextErrors.sections[index],
              capacity:
                "Capacity must be greater than 0",
            };
          }
        );
      }

      const sectionKey =
        section.sectionName.trim().toLowerCase();

      if (!sectionKey) return;

      if (sectionNames.has(sectionKey)) {
        const firstIndex =
          sectionNames.get(sectionKey);

        addError(
          "Duplicate section names are not allowed",
          {
            field: "sectionName",
            index,
          },
          () => {
            nextErrors.sections[firstIndex] = {
              ...nextErrors.sections[firstIndex],
              sectionName:
                "Duplicate section names are not allowed",
            };
            nextErrors.sections[index] = {
              ...nextErrors.sections[index],
              sectionName:
                "Duplicate section names are not allowed",
            };
          }
        );
      } else {
        sectionNames.set(sectionKey, index);
      }
    });

    return {
      nextErrors,
      validationErrors,
      firstInvalidTarget,
    };
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const {
      nextErrors,
      validationErrors,
      firstInvalidTarget,
    } = validateForm();

    setErrors(nextErrors);

    if (validationErrors.length) {
      [
        ...new Set(validationErrors),
      ].forEach((message) => {
        toast.error(message);
      });

      focusInvalidField(firstInvalidTarget);
      return;
    }

    onSave({
      className: className.trim(),
      displayOrder,
      status,
      examTypes,
      sections: sections.map((section) => ({
        sectionName:
          section.sectionName.trim(),
        capacity: Number(section.capacity),
        classTeacher:
          section.classTeacher.trim(),
      })),
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

      <div className="relative flex max-h-[92vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              {mode === "edit"
                ? "Edit Class Structure"
                : "Add Class Structure"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure class details, exam types, sections, teachers, and capacity.
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
                  Class Name *
                </span>

                <div className="relative mt-1.5">
                  <BookOpen
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />

                  <input
                    ref={classNameRef}
                    value={className}
                    onChange={(event) => {
                      clearFieldError("className");
                      setClassName(
                        event.target.value
                      );
                    }}
                    placeholder="Class 1"
                    className={`${getInputClass(
                      errors.className
                    )} pl-9`}
                  />
                </div>

                <ErrorText
                  message={errors.className}
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-700">
                  Status *
                </span>

                <select
                  ref={statusRef}
                  value={status}
                  onChange={(event) => {
                    clearFieldError("status");
                    setStatus(event.target.value);
                  }}
                  className={`${getInputClass(
                    errors.status
                  )} mt-1.5`}
                >
                  <option value="Active">
                    Active
                  </option>
                  <option value="Inactive">
                    Inactive
                  </option>
                </select>

                <ErrorText
                  message={errors.status}
                />
              </label>
            </div>

            <section
              ref={examTypesRef}
              className={`rounded-xl border p-3 ${
                errors.examTypes
                  ? "border-rose-300 bg-rose-50/40"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  Exam Types *
                </p>

                <p className="text-xs font-medium text-slate-400">
                  Select one or more
                </p>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {EXAM_TYPE_OPTIONS.map(
                  (examType) => (
                    <label
                      key={examType}
                      className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={examTypes.includes(
                          examType
                        )}
                        onChange={() =>
                          toggleExamType(examType)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-300"
                      />
                      <span className="truncate">
                        {examType}
                      </span>
                    </label>
                  )
                )}
              </div>

              <ErrorText
                message={errors.examTypes}
              />
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200">
              <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    Section Builder
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    Compact section setup with live capacity.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
                    <Users
                      className="text-slate-400"
                      size={16}
                    />
                    Total Capacity: {totalCapacity}
                  </div>

                  <button
                    type="button"
                    onClick={addSection}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Plus size={16} />
                    Add Section
                  </button>
                </div>
              </div>

              <div className="p-3">
                <div className="hidden grid-cols-[1fr_120px_1fr_40px] gap-2 px-1 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 lg:grid">
                  <span>Section Name</span>
                  <span>Capacity</span>
                  <span>Class Teacher</span>
                  <span />
                </div>

                <div className="space-y-2">
                  {sections.map(
                    (section, index) => {
                      const sectionErrors =
                        errors.sections[index] || {};

                      return (
                        <div
                          key={index}
                          className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 lg:grid-cols-[1fr_120px_1fr_40px]"
                        >
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 lg:hidden">
                              Section Name
                            </label>
                            <input
                              ref={(element) => {
                                sectionNameRefs.current[
                                  index
                                ] = element;
                              }}
                              value={
                                section.sectionName
                              }
                              onChange={(event) =>
                                updateSection(
                                  index,
                                  "sectionName",
                                  event.target.value
                                )
                              }
                              placeholder="A"
                              className={getInputClass(
                                sectionErrors.sectionName
                              )}
                            />
                            <ErrorText
                              message={
                                sectionErrors.sectionName
                              }
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 lg:hidden">
                              Capacity
                            </label>
                            <input
                              ref={(element) => {
                                capacityRefs.current[
                                  index
                                ] = element;
                              }}
                              type="number"
                              min="1"
                              value={
                                section.capacity
                              }
                              onChange={(event) =>
                                updateSection(
                                  index,
                                  "capacity",
                                  event.target.value
                                )
                              }
                              placeholder="40"
                              className={getInputClass(
                                sectionErrors.capacity
                              )}
                            />
                            <ErrorText
                              message={
                                sectionErrors.capacity
                              }
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-500 lg:hidden">
                              Class Teacher
                            </label>
                            <input
                              value={
                                section.classTeacher
                              }
                              onChange={(event) =>
                                updateSection(
                                  index,
                                  "classTeacher",
                                  event.target.value
                                )
                              }
                              placeholder="Teacher name"
                              className={getInputClass(
                                false
                              )}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeSection(index)
                            }
                            disabled={
                              sections.length === 1
                            }
                            className="inline-flex h-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </section>
          </div>
        </form>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-400">
            {sections.length} section
            {sections.length === 1 ? "" : "s"} ·{" "}
            {totalCapacity} total capacity
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
                  ? "Update Class"
                  : "Create Class"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassSectionModal;
