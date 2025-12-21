import { useState } from 'react';
import { Download, Printer, BarChart3 } from 'lucide-react';
import { exportToCSV } from '../../utils/exportUtils';
import { printTableToPDF } from '../../utils/pdfUtils';
import AnalysisModal from './AnalysisModal';

interface TableActionsProps {
  tableId: string;
  title: string;
  data: any[];
  columns: { key: string; label: string }[];
  filteredData?: any[];
  getRowData?: (row: any) => Record<string, any>;
}

export default function TableActions({
  tableId,
  title,
  data,
  columns,
  filteredData,
  getRowData,
}: TableActionsProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleExportCSV = () => {
    const dataToExport = filteredData || data;
    exportToCSV(dataToExport, columns, title);
  };

  const handlePrintPDF = () => {
    const dataToExport = filteredData || data;
    printTableToPDF(tableId, title, columns, dataToExport, getRowData);
  };

  const handleAnalysis = () => {
    setShowAnalysis(true);
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          title="Export to CSV"
        >
          <Download size={18} />
          Export
        </button>
        <button
          onClick={handlePrintPDF}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          title="Print as PDF"
        >
          <Printer size={18} />
          Print
        </button>
        <button
          onClick={handleAnalysis}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          title="View Analysis"
        >
          <BarChart3 size={18} />
          Analysis
        </button>
      </div>

      {showAnalysis && (
        <AnalysisModal
          isOpen={showAnalysis}
          onClose={() => setShowAnalysis(false)}
          title={title}
          data={filteredData || data}
          columns={columns}
        />
      )}
    </>
  );
}

