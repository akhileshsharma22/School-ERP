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
    <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-white/70 bg-white/80 px-4 shadow-sm shadow-slate-200/40 backdrop-blur-xl sm:px-5 lg:px-6">

      <div className="flex min-w-0 items-center gap-3">

        <button
          className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar"
        >
          <Menu size={21} />
        </button>

        <button
          className="hidden rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:inline-flex"
          onClick={onToggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu size={21} />
        </button>

        <div className="hidden min-w-0 sm:block">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-slate-900">Overview</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-950 lg:text-2xl">
            Command Center
          </h1>
        </div>

        <div className="relative hidden xl:block">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            placeholder="Search students, staff, fees..."
            className="h-11 w-[360px] rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-16 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />

          <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500 2xl:flex">
            <Command size={12} />
            K
          </div>

        </div>

      </div>

      <div className="flex items-center gap-2 sm:gap-3">

        <button className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#2563EB] px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 sm:px-4">
          <Plus size={17} />
          <span className="hidden sm:inline">Quick Create</span>
        </button>

        <div className="relative">
          <button
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            onClick={() => setNotificationsOpen((value) => !value)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70">
              <p className="px-3 py-2 text-sm font-semibold text-slate-900">
                Notifications
              </p>
              {notifications.map((item) => (
                <button
                  key={item}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 pr-2 transition hover:bg-slate-50"
            onClick={() => setProfileOpen((value) => !value)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              AK
            </div>

            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold leading-4 text-slate-900">
                Akhilesh
              </p>

              <p className="text-xs text-slate-500">
              Admin
            </p>
          </div>

            <ChevronDown size={16} className="hidden text-slate-400 md:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70">
              <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50">
                <UserRound size={16} />
                Profile Settings
              </button>
              <button className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50">
                Switch Role
              </button>
              <button className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50">
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
