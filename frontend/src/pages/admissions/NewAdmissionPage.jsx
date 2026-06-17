import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Loader2,
  Save,
  Upload,
  FileText,
  CheckCircle,
  Eye,
  ArrowRight,
  ArrowLeft,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { fetchSetupDependencies, createAdmission } from "../../redux/slices/admissionSlice";
import { fetchAllClasses } from "../../redux/slices/classSectionSlice";
import { fetchStreams } from "../../redux/slices/streamSlice";
import { fetchAllCategories } from "../../redux/slices/categorySlice";
import * as admissionService from "../../services/admissionService";

const TABS = [
  { id: "student", label: "Student Details" },
  { id: "academic", label: "Academic Details" },
  { id: "parents", label: "Parent & Guardian" },
  { id: "address", label: "Address & Medical" },
  { id: "facility", label: "Transport & Hostel" },
  { id: "documents", label: "Document Uploads" },
];

const NewAdmissionPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { setupStatus, saving } = useSelector((state) => state.admissions);
  const { classes } = useSelector((state) => state.classSections);
  const { streams } = useSelector((state) => state.streams);
  const { categories } = useSelector((state) => state.categories);

  const [activeTab, setActiveTab] = useState("student");
  const [uploadProgress, setUploadProgress] = useState({});
  const [sameAddress, setSameAddress] = useState(false);

  // Initial Form Data
  const [formData, setFormData] = useState({
    // Student Details
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    religion: "",
    nationality: "Indian",
    aadhaarNumber: "",
    category: "",
    caste: "",
    motherTongue: "",

    // Academic Details
    classApplied: "",
    sectionApplied: "",
    streamApplied: "",
    previousSchool: "",
    previousBoard: "",
    previousPercentage: "",
    previousRollNumber: "",

    // Father Details
    fatherName: "",
    fatherOccupation: "",
    fatherQualification: "",
    fatherMobile: "",
    fatherEmail: "",
    fatherAnnualIncome: "",
    fatherAadhaarNumber: "",

    // Mother Details
    motherName: "",
    motherOccupation: "",
    motherQualification: "",
    motherMobile: "",
    motherEmail: "",
    motherAnnualIncome: "",
    motherAadhaarNumber: "",

    // Guardian Details
    guardianName: "",
    guardianRelationship: "",
    guardianMobile: "",
    guardianAddress: "",

    // Address Details
    currentAddress: "",
    city: "",
    state: "",
    country: "India",
    pinCode: "",
    permanentAddress: "",

    // Medical Details
    medicalCondition: "",
    allergies: "",
    disability: "",
    emergencyContact: "",
    doctorName: "",
    doctorContact: "",

    // Transport Details
    needTransport: "No",
    pickupPoint: "",
    route: "",
    stop: "",

    // Hostel Details
    needHostel: "No",
    hostelName: "",
    roomNumber: "",

    // Uploaded Documents
    documents: [],
  });

  // Verify setup checks and load dropdown dependencies
  useEffect(() => {
    dispatch(fetchSetupDependencies());
    dispatch(fetchAllClasses());
    dispatch(fetchStreams());
    dispatch(fetchAllCategories());
  }, [dispatch]);

  // Enquiry Prefill Handler
  useEffect(() => {
    if (location.state?.prefill) {
      const { prefill } = location.state;
      setFormData((prev) => ({
        ...prev,
        firstName: prefill.firstName || "",
        lastName: prefill.lastName || "",
        fatherName: prefill.fatherName || "",
        motherName: prefill.motherName || "",
        fatherMobile: prefill.fatherMobile || "",
        fatherEmail: prefill.fatherEmail || "",
        classApplied: prefill.classApplied || "",
        streamApplied: prefill.streamApplied || "",
        dateOfBirth: prefill.dateOfBirth || "",
        gender: prefill.gender || "",
        city: prefill.city || "",
      }));
      toast.success("Enquiry lead converted! Details prefilled.");
    }
  }, [location]);

  // Synchronize permanent address if checkbox checked
  useEffect(() => {
    if (sameAddress) {
      setFormData((prev) => ({
        ...prev,
        permanentAddress: `${prev.currentAddress}, ${prev.city}, ${prev.state}, ${prev.country} - ${prev.pinCode}`,
      }));
    }
  }, [sameAddress, formData.currentAddress, formData.city, formData.state, formData.country, formData.pinCode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectClass = (e) => {
    const className = e.target.value;
    setFormData((prev) => ({
      ...prev,
      classApplied: className,
      sectionApplied: "",
      streamApplied: "", // reset stream
    }));
  };

  // Sections filter based on selected class
  const availableSections = useSelector((state) => {
    const selectedClass = state.classSections.classes.find(
      (c) => c.className === formData.classApplied
    );
    return selectedClass ? selectedClass.sections : [];
  });

  // Document upload trigger
  const handleRemoveFile = (docType) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.docType !== docType),
    }));
    setUploadProgress((prev) => ({
      ...prev,
      [docType]: 0,
    }));
    toast.success("File removed successfully");
  };

  const handleFileUpload = async (docType, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation checks by extension
    const allowedExtensions = ["pdf", "png", "jpg", "jpeg"];
    const fileExt = file.name.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      toast.error("Invalid file type");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds limit");
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      setUploadProgress((prev) => ({ ...prev, [docType]: 10 }));
      const response = await admissionService.uploadDocument(uploadData, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress((prev) => ({ ...prev, [docType]: percent }));
      });

      if (response.success) {
        toast.success("File uploaded successfully");
        // Append or replace document record
        const docRecord = {
          docType,
          fileName: response.fileName,
          fileUrl: response.fileUrl,
          status: "Pending",
        };

        setFormData((prev) => {
          const updatedDocs = prev.documents.filter((d) => d.docType !== docType);
          return {
            ...prev,
            documents: [...updatedDocs, docRecord],
          };
        });
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || "Upload failed";
      toast.error(errorMessage);
      setUploadProgress((prev) => ({ ...prev, [docType]: 0 }));
    }
  };

  const validateForm = () => {
    const errors = [];

    // Fields required
    if (!formData.firstName) errors.push("Student First Name is required");
    if (!formData.lastName) errors.push("Student Last Name is required");
    if (!formData.dateOfBirth) errors.push("Student Date of Birth is required");
    if (!formData.gender) errors.push("Student Gender is required");
    if (!formData.category) errors.push("Student Category is required");
    if (!formData.classApplied) errors.push("Applying Class is required");
    if (!formData.sectionApplied) errors.push("Applying Section is required");

    // Class 11/12 Stream check
    if (["Class 11", "Class 12"].includes(formData.classApplied) && !formData.streamApplied) {
      errors.push("Stream is required for Class 11 & Class 12");
    }

    // Contact checks
    if (!formData.fatherName) errors.push("Father Name is required");
    if (!formData.fatherMobile) {
      errors.push("Father Mobile is required");
    } else if (!/^\d{10}$/.test(formData.fatherMobile)) {
      errors.push("Father Mobile must be a valid 10-digit number");
    }

    if (formData.fatherEmail && !/\S+@\S+\.\S+/.test(formData.fatherEmail)) {
      errors.push("Father Email is invalid");
    }

    if (!formData.motherName) errors.push("Mother Name is required");
    if (formData.motherMobile && !/^\d{10}$/.test(formData.motherMobile)) {
      errors.push("Mother Mobile must be a valid 10-digit number");
    }

    // Aadhaar checks (12 digits)
    if (formData.aadhaarNumber && !/^\d{12}$/.test(formData.aadhaarNumber)) {
      errors.push("Student Aadhaar must be a valid 12-digit number");
    }

    // Address
    if (!formData.currentAddress) errors.push("Current Address is required");
    if (!formData.city) errors.push("City is required");
    if (!formData.state) errors.push("State is required");
    if (!formData.pinCode) {
      errors.push("PIN Code is required");
    } else if (!/^\d{6}$/.test(formData.pinCode)) {
      errors.push("PIN Code must be a valid 6-digit number");
    }

    // Required documents check
    const hasPhoto = formData.documents.some((d) => d.docType === "Student Photo");
    const hasBirthCert = formData.documents.some((d) => d.docType === "Birth Certificate");

    if (!hasPhoto) errors.push("Student Photo upload is required");
    if (!hasBirthCert) errors.push("Birth Certificate upload is required");

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach((err) => toast.error(err));
      return;
    }

    const result = await dispatch(createAdmission(formData));
    if (createAdmission.fulfilled.match(result)) {
      toast.success("Admission submitted successfully");
      navigate("/admissions/list");
    } else {
      toast.error(result.payload || "Submission failed.");
    }
  };

  const getDocStatus = (docType) => {
    const doc = formData.documents.find((d) => d.docType === docType);
    return doc ? doc : null;
  };

  // Determine if master setup completed
  const isSetupIncomplete =
    setupStatus.loading === false &&
    (!setupStatus.hasAcademicYear || !setupStatus.hasClassSection || !setupStatus.hasCategory);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Admissions
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">
            New Admission
          </h1>
          <p className="text-sm text-slate-500">
            Submit a new student admission application with documents.
          </p>
        </header>

        {/* Master Setup Warning Card */}
        {isSetupIncomplete && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex gap-4">
              <AlertTriangle className="text-red-600 shrink-0" size={24} />
              <div>
                <h3 className="text-base font-bold text-red-900">
                  Complete Master Setup before creating admissions.
                </h3>
                <p className="mt-2 text-sm text-red-700 leading-6">
                  Admissions require core school configurations. Please ensure the following are configured under Master Setup:
                </p>
                <ul className="mt-2 list-disc list-inside text-sm text-red-700 space-y-1 font-semibold">
                  {!setupStatus.hasAcademicYear && <li>Academic Year</li>}
                  {!setupStatus.hasClassSection && <li>Classes & Sections</li>}
                  {!setupStatus.hasCategory && <li>Categories</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Form Wizard Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-semibold border-b-2 px-3 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
            {/* 1. STUDENT DETAILS */}
            {activeTab === "student" && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                  <Info size={16} /> Basic Student Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600">First Name *</label>
                    <input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      placeholder="Student First Name"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Middle Name</label>
                    <input
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                      placeholder="Middle Name"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Last Name *</label>
                    <input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      placeholder="Student Last Name"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Date of Birth *</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Blood Group</label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleInputChange}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Religion</label>
                    <input
                      name="religion"
                      value={formData.religion}
                      onChange={handleInputChange}
                      placeholder="e.g. Hinduism, Islam, Christianity"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Nationality</label>
                    <input
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      placeholder="Indian"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Aadhaar Number</label>
                    <input
                      name="aadhaarNumber"
                      value={formData.aadhaarNumber}
                      onChange={handleInputChange}
                      placeholder="12-digit Aadhaar"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Caste</label>
                    <input
                      name="caste"
                      value={formData.caste}
                      onChange={handleInputChange}
                      placeholder="Caste"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Mother Tongue</label>
                    <input
                      name="motherTongue"
                      value={formData.motherTongue}
                      onChange={handleInputChange}
                      placeholder="Mother Tongue"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 mt-4">
                  <div className="flex gap-3">
                    <Info className="text-slate-500 shrink-0" size={18} />
                    <p className="text-xs text-slate-500 leading-5">
                      <strong>Automatic Credentials:</strong> When this application is verified and approved, Springfield ERP will automatically generate a unique <strong>Admission Number</strong>, <strong>Student ID</strong>, and secure portal logins for both Student and Parents.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ACADEMIC DETAILS */}
            {activeTab === "academic" && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b pb-2">Class & Academic Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Applying Class *</label>
                    <select
                      name="classApplied"
                      value={formData.classApplied}
                      onChange={handleSelectClass}
                      required
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls.className}>
                          {cls.className}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Applying Section *</label>
                    <select
                      name="sectionApplied"
                      value={formData.sectionApplied}
                      onChange={handleInputChange}
                      required
                      disabled={!formData.classApplied}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none disabled:bg-slate-50"
                    >
                      <option value="">Select Section</option>
                      {availableSections.map((sec) => (
                        <option key={sec._id} value={sec.sectionName}>
                          {sec.sectionName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Streams (Only for Class 11 & Class 12) */}
                  {["Class 11", "Class 12"].includes(formData.classApplied) && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Select Stream *</label>
                      <select
                        name="streamApplied"
                        value={formData.streamApplied}
                        onChange={handleInputChange}
                        required
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      >
                        <option value="">Select Stream</option>
                        {streams.map((st) => (
                          <option key={st._id} value={st.streamName}>
                            {st.streamName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Previous School Name</label>
                    <input
                      name="previousSchool"
                      value={formData.previousSchool}
                      onChange={handleInputChange}
                      placeholder="School Name"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Previous Board</label>
                    <input
                      name="previousBoard"
                      value={formData.previousBoard}
                      onChange={handleInputChange}
                      placeholder="CBSE, ICSE, State Board"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Previous Percentage (%)</label>
                    <input
                      type="number"
                      name="previousPercentage"
                      value={formData.previousPercentage}
                      onChange={handleInputChange}
                      placeholder="e.g. 88.5"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Previous Roll Number</label>
                    <input
                      name="previousRollNumber"
                      value={formData.previousRollNumber}
                      onChange={handleInputChange}
                      placeholder="Roll Number"
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. PARENT & GUARDIAN */}
            {activeTab === "parents" && (
              <div className="space-y-6">
                {/* Father Info */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-2">Father Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Father Name *</label>
                      <input
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleInputChange}
                        required
                        placeholder="Father Full Name"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Father Mobile *</label>
                      <input
                        name="fatherMobile"
                        value={formData.fatherMobile}
                        onChange={handleInputChange}
                        required
                        placeholder="10-digit Mobile"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Father Email</label>
                      <input
                        type="email"
                        name="fatherEmail"
                        value={formData.fatherEmail}
                        onChange={handleInputChange}
                        placeholder="Father Email Address"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Occupation</label>
                      <input
                        name="fatherOccupation"
                        value={formData.fatherOccupation}
                        onChange={handleInputChange}
                        placeholder="Occupation"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Qualification</label>
                      <input
                        name="fatherQualification"
                        value={formData.fatherQualification}
                        onChange={handleInputChange}
                        placeholder="Qualification"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Annual Income</label>
                      <input
                        type="number"
                        name="fatherAnnualIncome"
                        value={formData.fatherAnnualIncome}
                        onChange={handleInputChange}
                        placeholder="Annual Income"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Aadhaar Number</label>
                      <input
                        name="fatherAadhaarNumber"
                        value={formData.fatherAadhaarNumber}
                        onChange={handleInputChange}
                        placeholder="12-digit Aadhaar"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Mother Info */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-2">Mother Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Mother Name *</label>
                      <input
                        name="motherName"
                        value={formData.motherName}
                        onChange={handleInputChange}
                        required
                        placeholder="Mother Full Name"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Mother Mobile</label>
                      <input
                        name="motherMobile"
                        value={formData.motherMobile}
                        onChange={handleInputChange}
                        placeholder="10-digit Mobile"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Mother Email</label>
                      <input
                        type="email"
                        name="motherEmail"
                        value={formData.motherEmail}
                        onChange={handleInputChange}
                        placeholder="Mother Email Address"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Occupation</label>
                      <input
                        name="motherOccupation"
                        value={formData.motherOccupation}
                        onChange={handleInputChange}
                        placeholder="Occupation"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Qualification</label>
                      <input
                        name="motherQualification"
                        value={formData.motherQualification}
                        onChange={handleInputChange}
                        placeholder="Qualification"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Annual Income</label>
                      <input
                        type="number"
                        name="motherAnnualIncome"
                        value={formData.motherAnnualIncome}
                        onChange={handleInputChange}
                        placeholder="Annual Income"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Aadhaar Number</label>
                      <input
                        name="motherAadhaarNumber"
                        value={formData.motherAadhaarNumber}
                        onChange={handleInputChange}
                        placeholder="12-digit Aadhaar"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Guardian Details */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-2">Guardian Details (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Guardian Name</label>
                      <input
                        name="guardianName"
                        value={formData.guardianName}
                        onChange={handleInputChange}
                        placeholder="Guardian Full Name"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Relationship</label>
                      <input
                        name="guardianRelationship"
                        value={formData.guardianRelationship}
                        onChange={handleInputChange}
                        placeholder="e.g. Uncle, Grandfather"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Guardian Mobile</label>
                      <input
                        name="guardianMobile"
                        value={formData.guardianMobile}
                        onChange={handleInputChange}
                        placeholder="Mobile"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Guardian Address</label>
                    <textarea
                      name="guardianAddress"
                      value={formData.guardianAddress}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="Guardian Permanent Address"
                      className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. ADDRESS & MEDICAL */}
            {activeTab === "address" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-2">Current Contact Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-slate-600">Current Address Line *</label>
                      <input
                        name="currentAddress"
                        value={formData.currentAddress}
                        onChange={handleInputChange}
                        required
                        placeholder="Flat, House no., Building, Street Address"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">City *</label>
                      <input
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        placeholder="City"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">State *</label>
                      <input
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        placeholder="State"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">PIN Code *</label>
                      <input
                        name="pinCode"
                        value={formData.pinCode}
                        onChange={handleInputChange}
                        required
                        placeholder="6-digit PIN"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-base font-bold text-slate-900">Permanent Address</h3>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sameAddress}
                        onChange={(e) => setSameAddress(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Same as Current Address
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Permanent Address Details</label>
                    <textarea
                      name="permanentAddress"
                      value={formData.permanentAddress}
                      onChange={handleInputChange}
                      rows={2}
                      disabled={sameAddress}
                      placeholder="Permanent Address details"
                      className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-slate-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>

                {/* Medical Details */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-2">Medical History & Emergency Contacts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Medical Condition (if any)</label>
                      <input
                        name="medicalCondition"
                        value={formData.medicalCondition}
                        onChange={handleInputChange}
                        placeholder="Describe condition"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Allergies</label>
                      <input
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleInputChange}
                        placeholder="Allergies description"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Disability Details (if any)</label>
                      <input
                        name="disability"
                        value={formData.disability}
                        onChange={handleInputChange}
                        placeholder="Disability details"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Emergency Contact Number</label>
                      <input
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleInputChange}
                        placeholder="Emergency Contact"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Family Doctor Name</label>
                      <input
                        name="doctorName"
                        value={formData.doctorName}
                        onChange={handleInputChange}
                        placeholder="Doctor's Name"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Doctor Mobile</label>
                      <input
                        name="doctorContact"
                        value={formData.doctorContact}
                        onChange={handleInputChange}
                        placeholder="Doctor Mobile"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. TRANSPORT & HOSTEL */}
            {activeTab === "facility" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-2">Transport Service Opt-In</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Need School Transport Service?</label>
                      <select
                        name="needTransport"
                        value={formData.needTransport}
                        onChange={handleInputChange}
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      >
                        <option value="No">No, self arrangement</option>
                        <option value="Yes">Yes, require pickup</option>
                      </select>
                    </div>

                    {formData.needTransport === "Yes" && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600">Preferred Pickup Point</label>
                          <input
                            name="pickupPoint"
                            value={formData.pickupPoint}
                            onChange={handleInputChange}
                            placeholder="Pickup Landmark"
                            className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600">Transport Route</label>
                          <input
                            name="route"
                            value={formData.route}
                            onChange={handleInputChange}
                            placeholder="Preferred Route Code / Area"
                            className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600">Bus Stop Location</label>
                          <input
                            name="stop"
                            value={formData.stop}
                            onChange={handleInputChange}
                            placeholder="Stop name"
                            className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-2">Hostel Accommodation Opt-In</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Need Hostel Accommodation?</label>
                      <select
                        name="needHostel"
                        value={formData.needHostel}
                        onChange={handleInputChange}
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      >
                        <option value="No">No, day scholar</option>
                        <option value="Yes">Yes, boarding student</option>
                      </select>
                    </div>

                    {formData.needHostel === "Yes" && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600">Hostel Wing / Block Name</label>
                          <input
                            name="hostelName"
                            value={formData.hostelName}
                            onChange={handleInputChange}
                            placeholder="Block name"
                            className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600">Preferred Room Number</label>
                          <input
                            name="roomNumber"
                            value={formData.roomNumber}
                            onChange={handleInputChange}
                            placeholder="Room Number"
                            className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 6. DOCUMENT UPLOADS */}
            {activeTab === "documents" && (
              <div className="space-y-6">
                <h3 className="text-base font-bold text-slate-900 border-b pb-2">Mandatory & Optional Documents (PDF/PNG/JPG max 10MB)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { type: "Student Photo", required: true },
                    { type: "Birth Certificate", required: true },
                    { type: "Aadhaar Card", required: false },
                    { type: "Transfer Certificate", required: false },
                    { type: "Previous Report Card", required: false },
                    { type: "Medical Documents", required: false },
                    { type: "Other Documents", required: false },
                  ].map((docItem) => {
                    const status = getDocStatus(docItem.type);
                    const progress = uploadProgress[docItem.type] || 0;

                    return (
                      <div
                        key={docItem.type}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex items-center justify-between"
                      >
                        <div className="flex-1 mr-4">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-800">{docItem.type}</span>
                            {docItem.required && (
                              <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 rounded px-1">
                                Required
                              </span>
                            )}
                          </div>

                          {/* Progress indicator */}
                          {progress > 0 && progress < 100 && (
                            <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}

                          {status ? (
                            <div className="mt-2 space-y-2">
                              {/* Visual Preview */}
                              {/\.(jpg|jpeg|png)$/i.test(status.fileName || status.fileUrl) && (
                                <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                                  <img
                                    src={`http://localhost:5000${status.fileUrl}`}
                                    alt={docItem.type}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <CheckCircle className="text-emerald-500" size={14} />
                                <span className="text-xs text-slate-500 font-semibold truncate max-w-[200px]" title={status.fileName}>
                                  {status.fileName}
                                </span>
                                <a
                                  href={`http://localhost:5000${status.fileUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white border shadow-sm text-slate-600 hover:text-blue-600"
                                  title="View File"
                                >
                                  <Eye size={12} />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(docItem.type)}
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-red-50 border border-red-100 shadow-sm text-rose-600 hover:bg-rose-100"
                                  title="Remove document"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-1 text-xs text-slate-400">No file uploaded</p>
                          )}
                        </div>

                        {/* File Upload Input Wrapper */}
                        <label className="h-10 cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50">
                          <Upload size={14} />
                          Upload
                          <input
                            type="file"
                            onChange={(e) => handleFileUpload(docItem.type, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between">
            {/* Navigations buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={activeTab === TABS[0].id}
                onClick={() => {
                  const idx = TABS.findIndex((t) => t.id === activeTab);
                  setActiveTab(TABS[idx - 1].id);
                }}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <button
                type="button"
                disabled={activeTab === TABS[TABS.length - 1].id}
                onClick={() => {
                  const idx = TABS.findIndex((t) => t.id === activeTab);
                  setActiveTab(TABS[idx + 1].id);
                }}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
              >
                Next
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate("/admissions/list")}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || isSetupIncomplete}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm shadow-blue-300 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}
                Submit Application
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default NewAdmissionPage;
