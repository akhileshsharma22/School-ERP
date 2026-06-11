const DashboardChartCard = ({ title, meta, children }) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-950">
            {title}
          </h2>
          <p className="text-xs text-slate-500">{meta}</p>
        </div>
      </div>

      <div className="h-[210px] sm:h-[230px] lg:h-[220px]">{children}</div>
    </section>
  );
};

export default DashboardChartCard;
