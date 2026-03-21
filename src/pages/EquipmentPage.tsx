import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, X, AlertCircle, Loader2, Save, 
  MonitorSmartphone, Building2, MapPin, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen,
  History, Calendar, Info, Eye, Cpu, Image as ImageIcon, FileText, Link as LinkIcon
} from 'lucide-react';
import { apiService } from '../services/api';
import { DonVi, ThietBi, NhatKyThietBi, Personnel } from '../types';
import { useAuth } from '../contexts/AuthContext';

const formatCurrency = (val: string | number | undefined | null) => {
  if (!val) return '';
  return val.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

// Kiểm tra xem nhóm thiết bị có phải là IT (để mở rộng cấu hình) không
const isITEquipment = (nhom: string) => {
  if (!nhom) return false;
  const lower = nhom.toLowerCase();
  return ['pc', 'laptop', 'máy tính bàn', 'máy tính xách tay'].some(kw => lower.includes(kw));
};

export default function EquipmentPage() {
  const { user } = useAuth();
  const [donViList, setDonViList] = useState<DonVi[]>([]);
  const [tbData, setTbData] = useState<ThietBi[]>([]);
  const [nkData, setNkData] = useState<any[]>([]); // Dùng any để linh hoạt catch dữ liệu
  const [nhansuData, setNhansuData] = useState<Personnel[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);

  // Modals Thiết bị
  const [isTbModalOpen, setIsTbModalOpen] = useState(false);
  const [tbModalMode, setTbModalMode] = useState<'create' | 'update'>('create');
  const [tbFormData, setTbFormData] = useState<Partial<ThietBi>>({});

  // Modals Nhật ký
  const [isNkModalOpen, setIsNkModalOpen] = useState(false);
  const [selectedTbForNk, setSelectedTbForNk] = useState<ThietBi | null>(null);
  const [nkFormData, setNkFormData] = useState<any>({});
  const [nkModalMode, setNkModalMode] = useState<'create' | 'update'>('create');

  // Modal Xem chi tiết
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState<ThietBi | null>(null);

  // Modal Xóa
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'tb' | 'nk'} | null>(null);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const [dvResult, tbResult, nkResult, nsResult] = await Promise.all([
        apiService.getDonVi(), apiService.getThietBi(), apiService.getNhatKyThietBi(), apiService.getPersonnel().catch(()=>[])
      ]);
      setDonViList(dvResult || []); setTbData(tbResult || []); setNkData(nkResult || []); setNhansuData(nsResult || []);
    } catch (err: any) { setError(err.message || 'Lỗi tải dữ liệu Trang thiết bị.'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const donViMap = useMemo(() => {
    const map: Record<string, string> = {};
    donViList.forEach(dv => { map[dv.ID_DonVi] = dv.TenDonVi; });
    return map;
  }, [donViList]);

  // PHÂN QUYỀN ĐƠN VỊ 3 CẤP
  const allowedDonViIds = useMemo(() => {
    if (!user) return [];
    if (user.idDonVi === 'ALL') return donViList.map(dv => dv.ID_DonVi);
    
    const level1 = [user.idDonVi];
    const level2 = donViList.filter(dv => level1.includes(dv.CapQuanLy)).map(dv => dv.ID_DonVi);
    const level3 = donViList.filter(dv => level2.includes(dv.CapQuanLy)).map(dv => dv.ID_DonVi);
    const allAllowed = [...level1, ...level2, ...level3];
    
    return donViList.filter(dv => allAllowed.includes(dv.ID_DonVi)).map(dv => dv.ID_DonVi);
  }, [user, donViList]);

  // --- FIX LỖI TÌM KIẾM THIẾT BỊ: BỌC THÉP VỚI String(...) ---
  const filteredTBs = useMemo(() => {
    let result = tbData.filter(item => allowedDonViIds.includes(item.ID_DonVi));
    if (selectedUnitFilter) {
      const childIds = donViList.filter(item => item.CapQuanLy === selectedUnitFilter).map(c => c.ID_DonVi);
      const validIds = [selectedUnitFilter, ...childIds];
      result = result.filter(item => validIds.includes(item.ID_DonVi));
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(item => 
        (String(item.MaTaiSan || '').toLowerCase().includes(lower)) || 
        (String(item.TenThietBi || '').toLowerCase().includes(lower)) ||
        (String(item.NhomThietBi || '').toLowerCase().includes(lower))
      );
    }
    return result;
  }, [tbData, searchTerm, selectedUnitFilter, allowedDonViIds, donViList]);

  const selectedUnitName = useMemo(() => {
    if (!selectedUnitFilter) return 'Tất cả Đơn vị';
    const unit = donViList.find(d => d.ID_DonVi === selectedUnitFilter);
    return unit ? unit.TenDonVi : 'Đơn vị không xác định';
  }, [selectedUnitFilter, donViList]);

  // --- FIX LỖI TÌM KIẾM CÂY THƯ MỤC CỰC THÔNG MINH (KÉO RỄ - XỔ CÀNH) VÀ BỌC THÉP String(...) ---
  const filteredUnits = useMemo(() => {
    let baseUnits = donViList.filter(dv => allowedDonViIds.includes(dv.ID_DonVi));
    if (!unitSearchTerm) return baseUnits;

    const lower = unitSearchTerm.toLowerCase();
    const matchedIds = new Set<string>();

    // 1. Tìm các đơn vị khớp trực tiếp với từ khóa
    baseUnits.forEach(u => {
      if (String(u.TenDonVi || '').toLowerCase().includes(lower) || String(u.ID_DonVi || '').toLowerCase().includes(lower)) {
        matchedIds.add(u.ID_DonVi);
        
        // 2. Kéo theo các node Cha, Ông Nội... để giữ vững cấu trúc cây
        let parentId = u.CapQuanLy;
        while (parentId && parentId !== 'HO') {
          matchedIds.add(parentId);
          const parentUnit = baseUnits.find(p => p.ID_DonVi === parentId);
          parentId = parentUnit ? parentUnit.CapQuanLy : null;
        }
      }
    });

    // 3. Xổ cành: Nếu Cha khớp từ khóa, hiện tất cả các Showroom con của nó
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

  // --- SỬA LỖI REFERENCE CÚ PHÁP TẠI ĐÂY ---
  const { vpdhUnits, ctttNamUnits, ctttBacUnits, otherUnits } = useMemo(() => {
    const vpdh = parentUnits.filter(u => String(u.Phia || '').toLowerCase().includes('vpđh') || String(u.loaiHinh || '').toLowerCase().includes('tổng công ty') || String(u.loaiHinh || '').toLowerCase().includes('văn phòng'));
    const ctttNam = parentUnits.filter(u => !vpdh.includes(u) && String(u.Phia || '').toLowerCase().includes('nam'));
    const ctttBac = parentUnits.filter(u => !vpdh.includes(u) && !ctttNam.includes(u) && String(u.Phia || '').toLowerCase().includes('bắc'));
    const others = parentUnits.filter(u => !vpdh.includes(u) && !ctttNam.includes(u) && !ctttBac.includes(u));
    // Đã thay đổi thành đúng cú pháp gán biến key: value
    return { vpdhUnits: vpdh, ctttNamUnits: ctttNam, ctttBacUnits: ctttBac, otherUnits: others };
  }, [parentUnits]);

  const toggleParent = (parentId: string) => setExpandedParents(prev => prev.includes(parentId) ? prev.filter(id => id !== parentId) : [...prev, parentId]);

  // TỰ ĐỘNG BUNG MỞ THƯ MỤC NẾU CÓ SEARCH
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
          
          {level === 1 ? <Building2 size={16} className={`shrink-0 ${selectedUnitFilter === parent.ID_DonVi ? 'text-[#05469B]' : 'text-gray-400'}`} /> : 
           <MapPin size={14} className={`shrink-0 ${selectedUnitFilter === parent.ID_DonVi ? 'text-[#05469B]' : 'text-gray-400'}`} /> }
          
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

  const { suggestNhom, suggestRAM, suggestSSD, suggestHDD, suggestHoTen } = useMemo(() => {
    const getUnique = (arr: any[], field: string) => Array.from(new Set(arr.map(item => item[field]).filter(Boolean))) as string[];
    return {
      suggestNhom: getUnique(tbData, 'NhomThietBi'),
      suggestRAM: getUnique(tbData, 'RAM'),
      suggestSSD: getUnique(tbData, 'SSD'),
      suggestHDD: getUnique(tbData, 'HDD'),
      suggestHoTen: getUnique(nhansuData, 'HoTen')
    };
  }, [tbData, nhansuData]);

  const getEquipmentDescription = (item: ThietBi) => {
    if (isITEquipment(item.NhomThietBi || '')) {
      const configParts = [
        item.SoSeri, item.CPU, item.RAM, item.SSD, 
        item.HDD, item.VGA, item.ManHinh, item.PhuKien
      ].filter(part => part !== null && part !== undefined && String(part).trim() !== '');
      
      if (configParts.length > 0) return configParts.join(' / ');
    }
    return item.MoTaDacDiem || '-';
  };

  // --- XỬ LÝ THIẾT BỊ ---
  const openTbModal = (mode: 'create' | 'update', item?: ThietBi) => {
    setTbModalMode(mode);
    if (item) { setTbFormData({ ...item }); } 
    else {
      setTbFormData({
        ID_TTB: '', ID_DonVi: selectedUnitFilter || '', MaTaiSan: '', TenThietBi: '', NhomThietBi: '', 
        MoTaDacDiem: '', NhaCungCap: '', NgayMua: '', GiaMua: '', HanBaoHanh: '', TinhTrang: 'Đang sử dụng', Link_HinhAnh: '', Link_Hoso: '',
        SoSeri: '', CPU: '', RAM: '', SSD: '', HDD: '', VGA: '', ManHinh: '', PhuKien: ''
      });
    }
    setIsTbModalOpen(true); setError(null);
  };

  const handleTbSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tbFormData.ID_DonVi) return alert("Vui lòng chọn Đơn vị quản lý!");
    
    setSubmitting(true); setError(null);
    try {
      const response = await apiService.save(tbFormData, tbModalMode, "TS_ThietBi");
      
      // KHẮC PHỤC: Đảm bảo thiết bị mới luôn có ID và được nạp ngay vào danh sách
      const savedId = response?.newId || response?.id || tbFormData.ID_TTB || `TB-${Date.now()}`;
      const newTb = { ...tbFormData, ID_TTB: savedId } as ThietBi;
      
      if (tbModalMode === 'create') {
        setTbData(prev => [newTb, ...prev]);
      } else {
        setTbData(prev => prev.map(item => item.ID_TTB === savedId ? newTb : item));
      }
      setIsTbModalOpen(false); 
      
      // Đồng bộ ngầm để lấy ID chuẩn xác nhất từ Sheet
      apiService.getThietBi().then(res => { if(res) setTbData(res) });
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  };

  const handleTbChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTbFormData(prev => ({ ...prev, [name]: name === 'GiaMua' ? value.replace(/\D/g, '') : value }));
  };

  // --- XỬ LÝ NHẬT KÝ ---
  // Sử dụng ĐÚNG TÊN CỘT ID_TTB theo cấu trúc Sheet user cung cấp
  const tbHistory = useMemo(() => {
    if (!selectedTbForNk) return [];
    return nkData.filter(nk => nk.ID_TTB === selectedTbForNk.ID_TTB).sort((a, b) => new Date(b.NgayGhiNhan).getTime() - new Date(a.NgayGhiNhan).getTime());
  }, [nkData, selectedTbForNk]);

  const viewHistory = useMemo(() => {
    if (!viewData) return [];
    return nkData.filter(nk => nk.ID_TTB === viewData.ID_TTB).sort((a, b) => new Date(b.NgayGhiNhan).getTime() - new Date(a.NgayGhiNhan).getTime());
  }, [nkData, viewData]);

  const openNkModal = (tb: ThietBi) => {
    setSelectedTbForNk(tb); setNkModalMode('create');
    setNkFormData({
      ID_NKTTB: '', ID_TTB: tb.ID_TTB, ID_DonVi: tb.ID_DonVi, NgayGhiNhan: new Date().toISOString().split('T')[0], 
      LoaiNhatKy: 'Cấp phát/Thu hồi', ChiPhi: '', MSNVNguoiDung_NguoiQL: '', HoTenNguoiDung_NguoiQL: '', BP_SuDung_QuanLy: '', GhiChu_SuaChua_Nangcap: '', GhiChu_NhatKySuDung: ''
    });
    setIsNkModalOpen(true);
  };

  const editNk = (nk: any) => {
    setNkModalMode('update');
    // Truyền nguyên bản dữ liệu để sửa
    setNkFormData({ ...nk });
  };

  const handleNkSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    try {
      let finalData = { ...nkFormData };
      if (!['Sửa chữa/Bảo dưỡng', 'Nâng cấp'].includes(finalData.LoaiNhatKy || '')) {
        finalData.ChiPhi = '';
      }

      // Gửi đúng finalData lên Sheet (Đảm bảo có ID_NKTTB)
      const response = await apiService.save(finalData, nkModalMode, "NK_ThietBi");
      
      // Cập nhật giao diện với Fallback ID
      const savedId = response?.newId || response?.id || finalData.ID_NKTTB || `NK-${Date.now()}`;
      const savedLog = { ...finalData, ID_NKTTB: savedId };

      if (nkModalMode === 'create') {
        setNkData(prev => [savedLog, ...prev]);
      } else {
        setNkData(prev => prev.map(item => item.ID_NKTTB === savedId ? savedLog : item));
      }
      
      setNkModalMode('create');
      setNkFormData({
        ID_NKTTB: '', ID_TTB: selectedTbForNk?.ID_TTB || '', ID_DonVi: selectedTbForNk?.ID_DonVi || '', 
        NgayGhiNhan: new Date().toISOString().split('T')[0], LoaiNhatKy: 'Cấp phát/Thu hồi', ChiPhi: '', MSNVNguoiDung_NguoiQL: '', HoTenNguoiDung_NguoiQL: '', BP_SuDung_QuanLy: '', GhiChu_SuaChua_Nangcap: '', GhiChu_NhatKySuDung: ''
      });

      // KHẮC PHỤC LỖI TẠO ID ẢO: Đồng bộ ngầm lại để bắt được ID_NKTTB thật do Google Sheet sinh ra
      apiService.getNhatKyThietBi().then(res => { if(res) setNkData(res) });
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  };

  const handleNkHoTenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const foundNs = nhansuData.find(ns => ns.HoTen === name);
    if (foundNs) {
      setNkFormData((prev: any) => ({ 
        ...prev, 
        HoTenNguoiDung_NguoiQL: name, 
        MSNVNguoiDung_NguoiQL: foundNs.MaNV || '', 
        BP_SuDung_QuanLy: donViMap[foundNs.ID_DonVi] || foundNs.ID_DonVi || '' 
      }));
    } else {
      setNkFormData((prev: any) => ({ ...prev, HoTenNguoiDung_NguoiQL: name }));
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return; setSubmitting(true); setError(null);
    try {
      if (itemToDelete.type === 'tb') {
        // Lấy danh sách ID_NKTTB thuộc về thiết bị này
        const logsToDelete = nkData.filter(nk => nk.ID_TTB === itemToDelete.id);
        
        if (logsToDelete.length > 0) {
          // KHẮC PHỤC LỖI XÓA SÓT: Xóa tuần tự từng dòng để Google Sheets không bị quá tải
          for (const nk of logsToDelete) {
            if (nk.ID_NKTTB) {
              await apiService.delete(nk.ID_NKTTB, "NK_ThietBi");
            }
          }
        }
        // Sau khi dọn sạch lịch sử, xóa Thiết bị chính
        await apiService.delete(itemToDelete.id, "TS_ThietBi");
        
        setTbData(prev => prev.filter(item => item.ID_TTB !== itemToDelete.id));
        setNkData(prev => prev.filter(item => item.ID_TTB !== itemToDelete.id));
      } else {
        await apiService.delete(itemToDelete.id, "NK_ThietBi");
        setNkData(prev => prev.filter(item => item.ID_NKTTB !== itemToDelete.id));
      }
      setIsConfirmOpen(false); setItemToDelete(null); 
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  };

  return (
    <div className="flex h-full bg-[#f4f7f9] overflow-hidden relative">
      {isListCollapsed && (
        <button onClick={() => setIsListCollapsed(false)} className="absolute top-6 left-6 z-20 bg-white p-2.5 rounded-lg shadow-md border border-gray-200 text-[#05469B] hover:bg-blue-50 transition-all"><PanelLeftOpen size={20} /></button>
      )}

      {/* CỘT TRÁI (BỘ LỌC) */}
      <div className={`${isListCollapsed ? 'w-0 opacity-0' : 'w-80 opacity-100'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10 shrink-0 overflow-hidden`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold text-[#05469B] flex items-center gap-2"><MapPin size={20} /> Bộ lọc Đơn vị</h2><button onClick={() => setIsListCollapsed(true)} className="p-1.5 text-gray-400 hover:text-[#05469B] hover:bg-blue-50 rounded-md"><PanelLeftClose size={18} /></button></div>
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="text" placeholder="Tìm tên đơn vị..." className="w-full pl-9 pr-4 py-2 bg-[#FFFFF0] border rounded-lg text-sm focus:ring-2 focus:ring-[#05469B] outline-none" value={unitSearchTerm} onChange={(e) => setUnitSearchTerm(e.target.value)} /></div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 min-w-[319px]">
          <button onClick={() => setSelectedUnitFilter(null)} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold mb-4 ${selectedUnitFilter === null ? 'bg-blue-50 text-[#05469B] border border-blue-100' : 'text-gray-700 hover:bg-gray-50'}`}><MonitorSmartphone size={18} className={selectedUnitFilter === null ? 'text-[#05469B]' : 'text-gray-400'} /> Tất cả Trang thiết bị</button>
          <hr className="border-gray-100 mb-4 mx-2"/>
          {loading ? (<div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#05469B]" /></div>) : (
            <>
              {vpdhUnits.length > 0 && (<div className="mb-6"><p className="px-3 text-[10px] font-black text-[#05469B] uppercase tracking-wider mb-2">VPĐH</p>{vpdhUnits.map(dv => renderUnitTree(dv))}</div>)}
              {ctttNamUnits.length > 0 && (<div className="mb-6"><p className="px-3 text-[10px] font-black text-[#05469B] uppercase tracking-wider mb-2">CTTT Phía Nam</p>{ctttNamUnits.map(dv => renderUnitTree(dv))}</div>)}
              {ctttBacUnits.length > 0 && (<div className="mb-6"><p className="px-3 text-[10px] font-black text-[#05469B] uppercase tracking-wider mb-2">CTTT Phía Bắc</p>{ctttBacUnits.map(dv => renderUnitTree(dv))}</div>)}
              {otherUnits.length > 0 && (<div className="mb-6"><p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Đơn vị khác</p>{otherUnits.map(dv => renderUnitTree(dv))}</div>)}
            </>
          )}
        </div>
      </div>

      {/* NỘI DUNG CHÍNH */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative transition-all duration-300">
        <div className={`flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 ${isListCollapsed ? 'pl-10' : ''}`}>
          <div><h2 className="text-2xl font-bold text-[#05469B] flex items-center gap-2"><MonitorSmartphone size={28} /> Trang thiết bị Văn phòng</h2><p className="text-sm font-medium text-gray-500 mt-1">Đang xem: <span className="text-emerald-600 font-bold">{selectedUnitName}</span> ({filteredTBs.length} thiết bị)</p></div>
          <div className="flex w-full sm:w-auto gap-3"><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Tìm Mã, Tên, Nhóm..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#05469B] outline-none shadow-sm text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div><button onClick={() => openTbModal('create')} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#05469B] hover:bg-[#04367a] text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-all whitespace-nowrap"><Plus className="w-5 h-5" /> Thêm Thiết Bị</button></div>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start gap-3 rounded-r-lg shadow-sm"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><p>{error}</p></div>}

        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${isListCollapsed ? 'ml-10' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1250px]">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <th className="p-4 w-32">Mã Tài Sản</th>
                  <th className="p-4 w-48">Tên Thiết bị</th>
                  <th className="p-4 w-32">Nhóm</th>
                  <th className="p-4 w-40">Đơn Vị Quản Lý</th>
                  <th className="p-4">Cấu hình / Mô tả</th>
                  <th className="p-4 w-36">Tình trạng</th>
                  <th className="p-4 text-center w-40">Thao tác</th> 
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (<tr><td colSpan={7} className="p-12 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#05469B]" />Đang tải...</td></tr>) : filteredTBs.length === 0 ? (<tr><td colSpan={7} className="p-16 text-center text-gray-500"><MonitorSmartphone size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-lg font-medium">Không có thiết bị nào hiển thị.</p></td></tr>) : (
                  filteredTBs.map((item) => (
                    <tr key={item.ID_TTB} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="p-4 font-black text-[#05469B] text-sm whitespace-nowrap">📺 {item.MaTaiSan || 'Chưa cấp mã'}</td>
                      <td className="p-4 font-bold text-gray-800 text-base">{item.TenThietBi}</td>
                      <td className="p-4"><span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-bold border border-indigo-100">{item.NhomThietBi || 'Khác'}</span></td>
                      <td className="p-4 text-sm font-bold text-gray-700">{donViMap[item.ID_DonVi] || '-'}</td>
                      
                      <td className="p-4">
                        <p className="text-xs text-gray-600 font-medium line-clamp-2 leading-relaxed" title={getEquipmentDescription(item)}>
                          {getEquipmentDescription(item)}
                        </p>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap border 
                          ${item.TinhTrang === 'Đang sử dụng' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                            item.TinhTrang === 'Lưu kho' ? 'bg-gray-100 text-gray-600 border-gray-300' : 
                            item.TinhTrang === 'Đang sửa chữa' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                          {item.TinhTrang || 'Đang sử dụng'}
                        </span>
                      </td>
                      <td className="p-4 w-40">
                        <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity w-full max-w-[130px] mx-auto">
                          <button onClick={() => openNkModal(item)} className="w-full py-1.5 bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 rounded text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm"><History size={14} /> Nhật ký</button>
                          <div className="grid grid-cols-3 gap-1">
                            <button onClick={() => { setViewData(item); setIsViewModalOpen(true); }} className="py-1.5 bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded flex items-center justify-center shadow-sm"><Eye size={14} /></button>
                            <button onClick={() => openTbModal('update', item)} className="py-1.5 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center shadow-sm"><Edit size={14} /></button>
                            <button onClick={() => { setItemToDelete({id: item.ID_TTB, type: 'tb'}); setIsConfirmOpen(true); }} className="py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded flex items-center justify-center shadow-sm"><Trash2 size={14} /></button>
                          </div>
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
      <datalist id="suggest-nhom">{suggestNhom.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id="suggest-ram">{suggestRAM.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id="suggest-ssd">{suggestSSD.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id="suggest-hdd">{suggestHDD.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id="suggest-hoten">{suggestHoTen.map(v => <option key={v} value={v} />)}</datalist>

      {/* --- MODAL THÊM/SỬA THIẾT BỊ --- */}
      {isTbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between p-5 border-b border-gray-100 bg-gray-50 rounded-t-2xl"><h3 className="text-xl font-bold text-[#05469B] flex items-center gap-2"><MonitorSmartphone size={24}/> {tbModalMode === 'create' ? 'Thêm Trang Thiết Bị' : 'Cập nhật Thiết Bị'}</h3><button onClick={() => setIsTbModalOpen(false)} disabled={submitting} className="text-gray-400 hover:text-red-500 rounded-full p-1.5 bg-white"><X className="w-6 h-6" /></button></div>
            <form onSubmit={handleTbSave} className="p-6 overflow-y-auto space-y-6">
              
              <div className="bg-blue-50/40 p-5 rounded-xl border border-blue-100">
                <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2"><div className="w-2 h-6 bg-[#05469B] rounded-full"></div> Thông tin Chung</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Mã Tài Sản</label><input type="text" name="MaTaiSan" value={tbFormData.MaTaiSan || ''} onChange={handleTbChange} placeholder="VD: THACO-PC-01" className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] font-bold text-[#05469B]" /></div>
                  <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Tên Thiết bị *</label><input type="text" required name="TenThietBi" value={tbFormData.TenThietBi || ''} onChange={handleTbChange} placeholder="Nhập tên..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] font-bold" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Nhóm Thiết bị *</label><input list="suggest-nhom" required name="NhomThietBi" value={tbFormData.NhomThietBi || ''} onChange={handleTbChange} placeholder="VD: Laptop, PC, Bàn ghế..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] font-bold text-indigo-700" /></div>
                  
                  <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Đơn vị quản lý *</label><select required name="ID_DonVi" value={tbFormData.ID_DonVi || ''} onChange={handleTbChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]"><option value="">-- Chọn đơn vị --</option>{donViList.filter(dv => allowedDonViIds.includes(dv.ID_DonVi)).map(dv => (<option key={dv.ID_DonVi} value={dv.ID_DonVi}>{dv.TenDonVi}</option>))}</select></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Tình trạng *</label><select required name="TinhTrang" value={tbFormData.TinhTrang || 'Đang sử dụng'} onChange={handleTbChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] font-bold"><option value="Đang sử dụng">Đang sử dụng</option><option value="Lưu kho">Lưu kho</option><option value="Đang sửa chữa">Đang sửa chữa</option><option value="Đã thanh lý / Hỏng hóc">Đã thanh lý / Hỏng hóc</option></select></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Hạn bảo hành</label><input type="date" name="HanBaoHanh" value={tbFormData.HanBaoHanh || ''} onChange={handleTbChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Ngày mua</label><input type="date" name="NgayMua" value={tbFormData.NgayMua || ''} onChange={handleTbChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Nguyên giá mua (VNĐ)</label><input type="text" name="GiaMua" value={formatCurrency(tbFormData.GiaMua)} onChange={handleTbChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Nhà cung cấp</label><input type="text" name="NhaCungCap" value={tbFormData.NhaCungCap || ''} onChange={handleTbChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Link Hình ảnh thiết bị</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="url" name="Link_HinhAnh" value={tbFormData.Link_HinhAnh || ''} onChange={handleTbChange} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] text-blue-600 font-medium" placeholder="Dán link ảnh (Drive/Web)..." />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Link Hồ sơ đính kèm (BB Bàn giao, Hợp đồng...)</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="url" name="Link_Hoso" value={tbFormData.Link_Hoso || ''} onChange={handleTbChange} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] text-blue-600 font-medium" placeholder="Dán link tài liệu..." />
                    </div>
                  </div>

                  <div className="md:col-span-4"><label className="block text-xs font-bold text-gray-700 mb-1">Mô tả đặc điểm / Ghi chú chung</label><textarea name="MoTaDacDiem" value={tbFormData.MoTaDacDiem || ''} onChange={handleTbChange} rows={2} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] resize-none outline-none focus:ring-2 focus:ring-[#05469B]"></textarea></div>
                </div>
              </div>

              {isITEquipment(tbFormData.NhomThietBi || '') && (
                <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-top-4">
                  <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2"><Cpu size={18}/> Chi tiết Cấu hình IT (PC/Laptop)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Số Seri (S/N)</label><input type="text" name="SoSeri" value={tbFormData.SoSeri || ''} onChange={handleTbChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold" /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">CPU</label><input type="text" name="CPU" value={tbFormData.CPU || ''} onChange={handleTbChange} placeholder="Core i5, i7..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">RAM</label><input list="suggest-ram" type="text" name="RAM" value={tbFormData.RAM || ''} onChange={handleTbChange} placeholder="8GB, 16GB..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Card VGA</label><input type="text" name="VGA" value={tbFormData.VGA || ''} onChange={handleTbChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                    
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Ổ cứng SSD</label><input list="suggest-ssd" type="text" name="SSD" value={tbFormData.SSD || ''} onChange={handleTbChange} placeholder="256GB, 512GB..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Ổ cứng HDD</label><input list="suggest-hdd" type="text" name="HDD" value={tbFormData.HDD || ''} onChange={handleTbChange} placeholder="1TB..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Màn hình (Inches)</label><input type="text" name="ManHinh" value={tbFormData.ManHinh || ''} onChange={handleTbChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Phụ kiện đi kèm</label><input type="text" name="PhuKien" value={tbFormData.PhuKien || ''} onChange={handleTbChange} placeholder="Chuột, sạc..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                  </div>
                </div>
              )}

              <div className="pt-5 flex justify-end gap-3"><button type="button" onClick={() => setIsTbModalOpen(false)} className="px-8 py-3 bg-gray-100 rounded-xl font-bold">Hủy</button><button type="submit" disabled={submitting} className="px-8 py-3 text-white bg-[#05469B] rounded-xl font-bold flex gap-2">{submitting ? <Loader2 className="animate-spin" /> : <Save />} Lưu Thiết Bị</button></div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL NHẬT KÝ (GIAO NHẬN & SỬA CHỮA) --- */}
      {isNkModalOpen && selectedTbForNk && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsNkModalOpen(false)}></div>
          <div className="bg-white shadow-2xl w-full max-w-md md:max-w-xl h-full flex flex-col animate-in slide-in-from-right relative z-10">
            <div className="p-5 border-b bg-purple-600 text-white flex justify-between shrink-0">
              <div><h3 className="text-xl font-black flex items-center gap-2 mb-1"><History size={20}/> Nhật ký Giao nhận & Sửa chữa</h3><p className="text-[11px] font-bold uppercase text-purple-100">{selectedTbForNk.MaTaiSan || 'Chưa cấp mã'} | {selectedTbForNk.TenThietBi} | {selectedTbForNk.NhomThietBi}</p></div>
              <button onClick={() => setIsNkModalOpen(false)} className="bg-purple-700/50 p-2 rounded-full"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
              <form onSubmit={handleNkSave} className="p-5 bg-white border-b shadow-sm space-y-4 z-10 shrink-0">
                <div className="flex justify-between items-center mb-2"><h4 className="font-bold text-gray-800 text-sm uppercase flex items-center gap-1.5"><Calendar size={16} className="text-purple-600"/> Khai báo nhật ký mới</h4>{nkModalMode === 'update' && <button type="button" onClick={() => {setNkModalMode('create'); setNkFormData({ID_NKTTB: '', ID_TTB: selectedTbForNk.ID_TTB, ID_DonVi: selectedTbForNk.ID_DonVi, NgayGhiNhan: new Date().toISOString().split('T')[0], LoaiNhatKy: 'Cấp phát/Thu hồi', ChiPhi: '', MSNVNguoiDung_NguoiQL: '', HoTenNguoiDung_NguoiQL: '', BP_SuDung_QuanLy: '', GhiChu_SuaChua_Nangcap: '', GhiChu_NhatKySuDung: ''})}} className="text-xs font-bold text-purple-600 flex items-center"><Plus size={14}/> Thêm mới</button>}</div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">Ngày ghi nhận *</label><input type="date" required name="NgayGhiNhan" value={nkFormData.NgayGhiNhan || ''} onChange={(e)=>setNkFormData((prev: any)=>({...prev, NgayGhiNhan: e.target.value}))} className="w-full p-2 border rounded-lg bg-[#FFFFF0] font-bold text-purple-900" /></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">Loại sự kiện *</label><select required name="LoaiNhatKy" value={nkFormData.LoaiNhatKy || 'Cấp phát/Thu hồi'} onChange={(e)=>setNkFormData((prev: any)=>({...prev, LoaiNhatKy: e.target.value}))} className="w-full p-2 border rounded-lg bg-[#FFFFF0] font-bold text-indigo-700"><option value="Cấp phát/Thu hồi">Cấp phát / Thu hồi</option><option value="Sửa chữa/Bảo dưỡng">Sửa chữa / Bảo dưỡng</option><option value="Nâng cấp">Nâng cấp</option><option value="Kiểm kê">Kiểm kê</option></select></div>
                  
                  {['Sửa chữa/Bảo dưỡng', 'Nâng cấp'].includes(nkFormData.LoaiNhatKy || '') && (
                    <div className="col-span-2 animate-in fade-in slide-in-from-top-2">
                      <label className="block text-xs font-bold text-red-600 mb-1">Chi phí thực hiện (VNĐ)</label>
                      <input type="text" name="ChiPhi" value={formatCurrency(nkFormData.ChiPhi)} onChange={(e)=>setNkFormData((prev: any)=>({...prev, ChiPhi: e.target.value.replace(/\D/g,'')}))} placeholder="Nhập số tiền..." className="w-full p-2 border border-red-200 rounded-lg bg-red-50 focus:bg-white font-bold text-red-600 outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                  )}

                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-600 mb-1">Họ tên Nhân sự nhận / quản lý (Gõ để tự điền MSNV)</label>
                    <input list="suggest-hoten" type="text" name="HoTenNguoiDung_NguoiQL" value={nkFormData.HoTenNguoiDung_NguoiQL || ''} onChange={handleNkHoTenChange} placeholder="Nhập tên nhân sự..." className="w-full p-2 border border-purple-200 rounded-lg bg-[#FFFFF0]" />
                  </div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">Mã số NV</label><input type="text" name="MSNVNguoiDung_NguoiQL" value={nkFormData.MSNVNguoiDung_NguoiQL || ''} onChange={(e)=>setNkFormData((prev: any)=>({...prev, MSNVNguoiDung_NguoiQL: e.target.value}))} className="w-full p-2 border rounded-lg bg-gray-50" /></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">Bộ phận công tác</label><input type="text" name="BP_SuDung_QuanLy" value={nkFormData.BP_SuDung_QuanLy || ''} onChange={(e)=>setNkFormData((prev: any)=>({...prev, BP_SuDung_QuanLy: e.target.value}))} className="w-full p-2 border rounded-lg bg-gray-50" /></div>
                  
                  <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Ghi chú Sửa chữa / Nâng cấp (Nếu có)</label><textarea name="GhiChu_SuaChua_Nangcap" value={nkFormData.GhiChu_SuaChua_Nangcap || ''} onChange={(e)=>setNkFormData((prev: any)=>({...prev, GhiChu_SuaChua_Nangcap: e.target.value}))} rows={2} className="w-full p-2 border rounded-lg resize-none"></textarea></div>
                  <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Ghi chú Giao nhận / Khác</label><textarea name="GhiChu_NhatKySuDung" value={nkFormData.GhiChu_NhatKySuDung || ''} onChange={(e)=>setNkFormData((prev: any)=>({...prev, GhiChu_NhatKySuDung: e.target.value}))} rows={2} className="w-full p-2 border rounded-lg resize-none"></textarea></div>
                </div>
                <button type="submit" disabled={submitting} className="w-full py-2.5 bg-purple-600 text-white font-bold rounded-lg flex justify-center gap-2">{submitting ? <Loader2 className="animate-spin" /> : <Save />} Lưu Lịch Sử</button>
              </form>

              {/* TIMELINE LỊCH SỬ */}
              <div className="p-5 flex-1 relative">
                <h4 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-4">Dòng thời gian ({tbHistory.length} Sự kiện)</h4>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-purple-200 before:to-transparent">
                  {tbHistory.map((nk, idx) => {
                    const logId = nk.ID_NKTTB || `log-${idx}`;
                    return (
                    <div key={logId} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-purple-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10"><Calendar size={16}/></div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${nk.LoaiNhatKy === 'Cấp phát/Thu hồi' ? 'bg-blue-100 text-blue-700' : nk.LoaiNhatKy === 'Sửa chữa/Bảo dưỡng' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>{nk.LoaiNhatKy}</span>
                          <span className="text-xs font-bold text-gray-400">{new Date(nk.NgayGhiNhan).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-800 mt-2">{nk.HoTenNguoiDung_NguoiQL || 'Không có tên'}</p>
                        <p className="text-[10px] text-gray-500 mb-2">{nk.BP_SuDung_QuanLy || 'Không có bộ phận'}</p>
                        
                        {nk.ChiPhi && Number(nk.ChiPhi) > 0 && (
                          <p className="text-xs text-red-600 bg-red-50 p-1.5 rounded mb-1 font-bold border border-red-100">Chi phí: {formatCurrency(nk.ChiPhi)} VNĐ</p>
                        )}
                        {nk.GhiChu_SuaChua_Nangcap && <p className="text-xs text-orange-700 bg-orange-50 p-1.5 rounded mb-1 border border-orange-100">Sửa chữa: {nk.GhiChu_SuaChua_Nangcap}</p>}
                        {nk.GhiChu_NhatKySuDung && <p className="text-xs text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-100">Ghi chú: {nk.GhiChu_NhatKySuDung}</p>}
                        <div className="mt-3 pt-2 border-t border-gray-100 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => editNk(nk)} className="text-xs font-bold text-blue-600 hover:underline">Sửa</button>
                          <button onClick={() => {setItemToDelete({id: nk.ID_NKTTB, type: 'nk'}); setIsConfirmOpen(true);}} className="text-xs font-bold text-red-600 hover:underline">Xóa</button>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL XEM CHI TIẾT (VIEW ONLY + CÓ TIMELINE) --- */}
      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between p-5 border-b border-gray-100 bg-[#05469B] text-white rounded-t-2xl"><h3 className="text-xl font-bold flex items-center gap-2"><MonitorSmartphone size={24}/> Chi tiết Trang thiết bị</h3><button onClick={() => setIsViewModalOpen(false)} className="text-blue-200 hover:text-white p-1 rounded-full"><X size={24}/></button></div>
            <div className="p-6 overflow-y-auto">
              
              {/* HEADER THÔNG TIN CƠ BẢN */}
              <div className="flex items-start gap-5 border-b border-gray-100 pb-6 mb-6">
                <div className="w-20 h-20 bg-blue-50 text-[#05469B] rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner shrink-0"><MonitorSmartphone size={40} /></div>
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight">{viewData.MaTaiSan || 'Không mã'}</h2>
                  <p className="text-lg font-bold text-[#05469B] mt-1">{viewData.TenThietBi}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">{viewData.NhomThietBi}</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${viewData.TinhTrang === 'Đang sử dụng' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{viewData.TinhTrang}</span>
                  </div>
                  
                  {(viewData.Link_HinhAnh || viewData.Link_Hoso) && (
                    <div className="flex gap-3 mt-4">
                      {viewData.Link_HinhAnh && (
                        <a href={viewData.Link_HinhAnh} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors border border-blue-200">
                          <ImageIcon size={14}/> Xem Hình Ảnh
                        </a>
                      )}
                      {viewData.Link_Hoso && (
                        <a href={viewData.Link_Hoso} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-bold transition-colors border border-gray-300">
                          <FileText size={14}/> Xem Hồ Sơ / Hợp Đồng
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right hidden md:block"><p className="text-xs text-gray-500 font-bold uppercase mb-1">Đơn vị quản lý</p><p className="text-lg font-black text-gray-800">{donViMap[viewData.ID_DonVi] || '-'}</p></div>
              </div>
              
              {/* LƯỚI THÔNG TIN CHUNG */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-5 rounded-xl border border-gray-200 mb-6">
                <div><p className="text-xs text-gray-500 font-bold mb-1">Ngày mua</p><p className="font-semibold text-gray-800">{viewData.NgayMua ? new Date(viewData.NgayMua).toLocaleDateString('vi-VN') : '-'}</p></div>
                <div><p className="text-xs text-gray-500 font-bold mb-1">Hạn bảo hành</p><p className="font-semibold text-gray-800">{viewData.HanBaoHanh ? new Date(viewData.HanBaoHanh).toLocaleDateString('vi-VN') : '-'}</p></div>
                <div><p className="text-xs text-gray-500 font-bold mb-1">Nguyên giá</p><p className="font-bold text-red-600">{formatCurrency(viewData.GiaMua)} đ</p></div>
                <div><p className="text-xs text-gray-500 font-bold mb-1">Nhà cung cấp</p><p className="font-semibold text-gray-800">{viewData.NhaCungCap || '-'}</p></div>
                <div className="md:col-span-4"><p className="text-xs text-gray-500 font-bold mb-1">Mô tả / Ghi chú</p><p className="font-medium text-gray-700 bg-white p-2 rounded border border-gray-100">{viewData.MoTaDacDiem || '-'}</p></div>
              </div>
              
              {/* KHỐI CẤU HÌNH IT */}
              {isITEquipment(viewData.NhomThietBi || '') && (
                <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 mb-6">
                  <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2"><Cpu size={18}/> Thông số Cấu hình</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><p className="text-xs text-emerald-600 font-bold mb-1">S/N</p><p className="font-bold text-gray-800">{viewData.SoSeri || '-'}</p></div>
                    <div><p className="text-xs text-emerald-600 font-bold mb-1">CPU</p><p className="font-bold text-gray-800">{viewData.CPU || '-'}</p></div>
                    <div><p className="text-xs text-emerald-600 font-bold mb-1">RAM</p><p className="font-bold text-gray-800">{viewData.RAM || '-'}</p></div>
                    <div><p className="text-xs text-emerald-600 font-bold mb-1">VGA</p><p className="font-bold text-gray-800">{viewData.VGA || '-'}</p></div>
                    <div><p className="text-xs text-emerald-600 font-bold mb-1">SSD</p><p className="font-bold text-gray-800">{viewData.SSD || '-'}</p></div>
                    <div><p className="text-xs text-emerald-600 font-bold mb-1">HDD</p><p className="font-bold text-gray-800">{viewData.HDD || '-'}</p></div>
                    <div><p className="text-xs text-emerald-600 font-bold mb-1">Màn hình</p><p className="font-bold text-gray-800">{viewData.ManHinh || '-'}</p></div>
                    <div><p className="text-xs text-emerald-600 font-bold mb-1">Phụ kiện</p><p className="font-bold text-gray-800">{viewData.PhuKien || '-'}</p></div>
                  </div>
                </div>
              )}

              {/* TÍCH HỢP DÒNG THỜI GIAN NHẬT KÝ (READ-ONLY) */}
              <div className="bg-purple-50/50 p-5 rounded-xl border border-purple-100 mt-6 relative">
                <h4 className="font-bold text-purple-800 mb-6 flex items-center gap-2"><History size={18}/> Lịch sử Sử dụng & Sửa chữa</h4>
                
                {viewHistory.length === 0 ? (
                  <p className="text-sm text-gray-500 italic text-center py-4">Chưa có dữ liệu nhật ký nào.</p>
                ) : (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-purple-200 before:via-purple-200 before:to-transparent">
                    {viewHistory.map((nk, idx) => {
                      const logId = nk.ID_NKTTB || `view-${idx}`;
                      return (
                      <div key={logId} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-purple-400 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10"><Calendar size={16}/></div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative">
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${nk.LoaiNhatKy === 'Cấp phát/Thu hồi' ? 'bg-blue-100 text-blue-700' : nk.LoaiNhatKy === 'Sửa chữa/Bảo dưỡng' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>{nk.LoaiNhatKy}</span>
                            <span className="text-xs font-bold text-gray-400">{new Date(nk.NgayGhiNhan).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <p className="text-sm font-bold text-gray-800 mt-2">{nk.HoTenNguoiDung_NguoiQL || 'Không có tên'}</p>
                          <p className="text-[10px] text-gray-500 mb-2">{nk.BP_SuDung_QuanLy || 'Không có bộ phận'}</p>
                          
                          {nk.ChiPhi && Number(nk.ChiPhi) > 0 && (
                            <p className="text-xs text-red-600 bg-red-50 p-1.5 rounded mb-1 font-bold border border-red-100">Chi phí: {formatCurrency(nk.ChiPhi)} VNĐ</p>
                          )}
                          {nk.GhiChu_SuaChua_Nangcap && <p className="text-xs text-orange-700 bg-orange-50 p-1.5 rounded mb-1 border border-orange-100">Sửa chữa: {nk.GhiChu_SuaChua_Nangcap}</p>}
                          {nk.GhiChu_NhatKySuDung && <p className="text-xs text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-100">Ghi chú: {nk.GhiChu_NhatKySuDung}</p>}
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end shrink-0">
              <button onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-colors">Đóng</button>
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
            <p className="text-gray-500 text-sm mb-6">Hành động này sẽ xóa dữ liệu vĩnh viễn.</p>
            <div className="flex gap-3"><button onClick={() => setIsConfirmOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition-colors">Hủy</button><button onClick={confirmDelete} disabled={submitting} className="flex-1 py-3 text-white bg-red-600 hover:bg-red-700 rounded-xl font-bold flex justify-center gap-2 shadow-md">{submitting ? <Loader2 className="animate-spin" /> : <Trash2 />} Xóa</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
