import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Hash,
  Loader2,
  Tag,
  X,
  FileText,
  Activity,
  Layers,
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

const CategoryModal = ({
  open,
  mode = "create",
  initialData = null,
  loading = false,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [categoryType, setCategoryType] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [errors, setErrors] = useState({});

  const nameRef = useRef(null);
  const codeRef = useRef(null);
  const typeRef = useRef(null);

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

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setName(initialData.name || "");
      setShortCode(initialData.shortCode || "");
      setCategoryType(initialData.categoryType || "");
      setDescription(initialData.description || "");
      setStatus(initialData.status || "Active");
      setErrors({});
      return;
    }

    setName("");
    setShortCode("");
    setCategoryType("");
    setDescription("");
    setStatus("Active");
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

    if (!name.trim()) {
      nextErrors.name = "Category name is required";
      validationErrors.push("Category name is required");
      if (!firstRef) firstRef = nameRef;
    } else if (name.trim().length < 2) {
      nextErrors.name = "Category name must be at least 2 characters";
      validationErrors.push("Category name must be at least 2 characters");
      if (!firstRef) firstRef = nameRef;
    } else if (name.trim().length > 50) {
      nextErrors.name = "Category name cannot exceed 50 characters";
      validationErrors.push("Category name cannot exceed 50 characters");
      if (!firstRef) firstRef = nameRef;
    }

    if (!shortCode.trim()) {
      nextErrors.shortCode = "Short code is required";
      validationErrors.push("Short code is required");
      if (!firstRef) firstRef = codeRef;
    } else if (shortCode.trim().length > 10) {
      nextErrors.shortCode = "Short code cannot exceed 10 characters";
      validationErrors.push("Short code cannot exceed 10 characters");
      if (!firstRef) firstRef = codeRef;
    }

    if (!categoryType) {
      nextErrors.categoryType = "Category type is required";
      validationErrors.push("Category type is required");
      if (!firstRef) firstRef = typeRef;
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
      name: name.trim(),
      shortCode: shortCode.trim().toUpperCase(),
      categoryType,
      description: description.trim(),
      status,
    });
  };

  const isViewMode = mode === "view";

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

      <div className="relative flex max-h-[92vh] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              {mode === "view"
                ? "View Category"
                : mode === "edit"
                  ? "Edit Category"
                  : "Add Category"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Student admission category for records & reports.
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
            <div>
              <span className="text-sm font-semibold text-slate-700 block">
                Category Name *
              </span>

              <div className="relative mt-1.5">
                <Tag
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />

                <input
                  ref={nameRef}
                  value={name}
                  disabled={loading || isViewMode}
                  onChange={(event) => {
                    clearFieldError("name");
                    setName(
                      event.target.value
                    );
                  }}
                  placeholder="General"
                  className={`${getInputClass(
                    errors.name
                  )} pl-9`}
                />
              </div>

              <ErrorText
                message={errors.name}
              />
            </div>

            <div>
              <span className="text-sm font-semibold text-slate-700 block">
                Short Code *
              </span>

              <div className="relative mt-1.5">
                <Hash
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />

                <input
                  ref={codeRef}
                  value={shortCode}
                  disabled={loading || isViewMode}
                  onChange={(event) => {
                    clearFieldError("shortCode");
                    setShortCode(
                      event.target.value.toUpperCase()
                    );
                  }}
                  placeholder="GEN"
                  className={`${getInputClass(
                    errors.shortCode
                  )} pl-9`}
                />
              </div>

              <ErrorText
                message={errors.shortCode}
              />
            </div>

            <div>
              <span className="text-sm font-semibold text-slate-700 block">
                Category Type *
              </span>

              <div className="relative mt-1.5">
                <Layers
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={16}
                />

                <select
                  ref={typeRef}
                  value={categoryType}
                  disabled={loading || isViewMode}
                  onChange={(event) => {
                    clearFieldError("categoryType");
                    setCategoryType(event.target.value);
                  }}
                  className={`${getInputClass(
                    errors.categoryType
                  )} pl-9 appearance-none bg-no-repeat`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "1rem",
                  }}
                >
                  <option value="">Select Category Type</option>
                  {categoryTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <ErrorText
                message={errors.categoryType}
              />
            </div>

            <div>
              <span className="text-sm font-semibold text-slate-700 block">
                Description
              </span>

              <div className="relative mt-1.5">
                <FileText
                  className="absolute left-3 top-3 text-slate-400"
                  size={16}
                />

                <textarea
                  value={description}
                  disabled={loading || isViewMode}
                  onChange={(event) => {
                    setDescription(event.target.value);
                  }}
                  placeholder="Enter details about this category..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                />
              </div>
            </div>

            <div>
              <span className="text-sm font-semibold text-slate-700 block">
                Status
              </span>

              <div className="relative mt-1.5">
                <Activity
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  size={16}
                />

                <select
                  value={status}
                  disabled={loading || isViewMode}
                  onChange={(event) => {
                    setStatus(event.target.value);
                  }}
                  className={`${getInputClass(
                    false
                  )} pl-9 appearance-none bg-no-repeat`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "1rem",
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </form>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
          {isViewMode ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Close
            </button>
          ) : (
            <>
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
                    ? "Update Category"
                    : "Create Category"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
