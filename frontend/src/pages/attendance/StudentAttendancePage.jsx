import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Calendar,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Trash2,
  Save,
  Check,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { fetchAcademicYears } from "../../redux/slices/academicYearSlice";
import { fetchAllClasses } from "../../redux/slices/classSectionSlice";
import {
  fetchAttendanceDependencies,
  fetchStudentAttendance,
  markStudentAttendance,
  clearStudentAttendance,
} from "../../redux/slices/attendanceSlice";

const StudentAttendancePage = () => {
  const dispatch = useDispatch();

  const { academicYears } = useSelector((state) => state.academicYear);
  const { classes } = useSelector((state) => state.classSections);
  const { setupStatus, studentList, studentLogs, loading, saving } = useSelector(
    (state) => state.attendance
  );

  // Filters
  const [academicYearId, setAcademicYearId] = useState("");
  const [className, setClassName] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Local state for tracking edits in the grid
  // Format: { [studentId]: { status: 'Present' | 'Absent' | ... , remarks: '' } }
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchAcademicYears());
    dispatch(fetchAllClasses());
    dispatch(fetchAttendanceDependencies());
  }, [dispatch]);

  // Set default current academic year if available
  useEffect(() => {
    if (academicYears && academicYears.length > 0 && !academicYearId) {
      const current = academicYears.find((y) => y.isCurrent);
      if (current) {
        setAcademicYearId(current._id);
      } else {
        setAcademicYearId(academicYears[0]._id);
      }
    }
  }, [academicYears, academicYearId]);

  const activeSections = useMemo(() => {
    const cls = classes.find((c) => c.className === className);
    return cls ? cls.sections : [];
  }, [classes, className]);

  // Populate local state when studentList or studentLogs changes
  useEffect(() => {
    if (studentList && studentList.length > 0) {
      const records = {};
      studentList.forEach((student) => {
        // Find existing logs for this student
        const log = studentLogs.find(
          (l) => l.student === student._id || l.student?._id === student._id
        );
        records[student._id] = {
          status: log ? log.status : "Present", // default to Present if no log exists
          remarks: log ? log.remarks || "" : "",
        };
      });
      setAttendanceRecords(records);
    } else {
      setAttendanceRecords({});
    }
  }, [studentList, studentLogs]);

  const hasMissingDependencies =
    !setupStatus.hasAcademicYear ||
    !setupStatus.hasClassSection ||
    !setupStatus.hasStudents;

  const handleDateChange = (e) => {
    const dateStr = e.target.value;
    const selected = new Date(dateStr);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (selected > today) {
      toast.error("Cannot mark attendance for future dates.");
      return;
    }
    setSelectedDate(dateStr);
  };

  const handleLoadStudents = async () => {
    if (!academicYearId || !className || !sectionName || !selectedDate) {
      toast.error("Please select all filters to load students.");
      return;
    }
    const result = await dispatch(
      fetchStudentAttendance({
        className,
        sectionName,
        date: selectedDate,
      })
    );
    if (fetchStudentAttendance.fulfilled.match(result)) {
      setLoaded(true);
      toast.success("Student register loaded successfully.");
    } else {
      toast.error(result.payload || "Failed to load student registers.");
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  // Bulk Actions
  const handleMarkAll = (status) => {
    if (Object.keys(attendanceRecords).length === 0) return;
    const updated = {};
    Object.keys(attendanceRecords).forEach((id) => {
      updated[id] = {
        ...attendanceRecords[id],
        status,
      };
    });
    setAttendanceRecords(updated);
    toast.info(`Marked all students as ${status}.`);
  };

  const handleClearRegister = () => {
    if (!loaded) return;
    toast("Clear all registers for this class/section?", {
      description: "This will permanently delete today's attendance logs for this class.",
      action: {
        label: "Clear Logs",
        onClick: async () => {
          const result = await dispatch(
            clearStudentAttendance({
              className,
              sectionName,
              date: selectedDate,
            })
          );
          if (clearStudentAttendance.fulfilled.match(result)) {
            toast.success("Attendance logs deleted successfully.");
            setLoaded(false);
            dispatch(
              fetchStudentAttendance({
                className,
                sectionName,
                date: selectedDate,
              })
            );
          } else {
            toast.error(result.payload || "Failed to delete logs.");
          }
        },
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  const handleSaveRegister = async () => {
    if (!academicYearId || !className || !sectionName || !selectedDate) {
      toast.error("Incomplete session info. Please reload the filters.");
      return;
    }

    const recordsPayload = Object.keys(attendanceRecords).map((studentId) => ({
      studentId,
      status: attendanceRecords[studentId].status,
      remarks: attendanceRecords[studentId].remarks,
    }));

    if (recordsPayload.length === 0) {
      toast.error("No students to save.");
      return;
    }

    const result = await dispatch(
      markStudentAttendance({
        date: selectedDate,
        className,
        sectionName,
        academicYearId,
        records: recordsPayload,
      })
    );

    if (markStudentAttendance.fulfilled.match(result)) {
      toast.success(
        `Attendance saved successfully! Present: ${result.payload.summary.totalMarked - result.payload.summary.absentCount}, Absent: ${result.payload.summary.absentCount}`
      );
      // Reload registers to stay in sync
      dispatch(
        fetchStudentAttendance({
          className,
          sectionName,
          date: selectedDate,
        })
      );
    } else {
      toast.error(result.payload || "Failed to save registers.");
    }
  };

  const filteredStudents = useMemo(() => {
    if (!studentList) return [];
    return studentList.filter((s) => {
      const query = searchTerm.trim().toLowerCase();
      if (!query) return true;
      const fullName = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase();
      return (
        fullName.includes(query) ||
        (s.studentId && s.studentId.toLowerCase().includes(query)) ||
        (s.admissionNo && s.admissionNo.toLowerCase().includes(query))
      );
    });
  }, [studentList, searchTerm]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Students
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              Student Attendance Register
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Mark and edit daily student attendance rosters.
            </p>
          </div>
        </header>

        {/* Master Setup Check */}
        {hasMissingDependencies && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Complete Master Setup before creating admissions or marking attendance.
                </h3>
                <p className="mt-1 text-xs text-amber-700">
                  Please configure Academic Years, Class & Sections, and register students before accessing the attendance registers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {/* Academic Year */}
            <div>
              <label className="block text-xs font-semibold text-slate-600">
                Academic Year *
              </label>
              <select
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                disabled={hasMissingDependencies}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white disabled:opacity-60"
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((y) => (
                  <option key={y._id} value={y._id}>
                    {y.name} {y.isCurrent ? "(Current)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="block text-xs font-semibold text-slate-600">Class *</label>
              <select
                value={className}
                onChange={(e) => {
                  setClassName(e.target.value);
                  setSectionName("");
                  setLoaded(false);
                }}
                disabled={hasMissingDependencies}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white disabled:opacity-60"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls.className}>
                    {cls.className}
                  </option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-xs font-semibold text-slate-600">Section *</label>
              <select
                value={sectionName}
                onChange={(e) => {
                  setSectionName(e.target.value);
                  setLoaded(false);
                }}
                disabled={!className || hasMissingDependencies}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white disabled:opacity-60"
              >
                <option value="">Select Section</option>
                {activeSections.map((sec) => (
                  <option key={sec._id} value={sec.sectionName}>
                    {sec.sectionName}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600">Date *</label>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                disabled={hasMissingDependencies}
                max={new Date().toISOString().split("T")[0]}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white disabled:opacity-60"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2 border-t pt-4">
            <button
              onClick={handleLoadStudents}
              disabled={hasMissingDependencies || !className || !sectionName}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-3.5 w-3.5" />
                  Loading...
                </>
              ) : (
                "Load Student Register"
              )}
            </button>
          </div>
        </section>

        {/* Attendance Marking Sheet */}
        {loaded && (
          <div className="space-y-6 animate-fadeIn">
            {/* Quick Actions Header */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleMarkAll("Present")}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                >
                  <CheckCircle size={14} /> Mark All Present
                </button>
                <button
                  onClick={() => handleMarkAll("Absent")}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                >
                  <XCircle size={14} /> Mark All Absent
                </button>
                <button
                  onClick={handleClearRegister}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Trash2 size={14} /> Clear Daily Register
                </button>
              </div>

              {/* Search filter in register */}
              <div className="relative w-full max-w-xs sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 w-12 text-center">#</th>
                      <th className="px-6 py-4">Student Info</th>
                      <th className="px-6 py-4">Student ID / Admission No</th>
                      <th className="px-6 py-4">Attendance Status</th>
                      <th className="px-6 py-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-900">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-xs font-medium text-slate-400">
                          No matching student records found.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, idx) => {
                        const rec = attendanceRecords[student._id] || {
                          status: "Present",
                          remarks: "",
                        };
                        return (
                          <tr key={student._id} className="hover:bg-slate-50/50 transition duration-150">
                            <td className="px-6 py-4 w-12 text-center text-xs font-semibold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {student.photoUrl ? (
                                  <img
                                    src={student.photoUrl}
                                    alt=""
                                    className="h-9 w-9 rounded-full object-cover border border-slate-100 shadow-sm"
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 border border-slate-200 uppercase">
                                    {student.firstName?.[0] || ""}
                                    {student.lastName?.[0] || ""}
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-slate-900">
                                    {student.firstName} {student.lastName}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {student.className} - {student.sectionName}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-600">
                              <div>{student.studentId}</div>
                              <div className="text-[10px] text-slate-400 font-normal">Adm: {student.admissionNo}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                {["Present", "Absent", "Late", "Half Day", "Medical Leave"].map((st) => {
                                  const isSelected = rec.status === st;
                                  let btnClass = "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50";
                                  if (isSelected) {
                                    if (st === "Present")
                                      btnClass = "border-emerald-200 bg-emerald-50 text-emerald-700 font-bold shadow-sm";
                                    else if (st === "Absent")
                                      btnClass = "border-rose-200 bg-rose-50 text-rose-700 font-bold shadow-sm";
                                    else if (st === "Late")
                                      btnClass = "border-amber-200 bg-amber-50 text-amber-700 font-bold shadow-sm";
                                    else if (st === "Half Day")
                                      btnClass = "border-violet-200 bg-violet-50 text-violet-700 font-bold shadow-sm";
                                    else if (st === "Medical Leave")
                                      btnClass = "border-blue-200 bg-blue-50 text-blue-700 font-bold shadow-sm";
                                  }
                                  return (
                                    <button
                                      key={st}
                                      onClick={() => handleStatusChange(student._id, st)}
                                      className={`h-7 px-2.5 text-[11px] rounded transition cursor-pointer flex items-center gap-1 ${btnClass}`}
                                    >
                                      {isSelected && <Check size={10} />}
                                      {st}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={rec.remarks || ""}
                                onChange={(e) => handleRemarksChange(student._id, e.target.value)}
                                placeholder="Add remarks..."
                                className="h-8 w-full max-w-[200px] rounded border border-slate-200 bg-white px-2 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={handleSaveRegister}
                disabled={saving || filteredStudents.length === 0}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Registers...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Daily Register
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentAttendancePage;
