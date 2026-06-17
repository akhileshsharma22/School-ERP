import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Calendar,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  Loader2,
  Users,
  Briefcase,
  AlertCircle,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { fetchAcademicYears } from "../../redux/slices/academicYearSlice";
import { fetchAllClasses } from "../../redux/slices/classSectionSlice";
import { fetchAllDepartments } from "../../redux/slices/departmentSlice";
import { fetchAllDesignations } from "../../redux/slices/designationSlice";
import { fetchAttendanceReports } from "../../redux/slices/attendanceSlice";

const AttendanceReportsPage = () => {
  const dispatch = useDispatch();

  const { academicYears } = useSelector((state) => state.academicYear);
  const { classes } = useSelector((state) => state.classSections);
  const { departments } = useSelector((state) => state.departments);
  const { designations } = useSelector((state) => state.designations);
  const { reportsList, loading } = useSelector((state) => state.attendance);

  // Tabs toggle
  const [reportType, setReportType] = useState("student"); // 'student' | 'staff'

  // Standard filters
  const [className, setClassName] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1
  ); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [loaded, setLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchAllClasses());
    dispatch(fetchAllDepartments());
    dispatch(fetchAllDesignations());
  }, [dispatch]);

  const activeSections = useMemo(() => {
    const cls = classes.find((c) => c.className === className);
    return cls ? cls.sections : [];
  }, [classes, className]);

  const months = [
    { value: 1, name: "January" },
    { value: 2, name: "February" },
    { value: 3, name: "March" },
    { value: 4, name: "April" },
    { value: 5, name: "May" },
    { value: 6, name: "June" },
    { value: 7, name: "July" },
    { value: 8, name: "August" },
    { value: 9, name: "September" },
    { value: 10, name: "October" },
    { value: 11, name: "November" },
    { value: 12, name: "December" },
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const list = [];
    for (let y = currentYear - 5; y <= currentYear + 1; y++) {
      list.push(y);
    }
    return list;
  }, []);

  const handleFetchReport = async () => {
    setLoaded(false);
    const params = {
      type: reportType,
      month: selectedMonth,
      year: selectedYear,
    };

    if (reportType === "student") {
      if (className) params.className = className;
      if (sectionName) params.sectionName = sectionName;
    } else {
      if (departmentId) params.departmentId = departmentId;
      if (designationId) params.designationId = designationId;
    }

    const result = await dispatch(fetchAttendanceReports(params));
    if (fetchAttendanceReports.fulfilled.match(result)) {
      setLoaded(true);
      toast.success("Attendance reports generated successfully.");
    } else {
      toast.error(result.payload || "Failed to load reports.");
    }
  };

  const handleExportCSV = () => {
    if (!reportsList || reportsList.length === 0) {
      toast.warning("No records to export.");
      return;
    }

    let csvContent = "";
    if (reportType === "student") {
      const headers = [
        "Student Name",
        "Student ID",
        "Admission No",
        "Class",
        "Section",
        "Date",
        "Status",
        "Remarks",
      ];
      const rows = filteredReports.map((log) => [
        `"${log.student?.firstName || ""} ${log.student?.lastName || ""}"`,
        `"${log.student?.studentId || ""}"`,
        `"${log.student?.admissionNo || ""}"`,
        `"${log.class || ""}"`,
        `"${log.section || ""}"`,
        `"${new Date(log.date).toLocaleDateString()}"`,
        `"${log.status || ""}"`,
        `"${log.remarks || ""}"`,
      ]);

      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
        "\n"
      );
    } else {
      const headers = [
        "Employee Name",
        "Employee ID",
        "Department",
        "Designation",
        "Date",
        "Status",
        "Check-In",
        "Check-Out",
        "Working Hours",
        "Late Arrival",
        "Early Departure",
        "Remarks",
      ];
      const rows = filteredReports.map((log) => [
        `"${log.staff?.firstName || ""} ${log.staff?.lastName || ""}"`,
        `"${log.staff?.employeeId || ""}"`,
        `"${log.department?.departmentName || ""}"`,
        `"${log.designation?.designationName || ""}"`,
        `"${new Date(log.date).toLocaleDateString()}"`,
        `"${log.status || ""}"`,
        `"${log.checkIn || ""}"`,
        `"${log.checkOut || ""}"`,
        log.workingHours || 0,
        log.lateArrival ? "Yes" : "No",
        log.earlyDeparture ? "Yes" : "No",
        `"${log.remarks || ""}"`,
      ]);

      csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
        "\n"
      );
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${reportType}_attendance_report_${selectedMonth}_${selectedYear}.csv`
    );
    link.click();
    toast.success("CSV export initiated.");
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredReports = useMemo(() => {
    if (!reportsList) return [];
    return reportsList.filter((log) => {
      const query = searchTerm.trim().toLowerCase();
      if (!query) return true;

      if (reportType === "student") {
        const studentName = `${log.student?.firstName || ""} ${
          log.student?.lastName || ""
        }`.toLowerCase();
        return (
          studentName.includes(query) ||
          log.student?.studentId?.toLowerCase().includes(query)
        );
      } else {
        const staffName = `${log.staff?.firstName || ""} ${
          log.staff?.lastName || ""
        }`.toLowerCase();
        return (
          staffName.includes(query) ||
          log.staff?.employeeId?.toLowerCase().includes(query)
        );
      }
    });
  }, [reportsList, reportType, searchTerm]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10 print:p-0 print:m-0">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Reports
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              Attendance Reports Center
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View and export detailed historical records of daily logs.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setReportType("student");
                setLoaded(false);
              }}
              className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold transition cursor-pointer ${
                reportType === "student"
                  ? "bg-slate-950 text-white shadow-sm"
                  : "bg-white border text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Users size={14} /> Student Reports
            </button>
            <button
              onClick={() => {
                setReportType("staff");
                setLoaded(false);
              }}
              className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold transition cursor-pointer ${
                reportType === "staff"
                  ? "bg-slate-950 text-white shadow-sm"
                  : "bg-white border text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Briefcase size={14} /> Staff Reports
            </button>
          </div>
        </header>

        {/* Filter bar */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 space-y-4 print:hidden">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {reportType === "student" ? (
              <>
                {/* Class */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">
                    Class
                  </label>
                  <select
                    value={className}
                    onChange={(e) => {
                      setClassName(e.target.value);
                      setSectionName("");
                    }}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                  >
                    <option value="">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls.className}>
                        {cls.className}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">
                    Section
                  </label>
                  <select
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    disabled={!className}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white disabled:opacity-60"
                  >
                    <option value="">All Sections</option>
                    {activeSections.map((sec) => (
                      <option key={sec._id} value={sec.sectionName}>
                        {sec.sectionName}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">
                    Department
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.departmentName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">
                    Designation
                  </label>
                  <select
                    value={designationId}
                    onChange={(e) => setDesignationId(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                  >
                    <option value="">All Designations</option>
                    {designations.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.designationName}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Month */}
            <div>
              <label className="block text-xs font-semibold text-slate-600">
                Month *
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs font-semibold text-slate-600">
                Year *
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <button
              onClick={handleFetchReport}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-3.5 w-3.5" />
                  Generating...
                </>
              ) : (
                "Generate Report"
              )}
            </button>
          </div>
        </section>

        {/* Tabular results display */}
        {loaded && (
          <div className="space-y-6">
            {/* Table actions bar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 flex flex-wrap items-center justify-between gap-4 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  disabled={filteredReports.length === 0}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <FileSpreadsheet size={14} className="text-emerald-600" /> Export CSV
                </button>
                <button
                  onClick={handlePrint}
                  disabled={filteredReports.length === 0}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Printer size={14} className="text-indigo-600" /> Print Report
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full max-w-xs sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    reportType === "student"
                      ? "Search student name/ID..."
                      : "Search staff name/ID..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block text-center border-b pb-4 mb-6">
              <h2 className="text-2xl font-bold text-slate-900 uppercase">
                Springfield Secondary School
              </h2>
              <p className="text-sm text-slate-500 font-semibold mt-1">
                {reportType === "student" ? "Student" : "Staff"} Attendance Report —{" "}
                {months.find((m) => m.value === selectedMonth)?.name} {selectedYear}
              </p>
              {reportType === "student" && className && (
                <p className="text-xs text-slate-400 mt-1">
                  Class: {className} {sectionName ? `- Section: ${sectionName}` : ""}
                </p>
              )}
            </div>

            {/* Reports table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 print:border-none print:shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700 border-b border-slate-200 print:bg-white print:text-black">
                    {reportType === "student" ? (
                      <tr>
                        <th className="px-6 py-4">Student Info</th>
                        <th className="px-6 py-4">Student ID / Adm No</th>
                        <th className="px-6 py-4">Class-Section</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Remarks</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="px-6 py-4">Employee Info</th>
                        <th className="px-6 py-4">ID / Department</th>
                        <th className="px-6 py-4">Designation</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">In / Out / Hours</th>
                        <th className="px-6 py-4">Remarks</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-900 print:text-black">
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td
                          colSpan={reportType === "student" ? "6" : "7"}
                          className="p-8 text-center text-xs font-medium text-slate-400"
                        >
                          No registers or attendance records found matching selection.
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((log) => {
                        const dateStr = new Date(log.date).toLocaleDateString();
                        if (reportType === "student") {
                          return (
                            <tr
                              key={log._id}
                              className="hover:bg-slate-50/50 transition duration-150 break-inside-avoid"
                            >
                              <td className="px-6 py-4 font-bold text-slate-900 print:text-black">
                                {log.student?.firstName} {log.student?.lastName}
                              </td>
                              <td className="px-6 py-4 font-mono text-xs text-slate-600">
                                <div>{log.student?.studentId}</div>
                                <div className="text-[10px] text-slate-400">
                                  Adm: {log.student?.admissionNo}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold">
                                {log.class} - {log.section}
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                                {dateStr}
                              </td>
                              <td className="px-6 py-4 text-xs">
                                <span
                                  className={`px-2 py-0.5 rounded font-bold ${
                                    log.status === "Present"
                                      ? "bg-emerald-50 text-emerald-700 print:bg-transparent print:text-black"
                                      : log.status === "Absent"
                                      ? "bg-rose-50 text-rose-700 print:bg-transparent print:text-black"
                                      : "bg-amber-50 text-amber-700 print:bg-transparent print:text-black"
                                  }`}
                                >
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-500 italic">
                                {log.remarks || "—"}
                              </td>
                            </tr>
                          );
                        } else {
                          return (
                            <tr
                              key={log._id}
                              className="hover:bg-slate-50/50 transition duration-150 break-inside-avoid"
                            >
                              <td className="px-6 py-4 font-bold text-slate-900 print:text-black">
                                {log.staff?.firstName} {log.staff?.lastName}
                              </td>
                              <td className="px-6 py-4 text-xs">
                                <div className="font-mono text-slate-600">
                                  {log.staff?.employeeId}
                                </div>
                                <div className="text-slate-400">
                                  {log.department?.departmentName || "—"}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold">
                                {log.designation?.designationName || "—"}
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                                {dateStr}
                              </td>
                              <td className="px-6 py-4 text-xs">
                                <span
                                  className={`px-2 py-0.5 rounded font-bold ${
                                    log.status === "Present" ||
                                    log.status === "Work From Home"
                                      ? "bg-emerald-50 text-emerald-700 print:bg-transparent print:text-black"
                                      : log.status === "Absent"
                                      ? "bg-rose-50 text-rose-700 print:bg-transparent print:text-black"
                                      : "bg-amber-50 text-amber-700 print:bg-transparent print:text-black"
                                  }`}
                                >
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs text-center">
                                {log.checkIn ? (
                                  <div>
                                    <div className="font-medium text-slate-800">
                                      {log.checkIn} - {log.checkOut}
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                                      <Clock size={10} /> {log.workingHours || 0} hrs
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-500 italic">
                                {log.remarks || "—"}
                              </td>
                            </tr>
                          );
                        }
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AttendanceReportsPage;
