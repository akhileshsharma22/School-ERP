import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ChevronDown, ChevronRight, ShieldCheck, X } from "lucide-react";
import { menuItems } from "../../config/menuConfig";
import { fetchCurrentAcademicYear } from "../../redux/slices/academicYearSlice";
import api from "../../services/api";

const Sidebar = ({
  collapsed = false,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { pathname } = useLocation();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { currentAcademicYear } = useSelector((state) => state.academicYear);

  const [openMenus, setOpenMenus] = useState([]);
  const [parentChildren, setParentChildren] = useState([]);

  // Fetch children if parent
  useEffect(() => {
    if (user?.role === "PARENT") {
      api.get("/dashboard/summary")
        .then((res) => {
          if (res.data?.success && res.data?.role === "PARENT") {
            setParentChildren(res.data.data.children || []);
          }
        })
        .catch((err) => console.error("Error fetching parent children:", err));
    }
  }, [user]);

  // Load current academic year details on mount
  useEffect(() => {
    dispatch(fetchCurrentAcademicYear());
  }, [dispatch]);

  // Dynamic menu filtering
  const getFilteredMenuItems = () => {
    if (!user) return [];
    const role = user.role;

    if (role === "ADMIN") {
      return menuItems;
    }

    if (role === "TEACHER") {
      return [
        {
          title: "Dashboard",
          icon: menuItems[0].icon,
          path: "/dashboard",
        },
        {
          title: "Students",
          icon: menuItems[3].icon,
          children: [
            {
              title: "All Students",
              path: "/students",
            }
          ]
        },
        {
          title: "Attendance",
          icon: menuItems[5].icon,
          children: [
            {
              title: "Student Attendance",
              path: "/attendance/students",
            }
          ]
        },
        {
          title: "Academics",
          icon: menuItems[6].icon,
          children: [
            {
              title: "Timetable",
              path: "/academics/timetable",
            }
          ]
        },
        {
          title: "Examinations",
          icon: menuItems[7].icon,
          children: [
            {
              title: "Exam Schedule",
              path: "/examinations/schedule",
            },
            {
              title: "Marks Entry",
              path: "/examinations/marks",
            },
            {
              title: "Results",
              path: "/examinations/results",
            }
          ]
        }
      ];
    }

    if (role === "PARENT") {
      const childLinks = parentChildren.map(c => ({
        title: c.student.fullName,
        path: `/students/profile/${c.student.id}`
      }));

      const attendanceLinks = parentChildren.map(c => ({
        title: `${c.student.fullName} Attendance`,
        path: `/students/profile/${c.student.id}?tab=attendance`
      }));

      const resultLinks = parentChildren.map(c => ({
        title: `${c.student.fullName} Results`,
        path: `/students/profile/${c.student.id}?tab=academic`
      }));

      const feeLinks = parentChildren.map(c => ({
        title: `${c.student.fullName} Fees`,
        path: `/students/profile/${c.student.id}?tab=fees`
      }));

      const items = [
        {
          title: "Dashboard",
          icon: menuItems[0].icon,
          path: "/dashboard",
        }
      ];

      if (childLinks.length > 0) {
        items.push({
          title: "My Children",
          icon: menuItems[3].icon,
          children: childLinks
        });
      }

      if (attendanceLinks.length > 0) {
        items.push({
          title: "Attendance",
          icon: menuItems[5].icon,
          children: attendanceLinks
        });
      }

      if (resultLinks.length > 0) {
        items.push({
          title: "Results",
          icon: menuItems[7].icon,
          children: resultLinks
        });
      }

      if (feeLinks.length > 0) {
        items.push({
          title: "Fees",
          icon: menuItems[8].icon,
          children: feeLinks
        });
      }

      items.push({
        title: "Academics",
        icon: menuItems[6].icon,
        children: [
          {
            title: "Timetable",
            path: "/academics/timetable",
          }
        ]
      });

      return items;
    }

    return [];
  };

  const filteredMenuItems = getFilteredMenuItems();

  // Helper to extract compact year string safely
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

  // Helper to check if a specific child route is active
  const isChildActive = (child) => {
    if (pathname === child.path) return true;

    const siblings = filteredMenuItems.flatMap((i) => i.children || []).filter((c) => c.path !== child.path);
    const hasMoreSpecificSibling = siblings.some(
      (s) => pathname.startsWith(s.path) && s.path.length > child.path.length
    );

    if (hasMoreSpecificSibling) return false;

    return pathname.startsWith(child.path);
  };

  // Helper to check if parent menu is active
  const isActive = (item) => {
    if (item.path) {
      const siblings = filteredMenuItems.filter((i) => i.path && i.path !== item.path);
      const hasMoreSpecificSibling = siblings.some(
        (s) => pathname.startsWith(s.path) && s.path.length > item.path.length
      );
      if (hasMoreSpecificSibling) return false;
      return pathname.startsWith(item.path);
    }

    return item.children?.some((child) => isChildActive(child));
  };

  // Synchronize route switches: auto-expand active parents
  useEffect(() => {
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }

    const activeParents = filteredMenuItems
      .filter((item) => item.children?.some((child) => isChildActive(child)))
      .map((item) => item.title);

    if (activeParents.length > 0) {
      setOpenMenus((prev) => {
        const unique = new Set([...prev, ...activeParents]);
        return Array.from(unique);
      });
    }
  }, [pathname, parentChildren]);

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
          {filteredMenuItems.map((item) => {
            const active = isActive(item);
            const open = openMenus.includes(item.title);
            const Icon = item.icon;

            return (
              <div key={item.title}>
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

                    {!collapsed && (
                      <div
                        className="ml-5 mt-0.5 space-y-0.5 border-l border-white/10 pl-2.5 transition-all duration-300 ease-in-out overflow-hidden"
                        style={{
                          maxHeight: open ? "400px" : "0px",
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