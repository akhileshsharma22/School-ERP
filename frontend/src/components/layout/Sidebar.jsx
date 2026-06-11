import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  ShieldCheck,
  X,
} from "lucide-react";
import { menuItems } from "../../config/menuConfig";

const Sidebar = ({ collapsed = false, mobileOpen = false, onCloseMobile }) => {
  const { pathname } = useLocation();
  const [openMenus, setOpenMenus] = useState([
    "Admissions",
    "Students",
  ]);

  const toggleMenu = (title) => {
    setOpenMenus((prev) =>
      prev.includes(title)
      ? prev.filter((item) => item !== title)
      : [...prev, title]
    );
  };

  const isActive = (item) => {
    if (item.path && pathname.startsWith(item.path)) {
      return true;
    }

    return item.children?.some((child) => pathname.startsWith(child.path));
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col bg-[#0F172A] text-white shadow-2xl transition-all duration-300 ease-out ${
        collapsed ? "lg:w-20" : "lg:w-[280px]"
      } ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } w-[280px]`}
    >

      {/* Logo */}
      <div className="flex h-[70px] items-center justify-between border-b border-white/10 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-950/30">
            <ShieldCheck size={22} />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight">
                Springfield ERP
              </p>
              <p className="truncate text-xs text-slate-400">
                School Operations
              </p>
            </div>
          )}
        </div>

        <button
          className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4">

        <nav className="space-y-1">

          {menuItems.map((item) => {
            const active = isActive(item);
            const open = openMenus.includes(item.title);
            const Icon = item.icon;

            return (
              <div key={item.title}>

              {/* Parent Menu */}
              <button
                onClick={() =>
                  item.children &&
                  toggleMenu(item.title)
                }
                title={collapsed ? item.title : undefined}
                className={`group flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-sm transition-all duration-200 ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/25"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
                  <Icon
                    size={20}
                    className={active ? "text-white" : "text-slate-400 group-hover:text-white"}
                  />

                  {!collapsed && (
                    <span className="font-medium">
                    {item.title}
                  </span>
                  )}
                </div>

                {item.children && !collapsed && (
                  open
                    ? (
                      <ChevronDown size={18} />
                    )
                    : (
                      <ChevronRight size={18} />
                    )
                )}
              </button>

              {/* Children */}
              {item.children &&
                open &&
                !collapsed && (
                  <div className="ml-6 mt-1 space-y-1 border-l border-white/10 pl-3">

                    {item.children.map(
                      (child) => (
                        <button
                          key={child.title}
                          className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-all ${
                            pathname.startsWith(child.path)
                              ? "bg-white/10 text-white"
                              : "text-slate-400 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {child.title}
                        </button>
                      )
                    )}

                  </div>
                )}

            </div>
            );
          })}

        </nav>

      </div>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">

        <div className={`rounded-2xl border border-white/10 bg-white/[0.06] p-4 ${collapsed ? "px-2" : ""}`}>

          <p className="text-xs uppercase tracking-wider text-slate-400">
            Academic Year
          </p>

          <h3 className={`mt-1 font-bold ${collapsed ? "text-sm" : "text-2xl"}`}>
            {collapsed ? "26-27" : "2026-27"}
          </h3>

          {!collapsed && (
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-300">
              <PanelLeftClose size={13} />
            Active Session
          </p>
          )}

        </div>

      </div>

    </aside>
  );
};

export default Sidebar;
