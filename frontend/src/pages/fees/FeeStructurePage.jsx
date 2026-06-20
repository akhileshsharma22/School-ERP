import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  fetchFeeCategories, addFeeCategory, editFeeCategory, removeFeeCategory,
  fetchDiscounts, addDiscount, editDiscount, removeDiscount,
  fetchStructures, addStructure, editStructure, removeStructure
} from "../../redux/slices/financeSlice";
import { fetchAcademicYears } from "../../redux/slices/academicYearSlice";
import { fetchAllClasses } from "../../redux/slices/classSectionSlice";

const FREQUENCIES = ["One-Time", "Monthly", "Quarterly", "Half-Yearly", "Annually"];
const DISCOUNT_TYPES = ["Percentage", "Fixed Amount", "Fee Head Specific", "Full Waiver"];
const INSTALLMENT_TYPES = ["Annual", "Half-Yearly", "Quarterly", "Monthly"];
const FINE_TYPES = ["None", "Per Day", "Per Week", "Fixed", "Percentage"];

const FeeStructurePage = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("heads");

  // Selectors
  const { categories, discounts, structures, saving } = useSelector((s) => s.finance);
  const { academicYears } = useSelector((s) => s.academicYear);
  const { classes } = useSelector((s) => s.classSections);

  // Modal forms states
  const [showHeadModal, setShowHeadModal] = useState(false);
  const [headForm, setHeadForm] = useState({ id: null, name: "", description: "", amount: "", frequency: "Annually", isMandatory: true, status: "Active" });

  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountForm, setDiscountForm] = useState({ id: null, categoryName: "", discountType: "Percentage", discountValue: "", feeCategory: "", description: "", status: "Active" });

  const [showStructureModal, setShowStructureModal] = useState(false);
  const [structureForm, setStructureForm] = useState({
    id: null, name: "", academicYear: "", className: "", stream: "", sectionName: "",
    feeItems: [], installments: "Annual",
    lateFineRule: { fineType: "None", fineAmount: 0, graceDays: 0 }, status: "Active"
  });

  useEffect(() => {
    dispatch(fetchFeeCategories());
    dispatch(fetchDiscounts());
    dispatch(fetchStructures());
    dispatch(fetchAcademicYears());
    dispatch(fetchAllClasses());
  }, [dispatch]);

  // CATEGORY/HEAD HANDLERS
  const handleHeadSubmit = async (e) => {
    e.preventDefault();
    if (!headForm.name.trim() || !headForm.amount) return toast.error("Please fill required fields.");
    const payload = {
      name: headForm.name,
      description: headForm.description,
      amount: Number(headForm.amount),
      frequency: headForm.frequency,
      isMandatory: headForm.isMandatory,
      status: headForm.status
    };

    let res;
    if (headForm.id) {
      res = await dispatch(editFeeCategory({ id: headForm.id, data: payload }));
    } else {
      res = await dispatch(addFeeCategory(payload));
    }

    if (addFeeCategory.fulfilled.match(res) || editFeeCategory.fulfilled.match(res)) {
      toast.success(headForm.id ? "Fee Category updated" : "Fee Category created successfully");
      setShowHeadModal(false);
      setHeadForm({ id: null, name: "", description: "", amount: "", frequency: "Annually", isMandatory: true, status: "Active" });
    } else {
      toast.error(res.payload || "Operation failed");
    }
  };

  const handleHeadDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this fee head?")) {
      const res = await dispatch(removeFeeCategory(id));
      if (removeFeeCategory.fulfilled.match(res)) {
        toast.success("Fee head category deleted successfully");
      } else {
        toast.error(res.payload || "Delete failed");
      }
    }
  };

  // DISCOUNT HANDLERS
  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    if (!discountForm.categoryName || !discountForm.discountValue) return toast.error("Please fill required fields.");
    const payload = {
      categoryName: discountForm.categoryName,
      discountType: discountForm.discountType,
      discountValue: Number(discountForm.discountValue),
      feeCategory: discountForm.discountType === "Fee Head Specific" ? discountForm.feeCategory : null,
      description: discountForm.description,
      status: discountForm.status
    };

    let res;
    if (discountForm.id) {
      res = await dispatch(editDiscount({ id: discountForm.id, data: payload }));
    } else {
      res = await dispatch(addDiscount(payload));
    }

    if (addDiscount.fulfilled.match(res) || editDiscount.fulfilled.match(res)) {
      toast.success(discountForm.id ? "Discount mapping updated" : "Category Discount created successfully");
      setShowDiscountModal(false);
      setDiscountForm({ id: null, categoryName: "", discountType: "Percentage", discountValue: "", feeCategory: "", description: "", status: "Active" });
    } else {
      toast.error(res.payload || "Operation failed");
    }
  };

  const handleDiscountDelete = async (id) => {
    if (window.confirm("Delete this discount rule?")) {
      const res = await dispatch(removeDiscount(id));
      if (removeDiscount.fulfilled.match(res)) toast.success("Discount mapping deleted");
    }
  };

  // STRUCTURE HANDLERS
  const handleAddFeeItemRow = () => {
    setStructureForm(prev => ({
      ...prev,
      feeItems: [...prev.feeItems, { feeCategory: "", amount: 0 }]
    }));
  };

  const handleRemoveFeeItemRow = (idx) => {
    setStructureForm(prev => ({
      ...prev,
      feeItems: prev.feeItems.filter((_, i) => i !== idx)
    }));
  };

  const handleFeeItemRowChange = (idx, field, value) => {
    setStructureForm(prev => {
      const copy = [...prev.feeItems];
      copy[idx] = { ...copy[idx], [field]: value };
      return { ...prev, feeItems: copy };
    });
  };

  const handleStructureSubmit = async (e) => {
    e.preventDefault();
    if (!structureForm.name.trim() || !structureForm.academicYear || !structureForm.className || !structureForm.feeItems.length) {
      return toast.error("Please fill required fields and add at least one fee head.");
    }
    const payload = {
      name: structureForm.name,
      academicYear: structureForm.academicYear,
      className: structureForm.className,
      stream: structureForm.stream,
      sectionName: structureForm.sectionName,
      feeItems: structureForm.feeItems.map(item => ({ feeCategory: item.feeCategory, amount: Number(item.amount) })),
      installments: structureForm.installments,
      lateFineRule: structureForm.lateFineRule,
      status: structureForm.status
    };

    let res;
    if (structureForm.id) {
      res = await dispatch(editStructure({ id: structureForm.id, data: payload }));
    } else {
      res = await dispatch(addStructure(payload));
    }

    if (addStructure.fulfilled.match(res) || editStructure.fulfilled.match(res)) {
      toast.success("Fee Structure saved successfully!");
      setShowStructureModal(false);
      setStructureForm({
        id: null, name: "", academicYear: "", className: "", stream: "", sectionName: "",
        feeItems: [], installments: "Annual",
        lateFineRule: { fineType: "None", fineAmount: 0, graceDays: 0 }, status: "Active"
      });
    } else {
      toast.error(res.payload || "Failed to save fee structure.");
    }
  };

  const handleStructureDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this Fee Structure template?")) {
      const res = await dispatch(removeStructure(id));
      if (removeStructure.fulfilled.match(res)) toast.success("Fee Structure deleted");
      else toast.error(res.payload || "Delete failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <header className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Fees Setup</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Fees & Structures</h1>
            <p className="text-xs text-slate-500 font-medium">Configure fee heads, map category-based discount systems, and assemble class fee schedules.</p>
          </div>
          <div className="flex gap-2">
            {activeTab === "heads" && (
              <button onClick={() => setShowHeadModal(true)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white shadow hover:bg-slate-800 transition cursor-pointer">
                <Plus size={14} /> Add Fee Category
              </button>
            )}
            {activeTab === "discounts" && (
              <button onClick={() => setShowDiscountModal(true)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white shadow hover:bg-slate-800 transition cursor-pointer">
                <Plus size={14} /> Add Category Discount
              </button>
            )}
            {activeTab === "structures" && (
              <button onClick={() => {
                setStructureForm({
                  id: null, name: "", academicYear: academicYears[0]?._id || "", className: "", stream: "", sectionName: "",
                  feeItems: [{ feeCategory: "", amount: 0 }], installments: "Annual",
                  lateFineRule: { fineType: "None", fineAmount: 0, graceDays: 0 }, status: "Active"
                });
                setShowStructureModal(true);
              }} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white shadow hover:bg-slate-800 transition cursor-pointer">
                <Plus size={14} /> Create Structure
              </button>
            )}
          </div>
        </header>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200">
          {[
            { id: "heads", label: "Fee heads & Categories" },
            { id: "discounts", label: "Category Discounts Mapping" },
            { id: "structures", label: "Fee Structures" }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 text-xs font-bold transition ${activeTab === tab.id ? "border-b-2 border-slate-950 text-slate-950" : "text-slate-500 hover:text-slate-800"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── TAB 1: FEE HEADS ─────────────────────────────────────────── */}
        {activeTab === "heads" && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {["Category Name", "Description", "Base Amount", "Frequency", "Mandatory", "Status", "Actions"].map(h => (
                      <th key={h} className="px-4 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-6 text-center text-slate-400 font-semibold">No Fee Heads configured yet.</td>
                    </tr>
                  ) : (
                    categories.map(cat => (
                      <tr key={cat._id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 font-bold text-slate-900">{cat.name}</td>
                        <td className="px-4 py-2 text-slate-500">{cat.description || "—"}</td>
                        <td className="px-4 py-2 font-semibold text-slate-805">₹{cat.amount}</td>
                        <td className="px-4 py-2">{cat.frequency}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[9px] font-bold border ${cat.isMandatory ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-slate-50 text-slate-655 border-slate-150"}`}>
                            {cat.isMandatory ? "Yes" : "Optional"}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[9px] font-bold border ${cat.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>
                            {cat.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1.5">
                            <button onClick={() => { setHeadForm({ id: cat._id, ...cat }); setShowHeadModal(true); }} className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 border border-slate-200 transition cursor-pointer">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => handleHeadDelete(cat._id)} className="p-1 hover:bg-rose-50 rounded-lg text-rose-600 border border-rose-100 transition cursor-pointer">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB 2: DISCOUNTS ─────────────────────────────────────────── */}
        {activeTab === "discounts" && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {["Category Rule", "Discount Type", "Value", "Scope", "Description", "Status", "Actions"].map(h => (
                      <th key={h} className="px-4 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {discounts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-6 text-center text-slate-400 font-semibold">No Category Discount rules mapped yet.</td>
                    </tr>
                  ) : (
                    discounts.map(disc => (
                      <tr key={disc._id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 font-bold text-slate-900">{disc.categoryName}</td>
                        <td className="px-4 py-2">{disc.discountType}</td>
                        <td className="px-4 py-2 font-semibold text-slate-805">
                          {disc.discountType === "Percentage" ? `${disc.discountValue}%` : disc.discountType === "Full Waiver" ? "100%" : `₹${disc.discountValue}`}
                        </td>
                        <td className="px-4 py-2 font-medium text-slate-600">
                          {disc.feeCategory ? disc.feeCategory.name : "All Fee Heads"}
                        </td>
                        <td className="px-4 py-2 text-slate-500">{disc.description || "—"}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[9px] font-bold border ${disc.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>
                            {disc.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1.5">
                            <button onClick={() => { setDiscountForm({ id: disc._id, ...disc, feeCategory: disc.feeCategory?._id || "" }); setShowDiscountModal(true); }} className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 border border-slate-200 transition cursor-pointer">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => handleDiscountDelete(disc._id)} className="p-1 hover:bg-rose-50 rounded-lg text-rose-600 border border-rose-100 transition cursor-pointer">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB 3: STRUCTURES ────────────────────────────────────────── */}
        {activeTab === "structures" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {structures.length === 0 ? (
              <div className="col-span-full rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-400 font-semibold">
                No Fee Structures configured yet. Click "Create Structure" to start.
              </div>
            ) : (
              structures.map(struct => {
                const totalAmount = struct.feeItems.reduce((s, i) => s + i.amount, 0);
                return (
                  <div key={struct._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3.5 hover:shadow transition duration-150">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{struct.academicYear?.name || "AY"}</span>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">{struct.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{struct.className} {struct.stream ? `· ${struct.stream}` : ""} {struct.sectionName ? `· Sec ${struct.sectionName}` : ""}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[9px] font-bold border ${struct.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>
                        {struct.status}
                      </span>
                    </div>

                    <div className="border-t border-b border-slate-100 py-2.5 space-y-1 text-xs text-slate-605">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>Total Payable:</span>
                        <span>₹{totalAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Installments:</span>
                        <span>{struct.installments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Late Fine:</span>
                        <span>
                          {struct.lateFineRule?.fineType === "None" ? "No Fine" : `₹${struct.lateFineRule?.fineAmount} / ${struct.lateFineRule?.fineType}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => {
                        setStructureForm({
                          id: struct._id, ...struct,
                          academicYear: struct.academicYear?._id || "",
                          feeItems: struct.feeItems.map(item => ({ feeCategory: item.feeCategory?._id, amount: item.amount }))
                        });
                        setShowStructureModal(true);
                      }} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-705 hover:bg-slate-50 transition cursor-pointer">
                        <Edit2 size={11} /> Edit
                      </button>
                      <button onClick={() => handleStructureDelete(struct._id)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-100 bg-rose-50 px-2.5 text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition cursor-pointer">
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ─── MODAL 1: FEE HEADS FORM ────────────────────────────────────── */}
      {showHeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <form onSubmit={handleHeadSubmit} className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-slate-200 p-4 flex justify-between items-center bg-slate-50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-955">{headForm.id ? "Edit Fee Category" : "Add Fee head Category"}</h2>
              <button type="button" onClick={() => setShowHeadModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>
            <div className="p-4 space-y-3.5">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Fee Category Name *</label>
                <input required value={headForm.name} onChange={(e) => setHeadForm({ ...headForm, name: e.target.value })}
                  placeholder="e.g. Tuition Fee" className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 font-semibold" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Base Amount (₹) *</label>
                <input required type="number" min="0" value={headForm.amount} onChange={(e) => setHeadForm({ ...headForm, amount: e.target.value })}
                  placeholder="e.g. 10000" className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 font-semibold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">Frequency</label>
                  <select value={headForm.frequency} onChange={(e) => setHeadForm({ ...headForm, frequency: e.target.value })}
                    className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 bg-white font-semibold text-slate-700">
                    {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">Status</label>
                  <select value={headForm.status} onChange={(e) => setHeadForm({ ...headForm, status: e.target.value })}
                    className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 bg-white font-semibold text-slate-700">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Description</label>
                <textarea value={headForm.description} onChange={(e) => setHeadForm({ ...headForm, description: e.target.value })}
                  placeholder="Short details..." className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-slate-400 h-16 resize-none font-medium text-slate-700" />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="mand" checked={headForm.isMandatory} onChange={(e) => setHeadForm({ ...headForm, isMandatory: e.target.checked })} className="cursor-pointer" />
                <label htmlFor="mand" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">This Fee is Mandatory for all students</label>
              </div>
            </div>
            <div className="border-t border-slate-100 p-4 flex justify-end gap-2 bg-slate-50">
              <button type="button" onClick={() => setShowHeadModal(false)} className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="h-9 rounded-xl bg-slate-950 px-5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer">Save Category</button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL 2: DISCOUNTS FORM ────────────────────────────────────── */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <form onSubmit={handleDiscountSubmit} className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-slate-200 p-4 flex justify-between items-center bg-slate-50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-955">{discountForm.id ? "Edit Discount Mapping" : "Add Category Discount Mapping"}</h2>
              <button type="button" onClick={() => setShowDiscountModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>
            <div className="p-4 space-y-3.5">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Category *</label>
                <select required value={discountForm.categoryName} onChange={(e) => setDiscountForm({ ...discountForm, categoryName: e.target.value })}
                  className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 bg-white font-semibold text-slate-700">
                  <option value="">Select Category</option>
                  {["General", "SC", "ST", "OBC", "EWS", "Management", "Staff Child"].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">Discount Type</label>
                  <select value={discountForm.discountType} onChange={(e) => setDiscountForm({ ...discountForm, discountType: e.target.value, feeCategory: "" })}
                    className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 bg-white font-semibold text-slate-700">
                    {DISCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">Discount Value (₹ or %) *</label>
                  <input required type="number" min="0" value={discountForm.discountValue} onChange={(e) => setDiscountForm({ ...discountForm, discountValue: e.target.value })}
                    disabled={discountForm.discountType === "Full Waiver"} placeholder="e.g. 25" className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 disabled:bg-slate-50 font-semibold" />
                </div>
              </div>

              {discountForm.discountType === "Fee Head Specific" && (
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">Target Fee Head Category *</label>
                  <select required value={discountForm.feeCategory} onChange={(e) => setDiscountForm({ ...discountForm, feeCategory: e.target.value })}
                    className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 bg-white font-semibold text-slate-700">
                    <option value="">Select Fee Head</option>
                    {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Status</label>
                <select value={discountForm.status} onChange={(e) => setDiscountForm({ ...discountForm, status: e.target.value })}
                  className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 bg-white font-semibold text-slate-700">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1">Description</label>
                <textarea value={discountForm.description} onChange={(e) => setDiscountForm({ ...discountForm, description: e.target.value })}
                  placeholder="Details..." className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-slate-400 h-16 resize-none font-medium text-slate-700" />
              </div>
            </div>
            <div className="border-t border-slate-100 p-4 flex justify-end gap-2 bg-slate-50">
              <button type="button" onClick={() => setShowDiscountModal(false)} className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="h-9 rounded-xl bg-slate-950 px-5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer">Save Mapping</button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL 3: STRUCTURES FORM ───────────────────────────────────── */}
      {showStructureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <form onSubmit={handleStructureSubmit} className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-slate-200 p-4 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-955">{structureForm.id ? "Edit Fee Structure Template" : "Assemble Class Fee Structure"}</h2>
              <button type="button" onClick={() => setShowStructureModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Basic Meta */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">Structure Name *</label>
                  <input required value={structureForm.name} onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                    placeholder="e.g. Class 10 - Science General" className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 font-semibold" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">Academic Year *</label>
                  <select required value={structureForm.academicYear} onChange={(e) => setStructureForm({ ...structureForm, academicYear: e.target.value })}
                    className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 bg-white font-semibold text-slate-700">
                    <option value="">Select Year</option>
                    {academicYears.map(ay => <option key={ay._id} value={ay._id}>{ay.name || ay.year}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">Class Name *</label>
                  <select required value={structureForm.className} onChange={(e) => setStructureForm({ ...structureForm, className: e.target.value })}
                    className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 bg-white font-semibold text-slate-700">
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c._id} value={c.className}>{c.className}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-600 mb-1">Installment Split Type</label>
                  <select value={structureForm.installments} onChange={(e) => setStructureForm({ ...structureForm, installments: e.target.value })}
                    className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 bg-white font-semibold text-slate-700">
                    {INSTALLMENT_TYPES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>

              {/* Late Fine Configuration */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-2.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Late Fine Penalty Settings</h3>
                <div className="grid gap-3 grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Fine Type</label>
                    <select value={structureForm.lateFineRule?.fineType} onChange={(e) => setStructureForm({ ...structureForm, lateFineRule: { ...structureForm.lateFineRule, fineType: e.target.value } })}
                      className="h-9 w-full rounded-xl border border-slate-200 px-2.5 text-xs outline-none focus:border-slate-400 bg-white font-semibold text-slate-700">
                      {FINE_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Fine Amount (₹ or %)</label>
                    <input type="number" min="0" value={structureForm.lateFineRule?.fineAmount} onChange={(e) => setStructureForm({ ...structureForm, lateFineRule: { ...structureForm.lateFineRule, fineAmount: Number(e.target.value) } })}
                      disabled={structureForm.lateFineRule?.fineType === "None"} className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 bg-white disabled:opacity-60 font-semibold" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Grace Period (Days)</label>
                    <input type="number" min="0" value={structureForm.lateFineRule?.graceDays} onChange={(e) => setStructureForm({ ...structureForm, lateFineRule: { ...structureForm.lateFineRule, graceDays: Number(e.target.value) } })}
                      disabled={structureForm.lateFineRule?.fineType === "None"} className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 bg-white disabled:opacity-60 font-semibold" />
                  </div>
                </div>
              </div>

              {/* Fee Items Breakdown */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Fee Heads Included</h3>
                  <button type="button" onClick={handleAddFeeItemRow} className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 px-3 text-[11px] font-bold text-slate-705 hover:bg-slate-50 transition cursor-pointer">
                    + Add Fee Category Row
                  </button>
                </div>
                {structureForm.feeItems.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-xl font-medium">No Fee categories added. Click the button above to add.</p>
                ) : (
                  <div className="space-y-2 max-h-[25vh] overflow-y-auto pr-1">
                    {structureForm.feeItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <select required value={item.feeCategory} onChange={(e) => handleFeeItemRowChange(idx, "feeCategory", e.target.value)}
                          className="h-9 flex-1 rounded-xl border border-slate-200 px-2.5 text-xs outline-none focus:border-slate-400 bg-white font-semibold text-slate-700">
                          <option value="">Select Fee Head Category</option>
                          {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name} (Default: ₹{cat.amount})</option>)}
                        </select>
                        <input required type="number" min="0" value={item.amount} onChange={(e) => handleFeeItemRowChange(idx, "amount", e.target.value)}
                          placeholder="Amount" className="h-9 w-28 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-slate-400 font-semibold" />
                        <button type="button" onClick={() => handleRemoveFeeItemRow(idx)} className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg border border-transparent hover:border-rose-100 transition cursor-pointer">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 p-4 flex justify-end gap-2 bg-slate-50 shrink-0">
              <button type="button" onClick={() => setShowStructureModal(false)} className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button type="submit" className="h-9 rounded-xl bg-slate-950 px-5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer">Save Structure</button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};

export default FeeStructurePage;
