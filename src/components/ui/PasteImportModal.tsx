import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X, ClipboardPaste, AlertTriangle, CheckCircle, Loader2, Info, Trash2,
  Filter, Edit3, CheckSquare, Square, RefreshCw, Sparkles, SlidersHorizontal, Check
} from 'lucide-react';
import { toUnaccented } from '../../utils/formatters';

export interface ColumnMapItem {
  label: string;
  key: string;
  type: 'text' | 'date' | 'number' | 'select';
  required?: boolean;
}

interface PasteImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any[]) => Promise<void> | void;
  title: string;
  columnMapping: ColumnMapItem[];
  // Cho phép bên ngoài truyền hàm kiểm tra để trả về lỗi (đỏ) hoặc cảnh báo (vàng)
  onValidateRow?: (row: any, allRows?: any[]) => { errors: Record<string, string>; warnings: Record<string, string> };
}

const getColMinWidth = (key: string): string => {
  switch (key) {
    case 'stt': return '40px';
    case 'msnv': return '70px';
    case 'ho_ten': return '150px';
    case 'ngay_sinh': return '85px';
    case 'gioi_tinh': return '60px';
    case 'so_cccd': return '90px';
    case 'quoc_tich': return '80px';
    case 'chuc_vu': return '100px';
    case 'don_vi_text': return '110px';
    case 'nhom': return '60px';
    case 'noi_dung_huan_luyen': return '180px';
    case 'thoi_gian_text': return '110px';
    case 'diem_ly_thuyet': return '60px';
    case 'diem_thuc_hanh': return '60px';
    case 'ket_qua': return '80px';
    case 'ghi_chu': return '110px';
    default: return '110px';
  }
};

export default function PasteImportModal({
  isOpen,
  onClose,
  onSave,
  title,
  columnMapping,
  onValidateRow
}: PasteImportModalProps) {
  // States chính
  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [rowStatus, setRowStatus] = useState<{ errors: Record<string, string>; warnings: Record<string, string> }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // States mới cho lọc & thao tác hàng loạt
  const [filterMode, setFilterMode] = useState<'all' | 'error' | 'warning' | 'valid'>('all');
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isBatchEditOpen, setIsBatchEditOpen] = useState(false);
  const [batchEditCol, setBatchEditCol] = useState<string>('');
  const [batchEditVal, setBatchEditVal] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setRawText('');
      setParsedData([]);
      setRowStatus([]);
      setFilterMode('all');
      setSelectedIndices([]);
      setIsBatchEditOpen(false);
      setBatchEditCol('');
      setBatchEditVal('');
    }
  }, [isOpen]);

  // Tính toán vị trí sticky left cho các cột (Checkbox ở left: 0px, STT ở left: 36px, MSNV, Họ tên...)
  const getStickyLeftStyle = (colKey: string): React.CSSProperties => {
    if (colKey === 'stt') {
      return { position: 'sticky', left: '36px', zIndex: 2 };
    }
    if (colKey === 'msnv') {
      const hasSttCol = columnMapping.some(c => c.key === 'stt');
      const leftVal = hasSttCol ? 76 : 36;
      return { position: 'sticky', left: `${leftVal}px`, zIndex: 2 };
    }
    if (colKey === 'ho_ten') {
      const hasSttCol = columnMapping.some(c => c.key === 'stt');
      const hasMsnvCol = columnMapping.some(c => c.key === 'msnv');
      let leftVal = 36;
      if (hasSttCol) leftVal += 40;
      if (hasMsnvCol) leftVal += 70;
      return { position: 'sticky', left: `${leftVal}px`, zIndex: 2 };
    }
    return {};
  };

  const getStickyThStyle = (colKey: string): React.CSSProperties => {
    const base = getStickyLeftStyle(colKey);
    if (base.position === 'sticky') {
      return {
        ...base,
        zIndex: 12,
        backgroundColor: '#f9fafb'
      };
    }
    return {};
  };

  const parseExcelText = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < text.length && text[i + 1] === '"') {
            currentCell += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          currentCell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === '\t') {
          currentRow.push(currentCell.trim());
          currentCell = '';
        } else if (char === '\n') {
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
        } else if (char === '\r') {
          // Bỏ qua \r
        } else {
          currentCell += char;
        }
      }
    }
    if (currentCell !== '' || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
    }
    return rows;
  };

  const formatExcelDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split(/[\/\-.]/);
    if (parts.length === 3) {
      let d = parts[0].padStart(2, '0');
      let m = parts[1].padStart(2, '0');
      let y = parts[2];
      if (y.length === 2) y = '20' + y;
      return `${y}-${m}-${d}`;
    }
    return dateStr;
  };

  // Re-validate tất cả dữ liệu
  const runValidation = (items: any[]) => {
    return items.map(item => {
      const errors: Record<string, string> = {};
      const warnings: Record<string, string> = {};

      columnMapping.forEach(col => {
        if (col.required && !item[col.key]) {
          errors[col.key] = `Cột "${col.label}" là bắt buộc.`;
        }
        if (col.type === 'date' && item[col.key]) {
          const d = new Date(item[col.key]);
          if (isNaN(d.getTime())) {
            errors[col.key] = `Định dạng ngày không hợp lệ (cần dd/mm/yyyy).`;
          }
        }
      });

      if (onValidateRow) {
        const customVal = onValidateRow(item, items);
        Object.assign(errors, customVal.errors);
        Object.assign(warnings, customVal.warnings);
      }

      return { errors, warnings };
    });
  };

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    setSelectedIndices([]);
    if (!val.trim()) {
      setParsedData([]);
      setRowStatus([]);
      return;
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      try {
        const rawRows = parseExcelText(val);
        if (rawRows.length === 0) {
          setParsedData([]);
          setRowStatus([]);
          return;
        }

        let startIndex = 0;
        if (rawRows.length > 0) {
          const firstRowStr = rawRows[0].map(c => toUnaccented(c || '')).join(' ');
          if (
            firstRowStr.includes('stt') ||
            firstRowStr.includes('msnv') ||
            firstRowStr.includes('ho ten') ||
            firstRowStr.includes('cccd') ||
            firstRowStr.includes('nhom')
          ) {
            startIndex = 1;
          }
        }

        const items: any[] = [];
        for (let i = startIndex; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (row.length === 0 || (row.length === 1 && !row[0])) continue;

          const item: Record<string, any> = {};
          columnMapping.forEach((col, colIdx) => {
            const rawVal = row[colIdx] || '';
            if (col.type === 'date') {
              item[col.key] = formatExcelDate(rawVal);
            } else if (col.type === 'number') {
              const numVal = parseFloat(rawVal.replace(/[^0-9.-]/g, ''));
              item[col.key] = isNaN(numVal) ? null : numVal;
            } else {
              item[col.key] = rawVal;
            }
          });
          items.push(item);
        }

        const statuses = runValidation(items);
        setParsedData(items);
        setRowStatus(statuses);
      } catch (err) {
        console.error('Lỗi phân tích dữ liệu dán Excel:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 100);
  };

  const handleDeleteRow = (indexToDelete: number) => {
    const updatedData = parsedData.filter((_, idx) => idx !== indexToDelete);
    const updatedStatuses = runValidation(updatedData);
    setParsedData(updatedData);
    setRowStatus(updatedStatuses);
    setSelectedIndices(prev => prev.filter(idx => idx !== indexToDelete).map(idx => idx > indexToDelete ? idx - 1 : idx));

    // Nếu không còn dòng bị lỗi nghiêm trọng nào nữa, tự động chuyển về chế độ hiển thị Tất cả
    const remainingErrors = updatedStatuses.filter(s => Object.keys(s.errors || {}).length > 0).length;
    if (filterMode === 'error' && remainingErrors === 0) {
      setFilterMode('all');
    }
  };

  const handleCellChange = (rowIndex: number, colKey: string, newValue: any) => {
    const updatedData = [...parsedData];
    updatedData[rowIndex] = { ...updatedData[rowIndex], [colKey]: newValue };
    const updatedStatuses = runValidation(updatedData);
    setParsedData(updatedData);
    setRowStatus(updatedStatuses);
  };

  const handleCellBlur = (rowIndex: number, colKey: string, value: string) => {
    const col = columnMapping.find(c => c.key === colKey);
    if (col && col.type === 'date') {
      const formatted = formatExcelDate(value);
      if (formatted !== value) {
        handleCellChange(rowIndex, colKey, formatted);
      }
    }
  };

  // Thống kê theo dòng (Row-level metrics)
  const rowMetrics = useMemo(() => {
    let errorRowsCount = 0;
    let warningRowsCount = 0;
    let validRowsCount = 0;
    const errorIndices: number[] = [];
    const warningIndices: number[] = [];
    const validIndices: number[] = [];

    rowStatus.forEach((s, idx) => {
      const hasErr = Object.keys(s.errors || {}).length > 0;
      const hasWarn = Object.keys(s.warnings || {}).length > 0;

      if (hasErr) {
        errorRowsCount++;
        errorIndices.push(idx);
      } else if (hasWarn) {
        warningRowsCount++;
        warningIndices.push(idx);
      } else {
        validRowsCount++;
        validIndices.push(idx);
      }
    });

    return {
      errorRowsCount,
      warningRowsCount,
      validRowsCount,
      errorIndices,
      warningIndices,
      validIndices
    };
  }, [rowStatus]);

  // Các dòng hiển thị theo bộ lọc
  const visibleRowIndices = useMemo(() => {
    return parsedData.map((_, idx) => idx).filter(idx => {
      const status = rowStatus[idx];
      const hasErr = Object.keys(status?.errors || {}).length > 0;
      const hasWarn = Object.keys(status?.warnings || {}).length > 0;

      if (filterMode === 'error') return hasErr;
      if (filterMode === 'warning') return hasWarn && !hasErr;
      if (filterMode === 'valid') return !hasErr && !hasWarn;
      return true;
    });
  }, [parsedData, rowStatus, filterMode]);

  // Checkbox select handlers
  const isAllVisibleSelected = visibleRowIndices.length > 0 && visibleRowIndices.every(idx => selectedIndices.includes(idx));

  const handleToggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      setSelectedIndices(prev => prev.filter(idx => !visibleRowIndices.includes(idx)));
    } else {
      const set = new Set([...selectedIndices, ...visibleRowIndices]);
      setSelectedIndices(Array.from(set));
    }
  };

  const handleToggleSelectRow = (rowIndex: number) => {
    setSelectedIndices(prev =>
      prev.includes(rowIndex) ? prev.filter(i => i !== rowIndex) : [...prev, rowIndex]
    );
  };

  // Thao tác hàng loạt
  const handleDeleteSelected = () => {
    if (selectedIndices.length === 0) return;
    const toKeep = parsedData.map((_, idx) => idx).filter(idx => !selectedIndices.includes(idx));
    const newParsed = toKeep.map(idx => parsedData[idx]);
    const newStatuses = runValidation(newParsed);
    setParsedData(newParsed);
    setRowStatus(newStatuses);
    setSelectedIndices([]);

    const remainingErrors = newStatuses.filter(s => Object.keys(s.errors || {}).length > 0).length;
    if (filterMode === 'error' && remainingErrors === 0) {
      setFilterMode('all');
    }
  };

  const handleDeleteAllErrors = () => {
    if (rowMetrics.errorIndices.length === 0) return;
    const toKeep = parsedData.map((_, idx) => idx).filter(idx => !rowMetrics.errorIndices.includes(idx));
    const newParsed = toKeep.map(idx => parsedData[idx]);
    const newStatuses = runValidation(newParsed);
    setParsedData(newParsed);
    setRowStatus(newStatuses);
    setSelectedIndices([]);

    if (filterMode === 'error') {
      setFilterMode('all');
    }
  };

  const handleApplyBatchEdit = () => {
    if (!batchEditCol || selectedIndices.length === 0) return;
    const updated = [...parsedData];
    selectedIndices.forEach(idx => {
      if (updated[idx]) {
        updated[idx] = { ...updated[idx], [batchEditCol]: batchEditVal };
      }
    });
    const newStatuses = runValidation(updated);
    setParsedData(updated);
    setRowStatus(newStatuses);
    setIsBatchEditOpen(false);
  };

  // Nút Quick Fix gợi ý
  const handleQuickFixNhom3 = () => {
    const targetIndices = selectedIndices.length > 0 ? selectedIndices : visibleRowIndices;
    if (targetIndices.length === 0) return;
    const updated = [...parsedData];
    targetIndices.forEach(idx => {
      if (updated[idx] && (!updated[idx].nhom || String(updated[idx].nhom).trim() === '')) {
        updated[idx] = { ...updated[idx], nhom: 'Nhóm 3' };
      }
    });
    const newStatuses = runValidation(updated);
    setParsedData(updated);
    setRowStatus(newStatuses);
  };

  const handleQuickFixKetQuaDat = () => {
    const targetIndices = selectedIndices.length > 0 ? selectedIndices : visibleRowIndices;
    if (targetIndices.length === 0) return;
    const updated = [...parsedData];
    targetIndices.forEach(idx => {
      if (updated[idx]) {
        updated[idx] = { ...updated[idx], ket_qua: 'Đạt' };
      }
    });
    const newStatuses = runValidation(updated);
    setParsedData(updated);
    setRowStatus(newStatuses);
  };

  const hasErrors = rowMetrics.errorRowsCount > 0;

  const handleConfirmSave = async () => {
    if (hasErrors || parsedData.length === 0 || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(parsedData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-lime-50 to-emerald-50 border-b border-lime-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-lime-100 text-lime-700 rounded-2xl shadow-xs">
              <ClipboardPaste size={22} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">{title}</h3>
              <p className="text-xs text-gray-500 font-medium">Sao chép toàn bộ bảng từ Excel (bao gồm cả dòng tiêu đề hoặc không) rồi Ctrl+V dán vào ô bên dưới</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5">
          {/* Hướng dẫn cột */}
          <div className="p-3.5 bg-lime-50/50 rounded-2xl border border-lime-100/60 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-600 font-medium shrink-0">
            <span className="text-lime-800 font-bold flex items-center gap-1"><Info size={14} /> Thứ tự các cột dán yêu cầu:</span>
            {columnMapping.map((col, idx) => (
              <span key={col.key} className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-gray-200 shadow-2xs">
                <span className="text-gray-400 font-semibold">{idx + 1}.</span>
                <span className="font-medium text-gray-700">{col.label}</span>
                {col.required && <span className="text-red-500 font-bold">*</span>}
              </span>
            ))}
          </div>

          {/* Vùng dán dữ liệu */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">Vùng dán dữ liệu Excel (Paste area)</span>
              {parsedData.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setRawText(''); setParsedData([]); setRowStatus([]); setSelectedIndices([]); }}
                  className="text-red-600 hover:text-red-700 text-xs font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RefreshCw size={12} /> Dán lại từ đầu
                </button>
              )}
            </label>
            <textarea
              value={rawText}
              onChange={handlePasteChange}
              disabled={isAnalyzing || isSaving}
              placeholder="Nhấp vào đây và nhấn Ctrl+V để dán dữ liệu từ file Excel..."
              className="w-full h-28 p-3.5 border-2 border-dashed border-gray-300 rounded-2xl outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100 bg-gray-50/50 hover:bg-gray-50/80 focus:bg-white transition-all text-xs font-mono"
            />
          </div>

          {/* Trạng thái phân tích */}
          {isAnalyzing && (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-500 shrink-0">
              <Loader2 className="animate-spin text-lime-600" size={32} />
              <span className="text-xs font-medium">Đang phân tích cú pháp dữ liệu Excel...</span>
            </div>
          )}

          {/* Bảng Preview & Công cụ Lọc/Thao tác */}
          {!isAnalyzing && parsedData.length > 0 && (
            <div className="flex-1 flex flex-col gap-3 min-h-[300px]">
              {/* Header điều khiển: Các Thẻ Thống Kê & Bộ Lọc Tương Tác */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3 shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-800 mr-1">Xem trước dữ liệu ({parsedData.length} dòng):</span>

                  {/* Nút lọc Tất cả */}
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${filterMode === 'all'
                      ? 'bg-gray-800 text-white shadow-md ring-2 ring-gray-400/30'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    Tất cả ({parsedData.length})
                  </button>

                  {/* Nút lọc Hợp lệ */}
                  <button
                    type="button"
                    onClick={() => setFilterMode('valid')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${filterMode === 'valid'
                      ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                  >
                    <CheckCircle size={13} /> Hợp lệ ({rowMetrics.validRowsCount})
                  </button>

                  {/* Nút lọc Lỗi nghiêm trọng */}
                  <button
                    type="button"
                    onClick={() => setFilterMode('error')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${filterMode === 'error'
                      ? 'bg-red-600 text-white shadow-md ring-2 ring-red-300 animate-pulse'
                      : rowMetrics.errorRowsCount > 0
                        ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                        : 'bg-gray-50 text-gray-400 border border-gray-200 cursor-default'
                      }`}
                  >
                    <AlertTriangle size={13} /> Lỗi nghiêm trọng ({rowMetrics.errorRowsCount})
                  </button>

                  {/* Nút lọc Cảnh báo */}
                  <button
                    type="button"
                    onClick={() => setFilterMode('warning')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${filterMode === 'warning'
                      ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300'
                      : rowMetrics.warningRowsCount > 0
                        ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                        : 'bg-gray-50 text-gray-400 border border-gray-200 cursor-default'
                      }`}
                  >
                    <AlertTriangle size={13} /> Cảnh báo ({rowMetrics.warningRowsCount})
                  </button>
                </div>

                {/* Tiện ích chọn nhanh */}
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {rowMetrics.errorRowsCount > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteAllErrors}
                      className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl transition-colors flex items-center gap-1 border border-red-200 cursor-pointer"
                    >
                      <Trash2 size={12} /> Xóa tất cả dòng lỗi ({rowMetrics.errorRowsCount})
                    </button>
                  )}

                  {columnMapping.some(c => c.key === 'nhom') && (
                    <button
                      type="button"
                      onClick={handleQuickFixNhom3}
                      className="px-2.5 py-1 bg-lime-100 hover:bg-lime-200 text-lime-900 rounded-xl transition-colors flex items-center gap-1 border border-lime-300 cursor-pointer"
                      title="Gán tự động Nhóm 3 cho các dòng thiếu nhóm"
                    >
                      <Sparkles size={12} /> Sửa nhanh Nhóm 3
                    </button>
                  )}
                </div>
              </div>

              {/* Thanh Công cụ Thao tác Hàng loạt (Batch Action Bar) khi có chọn dòng */}
              {selectedIndices.length > 0 && (
                <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in duration-150 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="bg-lime-500 text-gray-950 px-2.5 py-0.5 rounded-lg text-xs font-extrabold flex items-center gap-1">
                      <CheckSquare size={13} /> Đã chọn {selectedIndices.length} dòng
                    </span>
                    <span className="text-xs text-slate-300">Thao tác áp dụng cho các dòng được tích chọn:</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Nút bật Panel Sửa hàng loạt */}
                    <button
                      type="button"
                      onClick={() => setIsBatchEditOpen(!isBatchEditOpen)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Edit3 size={13} /> Sửa giá trị hàng loạt...
                    </button>

                    {/* Nút Xóa hàng loạt đã chọn */}
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Trash2 size={13} /> Xóa {selectedIndices.length} dòng đã chọn
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedIndices([])}
                      className="px-2 py-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>
              )}

              {/* Panel Khung Sửa Hàng Loạt (Batch Edit Panel) */}
              {isBatchEditOpen && selectedIndices.length > 0 && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-wrap items-center gap-3 shrink-0 shadow-xs animate-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-indigo-700" />
                    <span className="text-xs font-bold text-indigo-950">Sửa hàng loạt giá trị cột:</span>
                  </div>

                  <select
                    value={batchEditCol}
                    onChange={(e) => setBatchEditCol(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">-- Chọn cột cần sửa --</option>
                    {columnMapping.map(c => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={batchEditVal}
                    onChange={(e) => setBatchEditVal(e.target.value)}
                    placeholder="Nhập giá trị mới áp dụng..."
                    className="px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-indigo-400 flex-1 min-w-[200px]"
                  />

                  <button
                    type="button"
                    onClick={handleApplyBatchEdit}
                    disabled={!batchEditCol}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${batchEditCol
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    <Check size={14} /> Áp dụng cho {selectedIndices.length} dòng
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsBatchEditOpen(false)}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-800 px-2 py-1"
                  >
                    Đóng
                  </button>
                </div>
              )}

              {/* Khung Bảng Preview */}
              <div className="flex-1 overflow-auto border border-gray-200 rounded-2xl bg-white shadow-inner">
                <table className="w-full text-left border-collapse text-[10px]" style={{ minWidth: '1900px' }}>
                  <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                    <tr>
                      {/* Checkbox Header */}
                      <th
                        className="py-1.5 px-2 font-bold text-gray-600 w-9 border-r border-gray-200 text-center"
                        style={{ minWidth: '36px', position: 'sticky', left: 0, zIndex: 12, backgroundColor: '#f9fafb' }}
                      >
                        <input
                          type="checkbox"
                          checked={isAllVisibleSelected}
                          onChange={handleToggleSelectAllVisible}
                          className="rounded border-gray-300 text-lime-600 focus:ring-lime-500 cursor-pointer"
                          title="Chọn tất cả dòng đang hiển thị"
                        />
                      </th>
                      {/* STT Header */}
                      <th
                        className="py-1.5 px-2 font-bold text-gray-600 w-10 border-r border-gray-200 text-center"
                        style={{ minWidth: '40px', position: 'sticky', left: '36px', zIndex: 12, backgroundColor: '#f9fafb' }}
                      >
                        STT
                      </th>
                      {/* Mapping headers */}
                      {columnMapping.map(col => {
                        const stickyStyle = getStickyThStyle(col.key);
                        return (
                          <th
                            key={col.key}
                            className="py-1.5 px-2 font-bold text-gray-600 border-r border-gray-200"
                            style={{ minWidth: getColMinWidth(col.key), ...stickyStyle }}
                          >
                            {col.label} {col.required && <span className="text-red-500">*</span>}
                          </th>
                        );
                      })}
                      <th className="py-1.5 px-2 font-bold text-gray-600 border-r border-gray-200" style={{ minWidth: '160px' }}>Trạng thái rà soát</th>
                      <th className="py-1.5 px-2 font-bold text-gray-600 w-12 text-center" style={{ minWidth: '60px' }}>Hành động</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleRowIndices.length === 0 && (
                      <tr>
                        <td colSpan={columnMapping.length + 4} className="py-12 text-center text-gray-500 bg-gray-50/50">
                          <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                            <CheckCircle className="text-emerald-500" size={36} />
                            <p className="font-bold text-gray-800 text-sm">Không còn dòng nào thuộc bộ lọc này!</p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              {filterMode === 'error'
                                ? 'Tất cả các dòng lỗi đã được xử lý hoặc xóa. Dòng trùng MSNV còn lại đã tự động chuyển sang trạng thái Hợp lệ (Sẵn sàng nhập).'
                                : 'Không tìm thấy dòng dữ liệu nào khớp với tiêu chí lọc.'}
                            </p>
                            <button
                              type="button"
                              onClick={() => setFilterMode('all')}
                              className="mt-2 px-4 py-1.5 bg-lime-600 hover:bg-lime-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <CheckCircle size={14} /> Hiển thị tất cả ({parsedData.length} dòng)
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {visibleRowIndices.map((originalIndex, displayIdx) => {
                      const item = parsedData[originalIndex];
                      const status = rowStatus[originalIndex];
                      const rowHasError = Object.keys(status?.errors || {}).length > 0;
                      const rowHasWarning = Object.keys(status?.warnings || {}).length > 0;
                      const isSelected = selectedIndices.includes(originalIndex);

                      let rowClass = 'hover:bg-gray-50';
                      let stickyBgClass = 'bg-white group-hover:bg-gray-50';

                      if (isSelected) {
                        rowClass = 'bg-indigo-50/70 hover:bg-indigo-50';
                        stickyBgClass = 'bg-indigo-50 group-hover:bg-indigo-100';
                      } else if (rowHasError) {
                        rowClass = 'bg-red-50/70 hover:bg-red-50';
                        stickyBgClass = 'bg-[#fef2f2] group-hover:bg-[#fee2e2]';
                      } else if (rowHasWarning) {
                        rowClass = 'bg-lime-50/40 hover:bg-lime-50/60';
                        stickyBgClass = 'bg-[#f7fee7] group-hover:bg-[#ecfccb]';
                      }

                      return (
                        <tr key={originalIndex} className={`group border-b border-gray-200 transition-colors ${rowClass}`}>
                          {/* Checkbox cell */}
                          <td
                            className={`py-1.5 px-2 text-center border-r border-gray-200 ${stickyBgClass}`}
                            style={{ minWidth: '36px', position: 'sticky', left: 0, zIndex: 2 }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectRow(originalIndex)}
                              className="rounded border-gray-300 text-lime-600 focus:ring-lime-500 cursor-pointer"
                            />
                          </td>

                          {/* STT cell */}
                          <td
                            className={`py-1.5 px-2 text-gray-400 font-semibold text-center border-r border-gray-200 ${stickyBgClass}`}
                            style={{ minWidth: '40px', position: 'sticky', left: '36px', zIndex: 2 }}
                          >
                            {originalIndex + 1}
                          </td>

                          {/* Data Cells */}
                          {columnMapping.map(col => {
                            const val = item[col.key];
                            const errorMsg = status?.errors[col.key];
                            const warningMsg = status?.warnings[col.key];

                            let cellClass = 'border-r border-gray-200 p-0';
                            if (errorMsg) cellClass += ' bg-red-100 text-red-800 font-medium';
                            else if (warningMsg) cellClass += ' bg-lime-100 text-lime-900';
                            else {
                              if (col.key === 'stt' || col.key === 'msnv' || col.key === 'ho_ten') {
                                cellClass += ` ${stickyBgClass}`;
                              }
                            }

                            let displayVal = val ?? '';
                            if (col.type === 'date' && val && val.includes('-')) {
                              const parts = val.split('-');
                              if (parts.length === 3) {
                                displayVal = `${parts[2]}/${parts[1]}/${parts[0]}`;
                              }
                            }

                            const stickyStyle = getStickyLeftStyle(col.key);

                            return (
                              <td
                                key={col.key}
                                className={`py-1 px-1.5 ${cellClass}`}
                                title={errorMsg || warningMsg}
                                style={{ minWidth: getColMinWidth(col.key), ...stickyStyle }}
                              >
                                <input
                                  type="text"
                                  value={displayVal}
                                  onChange={(e) => handleCellChange(originalIndex, col.key, e.target.value)}
                                  onBlur={(e) => handleCellBlur(originalIndex, col.key, e.target.value)}
                                  className="w-full bg-transparent border-0 focus:ring-1 focus:ring-lime-500 rounded px-1 py-0.5 outline-none font-medium text-[10px]"
                                  placeholder={col.label}
                                />
                              </td>
                            );
                          })}

                          {/* Trạng thái rà soát */}
                          <td className="py-1.5 px-2 border-r border-gray-200" style={{ minWidth: '160px' }}>
                            {rowHasError && (
                              <span className="text-red-600 font-bold flex items-center gap-1">
                                <AlertTriangle size={14} /> {Object.values(status.errors).join(', ')}
                              </span>
                            )}
                            {!rowHasError && rowHasWarning && (
                              <span className="text-lime-800 font-semibold flex items-center gap-1">
                                <AlertTriangle size={14} /> {Object.values(status.warnings).join(', ')}
                              </span>
                            )}
                            {!rowHasError && !rowHasWarning && (
                              <span className="text-emerald-600 font-medium flex items-center gap-1">
                                <CheckCircle size={14} /> Sẵn sàng nhập
                              </span>
                            )}
                          </td>

                          {/* Hành động Xóa */}
                          <td className="py-1.5 px-2 text-center" style={{ minWidth: '60px' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(originalIndex)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-colors cursor-pointer"
                              title="Xóa dòng này"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0">
          <div className="text-xs text-gray-500 font-medium">
            {parsedData.length > 0 && (
              <>
                Tổng cộng <span className="font-bold text-gray-800">{parsedData.length}</span> dòng.
                {filterMode !== 'all' && (
                  <span className="ml-1 text-gray-600">Đang lọc hiển thị: <span className="font-bold">{visibleRowIndices.length}</span> dòng.</span>
                )}
                {hasErrors ? (
                  <span className="text-red-600 font-bold ml-2">Còn {rowMetrics.errorRowsCount} dòng bị lỗi đỏ. Vui lòng sửa hoặc xóa dòng lỗi trước khi lưu.</span>
                ) : (
                  <span className="text-lime-700 font-bold ml-2">Tất cả {parsedData.length} dòng hợp lệ! Sẵn sàng nhập dữ liệu.</span>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-white hover:bg-gray-100 border border-gray-300 hover:border-gray-400 text-gray-700 font-bold rounded-2xl transition-all"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirmSave}
              disabled={hasErrors || parsedData.length === 0 || isSaving}
              className={`px-6 py-2 rounded-2xl font-bold flex items-center gap-2 shadow-lg transition-all ${hasErrors || parsedData.length === 0 || isSaving
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-lime-600 hover:bg-lime-700 text-white shadow-lime-100'
                }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Đang lưu...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Xác nhận & Lưu ({parsedData.length} dòng)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

