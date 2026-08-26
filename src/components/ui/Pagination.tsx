import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number | string;
  totalRows: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  itemName?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
  itemName = 'bản ghi'
}: PaginationProps) {
  const actualRowsPerPage = typeof rowsPerPage === 'number' && rowsPerPage > 0 ? rowsPerPage : 100;

  if (totalRows === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-0.5 min-h-[22px] max-h-[26px] bg-gray-50 border-t border-gray-200 gap-2 shrink-0 text-[11px] select-none">
      <div className="flex items-center gap-1.5 text-gray-600 font-medium leading-none">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-0.5 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center h-5 w-5"
          title="Trang trước"
        >
          <ChevronLeft size={13} />
        </button>
        <span className="flex items-center gap-1 leading-none">
          Trang
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              let val = parseInt(e.target.value);
              if (!isNaN(val)) {
                if (val > totalPages) val = totalPages;
                if (val < 1) val = 1;
                onPageChange(val);
              }
            }}
            className="w-10 text-center border border-gray-300 rounded py-0 px-0.5 h-4.5 text-[11px] outline-none focus:border-[#00539c] focus:ring-1 focus:ring-[#00539c]"
          />
          / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-0.5 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center h-5 w-5"
          title="Trang sau"
        >
          <ChevronRight size={13} />
        </button>
        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-300 leading-none">
          <input
            type="number"
            min={1}
            value={rowsPerPage}
            onChange={(e) => {
              const val = e.target.value;
              onRowsPerPageChange(val === '' ? 100 : parseInt(val));
            }}
            className="w-12 text-center border border-gray-300 rounded py-0 px-0.5 h-4.5 text-[11px] outline-none focus:border-[#00539c] text-[#00539c] font-bold"
          />
          <span>dòng</span>
        </div>
      </div>
      <div className="text-[11px] text-gray-500 hidden md:block leading-none">
        Hiển thị {Math.min((currentPage - 1) * actualRowsPerPage + 1, totalRows)} - {Math.min(currentPage * actualRowsPerPage, totalRows)} trong tổng số{' '}
        <span className="font-bold text-gray-800">{totalRows}</span> {itemName}
      </div>
    </div>
  );
}
