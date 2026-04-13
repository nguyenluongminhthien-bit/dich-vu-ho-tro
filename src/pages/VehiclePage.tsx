import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, X, AlertCircle, Loader2, Save, 
  Car, Building2, MapPin, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen,
  Receipt, Calendar, Info, Eye, BarChart3, Briefcase
} from 'lucide-react';
import { apiService } from '../services/api';
import { DonVi, TS_Xe, CP_HoatDongXe } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { buildHierarchicalOptions, getUnitEmoji } from '../utils/hierarchy'; 

// --- HÀM TỰ ĐỘNG DÒ TÌM ID TỪ SUPABASE ---
const getCostId = (cp: any) => cp.id || cp.id_chi_phi_xe || '';
const getCostCarId = (cp: any) => cp.id_ts_xe || cp.id_phuong_tien || '';

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

// --- HÀM HỖ TRỢ TÍNH TOÁN INLINE (INLINE MATH) ---
const safeEvalMath = (val: any) => {
  if (!val) return '';
  try {
    let expr = String(val).replace(/[^\d+\-*/.()]/g, '');
    if (/[+\-*/]/.test(expr)) {
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${expr}`)();
      if (!isNaN(result) && isFinite(result)) return Math.round(result).toString();
    }
    return String(val).replace(/\D/g, '');
  } catch {
    return String(val).replace(/\D/g, '');
  }
};

const formatMathInput = (val: string | number | undefined | null) => {
  if (!val) return '';
  const str = String(val);
  if (/[+\-*/()]/.test(str)) return str; // Đang có phép tính -> Giữ nguyên để gõ
  return formatCurrency(str); // Không có phép tính -> Format tiền tệ
};

export default function VehiclePage() {
  const { user } = useAuth();
  const [donViList, setDonViList] = useState<DonVi[]>([]);
  const [xeData, setXeData] = useState<TS_Xe[]>([]);
  const [chiPhiData, setChiPhiData] = useState<any[]>([]); 
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [carSearchTerm, setCarSearchTerm] = useState('');
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);

  const [plateError, setPlateError] = useState(false);
  const [selectedCarForCost, setSelectedCarForCost] = useState<TS_Xe | null>(null);

  const [carModal, setCarModal] = useState<{
    isOpen: boolean; mode: 'create' | 'update'; formData: Partial<TS_Xe>;
  }>({ isOpen: false, mode: 'create', formData: {} });

  const [costModal, setCostModal] = useState<{
    isOpen: boolean; mode: 'create' | 'update'; formData: any;
  }>({ isOpen: false, mode: 'create', formData: {} });

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState<TS_Xe | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'xe' | 'chiphi'} | null>(null);

    // Shorthand — giữ tên cũ để không cần đổi hàng trăm chỗ
  const isCarModalOpen  = carModal.isOpen;
  const modalMode       = carModal.mode;
  const carFormData     = carModal.formData;
  const setCarFormData  = (d: any) => setCarModal(p => ({ ...p, formData: typeof d === 'function' ? d(p.formData) : d }));

  const isCostModalOpen  = costModal.isOpen;
  const costModalMode    = costModal.mode;
  const costFormData     = costModal.formData;
  const setCostFormData  = (d: any) => setCostModal(p => ({ ...p, formData: typeof d === 'function' ? d(p.formData) : d }));

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
    donViList.forEach(dv => { map[dv.id] = dv.ten_don_vi; });
    return map;
  }, [donViList]);

  const allowedDonViIds = useMemo(() => {
    if (!user) return [];
    const userIdDonVi = user.id_don_vi || (user as any).idDonVi;
    if (userIdDonVi === 'ALL' || String(user.quyen).toLowerCase() === 'admin') return donViList.map(dv => dv.id);
    const level1 = [userIdDonVi];
    const level2 = donViList.filter(dv => level1.includes(dv.cap_quan_ly)).map(dv => dv.id);
    const level3 = donViList.filter(dv => level2.includes(dv.cap_quan_ly)).map(dv => dv.id);
    const allAllowed = [...level1, ...level2, ...level3];
    return donViList.filter(dv => allAllowed.includes(dv.id)).map(dv => dv.id);
  }, [user, donViList]);

  const filteredUnits = useMemo(() => {
    let baseUnits = donViList.filter(item => allowedDonViIds.includes(item.id));
    if (!unitSearchTerm) return baseUnits;

    const lower = unitSearchTerm.toLowerCase();
    const matchedIds = new Set<string>();

    baseUnits.forEach(u => {
      if (String(u.ten_don_vi || '').toLowerCase().includes(lower) || String(u.id || '').toLowerCase().includes(lower)) {
        matchedIds.add(u.id);
        let parentId = u.cap_quan_ly;
        while (parentId && parentId !== 'HO') {
          matchedIds.add(parentId);
          const parentUnit = baseUnits.find(p => p.id === parentId);
          parentId = parentUnit ? parentUnit.cap_quan_ly : null;
        }
      }
    });

    const addChildren = (parentId: string) => {
      baseUnits.forEach(u => {
        if (u.cap_quan_ly === parentId && !matchedIds.has(u.id)) {
          matchedIds.add(u.id);
          addChildren(u.id);
        }
      });
    };
    
    const initialMatches = Array.from(matchedIds);
    initialMatches.forEach(id => addChildren(id));

    return baseUnits.filter(item => matchedIds.has(item.id));
  }, [donViList, unitSearchTerm, allowedDonViIds]);

  const parentUnits = useMemo(() => filteredUnits.filter(item => item.cap_quan_ly === 'HO' || !item.cap_quan_ly), [filteredUnits]);
  const getChildUnits = (parentId: string) => filteredUnits.filter(item => item.cap_quan_ly === parentId);

  const { vpdhUnits, ctttNamUnits, ctttBacUnits, otherUnits } = useMemo(() => {
    const vpdh = parentUnits
      .filter(u => String(u.phia || '').toLowerCase().includes('vpđh') || String(u.loai_hinh || '').toLowerCase().includes('tổng công ty') || String(u.loai_hinh || '').toLowerCase().includes('văn phòng'))
      .sort((a, b) => {
        // Luôn ép THACO AUTO (Công ty mẹ) lên vị trí số 1
        if (a.ten_don_vi === 'THACO AUTO') return -1;
        if (b.ten_don_vi === 'THACO AUTO') return 1;
        
        // Các đơn vị VPĐH khác (như Phân Phối) tự động nằm bên dưới theo thứ tự gốc
        return 0; 
      });
    const ctttNam = parentUnits.filter(u => !vpdh.includes(u) && String(u.phia || '').toLowerCase().includes('nam'));
    const ctttBac = parentUnits.filter(u => !vpdh.includes(u) && !ctttNam.includes(u) && String(u.phia || '').toLowerCase().includes('bắc'));
    const others = parentUnits.filter(u => !vpdh.includes(u) && !ctttNam.includes(u) && !ctttBac.includes(u));
    return { vpdhUnits: vpdh, ctttNamUnits: ctttNam, ctttBacUnits: ctttBac, otherUnits: others };
  }, [parentUnits]);

  const toggleParent = (parentId: string) => setExpandedParents(prev => prev.includes(parentId) ? prev.filter(id => id !== parentId) : [...prev, parentId]);

  const filteredCars = useMemo(() => {
    let result = xeData.filter(item => allowedDonViIds.includes(item.id_don_vi));
    if (selectedUnitFilter) {
      const childUnitIds = donViList.filter(item => item.cap_quan_ly === selectedUnitFilter).map(c => c.id);
      const validIds = [selectedUnitFilter, ...childUnitIds];
      result = result.filter(item => validIds.includes(item.id_don_vi));
    }
    if (carSearchTerm) {
      const lower = carSearchTerm.toLowerCase();
      result = result.filter(item => 
        String(item.bien_so || '').toLowerCase().includes(lower) || 
        String(item.hieu_xe || '').toLowerCase().includes(lower) || 
        String(item.loai_xe || '').toLowerCase().includes(lower)
      );
    }
    return result;
  }, [xeData, carSearchTerm, selectedUnitFilter, allowedDonViIds, donViList]);

  const selectedUnitName = useMemo(() => {
    if (!selectedUnitFilter) return 'Tất cả Đơn vị';
    const unit = donViList.find(d => d.id === selectedUnitFilter);
    return unit ? unit.ten_don_vi : 'Đơn vị không xác định';
  }, [selectedUnitFilter, donViList]);

  const openCarModal = (mode: 'create' | 'update', item?: TS_Xe) => {
    setCarModal(prev => ({ ...prev, mode })); setPlateError(false);
    const defaultDonViId = user?.id_don_vi || (user as any)?.idDonVi;
    if (item) { setCarFormData({ ...item }); } 
    else {
      setCarFormData({
        id: '', id_don_vi: selectedUnitFilter || (defaultDonViId !== 'ALL' ? defaultDonViId : ''), muc_dich_su_dung: 'Xe công', ma_tai_san: '', don_vi_chu_so_huu: '', nguyen_gia: '', cp_thue_khau_hao: '', 
        bien_so: '', loai_phuong_tien: 'Ô tô du lịch', hieu_xe: '', loai_xe: '', phien_ban: '', mau_xe: '', nam_sx: '', nam_dk: '', so_khung: '', so_may: '',
        so_cho: '', loai_nhien_lieu: 'Xăng', dung_tich: '', cong_thuc_banh: '', hinh_thuc_so_huu: 'Sở hữu', gps: 'Có', hien_trang: 'Đang hoạt động', ghi_chu: ''
      });
    }
    setCarModal(prev => ({ ...prev, isOpen: true })); setError(null);
  };

  // 1. CẬP NHẬT HÀM LƯU XE CHÍNH
  const handleCarSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carFormData.id_don_vi) return alert("Vui lòng chọn Đơn vị quản lý!");
    if (!carFormData.hieu_xe) return alert("Vui lòng chọn Hiệu xe!");
    
    let finalData = { ...carFormData };

    // 🟢 TIỀN XỬ LÝ: Tự sinh mã ID trước khi ném lên DB nếu là tạo mới
    if (modalMode === 'create' && !finalData.id) {
      finalData.id = `XE-${Date.now()}`;
    }

    setSubmitting(true); setError(null);
    try {
      const response = await apiService.save(finalData, modalMode, "ts_xe");
      
      const savedId = response?.id || response?.newId || finalData.id;
      const newCar = { ...finalData, id: savedId } as TS_Xe;

      if (modalMode === 'create') setXeData(prev => [newCar, ...prev]);
      else setXeData(prev => prev.map(item => item.id === savedId ? newCar : item));
      
      setCarModal(prev => ({ ...prev, isOpen: false })); 
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu Xe.'); } 
    finally { setSubmitting(false); }
  };

  const handleInputCarChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'bien_so') {
      if (/[\s\-\.]/.test(value)) { setPlateError(true); setTimeout(() => setPlateError(false), 4000); }
      const cleanPlate = value.toUpperCase().replace(/[\s\-\.]/g, '');
      setCarFormData(prev => ({ ...prev, [name]: cleanPlate })); return;
    }
    if (name === 'nguyen_gia' || name === 'cp_thue_khau_hao') {
      setCarFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '') })); return;
    }
    setCarFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- XỬ LÝ CHI PHÍ VÀ MÁY TÍNH INLINE ---
  const carCosts = useMemo(() => {
    if (!selectedCarForCost) return [];
    return chiPhiData.filter(cp => getCostCarId(cp) === selectedCarForCost.id).sort((a, b) => b.thang_nam.localeCompare(a.thang_nam));
  }, [chiPhiData, selectedCarForCost]);

  const viewHistoryCosts = useMemo(() => {
    if (!viewData) return [];
    return chiPhiData.filter(cp => getCostCarId(cp) === viewData.id).sort((a, b) => a.thang_nam.localeCompare(b.thang_nam));
  }, [chiPhiData, viewData]);

  const openCostModal = (car: TS_Xe) => {
    setSelectedCarForCost(car); setCostModal(prev => ({ ...prev, mode: 'create' }));
    setCostFormData({
      id: '', thang_nam: new Date().toISOString().slice(0, 7), id_ts_xe: car.id, id_don_vi: car.id_don_vi, 
      km_hien_tai: '', so_lit_nhien_lieu: '', cp_nhien_lieu: '', cp_cau_duong_ben_bai: '', cp_rua_xe: '', cp_bao_duong_sua_chua: '', cp_thue_khau_hao: '', ghi_chu: ''
    });
    setCostModal(prev => ({ ...prev, isOpen: true }));
  };

  const editCost = (cost: any) => {
    setCostModal(prev => ({ ...prev, mode: 'update' }));
    setCostFormData({ ...cost, id: getCostId(cost), id_ts_xe: getCostCarId(cost), id_don_vi: cost.id_don_vi || selectedCarForCost?.id_don_vi || '' });
  };

  const handleInputCostChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let finalValue = value;
    
    if (name === 'km_hien_tai') { 
      finalValue = value.replace(/\D/g, ''); 
    } else if (['cp_nhien_lieu', 'cp_cau_duong_ben_bai', 'cp_rua_xe', 'cp_bao_duong_sua_chua', 'cp_thue_khau_hao'].includes(name)) {
      finalValue = value.replace(/[^0-9+\-*/().\s]/g, '');
    }
    
    setCostFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleCostMathBlur = (name: string, value: string) => {
    setCostFormData(prev => ({ ...prev, [name]: safeEvalMath(value) }));
  };

  const handleCostMathKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, name: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCostMathBlur(name, e.currentTarget.value);
    }
  };

  // 2. CẬP NHẬT HÀM LƯU CHI PHÍ XE
  const handleCostSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    try {
      let finalData = { ...costFormData };
      
      // Xử lý tính toán công thức
      finalData.cp_nhien_lieu = safeEvalMath(finalData.cp_nhien_lieu);
      finalData.cp_cau_duong_ben_bai = safeEvalMath(finalData.cp_cau_duong_ben_bai);
      finalData.cp_rua_xe = safeEvalMath(finalData.cp_rua_xe);
      finalData.cp_bao_duong_sua_chua = safeEvalMath(finalData.cp_bao_duong_sua_chua);
      finalData.cp_thue_khau_hao = safeEvalMath(finalData.cp_thue_khau_hao);

      // 🟢 TIỀN XỬ LÝ: Tự sinh mã ID trước khi ném lên DB nếu là tạo mới
      if (costModalMode === 'create' && !finalData.id) {
        finalData.id = `CP-${Date.now()}`;
      }

      const response = await apiService.save(finalData, costModalMode, "cp_hoat_dong_xe");
      
      const savedId = response?.id || response?.newId || finalData.id;
      const savedCost = { ...finalData, id: savedId };

      if (costModalMode === 'create') {
        setChiPhiData(prev => [savedCost, ...prev]);
      } else {
        setChiPhiData(prev => prev.map(item => getCostId(item) === finalData.id ? savedCost : item));
      }
      
      // Reset form sau khi lưu
      setCostModal(prev => ({ ...prev, mode: 'create' }));
      setCostFormData({
        id: '', thang_nam: costFormData.thang_nam, id_ts_xe: selectedCarForCost?.id || '', id_don_vi: selectedCarForCost?.id_don_vi || '', 
        km_hien_tai: '', so_lit_nhien_lieu: '', cp_nhien_lieu: '', cp_cau_duong_ben_bai: '', cp_rua_xe: '', cp_bao_duong_sua_chua: '', cp_thue_khau_hao: '', ghi_chu: ''
      });

    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu Chi phí.'); } 
    finally { setSubmitting(false); }
  };

  const chartScale = useMemo(() => {
    if (viewHistoryCosts.length === 0) return { maxCP: 1, maxKm: 1 };
    const costs = viewHistoryCosts.map(c => (Number(c.cp_nhien_lieu) || 0) + (Number(c.cp_cau_duong_ben_bai) || 0) + (Number(c.cp_rua_xe) || 0) + (Number(c.cp_bao_duong_sua_chua) || 0) + (Number(c.cp_thue_khau_hao) || 0));
    const kms = viewHistoryCosts.map(c => Number(c.km_hien_tai) || 0);
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
            if (cpId) await apiService.delete(cpId, "cp_hoat_dong_xe");
          }
        }
        await apiService.delete(itemToDelete.id, "ts_xe");
        setXeData(prev => prev.filter(item => item.id !== itemToDelete.id));
        setChiPhiData(prev => prev.filter(item => getCostCarId(item) !== itemToDelete.id));
      } else {
        await apiService.delete(itemToDelete.id, "cp_hoat_dong_xe");
        setChiPhiData(prev => prev.filter(item => getCostId(item) !== itemToDelete.id));
      }
      setIsConfirmOpen(false); setItemToDelete(null); 
    } catch (err: any) { setError(err.message || 'Lỗi xóa dữ liệu.'); } 
    finally { setSubmitting(false); }
  };

  const getUnitFullName = (id: string) => {
    const unit = donViList.find(u => u.id === id);
    if (!unit) return '-';
    if (unit.cap_quan_ly && unit.cap_quan_ly !== 'HO') {
      const parent = donViList.find(u => u.id === unit.cap_quan_ly);
      if (parent) return `${parent.ten_don_vi} - ${unit.ten_don_vi}`;
    }
    return unit.ten_don_vi;
  };

  const renderUnitTree = (parent: DonVi, level: number = 1) => {
    const children = getChildUnits(parent.id);
    const isExpanded = expandedParents.includes(parent.id) || !!unitSearchTerm;
    const isParentDimmed = parent.trang_thai === 'Đại lý' || parent.trang_thai === 'Đầu tư mới';

    return (
      <div key={parent.id} className={level === 1 ? "mb-1" : "mt-1"}>
        <button 
          onClick={() => { setSelectedUnitFilter(parent.id); if (children.length > 0) toggleParent(parent.id); }} 
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedUnitFilter === parent.id ? 'bg-blue-50 text-[#05469B]' : 'text-gray-700 hover:bg-gray-50'} ${isParentDimmed ? 'opacity-50' : ''}`}
        >
          {children.length > 0 ? (isExpanded ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />) : <div className="w-4 shrink-0" />}
          
          <span className="shrink-0">{getUnitEmoji(parent.loai_hinh)}</span>
          
          <span className="truncate text-left">{parent.ten_don_vi}</span>
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
        <button onClick={() => setIsListCollapsed(false)} className="absolute top-6 left-6 z-20 bg-white p-2.5 rounded-lg shadow-md border border-gray-200 text-[#05469B] hover:bg-blue-50 transition-all lg:hidden" title="M mở danh sách đơn vị"><PanelLeftOpen size={20} /></button>
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
          <button onClick={() => { setSelectedUnitFilter(null); if(window.innerWidth < 1024) setIsListCollapsed(true); }} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold mb-4 transition-colors ${selectedUnitFilter === null ? 'bg-blue-50 text-[#05469B] border border-blue-100' : 'text-gray-700 hover:bg-gray-50'}`}>
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
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative transition-all duration-300 w-full">
        <div className={`flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 transition-all duration-300 ${isListCollapsed ? 'pl-10 lg:pl-12' : ''}`}>
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

        {/* BẢNG DỮ LIỆU */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${isListCollapsed ? 'ml-10 lg:ml-0' : ''}`}>
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
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="p-4 font-black text-[#05469B] text-base whitespace-nowrap">🚙 {item.bien_so}</td>
                      <td className="p-4 font-bold text-gray-800">{item.hieu_xe} {item.loai_xe} {item.phien_ban ? `- ${item.phien_ban}` : ''}</td>
                      <td className="p-4 text-gray-600 font-medium">{item.loai_phuong_tien}</td>
                      <td className="p-4 text-indigo-600 font-semibold">{item.muc_dich_su_dung}</td>
                      <td className="p-4 text-gray-700 font-bold">{getUnitFullName(item.id_don_vi)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap ${item.hien_trang === 'Đang hoạt động' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                          {item.hien_trang === 'Đang hoạt động' ? '🟢' : '🔴'} {item.hien_trang}
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
                            <button onClick={() => { setItemToDelete({id: item.id, type: 'xe'}); setIsConfirmOpen(true); }} className="py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded flex items-center justify-center shadow-sm transition-colors" title="Xóa">
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
              <button onClick={() => setCarModal(prev => ({ ...prev, isOpen: false }))} disabled={submitting} className="text-gray-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleCarSave} className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0">
              
              <div className="bg-blue-50/40 p-5 rounded-xl border border-blue-100">
                <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2"><div className="w-2 h-6 bg-[#05469B] rounded-full"></div> Hồ sơ Đăng ký & Sở hữu</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Biển Số *</label>
                    <input type="text" required name="bien_so" value={carFormData.bien_so || ''} onChange={handleInputCarChange} placeholder="VD: 51H12345" className={`w-full p-2.5 border rounded-lg outline-none font-bold focus:ring-2 focus:ring-[#05469B] ${plateError ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-[#FFFFF0] text-[#05469B]'}`} />
                    {plateError && <p className="text-[10px] text-red-500 mt-1 font-bold animate-pulse">Lỗi: Gõ liền, không dấu cách/-/. !</p>}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Đơn vị quản lý *</label>
                    <select 
                      required 
                      name="id_don_vi" 
                      value={carFormData.id_don_vi || ''} 
                      onChange={handleInputCarChange} 
                      className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]"
                      style={{ fontFamily: 'monospace, sans-serif' }}
                    >
                      <option value="">-- Chọn đơn vị --</option>
                      {buildHierarchicalOptions(donViList.filter(dv => allowedDonViIds.includes(dv.id))).map(({ unit, prefix }) => (
                        <option key={unit.id} value={unit.id} className="font-normal text-gray-700">
                          {prefix}{getUnitEmoji(unit.loai_hinh)} {unit.ten_don_vi}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Hình thức Sở hữu</label>
                    <select name="hinh_thuc_so_huu" value={carFormData.hinh_thuc_so_huu || 'Sở hữu'} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]">
                      <option value="Sở hữu">Sở hữu</option>
                      <option value="Quản lý sử dụng">Quản lý sử dụng</option>
                      <option value="Thuê">Thuê</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Mục đích sử dụng</label>
                    <select name="muc_dich_su_dung" value={carFormData.muc_dich_su_dung || 'Xe công'} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-[#05469B]">
                      <option value="Xe công">Xe công</option>
                      <option value="Xe lái thử">Xe lái thử</option>
                      <option value="Xe thay thế cho KH">Xe thay thế cho KH</option>
                      <option value="Xe sửa chữa lưu động">Xe sửa chữa lưu động</option>
                    </select>
                  </div>

                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Mã Tài Sản (Kế toán)</label><input type="text" name="ma_tai_san" value={carFormData.ma_tai_san || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Đơn vị Đứng tên Cà vẹt (Chủ sở hữu)</label><input type="text" name="don_vi_chu_so_huu" value={carFormData.don_vi_chu_so_huu || ''} onChange={handleInputCarChange} placeholder="Tên công ty/cá nhân trên Giấy đăng ký xe" className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nguyên giá (VNĐ)</label>
                    <input type="text" name="nguyen_gia" value={formatCurrency(carFormData.nguyen_gia)} onChange={handleInputCarChange} placeholder="Giá trị mua xe ban đầu..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Chi phí Thuê / Khấu hao tháng (VNĐ)</label>
                    <input type="text" name="cp_thue_khau_hao" value={formatCurrency(carFormData.cp_thue_khau_hao)} onChange={handleInputCarChange} placeholder="Chi phí cố định hàng tháng..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><div className="w-2 h-6 bg-gray-400 rounded-full"></div> Đặc điểm Kỹ thuật</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Loại phương tiện</label>
                    <select name="loai_phuong_tien" value={carFormData.loai_phuong_tien || 'Ô tô du lịch'} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]">
                      <option value="Ô tô du lịch">Ô tô du lịch</option>
                      <option value="Ô tô tải">Ô tô tải</option>
                      <option value="Xe máy">Xe máy</option>
                      <option value="Xe chuyên dụng">Xe chuyên dụng</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Hiệu xe (Hãng) *</label>
                    <select required name="hieu_xe" value={carFormData.hieu_xe || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#05469B]">
                      <option value="" className="font-normal text-gray-500">-- Chọn Hãng --</option>
                      {['KIA', 'MAZDA', 'PEUGEOT', 'BMW', 'BMW MOTORAD', 'JEEP', 'RAM'].map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Loại xe *</label><input type="text" required name="loai_xe" value={carFormData.loai_xe || ''} onChange={handleInputCarChange} placeholder="VD: K3, CX-5..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Phiên bản</label><input type="text" name="phien_ban" value={carFormData.phien_ban || ''} onChange={handleInputCarChange} placeholder="VD: 2.0 Premium..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Năm SX</label><input type="text" name="nam_sx" value={carFormData.nam_sx || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Năm Đăng ký</label><input type="text" name="nam_dk" value={carFormData.nam_dk || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Màu xe</label><input type="text" name="mau_xe" value={carFormData.mau_xe || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Số chỗ ngồi</label><input type="number" name="so_cho" value={carFormData.so_cho || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Số Khung</label><input type="text" name="so_khung" value={carFormData.so_khung || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Số Máy</label><input type="text" name="so_may" value={carFormData.so_may || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Loại Nhiên liệu</label><select name="loai_nhien_lieu" value={carFormData.loai_nhien_lieu || 'Xăng'} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]"><option value="Xăng">Xăng</option><option value="Dầu Diesel">Dầu Diesel</option><option value="Điện">Điện</option><option value="Khác">Khác</option></select></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Dung tích</label><input type="text" name="dung_tich" value={carFormData.dung_tich || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  
                  <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Công thức bánh (Xe tải)</label><input type="text" name="cong_thuc_banh" value={carFormData.cong_thuc_banh || ''} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" placeholder="VD: 4x2..." /></div>
                </div>
              </div>

              <div className="bg-orange-50/40 p-5 rounded-xl border border-orange-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Định vị GPS</label><select name="gps" value={carFormData.gps || 'Có'} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]"><option value="Có">Có</option><option value="Không">Không</option></select></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Hiện trạng</label><select name="hien_trang" value={carFormData.hien_trang || 'Đang hoạt động'} onChange={handleInputCarChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] font-bold text-[#05469B] outline-none focus:ring-2 focus:ring-[#05469B]"><option value="Đang hoạt động">Đang hoạt động</option><option value="Sửa chữa">Sửa chữa</option><option value="Ngừng hoạt động">Ngừng hoạt động</option><option value="Đã Thanh lý">Đã Thanh lý</option></select></div>
                  <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Ghi chú khác</label><textarea name="ghi_chu" value={carFormData.ghi_chu || ''} onChange={handleInputCarChange} rows={2} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] resize-none"></textarea></div>
                </div>
              </div>

              <div className="pt-5 border-t border-gray-100 flex justify-end gap-3 mt-8 shrink-0">
                <button type="button" onClick={() => setCarModal(prev => ({ ...prev, isOpen: false }))} className="px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition-colors">Hủy</button>
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
            
            <div className="p-6 overflow-y-auto flex-1 min-h-0 flex flex-col gap-6">
              
              {/* Info Header */}
              <div className="flex items-center gap-5 border-b border-gray-100 pb-6 shrink-0">
                <div className="w-24 h-24 bg-blue-50 text-[#05469B] rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner">
                  <Car size={48} />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-gray-800 tracking-tight">{viewData.bien_so}</h2>
                  <p className="text-xl font-bold text-[#05469B] mt-1">{viewData.hieu_xe} {viewData.loai_xe} {viewData.phien_ban ? `- ${viewData.phien_ban}` : ''}</p>
                  <div className="flex gap-2 mt-3">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold uppercase">{viewData.loai_phuong_tien}</span>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">{viewData.muc_dich_su_dung}</span>
                    <span className={`px-2.5 py-1 rounded text-xs font-bold ${viewData.hien_trang === 'Đang hoạt động' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {viewData.hien_trang}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Đơn vị quản lý</p>
                  <p className="text-lg font-black text-gray-800">{getUnitFullName(viewData.id_don_vi)}</p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-5 rounded-xl border border-gray-200 shrink-0">
                <div><p className="text-xs text-gray-500 font-bold mb-1">Chủ sở hữu</p><p className="font-semibold text-gray-800">{viewData.don_vi_chu_so_huu || '-'}</p></div>
                <div><p className="text-xs text-gray-500 font-bold mb-1">Số Khung</p><p className="font-semibold text-gray-800">{viewData.so_khung || '-'}</p></div>
                <div><p className="text-xs text-gray-500 font-bold mb-1">Số Máy</p><p className="font-semibold text-gray-800">{viewData.so_may || '-'}</p></div>
                <div><p className="text-xs text-gray-500 font-bold mb-1">Định vị GPS</p><p className="font-semibold text-gray-800">{viewData.gps || '-'}</p></div>
                
                <div><p className="text-xs text-gray-500 font-bold mb-1">Năm Sản Xuất</p><p className="font-semibold text-gray-800">{viewData.nam_sx || '-'}</p></div>
                <div><p className="text-xs text-gray-500 font-bold mb-1">Năm Đăng Ký</p><p className="font-semibold text-gray-800">{viewData.nam_dk || '-'}</p></div>
                <div><p className="text-xs text-gray-500 font-bold mb-1">Số Chỗ / Tải trọng</p><p className="font-semibold text-gray-800">{viewData.so_cho || '-'}</p></div>
                <div><p className="text-xs text-gray-500 font-bold mb-1">Nhiên Liệu</p><p className="font-semibold text-gray-800">{viewData.loai_nhien_lieu || '-'}</p></div>
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
                          points={viewHistoryCosts.map((cost, idx) => `${(idx + 0.5) * (100 / viewHistoryCosts.length)},${100 - ((Number(cost.km_hien_tai) || 0) / chartScale.maxKm * 100)}`).join(' ')} 
                          fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" strokeDasharray="4 4"
                        />
                      </svg>

                      {/* Cột Chi phí (Stacked Bar) */}
                      {viewHistoryCosts.map((cost, idx) => {
                        const nl = Number(cost.cp_nhien_lieu) || 0;
                        const cd = Number(cost.cp_cau_duong_ben_bai) || 0;
                        const rx = Number(cost.cp_rua_xe) || 0;
                        const bd = Number(cost.cp_bao_duong_sua_chua) || 0;
                        const kh = Number(cost.cp_thue_khau_hao) || 0;
                        const totalCP = nl + cd + rx + bd + kh;
                        const km = Number(cost.km_hien_tai) || 0;

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
                              <p className="font-bold text-gray-300 border-b border-gray-700 pb-1 mb-1.5 uppercase">Tháng {formatMonthYear(cost.thang_nam)}</p>
                              
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
                          <div key={costId} className="flex-1 text-center text-[9px] font-black text-gray-500">{formatMonthYear(cost.thang_nam)}</div>
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
                        <th className="p-3 w-28 bg-gray-50">Tháng</th>
                        <th className="p-3 bg-gray-50">Số Km</th>
                        <th className="p-3 text-right bg-gray-50">Nhiên liệu</th>
                        <th className="p-3 text-right bg-gray-50">Cầu đường</th>
                        <th className="p-3 text-right bg-gray-50">Bảo dưỡng</th>
                        <th className="p-3 text-right font-bold text-red-600 bg-gray-50">Tổng CP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewHistoryCosts.slice().reverse().map((cost, idx) => { 
                        const total = (Number(cost.cp_nhien_lieu) || 0) + (Number(cost.cp_cau_duong_ben_bai) || 0) + (Number(cost.cp_rua_xe) || 0) + (Number(cost.cp_bao_duong_sua_chua) || 0) + (Number(cost.cp_thue_khau_hao) || 0);
                        const costId = getCostId(cost) || `table-${idx}`;
                        return (
                          <tr key={costId} className="hover:bg-blue-50/30">
                            <td className="p-3 font-bold text-[#05469B] bg-white">{formatMonthYear(cost.thang_nam)}</td>
                            <td className="p-3 font-medium text-emerald-600 bg-white">{formatCurrency(cost.km_hien_tai)}</td>
                            <td className="p-3 text-right bg-white">{formatCurrency(cost.cp_nhien_lieu)}</td>
                            <td className="p-3 text-right bg-white">{formatCurrency(cost.cp_cau_duong_ben_bai)}</td>
                            <td className="p-3 text-right bg-white">{formatCurrency(cost.cp_bao_duong_sua_chua)}</td>
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
              <button onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CHI PHÍ HOẠT ĐỘNG --- */}
      {isCostModalOpen && selectedCarForCost && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setCostModal(prev => ({ ...prev, isOpen: false }))}></div>
          <div className="bg-white shadow-2xl w-full max-w-md md:max-w-xl h-full flex flex-col animate-in slide-in-from-right duration-300 relative z-10">
            
            {/* HEADER CHI TIẾT */}
            <div className="p-5 border-b border-indigo-100 bg-indigo-600 text-white flex justify-between items-start shrink-0">
              <div className="flex-1 pr-4">
                <h3 className="text-xl font-black flex items-center gap-2 mb-1.5"><Receipt size={20}/> Khai báo Chi phí</h3>
                <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                  <span className="text-white font-bold text-base tracking-wider">{selectedCarForCost.bien_so}</span>
                  <span className="mx-2 opacity-60">|</span>
                  {selectedCarForCost.hieu_xe} {selectedCarForCost.loai_xe} {selectedCarForCost.phien_ban ? `- ${selectedCarForCost.phien_ban}` : ''}
                  <span className="mx-2 opacity-60">|</span>
                  {selectedCarForCost.muc_dich_su_dung}
                  <span className="mx-2 opacity-60">|</span>
                  {getUnitFullName(selectedCarForCost.id_don_vi)}
                  <span className="mx-2 opacity-60">|</span>
                  <span className={`${selectedCarForCost.hien_trang === 'Đang hoạt động' ? 'text-emerald-300' : 'text-red-300'}`}>{selectedCarForCost.hien_trang}</span>
                </p>
              </div>
              <button onClick={() => setCostModal(prev => ({ ...prev, isOpen: false }))} className="text-indigo-200 hover:text-white bg-indigo-700/50 hover:bg-indigo-700 p-2 rounded-full transition-colors mt-1 shrink-0"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col min-h-0">
              <div className="p-5 bg-white border-b border-gray-200 shadow-sm z-10 shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider flex items-center gap-1.5"><Calendar size={16} className="text-indigo-600"/> {costModalMode === 'create' ? 'Khai báo tháng mới' : 'Cập nhật tháng'}</h4>
                  {costModalMode === 'update' && (
                    <button onClick={() => {setCostModal(prev => ({ ...prev, mode: 'create' })); setCostFormData({id: '', thang_nam: new Date().toISOString().slice(0, 7), id_ts_xe: selectedCarForCost.id, id_don_vi: selectedCarForCost.id_don_vi, km_hien_tai: '', so_lit_nhien_lieu: '', cp_nhien_lieu: '', cp_cau_duong_ben_bai: '', cp_rua_xe: '', cp_bao_duong_sua_chua: '', cp_thue_khau_hao: '', ghi_chu: ''})}} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><Plus size={14}/> Thêm mới</button>
                  )}
                </div>
                <form onSubmit={handleCostSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Tháng khai báo *</label><input type="month" required name="thang_nam" value={costFormData.thang_nam || ''} onChange={handleInputCostChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-[#FFFFF0] text-indigo-900 font-bold" /></div>
                    
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Km hiện tại (Đồng hồ)</label><input type="text" name="km_hien_tai" value={formatCurrency(costFormData.km_hien_tai)} onChange={handleInputCostChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-[#FFFFF0]" /></div>
                    
                    <div><label className="block text-xs font-bold text-gray-600 mb-1">Số Lít nhiên liệu tiêu thụ</label><input type="number" name="so_lit_nhien_lieu" value={costFormData.so_lit_nhien_lieu || ''} onChange={handleInputCostChange} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-[#FFFFF0]" /></div>
                    
                    {/* INLINE MATH: HỖ TRỢ TÍNH TOÁN NGAY TRONG Ô */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Chi phí Nhiên liệu (VNĐ) <span className="text-[9px] font-normal text-indigo-500">(Hỗ trợ +, -, *, /)</span></label>
                      <input 
                        type="text" 
                        name="cp_nhien_lieu" 
                        value={formatMathInput(costFormData.cp_nhien_lieu)} 
                        onChange={handleInputCostChange} 
                        onBlur={(e) => handleCostMathBlur('cp_nhien_lieu', e.target.value)}
                        onKeyDown={(e) => handleCostMathKeyDown(e, 'cp_nhien_lieu')}
                        className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-[#FFFFF0]" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Phí cầu đường bến bãi (VNĐ) <span className="text-[9px] font-normal text-indigo-500">(Hỗ trợ +, -, *, /)</span></label>
                      <input 
                        type="text" 
                        name="cp_cau_duong_ben_bai" 
                        value={formatMathInput(costFormData.cp_cau_duong_ben_bai)} 
                        onChange={handleInputCostChange} 
                        onBlur={(e) => handleCostMathBlur('cp_cau_duong_ben_bai', e.target.value)}
                        onKeyDown={(e) => handleCostMathKeyDown(e, 'cp_cau_duong_ben_bai')}
                        className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-[#FFFFF0]" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Phí rửa xe (VNĐ) <span className="text-[9px] font-normal text-indigo-500">(Hỗ trợ +, -, *, /)</span></label>
                      <input 
                        type="text" 
                        name="cp_rua_xe" 
                        value={formatMathInput(costFormData.cp_rua_xe)} 
                        onChange={handleInputCostChange} 
                        onBlur={(e) => handleCostMathBlur('cp_rua_xe', e.target.value)}
                        onKeyDown={(e) => handleCostMathKeyDown(e, 'cp_rua_xe')}
                        className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-[#FFFFF0]" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">CP Bảo dưỡng/Sửa chữa <span className="text-[9px] font-normal text-indigo-500">(Hỗ trợ +, -, *, /)</span></label>
                      <input 
                        type="text" 
                        name="cp_bao_duong_sua_chua" 
                        value={formatMathInput(costFormData.cp_bao_duong_sua_chua)} 
                        onChange={handleInputCostChange} 
                        onBlur={(e) => handleCostMathBlur('cp_bao_duong_sua_chua', e.target.value)}
                        onKeyDown={(e) => handleCostMathKeyDown(e, 'cp_bao_duong_sua_chua')}
                        className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-[#FFFFF0]" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">CP Thuê ngoài/Khấu hao <span className="text-[9px] font-normal text-indigo-500">(Hỗ trợ +, -, *, /)</span></label>
                      <input 
                        type="text" 
                        name="cp_thue_khau_hao" 
                        value={formatMathInput(costFormData.cp_thue_khau_hao)} 
                        onChange={handleInputCostChange} 
                        onBlur={(e) => handleCostMathBlur('cp_thue_khau_hao', e.target.value)}
                        onKeyDown={(e) => handleCostMathKeyDown(e, 'cp_thue_khau_hao')}
                        className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-[#FFFFF0]" 
                      />
                    </div>
                    
                    <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Ghi chú (Nơi sửa chữa, lý do...)</label><textarea name="ghi_chu" value={costFormData.ghi_chu || ''} onChange={handleInputCostChange} rows={2} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-[#FFFFF0] resize-none"></textarea></div>
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
                      const tongCP = (Number(cost.cp_nhien_lieu) || 0) + (Number(cost.cp_cau_duong_ben_bai) || 0) + (Number(cost.cp_rua_xe) || 0) + (Number(cost.cp_bao_duong_sua_chua) || 0) + (Number(cost.cp_thue_khau_hao) || 0);
                      const costId = getCostId(cost) || `log-${idx}`;
                      return (
                        <div key={costId} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-300 transition-colors group">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-sm">{formatMonthYear(cost.thang_nam)}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => editCost(cost)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={14}/></button>
                              <button onClick={() => {setItemToDelete({id: costId, type: 'chiphi'}); setIsConfirmOpen(true);}} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                            <div className="text-gray-500">Số Km: <span className="font-semibold text-gray-800">{formatCurrency(cost.km_hien_tai)}</span></div>
                            <div className="text-gray-500 text-right">Lít NL: <span className="font-semibold text-gray-800">{cost.so_lit_nhien_lieu} L</span></div>
                            <div className="text-gray-500">Nhiên liệu: <span className="font-semibold text-gray-800">{formatCurrency(cost.cp_nhien_lieu)}</span></div>
                            <div className="text-gray-500 text-right">Bảo dưỡng: <span className="font-semibold text-gray-800">{formatCurrency(cost.cp_bao_duong_sua_chua)}</span></div>
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
