import {
  Search,
  Menu,
  Bell,
  ChevronDown,
  Command,
  Plus,
  UserRound,
} from "lucide-react";
import { useState } from "react";

const notifications = [
  "Fee reminder queue needs review",
  "11 leave requests pending",
  "New admission enquiry assigned",
];

const Navbar = ({ collapsed, onToggleSidebar, onOpenMobileSidebar }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm shadow-slate-100/50 backdrop-blur sm:px-5 lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          className="rounded-xl p-1.5 text-slate-600 transition hover:bg-slate-100 lg:hidden cursor-pointer"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>

        <button
          className="hidden rounded-xl p-1.5 text-slate-600 transition hover:bg-slate-100 lg:inline-flex cursor-pointer"
          onClick={onToggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu size={18} />
        </button>

        <div className="hidden min-w-0 sm:block ml-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-slate-600 font-bold">Overview</span>
          </div>
          <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">
            Command Center
          </h1>
        </div>

        <div className="relative hidden xl:block ml-6">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            placeholder="Search students, staff, fees..."
            className="h-9 w-[280px] rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-12 text-xs outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 font-medium"
          />

          <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400 font-bold 2xl:flex">
            <Command size={10} />
            K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        <button className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 px-3 text-xs font-bold text-white shadow hover:shadow-md transition hover:-translate-y-0.5 cursor-pointer">
          <Plus size={14} />
          <span className="hidden sm:inline">Quick Create</span>
        </button>

        <div className="relative">
          <button
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 cursor-pointer"
            onClick={() => {
              setNotificationsOpen((value) => !value);
              setProfileOpen(false);
            }}
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-250 bg-white p-1.5 shadow-xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-100">
              <p className="px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Notifications
              </p>
              <div className="mt-1 space-y-0.5">
                {notifications.map((item) => (
                  <button
                    key={item}
                    className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-slate-600 transition hover:bg-slate-50 font-medium cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 pr-2 transition hover:bg-slate-50 cursor-pointer h-9"
            onClick={() => {
              setProfileOpen((value) => !value);
              setNotificationsOpen(false);
            }}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-extrabold text-white">
              AK
            </div>

            <div className="hidden text-left md:block">
              <p className="text-xs font-bold leading-none text-slate-800">
                Akhilesh
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-none">
                Admin
              </p>
            </div>

            <ChevronDown size={12} className="hidden text-slate-400 md:block ml-0.5" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-250 bg-white p-1.5 shadow-xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-100">
              <button className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs text-slate-700 transition hover:bg-slate-50 font-medium cursor-pointer">
                <UserRound size={13} />
                Profile Settings
              </button>
              <button className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-slate-700 transition hover:bg-slate-50 font-medium cursor-pointer">
                Switch Role
              </button>
              <button className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-red-650 transition hover:bg-red-50 font-bold cursor-pointer border-t border-slate-100 mt-1 pt-1.5">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
