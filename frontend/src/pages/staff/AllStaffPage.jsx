import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Download,
  Search,
  Eye,
  Trash2,
  Plus,
  Loader2,
  Users,
  CheckCircle,
  Clock,
  Printer,
  FileSpreadsheet,
  XCircle,
  Briefcase,
  Layers,
  Calendar,
  CreditCard,
  Building
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { fetchStaffList, removeStaff } from "../../redux/slices/staffSlice";
import { fetchAllDepartments } from "../../redux/slices/departmentSlice";
import { fetchAllDesignations } from "../../redux/slices/designationSlice";
import StaffIdCard from "../../components/staff/StaffIdCard";

const StatCard = ({ label, value, helper, colorClass, icon: Icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      {helper && <p className="mt-1 text-xs text-slate-400 font-medium">{helper}</p>}
    </div>
    <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${colorClass}`}>
      <Icon size={20} />
    </div>
  </div>
);

const AllStaffPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { staffList, metrics, loading, saving } = useSelector((state) => state.staff);
  const { departments } = useSelector((state) => state.departments);
  const { designations } = useSelector((state) => state.designations);

  // Filters state
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");
  const [staffType, setStaffType] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [status, setStatus] = useState("Active");

  // Selection states for bulk printing
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [printIdCardRecord, setPrintIdCardRecord] = useState(null);
  const [bulkPrintCards, setBulkPrintCards] = useState(false);

  useEffect(() => {
    dispatch(fetchAllDepartments());
    dispatch(fetchAllDesignations());
    loadStaff();
  }, [dispatch]);

  const loadStaff = () => {
    const params = {};
    if (status) params.status = status;
    if (departmentId) params.departmentId = departmentId;
    if (designationId) params.designationId = designationId;
    if (staffType) params.staffType = staffType;
    if (employmentType) params.employmentType = employmentType;
    if (search) params.search = search;

    dispatch(fetchStaffList(params));
    setSelectedIds([]); // Reset selection on reload
  };

  const handleResetFilters = () => {
    setSearch("");
    setDepartmentId("");
    setDesignationId("");
    setStaffType("");
    setEmploymentType("");
    setStatus("Active");
    setTimeout(() => {
      dispatch(fetchStaffList({ status: "Active" }));
      setSelectedIds([]);
    }, 50);
  };

  // Checkbox handlers
  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(staffList.map((s) => s._id));
    } else {
      setSelectedIds([]);
    }
  };

  // Row Delete Actions
  const openDeleteModal = (staff) => {
    setDeleteRecord(staff);
  };

  const confirmDelete = async () => {
    if (!deleteRecord) return;
    const result = await dispatch(removeStaff(deleteRecord._id));
    if (removeStaff.fulfilled.match(result)) {
      toast.success("Employee profile permanently deleted.");
      setDeleteRecord(null);
      loadStaff();
    } else {
      toast.error(result.payload || "Delete failed: dependent records exist.");
    }
  };

  // Bulk Exports
  const handleBulkExportCSV = () => {
    const exportQueue = selectedIds.length > 0
      ? staffList.filter((s) => selectedIds.includes(s._id))
      : staffList;

    if (exportQueue.length === 0) {
      toast.info("No data to export");
      return;
    }

    const rows = exportQueue.map((s) => ({
      "Employee ID": s.employeeId,
      Name: `${s.firstName} ${s.lastName}`,
      "Staff Type": s.staffType,
      Department: s.department?.departmentName || "",
      Designation: s.designation?.designationName || "",
      Mobile: s.mobile,
      Email: s.email,
      "Joining Date": s.dateOfJoining ? new Date(s.dateOfJoining).toISOString().split("T")[0] : "",
      "Employment Type": s.employmentType,
      Status: s.status,
    }));

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Staff_List_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintList = () => {
    toast.success("Renders printer layout... Press Ctrl+P to save or print.");
    window.print();
  };

  const bulkSelectedStaff = useMemo(() => {
    return staffList.filter((s) => selectedIds.includes(s._id));
  }, [staffList, selectedIds]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10 print:p-0">
        
        {/* Header */}
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between print:hidden">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Human Resources
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              Staff Management
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage school employees, teaching/non-teaching details, leaving, and active statuses.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/staff/add")}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-300 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md cursor-pointer"
          >
            <Plus size={18} />
            Add Employee
          </button>
        </header>

        {/* HR Statistics Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
          <StatCard
            label="Total Staff"
            value={metrics.totalStaff || 0}
            helper="All active profiles"
            colorClass="bg-blue-50 text-blue-600"
            icon={Users}
          />
          <StatCard
            label="Teaching / Non-Teaching"
            value={`${metrics.teachingStaff || 0} / ${metrics.nonTeachingStaff || 0}`}
            helper="Current split"
            colorClass="bg-indigo-50 text-indigo-600"
            icon={Briefcase}
          />
          <StatCard
            label="Active Employees"
            value={metrics.activeStaff || 0}
            helper="Presently on duty"
            colorClass="bg-emerald-50 text-emerald-600"
            icon={CheckCircle}
          />
          <StatCard
            label="On Leave / New Joinees"
            value={`${metrics.onLeave || 0} / ${metrics.newJoinees || 0}`}
            helper="Leave count / Past 30 Days"
            colorClass="bg-amber-50 text-amber-600"
            icon={Clock}
          />
        </section>

        {/* Advanced Filters Panel */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 space-y-4 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Employee ID, Name, Mobile, Email..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>

            {/* Department */}
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.departmentName}
                </option>
              ))}
            </select>

            {/* Designation */}
            <select
              value={designationId}
              onChange={(e) => setDesignationId(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="">All Designations</option>
              {designations.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.designationName}
                </option>
              ))}
            </select>

            {/* Staff Type */}
            <select
              value={staffType}
              onChange={(e) => setStaffType(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="">All Staff Types</option>
              <option value="Teaching Staff">Teaching Staff</option>
              <option value="Non Teaching Staff">Non Teaching Staff</option>
            </select>

            {/* Employment Type */}
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="">All Employment Types</option>
              <option value="Permanent">Permanent</option>
              <option value="Contract">Contract</option>
              <option value="Probation">Probation</option>
              <option value="Part Time">Part Time</option>
              <option value="Temporary">Temporary</option>
            </select>

            {/* Status */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
              <option value="Resigned">Resigned</option>
              <option value="Terminated">Terminated</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={loadStaff}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white shadow transition hover:bg-slate-800 cursor-pointer"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
              >
                Reset
              </button>
            </div>

            <div className="flex gap-2">
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setBulkPrintCards(true)}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-4 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100 cursor-pointer"
                >
                  <CreditCard size={14} />
                  Print ID Cards ({selectedIds.length})
                </button>
              )}

              <button
                type="button"
                onClick={handleBulkExportCSV}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
              >
                <FileSpreadsheet size={14} />
                Export CSV
              </button>

              <button
                type="button"
                onClick={handlePrintList}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
              >
                <Printer size={14} />
                Print List
              </button>
            </div>
          </div>
        </section>

        {/* Data Table */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70 overflow-hidden print:border-none print:shadow-none">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-sm text-slate-500 font-medium">Fetching employee directory...</p>
            </div>
          ) : staffList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">No Staff Found</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-xs leading-normal">
                  No employee profiles match the selected filters or search keyword. Adjust settings or register a new staff member.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/staff/add")}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
              >
                Add Staff Profile
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-xs font-semibold select-none print:bg-transparent">
                    <th className="w-12 p-4 text-center print:hidden">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === staffList.length && staffList.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-4">Staff Code</th>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Department & Designation</th>
                    <th className="p-4">Mobile & Email</th>
                    <th className="p-4">Joining Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {staffList.map((staff) => {
                    const statusColors = {
                      Active: "bg-emerald-50 text-emerald-700 border-emerald-100",
                      "On Leave": "bg-amber-50 text-amber-700 border-amber-100",
                      Inactive: "bg-slate-100 text-slate-700 border-slate-200",
                      Resigned: "bg-red-50 text-red-700 border-red-100",
                      Terminated: "bg-red-100 text-red-800 border-red-200",
                      Retired: "bg-blue-50 text-blue-700 border-blue-100",
                    };

                    const staffName = `${staff.firstName} ${staff.lastName}`;

                    return (
                      <tr key={staff._id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 text-center print:hidden">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(staff._id)}
                            onChange={() => handleSelectRow(staff._id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-4 font-mono font-semibold text-slate-900">
                          {staff.employeeId}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {staff.photoUrl ? (
                              <img
                                src={staff.photoUrl.startsWith("http") ? staff.photoUrl : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${staff.photoUrl}`}
                                alt={staffName}
                                className="h-9 w-9 rounded-full object-cover border border-slate-200 bg-slate-50"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold border border-slate-200 uppercase">
                                {staff.firstName[0]}
                                {staff.lastName[0]}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-950">{staffName}</p>
                              <p className="text-[10px] text-slate-400 font-medium">Joined {new Date(staff.dateOfJoining).getFullYear()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-slate-500">{staff.staffType}</td>
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {staff.department?.departmentName || <span className="text-slate-400">N/A</span>}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {staff.designation?.designationName || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-slate-900">{staff.mobile}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{staff.email}</p>
                          </div>
                        </td>
                        <td className="p-4 font-medium text-slate-500">
                          {new Date(staff.dateOfJoining).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[staff.status] || "bg-slate-50 text-slate-500"}`}>
                            {staff.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1 print:hidden whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => navigate(`/staff/profile/${staff._id}`)}
                            title="View Profile"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPrintIdCardRecord(staff)}
                            title="Print ID Card"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600 cursor-pointer"
                          >
                            <CreditCard size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(staff)}
                            title="Delete File"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Single print ID card modal */}
        {printIdCardRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 print:p-0 print:bg-white overflow-y-auto">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl print:shadow-none print:p-0">
              <h3 className="text-lg font-bold text-slate-900 mb-4 print:hidden">Print Employee ID Card</h3>
              <div className="flex justify-center print:mt-0">
                <StaffIdCard staff={printIdCardRecord} />
              </div>
              <div className="mt-6 flex justify-end gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => setPrintIdCardRecord(null)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <Printer size={12} />
                  Print Card
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk print ID cards modal */}
        {bulkPrintCards && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 p-4 print:p-0 print:bg-white overflow-y-auto">
            <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-xl print:shadow-none print:p-0">
              <header className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 print:hidden">
                <h3 className="text-lg font-bold text-slate-900">Bulk Print Employee ID Cards</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkPrintCards(false)}
                    className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Printer size={12} />
                    Print ({bulkSelectedStaff.length}) Cards
                  </button>
                </div>
              </header>

              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 justify-center items-center print:grid print:grid-cols-2 print:gap-4">
                {bulkSelectedStaff.map((staff) => (
                  <div key={staff._id} className="flex justify-center break-inside-avoid print:my-2">
                    <StaffIdCard staff={staff} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Delete safeguarding modal */}
        {deleteRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <div className="h-10 w-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <XCircle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Employee Record?</h3>
                <p className="mt-2 text-xs leading-normal text-slate-500">
                  Are you sure you want to hard delete <span className="font-semibold text-slate-800">{deleteRecord.firstName} {deleteRecord.lastName}</span> ({deleteRecord.employeeId})? This action is permanent.
                </p>
                <div className="mt-3 bg-slate-50 border border-slate-100 rounded-lg p-3 text-[11px] text-slate-500 space-y-1">
                  <span className="font-semibold text-slate-700 block mb-1">Safety Safeguard Check:</span>
                  <p>• Cannot delete if dependent Payroll slips are generated.</p>
                  <p>• Cannot delete if Attendance logs exist.</p>
                  <p>• Cannot delete if Leave requests exist.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteRecord(null)}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={12} />
                      Deleting...
                    </>
                  ) : (
                    "Confirm Hard Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AllStaffPage;
