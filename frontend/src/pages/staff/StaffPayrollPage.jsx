import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Loader2, Coins, Calendar, FileText, Printer, CheckCircle, Clock, Plus, Search, Eye, Download } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { fetchStaffList, fetchPayrollAcrossSchool, createPayroll } from "../../redux/slices/staffSlice";

const StaffPayrollPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { staffList, allPayroll, loading, saving } = useSelector((state) => state.staff);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");

  // Modal form states for quick payslip generation
  const [payrollFormRecord, setPayrollFormRecord] = useState(null);
  const [allowances, setAllowances] = useState(0);
  const [deductions, setDeductions] = useState(0);

  useEffect(() => {
    dispatch(fetchStaffList());
    loadPayroll();
  }, [dispatch, selectedMonth, selectedYear]);

  const loadPayroll = () => {
    dispatch(fetchPayrollAcrossSchool({ month: selectedMonth, year: selectedYear }));
  };

  const handleGeneratePayroll = async (e) => {
    e.preventDefault();
    if (!payrollFormRecord) return;

    const result = await dispatch(
      createPayroll({
        id: payrollFormRecord._id,
        data: {
          month: selectedMonth,
          year: selectedYear,
          allowances,
          deductions,
        },
      })
    );

    if (createPayroll.fulfilled.match(result)) {
      toast.success(`Payslip generated for ${payrollFormRecord.firstName} ${payrollFormRecord.lastName}`);
      setPayrollFormRecord(null);
      setAllowances(0);
      setDeductions(0);
      loadPayroll();
    } else {
      toast.error(result.payload || "Failed to generate payroll.");
    }
  };

  // Combine staffList with generated payroll data to show paid/unpaid status for all employees
  const combinedRegistry = useMemo(() => {
    return staffList.map((staff) => {
      const match = allPayroll.find((pay) => pay.staff?._id === staff._id);
      return {
        staff,
        payroll: match || null,
        isGenerated: !!match,
      };
    }).filter((item) => {
      const name = `${item.staff.firstName} ${item.staff.lastName}`.toLowerCase();
      const code = item.staff.employeeId.toLowerCase();
      const q = searchQuery.toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [staffList, allPayroll, searchQuery]);

  // Dashboard metrics summaries for the selected period
  const stats = useMemo(() => {
    let totalPayout = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    combinedRegistry.forEach((item) => {
      if (item.isGenerated) {
        totalPayout += item.payroll.netSalary;
        paidCount++;
      } else {
        unpaidCount++;
      }
    });

    return { totalPayout, paidCount, unpaidCount };
  }, [combinedRegistry]);

  const handlePrintPayslip = (pay, staff) => {
    const printWindow = window.open("", "_blank");
    const formattedDate = `${pay.month}/${pay.year}`;
    const staffName = `${staff.firstName} ${staff.lastName}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Payslip - ${staffName} - ${formattedDate}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; color: #1e293b; }
            .header p { margin: 5px 0 0 0; font-size: 14px; color: #64748b; }
            .dossier { margin: 30px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 13px; }
            .dossier span { font-weight: bold; }
            .salary-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            .salary-table th, .salary-table td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 13px; }
            .salary-table th { bg-color: #f8fafc; font-weight: bold; }
            .net-salary { margin-top: 30px; text-align: right; font-size: 18px; font-weight: bold; color: #1e293b; border-top: 2px solid #e2e8f0; padding-top: 15px; }
            .footer { margin-top: 80px; text-align: center; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SPRINGFIELD ACADEMY</h1>
            <p>Salary Slip for ${formattedDate}</p>
          </div>
          <div class="dossier">
            <div><span>Employee ID:</span> ${staff.employeeId}</div>
            <div><span>Full Name:</span> ${staffName}</div>
            <div><span>Department:</span> ${staff.department?.departmentName || "N/A"}</div>
            <div><span>Designation:</span> ${staff.designation?.designationName || "N/A"}</div>
            <div><span>Staff Type:</span> ${staff.staffType}</div>
            <div><span>Employment Status:</span> ${staff.status}</div>
          </div>
          <table class="salary-table">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th>Earnings Category</th>
                <th>Amount (₹)</th>
                <th>Deductions / Taxes</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Basic Monthly Salary</td>
                <td>₹${pay.basicPay}</td>
                <td>Provident Fund (PF - 12%)</td>
                <td>₹${pay.pf}</td>
              </tr>
              <tr>
                <td>Allowances</td>
                <td>₹${pay.allowances}</td>
                <td>Employee State Insurance (ESI - 1.75%)</td>
                <td>₹${pay.esi}</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td>Professional Tax / Income Tax</td>
                <td>₹${pay.tax}</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td>Custom Deductions</td>
                <td>₹${pay.deductions}</td>
              </tr>
            </tbody>
          </table>
          <div class="net-salary">
            NET TAKE HOME SALARY: ₹${pay.netSalary}
          </div>
          <div class="footer">
            This is a computer-generated salary slip and requires no physical signature.
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
              Monthly Payroll Registry
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View salaries, track payouts, generate monthly slips, and print payslips.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm outline-none"
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString("default", { month: "long" })}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm outline-none"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </header>

        {/* Stats Summary Cards */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Monthly Payout</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">₹{stats.totalPayout}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Coins size={20} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Generated Slips</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{stats.paidCount} Employees</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle size={20} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Registries</p>
              <p className="mt-2 text-2xl font-bold text-amber-700">{stats.unpaidCount} Employees</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
          </div>
        </section>

        {/* Search filter bar */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Employee ID or Name..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
            />
          </div>
        </section>

        {/* Table Listing Registry */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-sm text-slate-500 font-semibold">Loading monthly salary logs...</p>
            </div>
          ) : combinedRegistry.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <Coins size={22} />
              </div>
              <h3 className="text-sm font-semibold text-slate-950">No Data Available</h3>
              <p className="mt-1 text-xs text-slate-500">Register employee files to configure payroll systems.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-bold select-none">
                    <th className="p-4">Employee</th>
                    <th className="p-4 text-right">Basic Monthly Pay</th>
                    <th className="p-4 text-right">Allowances</th>
                    <th className="p-4 text-right">Deductions</th>
                    <th className="p-4 text-right">Taxes/PF/ESI Combined</th>
                    <th className="p-4 text-right">Net Take Home</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Payroll Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {combinedRegistry.map(({ staff, payroll, isGenerated }) => {
                    const employeeName = `${staff.firstName} ${staff.lastName}`;
                    const combinedDeductions = isGenerated ? (payroll.pf + payroll.esi + payroll.tax) : 0;

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
                        <td className="p-4 text-right font-semibold">₹{staff.salary}</td>
                        <td className="p-4 text-right text-emerald-600 font-medium">
                          {isGenerated ? `+₹${payroll.allowances}` : "—"}
                        </td>
                        <td className="p-4 text-right text-rose-600 font-medium">
                          {isGenerated ? `-₹${payroll.deductions}` : "—"}
                        </td>
                        <td className="p-4 text-right text-rose-500 font-medium">
                          {isGenerated ? `-₹${combinedDeductions}` : "—"}
                        </td>
                        <td className="p-4 text-right font-bold text-slate-950">
                          {isGenerated ? `₹${payroll.netSalary}` : "—"}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                            isGenerated ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}>
                            {isGenerated ? "Paid" : "Pending"}
                          </span>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          {isGenerated ? (
                            <button
                              type="button"
                              onClick={() => handlePrintPayslip(payroll, staff)}
                              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm cursor-pointer"
                            >
                              <Printer size={12} />
                              Payslip PDF
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPayrollFormRecord(staff)}
                              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-[10px] font-bold text-white hover:bg-blue-700 shadow-sm cursor-pointer"
                            >
                              <Plus size={12} />
                              Generate Slip
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Generate payroll dialog modal */}
        {payrollFormRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-slate-950 border-b pb-2">Generate Payslip</h3>
              
              <div className="space-y-1.5 text-xs">
                <p><span className="text-slate-400 font-semibold">Employee:</span> <span className="font-bold text-slate-800">{payrollFormRecord.firstName} {payrollFormRecord.lastName}</span></p>
                <p><span className="text-slate-400 font-semibold">Period:</span> <span className="font-bold text-slate-800">{new Date(0, selectedMonth - 1).toLocaleString("default", { month: "long" })} {selectedYear}</span></p>
                <p><span className="text-slate-400 font-semibold">Basic Pay:</span> <span className="font-bold text-slate-800">₹{payrollFormRecord.salary}</span></p>
              </div>

              <form onSubmit={handleGeneratePayroll} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Custom Allowances (₹)</label>
                  <input
                    type="number"
                    value={allowances}
                    onChange={(e) => setAllowances(Number(e.target.value))}
                    placeholder="Allowances in INR"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Custom Deductions (₹)</label>
                  <input
                    type="number"
                    value={deductions}
                    onChange={(e) => setDeductions(Number(e.target.value))}
                    placeholder="Deductions in INR"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setPayrollFormRecord(null);
                      setAllowances(0);
                      setDeductions(0);
                    }}
                    disabled={saving}
                    className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin" size={12} />
                        Generating...
                      </>
                    ) : (
                      "Confirm & Pay"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default StaffPayrollPage;
