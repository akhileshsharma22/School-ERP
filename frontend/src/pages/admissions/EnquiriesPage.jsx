import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Download,
  Edit3,
  Info,
  Loader2,
  Plus,
  Search,
  Users,
  Calendar,
  Phone,
  Mail,
  UserPlus,
  Filter,
  CheckCircle,
  XCircle,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  fetchEnquiries,
  createEnquiry,
  updateEnquiry,
  convertEnquiry,
} from "../../redux/slices/enquirySlice";
import { fetchAllClasses } from "../../redux/slices/classSectionSlice";
import { fetchStreams } from "../../redux/slices/streamSlice";
import { fetchCurrentAcademicYear } from "../../redux/slices/academicYearSlice";

const EnquiryCard = ({ label, value, colorClass, icon: Icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
    </div>
    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colorClass}`}>
      <Icon size={22} />
    </div>
  </div>
);

const EnquiriesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { enquiries, loading, saving, error } = useSelector((state) => state.enquiries);
  const { classes } = useSelector((state) => state.classSections);
  const { streams } = useSelector((state) => state.streams);
  const { currentAcademicYear } = useSelector((state) => state.academicYear);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    studentName: "",
    fatherName: "",
    motherName: "",
    mobileNumber: "",
    alternateMobile: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    interestedClass: "",
    interestedStream: "",
    currentSchool: "",
    city: "",
    leadSource: "Walk-In",
    remarks: "",
    counselorAssigned: "",
    followUpDate: "",
    status: "New",
  });

  useEffect(() => {
    dispatch(fetchEnquiries());
    dispatch(fetchAllClasses());
    dispatch(fetchStreams());
    dispatch(fetchCurrentAcademicYear());
  }, [dispatch]);

  // Load editing enquiry or clear form
  useEffect(() => {
    if (editingEnquiry) {
      setFormData({
        studentName: editingEnquiry.studentName || "",
        fatherName: editingEnquiry.fatherName || "",
        motherName: editingEnquiry.motherName || "",
        mobileNumber: editingEnquiry.mobileNumber || "",
        alternateMobile: editingEnquiry.alternateMobile || "",
        email: editingEnquiry.email || "",
        dateOfBirth: editingEnquiry.dateOfBirth ? editingEnquiry.dateOfBirth.split("T")[0] : "",
        gender: editingEnquiry.gender || "",
        interestedClass: editingEnquiry.interestedClass || "",
        interestedStream: editingEnquiry.interestedStream || "",
        currentSchool: editingEnquiry.currentSchool || "",
        city: editingEnquiry.city || "",
        leadSource: editingEnquiry.leadSource || "Walk-In",
        remarks: editingEnquiry.remarks || "",
        counselorAssigned: editingEnquiry.counselorAssigned || "",
        followUpDate: editingEnquiry.followUpDate ? editingEnquiry.followUpDate.split("T")[0] : "",
        status: editingEnquiry.status || "New",
      });
    } else {
      setFormData({
        studentName: "",
        fatherName: "",
        motherName: "",
        mobileNumber: "",
        alternateMobile: "",
        email: "",
        dateOfBirth: "",
        gender: "",
        interestedClass: "",
        interestedStream: "",
        currentSchool: "",
        city: "",
        leadSource: "Walk-In",
        remarks: "",
        counselorAssigned: "",
        followUpDate: "",
        status: "New",
      });
    }
  }, [editingEnquiry, modalOpen]);

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((enq) => {
      const matchesSearch =
        !searchTerm ||
        enq.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enq.fatherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enq.mobileNumber?.includes(searchTerm);

      const matchesStatus = !statusFilter || enq.status === statusFilter;
      const matchesClass = !classFilter || enq.interestedClass === classFilter;

      return matchesSearch && matchesStatus && matchesClass;
    });
  }, [enquiries, searchTerm, statusFilter, classFilter]);

  // Lead Conversion rate
  const metrics = useMemo(() => {
    const total = enquiries.length;
    const activeNew = enquiries.filter((e) => e.status === "New").length;
    const interested = enquiries.filter((e) => e.status === "Interested").length;
    const followUp = enquiries.filter((e) => e.status === "Follow Up").length;
    const converted = enquiries.filter((e) => e.status === "Converted").length;
    return { total, activeNew, interested, followUp, converted };
  }, [enquiries]);

  // Today's Follow up reminder
  const todayFollowUps = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return enquiries.filter((e) => e.status === "Follow Up" && e.followUpDate?.startsWith(todayStr));
  }, [enquiries]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingEnquiry(null);
    setModalOpen(true);
  };

  const openEditModal = (enquiry) => {
    setEditingEnquiry(enquiry);
    setModalOpen(true);
  };

  const handleSaveEnquiry = async (e) => {
    e.preventDefault();
    const studentNameTrimmed = String(formData.studentName || "").trim();
    const fatherNameTrimmed = String(formData.fatherName || "").trim();
    const mobileNumberTrimmed = String(formData.mobileNumber || "").trim();
    const interestedClassTrimmed = String(formData.interestedClass || "").trim();

    if (!studentNameTrimmed || !fatherNameTrimmed || !mobileNumberTrimmed || !interestedClassTrimmed) {
      toast.error("Please fill required fields");
      return;
    }

    if (!/^\d{10}$/.test(mobileNumberTrimmed)) {
      toast.error("Invalid mobile number");
      return;
    }

    const payload = {
      ...formData,
      studentName: studentNameTrimmed,
      fatherName: fatherNameTrimmed,
      mobileNumber: mobileNumberTrimmed,
      academicYearId: currentAcademicYear?._id,
    };

    let result;
    if (editingEnquiry) {
      result = await dispatch(updateEnquiry({ id: editingEnquiry._id, data: payload }));
    } else {
      result = await dispatch(createEnquiry(payload));
    }

    if (createEnquiry.fulfilled.match(result) || updateEnquiry.fulfilled.match(result)) {
      toast.success(editingEnquiry ? "Enquiry updated successfully" : "Enquiry created successfully");
      setModalOpen(false);
      dispatch(fetchEnquiries());
    } else {
      toast.error(result.payload || "An error occurred.");
    }
  };

  const handleConvertToAdmission = async (enquiry) => {
    // 1. Mark Enquiry as Converted
    const result = await dispatch(convertEnquiry(enquiry._id));
    if (convertEnquiry.fulfilled.match(result)) {
      toast.success("Enquiry converted! Redirecting to New Admission...");
      // 2. Redirect to Admission wizard pre-filled with enquiry details
      navigate("/admissions/new", {
        state: {
          prefill: {
            firstName: enquiry.studentName.split(" ")[0] || "",
            lastName: enquiry.studentName.split(" ").slice(1).join(" ") || "Sharma",
            fatherName: enquiry.fatherName,
            motherName: enquiry.motherName || "",
            fatherMobile: enquiry.mobileNumber,
            fatherEmail: enquiry.email || "",
            classApplied: enquiry.interestedClass,
            streamApplied: enquiry.interestedStream || "",
            dateOfBirth: enquiry.dateOfBirth ? enquiry.dateOfBirth.split("T")[0] : "",
            gender: enquiry.gender || "Male",
            city: enquiry.city || "",
          },
        },
      });
    } else {
      toast.error(result.payload || "Failed to convert enquiry.");
    }
  };

  const handleExport = () => {
    if (filteredEnquiries.length === 0) {
      toast.info("No data to export");
      return;
    }
    const rows = filteredEnquiries.map((enq) => ({
      "Student Name": enq.studentName,
      "Father Name": enq.fatherName,
      Mobile: enq.mobileNumber,
      Email: enq.email,
      Class: enq.interestedClass,
      Stream: enq.interestedStream,
      Source: enq.leadSource,
      Counselor: enq.counselorAssigned,
      Status: enq.status,
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
    link.download = `Enquiries_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        {/* Header */}
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Admissions
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              Enquiries
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Capture, track, and convert prospective student leads.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-300 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus:outline-none"
          >
            <Plus size={18} />
            Capture Enquiry
          </button>
        </header>

        {/* Follow up Date Alerts */}
        {todayFollowUps.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="text-amber-600 shrink-0" size={20} />
              <div>
                <h3 className="text-sm font-semibold text-amber-900">
                  Follow-Up Reminders ({todayFollowUps.length})
                </h3>
                <p className="mt-1 text-sm text-amber-700">
                  You have lead follow-ups scheduled for today. Contact these prospects to maintain high conversion.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {todayFollowUps.map((e) => (
                    <span
                      key={e._id}
                      onClick={() => openEditModal(e)}
                      className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-white border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-sm hover:bg-amber-100"
                    >
                      <Phone size={12} /> {e.studentName} ({e.mobileNumber})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lead Statistics */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <EnquiryCard
            label="Total Leads"
            value={metrics.total}
            colorClass="bg-blue-50 text-blue-600"
            icon={Users}
          />
          <EnquiryCard
            label="New leads"
            value={metrics.activeNew}
            colorClass="bg-emerald-50 text-emerald-600"
            icon={Plus}
          />
          <EnquiryCard
            label="Interested"
            value={metrics.interested}
            colorClass="bg-violet-50 text-violet-600"
            icon={UserCheck}
          />
          <EnquiryCard
            label="Follow Up"
            value={metrics.followUp}
            colorClass="bg-amber-50 text-amber-600"
            icon={Calendar}
          />
          <EnquiryCard
            label="Converted"
            value={metrics.converted}
            colorClass="bg-sky-50 text-sky-600"
            icon={CheckCircle}
          />
        </section>

        {/* Toolbar */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:max-w-xs">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, father name or mobile"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="Interested">Interested</option>
                <option value="Follow Up">Follow Up</option>
                <option value="Converted">Converted</option>
                <option value="Rejected">Rejected</option>
              </select>

              {/* Class Filter */}
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls.className}>
                    {cls.className}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>

          {/* Enquiries Table */}
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm font-medium text-slate-500">
              <Loader2 className="animate-spin" size={18} />
              Loading enquiries...
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-slate-950">No enquiries found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Start by capturing prospective student leads using the top button.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Lead Student Details
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Father Name
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Contact Info
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Interested In
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Follow-up Date
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredEnquiries.map((enq) => (
                    <tr key={enq._id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-bold text-slate-950">{enq.studentName}</p>
                          <span className="text-[11px] text-slate-400">Source: {enq.leadSource}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        {enq.fatherName}
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <Phone size={12} /> {enq.mobileNumber}
                          </p>
                          {enq.email && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail size={12} /> {enq.email}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{enq.interestedClass}</p>
                          {enq.interestedStream && (
                            <span className="inline-flex rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 mt-1">
                              {enq.interestedStream}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {enq.followUpDate ? new Date(enq.followUpDate).toLocaleDateString() : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            enq.status === "Converted"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : enq.status === "Follow Up"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : enq.status === "Interested"
                              ? "bg-violet-50 text-violet-700 border border-violet-100"
                              : enq.status === "Rejected"
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {enq.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(enq)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>

                          {enq.status !== "Converted" && (
                            <button
                              type="button"
                              onClick={() => handleConvertToAdmission(enq)}
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 cursor-pointer"
                            >
                              <UserPlus size={14} />
                              Convert
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Capture / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {editingEnquiry ? "Edit Enquiry" : "Capture New Enquiry"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEnquiry} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Student Name *</label>
                  <input
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter Student Full Name"
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </div>

                {/* Father Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Father Name *</label>
                  <input
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                    required
                    placeholder="Father's Full Name"
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </div>

                {/* Mother Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Mother Name</label>
                  <input
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleInputChange}
                    placeholder="Mother's Full Name"
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Mobile Number *</label>
                  <input
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="Primary Contact Mobile"
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </div>

                {/* Alternate Mobile */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Alternate Mobile</label>
                  <input
                    name="alternateMobile"
                    value={formData.alternateMobile}
                    onChange={handleInputChange}
                    placeholder="Secondary Contact Mobile"
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email Address"
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </div>

                {/* Class */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Interested Class *</label>
                  <select
                    name="interestedClass"
                    value={formData.interestedClass}
                    onChange={handleInputChange}
                    required
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                  >
                    <option value="">Select Interested Class</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls.className}>
                        {cls.className}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stream */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Interested Stream</label>
                  <select
                    name="interestedStream"
                    value={formData.interestedStream}
                    onChange={handleInputChange}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                  >
                    <option value="">Select Stream (if class 11/12)</option>
                    {streams.map((st) => (
                      <option key={st._id} value={st.streamName}>
                        {st.streamName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Current School */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Current School</label>
                  <input
                    name="currentSchool"
                    value={formData.currentSchool}
                    onChange={handleInputChange}
                    placeholder="Previous / Current School"
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">City</label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </div>

                {/* Lead Source */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Lead Source</label>
                  <select
                    name="leadSource"
                    value={formData.leadSource}
                    onChange={handleInputChange}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                  >
                    <option value="Website">Website</option>
                    <option value="Walk-In">Walk-In</option>
                    <option value="Phone">Phone</option>
                    <option value="Referral">Referral</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Advertisement">Advertisement</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Counselor Assigned */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Counselor Assigned</label>
                  <input
                    name="counselorAssigned"
                    value={formData.counselorAssigned}
                    onChange={handleInputChange}
                    placeholder="Counselor Name"
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </div>

                {/* Follow Up Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Follow Up Date</label>
                  <input
                    type="date"
                    name="followUpDate"
                    value={formData.followUpDate}
                    onChange={handleInputChange}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Interested">Interested</option>
                    <option value="Follow Up">Follow Up</option>
                    <option value="Converted">Converted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-600">Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Additional Lead Remarks"
                  className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
                >
                  {saving && <Loader2 className="animate-spin" size={14} />}
                  Save Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EnquiriesPage;
