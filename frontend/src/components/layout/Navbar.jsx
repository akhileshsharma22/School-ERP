import { ChevronDown, Menu, LogOut, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../redux/slices/authSlice";

/* ─── Logout Confirmation Modal ─────────────────────────────────────── */
const LogoutModal = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      onClick={onCancel}
    />

    {/* Dialog */}
    <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/60 animate-in fade-in zoom-in-95 duration-200">
      {/* Icon */}
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 border border-red-100">
        <LogOut size={20} className="text-red-500" />
      </div>

      <h2 className="text-center text-base font-extrabold text-slate-900 tracking-tight">
        Logout
      </h2>
      <p className="mt-1.5 text-center text-sm text-slate-500 font-medium">
        Are you sure you want to sign out?
      </p>

      <div className="mt-5 flex gap-3">
        <button
          id="logout-cancel-btn"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          id="logout-confirm-btn"
          onClick={onConfirm}
          className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 cursor-pointer shadow-md shadow-red-500/20"
        >
          Logout
        </button>
      </div>
    </div>
  </div>
);

/* ─── Navbar ─────────────────────────────────────────────────────────── */
const Navbar = ({ collapsed, onToggleSidebar, onOpenMobileSidebar }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const dropdownRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);

  /* Close dropdown when clicking outside */
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  /* Derive display values from Redux user */
  const displayName = user?.name || user?.fullName || user?.email?.split("@")[0] || "User";
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
    : "Admin";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  /* Gradient based on role */
  const roleGradient =
    displayRole.toLowerCase() === "admin"
      ? "from-blue-600 to-indigo-600"
      : displayRole.toLowerCase() === "staff"
      ? "from-emerald-500 to-teal-600"
      : "from-violet-500 to-purple-600";

  const handleLogoutConfirm = () => {
    /* Clear all persisted auth data */
    localStorage.clear();
    sessionStorage.clear();
    dispatch(logout());
    setShowLogoutModal(false);
    navigate("/login", { replace: true });
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm shadow-slate-100/50 backdrop-blur sm:px-5 lg:px-6">

        {/* ── Left Side ── */}
        <div className="flex min-w-0 items-center gap-2">
          {/* Mobile sidebar toggle */}
          <button
            id="mobile-sidebar-toggle"
            className="rounded-xl p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 lg:hidden cursor-pointer"
            onClick={onOpenMobileSidebar}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            id="desktop-sidebar-toggle"
            className="hidden rounded-xl p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 lg:inline-flex cursor-pointer"
            onClick={onToggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <div className="hidden min-w-0 sm:block ml-1">
            <p className="text-[11px] font-semibold text-slate-400 leading-none">
              Springfield ERP
            </p>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900 leading-snug mt-0.5">
              Dashboard
            </h1>
          </div>
        </div>

        {/* ── Right Side ── */}
        <div className="flex items-center gap-2" ref={dropdownRef}>

          {/* Profile Trigger */}
          <button
            id="profile-dropdown-btn"
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 transition hover:bg-slate-50 hover:border-slate-300 cursor-pointer h-10 group"
            onClick={() => setProfileOpen((v) => !v)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            {/* Avatar */}
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${roleGradient} text-[11px] font-extrabold text-white shadow-sm`}
            >
              {initials}
            </div>

            {/* Name + Role */}
            <div className="hidden text-left md:block">
              <p className="text-xs font-bold leading-none text-slate-800">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-none">
                {displayRole}
              </p>
            </div>

            <ChevronDown
              size={13}
              className={`hidden text-slate-400 md:block transition-transform duration-200 ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="absolute right-4 top-[68px] w-52 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden animate-in fade-in zoom-in-95 duration-150 z-30">

              {/* User identity header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${roleGradient} text-xs font-extrabold text-white shadow-sm`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {displayName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold truncate">
                      {user?.email || displayRole}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-1.5">
                <button
                  id="profile-settings-btn"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/profile/settings");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  <Settings size={14} className="text-slate-400 shrink-0" />
                  Profile Settings
                </button>

                {/* Divider */}
                <div className="my-1 h-px bg-slate-100 mx-1" />

                <button
                  id="logout-btn"
                  onClick={() => {
                    setProfileOpen(false);
                    setShowLogoutModal(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-bold text-red-500 transition hover:bg-red-50 cursor-pointer"
                >
                  <LogOut size={14} className="shrink-0" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </>
  );
};

export default Navbar;
