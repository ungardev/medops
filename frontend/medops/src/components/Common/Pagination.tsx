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
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
      <div className="text-[10px] text-white/50">
        Mostrando {(currentPage - 1) * pageSize + 1} — {Math.min(currentPage * pageSize, totalItems)} de {totalItems}
      </div>
      <div className="flex items-center">
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`h-9 w-9 flex items-center justify-center border border-white/15 rounded-l-lg transition-all duration-200 text-[11px] font-medium ${
            currentPage === 1 
              ? "bg-white/5 text-white/20 cursor-not-allowed" 
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <div className="flex">
          {pageNumbers.map((page, idx) =>
            page === "…" ? (
              <span
                key={`ellipsis-${idx}`}
                className="w-9 h-9 flex items-center justify-center border border-t border-b border-white/15 bg-white/5 text-white/40 text-[11px]"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`h-9 w-9 flex items-center justify-center border border-t border-b border-white/15 transition-all duration-200 text-[11px] font-medium ${
                  page === currentPage 
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" 
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>
        <button
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`h-9 w-9 flex items-center justify-center border border-white/15 rounded-r-lg transition-all duration-200 text-[11px] font-medium ${
            currentPage === totalPages 
              ? "bg-white/5 text-white/20 cursor-not-allowed" 
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
export default Pagination;