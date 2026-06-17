import { ShieldCheck } from "lucide-react";

const StaffIdCard = ({ staff }) => {
  const staffName = `${staff.firstName} ${staff.lastName}`;
  const departmentName = staff.department?.departmentName || "General";
  const designationName = staff.designation?.designationName || "Employee";

  return (
    <div className="w-[320px] h-[480px] rounded-3xl bg-slate-950 text-white p-6 shadow-2xl relative border-4 border-slate-900/50 flex flex-col justify-between overflow-hidden select-none font-sans scale-95 origin-center">
      
      {/* Background Graphic Swirls */}
      <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-indigo-600/10 blur-3xl" />

      {/* Card Top / Header */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 relative z-10">
        <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
          <ShieldCheck size={18} />
        </div>
        <div className="text-left">
          <h2 className="text-xs font-bold uppercase tracking-wider">Springfield Academy</h2>
          <p className="text-[10px] text-slate-400">Staff Identity Card</p>
        </div>
      </div>

      {/* Card Middle / Photo & Name */}
      <div className="flex flex-col items-center py-4 relative z-10">
        <div className="h-28 w-28 rounded-2xl bg-white border-2 border-blue-500 overflow-hidden shadow-xl flex items-center justify-center">
          {staff.photoUrl ? (
            <img
              src={staff.photoUrl.startsWith("http") ? staff.photoUrl : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${staff.photoUrl}`}
              alt={staffName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-4xl font-bold text-slate-400 uppercase">
              {staff.firstName[0]}
              {staff.lastName[0]}
            </span>
          )}
        </div>

        <h3 className="mt-4 text-lg font-bold tracking-wide text-white">
          {staffName}
        </h3>
        <span className="inline-flex rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-0.5 text-xs font-bold text-indigo-400 mt-1.5">
          {designationName}
        </span>
      </div>

      {/* Card Info Details */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-left text-[11px] border-t border-b border-white/10 py-4 relative z-10">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Employee ID</span>
          <p className="font-bold text-white font-mono">{staff.employeeId}</p>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Department</span>
          <p className="font-bold text-white truncate">{departmentName}</p>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Blood Group</span>
          <p className="font-bold text-white">{staff.bloodGroup || "O+"}</p>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Staff Type</span>
          <p className="font-bold text-white">{staff.staffType}</p>
        </div>
      </div>

      {/* Card Footer / QR Code / Emergency */}
      <div className="flex items-center justify-between pt-3 relative z-10 text-left">
        <div>
          <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">Mobile Contact</span>
          <p className="text-xs font-bold text-slate-200">{staff.mobile}</p>
        </div>

        {/* Simulated QR Code SVG */}
        <div className="h-14 w-14 bg-white rounded-lg p-1.5 flex items-center justify-center shadow-lg shrink-0">
          <svg className="h-full w-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="white" />
            <path
              d="M10 10h30v30H10V10zm40 0h10v10H50V10zm20 0h20v20H70V10zM10 50h10v10H10V50zm40 10h20v20H50V60zM30 70h10v20H30V70zm50 0h10v25H80V70zm-60 10h10v10H20V80zm60-30h10v20H80V50zm-10 40h10v5H70v-5zm-20 0H10v5h40v-5z"
              fill="black"
            />
            <rect x="18" y="18" width="14" height="14" fill="white" />
            <rect x="21" y="21" width="8" height="8" fill="black" />
            <rect x="68" y="18" width="14" height="14" fill="white" />
            <rect x="71" y="21" width="8" height="8" fill="black" />
          </svg>
        </div>
      </div>
      
    </div>
  );
};

export default StaffIdCard;
