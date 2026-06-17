import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, Clock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { fetchLeavesAcrossSchool, processLeaveStatus } from "../../redux/slices/staffSlice";

const LeaveManagementPage = () => {
  const dispatch = useDispatch();
  
  const { allLeaves, loading, saving } = useSelector((state) => state.staff);
  const { user } = useSelector((state) => state.auth);

  const [statusFilter, setStatusFilter] = useState("Pending");
  const [remarks, setRemarks] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    dispatch(fetchLeavesAcrossSchool());
  }, [dispatch]);

  const filteredLeaves = allLeaves.filter((l) => {
    if (statusFilter === "All") return true;
    return l.status === statusFilter;
  });

  const handleUpdateStatus = async (status) => {
    if (!selectedRequest) return;
    
    const result = await dispatch(
      processLeaveStatus({
        id: selectedRequest.staff?._id,
        leaveId: selectedRequest._id,
        data: { status, remarks }
      })
    );

    if (processLeaveStatus.fulfilled.match(result)) {
      toast.success(`Leave request has been ${status.toLowerCase()}!`);
      setSelectedRequest(null);
      setRemarks("");
      dispatch(fetchLeavesAcrossSchool());
    } else {
      toast.error(result.payload || "Failed to process leave request.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Rejected": return "bg-red-50 text-red-700 border-red-100";
      case "Cancelled": return "bg-slate-50 text-slate-500 border-slate-100";
      default: return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

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
              Leave Approvals
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review and authorize employee leave requests, view reasons, and log remarks.
            </p>
          </div>
        </header>

        {/* Tab Filters */}
        <section className="flex gap-2 border-b border-slate-200 pb-px">
          {["Pending", "Approved", "Rejected", "All"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`pb-3 text-sm font-bold border-b-2 px-4 transition-colors ${
                statusFilter === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab} Requests
            </button>
          ))}
        </section>

        {/* Table Listing */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-sm text-slate-500 font-semibold">Loading leave requests...</p>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <Clock size={22} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-950">No Leave Requests</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-xs leading-normal">
                  No requests matching status <span className="font-semibold text-slate-800">"{statusFilter}"</span> were found in system logs.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold select-none">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Leave Category</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Remarks</th>
                    <th className="p-4">Status</th>
                    {statusFilter === "Pending" && <th className="p-4 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {filteredLeaves.map((leave) => {
                    const employeeName = leave.staff ? `${leave.staff.firstName} ${leave.staff.lastName}` : "Former Staff";
                    const durationDays = Math.ceil((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1;

                    return (
                      <tr key={leave._id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {leave.staff?.photoUrl ? (
                              <img
                                src={leave.staff.photoUrl.startsWith("http") ? leave.staff.photoUrl : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${leave.staff.photoUrl}`}
                                alt={employeeName}
                                className="h-8 w-8 rounded-full object-cover border"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[10px] uppercase border">
                                {leave.staff?.firstName[0] || "E"}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-950">{employeeName}</p>
                              <p className="text-[10px] text-slate-400 font-medium font-mono">{leave.staff?.employeeId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-slate-800">{leave.leaveType}</td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">
                              {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">{durationDays} {durationDays === 1 ? "day" : "days"}</p>
                          </div>
                        </td>
                        <td className="p-4 truncate max-w-xs">{leave.reason}</td>
                        <td className="p-4 text-slate-500 truncate max-w-xs">{leave.remarks || "—"}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${getStatusColor(leave.status)}`}>
                            {leave.status}
                          </span>
                        </td>
                        {statusFilter === "Pending" && (
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedRequest(leave)}
                              className="inline-flex h-8 items-center justify-center rounded-lg bg-slate-900 px-3 text-[10px] font-bold text-white hover:bg-slate-800 cursor-pointer shadow-sm"
                            >
                              Process Request
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Leave Processing Modal Overlay */}
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-950 border-b pb-2">Process Leave Request</h3>
              
              <div className="space-y-2 text-xs">
                <p><span className="text-slate-400 font-semibold">Employee:</span> <span className="font-bold text-slate-800">{selectedRequest.staff?.firstName} {selectedRequest.staff?.lastName}</span></p>
                <p><span className="text-slate-400 font-semibold">Category Type:</span> <span className="font-bold text-slate-800">{selectedRequest.leaveType}</span></p>
                <p><span className="text-slate-400 font-semibold">Reason:</span> <span className="font-medium text-slate-600 italic">"{selectedRequest.reason}"</span></p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Approval Notes / Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter feedback notes or reason for rejection/approval..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-700 resize-none outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRequest(null);
                    setRemarks("");
                  }}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("Rejected")}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer disabled:opacity-50"
                >
                  Reject Request
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("Approved")}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  Approve Request
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default LeaveManagementPage;
