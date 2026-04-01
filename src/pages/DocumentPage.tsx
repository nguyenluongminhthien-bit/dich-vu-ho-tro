import { buildHierarchicalOptions, getUnitEmoji } from '../utils/hierarchy';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, X, AlertCircle, Loader2, Save, 
  FileText, Building2, MapPin, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen,
  Link as LinkIcon, Calendar, CheckCircle2, Bookmark, Eye, Lock
} from 'lucide-react';
import { apiService } from '../services/api';
import { DonVi, VanBan } from '../types';
import { useAuth } from '../contexts/AuthContext';

// HÀM KIỂM TRA VĂN BẢN MẬT (Nhận diện mọi định dạng trả về từ Google Sheets)
const isMatDocument = (val: any) => {
  if (val === true || val === 'TRUE' || val === 'true' || val === 'Có' || String(val).trim() === '1') return true;
  return false;
};

export default function DocumentPage() {
  const { user } = useAuth();
  const [donViList, setDonViList] = useState<DonVi[]>([]);
  const [vbData, setVbData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Layout & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string | null>(null);
  const [selectedPhanLoai, setSelectedPhanLoai] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all'); 
  const [expandedParents, setExpandedParents] = useState<string[]>([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
  const [formData, setFormData] = useState<any>({});
  
  // View Modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState<any | null>(null);

  // Delete Confirm
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const [dvResult, vbResult] = await Promise.all([
        apiService.getDonVi(),
        apiService.getVanBan()
      ]);
      setDonViList(dvResult || []);
      setVbData(vbResult || []);
    } catch (err: any) { 
      setError(err.message || 'Lỗi tải dữ liệu Văn bản.'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadData(); }, []);

  const donViMap = useMemo(() => {
    const map: Record<string, string> = {};
    donViList.forEach(dv => { map[dv.ID_DonVi] = dv.TenDonVi; });
    return map;
  }, [donViList]);

  // PHÂN QUYỀN HIỂN THỊ VĂN BẢN
  const visibleDocuments = useMemo(() => {
    if (!user) return [];
    if (user.idDonVi === 'ALL') return vbData;
    
    // Tạo danh sách các đơn vị được phép quản lý (3 cấp)
    const level1 = [user.idDonVi];
    const level2 = donViList.filter(dv => level1.includes(dv.CapQuanLy)).map(dv => dv.ID_DonVi);
    const level3 = donViList.filter(dv => level2.includes(dv.CapQuanLy)).map(dv => dv.ID_DonVi);
    const myUnits = [...level1, ...level2, ...level3];
    
    return vbData.filter(vb => {
      return myUnits.includes(vb.ID_DonVi) || 
             myUnits.includes(vb.Phamviapdung) || 
             vb.Phamviapdung === 'Toàn hệ thống';
    });
  }, [vbData, user, donViList]);

  // TẠO DANH SÁCH GỢI Ý TỪ LỊCH SỬ NHẬP LIỆU
  const { suggestNguoiky, suggestChucvu, suggestNguoilayso, suggestBPlayso, suggestNghiepvu } = useMemo(() => {
    const getUnique = (field: string) => Array.from(new Set(vbData.map(item => item[field]).filter(Boolean))) as string[];
    return {
      suggestNguoiky: getUnique('Nguoiky'),
      suggestChucvu: getUnique('Chucvu'),
      suggestNguoilayso: getUnique('Nguoilayso'),
      suggestBPlayso: getUnique('BPlayso'),
      suggestNghiepvu: getUnique('Nghiepvu')
    };
  }, [vbData]);

  // LỌC VÀ TẠO CÂY ĐƠN VỊ BÊN TRÁI (PHÂN QUYỀN CHUẨN)
  const allowedDonViIds = useMemo(() => {
    if (!user) return [];
    if (user.idDonVi === 'ALL') return donViList.map(dv => dv.ID_DonVi);
    
    const level1 = [user.idDonVi];
    const level2 = donViList.filter(dv => level1.includes(dv.CapQuanLy)).map(dv => dv.ID_DonVi);
    const level3 = donViList.filter(dv => level2.includes(dv.CapQuanLy)).map(dv => dv.ID_DonVi);
    const allAllowed = [...level1, ...level2, ...level3];
    
    return donViList.filter(dv => allAllowed.includes(dv.ID_DonVi)).map(dv => dv.ID_DonVi);
  }, [user, donViList]);

  // --- FIX TÌM KIẾM CÂY THƯ MỤC CỰC THÔNG MINH VÀ CHỐNG TRẮNG TRANG ---
  const filteredUnits = useMemo(() => {
    let baseUnits = donViList.filter(dv => allowedDonViIds.includes(dv.ID_DonVi));
    if (!unitSearchTerm) return baseUnits;

    const lower = unitSearchTerm.toLowerCase();
    const matchedIds = new Set<string>();

    baseUnits.forEach(u => {
      // Ép String để không bị lỗi với ID số
      if (String(u.TenDonVi || '').toLowerCase().includes(lower) || String(u.ID_DonVi || '').toLowerCase().includes(lower)) {
        matchedIds.add(u.ID_DonVi);
        
        let parentId = u.CapQuanLy;
        while (parentId && parentId !== 'HO') {
          matchedIds.add(parentId);
          const parentUnit = baseUnits.find(p => p.ID_DonVi === parentId);
          parentId = parentUnit ? parentUnit.CapQuanLy : null;
        }
      }
    });

    const addChildren = (parentId: string) => {
      baseUnits.forEach(u => {
        if (u.CapQuanLy === parentId && !matchedIds.has(u.ID_DonVi)) {
          matchedIds.add(u.ID_DonVi);
          addChildren(u.ID_DonVi);
        }
      });
    };
    
    const initialMatches = Array.from(matchedIds);
    initialMatches.forEach(id => addChildren(id));

    return baseUnits.filter(item => matchedIds.has(item.ID_DonVi));
  }, [donViList, unitSearchTerm, allowedDonViIds]);

  const parentUnits = useMemo(() => filteredUnits.filter(item => item.CapQuanLy === 'HO' || !item.CapQuanLy), [filteredUnits]);
  const getChildUnits = (parentId: string) => filteredUnits.filter(item => item.CapQuanLy === parentId);

  const { vpdhUnits, ctttNamUnits, ctttBacUnits, otherUnits } = useMemo(() => {
    const vpdh = parentUnits.filter(u => String(u.Phia || '').toLowerCase().includes('vpđh') || String(u.loaiHinh || '').toLowerCase().includes('tổng công ty') || String(u.loaiHinh || '').toLowerCase().includes('văn phòng'));
    const ctttNam = parentUnits.filter(u => !vpdh.includes(u) && String(u.Phia || '').toLowerCase().includes('nam'));
    const ctttBac = parentUnits.filter(u => !vpdh.includes(u) && !ctttNam.includes(u) && String(u.Phia || '').toLowerCase().includes('bắc'));
    const others = parentUnits.filter(u => !vpdh.includes(u) && !ctttNam.includes(u) && !ctttBac.includes(u));
    return { vpdhUnits: vpdh, ctttNamUnits: ctttNam, ctttBacUnits: ctttBac, otherUnits: others };
  }, [parentUnits]);

  const toggleParent = (parentId: string) => {
    setExpandedParents(prev => prev.includes(parentId) ? prev.filter(id => id !== parentId) : [...prev, parentId]);
  };

  const availableYears = useMemo(() => {
    const years = new Set(
      visibleDocuments.map(item => {
        if (!item.NgayBanHanh) return null;
        return new Date(item.NgayBanHanh).getFullYear().toString();
      }).filter(Boolean) as string[]
    );
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [visibleDocuments]);

  // --- LỌC VĂN BẢN TRÊN BẢNG ---
  const filteredDocs = useMemo(() => {
    let result = [...visibleDocuments];
    
    if (selectedUnitFilter) result = result.filter(item => item.ID_DonVi === selectedUnitFilter || item.Phamviapdung === selectedUnitFilter);
    if (selectedPhanLoai) result = result.filter(item => item.Phanloai === selectedPhanLoai);
    if (selectedYear !== 'all') {
      result = result.filter(item => item.NgayBanHanh && new Date(item.NgayBanHanh).getFullYear().toString() === selectedYear);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(item => 
        String(item.Sohieu || '').toLowerCase().includes(lower) || 
        String(item.TieuDe || '').toLowerCase().includes(lower) ||
        String(item.Nghiepvu || '').toLowerCase().includes(lower)
      );
    }

    result.sort((a, b) => {
      // 1. Tiêu chí 1: Sắp xếp theo Ngày ban hành (Mới nhất lên đầu)
      const dateA = a.NgayBanHanh ? new Date(a.NgayBanHanh).getTime() : 0;
      const dateB = b.NgayBanHanh ? new Date(b.NgayBanHanh).getTime() : 0;
      
      if (dateB !== dateA) {
        return dateB - dateA;
      }

      // 2. Tiêu chí 2: Nếu cùng ngày -> Sắp xếp theo Số hiệu (Số lớn nhất lên đầu)
      // Lấy các chữ số ở đầu chuỗi (VD: "125/TB-THACO" -> 125, "09/CV" -> 9)
      const numA = parseInt(String(a.Sohieu || '').match(/^\d+/)?.[0] || '0', 10);
      const numB = parseInt(String(b.Sohieu || '').match(/^\d+/)?.[0] || '0', 10);
      
      return numB - numA;
    });

    return result;
  }, [visibleDocuments, searchTerm, selectedUnitFilter, selectedPhanLoai, selectedYear]);

  const selectedUnitName = useMemo(() => {
    if (!selectedUnitFilter) return 'Toàn hệ thống';
    const unit = donViList.find(d => d.ID_DonVi === selectedUnitFilter);
    return unit ? unit.TenDonVi : 'Đơn vị không xác định';
  }, [selectedUnitFilter, donViList]);

  const openModal = (mode: 'create' | 'update', item?: any) => {
    setModalMode(mode);
    if (item) { 
      setFormData({ ...item, NgayBanHanh: item.NgayBanHanh ? item.NgayBanHanh.split('T')[0] : '', Mat: isMatDocument(item.Mat) }); 
    } else {
      setFormData({
        ID_VanBan: '', ID_DonVi: selectedUnitFilter || (user?.idDonVi !== 'ALL' ? user?.idDonVi : ''), 
        Phanloai: 'Thông báo', Sohieu: '', NgayBanHanh: new Date().toISOString().split('T')[0], TieuDe: '', Noidung: '', 
        Nguoiky: '', Chucvu: '', Nguoilayso: '', BPlayso: '', Phamviapdung: 'Toàn hệ thống', 
        Hieuluc: 'Còn hiệu lực', Nghiepvu: '', Link_FileDinhKem: '', VBthaythe: '', Mat: false
      });
    }
    setIsModalOpen(true); setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ID_DonVi) return alert("Vui lòng chọn Đơn vị ban hành/lưu trữ!");
    if (formData.Hieuluc === 'Thay thế VB khác' && !formData.VBthaythe) return alert("Vui lòng dán Link văn bản bị thay thế!");
    
    setSubmitting(true); setError(null);
    try {
      const response = await apiService.save(formData, modalMode, "VB_TB");
      if (modalMode === 'create') {
        const newItem = { ...formData, ID_VanBan: response.newId };
        setVbData(prev => [newItem, ...prev]); 
      } else {
        setVbData(prev => prev.map(item => item.ID_VanBan === formData.ID_VanBan ? formData : item));
      }
      setIsModalOpen(false); 
    } catch (err: any) { 
      setError(err.message || 'Lỗi lưu dữ liệu Văn bản.'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'Hieuluc' && value !== 'Thay thế VB khác') {
      setFormData((prev: any) => ({ ...prev, [name]: value, VBthaythe: '' }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return; 
    setSubmitting(true);
    try {
      await apiService.delete(itemToDelete, "VB_TB");
      setVbData(prev => prev.filter(item => item.ID_VanBan !== itemToDelete));
      setIsConfirmOpen(false); setItemToDelete(null); 
    } catch (err: any) { 
      setError(err.message || 'Lỗi xóa dữ liệu.'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  // TỰ ĐỘNG MỞ MENU CÂY KHI TÌM KIẾM
  const renderUnitTree = (parent: DonVi, level: number = 1) => {
    const children = getChildUnits(parent.ID_DonVi);
    const isExpanded = expandedParents.includes(parent.ID_DonVi) || !!unitSearchTerm;
    const isParentDimmed = parent.trangThai === 'Đại lý' || parent.trangThai === 'Đầu tư mới';

    return (
      <div key={parent.ID_DonVi} className={level === 1 ? "mb-1" : "mt-1"}>
        <button 
          onClick={() => { setSelectedUnitFilter(parent.ID_DonVi); if (children.length > 0) toggleParent(parent.ID_DonVi); }} 
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedUnitFilter === parent.ID_DonVi ? 'bg-blue-50 text-[#05469B]' : 'text-gray-700 hover:bg-gray-50'} ${isParentDimmed ? 'opacity-50' : ''}`}
        >
          {children.length > 0 ? (isExpanded ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />) : <div className="w-4 shrink-0" />}
          
          <span className="shrink-0">{getUnitEmoji(parent.loaiHinh)}</span>
          
          <span className="truncate text-left">{parent.TenDonVi}</span>
        </button>
        
        {isExpanded && children.length > 0 && (
          <div className={`ml-${level === 1 ? '6' : '4'} mt-1 border-l-2 border-gray-100 pl-2 space-y-1`}>
            {children.map(child => renderUnitTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-[#f4f7f9] overflow-hidden relative">
      {/* NÚT MỞ RỘNG CỘT TRÁI NẾU BỊ ẨN */}
      {isListCollapsed && (
        <button onClick={() => setIsListCollapsed(false)} className="absolute top-6 left-6 z-20 bg-white p-2.5 rounded-lg shadow-md border border-gray-200 text-[#05469B] hover:bg-blue-50 transition-all">
          <PanelLeftOpen size={20} />
        </button>
      )}

      {/* CỘT TRÁI: BỘ LỌC ĐƠN VỊ VÀ PHÂN LOẠI */}
      <div className={`${isListCollapsed ? 'w-0 opacity-0' : 'w-80 opacity-100'} transition-all duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10 shrink-0 overflow-hidden`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#05469B] flex items-center gap-2 whitespace-nowrap"><Bookmark size={20} /> Lọc & Phân loại</h2>
            <button onClick={() => setIsListCollapsed(true)} className="p-1.5 text-gray-400 hover:text-[#05469B] hover:bg-blue-50 rounded-md transition-colors"><PanelLeftClose size={18} /></button>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
            <button onClick={() => setSelectedPhanLoai(null)} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${!selectedPhanLoai ? 'bg-white text-[#05469B] shadow-sm' : 'text-gray-500 hover:text-[#05469B]'}`}>Tất cả</button>
            <button onClick={() => setSelectedPhanLoai('Thông báo')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${selectedPhanLoai === 'Thông báo' ? 'bg-white text-[#05469B] shadow-sm' : 'text-gray-500 hover:text-[#05469B]'}`}>T.Báo</button>
            <button onClick={() => setSelectedPhanLoai('Công văn đến')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${selectedPhanLoai === 'Công văn đến' ? 'bg-white text-[#05469B] shadow-sm' : 'text-gray-500 hover:text-[#05469B]'}`}>CV Đến</button>
            <button onClick={() => setSelectedPhanLoai('Công văn đi')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${selectedPhanLoai === 'Công văn đi' ? 'bg-white text-[#05469B] shadow-sm' : 'text-gray-500 hover:text-[#05469B]'}`}>CV Đi</button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Tìm đơn vị áp dụng..." className="w-full pl-9 pr-4 py-2 bg-[#FFFFF0] border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#05469B] outline-none" value={unitSearchTerm} onChange={(e) => setUnitSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-w-[319px]">
          <button onClick={() => setSelectedUnitFilter(null)} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold mb-4 transition-colors ${selectedUnitFilter === null ? 'bg-blue-50 text-[#05469B] border border-blue-100' : 'text-gray-700 hover:bg-gray-50'}`}>
            <Building2 size={18} className={selectedUnitFilter === null ? 'text-[#05469B]' : 'text-gray-400'} /> Toàn Hệ Thống
          </button>
          <hr className="border-gray-100 mb-4 mx-2"/>

          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#05469B]" /></div>
          ) : parentUnits.length === 0 ? (
            <div className="text-center p-4 text-sm text-gray-500">Không tìm thấy đơn vị.</div>
          ) : (
            <>
              {vpdhUnits.length > 0 && (<div className="mb-6"><p className="px-3 text-[10px] font-black text-[#05469B] uppercase tracking-wider mb-2">VPĐH</p>{vpdhUnits.map(dv => renderUnitTree(dv))}</div>)}
              {ctttNamUnits.length > 0 && (<div className="mb-6"><p className="px-3 text-[10px] font-black text-[#05469B] uppercase tracking-wider mb-2">CTTT Phía Nam</p>{ctttNamUnits.map(dv => renderUnitTree(dv))}</div>)}
              {ctttBacUnits.length > 0 && (<div className="mb-6"><p className="px-3 text-[10px] font-black text-[#05469B] uppercase tracking-wider mb-2">CTTT Phía Bắc</p>{ctttBacUnits.map(dv => renderUnitTree(dv))}</div>)}
              {otherUnits.length > 0 && (<div className="mb-6"><p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Đơn vị khác</p>{otherUnits.map(dv => renderUnitTree(dv))}</div>)}
            </>
          )}
        </div>
      </div>

      {/* CỘT PHẢI: BẢNG DỮ LIỆU */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative transition-all duration-300">
        <div className={`flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 transition-all duration-300 ${isListCollapsed ? 'pl-10' : ''}`}>
          <div>
            <h2 className="text-2xl font-bold text-[#05469B] flex items-center gap-2"><FileText size={28} /> Quản lý Văn bản - Thông báo</h2>
            <p className="text-sm font-medium text-gray-500 mt-1">Lọc: <span className="text-emerald-600 font-bold">{selectedPhanLoai || 'Tất cả'}</span> • Khu vực: <span className="text-emerald-600 font-bold">{selectedUnitName}</span></p>
          </div>
          
          <div className="flex w-full sm:w-auto gap-3">
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#05469B] outline-none shadow-sm text-sm font-bold text-[#05469B] cursor-pointer"
            >
              <option value="all">Tất cả năm</option>
              {availableYears.map(year => (
                <option key={year} value={year}>Năm {year}</option>
              ))}
            </select>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Tìm số hiệu, tiêu đề, nghiệp vụ..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#05469B] outline-none shadow-sm text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => openModal('create')} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#05469B] hover:bg-[#04367a] text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-all whitespace-nowrap"><Plus className="w-5 h-5" /> Ban hành</button>
          </div>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start gap-3 rounded-r-lg shadow-sm"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><p>{error}</p></div>}

        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${isListCollapsed ? 'ml-10' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <th className="p-4 w-36">Số hiệu</th>
                  <th className="p-4 w-32">Ngày BH</th>
                  <th className="p-4">Tiêu đề & Nội dung</th>
                  <th className="p-4 w-48">Phạm vi áp dụng</th>
                  <th className="p-4 w-36">Nghiệp vụ</th>
                  <th className="p-4 w-32">Hiệu lực</th>
                  <th className="p-4 text-center w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={7} className="p-12 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#05469B]" />Đang tải dữ liệu...</td></tr>
                ) : filteredDocs.length === 0 ? (
                  <tr><td colSpan={7} className="p-16 text-center text-gray-500"><FileText size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-lg font-medium">Không tìm thấy văn bản phù hợp.</p></td></tr>
                ) : (
                  filteredDocs.map((item) => (
                    <tr key={item.ID_VanBan} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="p-4">
                        <span className="font-black text-[#05469B] bg-blue-50 px-2 py-1 rounded text-sm whitespace-nowrap border border-blue-100">{item.Sohieu}</span>
                        <div className="mt-2 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block uppercase">{item.Phanloai}</div>
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-700 flex items-center gap-1.5 mt-2"><Calendar size={14} className="text-gray-400"/> {item.NgayBanHanh ? new Date(item.NgayBanHanh).toLocaleDateString('vi-VN') : '-'}</td>
                      <td className="p-4">
                        <div className="flex items-start gap-2 mb-1">
                          {isMatDocument(item.Mat) && (
                            <span className="flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded border border-red-200 shrink-0 mt-0.5" title="Văn bản Mật">
                              <Lock size={10} /> MẬT
                            </span>
                          )}
                          <p className={`font-bold text-base ${isMatDocument(item.Mat) ? 'text-red-700' : 'text-gray-800'}`}>{item.TieuDe}</p>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.Noidung}</p>
                        {item.Link_FileDinhKem && (
                          <a href={item.Link_FileDinhKem} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline hover:text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                            <LinkIcon size={12}/> File đính kèm
                          </a>
                        )}
                        {item.Hieuluc === 'Thay thế VB khác' && item.VBthaythe && (
                           <a href={item.VBthaythe} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:underline bg-red-50 px-2 py-1 rounded border border-red-100 ml-2 mt-1">
                             <LinkIcon size={12}/> Đã thay thế VB cũ
                           </a>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        <span className="font-semibold text-gray-700">{item.Phamviapdung === 'Toàn hệ thống' ? '🌍 Toàn hệ thống' : donViMap[item.Phamviapdung] || item.Phamviapdung}</span>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase">Từ: {donViMap[item.ID_DonVi] || item.ID_DonVi}</p>
                      </td>
                      <td className="p-4 text-sm">
                        {item.Nghiepvu ? <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-bold border border-indigo-100">{item.Nghiepvu}</span> : <span className="text-gray-400 italic text-xs">Chưa PL</span>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1 text-center
                          ${item.Hieuluc === 'Còn hiệu lực' ? 'bg-green-50 text-green-700 border border-green-200' : 
                            item.Hieuluc === 'Hết hiệu lực' ? 'bg-gray-100 text-gray-600 border border-gray-300' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                          {item.Hieuluc === 'Còn hiệu lực' && <CheckCircle2 size={12}/>}
                          {item.Hieuluc}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity w-full max-w-[100px] mx-auto">
                          <button onClick={() => { setViewData(item); setIsViewModalOpen(true); }} className="w-full py-1.5 bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"><Eye size={13} /> Xem</button>
                          <button onClick={() => openModal('update', item)} className="w-full py-1.5 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 rounded text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"><Edit size={13} /> Sửa</button>
                          <button onClick={() => { setItemToDelete(item.ID_VanBan); setIsConfirmOpen(true); }} className="w-full py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"><Trash2 size={13} /> Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- DATALISTS --- */}
      <datalist id="suggest-nguoiky">{suggestNguoiky.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id="suggest-chucvu">{suggestChucvu.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id="suggest-nguoilayso">{suggestNguoilayso.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id="suggest-bplayso">{suggestBPlayso.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id="suggest-nghiepvu">{suggestNghiepvu.map(v => <option key={v} value={v} />)}</datalist>

      {/* MODAL THÊM / SỬA VĂN BẢN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between p-5 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-[#05469B] flex items-center gap-2"><FileText size={24}/> {modalMode === 'create' ? 'Ban hành Văn bản / Thông báo Mới' : 'Cập nhật Văn bản'}</h3>
              <button onClick={() => setIsModalOpen(false)} disabled={submitting} className="text-gray-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
              
              {/* KHỐI 1: THÔNG TIN CƠ BẢN */}
              <div className="bg-blue-50/40 p-5 rounded-xl border border-blue-100">
                <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2"><div className="w-2 h-6 bg-[#05469B] rounded-full"></div> Thông tin Hành chính</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Đơn vị ban hành (Lưu trữ) *</label>
                    <select 
                      required 
                      name="ID_DonVi" 
                      value={formData.ID_DonVi || ''} 
                      onChange={handleInputChange} 
                      className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] font-bold text-[#05469B]"
                      style={{ fontFamily: 'monospace, sans-serif' }}
                    >
                      <option value="">-- Chọn đơn vị --</option>
                      {buildHierarchicalOptions(donViList.filter(dv => allowedDonViIds.includes(dv.ID_DonVi))).map(({ unit, prefix }) => (
                        <option key={unit.ID_DonVi} value={unit.ID_DonVi} className="font-normal text-gray-700">
                          {prefix}{getUnitEmoji(unit.loaiHinh)} {unit.TenDonVi}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phân loại *</label>
                    <select required name="Phanloai" value={formData.Phanloai || 'Thông báo'} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]">
                      <option value="Thông báo">Thông báo</option><option value="Công văn đến">Công văn đến</option><option value="Công văn đi">Công văn đi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Trạng thái (Hiệu lực) *</label>
                    <select required name="Hieuluc" value={formData.Hieuluc || 'Còn hiệu lực'} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] font-bold text-[#05469B]">
                      <option value="Còn hiệu lực">Còn hiệu lực</option><option value="Hết hiệu lực">Hết hiệu lực</option><option value="Thay thế VB khác">Thay thế VB khác</option>
                    </select>
                  </div>

                  {formData.Hieuluc === 'Thay thế VB khác' && (
                    <div className="col-span-2 md:col-span-4 bg-orange-50 p-3 rounded-lg border border-orange-200 animate-in fade-in zoom-in duration-200">
                      <label className="block text-xs font-bold text-orange-700 mb-1">Link Văn bản bị thay thế (Dán link vào đây) *</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={16} />
                        <input type="url" required name="VBthaythe" value={formData.VBthaythe || ''} onChange={handleInputChange} className="w-full pl-9 pr-4 py-2 border border-orange-300 rounded-md bg-white outline-none focus:ring-2 focus:ring-orange-500 text-blue-600 text-sm font-medium" placeholder="Dán link Google Drive của văn bản cũ..." />
                      </div>
                    </div>
                  )}

                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Số hiệu *</label><input type="text" required name="Sohieu" value={formData.Sohieu || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] font-black text-gray-800 tracking-wider" placeholder="VD: 123/TB-THaco..." /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Ngày ban hành *</label><input type="date" required name="NgayBanHanh" value={formData.NgayBanHanh || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] font-bold" /></div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phạm vi áp dụng (Hiển thị cho) *</label>
                    <select 
                      required 
                      name="Phamviapdung" 
                      value={formData.Phamviapdung || 'Toàn hệ thống'} 
                      onChange={handleInputChange} 
                      className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] font-bold text-[#05469B]"
                      style={{ fontFamily: 'monospace, sans-serif' }}
                    >
                      <option value="Toàn hệ thống">🌍 Áp dụng Toàn hệ thống</option>
                      <optgroup label="Hoặc Chỉ định Đơn vị cụ thể:">
                        {buildHierarchicalOptions(donViList).map(({ unit, prefix }) => (
                          <option key={unit.ID_DonVi} value={unit.ID_DonVi} className="font-normal text-gray-700">
                            {prefix}{getUnitEmoji(unit.loaiHinh)} {unit.TenDonVi}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* NÚT CHỌN VĂN BẢN MẬT */}
                  <div className="col-span-2 md:col-span-4 mt-1">
                    <label className="inline-flex items-center p-3 border border-red-200 rounded-lg bg-red-50 cursor-pointer hover:bg-red-100 transition-colors shadow-sm w-max">
                      <input 
                        type="checkbox" 
                        name="Mat" 
                        checked={!!formData.Mat} 
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, Mat: e.target.checked }))} 
                        className="w-4 h-4 text-red-600 rounded border-red-300 mr-2.5 focus:ring-red-500" 
                      />
                      <Lock size={16} className="text-red-600 mr-1.5" />
                      <span className="text-sm font-bold text-red-700">Đánh dấu là Văn bản MẬT (Chỉ cảnh báo thị giác)</span>
                    </label>
                  </div>

                </div>
              </div>

              {/* KHỐI 2: NỘI DUNG CHÍNH */}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><div className="w-2 h-6 bg-gray-400 rounded-full"></div> Nội dung Văn bản</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tiêu đề *</label>
                    <input type="text" required name="TieuDe" value={formData.TieuDe || ''} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] font-bold text-lg" placeholder="Nhập tiêu đề văn bản..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Trích yếu nội dung</label>
                    <textarea name="Noidung" value={formData.Noidung || ''} onChange={handleInputChange} rows={3} className="w-full p-3 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] resize-none" placeholder="Tóm tắt ngắn gọn nội dung..."></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Link File đính kèm (PDF / Drive)</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="url" name="Link_FileDinhKem" value={formData.Link_FileDinhKem || ''} onChange={handleInputChange} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] text-blue-600 font-medium" placeholder="Dán link Google Drive hoặc file PDF vào đây..." />
                    </div>
                  </div>
                </div>
              </div>

              {/* KHỐI 3: THÔNG TIN THÊM */}
              <div className="bg-orange-50/40 p-5 rounded-xl border border-orange-100">
                <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2"><div className="w-2 h-6 bg-orange-500 rounded-full"></div> Thông tin thêm</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Người ký</label>
                    <input list="suggest-nguoiky" type="text" name="Nguoiky" value={formData.Nguoiky || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" placeholder="Họ tên người ký..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Chức vụ người ký</label>
                    <input list="suggest-chucvu" type="text" name="Chucvu" value={formData.Chucvu || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" placeholder="VD: Giám đốc, Trưởng phòng..." />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Người lấy số</label>
                    <input list="suggest-nguoilayso" type="text" name="Nguoilayso" value={formData.Nguoilayso || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" placeholder="Họ tên nhân viên..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Bộ phận lấy số</label>
                    <input list="suggest-bplayso" type="text" name="BPlayso" value={formData.BPlayso || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" placeholder="VD: Phòng HCNS..." />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phân loại Nghiệp vụ</label>
                    <input list="suggest-nghiepvu" type="text" name="Nghiepvu" value={formData.Nghiepvu || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" placeholder="Kinh doanh, Nhân sự, Dịch vụ..." />
                  </div>

                </div>
              </div>

              <div className="pt-5 border-t border-gray-100 flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition-colors shadow-sm">Hủy</button>
                <button type="submit" disabled={submitting} className="px-8 py-3 text-white bg-[#05469B] hover:bg-[#04367a] rounded-xl font-bold flex items-center gap-2 shadow-lg transition-colors">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Lưu Văn Bản</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT */}
      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between p-5 border-b border-gray-100 bg-[#05469B] text-white rounded-t-2xl">
              <h3 className="text-xl font-bold flex items-center gap-2"><FileText size={24}/> Chi tiết Văn bản</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-blue-200 hover:text-white rounded-full p-1 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              
              {/* BANNER CẢNH BÁO MẬT */}
              {isMatDocument(viewData.Mat) && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Lock size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-red-700 uppercase">Tài liệu Mật</p>
                    <p className="text-xs font-medium text-red-600">Đề nghị không sao chép, chụp ảnh hay phát tán ra bên ngoài dưới mọi hình thức.</p>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-100 text-[#05469B] font-black px-3 py-1 rounded text-lg border border-blue-200">{viewData.Sohieu}</span>
                  <span className="bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded text-xs uppercase">{viewData.Phanloai}</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${viewData.Hieuluc === 'Còn hiệu lực' ? 'bg-green-100 text-green-700' : viewData.Hieuluc === 'Hết hiệu lực' ? 'bg-gray-200 text-gray-700' : 'bg-orange-100 text-orange-700'}`}>
                    {viewData.Hieuluc}
                  </span>
                </div>
                <h2 className={`text-2xl font-black leading-tight mt-3 ${isMatDocument(viewData.Mat) ? 'text-red-700' : 'text-gray-800'}`}>{viewData.TieuDe}</h2>
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-2"><Calendar size={14}/> Ban hành: <span className="font-bold text-gray-700">{viewData.NgayBanHanh ? new Date(viewData.NgayBanHanh).toLocaleDateString('vi-VN') : '-'}</span></p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {viewData.Noidung || <span className="italic text-gray-400">Không có trích yếu nội dung.</span>}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div><p className="text-xs text-gray-500 uppercase font-bold mb-1">Nơi ban hành</p><p className="font-semibold text-[#05469B]">{donViMap[viewData.ID_DonVi] || viewData.ID_DonVi}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-bold mb-1">Phạm vi áp dụng</p><p className="font-semibold text-[#05469B]">{viewData.Phamviapdung === 'Toàn hệ thống' ? '🌍 Toàn hệ thống' : donViMap[viewData.Phamviapdung] || viewData.Phamviapdung}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-bold mb-1">Người ký</p><p className="font-semibold text-gray-800">{viewData.Nguoiky || '-'} <span className="text-gray-500 font-normal">({viewData.Chucvu || '-'})</span></p></div>
                <div><p className="text-xs text-gray-500 uppercase font-bold mb-1">Nghiệp vụ</p><p className="font-semibold text-gray-800">{viewData.Nghiepvu || '-'}</p></div>
              </div>

              <div className="flex flex-col gap-3">
                {viewData.Link_FileDinhKem && (
                  <a href={viewData.Link_FileDinhKem} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-md">
                    <LinkIcon size={18}/> Mở File Đính Kèm
                  </a>
                )}
                {viewData.Hieuluc === 'Thay thế VB khác' && viewData.VBthaythe && (
                  <a href={viewData.VBthaythe} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 rounded-xl font-bold transition-colors">
                    <LinkIcon size={18}/> Mở Văn Bản bị thay thế
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* XÁC NHẬN XÓA */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center animate-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border-4 border-red-100"><AlertCircle className="w-8 h-8" /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-gray-500 text-sm mb-6">Hành động này sẽ xóa văn bản này vĩnh viễn.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsConfirmOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition-colors">Hủy</button>
              <button onClick={confirmDelete} disabled={submitting} className="flex-1 py-3 text-white bg-red-600 hover:bg-red-700 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-colors">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />} Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
