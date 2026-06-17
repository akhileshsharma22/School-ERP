import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

const DashboardLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");

    const syncSidebar = () => {
      setCollapsed(mediaQuery.matches);
      if (!mediaQuery.matches) {
        setMobileSidebarOpen(false);
      }
    };

    syncSidebar();
    mediaQuery.addEventListener("change", syncSidebar);

    return () => mediaQuery.removeEventListener("change", syncSidebar);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-950">

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {mobileSidebarOpen && (
        <button
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div
        className={`min-h-screen transition-[margin] duration-300 ease-out ${
          collapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >

        <Navbar
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((value) => !value)}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="px-4 py-4 sm:px-5 lg:px-6">
          {children}
        </main>

      </div>

    </div>
  );
};

export default DashboardLayout;
