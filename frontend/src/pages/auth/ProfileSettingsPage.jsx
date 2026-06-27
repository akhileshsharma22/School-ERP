import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Camera,
  Check,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../services/api";
import { updateUser } from "../../redux/slices/authSlice";

/* ─── Section Wrapper ─────────────────────────────── */
const Section = ({ title, description, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-5 pb-4 border-b border-slate-100">
      <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-0.5 text-xs text-slate-400 font-medium">{description}</p>
      )}
    </div>
    {children}
  </div>
);

/* ─── Field Row ───────────────────────────────────── */
const FieldRow = ({ label, children }) => (
  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
    <label className="w-32 shrink-0 text-xs font-semibold text-slate-500 uppercase tracking-wide">
      {label}
    </label>
    {children}
  </div>
);

/* ─── Read-only Badge ─────────────────────────────── */
const ReadField = ({ value, icon: Icon }) => (
  <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
    {Icon && <Icon size={14} className="text-slate-400 shrink-0" />}
    <span className="text-sm font-semibold text-slate-700">{value || "—"}</span>
  </div>
);

/* ─── Profile Settings Page ───────────────────────── */
const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const displayName = user?.fullName || "User";
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
    : "Admin";
  const emailVal = user?.email || "";

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  /* Profile Details Edit state */
  const [profileData, setProfileData] = useState({
    fullName: displayName,
    email: emailVal
  });
  const [detailsSaving, setDetailsSaving] = useState(false);

  useEffect(() => {
    setProfileData({
      fullName: displayName,
      email: emailVal
    });
  }, [user]);

  const handleDetailsSave = async (e) => {
    e.preventDefault();
    if (!profileData.fullName.trim()) {
      toast.error("Full Name cannot be empty.");
      return;
    }
    setDetailsSaving(true);
    try {
      const res = await api.put("/auth/profile", {
        fullName: profileData.fullName,
        email: profileData.email
      });
      if (res.data?.success) {
        dispatch(updateUser({
          fullName: res.data.user.fullName,
          email: res.data.user.email
        }));
        toast.success("Account details updated successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update details.");
    } finally {
      setDetailsSaving(false);
    }
  };

  /* Avatar upload state */
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpg", "image/jpeg"];
    if (!allowed.includes(file.type)) {
      toast.error("Format error. Image must be PNG, JPG, or JPEG.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Size error. Maximum image size is 5 MB.");
      return;
    }

    const payload = new FormData();
    payload.append("photo", file);

    const uploadToastId = toast.loading("Uploading new avatar...");
    try {
      const res = await api.put("/auth/profile", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.success) {
        dispatch(updateUser({ photoUrl: res.data.user.photoUrl }));
        toast.success("Profile avatar updated successfully!", { id: uploadToastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload avatar.", { id: uploadToastId });
    }
  };

  /* Password change state */
  const [pwData, setPwData] = useState({
    current: "",
    newPw: "",
    confirm: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const handlePwChange = (e) =>
    setPwData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwError("");
    if (!pwData.current) {
      setPwError("Please enter your current password.");
      return;
    }
    if (pwData.newPw.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (pwData.newPw !== pwData.confirm) {
      setPwError("New passwords do not match.");
      return;
    }

    setPwSaving(true);
    try {
      const res = await api.post("/auth/change-password", {
        currentPassword: pwData.current,
        newPassword: pwData.newPw
      });
      if (res.data?.success) {
        setPwSaved(true);
        setPwData({ current: "", newPw: "", confirm: "" });
        toast.success("Password updated successfully.");
        setTimeout(() => setPwSaved(false), 3000);
      }
    } catch (err) {
      setPwError(err.response?.data?.message || "Incorrect current password.");
    } finally {
      setPwSaving(false);
    }
  };

  /* Gradient based on role */
  const roleGradient =
    user?.role === "ADMIN"
      ? "from-blue-600 to-indigo-600"
      : user?.role === "TEACHER"
      ? "from-emerald-500 to-teal-600"
      : "from-violet-500 to-purple-600";

  const pwInput =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300";

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 py-2">

        {/* Back Button */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <h1 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">
            Profile Settings
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Manage your account details and security
          </p>
        </div>

        {/* ── Avatar Card ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-16 w-16 rounded-2xl bg-slate-50 border overflow-hidden flex items-center justify-center shadow-md relative group">
                {user?.photoUrl ? (
                  <img
                    src={`http://localhost:5000${user.photoUrl}`}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${roleGradient} text-xl font-extrabold text-white`}
                  >
                    {initials}
                  </div>
                )}
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                  <Camera size={14} className="text-white" />
                  <input type="file" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <p className="text-base font-extrabold text-slate-900 tracking-tight">
                {displayName}
              </p>
              <span className="inline-block mt-1 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                {displayRole}
              </span>
            </div>
          </div>
        </div>

        {/* ── Account Info Section ── */}
        <Section
          title="Account Information"
          description="Update your personal details here"
        >
          <form onSubmit={handleDetailsSave} className="space-y-4">
            <FieldRow label="Full Name">
              <input
                type="text"
                value={profileData.fullName}
                onChange={(e) => setProfileData(p => ({ ...p, fullName: e.target.value }))}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </FieldRow>
            <FieldRow label="Email">
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(p => ({ ...p, email: e.target.value }))}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </FieldRow>
            <FieldRow label="Role">
              <ReadField value={displayRole} icon={ShieldCheck} />
            </FieldRow>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={detailsSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:shadow-lg hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {detailsSaving && <Loader2 size={12} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </Section>

        {/* ── Change Password Section ── */}
        <Section
          title="Change Password"
          description="Use a strong password with at least 8 characters"
        >
          <form onSubmit={handlePasswordSave} className="space-y-4">
            {/* Current password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Current Password
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showCurrent ? "text" : "password"}
                  name="current"
                  value={pwData.current}
                  onChange={handlePwChange}
                  placeholder="Enter current password"
                  className={`${pwInput} pl-9 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                New Password
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showNew ? "text" : "password"}
                  name="newPw"
                  value={pwData.newPw}
                  onChange={handlePwChange}
                  placeholder="Minimum 8 characters"
                  className={`${pwInput} pl-9 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirm"
                  value={pwData.confirm}
                  onChange={handlePwChange}
                  placeholder="Repeat new password"
                  className={`${pwInput} pl-9 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {pwError && (
              <p className="text-xs text-red-500 font-semibold">{pwError}</p>
            )}

            {/* Success */}
            {pwSaved && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                <Check size={13} />
                Password updated successfully.
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pwSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:shadow-lg hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pwSaving && <Loader2 size={12} className="animate-spin" />}
                Update Password
              </button>
            </div>
          </form>
        </Section>

      </div>
    </DashboardLayout>
  );
};

export default ProfileSettingsPage;
