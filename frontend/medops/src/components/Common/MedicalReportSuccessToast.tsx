import React from "react";
import { DocumentCheckIcon, ArrowTopRightOnSquareIcon, XMarkIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
interface MedicalReportSuccessToastProps {
  fileUrl?: string | null;
  auditCode?: string | null;
  onClose: () => void;
}
const MedicalReportSuccessToast: React.FC<MedicalReportSuccessToastProps> = ({ 
  fileUrl, 
  auditCode, 
  onClose 
}) => {
  if (!fileUrl) return null;
  return (
    <div className="fixed bottom-6 right-6 max-w-sm w-full animate-in slide-in-from-right-10 duration-500 z-[9999]">
      <div className="bg-[#0d1117] border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] rounded-xl overflow-hidden backdrop-blur-md">
        
        <div className="h-1 w-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        <div className="p-4 flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <DocumentCheckIcon className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white tracking-tight">
              MEDICAL_REPORT_GENERATED
            </h4>
             
            {auditCode && (
              <div className="mt-2 flex items-center gap-1.5 py-1 px-2 bg-emerald-500/5 border border-emerald-500/10 rounded-md">
                <ShieldCheckIcon className="w-3 h-3 text-emerald-500/70" />
                <p className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-wider">
                  Audit_ID: <span className="text-emerald-400 font-bold">{auditCode}</span>
                </p>
              </div>
            )}
            <div className="mt-4 flex items-center gap-3">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20"
              >
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                ACCESS_DOCUMENT
              </a>
              
              <button 
                onClick={onClose}
                className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
              >
                DISMISS_NOTIFICATION
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-600 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-emerald-500/5 px-4 py-1.5 border-t border-emerald-500/10 flex justify-between items-center">
            <span className="text-[8px] font-mono text-emerald-500/40 uppercase">Encrypted_Transfer_Ready</span>
            <span className="text-[8px] font-mono text-emerald-500/40 uppercase">v1.2</span>
        </div>
      </div>
    </div>
  );
};
export default MedicalReportSuccessToast;