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
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 lg:gap-2 px-3 py-1.5 lg:px-4 lg:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs lg:text-sm font-medium"
          title="Export to CSV"
        >
          <Download size={16} className="lg:w-[18px] lg:h-[18px]" />
          <span className="hidden sm:inline">Export</span>
        </button>
        <button
          onClick={handlePrintPDF}
          className="flex items-center gap-1.5 lg:gap-2 px-3 py-1.5 lg:px-4 lg:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs lg:text-sm font-medium"
          title="Print as PDF"
        >
          <Printer size={16} className="lg:w-[18px] lg:h-[18px]" />
          <span className="hidden sm:inline">Print</span>
        </button>
        <button
          onClick={handleAnalysis}
          className="flex items-center gap-1.5 lg:gap-2 px-3 py-1.5 lg:px-4 lg:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs lg:text-sm font-medium"
          title="View Analysis"
        >
          <BarChart3 size={16} className="lg:w-[18px] lg:h-[18px]" />
          <span className="hidden sm:inline">Analysis</span>
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

