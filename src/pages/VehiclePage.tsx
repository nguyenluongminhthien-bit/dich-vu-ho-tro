import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, X, AlertCircle, Loader2, Save, 
  Car, Building2, MapPin, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen,
  Receipt, Calendar, Info, Eye, BarChart3, Briefcase
} from 'lucide-react';
import { apiService } from '../services/api';
import { DonVi, TS_Xe, CP_HoatDongXe } from '../types';
import { useAuth } from '../contexts/AuthContext';

// --- HÀM TỰ ĐỘNG DÒ TÌM ID TỪ GOOGLE SHEETS DÙ SAI TÊN CỘT ---
const getCostId = (cp: any) => cp.ID_ChiPhiXe || cp.iD_ChiPhiXe || cp.Id_ChiPhiXe || cp.ID_ChiPhi || cp.ID_CP || cp.id || '';
const getCostCarId = (cp: any) => cp.ID_Xe || cp.iD_Xe || cp.Id_Xe || cp.ID_PhuongTien || cp.ID_Car || '';

const formatCurrency = (val: string | number | undefined | null) => {
  if (!val) return '';
  return val.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const formatMonthYear = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.slice(0, 7); 
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

export default function VehiclePage() {
  const { user } = useAuth();
  const [donViList, setDonViList] = useState<DonVi[]>([]);
  const [xeData, setXeData] = useState<TS_Xe[]>([]);
  const [chiPhiData, setChiPhiData] = useState<any[]>([]); // Dùng any để catch mọi trường hợp của ID
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [carSearchTerm, setCarSearchTerm] = useState('');
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);

  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
  const [carFormData, setCarFormData] = useState<Partial<TS_Xe>>({});
  const [plateError, setPlateError] = useState(false);

  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [selectedCarForCost, setSelectedCarForCost] = useState<TS_Xe | null>(null);
  const [costFormData, setCostFormData] = useState<any>({});
  const [costModalMode, setCostModalMode] = useState<'create' | 'update'>('create');

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState<TS_Xe | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'xe' | 'chiphi'} | null>(null);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const [dvResult, xeResult, cpResult] = await Promise.all([
        apiService.getDonVi(), apiService.getXe(), apiService.getChiPhiXe()
      ]);
      setDonViList(dvResult || []); setXeData(xeResult || []); setChiPhiData(cpResult || []);
    } catch (err: any) { setError(err.message || 'Lỗi tải dữ liệu.'); } 
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

  // --- FIX TÌM KIẾM CÂY THƯ MỤC CỰC THÔNG MINH (KÉO RỄ - XỔ CÀNH) VÀ CHỐNG TRẮNG TRANG ---
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

  // --- FIX LỖI TÌM KIẾM THEO PHÂN LOẠI CỘT TRÁI ---
  const { vpdhUnits, ctttNamUnits, ctttBacUnits, otherUnits } = useMemo(() => {
    const vpdh = parentUnits.filter(u => String(u.Phia || '').toLowerCase().includes('vpđh') || String(u.loaiHinh || '').toLowerCase().includes('tổng công ty') || String(u.loaiHinh || '').toLowerCase().includes('văn phòng'));
    const ctttNam = parentUnits.filter(u => !vpdh.includes(u) && String(u.Phia || '').toLowerCase().includes('nam'));
    const ctttBac = parentUnits.filter(u => !vpdh.includes(u) && !ctttNam.includes(u) && String(u.Phia || '').toLowerCase().includes('bắc'));
    const others = parentUnits.filter(u => !vpdh.includes(u) && !ctttNam.includes(u) && !ctttBac.includes(u));
    return { vpdhUnits: vpdh, ctttNamUnits: ctttNam, ctttBacUnits: ctttBac, otherUnits: others };
  }, [parentUnits]);

  const toggleParent = (parentId: string) => setExpandedParents(prev => prev.includes(parentId) ? prev.filter(id => id !== parentId) : [...prev, parentId]);

  // --- FIX LỖI TÌM KIẾM DANH SÁCH XE ---
  const filteredCars = useMemo(() => {
    let result = xeData.filter(item => allowedDonViIds.includes(item.ID_DonVi));
    if (selectedUnitFilter) {
      const childUnitIds = donViList.filter(item => item.CapQuanLy === selectedUnitFilter).map(c => c.ID_DonVi);
      const validIds = [selectedUnitFilter, ...childUnitIds];
      result = result.filter(item => validIds.includes(item.ID_DonVi));
    }
    if (carSearchTerm) {
      const lower = carSearchTerm.toLowerCase();
      result = result.filter(item => 
        String(item.BienSo || '').toLowerCase().includes(lower) || 
        String(item.HieuXe || '').toLowerCase().includes(lower) || 
        String(item.LoaiXe || '').toLowerCase().includes(lower)
      );
    }
    return result;
  }, [xeData, carSearchTerm, selectedUnitFilter, allowedDonViIds, donViList]);

  const selectedUnitName = useMemo(() => {
    if (!selectedUnitFilter) return 'Tất cả Đơn vị';
    const unit = donViList.find(d => d.ID_DonVi === selectedUnitFilter);
    return unit ? unit.TenDonVi : 'Đơn vị không xác định';
  }, [selectedUnitFilter, donViList]);

  const openCarModal = (mode: 'create' | 'update', item?: TS_Xe) => {
    setModalMode(mode); setPlateError(false);
    if (item) { setCarFormData({ ...item }); } 
    else {
      setCarFormData({
        ID_Xe: '', ID_DonVi: selectedUnitFilter || '', Mucdichsudung: 'Xe công', MaTaiSan: '', donvichusohuu: '', NguyenGia: '', Chiphithue_khaohao: '', 
        BienSo: '', LoaiPhuongTien: 'Ô tô du lịch', HieuXe: '', LoaiXe: '', PhienBan: '', MauXe: '', NamSX: '', NamDK: '', SoKhung: '', SoMay: '',
        SoCho: '', LoaiNhienLieu: 'Xăng', DungTich: '', CongThucBanh: '', HinhThucSoHuu: 'Sở hữu', GPS: 'Có', Hientrang: 'Đang hoạt động', Ghichu: ''
      });
    }
    setIsCarModalOpen(true); setError(null);
  };

  const handleCarSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carFormData.ID_DonVi) return alert("Vui lòng chọn Đơn vị quản lý!");
    if (!carFormData.HieuXe) return alert("Vui lòng chọn Hiệu xe!");
    setSubmitting(true); setError(null);
    try {
      const response = await apiService.save(carFormData, modalMode, "TS_Xe");
      
      const savedId = response?.newId || response?.id || carFormData.ID_Xe || `XE-${Date.now()}`;
      const newCar = { ...carFormData, ID_Xe: savedId } as TS_Xe;

      if (modalMode === 'create') setXeData(prev => [newCar, ...prev]);
      else setXeData(prev => prev.map(item => item.ID_Xe === savedId ? newCar : item));
      
      setIsCarModalOpen(false); 

      apiService.getXe().then(res => { if(res) setXeData(res) });
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu Xe.'); } 
    finally { setSubmitting(false); }
  };

  const handleInputCarChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'BienSo') {
      if (/[\s\-\.]/.test(value)) { setPlateError(true); setTimeout(() => setPlateError(false), 4000); }
      const cleanPlate = value.toUpperCase().replace(/[\s\-\.]/g, '');
      setCarFormData(prev => ({ ...prev, [name]: cleanPlate })); return;
    }
    if (name === 'NguyenGia' || name === 'Chiphithue_khaohao') {
      setCarFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '') })); return;
    }
    setCarFormData(prev => ({ ...prev, [name]: value }));
  };

  const carCosts = useMemo(() => {
    if (!selectedCarForCost) return [];
    return chiPhiData.filter(cp => getCostCarId(cp) === selectedCarForCost.ID_Xe).sort((a, b) => b.ThangNam.localeCompare(a.ThangNam));
  }, [chiPhiData, selectedCarForCost]);

  const viewHistoryCosts = useMemo(() => {
    if (!viewData) return [];
    return chiPhiData.filter(cp => getCostCarId(cp) === viewData.ID_Xe).sort((a, b) => a.ThangNam.localeCompare(b.ThangNam));
  }, [chiPhiData, viewData]);

  const openCostModal = (car: TS_Xe) => {
    setSelectedCarForCost(car); setCostModalMode('create');
    setCostFormData({
      ID_ChiPhiXe: '', ThangNam: new Date().toISOString().slice(0, 7), ID_Xe: car.ID_Xe, ID_DonVi: car.ID_DonVi, 
      KmHienTai: '', SoLitNhienLieu: '', ChiPhiNhienLieu: '', Phicauduong_benbai: '', Phiruaxe: '', ChiPhiBaoDuong_SuaChua: '', ChiPhiThue_KhauHao: '', GhiChu: ''
    });
    setIsCostModalOpen(true);
  };

  const editCost = (cost: any) => {
    setCostModalMode('update');
    setCostFormData({ ...cost, ID_ChiPhiXe: getCostId(cost), ID_Xe: getCostCarId(cost), ID_DonVi: cost.ID_DonVi || selectedCarForCost?.ID_DonVi || '' });
  };

  const handleCostSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    try {
      let finalData = { ...costFormData };
      
      const currentId = getCostId(finalData);
      if (currentId) {
        finalData.ID_ChiPhiXe = currentId;
        finalData.iD_ChiPhiXe = currentId;
        finalData.Id_ChiPhiXe = currentId;
        finalData.ID_ChiPhi = currentId;
      }

      const response = await apiService.save(finalData, costModalMode, "CP_HoatDongXe");
      
      const savedId = response?.newId || response?.id || currentId || `CP-${Date.now()}`;
      const savedCost = { ...finalData, ID_ChiPhiXe: savedId };

      if (costModalMode === 'create') {
        setChiPhiData(prev => [savedCost, ...prev]);
      } else {
        setChiPhiData(prev => prev.map(item => getCostId(item) === currentId ? savedCost : item));
      }
      
      setCostModalMode('create');
      setCostFormData({
        ID_ChiPhiXe: '', ThangNam: costFormData.ThangNam, ID_Xe: selectedCarForCost?.ID_Xe || '', ID_DonVi: selectedCarForCost?.ID_DonVi || '', 
        KmHienTai: '', SoLitNhienLieu: '', ChiPhiNhienLieu: '', Phicauduong_benbai: '', Phiruaxe: '', ChiPhiBaoDuong_SuaChua: '', ChiPhiThue_KhauHao: '', GhiChu: ''
      });

      apiService.getChiPhiXe().then(res => { if(res) setChiPhiData(res) });
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu Chi phí.'); } 
    finally { setSubmitting(false); }
  };

  const handleInputCostChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (['KmHienTai', 'ChiPhiNhienLieu', 'Phicauduong_benbai', 'Phiruaxe', 'ChiPhiBaoDuong_SuaChua', 'ChiPhiThue_KhauHao'].includes(name)) { finalValue = value.replace(/\D/g, ''); }
    setCostFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const chartScale = useMemo(() => {
    if (viewHistoryCosts.length === 0) return { maxCP: 1, maxKm: 1 };
    const costs = viewHistoryCosts.map(c => (Number(c.ChiPhiNhienLieu) || 0) + (Number(c.Phicauduong_benbai) || 0) + (Number(c.Phiruaxe) || 0) + (Number(c.ChiPhiBaoDuong_SuaChua) || 0) + (Number(c.ChiPhiThue_KhauHao) || 0));
    const kms = viewHistoryCosts.map(c => Number(c.KmHienTai) || 0);
    return { maxCP: Math.max(...costs, 1), maxKm: Math.max(...kms, 1) };
  }, [viewHistoryCosts]);

  const confirmDelete = async () => {
    if (!itemToDelete) return; setSubmitting(true); setError(null);
    try {
      if (itemToDelete.type === 'xe') {
        const costsToDelete = chiPhiData.filter(cp => getCostCarId(cp) === itemToDelete.id);
        if (costsToDelete.length > 0) {
          for (const cp of costsToDelete) {
            const cpId = getCostId(cp);
            if (cpId) await apiService.delete(cpId, "CP_HoatDongXe");
          }
        }
        await apiService.delete(itemToDelete.id, "TS_Xe");
        setXeData(prev => prev.filter(item => item.ID_Xe !== itemToDelete.id));
        setChiPhiData(prev => prev.filter(item => getCostCarId(item) !== itemToDelete.id));
      } else {
        await apiService.delete(itemToDelete.id, "CP_HoatDongXe");
        setChiPhiData(prev => prev.filter(item => getCostId(item) !== itemToDelete.id));
      }
      setIsConfirmOpen(false); setItemToDelete(null); 
    } catch (err: any) { setError(err.message || 'Lỗi xóa dữ liệu.'); } 
    finally { setSubmitting(false); }
  };

  const getUnitFullName = (id: string) => {
    const unit = donViList.find(u => u.ID_DonVi === id);
    if (!unit) return '-';
    if (unit.CapQuanLy && unit.CapQuanLy !== 'HO') {
      const parent = donViList.find(u => u.ID_DonVi === unit.CapQuanLy);
      if (parent) return `${parent.TenDonVi} - ${unit.TenDonVi}`;
    }
    return unit.TenDonVi;
  };

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
           level === 2 ? <Briefcase size={15} className={`shrink-0 ${selectedUnitFilter === parent.ID_DonVi ? 'text-[#05469B]' : 'text-gray-400'}`} /> : 
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

  return (
    <div className="flex h-full bg-[#f4f7f9] overflow-hidden relative">
      {isListCollapsed && (
        <button onClick={() => setIsListCollapsed(false)} className="absolute top-6 left-6 z-20 bg-white p-2.5 rounded-lg shadow-md border border-gray-200 text-[#05469B] hover:bg-blue-50 transition-all" title="Mở danh sách đơn vị"><PanelLeftOpen size={20} /></button>
      )}

      {/* --- CỘT TRÁI (BỘ LỌC ĐƠN VỊ) --- */}
      <div className={`${isListCollapsed ? 'w-0 opacity-0 -ml-80 lg:ml-0' : 'w-80 opacity-100 absolute lg:relative inset-y-0 left-0'} transition-all duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col h-full shadow-2xl lg:shadow-sm z-50 lg:z-10 shrink-0 overflow-hidden`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#05469B] flex items-center gap-2 whitespace-nowrap"><MapPin size={20} /> Bộ lọc Đơn vị</h2>
            <button onClick={() => setIsListCollapsed(true)} className="p-1.5 text-gray-400 hover:text-[#05469B] hover:bg-blue-50 rounded-md transition-colors"><PanelLeftClose size={18} /></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Tìm tên showroom..." className="w-full pl-9 pr-4 py-2 bg-[#FFFFF0] border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#05469B] outline-none" value={unitSearchTerm} onChange={(e) => setUnitSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-w-[319px]">
          <button onClick={() => setSelectedUnitFilter(null)} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold mb-4 transition-colors ${selectedUnitFilter === null ? 'bg-blue-50 text-[#05469B] border border-blue-100' : 'text-gray-700 hover:bg-gray-50'}`}>
            <Car size={18} className={selectedUnitFilter === null ? 'text-[#05469B]' : 'text-gray-400'} /> Tất cả Đội xe Toàn quốc
          </button>
          <hr className="border-gray-100 mb-4 mx-2"/>

          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#05469B]" /></div>
          ) : parentUnits.length === 0 ? (
            <div className="text-center p-4 text-sm text-gray-500">Không tìm thấy đơn vị.</div>
          ) : (
            <>
              {vpdhUnits.length > 0 && (<div className="mb-6"><p className="px-3 text-[10px] font-black text-[#05469B] uppercase tracking-wider mb-2">VPĐH</p>{vpdhUnits.map(dv => renderUnitTree(dv, 1))}</div>)}
              {ctttNamUnits.length > 0 && (<div className="mb-6"><p className="px-3 text-[10px] font-black text-[#05469B] uppercase tracking-wider mb-2">CTTT Phía Nam</p>{ctttNamUnits.map(dv => renderUnitTree(dv, 1))}</div>)}
              {ctttBacUnits.length > 0 && (<div className="mb-6"><p className="px-3 text-[10px] font-black text-[#05469B] uppercase tracking-wider mb-2">CTTT Phía Bắc</p>{ctttBacUnits.map(dv => renderUnitTree(dv, 1))}</div>)}
              {otherUnits.length > 0 && (<div className="mb-6"><p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Đơn vị khác</p>{otherUnits.map(dv => renderUnitTree(dv, 1))}</div>)}
            </>
          )}
        </div>
      </div>

      {/* --- CỘT PHẢI (DANH SÁCH XE) --- */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative transition-all duration-300">
        <div className={`flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 transition-all duration-300 ${isListCollapsed ? 'pl-10' : ''}`}>
          <div>
            <h2 className="text-2xl font-bold text-[#05469B] flex items-center gap-2"><Car size={28} /> Quản lý Đội xe</h2>
            <p className="text-sm font-medium text-gray-500 mt-1">Đang xem: <span className="text-emerald-600 font-bold">{selectedUnitName}</span> ({filteredCars.length} xe)</p>
          </div>
          <div className="flex w-full sm:w-auto gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Tìm Biển số, Hiệu xe..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#05469B] outline-none shadow-sm text-sm" value={carSearchTerm} onChange={(e) => setCarSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => openCarModal('create')} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#05469B] hover:bg-[#04367a] text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-all whitespace-nowrap"><Plus className="w-5 h-5" /> Thêm Xe Mới</button>
          </div>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start gap-3 rounded-r-lg shadow-sm"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><p>{error}</p></div>}

        {/* BẢNG DỮ LIỆU MẶC ĐỊNH */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${isListCollapsed ? 'ml-10' : ''}`}>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1250px]">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <th className="p-4 w-32">Biển số xe</th>
                  <th className="p-4 w-48">Hãng - Loại xe</th>
                  <th className="p-4 w-32">Phương tiện</th>
                  <th className="p-4 w-36">Mục đích SD</th>
                  <th className="p-4">Đơn vị quản lý</th>
                  <th className="p-4 w-36">Tình trạng</th>
                  <th className="p-4 text-center w-40">Thao tác</th> 
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={7} className="p-12 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#05469B]" />Đang tải dữ liệu...</td></tr>
                ) : filteredCars.length === 0 ? (
                  <tr><td colSpan={7} className="p-16 text-center text-gray-500">
                    <Car size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">Không có xe nào trong danh sách hiển thị.</p>
                  </td></tr>
                ) : (
                  filteredCars.map((item) => (
                    <tr key={item.ID_Xe} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="p-4 font-black text-[#05469B] text-base whitespace-nowrap">🚙 {item.BienSo}</td>
                      <td className="p-4 font-bold text-gray-800">{item.HieuXe} {item.LoaiXe} {item.PhienBan ? `- ${item.PhienBan}` : ''}</td>
                      <td className="p-4 text-gray-600 font-medium">{item.LoaiPhuongTien}</td>
                      <td className="p-4 text-indigo-600 font-semibold">{item.Mucdichsudung}</td>
                      <td className="p-4 text-gray-700 font-bold">{getUnitFullName(item.ID_DonVi)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap ${item.Hientrang === 'Đang hoạt động' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                          {item.Hientrang === 'Đang hoạt động' ? '🟢' : '🔴'} {item.Hientrang}
                        </span>
                      </td>
                      <td className="p-4 w-40">
                        <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity w-full max-w-[130px] mx-auto">
                          {/* Dòng 1: Chi phí */}
                          <button onClick={() => openCostModal(item)} className="w-full py-1.5 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded text-[11px] font-bold transition-colors flex items-center justify-center gap-1 shadow-sm">
                            <Receipt size={14} /> Chi phí
                          </button>
                          
                          {/* Dòng 2: Xem - Sửa - Xóa */}
                          <div className="grid grid-cols-3 gap-1">
                            <button onClick={() => { setViewData(item); setIsViewModalOpen(true); }} className="py-1.5 bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded flex items-center justify-center shadow-sm transition-colors" title="Xem chi tiết">
                              <Eye size={14} />
                            </button>
                            <button onClick={() => openCarModal('update', item)} className="py-1.5 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center shadow-sm transition-colors" title="Sửa">
                              <Edit size={14} />
                            </button>
                            <button onClick={() => { setItemToDelete({id: item.ID_Xe, type: 'xe'}); setIsConfirmOpen(true); }} className="py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded flex items-center justify-center shadow-sm transition-colors" title="Xóa">
                              <Trash2 size={14} />
                            </button>
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

      {/* --- MODAL NHẬP THÔNG TIN TÀI SẢN XE --- */}
      {isCarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between p-5 border-b border-gray-100 bg-gray-50 rounded-t-2xl shrink-0">
              <h3 className="text-xl font-bold text-[#05469B] flex items-center gap-2"><Car size={24}/> {modalMode === 'create' ? 'Thêm Xe Mới' : 'Cập nhật Thông tin Xe'}</h3>
              <button onClick={() => setIsCarModalOpen(false)} disabled={submitting} className="text-gray-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleCarSave} className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
              
              <div className="bg-blue-50/40 p-5 rounded-xl border border-blue-100">
                <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2"><div className="w-2 h-6 bg-[#05469B] rounded-full"></div> Hồ sơ Đăng ký & Sở hữu</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Biển Số *</label>
                    <input type="text" required name="BienSo" value={carFormData.BienSo || ''} onChange={handleInputCarChange} placeholder="VD: 51H12345" className={`w-full p-2.5 border rounded-lg outline-none font-bold focus:ring-2 focus:ring-[#05469B] ${plateError ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-[#FFFFF0] text-[#05469B]'}`} />
                    {plateError && <p className="text-[10px] text-red-500 mt-1 font-bold animate-pulse">Lỗi: Gõ liền, không dấu cách/-/. !</p>}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Đơn vị quản lý *</label>
                    <select required name="ID_DonVi" value={carFormData.ID_DonVi || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]">
                      <option value="">-- Chọn đơn vị --</option>
                      {donViList.filter(dv => allowedDonViIds.includes(dv.ID_DonVi)).map(dv => (<option key={dv.ID_DonVi} value={dv.ID_DonVi}>{dv.TenDonVi}</option>))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Hình thức Sở hữu</label>
                    <select name="HinhThucSoHuu" value={carFormData.HinhThucSoHuu || 'Sở hữu'} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]">
                      <option value="Sở hữu">Sở hữu</option>
                      <option value="Quản lý sử dụng">Quản lý sử dụng</option>
                      <option value="Thuê">Thuê</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Mục đích sử dụng</label>
                    <select name="Mucdichsudung" value={carFormData.Mucdichsudung || 'Xe công'} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-[#05469B]">
                      <option value="Xe công">Xe công</option>
                      <option value="Xe lái thử">Xe lái thử</option>
                      <option value="Xe thay thế cho KH">Xe thay thế cho KH</option>
                      <option value="Xe sửa chữa lưu động">Xe sửa chữa lưu động</option>
                    </select>
                  </div>

                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Mã Tài Sản (Kế toán)</label><input type="text" name="MaTaiSan" value={carFormData.MaTaiSan || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Đơn vị Đứng tên Cà vẹt (Chủ sở hữu)</label><input type="text" name="donvichusohuu" value={carFormData.donvichusohuu || ''} onChange={handleInputCarChange} placeholder="Tên công ty/cá nhân trên Giấy đăng ký xe" className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nguyên giá (VNĐ)</label>
                    <input type="text" name="NguyenGia" value={formatCurrency(carFormData.NguyenGia)} onChange={handleInputCarChange} placeholder="Giá trị mua xe ban đầu..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Chi phí Thuê / Khấu hao tháng (VNĐ)</label>
                    <input type="text" name="Chiphithue_khaohao" value={formatCurrency(carFormData.Chiphithue_khaohao)} onChange={handleInputCarChange} placeholder="Chi phí cố định hàng tháng..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><div className="w-2 h-6 bg-gray-400 rounded-full"></div> Đặc điểm Kỹ thuật</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Loại phương tiện</label>
                    <select name="LoaiPhuongTien" value={carFormData.LoaiPhuongTien || 'Ô tô du lịch'} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]">
                      <option value="Ô tô du lịch">Ô tô du lịch</option>
                      <option value="Ô tô tải">Ô tô tải</option>
                      <option value="Xe máy">Xe máy</option>
                      <option value="Xe chuyên dụng">Xe chuyên dụng</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Hiệu xe (Hãng) *</label>
                    <select required name="HieuXe" value={carFormData.HieuXe || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#05469B]">
                      <option value="" className="font-normal text-gray-500">-- Chọn Hãng --</option>
                      {['KIA', 'MAZDA', 'PEUGEOT', 'BMW', 'BMW MOTORAD', 'JEEP', 'RAM'].map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Loại xe *</label><input type="text" required name="LoaiXe" value={carFormData.LoaiXe || ''} onChange={handleInputCarChange} placeholder="VD: K3, CX-5..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Phiên bản</label><input type="text" name="PhienBan" value={carFormData.PhienBan || ''} onChange={handleInputCarChange} placeholder="VD: 2.0 Premium..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Năm SX</label><input type="text" name="NamSX" value={carFormData.NamSX || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Năm Đăng ký</label><input type="text" name="NamDK" value={carFormData.NamDK || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Màu xe</label><input type="text" name="MauXe" value={carFormData.MauXe || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Số chỗ ngồi</label><input type="number" name="SoCho" value={carFormData.SoCho || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Số Khung</label><input type="text" name="SoKhung" value={carFormData.SoKhung || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Số Máy</label><input type="text" name="SoMay" value={carFormData.SoMay || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Loại Nhiên liệu</label><select name="LoaiNhienLieu" value={carFormData.LoaiNhienLieu || 'Xăng'} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]"><option value="Xăng">Xăng</option><option value="Dầu Diesel">Dầu Diesel</option><option value="Điện">Điện</option><option value="Khác">Khác</option></select></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Dung tích</label><input type="text" name="DungTich" value={carFormData.DungTich || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  
                  <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Công thức bánh (Xe tải)</label><input type="text" name="CongThucBanh" value={carFormData.CongThucBanh || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" placeholder="VD: 4x2..." /></div>
                </div>
              </div>

              <div className="bg-orange-50/40 p-5 rounded-xl border border-orange-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Định vị GPS</label><select name="GPS" value={carFormData.GPS || 'Có'} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]"><option value="Có">Có</option><option value="Không">Không</option></select></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Hiện trạng</label><select name="Hientrang" value={carFormData.Hientrang || 'Đang hoạt động'} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] font-bold text-[#05469B] outline-none focus:ring-2 focus:ring-[#05469B]"><option value="Đang hoạt động">Đang hoạt động</option><option value="Sửa chữa">Sửa chữa</option><option value="Ngừng hoạt động">Ngừng hoạt động</option><option value="Đã Thanh lý">Đã Thanh lý</option></select></div>
                  <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Ghi chú khác</label><textarea name="Ghichu" value={carFormData.Ghichu || ''} onChange={handleInputCarChange} rows={2} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] resize-none"></textarea></div>
                </div>
              </div>

              <div className="pt-5 border-t border-gray-100 flex justify-end gap-3 mt-8 shrink-0">
                <button type="button" onClick={() => setIsCarModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition-colors">Hủy</button>
                <button type="submit" disabled={submitting} className="px-8 py-3 text-white bg-[#05469B] hover:bg-[#04367a] rounded-xl font-bold flex items-center gap-2 shadow-lg transition-colors">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Lưu Hồ Sơ Xe</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL XEM CHI TIẾT XE VÀ THỐNG KÊ CHI PHÍ (CÓ SCROLL BẢNG) --- */}
      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200 overflow-hidden">
            <div className="flex justify-between p-5 border-b border-gray-100 bg-[#05469B] rounded-t-2xl shrink-0">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Car size={24}/> Chi tiết Thông tin & Hoạt động Xe</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-blue-200 hover:text-white rounded-full p-1 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            {/* THÊM flex-1 min-h-0 ĐỂ POPUP LUÔN VỪA KHÍT MÀN HÌNH */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0 flex flex-col gap-6">
              
              {/* Info Header */}
              <div className="flex items-center gap-5 border-b border-gray-100 pb-6 shrink-0">
                <div className="w-24 h-24 bg-blue-50 text-[#05469B] rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner">
                  <Car size={48} />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight">{viewData.BienSo}</h2>
                  <p className="text-xl font-bold text-[#05469B] mt-1">{viewData.HieuXe} {viewData.LoaiXe} {viewData.PhienBan ? `- ${viewData.PhienBan}` : ''}</p>
                  <div className="flex gap-2 mt-3">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold uppercase">{viewData.LoaiPhuongTien}</span>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">{viewData.Mucdichsudung}</span>
                    <span className={`px-2.5 py-1 rounded text-xs font-bold ${viewData.Hientrang === 'Đang hoạt động' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {viewData.Hientrang}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Đơn vị quản lý</p>
                  <p className="text-lg font-black text-gray-800">{getUnitFullName(viewData.ID_DonVi)}</p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-5 rounded-xl border border-gray-200 shrink-0">
                <div><p className="text-xs text-gray-500 font-bold mb-1">Chủ sở hữu</p><p className="font-semibold text-gray-800">{viewData.donvichusohuu || '-'}</p></div>
                <div><p className="text-xs text-gray-500 font-bold mb-1">Số Khung</p><p className="font-semibold text-gray-800">{viewData.SoKhung || '-'}</p></div>
                <div><p className="text-xs text-gray-500 font-bold mb-1">Số Máy</p><p className="font-semibold text-gray-800">{viewData.SoMay || '-'}</p></div>
                <div><p className="text-xs text-gray-500 font-bold mb-1">Định vị GPS</p><p className="font-semibold text-gray-800">{viewData.GPS || '-'}</p></div>
                
                <div><p className="text-xs text-gray-500 font-bold mb-1">Năm Sản Xuất</p><p className="font-semibold text-gray-800">{viewData.NamSX || '-'}</p></div>
                <div><p className="text-xs text-gray-500 font-bold mb-1">Năm Đăng Ký</p><p className="font-semibold text-gray-800">{viewData.NamDK || '-'}</p></div>
                <div><p className="text-xs text-gray-500 font-bold mb-1">Số Chỗ / Tải trọng</p><p className="font-semibold text-gray-800">{viewData.SoCho || '-'}</p></div>
                <div><p className="text-xs text-gray-500 font-bold mb-1">Nhiên Liệu</p><p className="font-semibold text-gray-800">{viewData.LoaiNhienLieu || '-'}</p></div>
              </div>

              {/* Chart Section */}
              <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm shrink-0">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2"><BarChart3 size={18} className="text-[#05469B]"/> Thống kê Quãng đường & Chi phí</h4>
                  
                  {/* Chú giải (Legend) */}
                  <div className="flex flex-wrap gap-3 text-[9px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1"><div className="w-4 h-1.5 bg-emerald-500 rounded-full"></div> <span>Số Km</span></div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div> <span>Nhiên liệu</span></div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div> <span>Sửa chữa</span></div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></div> <span>Cầu đường</span></div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-cyan-500 rounded-sm"></div> <span>Rửa xe</span></div>
                    <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-purple-500 rounded-sm"></div> <span>Khấu hao</span></div>
                  </div>
                </div>

                {viewHistoryCosts.length === 0 ? (
                  <div className="text-center py-10 bg-white border border-dashed border-gray-300 rounded-xl text-gray-400">
                    <Receipt className="mx-auto mb-2 opacity-50" size={32}/>
                    <p>Chưa có dữ liệu khai báo chi phí cho xe này.</p>
                  </div>
                ) : (
                  <div className="relative h-64 mt-4 px-12">
                    {/* Trục Tung Trái (Chi phí) */}
                    <div className="absolute left-0 top-0 h-[calc(100%-24px)] flex flex-col justify-between text-[9px] font-bold text-gray-400 border-r border-gray-100 pr-2">
                      <span>{formatCurrency(chartScale.maxCP)} đ</span>
                      <span>{formatCurrency(chartScale.maxCP / 2)} đ</span>
                      <span>0 đ</span>
                    </div>
                    {/* Trục Tung Phải (Km) */}
                    <div className="absolute right-0 top-0 h-[calc(100%-24px)] flex flex-col justify-between text-[9px] font-bold text-emerald-600 border-l border-gray-100 pl-2 text-right">
                      <span>{formatCurrency(chartScale.maxKm)} km</span>
                      <span>{formatCurrency(chartScale.maxKm / 2)} km</span>
                      <span>0 km</span>
                    </div>

                    {/* Vùng Vẽ Biểu đồ */}
                    <div className="relative w-full h-[calc(100%-24px)] border-b border-gray-200 flex items-end z-0">
                      
                      {/* Lưới ngang (Grid lines) */}
                      <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-gray-100 -z-10"></div>

                      {/* SVG Line Chart cho Số Km */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline 
                          points={viewHistoryCosts.map((cost, idx) => `${(idx + 0.5) * (100 / viewHistoryCosts.length)},${100 - ((Number(cost.KmHienTai) || 0) / chartScale.maxKm * 100)}`).join(' ')} 
                          fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" strokeDasharray="4 4"
                        />
                      </svg>

                      {/* Cột Chi phí (Stacked Bar) */}
                      {viewHistoryCosts.map((cost, idx) => {
                        const nl = Number(cost.ChiPhiNhienLieu) || 0;
                        const cd = Number(cost.Phicauduong_benbai) || 0;
                        const rx = Number(cost.Phiruaxe) || 0;
                        const bd = Number(cost.ChiPhiBaoDuong_SuaChua) || 0;
                        const kh = Number(cost.ChiPhiThue_KhauHao) || 0;
                        const totalCP = nl + cd + rx + bd + kh;
                        const km = Number(cost.KmHienTai) || 0;

                        const hNL = chartScale.maxCP > 0 ? (nl / chartScale.maxCP) * 100 : 0;
                        const hCD = chartScale.maxCP > 0 ? (cd / chartScale.maxCP) * 100 : 0;
                        const hRX = chartScale.maxCP > 0 ? (rx / chartScale.maxCP) * 100 : 0;
                        const hBD = chartScale.maxCP > 0 ? (bd / chartScale.maxCP) * 100 : 0;
                        const hKH = chartScale.maxCP > 0 ? (kh / chartScale.maxCP) * 100 : 0;
                        
                        const totalHeight = Math.max((totalCP / chartScale.maxCP) * 100, totalCP > 0 ? 2 : 0);
                        const costId = getCostId(cost) || `chart-${idx}`;

                        return (
                          <div key={costId} className="flex-1 flex flex-col items-center justify-end group relative h-full">
                            
                            {/* Nút tròn trên Line (tách riêng khỏi SVG để có hiệu ứng hover) */}
                            <div style={{ bottom: `calc(${km > 0 ? (km / chartScale.maxKm * 100) : 0}% - 4px)` }} className="absolute w-2.5 h-2.5 bg-white rounded-full border-2 border-emerald-500 z-30 transition-all group-hover:scale-150 group-hover:bg-emerald-500"></div>

                            {/* Stacked Bar Container */}
                            <div style={{ height: `${totalHeight}%` }} className="w-full max-w-[28px] flex flex-col justify-end opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer z-10">
                              {/* Các thành phần của cột */}
                              {hKH > 0 && <div style={{ height: `${(hKH / totalHeight) * 100}%` }} className="w-full bg-purple-500 rounded-t-sm"></div>}
                              {hRX > 0 && <div style={{ height: `${(hRX / totalHeight) * 100}%` }} className="w-full bg-cyan-500"></div>}
                              {hCD > 0 && <div style={{ height: `${(hCD / totalHeight) * 100}%` }} className="w-full bg-amber-500"></div>}
                              {hBD > 0 && <div style={{ height: `${(hBD / totalHeight) * 100}%` }} className="w-full bg-red-500"></div>}
                              {hNL > 0 && <div style={{ height: `${(hNL / totalHeight) * 100}%` }} className="w-full bg-blue-500"></div>}
                            </div>
                            
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-3 hidden group-hover:block bg-gray-900 text-white p-3 rounded-lg text-[10px] z-50 shadow-2xl whitespace-nowrap min-w-[160px] pointer-events-none">
                              <p className="font-bold text-gray-300 border-b border-gray-700 pb-1 mb-1.5 uppercase">Tháng {formatMonthYear(cost.ThangNam)}</p>
                              
                              <div className="space-y-1 mb-2">
                                {nl > 0 && <p className="flex justify-between gap-4"><span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-blue-500 rounded-sm"></span>Nhiên liệu:</span> <span>{formatCurrency(nl)} đ</span></p>}
                                {bd > 0 && <p className="flex justify-between gap-4"><span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-red-500 rounded-sm"></span>Sửa chữa:</span> <span>{formatCurrency(bd)} đ</span></p>}
                                {cd > 0 && <p className="flex justify-between gap-4"><span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber-500 rounded-sm"></span>Cầu đường:</span> <span>{formatCurrency(cd)} đ</span></p>}
                                {rx > 0 && <p className="flex justify-between gap-4"><span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-cyan-500 rounded-sm"></span>Rửa xe:</span> <span>{formatCurrency(rx)} đ</span></p>}
                                {kh > 0 && <p className="flex justify-between gap-4"><span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-purple-500 rounded-sm"></span>Khấu hao:</span> <span>{formatCurrency(kh)} đ</span></p>}
                              </div>
                              
                              <p className="flex justify-between gap-4 border-t border-gray-700 pt-1.5 font-bold"><span>TỔNG CỘNG:</span> <span className="text-red-400">{formatCurrency(totalCP)} đ</span></p>
                              <p className="flex justify-between gap-4 pt-1 font-bold"><span>SỐ KM:</span> <span className="text-emerald-400">{formatCurrency(km)} Km</span></p>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Nhãn Trục X (Tháng) */}
                    <div className="w-full h-6 flex justify-between items-end">
                      {viewHistoryCosts.map((cost, idx) => {
                        const costId = getCostId(cost) || `label-${idx}`;
                        return (
                          <div key={costId} className="flex-1 text-center text-[9px] font-black text-gray-500">{formatMonthYear(cost.ThangNam)}</div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Table - ĐÃ THÊM THANH CUỘN VÀ MAX-HEIGHT, HEADER ĐỨNG YÊN */}
              <div className="border border-gray-200 rounded-xl mt-2 flex flex-col overflow-hidden shrink-0">
                <div className="overflow-y-auto max-h-56 w-full custom-scrollbar relative">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm border-b border-gray-200">
                      <tr className="text-xs text-gray-600 uppercase tracking-wider">
                        <th className="p-3 w-28">Tháng</th>
                        <th className="p-3">Số Km</th>
                        <th className="p-3 text-right">Nhiên liệu</th>
                        <th className="p-3 text-right">Cầu đường</th>
                        <th className="p-3 text-right">Bảo dưỡng</th>
                        <th className="p-3 text-right font-bold text-red-600">Tổng CP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewHistoryCosts.slice().reverse().map((cost, idx) => { 
                        const total = (Number(cost.ChiPhiNhienLieu) || 0) + (Number(cost.Phicauduong_benbai) || 0) + (Number(cost.Phiruaxe) || 0) + (Number(cost.ChiPhiBaoDuong_SuaChua) || 0) + (Number(cost.ChiPhiThue_KhauHao) || 0);
                        const costId = getCostId(cost) || `table-${idx}`;
                        return (
                          <tr key={costId} className="hover:bg-blue-50/30">
                            <td className="p-3 font-bold text-[#05469B] bg-white">{formatMonthYear(cost.ThangNam)}</td>
                            <td className="p-3 font-medium text-emerald-600 bg-white">{formatCurrency(cost.KmHienTai)}</td>
                            <td className="p-3 text-right bg-white">{formatCurrency(cost.ChiPhiNhienLieu)}</td>
                            <td className="p-3 text-right bg-white">{formatCurrency(cost.Phicauduong_benbai)}</td>
                            <td className="p-3 text-right bg-white">{formatCurrency(cost.ChiPhiBaoDuong_SuaChua)}</td>
                            <td className="p-3 text-right font-black text-red-600 bg-white">{formatCurrency(total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
            
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0 rounded-b-2xl">
              <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CHI PHÍ HOẠT ĐỘNG --- */}
      {isCostModalOpen && selectedCarForCost && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsCostModalOpen(false)}></div>
          <div className="bg-white shadow-2xl w-full max-w-md md:max-w-xl h-full flex flex-col animate-in slide-in-from-right duration-300 relative z-10">
            
            {/* HEADER CHI TIẾT */}
            <div className="p-5 border-b border-indigo-100 bg-indigo-600 text-white flex justify-between items-start shrink-0">
              <div className="flex-1 pr-4">
                <h3 className="text-xl font-black flex items-center gap-2 mb-1.5"><Receipt size={20}/> Khai báo Chi phí</h3>
                <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                  <span className="text-white font-bold text-base tracking-wider">{selectedCarForCost.BienSo}</span>
                  <span className="mx-2 opacity-60">|</span>
                  {selectedCarForCost.HieuXe} {selectedCarForCost.LoaiXe} {selectedCarForCost.PhienBan ? `- ${selectedCarForCost.PhienBan}` : ''}
                  <span className="mx-2 opacity-60">|</span>
                  {selectedCarForCost.Mucdichsudung}
                  <span className="mx-2 opacity-60">|</span>
                  {getUnitFullName(selectedCarForCost.ID_DonVi)}
                  <span className="mx-2 opacity-60">|</span>
                  <span className={`${selectedCarForCost.Hientrang === 'Đang hoạt động' ? 'text-emerald-300' : 'text-red-300'}`}>{selectedCarForCost.Hientrang}</span>
                </p>
              </div>
              <button onClick={() => setIsCostModalOpen(false)} className="text-indigo-200 hover:text-white bg-indigo-700/50 hover:bg-indigo-700 p-2 rounded-full transition-colors mt-1 shrink-0"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col min-h-0">
              <div className="p-5 bg-white border-b border-gray-200 shadow-sm z-10 shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider flex items-center gap-1.5"><Calendar size={16} className="text-indigo-600"/> {costModalMode === 'create' ? 'Khai báo tháng mới' : 'Cập nhật tháng'}</h4>
                  {costModalMode === 'update' && (
                    <button onClick={() => {setCostModalMode('create'); setCostFormData({ID_ChiPhiXe: '', ThangNam: new Date().toISOString().slice(0, 7), ID_Xe: selectedCarForCost.ID_Xe, ID_DonVi: selectedCarForCost.ID_DonVi, KmHienTai: '', SoLitNhienLieu: '', ChiPhiNhienLieu: '', Phicauduong_benbai: '', Phiruaxe: '', ChiPhiBaoDuong_SuaChua: '', ChiPhiThue_KhauHao: '', GhiChu: ''})}} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><Plus size={14}/> Thêm mới</button>
                  )}
                </div>
                <form onSubmit={handleCostSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Tháng khai báo *</label><input type="month" required name="ThangNam" value={costFormData.ThangNam || ''} onChange={handleInputCostChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-[#FFFFF0] text-indigo-900 font-bold" /></div>
                    
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Km hiện tại (Đồng hồ)</label><input type="text" name="KmHienTai" value={formatCurrency(costFormData.KmHienTai)} onChange={handleInputCostChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-[#FFFFF0]" /></div>
                    
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Số Lít nhiên liệu tiêu thụ</label><input type="number" name="SoLitNhienLieu" value={costFormData.SoLitNhienLieu || ''} onChange={handleInputCostChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-[#FFFFF0]" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Chi phí Nhiên liệu (VNĐ)</label><input type="text" name="ChiPhiNhienLieu" value={formatCurrency(costFormData.ChiPhiNhienLieu)} onChange={handleInputCostChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-[#FFFFF0]" /></div>
                    
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Phí cầu đường bến bãi (VNĐ)</label><input type="text" name="Phicauduong_benbai" value={formatCurrency(costFormData.Phicauduong_benbai)} onChange={handleInputCostChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-[#FFFFF0]" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Phí rửa xe (VNĐ)</label><input type="text" name="Phiruaxe" value={formatCurrency(costFormData.Phiruaxe)} onChange={handleInputCostChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-[#FFFFF0]" /></div>
                    
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">CP Bảo dưỡng/Sửa chữa</label><input type="text" name="ChiPhiBaoDuong_SuaChua" value={formatCurrency(costFormData.ChiPhiBaoDuong_SuaChua)} onChange={handleInputCostChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-[#FFFFF0]" /></div>
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">CP Thuê ngoài/Khấu hao</label><input type="text" name="ChiPhiThue_KhauHao" value={formatCurrency(costFormData.ChiPhiThue_KhauHao)} onChange={handleInputCostChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-[#FFFFF0]" /></div>
                    
                    <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Ghi chú (Nơi sửa chữa, lý do...)</label><textarea name="GhiChu" value={costFormData.GhiChu || ''} onChange={handleInputCostChange} rows={2} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-[#FFFFF0] resize-none"></textarea></div>
                  </div>
                  <button type="submit" disabled={submitting} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex justify-center items-center gap-2 transition-colors shadow-md">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {costModalMode === 'create' ? 'Lưu Chi Phí' : 'Cập Nhật Thay Đổi'}
                  </button>
                </form>
              </div>

              <div className="p-5 flex-1">
                <h4 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-3">Lịch sử khai báo ({carCosts.length} tháng)</h4>
                <div className="space-y-3">
                  {carCosts.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300"><Info className="mx-auto w-6 h-6 mb-2 opacity-50"/><p className="text-sm font-medium">Chưa có dữ liệu chi phí nào</p></div>
                  ) : (
                    carCosts.map((cost, idx) => {
                      const tongCP = (Number(cost.ChiPhiNhienLieu) || 0) + (Number(cost.Phicauduong_benbai) || 0) + (Number(cost.Phiruaxe) || 0) + (Number(cost.ChiPhiBaoDuong_SuaChua) || 0) + (Number(cost.ChiPhiThue_KhauHao) || 0);
                      const costId = getCostId(cost) || `log-${idx}`;
                      return (
                        <div key={costId} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-300 transition-colors group">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-sm">{formatMonthYear(cost.ThangNam)}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => editCost(cost)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={14}/></button>
                              <button onClick={() => {setItemToDelete({id: costId, type: 'chiphi'}); setIsConfirmOpen(true);}} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                            <div className="text-gray-500">Số Km: <span className="font-semibold text-gray-800">{formatCurrency(cost.KmHienTai)}</span></div>
                            <div className="text-gray-500 text-right">Lít NL: <span className="font-semibold text-gray-800">{cost.SoLitNhienLieu} L</span></div>
                            <div className="text-gray-500">Nhiên liệu: <span className="font-semibold text-gray-800">{formatCurrency(cost.ChiPhiNhienLieu)}</span></div>
                            <div className="text-gray-500 text-right">Bảo dưỡng: <span className="font-semibold text-gray-800">{formatCurrency(cost.ChiPhiBaoDuong_SuaChua)}</span></div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                            <span className="text-xs font-bold text-gray-400">TỔNG CHI PHÍ:</span>
                            <span className="text-sm font-black text-red-600">{formatCurrency(tongCP)} VNĐ</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- XÁC NHẬN XÓA --- */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
