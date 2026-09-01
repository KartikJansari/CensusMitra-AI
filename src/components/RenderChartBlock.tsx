import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartDataBlock } from '../types/census';
import { BarChart3, PieChart as PieIcon, TrendingUp, Info } from 'lucide-react';

interface RenderChartBlockProps {
  data: ChartDataBlock;
  compact?: boolean;
}

const DEFAULT_COLORS = [
  '#0284c7', // Sky Blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#dc2626', // Red
  '#0891b2', // Cyan
  '#ec4899', // Pink
  '#475569', // Slate
];

export const RenderChartBlock: React.FC<RenderChartBlockProps> = ({ data, compact = false }) => {
  if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
    return null;
  }

  // Transform data into Recharts friendly format
  // labels: ['A', 'B'], datasets: [{ label: 'Set1', data: [10, 20] }]
  const formattedData = data.labels.map((label, index) => {
    const item: Record<string, any> = { name: label };
    data.datasets.forEach((ds) => {
      item[ds.label || 'Value'] = ds.data[index] ?? 0;
    });
    return item;
  });

  const isPieOrDoughnut = data.chartType === 'pie' || data.chartType === 'doughnut';

  // For pie chart single dataset transformation
  const pieData = data.labels.map((label, index) => ({
    name: label,
    value: data.datasets[0]?.data[index] ?? 0,
    color: Array.isArray(data.datasets[0]?.backgroundColor)
      ? (data.datasets[0].backgroundColor as string[])[index % (data.datasets[0].backgroundColor as string[]).length]
      : (data.datasets[0]?.backgroundColor as string) || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  const getChartIcon = () => {
    switch (data.chartType) {
      case 'line':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'pie':
      case 'doughnut':
        return <PieIcon className="w-4 h-4 text-emerald-600" />;
      default:
        return <BarChart3 className="w-4 h-4 text-sky-600" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 my-3 shadow-xs hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 rounded-md">
            {getChartIcon()}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 leading-tight">
              {data.title || 'Census Statistical Insight'}
            </h4>
            {data.description && (
              <p className="text-xs text-slate-500 mt-0.5">{data.description}</p>
            )}
          </div>
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full">
          {data.chartType.toUpperCase()} DATA
        </span>
      </div>

      <div className={`w-full ${compact ? 'h-52' : 'h-64'}`}>
        <ResponsiveContainer width="100%" height="100%">
          {isPieOrDoughnut ? (
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  borderRadius: '8px',
                  fontSize: '12px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: any) => [`${value}`, 'Value']}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-xs text-slate-700">{value}</span>}
              />
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={data.chartType === 'doughnut' ? 50 : 0}
                outerRadius={compact ? 65 : 80}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          ) : data.chartType === 'line' ? (
            <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  borderRadius: '8px',
                  fontSize: '12px',
                  border: 'none',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={32}
                formatter={(value) => <span className="text-xs text-slate-700">{value}</span>}
              />
              {data.datasets.map((dataset, idx) => (
                <Line
                  key={idx}
                  type="monotone"
                  dataKey={dataset.label || 'Value'}
                  stroke={
                    dataset.borderColor ||
                    (typeof dataset.backgroundColor === 'string' ? dataset.backgroundColor : DEFAULT_COLORS[idx % DEFAULT_COLORS.length])
                  }
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: dataset.borderColor || '#0284c7' }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#64748b' }}
                interval={0}
                tickFormatter={(val) => (val.length > 14 ? `${val.slice(0, 12)}…` : val)}
                stroke="#cbd5e1"
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  borderRadius: '8px',
                  fontSize: '12px',
                  border: 'none',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={32}
                formatter={(value) => <span className="text-xs text-slate-700">{value}</span>}
              />
              {data.datasets.map((dataset, idx) => (
                <Bar
                  key={idx}
                  dataKey={dataset.label || 'Value'}
                  fill={
                    typeof dataset.backgroundColor === 'string'
                      ? dataset.backgroundColor
                      : DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
                  }
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Official Projections, Office of Registrar General & Census Commissioner of India</span>
      </div>
    </div>
  );
};
