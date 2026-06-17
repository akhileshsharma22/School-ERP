import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, Calendar, Check, Save, Search, Users, CheckCircle, XCircle, Clock, Award } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { fetchStaffList, fetchAttendanceForDate, saveBulkAttendance } from "../../redux/slices/staffSlice";

const StaffAttendancePage = () => {
  const dispatch = useDispatch();

  const { staffList, dailyAttendance, loading, saving } = useSelector((state) => state.staff);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState({}); // staffId -> { status, remarks }

  // Load staff list once
  useEffect(() => {
    dispatch(fetchStaffList());
  }, [dispatch]);

  // Load attendance logs for the selected date
  useEffect(() => {
    dispatch(fetchAttendanceForDate({ date: selectedDate }));
  }, [dispatch, selectedDate]);

  // Initialize form records whenever staffList or dailyAttendance changes
  useEffect(() => {
    const records = {};
    staffList.forEach((staff) => {
      const match = dailyAttendance.find((log) => log.staff === staff._id);
      records[staff._id] = {
        status: match ? match.status : "Present", // default to Present if not marked
        remarks: match ? match.remarks : "",
      };
    });
    setAttendanceRecords(records);
  }, [staffList, dailyAttendance]);

  // Handle status toggle for a staff row
  const handleStatusChange = (staffId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        status,
      },
    }));
  };

  // Handle remarks change for a staff row
  const handleRemarksChange = (staffId, remarks) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        remarks,
      },
    }));
  };

  // Bulk status update for all listed staff
  const handleBulkStatusSet = (status) => {
    const updated = { ...attendanceRecords };
    filteredStaff.forEach((staff) => {
      if (updated[staff._id]) {
        updated[staff._id].status = status;
      }
    });
    setAttendanceRecords(updated);
    toast.success(`Marked all listed staff as ${status}`);
  };

  // Submit bulk attendance
  const handleSubmit = async (e) => {
    e.preventDefault();

    const recordsPayload = Object.keys(attendanceRecords).map((staffId) => ({
      staffId,
      status: attendanceRecords[staffId].status,
      remarks: attendanceRecords[staffId].remarks,
    }));

    if (recordsPayload.length === 0) {
      toast.info("No records to save.");
      return;
    }

    const result = await dispatch(saveBulkAttendance({ date: selectedDate, records: recordsPayload }));
    if (saveBulkAttendance.fulfilled.match(result)) {
      toast.success("Staff attendance register saved successfully!");
      dispatch(fetchAttendanceForDate({ date: selectedDate }));
    } else {
      toast.error(result.payload || "Failed to save daily register.");
    }
  };

  // Filter staff based on search query
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      const code = s.employeeId.toLowerCase();
      const query = searchQuery.toLowerCase();
      return fullName.includes(query) || code.includes(query);
    });
  }, [staffList, searchQuery]);

  // Count current statistics on the screen
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let halfDay = 0;
    let holiday = 0;

    Object.keys(attendanceRecords).forEach((staffId) => {
      const status = attendanceRecords[staffId]?.status;
      if (status === "Present") present++;
      else if (status === "Absent") absent++;
      else if (status === "Late") late++;
      else if (status === "Half Day") halfDay++;
      else if (status === "Holiday") holiday++;
    });

    return { present, absent, late, halfDay, holiday };
  }, [attendanceRecords]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-12">
        
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Human Resources
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Daily Attendance Register
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Mark, edit and view daily attendance registry for teaching and administrative personnel.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Select Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm outline-none focus:border-slate-400"
            />
          </div>
        </header>

        {/* Stats Row */}
        <section className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total listed</span>
            <p className="text-xl font-bold text-slate-950 mt-1">{filteredStaff.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-emerald-50/50 p-4 shadow-sm text-center">
            <span className="text-[10px] text-emerald-600 font-bold uppercase block">Present</span>
            <p className="text-xl font-bold text-emerald-700 mt-1">{stats.present}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-rose-50/50 p-4 shadow-sm text-center">
            <span className="text-[10px] text-rose-600 font-bold uppercase block">Absent</span>
            <p className="text-xl font-bold text-rose-700 mt-1">{stats.absent}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-amber-50/50 p-4 shadow-sm text-center">
            <span className="text-[10px] text-amber-600 font-bold uppercase block">Late / Half Day</span>
            <p className="text-xl font-bold text-amber-700 mt-1">{stats.late} / {stats.halfDay}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-blue-50/50 p-4 shadow-sm text-center">
            <span className="text-[10px] text-blue-600 font-bold uppercase block">Holiday</span>
            <p className="text-xl font-bold text-blue-700 mt-1">{stats.holiday}</p>
          </div>
        </section>

        {/* Filters and Search */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name or Employee ID..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-500 self-center">Set All Listed to:</span>
            <button
              type="button"
              onClick={() => handleBulkStatusSet("Present")}
              className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100"
            >
              Present
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatusSet("Absent")}
              className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-[10px] font-bold text-rose-700 hover:bg-rose-100"
            >
              Absent
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatusSet("Late")}
              className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-[10px] font-bold text-amber-700 hover:bg-amber-100"
            >
              Late
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatusSet("Holiday")}
              className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
            >
              Holiday
            </button>
          </div>
        </section>

        {/* Form and Register Table */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <p className="text-sm text-slate-500 font-semibold">Loading daily registry...</p>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <Users size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">No Employees Found</h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-xs leading-normal">
                    Could not find any employee profiles in directory database. Add employees first.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold select-none">
                      <th className="p-4 w-1/4">Employee</th>
                      <th className="p-4">Staff Type</th>
                      <th className="p-4 w-1/3">Mark Attendance Status</th>
                      <th className="p-4">Remarks / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                    {filteredStaff.map((staff) => {
                      const employeeName = `${staff.firstName} ${staff.lastName}`;
                      const currentRecord = attendanceRecords[staff._id] || { status: "Present", remarks: "" };

                      return (
                        <tr key={staff._id} className="hover:bg-slate-50/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {staff.photoUrl ? (
                                <img
                                  src={staff.photoUrl.startsWith("http") ? staff.photoUrl : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${staff.photoUrl}`}
                                  alt={employeeName}
                                  className="h-8 w-8 rounded-full object-cover border"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[10px] uppercase border">
                                  {staff.firstName[0]}
                                  {staff.lastName[0]}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-slate-950">{employeeName}</p>
                                <p className="text-[10px] text-slate-400 font-mono font-semibold">{staff.employeeId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-slate-500">{staff.staffType}</td>
                          <td className="p-4">
                            <div className="flex gap-1.5">
                              {[
                                { id: "Present", color: "peer-checked:bg-emerald-600 peer-checked:text-white border-slate-200 text-slate-700 bg-white" },
                                { id: "Absent", color: "peer-checked:bg-red-600 peer-checked:text-white border-slate-200 text-slate-700 bg-white" },
                                { id: "Late", color: "peer-checked:bg-amber-500 peer-checked:text-white border-slate-200 text-slate-700 bg-white" },
                                { id: "Half Day", color: "peer-checked:bg-blue-500 peer-checked:text-white border-slate-200 text-slate-700 bg-white" },
                                { id: "Holiday", color: "peer-checked:bg-slate-500 peer-checked:text-white border-slate-200 text-slate-700 bg-white" },
                              ].map((option) => (
                                <label key={option.id} className="relative cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`status-${staff._id}`}
                                    value={option.id}
                                    checked={currentRecord.status === option.id}
                                    onChange={() => handleStatusChange(staff._id, option.id)}
                                    className="peer sr-only"
                                  />
                                  <span className={`inline-flex px-2.5 py-1.5 rounded-lg border text-[10px] font-bold shadow-sm transition hover:bg-slate-50 ${option.color}`}>
                                    {option.id}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            <input
                              type="text"
                              value={currentRecord.remarks}
                              onChange={(e) => handleRemarksChange(staff._id, e.target.value)}
                              placeholder="Add daily note..."
                              className="h-8 w-full rounded border border-slate-200 bg-slate-50/50 px-2.5 text-[11px] font-medium outline-none focus:border-slate-400 focus:bg-white"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Form Actions */}
          <footer className="flex items-center justify-end gap-3 print:hidden">
            <button
              type="submit"
              disabled={saving || loading || filteredStaff.length === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-300 transition hover:bg-blue-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Saving Daily Register...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Daily Register
                </>
              )}
            </button>
          </footer>
        </form>

      </div>
    </DashboardLayout>
  );
};

export default StaffAttendancePage;
