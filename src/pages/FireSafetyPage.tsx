import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, X, AlertCircle, Loader2, Save, 
  Flame, ShieldAlert, Building2, MapPin, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen,
  Calendar, FileText, Link as LinkIcon, Info, Users, Droplets, BellRing, Phone, BatteryWarning
} from 'lucide-react';
import { apiService } from '../services/api';
import { DonVi } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { buildHierarchicalOptions, getUnitEmoji } from '../utils/hierarchy';

// 🟢 [BỘ KHÓA NGÀY THÁNG]: CHỐNG JAVASCRIPT TỰ ĐỘNG ĐẢO NGƯỢC THÁNG VÀ NGÀY
const normalizeDateToISO = (val: any) => {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(str)) {
    const parts = str.split(/[\/\-]/);
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return str;
};

// Hiển thị ra giao diện luôn luôn là DD/MM/YYYY
const formatToVN = (isoStr: string) => {
  if (!isoStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) {
    const parts = isoStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr; 
};

const formatPhoneNumber = (val: string | number | undefined | null) => {
  if (!val) return '';
  const cleaned = val.toString().replace(/\D/g, ''); 
  if (cleaned.length <= 4) return cleaned;
  if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
};

export default function FireSafetyPage() {
  const { user } = useAuth();
  const [donViList, setDonViList] = useState<DonVi[]>([]);
  const [pcccData, setPcccData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
  const [formData, setFormData] = useState<any>({});

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const [dvResult, pcResult] = await Promise.all([
        apiService.getDonVi(),
        apiService.getPCCC ? apiService.getPCCC().catch(()=>[]) : Promise.resolve([])
      ]);
      setDonViList(dvResult || []); 
      
      const cleanPccc = (pcResult || []).map((item: any) => ({
        ...item,
        HanBaoHiemChayNo: normalizeDateToISO(item.HanBaoHiemChayNo),
        HanKiemDinhChongSet: normalizeDateToISO(item.HanKiemDinhChongSet),
        NgayTuKiemTraGanNhat: normalizeDateToISO(item.NgayTuKiemTraGanNhat),
        NgayBaoCaoCongAnGanNhat: normalizeDateToISO(item.NgayBaoCaoCongAnGanNhat),
        NgayDienTapGanNhat: normalizeDateToISO(item.NgayDienTapGanNhat),
        NgayBomSacGannhat: normalizeDateToISO(item.NgayBomSacGannhat),
      }));
      
      setPcccData(cleanPccc);
    } catch (err: any) { setError(err.message || 'Lỗi tải dữ liệu PCCC.'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const donViMap = useMemo(() => {
    const map: Record<string, string> = {};
    donViList.forEach(dv => { map[dv.ID_DonVi] = dv.TenDonVi; });
    return map;
  }, [donViList]);

  const allowedDonViIds = useMemo(() => {
    if (!user) return [];
    if (user.idDonVi === 'ALL') return donViList.map(dv => dv.ID_DonVi);
    const level1 = [user.idDonVi];
    const level2 = donViList.filter(dv => level1.includes(dv.CapQuanLy)).map(dv => dv.ID_DonVi);
    const level3 = donViList.filter(dv => level2.includes(dv.CapQuanLy)).map(dv => dv.ID_DonVi);
    const allAllowed = [...level1, ...level2, ...level3];
    return donViList.filter(dv => allAllowed.includes(dv.ID_DonVi)).map(dv => dv.ID_DonVi);
  }, [user, donViList]);

  const filteredUnits = useMemo(() => {
    let baseUnits = donViList.filter(item => allowedDonViIds.includes(item.ID_DonVi));
    if (!unitSearchTerm) return baseUnits;

    const lower = unitSearchTerm.toLowerCase();
    const matchedIds = new Set<string>();

    baseUnits.forEach(u => {
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

  const toggleParent = (parentId: string) => setExpandedParents(prev => prev.includes(parentId) ? prev.filter(id => id !== parentId) : [...prev, parentId]);

  const filteredPCCC = useMemo(() => {
    let result = pcccData.filter(item => allowedDonViIds.includes(item.ID_DonVi));
    if (selectedUnitFilter) {
      const childUnitIds = donViList.filter(item => item.CapQuanLy === selectedUnitFilter).map(c => c.ID_DonVi);
      const validIds = [selectedUnitFilter, ...childUnitIds];
      result = result.filter(item => validIds.includes(item.ID_DonVi));
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(item => 
        String(item.LoiTonTaiChuaKhacPhuc || '').toLowerCase().includes(lower) || 
        String(item.KhuVucRuiRoCao || '').toLowerCase().includes(lower) ||
        String(item.ChiTietBomSac || '').toLowerCase().includes(lower) ||
        String(item.TenDoiTruong || '').toLowerCase().includes(lower)
      );
    }
    return result;
  }, [pcccData, searchTerm, selectedUnitFilter, allowedDonViIds, donViList]);

  const getStatusColor = (dateString: string, type: 'BH' | 'CS' | 'KT' | 'BC' | 'DT' | 'BS') => {
    if (!dateString) return { color: 'bg-gray-100 text-gray-500 border-gray-200', text: 'Chưa có thông tin' };
    const dateVN = formatToVN(dateString);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString); 
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (type === 'BH' || type === 'CS' || type === 'BS') {
      if (diffDays < 0) return { color: 'bg-red-50 text-red-700 border-red-200 animate-pulse', text: `${dateVN} (Quá hạn)` };
      if (diffDays <= 30) return { color: 'bg-orange-50 text-orange-700 border-orange-200', text: `${dateVN} (Sắp hết hạn)` };
      return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: `${dateVN} (Còn hạn)` };
    } else {
      const passedDays = -diffDays;
      let maxDays = 365;
      if (type === 'KT') maxDays = 30; 
      if (type === 'BC') maxDays = 180; 
      if (passedDays > maxDays) return { color: 'bg-red-50 text-red-700 border-red-200 animate-pulse', text: `${dateVN} (Quá hạn)` };
      if (passedDays > maxDays - 15) return { color: 'bg-orange-50 text-orange-700 border-orange-200', text: `${dateVN} (Sắp tới hạn)` };
      return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: `${dateVN} (Đúng tiến độ)` };
    }
  };

  const openModal = (mode: 'create' | 'update', item?: any) => {
    setModalMode(mode);
    if (item) { setFormData({ ...item }); } 
    else {
      setFormData({
        ID_PCCC: '', ID_DonVi: selectedUnitFilter || '', TinhTrangPhapLy: 'Nghiệm thu', HanBaoHiemChayNo: '', HanKiemDinhChongSet: '',
        NgayTuKiemTraGanNhat: '', NgayBaoCaoCongAnGanNhat: '', SoNhanSuDoiPCCC: '', NgayDienTapGanNhat: '', Link_HoSoDoiPCCC: '',
        TenDoiTruong: '', ChucDanhDoiTruong: '', SDTDoiTruong: '', 
        HeThongBaoChay: 'Tự động', HeThongBom: 'Chữa cháy vách tường', ViTriTuBaoChay: '', TrangThaiBaoChay: 'Bình thường', TrangThaiBom: 'Sẵn sàng',
        SoLuongBinhBot: '', SoLuongBinhCO2: '', SoLuongBinhXeDay: '', SoLuongPhuyCat: '', SoLuongBinhPinDien: '', NgayBomSacGannhat: '', ChiTietBomSac: '',
        KhuVucRuiRoCao: '', LoiTonTaiChuaKhacPhuc: '', Link_HoSoPCCC: '', Link_PhuongAnPCCC_CNCH: '', GhiChu: ''
      });
    }
    setIsModalOpen(true); setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ID_DonVi) return alert("Vui lòng chọn Đơn vị!");
    setSubmitting(true); setError(null);
    try {
      const response = await apiService.save(formData, modalMode, "HS_PCCC");
      const savedId = response?.newId || response?.id || formData.ID_PCCC || `PC-${Date.now()}`;
      const newData = { ...formData, ID_PCCC: savedId };

      if (modalMode === 'create') setPcccData(prev => [newData, ...prev]);
      else setPcccData(prev => prev.map(item => item.ID_PCCC === savedId ? newData : item));
      
      setIsModalOpen(false); 
      if(apiService.getPCCC) apiService.getPCCC().then(res => { 
        const cleanPccc = (res || []).map((item: any) => ({
          ...item,
          HanBaoHiemChayNo: normalizeDateToISO(item.HanBaoHiemChayNo),
          HanKiemDinhChongSet: normalizeDateToISO(item.HanKiemDinhChongSet),
          NgayTuKiemTraGanNhat: normalizeDateToISO(item.NgayTuKiemTraGanNhat),
          NgayBaoCaoCongAnGanNhat: normalizeDateToISO(item.NgayBaoCaoCongAnGanNhat),
          NgayDienTapGanNhat: normalizeDateToISO(item.NgayDienTapGanNhat),
          NgayBomSacGannhat: normalizeDateToISO(item.NgayBomSacGannhat),
        }));
        setPcccData(cleanPccc);
      });
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu PCCC.'); } 
    finally { setSubmitting(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return; setSubmitting(true); setError(null);
    try {
      await apiService.delete(itemToDelete, "HS_PCCC");
      setPcccData(prev => prev.filter(item => item.ID_PCCC !== itemToDelete));
      setIsConfirmOpen(false); setItemToDelete(null); 
    } catch (err: any) { setError(err.message || 'Lỗi xóa dữ liệu.'); } 
    finally { setSubmitting(false); }
  };

  const renderUnitTree = (parent: DonVi, level: number = 1, idx: number = 0) => {
    const children = getChildUnits(parent.ID_DonVi);
    const isExpanded = expandedParents.includes(parent.ID_DonVi) || !!unitSearchTerm;

    return (
      <div key={`${parent.ID_DonVi}-${level}-${idx}`} className={level === 1 ? "mb-1" : "mt-1"}>
        <button 
          onClick={() => { setSelectedUnitFilter(parent.ID_DonVi); if (children.length > 0) toggleParent(parent.ID_DonVi); }} 
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedUnitFilter === parent.ID_DonVi ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          {children.length > 0 ? (isExpanded ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />) : <div className="w-4 shrink-0" />}
          <span className="shrink-0">{getUnitEmoji(parent.loaiHinh)}</span>
          <span className="truncate text-left">{parent.TenDonVi}</span>
        </button>
        {isExpanded && children.length > 0 && (
          <div className={`ml-${level === 1 ? '6' : '4'} mt-1 border-l-2 border-gray-100 pl-2 space-y-1`}>
            {children.map((child, cIdx) => renderUnitTree(child, level + 1, cIdx))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-[#f4f7f9] overflow-hidden relative">
      {isListCollapsed && (
        <button onClick={() => setIsListCollapsed(false)} className="absolute top-6 left-6 z-20 bg-white p-2.5 rounded-lg shadow-md border border-gray-200 text-red-600 hover:bg-red-50 transition-all lg:hidden"><PanelLeftOpen size={20} /></button>
      )}

      {/* CỘT TRÁI */}
      <div className={`${isListCollapsed ? 'w-0 opacity-0 -ml-80 lg:ml-0' : 'w-80 opacity-100 absolute lg:relative inset-y-0 left-0'} transition-all duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col h-full shadow-2xl lg:shadow-sm z-50 lg:z-10 shrink-0 overflow-hidden`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-red-600 flex items-center gap-2 whitespace-nowrap"><MapPin size={20} /> Bộ lọc Đơn vị</h2>
            <button onClick={() => setIsListCollapsed(true)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><PanelLeftClose size={18} /></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Tìm tên đơn vị..." className="w-full pl-9 pr-4 py-2 bg-[#FFFFF0] border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" value={unitSearchTerm} onChange={(e) => setUnitSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-w-[319px]">
          <button onClick={() => setSelectedUnitFilter(null)} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold mb-4 transition-colors ${selectedUnitFilter === null ? 'bg-red-50 text-red-600 border border-red-100' : 'text-gray-700 hover:bg-gray-50'}`}>
            <Flame size={18} className={selectedUnitFilter === null ? 'text-red-600' : 'text-gray-400'} /> Tất cả Cụm / Chi nhánh
          </button>
          <hr className="border-gray-100 mb-4 mx-2"/>

          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-red-600" /></div>
          ) : parentUnits.length === 0 ? (
            <div className="text-center p-4 text-sm text-gray-500">Không tìm thấy đơn vị.</div>
          ) : (
            <>
              {vpdhUnits.length > 0 && (<div className="mb-6"><p className="px-3 text-[10px] font-black text-red-600 uppercase tracking-wider mb-2">VPĐH</p>{vpdhUnits.map((dv, idx) => renderUnitTree(dv, 1, idx))}</div>)}
              {ctttNamUnits.length > 0 && (<div className="mb-6"><p className="px-3 text-[10px] font-black text-red-600 uppercase tracking-wider mb-2">CTTT Phía Nam</p>{ctttNamUnits.map((dv, idx) => renderUnitTree(dv, 1, idx))}</div>)}
              {ctttBacUnits.length > 0 && (<div className="mb-6"><p className="px-3 text-[10px] font-black text-red-600 uppercase tracking-wider mb-2">CTTT Phía Bắc</p>{ctttBacUnits.map((dv, idx) => renderUnitTree(dv, 1, idx))}</div>)}
              {otherUnits.length > 0 && (<div className="mb-6"><p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Đơn vị khác</p>{otherUnits.map((dv, idx) => renderUnitTree(dv, 1, idx))}</div>)}
            </>
          )}
        </div>
      </div>

      {/* CỘT PHẢI CHI TIẾT */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative transition-all duration-300 w-full">
        <div className={`flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 transition-all duration-300 ${isListCollapsed ? 'pl-10 lg:pl-12' : ''}`}>
          <div>
            <h2 className="text-2xl font-bold text-red-600 flex items-center gap-2"><Flame size={28} /> An toàn PCCC & CNCH</h2>
            <p className="text-sm font-medium text-gray-500 mt-1">Đang xem: <span className="text-emerald-600 font-bold">{donViMap[selectedUnitFilter || ''] || 'Tất cả Đơn vị'}</span></p>
          </div>
          <div className="flex w-full sm:w-auto gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Tìm kiếm rủi ro, tồn tại..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none shadow-sm text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => openModal('create')} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-all whitespace-nowrap"><Plus className="w-5 h-5" /> Thêm Hồ sơ PCCC</button>
          </div>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start gap-3 rounded-r-lg shadow-sm"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><p>{error}</p></div>}

        {/* BẢNG DỮ LIỆU */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${isListCollapsed ? 'ml-10 lg:ml-0' : ''}`}>
          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1450px]">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <th className="p-4 w-48">Cơ sở / Đơn vị</th>
                  <th className="p-4 w-56">Hồ sơ Cảnh báo Hạn</th>
                  <th className="p-4 w-48">Hệ thống Cố định</th>
                  <th className="p-4 w-64">Trang thiết bị & Lực lượng</th>
                  <th className="p-4">Tồn tại / Rủi ro</th>
                  <th className="p-4 text-center w-28">Thao tác</th> 
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={6} className="p-12 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-red-600" />Đang tải dữ liệu...</td></tr>
                ) : filteredPCCC.length === 0 ? (
                  <tr><td colSpan={6} className="p-16 text-center text-gray-500">
                    <ShieldAlert size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">Chưa có hồ sơ PCCC nào được khai báo.</p>
                  </td></tr>
                ) : (
                  filteredPCCC.map((item, index) => {
                    const bhStatus = getStatusColor(item.HanBaoHiemChayNo, 'BH');
                    const csStatus = getStatusColor(item.HanKiemDinhChongSet, 'CS');
                    const ktStatus = getStatusColor(item.NgayTuKiemTraGanNhat, 'KT');
                    const bcStatus = getStatusColor(item.NgayBaoCaoCongAnGanNhat, 'BC');
                    const bsStatus = getStatusColor(item.NgayBomSacGannhat, 'BS');

                    return (
                      <tr key={`${item.ID_PCCC}-${index}`} className="hover:bg-red-50/30 transition-colors group">
                        <td className="p-4 align-top">
                          <p className="font-bold text-gray-800 text-sm mb-1">{donViMap[item.ID_DonVi] || item.ID_DonVi}</p>
                          <p className={`text-xs font-bold px-2 py-0.5 rounded inline-block mb-2 ${item.TinhTrangPhapLy === 'Nghiệm thu' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{item.TinhTrangPhapLy}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {item.Link_HoSoPCCC && <a href={item.Link_HoSoPCCC} target="_blank" rel="noreferrer" className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold border border-blue-200 hover:bg-blue-100 flex items-center gap-1"><FileText size={12}/> HS Cơ sở</a>}
                            {item.Link_PhuongAnPCCC_CNCH && <a href={item.Link_PhuongAnPCCC_CNCH} target="_blank" rel="noreferrer" className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded font-bold border border-purple-200 hover:bg-purple-100 flex items-center gap-1"><LinkIcon size={12}/> Phương án</a>}
                            {item.Link_HoSoDoiPCCC && <a href={item.Link_HoSoDoiPCCC} target="_blank" rel="noreferrer" className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1"><Users size={12}/> Đội PCCC</a>}
                          </div>
                        </td>
                        
                        <td className="p-4 space-y-1.5 text-[11px] align-top">
                          <div className="flex items-center justify-between"><span className="text-gray-500 font-medium">Bảo hiểm cháy nổ:</span><span className={`font-bold px-1.5 py-0.5 rounded border ${bhStatus.color}`}>{bhStatus.text}</span></div>
                          <div className="flex items-center justify-between"><span className="text-gray-500 font-medium">Đo điện trở (chống sét):</span><span className={`font-bold px-1.5 py-0.5 rounded border ${csStatus.color}`}>{csStatus.text}</span></div>
                          <div className="flex items-center justify-between border-t border-gray-100 pt-1.5"><span className="text-gray-500 font-medium">Tự kiểm tra (Hàng tháng):</span><span className={`font-bold px-1.5 py-0.5 rounded border ${ktStatus.color}`}>{ktStatus.text}</span></div>
                          <div className="flex items-center justify-between"><span className="text-gray-500 font-medium">Báo cáo CA (Định kỳ):</span><span className={`font-bold px-1.5 py-0.5 rounded border ${bcStatus.color}`}>{bcStatus.text}</span></div>
                        </td>

                        <td className="p-4 space-y-2 text-xs align-top">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 font-medium">Báo cháy:</span>
                            <span className={`font-bold ${item.TrangThaiBaoChay === 'Bình thường' ? 'text-emerald-600' : 'text-red-600'}`}>{item.HeThongBaoChay} - {item.TrangThaiBaoChay}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 font-medium">Hệ thống Bơm:</span>
                            <span className={`font-bold ${item.TrangThaiBom === 'Sẵn sàng' ? 'text-emerald-600' : 'text-red-600'}`}>{item.HeThongBom} - {item.TrangThaiBom}</span>
                          </div>
                          <div className="text-gray-400 italic line-clamp-1 border-t border-gray-100 pt-1" title={item.ViTriTuBaoChay}>Tủ TT: {item.ViTriTuBaoChay || '-'}</div>
                        </td>

                        <td className="p-4 space-y-1.5 text-[11px] align-top">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 font-medium">Đội PCCC / Ngày diễn tập:</span>
                            <span className="font-bold text-gray-800">{item.SoNhanSuDoiPCCC || 0} người <span className="text-gray-400 font-normal">({formatToVN(item.NgayDienTapGanNhat) || '-'})</span></span>
                          </div>
                          
                          {item.TenDoiTruong && (
                            <div className="flex flex-col mt-1 mb-1.5 p-1.5 bg-emerald-50 rounded border border-emerald-100">
                              <span className="font-bold text-emerald-800">{item.TenDoiTruong} <span className="font-normal text-emerald-600">({item.ChucDanhDoiTruong})</span></span>
                              {item.SDTDoiTruong && <span className="text-emerald-600 flex items-center gap-1 mt-0.5"><Phone size={10}/> {formatPhoneNumber(item.SDTDoiTruong)}</span>}
                            </div>
                          )}

                          <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
                            <span className="text-gray-500 font-medium">Bình (Bột/CO2/Đẩy/Pin):</span>
                            <span className="font-bold text-gray-800">{item.SoLuongBinhBot||0} / {item.SoLuongBinhCO2||0} / {item.SoLuongBinhXeDay||0} / {item.SoLuongBinhPinDien||0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 font-medium">Phuy cát (Khu vực Xưởng):</span>
                            <span className="font-bold text-gray-800">{item.SoLuongPhuyCat||0} bộ</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
                            <span className="text-gray-500 font-medium">Bơm sạc (Lô gần nhất):</span>
                            <span className={`font-bold px-1.5 py-0.5 rounded border ${bsStatus.color}`}>{bsStatus.text}</span>
                          </div>
                          {item.ChiTietBomSac && (
                             <div className="text-[10px] text-gray-500 mt-1 line-clamp-2 italic border-l-2 border-gray-200 pl-1.5" title={item.ChiTietBomSac}>
                               {item.ChiTietBomSac}
                             </div>
                          )}
                        </td>

                        <td className="p-4 text-xs align-top">
                          {item.KhuVucRuiRoCao && <p className="mb-1"><span className="font-bold text-orange-600">Rủi ro:</span> <span className="text-gray-700">{item.KhuVucRuiRoCao}</span></p>}
                          {item.LoiTonTaiChuaKhacPhuc ? (
                             <p className="bg-red-50 text-red-700 border border-red-100 p-2 rounded line-clamp-3" title={item.LoiTonTaiChuaKhacPhuc}>⚠️ {item.LoiTonTaiChuaKhacPhuc}</p>
                          ) : (
                             <span className="text-emerald-500 italic flex items-center gap-1 mt-1"><ShieldAlert size={14}/> Không ghi nhận lỗi</span>
                          )}
                        </td>

                        <td className="p-4 text-center align-middle">
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal('update', item)} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Sửa"><Edit size={14} /></button>
                            <button onClick={() => { setItemToDelete(item.ID_PCCC); setIsConfirmOpen(true); }} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Xóa"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODAL NHẬP THÔNG TIN PCCC --- */}
      {isModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 ${!isListCollapsed ? 'lg:pl-80' : ''}`}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between p-5 border-b border-gray-100 bg-red-50 rounded-t-2xl shrink-0">
              <h3 className="text-xl font-bold text-red-700 flex items-center gap-2"><Flame size={24}/> {modalMode === 'create' ? 'Tạo Hồ sơ PCCC Mới' : 'Cập nhật Hồ sơ PCCC'}</h3>
              <button onClick={() => setIsModalOpen(false)} disabled={submitting} className="text-gray-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0 custom-scrollbar">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CỘT 1: PHÁP LÝ & NHÂN SỰ */}
                <div className="space-y-6">
                  <div className="bg-blue-50/40 p-5 rounded-xl border border-blue-100 shadow-sm">
                    <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 border-b border-blue-200 pb-2"><FileText size={18}/> 1. Pháp lý, Bảo hiểm & Báo cáo</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Đơn vị / Cơ sở *</label>
                        <select required name="ID_DonVi" value={formData.ID_DonVi || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" style={{ fontFamily: 'monospace, sans-serif' }}>
                          <option value="">-- Chọn đơn vị --</option>
                          {buildHierarchicalOptions(donViList.filter(dv => allowedDonViIds.includes(dv.ID_DonVi))).map(({ unit, prefix }, idx) => (
                            <option key={`${unit.ID_DonVi}-${idx}`} value={unit.ID_DonVi}>{prefix}{getUnitEmoji(unit.loaiHinh)} {unit.TenDonVi}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-gray-700 mb-1">Tình trạng Pháp lý</label><select name="TinhTrangPhapLy" value={formData.TinhTrangPhapLy || 'Nghiệm thu'} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500 font-bold text-emerald-700"><option value="Nghiệm thu">Nghiệm thu</option><option value="Đã thẩm duyệt">Đã thẩm duyệt</option><option value="Chưa có">Chưa có</option></select></div>
                        <div><label className="block text-[10px] font-bold text-red-600 mb-1 uppercase">Hạn Bảo hiểm Cháy nổ *</label><input type="date" required name="HanBaoHiemChayNo" value={formData.HanBaoHiemChayNo ? formData.HanBaoHiemChayNo.split('T')[0] : ''} onChange={handleInputChange} className="w-full p-2 border border-red-300 rounded-lg bg-red-50 outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-700 text-sm" /></div>
                        <div><label className="block text-[10px] font-bold text-orange-600 mb-1 uppercase">Hạn Đo Đ.trở Chống sét *</label><input type="date" required name="HanKiemDinhChongSet" value={formData.HanKiemDinhChongSet ? formData.HanKiemDinhChongSet.split('T')[0] : ''} onChange={handleInputChange} className="w-full p-2 border border-orange-300 rounded-lg bg-orange-50 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-700 text-sm" /></div>
                        <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Tự kiểm tra gần nhất</label><input type="date" name="NgayTuKiemTraGanNhat" value={formData.NgayTuKiemTraGanNhat ? formData.NgayTuKiemTraGanNhat.split('T')[0] : ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700 text-sm" title="Định kỳ 1 tháng/lần" /></div>
                      </div>
                      <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Ngày Báo cáo CA gần nhất (Định kỳ 6 tháng)</label><input type="date" name="NgayBaoCaoCongAnGanNhat" value={formData.NgayBaoCaoCongAnGanNhat ? formData.NgayBaoCaoCongAnGanNhat.split('T')[0] : ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700 text-sm" /></div>
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">Link Hồ sơ PCCC cơ sở (Drive)</label><input type="url" name="Link_HoSoPCCC" value={formData.Link_HoSoPCCC || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500 text-blue-600" placeholder="https://drive.google.com/..." /></div>
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">Link Phương án PCCC & CNCH</label><input type="url" name="Link_PhuongAnPCCC_CNCH" value={formData.Link_PhuongAnPCCC_CNCH || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500 text-blue-600" placeholder="https://drive.google.com/..." /></div>
                    </div>
                  </div>

                  <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-100 shadow-sm">
                    <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2 border-b border-emerald-200 pb-2"><Users size={18}/> 2. Đội PCCC Cơ sở & Diễn tập</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">Tổng NS Đội PCCC (Người)</label><input type="number" name="SoNhanSuDoiPCCC" value={formData.SoNhanSuDoiPCCC || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">Ngày Diễn tập gần nhất</label><input type="date" name="NgayDienTapGanNhat" value={formData.NgayDienTapGanNhat ? formData.NgayDienTapGanNhat.split('T')[0] : ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 font-bold" /></div>
                      
                      <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-emerald-100/50">
                        <div className="md:col-span-2"><label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Đội trưởng PCCC</label><input type="text" name="TenDoiTruong" value={formData.TenDoiTruong || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-[#05469B]" placeholder="Họ và tên..." /></div>
                        <div><label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">SĐT</label><input type="text" name="SDTDoiTruong" value={formData.SDTDoiTruong || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Nhập SĐT..." /></div>
                        <div className="md:col-span-3"><label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Chức danh Đội trưởng</label><input type="text" name="ChucDanhDoiTruong" value={formData.ChucDanhDoiTruong || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="VD: Giám đốc SR, Trưởng phòng..." /></div>
                      </div>

                      <div className="col-span-2 pt-3"><label className="block text-xs font-bold text-gray-700 mb-1">Link QĐ Thành lập đội & Chứng chỉ HL</label><input type="url" name="Link_HoSoDoiPCCC" value={formData.Link_HoSoDoiPCCC || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-emerald-500 text-blue-600" placeholder="https://drive.google.com/..." /></div>
                    </div>
                  </div>
                </div>

                {/* CỘT 2: TRANG THIẾT BỊ VÀ TỒN TẠI */}
                <div className="space-y-6">
                  <div className="bg-orange-50/40 p-5 rounded-xl border border-orange-100 shadow-sm">
                    <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2 border-b border-orange-200 pb-2"><Droplets size={18}/> 3. Hệ thống cố định & Bình chữa cháy</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-gray-700 mb-1">Hệ thống Báo cháy</label><select name="HeThongBaoChay" value={formData.HeThongBaoChay || 'Tự động'} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500"><option value="Tự động">Tự động</option><option value="Bán tự động">Bán tự động</option><option value="Không có">Không có</option></select></div>
                        <div><label className="block text-xs font-bold text-gray-700 mb-1">Hệ thống Bơm (Nước)</label><select name="HeThongBom" value={formData.HeThongBom || 'Chữa cháy vách tường'} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500"><option value="Chữa cháy vách tường">CC Vách tường</option><option value="Sprinkler tự động">Sprinkler tự động</option><option value="Không có">Không có</option></select></div>
                        <div><label className="block text-xs font-bold text-gray-700 mb-1">Trạng thái Báo cháy</label><select name="TrangThaiBaoChay" value={formData.TrangThaiBaoChay || 'Bình thường'} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 font-bold"><option value="Bình thường" className="text-emerald-600">🟢 Bình thường</option><option value="Lỗi" className="text-red-600">🔴 Đang báo Lỗi</option></select></div>
                        <div><label className="block text-xs font-bold text-gray-700 mb-1">Trạng thái Bơm</label><select name="TrangThaiBom" value={formData.TrangThaiBom || 'Sẵn sàng'} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 font-bold"><option value="Sẵn sàng" className="text-emerald-600">🟢 Sẵn sàng</option><option value="Lỗi" className="text-red-600">🔴 Bơm hỏng / Lỗi</option></select></div>
                      </div>
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">Vị trí Tủ TT Báo cháy (Để ngắt chuông giả)</label><input type="text" name="ViTriTuBaoChay" value={formData.ViTriTuBaoChay || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500" placeholder="VD: Gầm cầu thang tầng 1..." /></div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 border-t border-orange-200 pt-4">
                        <div><label className="block text-[10px] font-bold text-gray-700 mb-1">Bình Bột</label><input type="number" name="SoLuongBinhBot" value={formData.SoLuongBinhBot || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 text-sm" /></div>
                        <div><label className="block text-[10px] font-bold text-gray-700 mb-1">Bình CO2</label><input type="number" name="SoLuongBinhCO2" value={formData.SoLuongBinhCO2 || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 text-sm" /></div>
                        <div><label className="block text-[10px] font-bold text-gray-700 mb-1">Xe đẩy 35kg</label><input type="number" name="SoLuongBinhXeDay" value={formData.SoLuongBinhXeDay || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 text-sm" /></div>
                        <div><label className="block text-[10px] font-bold text-gray-700 mb-1">Phuy Cát</label><input type="number" name="SoLuongPhuyCat" value={formData.SoLuongPhuyCat || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 text-sm" /></div>
                        {/* 🟢 TRƯỜNG MỚI: BÌNH CHỮA CHÁY PIN ĐIỆN */}
                        <div><label className="block text-[10px] font-bold text-emerald-700 mb-1 flex items-center gap-1"><BatteryWarning size={12}/> Bình Pin EV</label><input type="number" name="SoLuongBinhPinDien" value={formData.SoLuongBinhPinDien || ''} onChange={handleInputChange} className="w-full p-2 border border-emerald-300 rounded-lg bg-emerald-50 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-800" /></div>

                        <div className="col-span-2 md:col-span-5 mt-2">
                           <label className="block text-[10px] font-bold text-red-600 mb-1 uppercase">Hạn Bơm Sạc / Bảo Dưỡng (Lô gần nhất) *</label>
                           <input type="date" required name="NgayBomSacGannhat" value={formData.NgayBomSacGannhat ? formData.NgayBomSacGannhat.split('T')[0] : ''} onChange={handleInputChange} className="w-full p-2 border border-red-300 rounded-lg bg-red-50 text-red-700 font-bold outline-none focus:ring-2 focus:ring-red-500 text-sm" title="Ngày này dùng để kích hoạt cảnh báo đỏ/cam trên hệ thống" />
                        </div>
                        
                        <div className="col-span-2 md:col-span-5 mt-1">
                          <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Chi tiết các Lô bình (Phân loại hạn)</label>
                          <textarea name="ChiTietBomSac" value={formData.ChiTietBomSac || ''} onChange={handleInputChange} rows={2} className="w-full p-2 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none" placeholder="VD: Lô 1 (10 bình bột): Hết hạn 15/05/2026. Lô 2 (5 CO2): Hết hạn 20/08/2026..."></textarea>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50/40 p-5 rounded-xl border border-red-200 shadow-sm">
                    <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2 border-b border-red-200 pb-2"><BellRing size={18}/> 4. Cảnh báo rủi ro & Tồn tại</h4>
                    <div className="space-y-4">
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">Khu vực rủi ro cháy nổ cao (Ghi chú)</label><input type="text" name="KhuVucRuiRoCao" value={formData.KhuVucRuiRoCao || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-red-500" placeholder="VD: Kho sơn tĩnh điện, Kho phế liệu..." /></div>
                      <div>
                        <label className="block text-xs font-bold text-red-700 mb-1">Lỗi / Tồn tại chưa khắc phục (Do CA yêu cầu)</label>
                        <textarea name="LoiTonTaiChuaKhacPhuc" value={formData.LoiTonTaiChuaKhacPhuc || ''} onChange={handleInputChange} rows={2} className="w-full p-2.5 border border-red-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 resize-none font-medium text-red-800" placeholder="Ghi nhận các lỗi hệ thống, kiến nghị của Công an chưa làm xong..."></textarea>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Ghi chú chung</label>
                        <textarea name="GhiChu" value={formData.GhiChu || ''} onChange={handleInputChange} rows={1} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-red-500 resize-none"></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-gray-100 flex justify-end gap-3 mt-8 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition-colors">Hủy</button>
                <button type="submit" disabled={submitting} className="px-8 py-3 text-white bg-red-600 hover:bg-red-700 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-colors">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Lưu Hồ Sơ PCCC</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- XÁC NHẬN XÓA --- */}
      {isConfirmOpen && (
        <div className={`fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 ${!isListCollapsed ? 'lg:pl-80' : ''}`}>
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center animate-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border-4 border-red-100"><AlertCircle className="w-8 h-8" /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-gray-500 text-sm mb-6">Hành động này sẽ xóa dữ liệu vĩnh viễn.</p>
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
