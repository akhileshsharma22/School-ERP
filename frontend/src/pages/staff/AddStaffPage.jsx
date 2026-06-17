import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Loader2,
  Save,
  Upload,
  ArrowLeft,
  Briefcase,
  User,
  Mail,
  MapPin,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { fetchSetupCheck, addStaff } from "../../redux/slices/staffSlice";
import { fetchAllDepartments } from "../../redux/slices/departmentSlice";
import { fetchAllDesignations } from "../../redux/slices/designationSlice";

const AddStaffPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { setupCheck, saving, loading } = useSelector((state) => state.staff);
  const { departments } = useSelector((state) => state.departments);
  const { designations } = useSelector((state) => state.designations);

  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    bloodGroup: "O+",
    nationality: "Indian",
    maritalStatus: "Single",
    mobile: "",
    alternateMobile: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    staffType: "Teaching Staff",
    department: "",
    designation: "",
    qualification: "",
    experience: "",
    dateOfJoining: new Date().toISOString().split("T")[0],
    employmentType: "Permanent",
    salary: "",
    reportingManager: "",
  });

  useEffect(() => {
    dispatch(fetchSetupCheck());
    dispatch(fetchAllDepartments());
    dispatch(fetchAllDesignations());
  }, [dispatch]);

  // Show setup check alert if any dependencies are missing
  const setupIsMissing = !setupCheck.hasAcademicYear || !setupCheck.hasDepartment || !setupCheck.hasDesignation;

  useEffect(() => {
    if (!loading && setupIsMissing) {
      toast.warning("Please complete master setup before adding staff");
    }
  }, [loading, setupCheck]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Only JPG, JPEG, or PNG format images are allowed for photos.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo size must be less than 5MB.");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (setupIsMissing) {
      toast.error("Cannot add staff: complete master setup dependencies first.");
      return;
    }

    // Required fields check
    const required = [
      "firstName", "lastName", "gender", "dateOfBirth", "mobile", "email",
      "address", "city", "state", "pincode", "staffType", "department",
      "designation", "dateOfJoining", "employmentType", "salary"
    ];

    const missing = required.filter((field) => !formData[field]);
    if (missing.length > 0) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Build form data
    const submission = new FormData();
    Object.keys(formData).forEach((key) => {
      submission.append(key, formData[key]);
    });
    if (photoFile) {
      submission.append("photo", photoFile);
    }

    const result = await dispatch(addStaff(submission));
    if (addStaff.fulfilled.match(result)) {
      toast.success("Employee profile registered successfully!");
      navigate("/staff");
    } else {
      toast.error(result.payload || "Failed to create staff member.");
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 pb-16">
        
        {/* Breadcrumb / Header */}
        <header className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/staff")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Human Resources
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Add New Employee
            </h1>
          </div>
        </header>

        {/* Setup Check Warning Banner */}
        {setupIsMissing && !loading && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm flex items-start gap-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Master Setup Checklist Required</h3>
              <p className="mt-1.5 text-xs leading-normal text-slate-600">
                You must complete your ERP Master Setup configuration items before creating staff directories. Currently missing:
              </p>
              <ul className="mt-2 text-xs font-semibold text-slate-700 list-disc list-inside space-y-1">
                {!setupCheck.hasAcademicYear && <li>Academic Year</li>}
                {!setupCheck.hasDepartment && <li>Department Master List</li>}
                {!setupCheck.hasDesignation && <li>Designation Master List</li>}
              </ul>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Card 1: Personal Dossier */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <User size={16} />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Personal Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Photo Upload Box */}
              <div className="flex flex-col items-center justify-center md:border-r border-slate-100 pr-2">
                <div className="relative h-28 w-28 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center group">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 text-[10px]">
                      <Upload size={20} className="mb-1.5" />
                      <span>Upload Photo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <p className="mt-2 text-[10px] text-slate-400 text-center leading-normal">
                  JPG, PNG up to 5MB
                </p>
              </div>

              {/* Personal Fields Grid */}
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    placeholder="Enter middle name"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Nationality</label>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Marital Status</label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleInputChange}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Contact Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Mail size={16} />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Contact Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder="Enter 10-digit mobile"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Alternate Mobile</label>
                <input
                  type="tel"
                  name="alternateMobile"
                  value={formData.alternateMobile}
                  onChange={handleInputChange}
                  placeholder="Alternate number"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="employee@school.com"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Residential Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Street name, house/flat number, landmark"
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">State *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  placeholder="6-digit pincode"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Professional Employment Dossier */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Briefcase size={16} />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Employment Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Staff Type *</label>
                <select
                  name="staffType"
                  value={formData.staffType}
                  onChange={handleInputChange}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                >
                  <option value="Teaching Staff">Teaching Staff</option>
                  <option value="Non Teaching Staff">Non Teaching Staff</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  disabled={departments.length === 0}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white disabled:opacity-50"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Designation *</label>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  disabled={designations.length === 0}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white disabled:opacity-50"
                >
                  <option value="">Select Designation</option>
                  {designations.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.designationName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Highest Qualification</label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                  placeholder="e.g. M.Sc, B.Ed, PhD"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Work Experience</label>
                <input
                  type="text"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder="e.g. 5 Years"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Date of Joining *</label>
                <input
                  type="date"
                  name="dateOfJoining"
                  value={formData.dateOfJoining}
                  onChange={handleInputChange}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Employment Type *</label>
                <select
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleInputChange}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                >
                  <option value="Permanent">Permanent</option>
                  <option value="Contract">Contract</option>
                  <option value="Probation">Probation</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Temporary">Temporary</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Basic Monthly Salary (₹) *</label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  placeholder="Salary in INR"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Reporting Manager</label>
                <input
                  type="text"
                  name="reportingManager"
                  value={formData.reportingManager}
                  onChange={handleInputChange}
                  placeholder="Manager's Name"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium text-slate-800 outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <footer className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => navigate("/staff")}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || setupIsMissing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-300 transition hover:bg-blue-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Saving Profile...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Employee File
                </>
              )}
            </button>
          </footer>

        </form>

      </div>
    </DashboardLayout>
  );
};

export default AddStaffPage;
