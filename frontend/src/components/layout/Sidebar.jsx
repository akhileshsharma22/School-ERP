import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ChevronDown, ChevronRight, ShieldCheck, X } from "lucide-react";
import { menuItems } from "../../config/menuConfig";
import { fetchCurrentAcademicYear } from "../../redux/slices/academicYearSlice";

const Sidebar = ({
  collapsed = false,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { pathname } = useLocation();
  const dispatch = useDispatch();

  const { currentAcademicYear } = useSelector((state) => state.academicYear);

  const [openMenus, setOpenMenus] = useState([]);

  // Load current academic year details on mount
  useEffect(() => {
    dispatch(fetchCurrentAcademicYear());
  }, [dispatch]);

  // Helper to extract compact year string (e.g. 26-27 from 2026-2027) safely
  const getCompactYear = (name) => {
    if (!name) return "N/A";
    const years = name.match(/\d+/g);
    if (years && years.length >= 2) {
      const start = years[0].slice(-2);
      const end = years[1].slice(-2);
      return `${start}-${end}`;
    }
    if (years && years.length === 1) {
      return years[0].slice(-2);
    }
    return name.slice(0, 5);
  };

  // Helper to check if a specific child route is active using specificity routing detection
  const isChildActive = (child) => {
    if (pathname === child.path) return true;

    // Specificity prioritization logic to avoid base paths overlapping with longer sibling sub-paths
    const siblings = menuItems.flatMap((i) => i.children || []).filter((c) => c.path !== child.path);
    const hasMoreSpecificSibling = siblings.some(
      (s) => pathname.startsWith(s.path) && s.path.length > child.path.length
    );

    if (hasMoreSpecificSibling) return false;

    return pathname.startsWith(child.path);
  };

  // Helper to check if parent menu is active (either because of direct link matching or active child matching)
  const isActive = (item) => {
    if (item.path) {
      const siblings = menuItems.filter((i) => i.path && i.path !== item.path);
      const hasMoreSpecificSibling = siblings.some(
        (s) => pathname.startsWith(s.path) && s.path.length > item.path.length
      );
      if (hasMoreSpecificSibling) return false;
      return pathname.startsWith(item.path);
    }

    return item.children?.some((child) => isChildActive(child));
  };

  // Synchronize route switches: close mobile sidebar drawer and auto-expand active parents
  useEffect(() => {
    // 1. Close mobile drawer on routing shifts
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }

    // 2. Auto-expand active parent menus on path changes
    const activeParents = menuItems
      .filter((item) => item.children?.some((child) => isChildActive(child)))
      .map((item) => item.title);

    if (activeParents.length > 0) {
      setOpenMenus((prev) => {
        const unique = new Set([...prev, ...activeParents]);
        return Array.from(unique);
      });
    }
  }, [pathname]);

  const toggleMenu = (title) => {
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col bg-[#0F172A] text-white shadow-2xl transition-all duration-300 ease-out ${
        collapsed ? "lg:w-16" : "lg:w-64"
      } ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } w-64`}
    >
      {/* Logo Header Container */}
      <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-md">
            <ShieldCheck size={18} />
          </div>

          {!collapsed && (
            <div className="animate-fade-in whitespace-nowrap overflow-hidden">
              <p className="text-sm font-bold tracking-tight">Springfield ERP</p>
              <p className="text-[10px] text-slate-400 font-medium">School Operations</p>
            </div>
          )}
        </div>

        <button
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 lg:hidden cursor-pointer"
          onClick={onCloseMobile}
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation Modules Lists */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3.5 scrollbar-thin">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item);
            const open = openMenus.includes(item.title);
            const Icon = item.icon;

            return (
              <div key={item.title}>
                {/* Direct Page Link */}
                {item.path ? (
                  <Link
                    to={item.path}
                    className={`group flex h-10 w-full items-center rounded-xl px-3 text-[14px] transition-all duration-250 border-l-4 ${
                      active
                        ? "bg-gradient-to-r from-blue-600 to-indigo-650 text-white border-blue-400 shadow font-bold"
                        : "text-slate-300 hover:bg-white/5 hover:text-white border-transparent pl-3"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <Icon size={18} className={active ? "text-white" : "text-slate-400 group-hover:text-white transition-colors"} />

                    {!collapsed && (
                      <span className="ml-3 font-semibold tracking-wide">
                        {item.title}
                      </span>
                    )}
                  </Link>
                ) : (
                  <>
                    {/* Collapsible Parent Menu Item */}
                    <button
                      onClick={() => toggleMenu(item.title)}
                      className={`group flex h-10 w-full items-center justify-between rounded-xl px-3 text-[14px] transition-all duration-250 border-l-4 cursor-pointer ${
                        active
                          ? "bg-gradient-to-r from-blue-600 to-indigo-650 text-white border-blue-400 shadow font-bold"
                          : "text-slate-300 hover:bg-white/5 hover:text-white border-transparent pl-3"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={active ? "text-white" : "text-slate-400 group-hover:text-white transition-colors"} />

                        {!collapsed && (
                          <span className="font-semibold tracking-wide">
                            {item.title}
                          </span>
                        )}
                      </div>

                      {!collapsed &&
                        (open ? (
                          <ChevronDown size={14} className={active ? "text-white" : "text-slate-400 group-hover:text-white"} />
                        ) : (
                          <ChevronRight size={14} className={active ? "text-white" : "text-slate-400 group-hover:text-white"} />
                        ))}
                    </button>

                    {/* Children Submenu Accordion Panel */}
                    {!collapsed && (
                      <div
                        className="ml-5 mt-0.5 space-y-0.5 border-l border-white/10 pl-2.5 transition-all duration-300 ease-in-out overflow-hidden"
                        style={{
                          maxHeight: open ? "300px" : "0px",
                          opacity: open ? 1 : 0,
                          pointerEvents: open ? "auto" : "none",
                        }}
                      >
                        {item.children.map((child) => {
                          const childActive = isChildActive(child);
                          return (
                            <Link
                              key={child.title}
                              to={child.path}
                              className={`block rounded-lg py-1.5 text-[13px] transition-all duration-200 border-l-2 ${
                                childActive
                                  ? "bg-white/10 text-white border-blue-400 pl-3.5 font-bold"
                                  : "text-slate-400 hover:bg-white/5 hover:text-white border-transparent pl-3"
                              }`}
                            >
                              {child.title}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Academic Year Card Container */}
      <div className={`border-t border-white/10 ${collapsed ? "p-2" : "p-3"}`}>
        {collapsed ? (
          <div
            title={`Academic Year: ${currentAcademicYear?.name || "N/A"}\nActive Session`}
            className="mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 text-center p-1 cursor-help transition-all duration-300"
          >
            <span className="text-[10px] font-extrabold text-slate-200 leading-tight">
              {getCompactYear(currentAcademicYear?.name)}
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 transition-all duration-300 space-y-0.5 max-h-[90px]">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold leading-none">
              Academic Year
            </p>

            <h3 className="text-sm font-extrabold tracking-tight text-white leading-tight">
              {currentAcademicYear?.name || "N/A"}
            </h3>

            {currentAcademicYear && (
              <>
                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide leading-none">
                  Active Session
                </p>

                <p className="text-[10px] text-slate-400 font-semibold leading-tight">
                  {new Date(currentAcademicYear.startDate).toLocaleDateString()}
                  {" - "}
                  {new Date(currentAcademicYear.endDate).toLocaleDateString()}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;