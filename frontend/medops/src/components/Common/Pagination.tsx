// src/components/Common/Pagination.tsx
import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("…");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("…");
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Estilos base para los botones
  const btnBase = "h-8 flex items-center justify-center border transition-all duration-200 text-[10px] font-mono font-bold uppercase tracking-widest";
  const btnActive = "bg-[var(--palantir-active)] border-[var(--palantir-active)] text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]";
  const btnInactive = "bg-[var(--palantir-surface)] border-[var(--palantir-border)] text-[var(--palantir-muted)] hover:border-[var(--palantir-active)] hover:text-white";
  const btnDisabled = "bg-[var(--palantir-bg)] border-[var(--palantir-border)]/50 text-[var(--palantir-muted)]/20 cursor-not-allowed";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
      {/* Indicador de Status de Datos */}
      <div className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-[0.2em]">
        Showing_Range: <span className="text-[var(--palantir-text)]">{(currentPage - 1) * pageSize + 1}</span> 
        _to_ <span className="text-[var(--palantir-text)]">{Math.min(currentPage * pageSize, totalItems)}</span> 
        _of_ <span className="text-[var(--palantir-active)]">{totalItems}</span>_Records
      </div>

      <div className="flex items-center">
        {/* Botón Anterior */}
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${btnBase} w-10 rounded-l-sm border-r-0 ${currentPage === 1 ? btnDisabled : btnInactive}`}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        {/* Botones de Página */}
        <div className="flex">
          {pageNumbers.map((page, idx) =>
            page === "…" ? (
              <span
                key={`ellipsis-${idx}`}
                className="w-10 h-8 flex items-center justify-center border border-x-0 border-[var(--palantir-border)] bg-[var(--palantir-bg)] text-[var(--palantir-muted)] text-[10px]"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`${btnBase} w-10 border-x-0 last:border-x ${
                  page === currentPage ? btnActive : btnInactive
                }`}
              >
                {page.toString().padStart(2, '0')}
              </button>
            )
          )}
        </div>

        {/* Botón Siguiente */}
        <button
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${btnBase} w-10 rounded-r-sm border-l-0 ${currentPage === totalPages ? btnDisabled : btnInactive}`}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
