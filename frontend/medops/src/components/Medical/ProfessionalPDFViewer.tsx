// src/components/Medical/ProfessionalPDFViewer.tsx
import { useState, useEffect } from 'react';
import { EyeIcon, ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline';
interface ProfessionalPDFViewerProps {
  documentUrl: string;
  title: string;
  auditCode: string;
  onPrint?: () => void;
  onDownload?: () => void;
}
export default function ProfessionalPDFViewer({
  documentUrl,
  title,
  auditCode,
  onPrint,
  onDownload
}: ProfessionalPDFViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handlePrint = () => {
    setIsLoading(true);
    const printWindow = window.open(documentUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        setIsLoading(false);
        onPrint?.();
      };
    } else {
      setError('No se pudo abrir la ventana de impresión');
      setIsLoading(false);
    }
  };
  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title}_${auditCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      onDownload?.();
    } catch (err) {
      setError('Error al descargar el documento');
    } finally {
      setIsLoading(false);
    }
  };
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <EyeIcon className="w-5 h-5 text-red-500" />
          <span className="text-red-700">Error: {error}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header del Visor */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">Código: {auditCode}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Imprimir documento"
            >
              <PrinterIcon className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={handleDownload}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Descargar documento"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Descargar
            </button>
          </div>
        </div>
      </div>
      {/* Visor del PDF */}
      <div className="relative" style={{ height: '600px' }}>
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        <iframe
          src={documentUrl}
          className="w-full h-full border-0"
          title={`Documento: ${title}`}
          onLoad={() => setIsLoading(false)}
          onError={() => setError('Error al cargar el documento')}
        />
      </div>
    </div>
  );
}