import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Building2,
  Hash,
  Loader2,
  X,
} from "lucide-react";

import { toast } from "sonner";

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

const DepartmentModal = ({
  open,
  mode = "create",
  initialData = null,
  loading = false,
  onClose,
  onSave,
}) => {
  const [departmentName, setDepartmentName] =
    useState("");
  const [departmentCode, setDepartmentCode] =
    useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});

  const nameRef = useRef(null);
  const codeRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setDepartmentName(
        initialData.departmentName || ""
      );
      setDepartmentCode(
        initialData.departmentCode || ""
      );
      setDescription(initialData.description || "");
      setErrors({});
      return;
    }

    setDepartmentName("");
    setDepartmentCode("");
    setDescription("");
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

    if (!departmentName.trim()) {
      nextErrors.departmentName =
        "Department name is required";
      validationErrors.push(
        "Department name is required"
      );
      if (!firstRef) firstRef = nameRef;
    }

    if (!departmentCode.trim()) {
      nextErrors.departmentCode =
        "Department code is required";
      validationErrors.push(
        "Department code is required"
      );
      if (!firstRef) firstRef = codeRef;
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
      departmentName: departmentName.trim(),
      departmentCode: departmentCode
        .trim()
        .toUpperCase(),
      description: description.trim(),
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

      <div className="relative flex max-h-[92vh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              {mode === "edit"
                ? "Edit Department"
                : "Add Department"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure department name, code, and description.
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
            <label>
              <span className="text-sm font-semibold text-slate-700">
                Department Name *
              </span>

              <div className="relative mt-1.5">
                <Building2
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />

                <input
                  ref={nameRef}
                  value={departmentName}
                  onChange={(event) => {
                    clearFieldError("departmentName");
                    setDepartmentName(
                      event.target.value
                    );
                  }}
                  placeholder="Administration"
                  className={`${getInputClass(
                    errors.departmentName
                  )} pl-9`}
                />
              </div>

              <ErrorText
                message={errors.departmentName}
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Department Code *
              </span>

              <div className="relative mt-1.5">
                <Hash
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />

                <input
                  ref={codeRef}
                  value={departmentCode}
                  onChange={(event) => {
                    clearFieldError("departmentCode");
                    setDepartmentCode(
                      event.target.value.toUpperCase()
                    );
                  }}
                  placeholder="ADMIN"
                  className={`${getInputClass(
                    errors.departmentCode
                  )} pl-9`}
                />
              </div>

              <ErrorText
                message={errors.departmentCode}
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Description
              </span>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Brief description of the department..."
                rows={3}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </label>
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
                ? "Update Department"
                : "Create Department"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepartmentModal;
