import { useState } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, Calendar, Hash } from 'lucide-react';
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

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  columns: { key: string; label: string }[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];

// Helper function to detect data type
function detectDataType(value: any): 'number' | 'date' | 'boolean' | 'string' {
  if (value === null || value === undefined) return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (value instanceof Date) return 'date';
  if (typeof value === 'string') {
    // Check if it's a date string
    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
    if (dateRegex.test(value)) {
      return 'date';
    }
    return 'string';
  }
  return 'string';
}

// Helper function to analyze column data
function analyzeColumn(data: any[], columnKey: string, columnLabel: string) {
  if (!data || data.length === 0) return null;

  const values = data.map(row => row[columnKey]).filter(val => val !== null && val !== undefined);
  if (values.length === 0) return null;

  const firstValue = values[0];
  const dataType = detectDataType(firstValue);

  if (dataType === 'number') {
    const numericValues = values.filter(v => typeof v === 'number');
    if (numericValues.length === 0) return null;
    
    const total = numericValues.reduce((sum, val) => sum + val, 0);
    const average = total / numericValues.length;
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const sorted = [...numericValues].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return {
      type: 'number',
      label: columnLabel,
      key: columnKey,
      stats: { total, average, min, max, median, count: numericValues.length },
      data: numericValues,
    };
  }

  if (dataType === 'date') {
    const dateValues = values.map(v => {
      if (v instanceof Date) return v;
      if (typeof v === 'string') {
        const date = new Date(v);
        return isNaN(date.getTime()) ? null : date;
      }
      return null;
    }).filter(v => v !== null) as Date[];

    if (dateValues.length === 0) return null;

    // Group by date (day level)
    const dateMap = new Map<string, number>();
    dateValues.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
    });

    const chartData = Array.from(dateMap.entries())
      .map(([date, count]) => ({ name: date, value: count }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(-30); // Last 30 days

    return {
      type: 'date',
      label: columnLabel,
      key: columnKey,
      stats: { 
        earliest: new Date(Math.min(...dateValues.map(d => d.getTime()))),
        latest: new Date(Math.max(...dateValues.map(d => d.getTime()))),
        count: dateValues.length,
      },
      chartData,
    };
  }

  if (dataType === 'boolean') {
    const trueCount = values.filter(v => v === true || v === 'true' || v === 'True' || v === 1).length;
    const falseCount = values.length - trueCount;

    return {
      type: 'boolean',
      label: columnLabel,
      key: columnKey,
      stats: { trueCount, falseCount, total: values.length },
      chartData: [
        { name: 'True', value: trueCount },
        { name: 'False', value: falseCount },
      ],
    };
  }

  // String/categorical data
  const frequencyMap = new Map<string, number>();
  values.forEach(val => {
    const str = String(val);
    frequencyMap.set(str, (frequencyMap.get(str) || 0) + 1);
  });

  const chartData = Array.from(frequencyMap.entries())
    .map(([name, count]) => ({ name: name.substring(0, 30), value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15); // Top 15

  // Calculate unique count and most common
  const uniqueCount = frequencyMap.size;
  const mostCommon = chartData.length > 0 ? chartData[0] : null;

  return {
    type: 'string',
    label: columnLabel,
    key: columnKey,
    stats: { 
      uniqueCount, 
      total: values.length,
      mostCommon: mostCommon ? { value: mostCommon.name, count: mostCommon.value } : null,
    },
    chartData,
  };
}

export default function AnalysisModal({
  isOpen,
  onClose,
  title,
  data,
  columns,
}: AnalysisModalProps) {
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  if (!isOpen) return null;

  // Analyze all columns
  const analyzedColumns = columns
    .map(col => analyzeColumn(data, col.key, col.label))
    .filter(analysis => analysis !== null) as any[];

  // Auto-select first column if none selected
  const currentAnalysis = selectedColumn
    ? analyzedColumns.find(a => a.key === selectedColumn)
    : analyzedColumns[0];

  // Determine appropriate chart type based on data type
  const getDefaultChartType = () => {
    if (!currentAnalysis) return 'bar';
    if (currentAnalysis.type === 'boolean' || currentAnalysis.type === 'string') return 'pie';
    if (currentAnalysis.type === 'date') return 'line';
    return 'bar';
  };

  if (chartType === 'bar' && currentAnalysis?.type === 'boolean') {
    setChartType('pie');
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{title} - Analysis</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {data.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No data available for analysis</p>
            </div>
          ) : analyzedColumns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No analyzable data found</p>
              <p className="text-gray-400 text-sm mt-2">All columns appear to be empty or unanalyzable</p>
            </div>
          ) : (
            <>
              {/* Column Selector */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Select Column to Analyze:
                </label>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {analyzedColumns.map((analysis) => (
                    <button
                      key={analysis.key}
                      onClick={() => {
                        setSelectedColumn(analysis.key);
                        setChartType(getDefaultChartType());
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        (selectedColumn === analysis.key || (!selectedColumn && analyzedColumns[0] === analysis))
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {analysis.type === 'number' && <Hash size={16} />}
                      {analysis.type === 'date' && <Calendar size={16} />}
                      {(analysis.type === 'boolean' || analysis.type === 'string') && <BarChart3 size={16} />}
                      {analysis.label}
                    </button>
                  ))}
                </div>
              </div>

              {currentAnalysis && (
                <>
                  {/* Statistics based on data type */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {currentAnalysis.type === 'number' && (
                      <>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-green-600 mb-1">
                            <TrendingUp size={16} />
                            <span className="text-xs font-medium">Total</span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">
                            {currentAnalysis.stats.total >= 1000
                              ? currentAnalysis.stats.total.toLocaleString()
                              : currentAnalysis.stats.total.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <Activity size={16} />
                            <span className="text-xs font-medium">Average</span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">
                            {currentAnalysis.stats.average.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-orange-600 mb-1">
                            <TrendingUp size={16} />
                            <span className="text-xs font-medium">Maximum</span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">
                            {currentAnalysis.stats.max.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-red-600 mb-1">
                            <TrendingDown size={16} />
                            <span className="text-xs font-medium">Minimum</span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">
                            {currentAnalysis.stats.min.toLocaleString()}
                          </p>
                        </div>
                      </>
                    )}

                    {currentAnalysis.type === 'string' && (
                      <>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-green-600 mb-1">
                            <Hash size={16} />
                            <span className="text-xs font-medium">Total Records</span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">
                            {currentAnalysis.stats.total}
                          </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <Activity size={16} />
                            <span className="text-xs font-medium">Unique Values</span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">
                            {currentAnalysis.stats.uniqueCount}
                          </p>
                        </div>
                        {currentAnalysis.stats.mostCommon && (
                          <div className="bg-purple-50 p-3 rounded-lg col-span-2">
                            <div className="flex items-center gap-2 text-purple-600 mb-1">
                              <BarChart3 size={16} />
                              <span className="text-xs font-medium">Most Common</span>
                            </div>
                            <p className="text-base font-bold text-gray-900">
                              {currentAnalysis.stats.mostCommon.value}
                            </p>
                            <p className="text-sm text-gray-600">
                              ({currentAnalysis.stats.mostCommon.count} occurrences)
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {currentAnalysis.type === 'boolean' && (
                      <>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-green-600 mb-1">
                            <TrendingUp size={16} />
                            <span className="text-xs font-medium">True</span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">
                            {currentAnalysis.stats.trueCount}
                          </p>
                          <p className="text-xs text-gray-600">
                            ({((currentAnalysis.stats.trueCount / currentAnalysis.stats.total) * 100).toFixed(1)}%)
                          </p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-red-600 mb-1">
                            <TrendingDown size={16} />
                            <span className="text-xs font-medium">False</span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">
                            {currentAnalysis.stats.falseCount}
                          </p>
                          <p className="text-xs text-gray-600">
                            ({((currentAnalysis.stats.falseCount / currentAnalysis.stats.total) * 100).toFixed(1)}%)
                          </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg col-span-2">
                          <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <Hash size={16} />
                            <span className="text-xs font-medium">Total</span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">
                            {currentAnalysis.stats.total}
                          </p>
                        </div>
                      </>
                    )}

                    {currentAnalysis.type === 'date' && (
                      <>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-green-600 mb-2">
                            <Calendar size={20} />
                            <span className="text-sm font-medium">Total Records</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {currentAnalysis.stats.count}
                          </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <Activity size={16} />
                            <span className="text-xs font-medium">Earliest</span>
                          </div>
                          <p className="text-base font-bold text-gray-900">
                            {currentAnalysis.stats.earliest.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg col-span-2">
                          <div className="flex items-center gap-2 text-orange-600 mb-1">
                            <Calendar size={16} />
                            <span className="text-xs font-medium">Latest</span>
                          </div>
                          <p className="text-base font-bold text-gray-900">
                            {currentAnalysis.stats.latest.toLocaleDateString()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Chart Type Selector (only for number and date types) */}
                  {(currentAnalysis.type === 'number' || currentAnalysis.type === 'date') && (
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setChartType('bar')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          chartType === 'bar'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Bar Chart
                      </button>
                      {(currentAnalysis.type === 'number' || currentAnalysis.type === 'date') && (
                        <button
                          onClick={() => setChartType('line')}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            chartType === 'line'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Line Chart
                        </button>
                      )}
                      <button
                        onClick={() => setChartType('pie')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          chartType === 'pie'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Pie Chart
                      </button>
                    </div>
                  )}

                  {/* Chart */}
                  {currentAnalysis.chartData && currentAnalysis.chartData.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-base font-semibold mb-3">{currentAnalysis.label} Distribution</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        {currentAnalysis.type === 'boolean' || currentAnalysis.type === 'string' ? (
                          <PieChart>
                            <Pie
                              data={currentAnalysis.chartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={120}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {currentAnalysis.chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        ) : chartType === 'bar' ? (
                          <BarChart data={currentAnalysis.chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#10b981" name={currentAnalysis.label} />
                          </BarChart>
                        ) : chartType === 'line' ? (
                          <LineChart data={currentAnalysis.chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="value" stroke="#3b82f6" name={currentAnalysis.label} />
                          </LineChart>
                        ) : (
                          <PieChart>
                            <Pie
                              data={currentAnalysis.chartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={120}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {currentAnalysis.chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Data Summary */}
                  <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                    <h3 className="text-sm font-semibold mb-2">Data Summary</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-600">Total Records: </span>
                        <span className="font-medium">{data.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Data Type: </span>
                        <span className="font-medium capitalize">{currentAnalysis.type}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
