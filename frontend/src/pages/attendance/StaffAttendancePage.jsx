import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Trash2,
  Save,
  Check,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { fetchAllDepartments } from "../../redux/slices/departmentSlice";
import { fetchAllDesignations } from "../../redux/slices/designationSlice";
import {
  fetchAttendanceDependencies,
  fetchStaffAttendance,
  markStaffAttendance,
  clearStaffAttendance,
} from "../../redux/slices/attendanceSlice";

const StaffAttendancePage = () => {
  const dispatch = useDispatch();

  const { departments } = useSelector((state) => state.departments);
  const { designations } = useSelector((state) => state.designations);
  const { setupStatus, staffList, staffLogs, loading, saving } = useSelector(
    (state) => state.attendance
  );

  // Filters
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Local grid state: { [staffId]: { status, checkIn, checkOut, remarks } }
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchAllDepartments());
    dispatch(fetchAllDesignations());
    dispatch(fetchAttendanceDependencies());
  }, [dispatch]);

  // Populate local grid state when staffList or staffLogs changes
  useEffect(() => {
    if (staffList && staffList.length > 0) {
      const records = {};
      staffList.forEach((employee) => {
        // Find existing log for this staff member
        const log = staffLogs.find(
          (l) => l.staff === employee._id || l.staff?._id === employee._id
        );
        records[employee._id] = {
          status: log ? log.status : "Present", // default to Present
          checkIn: log ? log.checkIn || "09:00 AM" : "09:00 AM",
          checkOut: log ? log.checkOut || "05:00 PM" : "05:00 PM",
          remarks: log ? log.remarks || "" : "",
        };
      });
      setAttendanceRecords(records);
    } else {
      setAttendanceRecords({});
    }
  }, [staffList, staffLogs]);

  const hasMissingDependencies =
    !setupStatus.hasAcademicYear ||
    !setupStatus.hasStaff;

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

  const handleLoadStaff = async () => {
    if (!selectedDate) {
      toast.error("Please select a date to load staff.");
      return;
    }
    const result = await dispatch(
      fetchStaffAttendance({
        date: selectedDate,
        departmentId,
        designationId,
      })
    );
    if (fetchStaffAttendance.fulfilled.match(result)) {
      setLoaded(true);
      toast.success("Staff register loaded successfully.");
    } else {
      toast.error(result.payload || "Failed to load staff list.");
    }
  };

  const handleStatusChange = (staffId, status) => {
    setAttendanceRecords((prev) => {
      const current = prev[staffId] || {};
      const needsTimes = ["Present", "Late", "Half Day", "Work From Home"].includes(status);
      return {
        ...prev,
        [staffId]: {
          ...current,
          status,
          checkIn: needsTimes ? current.checkIn || "09:00 AM" : "",
          checkOut: needsTimes ? current.checkOut || "05:00 PM" : "",
        },
      };
    });
  };

  const handleTimeChange = (staffId, field, value) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [field]: value,
      },
    }));
  };

  const handleRemarksChange = (staffId, remarks) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        remarks,
      },
    }));
  };

  // Bulk marking actions
  const handleMarkAll = (status) => {
    if (Object.keys(attendanceRecords).length === 0) return;
    const updated = {};
    const needsTimes = ["Present", "Late", "Half Day", "Work From Home"].includes(status);
    Object.keys(attendanceRecords).forEach((id) => {
      const current = attendanceRecords[id];
      updated[id] = {
        ...current,
        status,
        checkIn: needsTimes ? current.checkIn || "09:00 AM" : "",
        checkOut: needsTimes ? current.checkOut || "05:00 PM" : "",
      };
    });
    setAttendanceRecords(updated);
    toast.info(`Marked all staff as ${status}.`);
  };

  const handleClearRegister = () => {
    if (!loaded) return;
    toast("Clear staff daily registers?", {
      description: "This will delete all staff registers on this date from the database.",
      action: {
        label: "Clear Registers",
        onClick: async () => {
          const result = await dispatch(
            clearStaffAttendance({ date: selectedDate })
          );
          if (clearStaffAttendance.fulfilled.match(result)) {
            toast.success("Staff registers cleared.");
            setLoaded(false);
            dispatch(
              fetchStaffAttendance({
                date: selectedDate,
                departmentId,
                designationId,
              })
            );
          } else {
            toast.error(result.payload || "Failed to clear staff register.");
          }
        },
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  const handleSaveRegister = async () => {
    if (!selectedDate) {
      toast.error("Date is required to save registers.");
      return;
    }

    // Time format validation helper (e.g. "09:00 AM")
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM)$/i;

    const recordsPayload = [];
    let timeError = false;

    for (const staffId of Object.keys(attendanceRecords)) {
      const rec = attendanceRecords[staffId];
      const needsTimes = ["Present", "Late", "Half Day", "Work From Home"].includes(rec.status);

      if (needsTimes) {
        if (!rec.checkIn || !rec.checkOut) {
          toast.error("Check-In and Check-Out times are required for present employees.");
          return;
        }
        if (!timeRegex.test(rec.checkIn.trim()) || !timeRegex.test(rec.checkOut.trim())) {
          timeError = true;
          break;
        }
      }

      recordsPayload.push({
        staffId,
        status: rec.status,
        checkIn: needsTimes ? rec.checkIn.trim().toUpperCase() : "",
        checkOut: needsTimes ? rec.checkOut.trim().toUpperCase() : "",
        remarks: rec.remarks,
      });
    }

    if (timeError) {
      toast.error("Please enter check-in/out times in 'HH:MM AM/PM' format (e.g., 09:15 AM, 05:00 PM).");
      return;
    }

    if (recordsPayload.length === 0) {
      toast.error("No staff registers to save.");
      return;
    }

    const result = await dispatch(
      markStaffAttendance({
        date: selectedDate,
        records: recordsPayload,
      })
    );

    if (markStaffAttendance.fulfilled.match(result)) {
      toast.success("Staff attendance register saved successfully.");
      dispatch(
        fetchStaffAttendance({
          date: selectedDate,
          departmentId,
          designationId,
        })
      );
    } else {
      toast.error(result.payload || "Failed to save staff attendance.");
    }
  };

  const filteredStaff = useMemo(() => {
    if (!staffList) return [];
    return staffList.filter((employee) => {
      const query = searchTerm.trim().toLowerCase();
      if (!query) return true;
      const fullName = `${employee.firstName || ""} ${employee.lastName || ""}`.toLowerCase();
      return (
        fullName.includes(query) ||
        (employee.employeeId && employee.employeeId.toLowerCase().includes(query))
      );
    });
  }, [staffList, searchTerm]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Staff Management
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              Staff Attendance Register
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Mark employee attendance and adjust biometric check-in timestamps.
            </p>
          </div>
        </header>

        {/* Missing Dependencies warning */}
        {hasMissingDependencies && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Complete Master Setup and Staff Registration.
                </h3>
                <p className="mt-1 text-xs text-amber-700">
                  Ensure at least one Academic Year and Staff employee is created before accessing the daily attendance registers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-600">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setLoaded(false);
                }}
                disabled={hasMissingDependencies}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white disabled:opacity-60"
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
                onChange={(e) => {
                  setDesignationId(e.target.value);
                  setLoaded(false);
                }}
                disabled={hasMissingDependencies}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white disabled:opacity-60"
              >
                <option value="">All Designations</option>
                {designations.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.designationName}
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
              onClick={handleLoadStaff}
              disabled={hasMissingDependencies || !selectedDate}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-3.5 w-3.5" />
                  Loading...
                </>
              ) : (
                "Load Staff Register"
              )}
            </button>
          </div>
        </section>

        {/* Registers Sheet */}
        {loaded && (
          <div className="space-y-6 animate-fadeIn">
            {/* Quick action bar */}
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
                  <Trash2 size={14} /> Clear Daily Registers
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full max-w-xs sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Grid Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
              <div className="overflow-x-auto animate-fadeIn">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 w-12 text-center">#</th>
                      <th className="px-6 py-4">Employee Info</th>
                      <th className="px-6 py-4">Department / Designation</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 w-44">Check-In / Out</th>
                      <th className="px-6 py-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-900">
                    {filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-xs font-medium text-slate-400">
                          No matching staff records found.
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((employee, idx) => {
                        const rec = attendanceRecords[employee._id] || {
                          status: "Present",
                          checkIn: "09:00 AM",
                          checkOut: "05:00 PM",
                          remarks: "",
                        };
                        const hasTimes = ["Present", "Late", "Half Day", "Work From Home"].includes(rec.status);
                        return (
                          <tr key={employee._id} className="hover:bg-slate-50/50 transition duration-150">
                            <td className="px-6 py-4 w-12 text-center text-xs font-semibold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {employee.photoUrl ? (
                                  <img
                                    src={employee.photoUrl}
                                    alt=""
                                    className="h-9 w-9 rounded-full object-cover border border-slate-100 shadow-sm"
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 border border-slate-200 uppercase">
                                    {employee.firstName?.[0] || ""}
                                    {employee.lastName?.[0] || ""}
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-slate-900">
                                    {employee.firstName} {employee.lastName}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    ID: {employee.employeeId}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs">
                              <div className="font-semibold text-slate-700">
                                {employee.department?.departmentName || "—"}
                              </div>
                              <div className="text-slate-400">
                                {employee.designation?.designationName || "—"}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap items-center gap-1">
                                {["Present", "Absent", "Late", "Half Day", "Work From Home", "On Leave"].map((st) => {
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
                                    else if (st === "Work From Home")
                                      btnClass = "border-cyan-200 bg-cyan-50 text-cyan-700 font-bold shadow-sm";
                                    else if (st === "On Leave")
                                      btnClass = "border-blue-200 bg-blue-50 text-blue-700 font-bold shadow-sm";
                                  }
                                  return (
                                    <button
                                      key={st}
                                      onClick={() => handleStatusChange(employee._id, st)}
                                      className={`h-7 px-2 text-[11px] rounded transition cursor-pointer flex items-center gap-0.5 ${btnClass}`}
                                    >
                                      {isSelected && <Check size={10} />}
                                      {st}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {hasTimes ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={rec.checkIn || ""}
                                    placeholder="Check In"
                                    onChange={(e) => handleTimeChange(employee._id, "checkIn", e.target.value)}
                                    className="h-8 w-20 rounded border border-slate-200 bg-white px-1.5 text-center text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                                  />
                                  <span className="text-slate-400 font-bold">:</span>
                                  <input
                                    type="text"
                                    value={rec.checkOut || ""}
                                    placeholder="Check Out"
                                    onChange={(e) => handleTimeChange(employee._id, "checkOut", e.target.value)}
                                    className="h-8 w-20 rounded border border-slate-200 bg-white px-1.5 text-center text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                                  />
                                </div>
                              ) : (
                                <span className="text-xs font-semibold text-slate-400 italic">No check-in needed</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={rec.remarks || ""}
                                onChange={(e) => handleRemarksChange(employee._id, e.target.value)}
                                placeholder="Add remarks..."
                                className="h-8 w-full max-w-[150px] rounded border border-slate-200 bg-white px-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
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
                disabled={saving || filteredStaff.length === 0}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-violet-750 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Registers...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Staff Register
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

export default StaffAttendancePage;
