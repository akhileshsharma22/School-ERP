import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  Info,
  Calendar,
  User,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../layouts/DashboardLayout";
import { fetchAdmissions } from "../../redux/slices/admissionSlice";
import { verifyApplication } from "../../redux/slices/documentVerificationSlice";

const DocumentVerificationPage = () => {
  const dispatch = useDispatch();


  const { admissions, loading } = useSelector((state) => state.admissions);
  const { verifying } = useSelector((state) => state.documentVerification);
  const { user } = useSelector((state) => state.auth);

  const [selectedApp, setSelectedApp] = useState(null);
  const [verifierName, setVerifierName] = useState("");
  const [generalRemarks, setGeneralRemarks] = useState("");
  
  // Track status of individual documents
  // Format: { [docId]: { status: 'Verified'|'Rejected', remarks: '' } }
  const [docStatuses, setDocStatuses] = useState({});

  useEffect(() => {
    // Fetch applications specifically pending verification
    dispatch(fetchAdmissions({ verificationStatus: "Pending" }));
  }, [dispatch]);

  // Set default verifier name from logged in user
  useEffect(() => {
    if (user?.fullName) {
      setVerifierName(user.fullName);
    } else {
      setVerifierName("Verification Officer");
    }
  }, [user]);

  // Initialize verification workspace when selecting an app
  const handleSelectApp = (app) => {
    setSelectedApp(app);
    setGeneralRemarks(app.verificationRemarks || "");
    
    // Map existing document statuses
    const initialStatuses = {};
    app.documents?.forEach((doc) => {
      initialStatuses[doc._id] = {
        status: doc.status || "Pending",
        remarks: doc.remarks || "",
      };
    });
    setDocStatuses(initialStatuses);
  };

  const handleDocStatusChange = (docId, status) => {
    setDocStatuses((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        status,
      },
    }));
  };

  const handleDocRemarksChange = (docId, remarks) => {
    setDocStatuses((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        remarks,
      },
    }));
  };

  const handleVerifySubmit = async (overallStatus) => {
    if (!verifierName) {
      toast.error("Verifier Name is required.");
      return;
    }

    // Build documents payload
    const updatedDocs = selectedApp.documents.map((doc) => {
      const state = docStatuses[doc._id] || { status: "Pending", remarks: "" };
      return {
        _id: doc._id,
        docType: doc.docType,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        status: state.status,
        remarks: state.remarks,
      };
    });

    // If marking as Verified, ensure required documents are verified
    if (overallStatus === "Verified") {
      const missingRequired = updatedDocs.some(
        (d) =>
          ["Student Photo", "Birth Certificate"].includes(d.docType) &&
          d.status !== "Verified"
      );

      if (missingRequired) {
        toast.error("Student Photo and Birth Certificate must both be verified to verify application.");
        return;
      }
    }

    const payload = {
      documents: updatedDocs,
      verificationStatus: overallStatus,
      verificationRemarks: generalRemarks,
      verifierName,
    };

    const result = await dispatch(verifyApplication({ id: selectedApp._id, data: payload }));

    if (verifyApplication.fulfilled.match(result)) {
      toast.success(`Application marked as ${overallStatus} successfully.`);
      setSelectedApp(null);
      dispatch(fetchAdmissions({ verificationStatus: "Pending" }));
    } else {
      toast.error(result.payload || "Failed to submit verification.");
    }
  };

  const pendingApps = admissions.filter((a) => a.verificationStatus === "Pending");

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Admissions
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">
            Document Verification
          </h1>
          <p className="text-sm text-slate-500">
            Review uploaded student files, mark individual attachments, and verify applications.
          </p>
        </header>

        {/* Dynamic Verification Workspace split view */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Applications list */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare size={16} />
              Pending Queue ({pendingApps.length})
            </h3>
            
            {loading ? (
              <div className="flex items-center justify-center p-8 text-sm font-medium text-slate-400 bg-white rounded-2xl border">
                <Loader2 className="animate-spin mr-2" size={16} />
                Loading list...
              </div>
            ) : pendingApps.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                <CheckCircle className="text-emerald-500 mx-auto" size={32} />
                <h4 className="mt-3 text-sm font-bold text-slate-900">Queue is Empty</h4>
                <p className="text-xs text-slate-500 mt-1">All applications verified!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {pendingApps.map((app) => (
                  <div
                    key={app._id}
                    onClick={() => handleSelectApp(app)}
                    className={`p-4 rounded-xl border transition cursor-pointer text-left ${
                      selectedApp?._id === app._id
                        ? "border-blue-600 bg-blue-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {app.firstName} {app.lastName}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Class Applied: {app.classApplied}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 border border-amber-100">
                        {app.documents?.length || 0} Files
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verification Workspace detail panel */}
          <div className="lg:col-span-2">
            {selectedApp ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 space-y-6">
                
                {/* Application summary header */}
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">
                      Verifying: {selectedApp.firstName} {selectedApp.lastName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <Calendar size={12} /> DOB: {new Date(selectedApp.dateOfBirth).toLocaleDateString()} | Class: {selectedApp.classApplied} ({selectedApp.sectionApplied})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    Close Workspace
                  </button>
                </div>

                {/* Documents checklist */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900">Attachment Checklist</h4>
                  
                  <div className="space-y-3">
                    {selectedApp.documents?.map((doc) => {
                      const docState = docStatuses[doc._id] || { status: "Pending", remarks: "" };
                      const isRequired = ["Student Photo", "Birth Certificate"].includes(doc.docType);

                      return (
                        <div
                          key={doc._id}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText size={16} className="text-slate-400" />
                              <span className="text-sm font-bold text-slate-800">{doc.docType}</span>
                              {isRequired && (
                                <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 rounded px-1">
                                  Required
                                </span>
                              )}
                            </div>

                            {/* Actions and Preview */}
                            <div className="flex items-center gap-2">
                              <a
                                href={`http://localhost:5000${doc.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white shadow-sm text-slate-600 hover:text-blue-600 mr-2"
                                title="View Document"
                              >
                                <Eye size={14} />
                              </a>

                              <button
                                type="button"
                                onClick={() => handleDocStatusChange(doc._id, "Verified")}
                                className={`inline-flex h-8 items-center justify-center gap-1 rounded-lg px-2.5 text-xs font-bold transition cursor-pointer ${
                                  docState.status === "Verified"
                                    ? "bg-emerald-600 text-white shadow-sm"
                                    : "bg-white border text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                <CheckCircle size={12} />
                                Verify
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDocStatusChange(doc._id, "Rejected")}
                                className={`inline-flex h-8 items-center justify-center gap-1 rounded-lg px-2.5 text-xs font-bold transition cursor-pointer ${
                                  docState.status === "Rejected"
                                    ? "bg-rose-600 text-white shadow-sm"
                                    : "bg-white border text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                <XCircle size={12} />
                                Reject
                              </button>
                            </div>
                          </div>

                          {/* Individual doc remarks */}
                          <div>
                            <input
                              value={docState.remarks}
                              onChange={(e) => handleDocRemarksChange(doc._id, e.target.value)}
                              placeholder="Add comments / reasons for rejection if applicable"
                              className="h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs focus:border-slate-300 focus:outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}

                    {(!selectedApp.documents || selectedApp.documents.length === 0) && (
                      <div className="text-center p-6 border border-dashed rounded-xl bg-slate-50 text-slate-400">
                        <AlertCircle className="mx-auto text-slate-400" size={24} />
                        <p className="text-xs mt-1">No files were uploaded for this application.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* General Verification Configs */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1">
                    <User size={16} className="text-slate-400" /> Verifier Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">Verifier Name *</label>
                      <input
                        value={verifierName}
                        onChange={(e) => setVerifierName(e.target.value)}
                        required
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">General Remarks</label>
                      <input
                        value={generalRemarks}
                        onChange={(e) => setGeneralRemarks(e.target.value)}
                        placeholder="Overall verification review comments"
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Final Submission */}
                <div className="flex justify-end gap-3 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => handleVerifySubmit("Rejected")}
                    disabled={verifying}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60 cursor-pointer"
                  >
                    Reject Application
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVerifySubmit("Verified")}
                    disabled={verifying}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm shadow-emerald-250 hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
                  >
                    {verifying && <Loader2 className="animate-spin mr-1" size={16} />}
                    Complete Verification (Verify)
                  </button>
                </div>

              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-12 shadow-sm text-center">
                <Info className="text-slate-400 mx-auto" size={36} />
                <h3 className="mt-3 text-base font-bold text-slate-900">Workspace Inactive</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Select an admission application from the queue to start reviewing files.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default DocumentVerificationPage;
