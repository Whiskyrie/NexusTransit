import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LineChartProps<T> {
  title: string;
  data: T[];
  dataKey: keyof T & string;
  xAxisKey: keyof T & string;
  height?: number;
  filter?: React.ReactNode;
}

export function LineChart<T>({
  title,
  data,
  dataKey,
  xAxisKey,
  height = 300,
  filter,
}: LineChartProps<T>) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#1A1A1A]">{title}</h3>
        {filter}
      </div>

      <div style={{ height, minHeight: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F5F5F0" />
            <XAxis
              dataKey={xAxisKey}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              dy={10}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A1A1A",
                color: "#FFFFFF",
                borderRadius: "8px",
                border: "none",
                fontSize: "12px",
                fontWeight: 500,
                padding: "8px 12px",
              }}
              itemStyle={{ color: "#FFFFFF" }}
              cursor={{ stroke: "#E5E7EB", strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#1A1A1A"
              strokeWidth={2}
              dot={{ r: 4, fill: "#FFFFFF", stroke: "#1A1A1A", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#1A1A1A", stroke: "#FFFFFF", strokeWidth: 2 }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
