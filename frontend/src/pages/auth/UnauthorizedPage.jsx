import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, LayoutDashboard } from "lucide-react";

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 text-white">
      {/* Background decoration blur grids */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-650/15 blur-[120px] pointer-events-none" />

      {/* Card container */}
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-md">
        {/* Warning Icon with pulse ring */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500 shadow-inner">
          <ShieldAlert size={42} />
        </div>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          403 Access Denied
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-slate-400 font-medium">
          You do not have permissions to view this module. If you believe this is an error, please contact your administrator.
        </p>

        {/* Dynamic Recovery Buttons */}
        <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-xs font-bold text-slate-200 transition hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <ArrowLeft size={14} />
            Go Back
          </button>
          
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
          >
            <LayoutDashboard size={14} />
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
