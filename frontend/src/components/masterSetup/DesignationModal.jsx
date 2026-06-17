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
  Briefcase,
  Hash,
  Loader2,
  Search,
  X,
} from "lucide-react";

import { toast } from "sonner";

import { fetchAllDepartments } from "../../redux/slices/departmentSlice";

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

const DesignationModal = ({
  open,
  mode = "create",
  initialData = null,
  loading = false,
  onClose,
  onSave,
}) => {
  const dispatch = useDispatch();

  const { departments } = useSelector(
    (state) => state.departments
  );

  const [designationName, setDesignationName] =
    useState("");
  const [designationCode, setDesignationCode] =
    useState("");
  const [selectedDepts, setSelectedDepts] = useState(
    []
  );
  const [deptSearch, setDeptSearch] = useState("");
  const [errors, setErrors] = useState({});

  const nameRef = useRef(null);
  const codeRef = useRef(null);

  useEffect(() => {
    dispatch(fetchAllDepartments());
  }, [dispatch]);

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setDesignationName(
        initialData.designationName || ""
      );
      setDesignationCode(
        initialData.designationCode || ""
      );
      setSelectedDepts(
        (initialData.departments || []).map(
          (dept) => ({
            departmentId: dept.departmentId,
            departmentName: dept.departmentName,
          })
        )
      );
      setErrors({});
      return;
    }

    setDesignationName("");
    setDesignationCode("");
    setSelectedDepts([]);
    setDeptSearch("");
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

  const filteredDepartments = useMemo(() => {
    const query = deptSearch.trim().toLowerCase();

    if (!query) return departments;

    return departments.filter((dept) =>
      dept.departmentName
        ?.toLowerCase()
        .includes(query)
    );
  }, [departments, deptSearch]);

  const isDeptSelected = (departmentId) =>
    selectedDepts.some(
      (item) => item.departmentId === departmentId
    );

  const toggleDept = (dept) => {
    setErrors((current) => ({
      ...current,
      departments: "",
    }));

    if (isDeptSelected(dept._id)) {
      setSelectedDepts((current) =>
        current.filter(
          (item) =>
            item.departmentId !== dept._id
        )
      );
      return;
    }

    setSelectedDepts((current) => [
      ...current,
      {
        departmentId: dept._id,
        departmentName: dept.departmentName,
      },
    ]);
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

    if (!designationName.trim()) {
      nextErrors.designationName =
        "Designation name is required";
      validationErrors.push(
        "Designation name is required"
      );
      if (!firstRef) firstRef = nameRef;
    }

    if (!designationCode.trim()) {
      nextErrors.designationCode =
        "Designation code is required";
      validationErrors.push(
        "Designation code is required"
      );
      if (!firstRef) firstRef = codeRef;
    }

    if (!selectedDepts.length) {
      nextErrors.departments =
        "At least one department is required";
      validationErrors.push(
        "At least one department is required"
      );
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
      designationName: designationName.trim(),
      designationCode: designationCode
        .trim()
        .toUpperCase(),
      departments: selectedDepts,
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

      <div className="relative flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              {mode === "edit"
                ? "Edit Designation"
                : "Add Designation"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure designation and map to departments.
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
                  Designation Name *
                </span>

                <div className="relative mt-1.5">
                  <Briefcase
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />

                  <input
                    ref={nameRef}
                    value={designationName}
                    onChange={(event) => {
                      clearFieldError(
                        "designationName"
                      );
                      setDesignationName(
                        event.target.value
                      );
                    }}
                    placeholder="Principal"
                    className={`${getInputClass(
                      errors.designationName
                    )} pl-9`}
                  />
                </div>

                <ErrorText
                  message={
                    errors.designationName
                  }
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-700">
                  Code *
                </span>

                <div className="relative mt-1.5">
                  <Hash
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />

                  <input
                    ref={codeRef}
                    value={designationCode}
                    onChange={(event) => {
                      clearFieldError(
                        "designationCode"
                      );
                      setDesignationCode(
                        event.target.value.toUpperCase()
                      );
                    }}
                    placeholder="PRINC"
                    className={`${getInputClass(
                      errors.designationCode
                    )} pl-9`}
                  />
                </div>

                <ErrorText
                  message={
                    errors.designationCode
                  }
                />
              </label>
            </div>

            <section
              className={`overflow-hidden rounded-xl border ${
                errors.departments
                  ? "border-rose-300"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">
                    Department Mapping *
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    Select departments this designation belongs to.
                  </p>
                </div>

                <span className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600">
                  {selectedDepts.length} selected
                </span>
              </div>

              <div className="p-3">
                <div className="relative mb-2">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />

                  <input
                    value={deptSearch}
                    onChange={(event) =>
                      setDeptSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search departments..."
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-medium outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <div className="max-h-[180px] space-y-1 overflow-y-auto">
                  {filteredDepartments.map(
                    (dept) => (
                      <label
                        key={dept._id}
                        className="flex h-10 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={isDeptSelected(
                            dept._id
                          )}
                          onChange={() =>
                            toggleDept(dept)
                          }
                          className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-300"
                        />
                        <span className="truncate">
                          {dept.departmentName}
                        </span>
                        <span className="ml-auto text-xs font-medium text-slate-400">
                          {dept.departmentCode}
                        </span>
                      </label>
                    )
                  )}

                  {filteredDepartments.length ===
                    0 && (
                    <p className="py-4 text-center text-sm text-slate-400">
                      No departments found
                    </p>
                  )}
                </div>
              </div>

              {selectedDepts.length > 0 && (
                <div className="border-t border-slate-200 px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    {selectedDepts.map((dept) => (
                      <span
                        key={dept.departmentId}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {dept.departmentName}
                        <button
                          type="button"
                          onClick={() =>
                            toggleDept({
                              _id: dept.departmentId,
                            })
                          }
                          className="text-slate-400 transition hover:text-slate-700"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <ErrorText
                message={errors.departments}
              />
            </section>
          </div>
        </form>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
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
                ? "Update Designation"
                : "Create Designation"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignationModal;
