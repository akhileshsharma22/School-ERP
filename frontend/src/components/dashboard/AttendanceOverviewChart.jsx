import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  border: "1px solid #E2E8F0",
  borderRadius: 14,
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
};

const AttendanceOverviewChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
        <defs>
          <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.28} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#64748B", fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#64748B", fontSize: 12 }}
          domain={[75, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [`${value}%`, "Attendance"]}
          labelStyle={{ color: "#0F172A", fontWeight: 700 }}
        />
        <Area
          type="monotone"
          dataKey="attendance"
          stroke="#2563EB"
          strokeWidth={3}
          fill="url(#attendanceGradient)"
          dot={{ r: 3, strokeWidth: 2, fill: "#FFFFFF" }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default AttendanceOverviewChart;
