import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const KpiCard = ({
  title,
  value,
  icon: Icon,
  accent = "#2563EB",
  trend,
  trendDirection = "up",
  helper,
}) => {
  const TrendIcon = trendDirection === "down" ? ArrowDownRight : ArrowUpRight;
  const trendClass =
    trendDirection === "down"
      ? "bg-red-50 text-red-600"
      : "bg-emerald-50 text-emerald-600";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: accent }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${accent}12`, color: accent }}
        >
          <Icon size={20} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${trendClass}`}
        >
          <TrendIcon size={13} />
          {trend}
        </span>
        <span className="truncate text-xs text-slate-400">{helper}</span>
      </div>
    </div>
  );
};

export default KpiCard;
