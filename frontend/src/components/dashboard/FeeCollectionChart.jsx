import {
  Bar,
  BarChart,
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

const FeeCollectionChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
        <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#64748B", fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#64748B", fontSize: 12 }}
          tickFormatter={(value) => `${value}L`}
        />
        <Tooltip
          cursor={{ fill: "#F1F5F9" }}
          contentStyle={tooltipStyle}
          formatter={(value) => [`Rs. ${value}L`, "Collected"]}
          labelStyle={{ color: "#0F172A", fontWeight: 700 }}
        />
        <Bar dataKey="collected" radius={[8, 8, 0, 0]} fill="#22C55E" />
        <Bar dataKey="pending" radius={[8, 8, 0, 0]} fill="#F59E0B" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default FeeCollectionChart;
