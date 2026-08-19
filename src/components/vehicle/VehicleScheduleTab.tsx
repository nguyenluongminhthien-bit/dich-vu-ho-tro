import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Plus, Edit, Trash2, X, AlertCircle, Loader2, Save,
  Calendar, Info, FileSpreadsheet, ChevronDown, ShieldCheck
} from 'lucide-react';
import { apiService } from '../../services/api';
import { TS_Xe, DonVi } from '../../types';
import { buildHierarchicalOptions } from '../../utils/hierarchy';
import { formatCurrencySpace as formatCurrency } from '../../utils/formatters';
import { exportVehicleSchedule } from '../../utils/exportExcel';
import { toast } from '../../utils/toast';
import Pagination from '../ui/Pagination';

// --- HELPERS CỤC BỘ ---
const getPurposeBadgeStyle = (purpose: string = '') => {
  const p = purpose.toLowerCase();
  if (p.includes('sửa chữa') || p.includes('sua chua')) return 'bg-orange-50 text-orange-700 border border-orange-200';
  if (p.includes('sự kiện') || p.includes('su kien') || p.includes('roadshow')) return 'bg-rose-50 text-rose-700 border border-rose-200';
  if (p.includes('công') || p.includes('cong')) return 'bg-blue-50 text-blue-700 border border-blue-200';
  if (p.includes('lái thử') || p.includes('lai thu')) return 'bg-violet-50 text-violet-700 border border-violet-200';
  if (p.includes('thay thế') || p.includes('thay the')) return 'bg-amber-50 text-amber-800 border border-amber-300';
  return 'bg-gray-100 text-gray-600 border border-gray-200';
};

// --- BỘ CHỌN NHIỀU PHÂN CẤP (MULTI-SELECT DROPDOWN) ---
interface MultiSelectDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  placeholder
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const displayText = selectedValues.length === 0
    ? placeholder
    : selectedValues.length === options.length
    ? 'Tất cả'
    : selectedValues.map(v => {
        const found = options.find(o => o.value === v);
        return found ? found.label.split(' (')[0] : v;
      }).join(', ');

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-[9px] font-bold text-gray-500 mb-0.5">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1 border border-gray-200 rounded-md text-[11px] outline-none focus:ring-1 focus:ring-[#05469B] bg-white font-medium flex justify-between items-center text-left h-7"
      >
        <span className="truncate pr-2 text-gray-800">{displayText}</span>
        <ChevronDown size={14} className="text-gray-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-52 overflow-y-auto custom-scrollbar p-1">
          {options.length === 0 ? (
            <div className="text-[11px] text-gray-400 p-2 text-center">Không có lựa chọn</div>
          ) : (
            <>
              {options.length > 1 && (
                <label className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer text-xs font-bold text-indigo-600 border-b border-gray-100 mb-1 select-none">
                  <input
                    type="checkbox"
                    checked={selectedValues.length === options.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange(options.map(o => o.value));
                      } else {
                        onChange([]);
                      }
                    }}
                    className="rounded text-[#05469B] focus:ring-[#05469B] w-3.5 h-3.5"
                  />
                  <span>Chọn tất cả ({options.length})</span>
                </label>
              )}
              {options.map(opt => {
                const isChecked = selectedValues.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer text-xs select-none transition-colors ${
                      isChecked ? 'font-bold text-[#05469B] bg-blue-50/20' : 'text-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(opt.value)}
                      className="rounded text-[#05469B] focus:ring-[#05469B] w-3.5 h-3.5"
                    />
                    <span className="truncate">{opt.label}</span>
                  </label>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// --- PROPS INTERFACE ---
interface Props {
  xeData: TS_Xe[];
  allowedDonViIds: string[];
  selectedUnitFilter: string;
  donViList: DonVi[];
  nhatKyData: any[];
  setNhatKyData: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function VehicleScheduleTab({
  xeData,
  allowedDonViIds,
  selectedUnitFilter,
  donViList,
  nhatKyData,
  setNhatKyData
}: Props) {
  // States bộ lọc
  const [nhatKySearchTerm, setNhatKySearchTerm] = useState('');
  const [nhatKyDateStart, setNhatKyDateStart] = useState('');
  const [nhatKyDateEnd, setNhatKyDateEnd] = useState('');
  const [selectedCarFiltersForNhatKy, setSelectedCarFiltersForNhatKy] = useState<string[]>([]);
  const [nhatKyFilterBrands, setNhatKyFilterBrands] = useState<string[]>([]);
  const [nhatKyFilterModels, setNhatKyFilterModels] = useState<string[]>([]);

  // States modal
  const [isNhatKyModalOpen, setIsNhatKyModalOpen] = useState(false);
  const [nhatKyModalMode, setNhatKyModalMode] = useState<'create' | 'update'>('create');
  const [nhatKyFormData, setNhatKyFormData] = useState<any>({
    id: '',
    id_don_vi: '',
    bien_so: '',
    nguoi_de_xuat: '',
    lai_xe: '',
    muc_dich_su_dung: 'Sửa chữa lưu động',
    thoi_gian_su_dung: '',
    noi_di: '',
    noi_den: '',
    so_km_di: '',
    so_km_ve: '',
    tong_km: '',
    file_name: ''
  });

  // State tiến trình & Xóa bản ghi
  const [isParsing, setIsParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<any>(null);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Tự động reset bộ lọc con khi thay đổi Đơn vị quản lý
  useEffect(() => {
    setNhatKyFilterBrands([]);
    setNhatKyFilterModels([]);
    setSelectedCarFiltersForNhatKy([]);
  }, [selectedUnitFilter]);

  // Cascade dropdown options
  const nhatKyBrandOptions = useMemo(() => {
    let filtered = xeData.filter((x: any) => allowedDonViIds.includes(x.id_don_vi));
    if (selectedUnitFilter) {
      const childUnitIds = donViList.filter(item => item.cap_quan_ly === selectedUnitFilter).map(c => c.id);
      const validIds = [selectedUnitFilter, ...childUnitIds];
      filtered = filtered.filter((item: any) => validIds.includes(item.id_don_vi));
    }
    return [...new Set(filtered.map((x: any) => x.hieu_xe).filter(Boolean))].sort() as string[];
  }, [xeData, allowedDonViIds, selectedUnitFilter, donViList]);

  const nhatKyModelOptions = useMemo(() => {
    let filtered = xeData.filter((x: any) => allowedDonViIds.includes(x.id_don_vi));
    if (selectedUnitFilter) {
      const childUnitIds = donViList.filter(item => item.cap_quan_ly === selectedUnitFilter).map(c => c.id);
      const validIds = [selectedUnitFilter, ...childUnitIds];
      filtered = filtered.filter((item: any) => validIds.includes(item.id_don_vi));
    }
    if (nhatKyFilterBrands.length > 0) {
      filtered = filtered.filter((x: any) => nhatKyFilterBrands.includes(x.hieu_xe));
    }
    return [...new Set(filtered.map((x: any) => x.loai_xe).filter(Boolean))].sort() as string[];
  }, [xeData, allowedDonViIds, selectedUnitFilter, donViList, nhatKyFilterBrands]);

  const nhatKyPlateOptions = useMemo(() => {
    let filtered = xeData.filter((x: any) => allowedDonViIds.includes(x.id_don_vi));
    if (selectedUnitFilter) {
      const childUnitIds = donViList.filter(item => item.cap_quan_ly === selectedUnitFilter).map(c => c.id);
      const validIds = [selectedUnitFilter, ...childUnitIds];
      filtered = filtered.filter((item: any) => validIds.includes(item.id_don_vi));
    }
    if (nhatKyFilterBrands.length > 0) {
      filtered = filtered.filter((x: any) => nhatKyFilterBrands.includes(x.hieu_xe));
    }
    if (nhatKyFilterModels.length > 0) {
      filtered = filtered.filter((x: any) => nhatKyFilterModels.includes(x.loai_xe));
    }
    return filtered;
  }, [xeData, allowedDonViIds, selectedUnitFilter, donViList, nhatKyFilterBrands, nhatKyFilterModels]);

  const filteredNhatKy = useMemo(() => {
    let result = nhatKyData.filter(item => allowedDonViIds.includes(item.id_don_vi));
    if (selectedUnitFilter) {
      const childUnitIds = donViList.filter(item => item.cap_quan_ly === selectedUnitFilter).map(c => c.id);
      const validIds = [selectedUnitFilter, ...childUnitIds];
      result = result.filter(item => validIds.includes(item.id_don_vi));
    }
    if (nhatKySearchTerm) {
      const lower = nhatKySearchTerm.toLowerCase();
      result = result.filter(item =>
        (item.bien_so || '').toLowerCase().includes(lower) ||
        (item.lai_xe || '').toLowerCase().includes(lower) ||
        (item.nguoi_de_xuat || '').toLowerCase().includes(lower) ||
        (item.noi_di || '').toLowerCase().includes(lower) ||
        (item.noi_den || '').toLowerCase().includes(lower)
      );
    }
    if (nhatKyFilterBrands.length > 0) {
      const brandPlates = xeData.filter((x: any) => nhatKyFilterBrands.includes(x.hieu_xe)).map((x: any) => x.bien_so);
      result = result.filter(item => brandPlates.includes(item.bien_so));
    }
    if (nhatKyFilterModels.length > 0) {
      const modelPlates = xeData.filter((x: any) => nhatKyFilterModels.includes(x.loai_xe)).map((x: any) => x.bien_so);
      result = result.filter(item => modelPlates.includes(item.bien_so));
    }
    if (selectedCarFiltersForNhatKy.length > 0) {
      result = result.filter(item => selectedCarFiltersForNhatKy.includes(item.bien_so));
    }
    if (nhatKyDateStart) {
      result = result.filter(item => {
        const recordDateStr = item.created_at ? item.created_at.split('T')[0] : '';
        return recordDateStr >= nhatKyDateStart;
      });
    }
    if (nhatKyDateEnd) {
      result = result.filter(item => {
        const recordDateStr = item.created_at ? item.created_at.split('T')[0] : '';
        return recordDateStr <= nhatKyDateEnd;
      });
    }
    return result;
  }, [nhatKyData, xeData, selectedUnitFilter, allowedDonViIds, donViList, nhatKySearchTerm, nhatKyFilterBrands, nhatKyFilterModels, selectedCarFiltersForNhatKy, nhatKyDateStart, nhatKyDateEnd]);

  // Phân trang dữ liệu
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredNhatKy.slice(start, start + rowsPerPage);
  }, [filteredNhatKy, currentPage, rowsPerPage]);

  const totalPages = Math.max(Math.ceil(filteredNhatKy.length / rowsPerPage), 1);

  // Reset về trang 1 khi lọc thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [nhatKySearchTerm, nhatKyDateStart, nhatKyDateEnd, selectedCarFiltersForNhatKy, nhatKyFilterBrands, nhatKyFilterModels]);

  // Load PDF.js dynamically
  const loadPdfJS = async () => {
    if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.onload = () => {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        resolve((window as any).pdfjsLib);
      };
      script.onerror = () => reject(new Error('Không thể tải thư viện xử lý PDF (PDF.js).'));
      document.head.appendChild(script);
    });
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const pdfjs = await loadPdfJS();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();
      
      const items = textContent.items.map((item: any) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5]
      }));

      items.sort((a: any, b: any) => {
        if (Math.abs(a.y - b.y) < 5) return a.x - b.x;
        return b.y - a.y;
      });

      let fullText = '';
      let currentY = items[0]?.y;
      for (const item of items) {
        if (currentY && Math.abs(item.y - currentY) >= 5) {
          fullText += '\n';
          currentY = item.y;
        }
        fullText += item.text + ' ';
      }

      // Regex parser
      let bienSo = '';
      const bienSoMatch = fullText.match(/(?:Biển ki[ếể]m soát|Biển kiểm soát|Biển số|Biển số:|Biển kiếm soát:|Kiểm soát)\s*:\s*([0-9A-Z\-\.\s]{7,15})/i) || 
                          fullText.match(/(?:Biển ki[ếể]m soát|Biển kiểm soát|Biển số|Biển số:|Biển kiếm soát:|Kiểm soát)\s*([0-9A-Z\-\.\s]{7,15})/i);
      if (bienSoMatch) {
        bienSo = bienSoMatch[1].trim().toUpperCase().split(/\s{2,}/)[0].replace(/[\s\-\.]/g, '');
        if (bienSo.length >= 7) {
          const matchPlate = bienSo.match(/^(\d{2}[A-Z])(\d{4,5})$/);
          if (matchPlate) {
            bienSo = `${matchPlate[1]}-${matchPlate[2]}`;
          }
        }
      }

      let mucDich = 'Khác';
      const cleanTextLower = fullText.toLowerCase();
      const mucDichTrueMatch = fullText.match(/Mục đích\s*:\s*(TRUE|FALSE)\s+(TRUE|FALSE)\s+(TRUE|FALSE)/i);
      if (mucDichTrueMatch) {
        if (mucDichTrueMatch[1].toUpperCase() === 'TRUE') {
          mucDich = 'Sửa chữa lưu động';
        } else if (mucDichTrueMatch[2].toUpperCase() === 'TRUE') {
          mucDich = 'Phục vụ sự kiện, roadshow';
        } else if (mucDichTrueMatch[3].toUpperCase() === 'TRUE') {
          mucDich = 'Khác';
        }
      } else {
        const patternSuaChua = /(?:\[[x|v|*]\]|☑|☒)\s*sửa chữa lưu động/i;
        const patternSuKien = /(?:\[[x|v|*]\]|☑|☒)\s*phục vụ sự kiện/i;
        const patternKhac = /(?:\[[x|v|*]\]|☑|☒)\s*khác/i;

        if (patternSuaChua.test(cleanTextLower) || cleanTextLower.includes('[x] sửa chữa lưu động') || cleanTextLower.includes('☑ sửa chữa lưu động')) {
          mucDich = 'Sửa chữa lưu động';
        } else if (patternSuKien.test(cleanTextLower) || cleanTextLower.includes('[x] phục vụ sự kiện') || cleanTextLower.includes('☑ phục vụ sự kiện')) {
          mucDich = 'Phục vụ sự kiện, roadshow';
        } else if (patternKhac.test(cleanTextLower) || cleanTextLower.includes('[x] khác') || cleanTextLower.includes('☑ khác')) {
          mucDich = 'Khác';
        } else {
          if (cleanTextLower.includes('sửa chữa lưu động')) {
            mucDich = 'Sửa chữa lưu động';
          } else if (cleanTextLower.includes('sự kiện') || cleanTextLower.includes('roadshow')) {
            mucDich = 'Phục vụ sự kiện, roadshow';
          }
        }
      }

      let nguoiDeXuat = '';
      const nguoiDeXuatMatch = fullText.match(/Người đề xuất\s*:\s*(.*?)(?=\s*(?:Chức vụ|Loại xe|$))/i) || 
                               fullText.match(/(?:Người đề xuất|Người đề xuất:)\s*(.*?)(?=\s*(?:Chức vụ|Loại xe|$))/i);
      if (nguoiDeXuatMatch) {
        nguoiDeXuat = nguoiDeXuatMatch[1].trim();
      }

      let laiXe = '';
      const laiXeMatch = fullText.match(/Họ tên\s+(.*?)(?=\s*(?:Chức vụ|Bằng lái|$))/i) || 
                         fullText.match(/(?:Nhân sự lái xe|Họ tên|Tài xế|Lái xe)\s*:\s*(.*?)(?=\s*(?:Chức vụ|Bằng lái|$))/i);
      if (laiXeMatch) {
        laiXe = laiXeMatch[1].trim();
      }

      let thoiGian = '';
      const thoiGianMatch = fullText.match(/(?:Thời gian sử dụng xe|Thời gian sử dụng|Thời gian)\s*:\s*([^\n\:]+)/i);
      if (thoiGianMatch) {
        thoiGian = thoiGianMatch[1].trim();
        if (thoiGian.toLowerCase().includes('lộ trình')) {
          thoiGian = thoiGian.split(/lộ trình/i)[0].trim();
        }
      }
      
      const giaoXeTimeMatch = fullText.match(/XÁC NHẬN GIAO XE:\s*(?:Lúc|luc)\s*([^\n\,]+)/i);
      if (giaoXeTimeMatch && !thoiGian.includes(':')) {
        const timePart = giaoXeTimeMatch[1].trim();
        if (timePart && !timePart.includes('…')) {
          thoiGian = `${timePart}, Ngày ${thoiGian}`;
        }
      }

      let noiDi = '';
      let noiDen = '';
      const noiDiMatch = fullText.match(/(?:Nơi đi)\s*:\s*([^\n]+)/i);
      if (noiDiMatch) {
        noiDi = noiDiMatch[1].trim();
        if (noiDi.toLowerCase().includes('nơi đến')) {
          noiDi = noiDi.split(/nơi đến/i)[0].trim();
        }
      }

      const noiDenMatch = fullText.match(/(?:Nơi đến)\s*:\s*([^\n]+)/i);
      if (noiDenMatch) {
        noiDen = noiDenMatch[1].trim();
        if (noiDen.toLowerCase().includes('nhân sự')) {
          noiDen = noiDen.split(/nhân sự/i)[0].trim();
        }
      }

      let kmDi = '';
      const giaoXeIndex = fullText.indexOf('XÁC NHẬN GIAO XE');
      if (giaoXeIndex !== -1) {
        const afterGiaoXe = fullText.substring(giaoXeIndex, giaoXeIndex + 300);
        const odoMatch = afterGiaoXe.match(/(?:ODO lúc giao xe|ODO giao xe|ODO:|ODO)\s*:\s*(\d+)/i) || 
                         afterGiaoXe.match(/(?:ODO lúc giao xe|ODO giao xe|ODO:|ODO)\s*(\d+)/i);
        if (odoMatch) kmDi = odoMatch[1];
      }

      let kmVe = '';
      const traXeIndex = fullText.indexOf('XÁC NHẬN TRẢ XE');
      if (traXeIndex !== -1) {
        const afterTraXe = fullText.substring(traXeIndex, traXeIndex + 300);
        const odoMatch = afterTraXe.match(/(?:ODO lúc nhận xe|ODO lúc trả xe|ODO trả xe|ODO:|ODO)\s*:\s*(\d+)/i) || 
                         afterTraXe.match(/(?:ODO lúc nhận xe|ODO lúc trả xe|ODO trả xe|ODO:|ODO)\s*(\d+)/i);
        if (odoMatch) kmVe = odoMatch[1];
      }

      let matchedVehicle = xeData.find(x => x.bien_so.toUpperCase().replace(/[\s\-\.]/g, '') === bienSo.replace(/[\s\-\.]/g, ''));
      let idDonVi = selectedUnitFilter || (matchedVehicle ? matchedVehicle.id_don_vi : '');

      setNhatKyFormData({
        id_don_vi: idDonVi,
        bien_so: matchedVehicle ? matchedVehicle.bien_so : bienSo,
        nguoi_de_xuat: nguoiDeXuat,
        lai_xe: laiXe,
        muc_dich_su_dung: mucDich,
        thoi_gian_su_dung: thoiGian,
        noi_di: noiDi,
        noi_den: noiDen,
        so_km_di: kmDi ? Number(kmDi) : '',
        so_km_ve: kmVe ? Number(kmVe) : '',
        tong_km: (kmDi && kmVe) ? Number(kmVe) - Number(kmDi) : '',
        file_name: file.name
      });
      setNhatKyModalMode('create');
      setIsNhatKyModalOpen(true);
      toast.success('Đọc PDF thành công! Vui lòng kiểm tra lại thông tin.');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Lỗi đọc file PDF.');
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  const openNhatKyModal = (mode: 'create' | 'update', item?: any) => {
    setNhatKyModalMode(mode);
    if (item) {
      setNhatKyFormData({ ...item });
    } else {
      setNhatKyFormData({
        id: '',
        id_don_vi: selectedUnitFilter || '',
        bien_so: '',
        nguoi_de_xuat: '',
        lai_xe: '',
        muc_dich_su_dung: 'Sửa chữa lưu động',
        thoi_gian_su_dung: '',
        noi_di: '',
        noi_den: '',
        so_km_di: '',
        so_km_ve: '',
        tong_km: '',
        file_name: ''
      });
    }
    setIsNhatKyModalOpen(true);
  };

  const handleNhatKySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nhatKyFormData.bien_so) return toast.warning('Vui lòng nhập Biển kiểm soát!');
    if (!nhatKyFormData.id_don_vi) return toast.warning('Vui lòng chọn Đơn vị quản lý!');

    setSubmitting(true);
    try {
      const payload = { ...nhatKyFormData };
      if (payload.so_km_di && payload.so_km_ve) {
        payload.tong_km = Number(payload.so_km_ve) - Number(payload.so_km_di);
      } else {
        payload.tong_km = null;
      }

      if (nhatKyModalMode === 'create' && !payload.id) {
        payload.id = `NKSD-${Date.now()}`;
        payload.created_at = new Date().toISOString();
      }

      // Tự động cập nhật ODO cho phiếu trước đó
      if (nhatKyModalMode === 'create' && payload.so_km_di) {
        const vehicleLogs = nhatKyData
          .filter(item => item.bien_so === payload.bien_so)
          .sort((a, b) => {
            const dateA = a.created_at || a.id || '';
            const dateB = b.created_at || b.id || '';
            return dateB.localeCompare(dateA);
          });

        if (vehicleLogs.length > 0) {
          const prevLog = { ...vehicleLogs[0] };
          prevLog.so_km_ve = Number(payload.so_km_di);
          if (prevLog.so_km_di) {
            prevLog.tong_km = Number(prevLog.so_km_ve) - Number(prevLog.so_km_di);
          }
          try {
            await apiService.save(prevLog, 'update', 'nk_su_dung_xe');
            setNhatKyData(prev => prev.map(item => item.id === prevLog.id ? prevLog : item));
          } catch (error) {
            console.error('Lỗi tự động cập nhật ODO phiếu trước:', error);
          }
        }
      }

      const response = await apiService.save(payload, nhatKyModalMode, 'nk_su_dung_xe');
      const savedId = response?.id || response?.newId || payload.id;
      const savedRecord = { ...payload, id: savedId };

      if (nhatKyModalMode === 'create') {
        setNhatKyData(prev => [savedRecord, ...prev]);
        toast.success('Đã lưu nhật ký sử dụng xe mới!');
      } else {
        setNhatKyData(prev => prev.map(item => item.id === savedId ? savedRecord : item));
        toast.success('Đã cập nhật nhật ký sử dụng xe!');
      }
      setIsNhatKyModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Lỗi lưu thông tin Nhật ký sử dụng xe.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNhatKyInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNhatKyFormData((prev: any) => {
      const updated = { ...prev, [name]: value };
      if (name === 'id_don_vi') {
        updated.bien_so = '';
      }
      if (name === 'so_km_di' || name === 'so_km_ve') {
        const di = name === 'so_km_di' ? Number(value) : Number(prev.so_km_di);
        const ve = name === 'so_km_ve' ? Number(value) : Number(prev.so_km_ve);
        if (di && ve) {
          updated.tong_km = ve - di;
        } else {
          updated.tong_km = '';
        }
      }
      return updated;
    });
  };

  const confirmDeleteLog = async () => {
    if (!logToDelete) return;
    setSubmitting(true);
    try {
      await apiService.delete(logToDelete.id, 'nk_su_dung_xe');
      setNhatKyData(prev => prev.filter(item => item.id !== logToDelete.id));
      toast.success('Đã xóa nhật ký sử dụng xe thành công!');
      setIsDeleteConfirmOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Lỗi khi xóa nhật ký.');
    } finally {
      setSubmitting(false);
      setLogToDelete(null);
    }
  };

  const handleDeleteClick = (log: any) => {
    setLogToDelete(log);
    setIsDeleteConfirmOpen(true);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      {/* Khối điều khiển & Bộ lọc */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
        
        {/* 1. Khu vực đẩy file PDF */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 flex flex-col justify-between h-[110px] shrink-0">
          <div className="flex items-center gap-1.5 border-b border-gray-50 pb-1 shrink-0">
            <Calendar size={15} className="text-[#05469B]" />
            <span className="font-bold text-gray-800 text-xs">Khai báo lịch trình (PDF ký duyệt)</span>
          </div>
          <div className="flex items-center gap-2 flex-1 mt-1.5">
            <label className="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-indigo-200 hover:border-indigo-500 rounded-lg h-9 cursor-pointer bg-indigo-50/20 hover:bg-indigo-50 transition-all text-center">
              {isParsing ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              ) : (
                <Plus size={16} className="text-indigo-500" />
              )}
              <span className="text-[11px] font-bold text-indigo-700">{isParsing ? 'Đang đọc...' : 'Chọn file PDF'}</span>
              <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={isParsing} />
            </label>
            <button
              onClick={() => openNhatKyModal('create')}
              className="h-9 px-3 bg-white border border-gray-200 hover:border-[#05469B] hover:text-[#05469B] text-gray-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs shadow-neutral-100"
            >
              <Plus size={14} />
              Nhập thủ công
            </button>
          </div>
        </div>

        {/* 2. Bộ lọc tìm kiếm */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 lg:col-span-2 flex flex-col justify-between h-[110px] shrink-0">
          <div className="flex justify-between items-center pb-1 border-b border-gray-50 shrink-0">
            <h4 className="font-bold text-gray-800 text-xs flex items-center gap-1"><Search size={15} className="text-[#05469B]" /> Bộ lọc Nhật ký hành trình</h4>
            <div className="flex items-center gap-3">
              {(nhatKySearchTerm || nhatKyDateStart || nhatKyDateEnd || selectedCarFiltersForNhatKy.length > 0 || nhatKyFilterBrands.length > 0 || nhatKyFilterModels.length > 0) && (
                <button
                  onClick={() => {
                    setNhatKySearchTerm('');
                    setNhatKyDateStart('');
                    setNhatKyDateEnd('');
                    setSelectedCarFiltersForNhatKy([]);
                    setNhatKyFilterBrands([]);
                    setNhatKyFilterModels([]);
                  }}
                  className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
                >
                  <X size={12} /> Xóa bộ lọc
                </button>
              )}
              <button
                onClick={() => {
                  const exportPlates = selectedCarFiltersForNhatKy.length > 0 
                    ? selectedCarFiltersForNhatKy 
                    : nhatKyPlateOptions.map(x => x.bien_so);
                  exportVehicleSchedule(filteredNhatKy, xeData, nhatKyDateStart, nhatKyDateEnd, exportPlates);
                }}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                title="Xuất nhật ký ra file Excel"
              >
                <FileSpreadsheet size={13} />
                Xuất nhật ký
              </button>
            </div>
          </div>
          
          {/* Grid các trường lọc */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2 flex-1 mt-1.5">
            <div className="flex flex-col justify-center">
              <label className="block text-[9px] font-bold text-gray-500 mb-0.5">Tìm kiếm từ khóa</label>
              <input
                type="text"
                placeholder="Tìm biển số, lái xe..."
                className="w-full px-2 py-1 border border-gray-200 rounded-md text-[11px] outline-none focus:ring-1 focus:ring-[#05469B] h-7"
                value={nhatKySearchTerm}
                onChange={e => setNhatKySearchTerm(e.target.value)}
              />
            </div>
            
            <MultiSelectDropdown
              label="Hãng xe"
              placeholder="Tất cả Hãng"
              options={nhatKyBrandOptions.map(b => ({ value: b, label: b }))}
              selectedValues={nhatKyFilterBrands}
              onChange={(brands) => {
                setNhatKyFilterBrands(brands);
                setNhatKyFilterModels([]);
                setSelectedCarFiltersForNhatKy([]);
              }}
            />

            <MultiSelectDropdown
              label="Loại xe"
              placeholder="Tất cả Loại xe"
              options={nhatKyModelOptions.map(m => ({ value: m, label: m }))}
              selectedValues={nhatKyFilterModels}
              onChange={(models) => {
                setNhatKyFilterModels(models);
                setSelectedCarFiltersForNhatKy([]);
              }}
            />

            <MultiSelectDropdown
              label="Biển kiểm soát"
              placeholder="Tất cả xe"
              options={nhatKyPlateOptions.map(x => ({ value: x.bien_so, label: x.bien_so }))}
              selectedValues={selectedCarFiltersForNhatKy}
              onChange={setSelectedCarFiltersForNhatKy}
            />

            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex flex-col justify-center">
                <label className="block text-[9px] font-bold text-gray-500 mb-0.5">Từ ngày</label>
                <input
                  type="date"
                  className="w-full px-1.5 py-0.5 border border-gray-200 rounded-md text-[11px] outline-none focus:ring-1 focus:ring-[#05469B] h-7"
                  value={nhatKyDateStart}
                  onChange={e => setNhatKyDateStart(e.target.value)}
                />
              </div>
              <div className="flex flex-col justify-center">
                <label className="block text-[9px] font-bold text-gray-500 mb-0.5">Đến ngày</label>
                <input
                  type="date"
                  className="w-full px-1.5 py-0.5 border border-gray-200 rounded-md text-[11px] outline-none focus:ring-1 focus:ring-[#05469B] h-7"
                  value={nhatKyDateEnd}
                  onChange={e => setNhatKyDateEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng Nhật ký Hành trình PC */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 w-full flex-1 min-h-0 overflow-auto custom-scrollbar">
        <table className="w-full table-fixed text-left border-collapse min-w-[1100px] text-[12px]">
          <thead className="sticky top-0 bg-[#f8fafc] z-10">
            <tr className="border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
              <th className="py-3 px-3 w-[15%] bg-[#f8fafc]">Giờ, Ngày/tháng/năm</th>
              <th className="py-3 px-3 w-[10%] bg-[#f8fafc]">Biển kiểm soát</th>
              <th className="py-3 px-3 w-[15%] bg-[#f8fafc]">Lái xe / Người đề xuất</th>
              <th className="py-3 px-3 w-[12%] bg-[#f8fafc]">Mục đích sử dụng</th>
              <th className="py-3 px-3 w-[20%] bg-[#f8fafc]">Lộ trình</th>
              <th className="py-3 px-3 w-[8%] bg-[#f8fafc] text-right">Km Đi</th>
              <th className="py-3 px-3 w-[8%] bg-[#f8fafc] text-right">Km Về</th>
              <th className="py-3 px-3 w-[8%] bg-[#f8fafc] text-right font-bold text-indigo-700">Tổng Km</th>
              <th className="py-3 px-3 text-center w-[12%] bg-[#f8fafc]">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-gray-400 italic">
                  Không tìm thấy nhật ký xe nào phù hợp bộ lọc.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group text-gray-700">
                  <td className="py-3 px-3 font-semibold text-gray-800 align-middle whitespace-pre-line leading-relaxed">
                    {item.thoi_gian_su_dung || '---'}
                  </td>
                  <td className="py-3 px-3 font-black text-[#05469B] text-[13px] align-middle">
                    🚙 {item.bien_so}
                  </td>
                  <td className="py-3 px-3 align-middle">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-gray-800">{item.lai_xe || '---'}</span>
                      {item.nguoi_de_xuat && <span className="text-[10px] text-gray-400 font-medium">Đề xuất: {item.nguoi_de_xuat}</span>}
                    </div>
                  </td>
                  <td className="py-3 px-3 align-middle">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black ${getPurposeBadgeStyle(item.muc_dich_su_dung)}`}>
                      {item.muc_dich_su_dung || '---'}
                    </span>
                  </td>
                  <td className="py-3 px-3 align-middle">
                    <div className="flex flex-col gap-0.5 leading-snug">
                      <span className="font-bold text-emerald-600 text-[11.5px] truncate max-w-full" title={`Đi từ: ${item.noi_di}`}><span className="text-gray-400">Đi:</span> {item.noi_di || '---'}</span>
                      <span className="font-bold text-indigo-600 text-[11.5px] truncate max-w-full" title={`Đến: ${item.noi_den}`}><span className="text-gray-400">Đến:</span> {item.noi_den || '---'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right align-middle font-medium text-gray-600">
                    {item.so_km_di ? formatCurrency(item.so_km_di) : '---'}
                  </td>
                  <td className="py-3 px-3 text-right align-middle font-medium text-gray-600">
                    {item.so_km_ve ? formatCurrency(item.so_km_ve) : '---'}
                  </td>
                  <td className="py-3 px-3 text-right align-middle font-black text-indigo-700 bg-indigo-50/30">
                    {item.tong_km ? `${formatCurrency(item.tong_km)} Km` : '---'}
                  </td>
                  <td className="py-3 px-3 align-middle text-center">
                    <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openNhatKyModal('update', item)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 shadow-2xs" title="Sửa">
                        <Edit size={13} />
                      </button>
                      <button onClick={() => handleDeleteClick(item)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 shadow-2xs" title="Xóa">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Nhật ký hành trình Mobile Cards */}
      <div className="block md:hidden flex-1 min-h-0 overflow-y-auto space-y-4 custom-scrollbar">
        {paginatedLogs.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-400 italic">Chưa có nhật ký sử dụng xe nào.</div>
        ) : (
          paginatedLogs.map((item) => (
            <div key={item.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3 relative">
              <div className="pb-2.5 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <span className="font-black text-[#05469B] text-sm">🚙 {item.bien_so}</span>
                  <span className="block text-[10px] text-gray-400 mt-0.5">{item.thoi_gian_su_dung || '---'}</span>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black ${getPurposeBadgeStyle(item.muc_dich_su_dung)}`}>
                  {item.muc_dich_su_dung || '---'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-600">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Lái xe</p>
                  <p className="font-bold text-gray-700 mt-0.5">{item.lai_xe || '---'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Người đề xuất</p>
                  <p className="font-bold text-gray-700 mt-0.5">{item.nguoi_de_xuat || '---'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Lộ trình</p>
                  <p className="font-semibold text-gray-700 mt-0.5"><span className="text-emerald-600 font-bold">Đi:</span> {item.noi_di || '---'} <span className="text-indigo-600 font-bold">➔ Đến:</span> {item.noi_den || '---'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Km lúc giao/nhận</p>
                  <p className="font-semibold text-gray-700 mt-0.5">{item.so_km_di ? formatCurrency(item.so_km_di) : '---'} ➔ {item.so_km_ve ? formatCurrency(item.so_km_ve) : '---'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase">Tổng Km hành trình</p>
                  <p className="font-black text-indigo-700 mt-0.5">{item.tong_km ? `${formatCurrency(item.tong_km)} Km` : '---'}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => openNhatKyModal('update', item)} className="py-1 px-3 border border-blue-200 text-blue-600 bg-blue-50/50 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1"><Edit size={12} /> Sửa</button>
                <button onClick={() => handleDeleteClick(item)} className="py-1 px-3 border border-red-200 text-red-600 bg-red-50/50 hover:bg-red-100 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1"><Trash2 size={12} /> Xóa</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination control */}
      <div className="shrink-0 pt-2">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalRows={filteredNhatKy.length}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setCurrentPage(1); }}
          itemName="nhật ký"
        />
      </div>

      {/* --- MODAL NHẬP NHẬT KÝ SỬ DỤNG XE --- */}
      {isNhatKyModalOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-h-[95vh] sm:max-h-[90vh] sm:max-w-3xl flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in duration-200 mt-auto sm:mt-0 overflow-hidden">
            <div className="flex justify-between p-4 sm:p-5 border-b border-gray-100 bg-gray-50 rounded-t-3xl sm:rounded-t-2xl shrink-0">
              <h3 className="text-xl font-bold text-[#05469B] flex items-center gap-2"><Calendar size={24} /> {nhatKyModalMode === 'create' ? 'Đăng ký Lịch trình / Nhật ký sử dụng xe' : 'Cập nhật Nhật ký sử dụng xe'}</h3>
              <button onClick={() => setIsNhatKyModalOpen(false)} className="text-gray-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleNhatKySave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-white">
                
                {nhatKyFormData.file_name && (
                  <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 text-xs font-bold flex items-center gap-2">
                    <ShieldCheck size={16} /> File đã phân tích: <span className="underline">{nhatKyFormData.file_name}</span> (Các trường thông tin đã tự động điền)
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Biển kiểm soát */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Biển kiểm soát *</label>
                    <select
                      required
                      name="bien_so"
                      value={nhatKyFormData.bien_so || ''}
                      onChange={handleNhatKyInputChange}
                      className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] font-bold text-gray-800 text-xs"
                    >
                      <option value="">-- Chọn xe --</option>
                      {xeData.filter(x => !nhatKyFormData.id_don_vi || x.id_don_vi === nhatKyFormData.id_don_vi).map(x => (
                        <option key={x.id} value={x.bien_so}>{x.bien_so} ({x.hieu_xe} {x.loai_xe})</option>
                      ))}
                    </select>
                  </div>

                  {/* Đơn vị quản lý */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Đơn vị quản lý *</label>
                    <select
                      required
                      name="id_don_vi"
                      value={nhatKyFormData.id_don_vi || ''}
                      onChange={handleNhatKyInputChange}
                      className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] font-medium text-gray-800 text-xs"
                      style={{ fontFamily: 'monospace, sans-serif' }}
                    >
                      <option value="">-- Chọn đơn vị --</option>
                      {buildHierarchicalOptions(donViList.filter(dv => allowedDonViIds.includes(dv.id))).map(({ unit, prefix }) => (
                        <option key={unit.id} value={unit.id}>
                          {prefix}{unit.ten_don_vi}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Người đề xuất */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Người đề xuất sử dụng *</label>
                    <input type="text" required name="nguoi_de_xuat" value={nhatKyFormData.nguoi_de_xuat || ''} onChange={handleNhatKyInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#05469B] text-xs font-medium" />
                  </div>

                  {/* Nhân sự lái xe */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nhân sự lái xe *</label>
                    <input type="text" required name="lai_xe" value={nhatKyFormData.lai_xe || ''} onChange={handleNhatKyInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#05469B] text-xs font-medium" />
                  </div>

                  {/* Mục đích sử dụng */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Mục đích sử dụng *</label>
                    <select
                      required
                      name="muc_dich_su_dung"
                      value={nhatKyFormData.muc_dich_su_dung || ''}
                      onChange={handleNhatKyInputChange}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] text-xs font-medium"
                    >
                      <option value="Sửa chữa lưu động">Sửa chữa lưu động</option>
                      <option value="Phục vụ sự kiện, roadshow">Phục vụ sự kiện, roadshow</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  {/* Thời gian sử dụng */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Thời gian sử dụng xe *</label>
                    <input type="text" required name="thoi_gian_su_dung" placeholder="Ví dụ: 08h30, Ngày 15/08/2026" value={nhatKyFormData.thoi_gian_su_dung || ''} onChange={handleNhatKyInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#05469B] text-xs font-medium" />
                  </div>

                  {/* Lộ trình: Nơi đi */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nơi đi (Lộ trình)</label>
                    <input type="text" name="noi_di" value={nhatKyFormData.noi_di || ''} onChange={handleNhatKyInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#05469B] text-xs font-medium" />
                  </div>

                  {/* Lộ trình: Nơi đến */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nơi đến (Lộ trình)</label>
                    <input type="text" name="noi_den" value={nhatKyFormData.noi_den || ''} onChange={handleNhatKyInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#05469B] text-xs font-medium" />
                  </div>

                  {/* ODO giao xe */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">ODO lúc giao xe (Km đi)</label>
                    <input type="number" name="so_km_di" value={nhatKyFormData.so_km_di || ''} onChange={handleNhatKyInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#05469B] text-xs font-medium" />
                  </div>

                  {/* ODO nhận xe */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">ODO lúc nhận xe (Km về)</label>
                    <input type="number" name="so_km_ve" value={nhatKyFormData.so_km_ve || ''} onChange={handleNhatKyInputChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#05469B] text-xs font-medium" />
                  </div>

                  {/* Tổng Km di chuyển */}
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Tổng Km hành trình (Km về - Km đi)</label>
                    <input type="text" disabled value={nhatKyFormData.tong_km ? `${formatCurrency(nhatKyFormData.tong_km)} Km` : '---'} className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 outline-none text-xs font-black text-indigo-700" />
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0 rounded-b-2xl gap-3">
                <button type="button" onClick={() => setIsNhatKyModalOpen(false)} className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-colors text-xs">Hủy</button>
                <button type="submit" disabled={submitting} className="w-full sm:w-auto px-6 py-2.5 bg-[#05469B] hover:bg-[#003b80] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md text-xs">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu Nhật Ký Sử Dụng
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* --- XÁC NHẬN XÓA LỊCH TRÌNH CỤC BỘ --- */}
      {isDeleteConfirmOpen && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center animate-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border-4 border-red-100">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa nhật ký</h3>
            <p className="text-gray-500 text-sm mb-6">Bạn có chắc chắn muốn xóa bản ghi nhật ký hành trình này vĩnh viễn?</p>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteConfirmOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition-colors text-xs">Hủy</button>
              <button onClick={confirmDeleteLog} disabled={submitting} className="flex-1 py-3 text-white bg-red-600 hover:bg-red-700 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-colors text-xs">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Xóa
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
