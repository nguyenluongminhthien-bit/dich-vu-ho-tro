import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, X, AlertCircle, Loader2, Save, Eye,
  Flame, ShieldAlert, Building2, MapPin, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen,
  Calendar, FileText, Link as LinkIcon, Users, Droplets, Phone, BatteryWarning,
  PlusCircle, AlertTriangle, Sun, Moon, ShieldCheck, CheckCircle2, Siren, PhoneCall
} from 'lucide-react';
import { apiService } from '../services/api';
import { DonVi } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { buildHierarchicalOptions, getUnitEmoji } from '../utils/hierarchy';

const normalizeDateToISO = (val: any) => {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(str)) return `${str.split(/[\/\-]/)[2]}-${str.split(/[\/\-]/)[1].padStart(2, '0')}-${str.split(/[\/\-]/)[0].padStart(2, '0')}`;
  return str;
};

const formatToVN = (isoStr: string) => {
  if (!isoStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) return `${isoStr.split('-')[2]}/${isoStr.split('-')[1]}/${isoStr.split('-')[0]}`;
  return isoStr; 
};

const formatPhoneNumber = (val: any) => {
  if (!val) return '';
  const cleaned = val.toString().replace(/\D/g, ''); 
  if (cleaned.length <= 4) return cleaned;
  if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
};

const safeGet = (obj: any, key: string) => {
  if (!obj) return '';
  if (obj[key] !== undefined) return obj[key];
  const lowerKey = key.toLowerCase();
  for (const k in obj) { if (k.toLowerCase() === lowerKey) return obj[k]; }
  return '';
};
const getUnitIdSafe = (item: any) => safeGet(item, 'ID_DonVi');
const getPcccIdSafe = (item: any) => safeGet(item, 'ID_PCCC') || safeGet(item, 'id');
const getTsPcccIdSafe = (item: any) => safeGet(item, 'ID_TBPCCC') || safeGet(item, 'id');

// 🟢 [ĐÃ SỬA] ĐỊNH NGHĨA CHUẨN TÊN 4 HỆ THỐNG
const PCCC_SYSTEMS = [
  { key: 'HT_BaoChayTuDong', label: 'Báo cháy tự động', Icon: Siren, color: 'text-orange-500' },
  { key: 'HT_ChuaChayTuDongNuoc', label: 'Chữa cháy tự động', Icon: Droplets, color: 'text-blue-500' },
  { key: 'HT_ChuaChayNuoc', label: 'Chữa cháy vách tường', Icon: Droplets, color: 'text-cyan-500' },
  { key: 'DungCuPCCC', label: 'Dụng cụ CC & CNCH', Icon: Flame, color: 'text-red-500' },
];

const EMERGENCY_CONTACTS = [
  { key: 'SDT_PCCC', label: 'Báo cháy / CNCH', def: '114', color: 'text-red-600', bg: 'bg-red-50' },
  { key: 'SDTPCCC_CATT', label: 'CS PCCC Quản lý', def: '', color: 'text-gray-800', bg: 'bg-white' },
  { key: 'SDTUB', label: 'UBND Xã/Phường', def: '', color: 'text-gray-800', bg: 'bg-white' },
  { key: 'SDT_CAX', label: 'Công an Xã/Phường', def: '', color: 'text-gray-800', bg: 'bg-white' },
  { key: 'SDT_DienLuc', label: 'Đơn vị Điện lực', def: '', color: 'text-gray-800', bg: 'bg-white' },
  { key: 'SDT_CapThoatNuoc', label: 'Đơn vị Cấp nước', def: '', color: 'text-gray-800', bg: 'bg-white' },
  { key: 'STD_YTe', label: 'Cơ quan Y tế', def: '', color: 'text-gray-800', bg: 'bg-white' },
];

export default function FireSafetyPage() {
  const { user } = useAuth();
  const [donViList, setDonViList] = useState<DonVi[]>([]);
  const [pcccData, setPcccData] = useState<any[]>([]);
  const [tsPcccData, setTsPcccData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'update' | 'view'>('create');
  const [formData, setFormData] = useState<any>({});
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [deletedEqIds, setDeletedEqIds] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const [dvResult, pcResult, tsResult] = await Promise.all([
        apiService.getDonVi().catch(()=>[]),
        apiService.getPCCC ? apiService.getPCCC().catch(()=>[]) : Promise.resolve([]),
        apiService.getTsPCCC ? apiService.getTsPCCC().catch(()=>[]) : Promise.resolve([])
      ]);
      setDonViList(dvResult || []); 
      setPcccData((pcResult || []).map((item: any) => ({
        ...item,
        NgayHetHanBH: normalizeDateToISO(safeGet(item, 'NgayHetHanBH')),
        NgayDienTap: normalizeDateToISO(safeGet(item, 'NgayDienTap')),
      })));
      setTsPcccData((tsResult || []).map((item: any) => ({
        ...item,
        NgayBomsac: normalizeDateToISO(safeGet(item, 'NgayBomsac')),
        NgayHetHan: normalizeDateToISO(safeGet(item, 'NgayHetHan')),
      })));
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
    return donViList.filter(dv => [...level1, ...level2, ...level3].includes(dv.ID_DonVi)).map(dv => dv.ID_DonVi);
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
    Array.from(matchedIds).forEach(id => addChildren(id));
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
      result = result.filter(item => [selectedUnitFilter, ...childUnitIds].includes(item.ID_DonVi));
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(item => 
        String(safeGet(item, 'GiayPhepPCCC')).toLowerCase().includes(lower) || 
        String(safeGet(item, 'HoTenDoiTruong_PCCC')).toLowerCase().includes(lower) ||
        String(donViMap[item.ID_DonVi] || '').toLowerCase().includes(lower)
      );
    }
    return result;
  }, [pcccData, searchTerm, selectedUnitFilter, allowedDonViIds, donViList, donViMap]);

  const getStatusColor = (dateString: string, type: 'BH' | 'DT' | 'TB') => {
    if (!dateString) return { color: 'bg-gray-100 text-gray-500 border-gray-200', text: 'Chưa có', isDanger: false };
    const dateVN = formatToVN(dateString);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString); targetDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (type === 'BH') {
      if (diffDays < 0) return { color: 'bg-red-50 text-red-700 border-red-200 font-bold animate-pulse', text: `${dateVN} (Quá hạn)`, isDanger: true };
      if (diffDays <= 30) return { color: 'bg-orange-50 text-orange-700 border-orange-200 font-bold', text: `${dateVN} (Sắp hết)`, isDanger: true };
      return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold', text: `${dateVN} (Còn hạn)`, isDanger: false };
    } else if (type === 'DT') {
      const passedDays = -diffDays; 
      if (passedDays > 365) return { color: 'bg-red-50 text-red-700 border-red-200 font-bold animate-pulse', text: `${dateVN} (Quá 1 năm)`, isDanger: true };
      if (passedDays > 335) return { color: 'bg-orange-50 text-orange-700 border-orange-200 font-bold', text: `${dateVN} (Sắp tới hạn)`, isDanger: true };
      return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold', text: `${dateVN} (Đạt YC)`, isDanger: false };
    } else if (type === 'TB') {
      if (diffDays < 0) return { color: 'bg-red-50 text-red-700 border-red-200 font-bold', text: `${dateVN} (Quá hạn)`, isDanger: true };
      if (diffDays <= 15) return { color: 'bg-red-100 text-red-800 border-red-300 font-bold', text: `${dateVN} (Sắp hết)`, isDanger: true }; 
      return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium', text: `${dateVN}`, isDanger: false };
    }
    return { color: '', text: dateVN, isDanger: false };
  };

  // 🟢 [ĐÃ SỬA] HÀM LẤY DANH SÁCH DROPDOWN TỰ ĐỘNG CHUẨN 1:1
  const getAvailableEquipmentGroups = (form: any) => {
    let groups = new Set<string>();
    PCCC_SYSTEMS.forEach(sys => {
      // Nếu giá trị là "Có" hoặc nếu form mới tạo chưa có giá trị thì mặc định "Có" cho các ô này
      const val = form[sys.key] || (sys.key === 'HT_ChuaChayTuDongNuoc' ? 'Không' : 'Có');
      if (val === 'Có') {
        groups.add(sys.label);
      }
    });
    return Array.from(groups);
  };

  const openModal = (mode: 'create' | 'update' | 'view', item?: any) => {
    setModalMode(mode);
    if (item) { 
      setFormData({ ...item }); 
      setEquipmentList(tsPcccData.filter(eq => getUnitIdSafe(eq) === item.ID_DonVi).map(e => ({...e}))); 
    } else {
      setFormData({
        ID_PCCC: '', ID_DonVi: selectedUnitFilter || '', GiayPhepPCCC: 'Nghiệm thu', BaoHiemChayNo: 'Có', NgayHetHanBH: '', 
        HoTenDoiTruong_PCCC: '', SDT: '', ChucVu: '', TongSoThanhVien: '', SLHuyDongBanNgay: '', SLHuyDongBanDem: '', 
        NgayDienTap: '', LinkPhuongAn_PCCC: '', SDT_PCCC: '114', SDTUB: '', SDTPCCC_CATT: '', SDT_CAX: '', 
        SDT_DienLuc: '', SDT_CapThoatNuoc: '', STD_YTe: '', HT_BaoChayTuDong: 'Có', HT_ChuaChayTuDongNuoc: 'Không', 
        HT_ChuaChayNuoc: 'Có', DungCuPCCC: 'Có', KhuVucRuiRoCao: '', LoiTonTaiChuaKhacPhuc: ''
      });
      setEquipmentList([]);
    }
    setDeletedEqIds([]);
    setIsModalOpen(true); setError(null);
  };

  const addEquipmentRow = () => {
    const defaultGroup = getAvailableEquipmentGroups(formData)[0] || '';
    setEquipmentList([...equipmentList, { ID_TBPCCC: '', ID_DonVi: '', NhomHeThong: defaultGroup, LoaiThietBi: '', SoLuong: '', DonViTinh: 'Cái', ViTriBoTri: '', NgayBomsac: '', NgayHetHan: '', TinhTrang: 'Hoạt động tốt' }]);
  };

  const handleEquipmentChange = (index: number, field: string, value: string) => { const newList = [...equipmentList]; newList[index][field] = value; setEquipmentList(newList); };
  const removeEquipmentRow = (index: number) => { const eq = equipmentList[index]; if (eq.ID_TBPCCC) setDeletedEqIds([...deletedEqIds, eq.ID_TBPCCC]); setEquipmentList(equipmentList.filter((_, i) => i !== index)); };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('SDT') || name.includes('STD')) setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ID_DonVi) return alert("Vui lòng chọn Đơn vị!");
    setSubmitting(true); setError(null);
    try {
      const responsePccc = await apiService.save(formData, modalMode, "HS_PCCC");
      for (const delId of deletedEqIds) await apiService.delete(delId, "TS_PCCC");
      if (equipmentList.length > 0) {
        const eqToSave = equipmentList.map(eq => ({ ...eq, ID_DonVi: formData.ID_DonVi }));
        await apiService.save(eqToSave, 'update', 'TS_PCCC'); 
      }
      setIsModalOpen(false); loadData(); 
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu PCCC.'); } 
    finally { setSubmitting(false); }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return; setSubmitting(true); setError(null);
    try {
      const pcccToDelete = pcccData.find(item => getPcccIdSafe(item) === itemToDelete);
      const relatedDonViId = pcccToDelete ? getUnitIdSafe(pcccToDelete) : null;
      await apiService.delete(itemToDelete, "HS_PCCC");
      setPcccData(prev => prev.filter(item => getPcccIdSafe(item) !== itemToDelete));
      if (relatedDonViId) {
        const eqToDelete = tsPcccData.filter(eq => getUnitIdSafe(eq) === relatedDonViId);
        for (const eq of eqToDelete) {
          const eqId = getTsPcccIdSafe(eq);
          if (eqId) await apiService.delete(eqId, "TS_PCCC");
        }
        setTsPcccData(prev => prev.filter(eq => getUnitIdSafe(eq) !== relatedDonViId));
      }
      setIsConfirmOpen(false); setItemToDelete(null); 
    } catch (err: any) { setError(err.message || 'Lỗi xóa dữ liệu.'); } 
    finally { setSubmitting(false); }
  };

  const renderUnitTree = (parent: DonVi, level: number = 1, idx: number = 0) => {
    const children = getChildUnits(parent.ID_DonVi);
    const isExpanded = expandedParents.includes(parent.ID_DonVi) || !!unitSearchTerm;
    return (
      <div key={`${parent.ID_DonVi}-${level}-${idx}`} className={level === 1 ? "mb-1" : "mt-1"}>
        <button onClick={() => { setSelectedUnitFilter(parent.ID_DonVi); if (children.length > 0) toggleParent(parent.ID_DonVi); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedUnitFilter === parent.ID_DonVi ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'}`}>
          {children.length > 0 ? (isExpanded ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />) : <div className="w-4 shrink-0" />}
          <span className="shrink-0">{getUnitEmoji(parent.loaiHinh)}</span>
          <span className="truncate text-left">{parent.TenDonVi}</span>
        </button>
        {isExpanded && children.length > 0 && (<div className={`ml-${level === 1 ? '6' : '4'} mt-1 border-l-2 border-gray-100 pl-2 space-y-1`}>{children.map((child, cIdx) => renderUnitTree(child, level + 1, cIdx))}</div>)}
      </div>
    );
  };
  return (
    <div className="flex h-full bg-[#f4f7f9] overflow-hidden relative">
      {isListCollapsed && (
        <button onClick={() => setIsListCollapsed(false)} className="absolute top-6 left-6 z-20 bg-white p-2.5 rounded-lg shadow-md border border-gray-200 text-red-600 hover:bg-red-50 transition-all"><PanelLeftOpen size={20} /></button>
      )}

      {/* CỘT TRÁI BỘ LỌC */}
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
          <button onClick={() => setSelectedUnitFilter(null)} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold mb-4 transition-colors ${selectedUnitFilter === null ? 'bg-red-50 text-red-600 border border-red-100' : 'text-gray-700 hover:bg-gray-50'}`}><Flame size={18} className={selectedUnitFilter === null ? 'text-red-600' : 'text-gray-400'} /> Tất cả Cụm / Chi nhánh</button>
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
            <h2 className="text-2xl font-bold text-red-600 flex items-center gap-2"><Flame size={28} /> Quản lý Hồ sơ PCCC</h2>
            <p className="text-sm font-medium text-gray-500 mt-1">Đang xem: <span className="text-emerald-600 font-bold">{donViMap[selectedUnitFilter || ''] || 'Tất cả Đơn vị'}</span></p>
          </div>
          <div className="flex w-full sm:w-auto gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Tìm giấy phép, đội trưởng..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none shadow-sm text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => openModal('create')} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-all whitespace-nowrap"><Plus className="w-5 h-5" /> Thêm Hồ sơ PCCC</button>
          </div>
        </div>
        {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start gap-3 rounded-r-lg shadow-sm"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><p>{error}</p></div>}

        {/* BẢNG DỮ LIỆU HIỂN THỊ TRONG MÀN HÌNH CHÍNH */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${isListCollapsed ? 'ml-10 lg:ml-0' : ''}`}>
          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1300px]">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <th className="p-4 w-[25%]">Cơ sở / Đơn vị & Pháp lý</th>
                  <th className="p-4 w-[20%]">Đội PCCC & Diễn tập</th>
                  <th className="p-4 w-[20%]">Thiết bị & Cảnh báo</th>
                  <th className="p-4 w-[25%]">Tổng quan Hệ thống</th>
                  <th className="p-4 text-center w-[10%]">Thao tác</th> 
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={5} className="p-12 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-red-600" />Đang tải dữ liệu...</td></tr>
                ) : filteredPCCC.length === 0 ? (
                  <tr><td colSpan={5} className="p-16 text-center text-gray-500"><ShieldAlert size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-lg font-medium">Chưa có hồ sơ PCCC nào được khai báo.</p></td></tr>
                ) : (
                  filteredPCCC.map((item, index) => {
                    const bhStatus = getStatusColor(safeGet(item, 'NgayHetHanBH'), 'BH');
                    const dtStatus = getStatusColor(safeGet(item, 'NgayDienTap'), 'DT');
                    const eqOfUnit = tsPcccData.filter(eq => getUnitIdSafe(eq) === item.ID_DonVi);
                    
                    let totalEq = 0;
                    let warningCount = 0;
                    
                    eqOfUnit.forEach(eq => {
                      const sl = Number(safeGet(eq, 'SoLuong')) || 1;
                      totalEq += sl;
                      if (getStatusColor(safeGet(eq, 'NgayHetHan'), 'TB').isDanger) { warningCount += sl; }
                    });

                    return (
                      <tr key={`${getPcccIdSafe(item)}-${index}`} className="hover:bg-red-50/30 transition-colors group">
                        
                        <td className="p-4 align-top">
                          <p className="font-bold text-gray-800 text-sm mb-1 line-clamp-2">{donViMap[item.ID_DonVi] || item.ID_DonVi}</p>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{getPcccIdSafe(item)}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${safeGet(item, 'GiayPhepPCCC') === 'Nghiệm thu' ? 'bg-emerald-100 text-emerald-700' : safeGet(item, 'GiayPhepPCCC') === 'Đã phê duyệt' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{safeGet(item, 'GiayPhepPCCC') || '---'}</span>
                          </div>
                          <div className="space-y-1.5 text-[11px]">
                            {safeGet(item, 'BaoHiemChayNo') === 'Có' ? (
                              <div className="flex items-center justify-between"><span className="text-gray-500">Hạn BH:</span><span className={`px-1.5 py-0.5 rounded border ${bhStatus.color}`}>{bhStatus.text}</span></div>
                            ) : (
                              <div className="flex items-center justify-between"><span className="text-gray-500">Hạn BH:</span><span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 border border-red-200 rounded">Không có BH</span></div>
                            )}
                            {safeGet(item, 'LinkPhuongAn_PCCC') && (
                              <a href={safeGet(item, 'LinkPhuongAn_PCCC')} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#05469B] hover:text-blue-700 hover:underline font-bold mt-1"><LinkIcon size={10}/> File Phương án CC</a>
                            )}
                            <div className="mt-3 border-t border-gray-100 pt-2">
                              <button onClick={() => openModal('view', item)} className="flex items-center gap-1.5 text-orange-600 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded border border-orange-200 font-bold transition-colors w-full justify-center">
                                <PhoneCall size={12} /> Xem Danh bạ & Ghi chú
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 align-top">
                          <div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 mb-2">
                            {safeGet(item, 'HoTenDoiTruong_PCCC') ? (
                              <div className="flex flex-col mb-1.5 pb-1.5 border-b border-gray-200">
                                <span className="font-bold text-[#05469B] flex items-center gap-1.5"><ShieldCheck size={14}/> {safeGet(item, 'HoTenDoiTruong_PCCC')}</span>
                                <span className="text-[10px] text-gray-500 font-normal pl-5">{safeGet(item, 'ChucVu')}</span>
                              </div>
                            ) : (<div className="text-xs text-gray-400 italic mb-2">Chưa báo cáo Đội trưởng</div>)}
                            <div className="flex justify-between items-center text-[10px] font-medium text-gray-600 bg-white border border-gray-100 rounded p-1.5">
                              <span className="flex items-center gap-1">Tổng: <b className="text-gray-800">{safeGet(item, 'TongSoThanhVien') || 0}</b></span><span className="w-px h-3 bg-gray-200"></span>
                              <span className="flex items-center gap-1"><Sun size={10} className="text-orange-500"/> <b className="text-gray-800">{safeGet(item, 'SLHuyDongBanNgay') || 0}</b></span><span className="w-px h-3 bg-gray-200"></span>
                              <span className="flex items-center gap-1"><Moon size={10} className="text-indigo-500"/> <b className="text-gray-800">{safeGet(item, 'SLHuyDongBanDem') || 0}</b></span>
                            </div>
                          </div>
                          <div className="text-[11px] mt-2">
                            <div className="flex flex-col gap-1">
                              <span className="text-gray-500 font-medium flex items-center gap-1"><Calendar size={12}/> Diễn tập gần nhất:</span>
                              <span className={`px-1.5 py-0.5 rounded border text-center ${dtStatus.color}`}>{dtStatus.text}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 align-top">
                          <div className="flex flex-col gap-2 w-full">
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 flex justify-between items-center"><span className="text-[10px] font-bold text-blue-600 uppercase">Tổng Thiết bị / Bình</span><span className="text-base font-black text-[#05469B]">{totalEq}</span></div>
                            {warningCount > 0 ? (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-center gap-2 animate-pulse"><AlertTriangle size={16} className="text-red-500 shrink-0"/><div className="text-left flex-1"><span className="block text-[10px] font-bold text-red-700 uppercase">Cảnh báo Hạn sạc</span><span className="text-[11px] font-semibold text-red-600">Có {warningCount} thiết bị cần xử lý!</span></div></div>
                            ) : (<div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center justify-center text-emerald-600 gap-1.5 h-[58px]"><CheckCircle2 size={16}/><span className="text-[11px] font-bold uppercase">Hoạt động tốt</span></div>)}
                          </div>
                        </td>

                        <td className="p-4 align-top">
                          <div className="space-y-2.5 text-[11px]">
                            {PCCC_SYSTEMS.map(sys => {
                              let sysCount = 0;
                              eqOfUnit.forEach(eq => {
                                if (safeGet(eq, 'NhomHeThong') === sys.label) sysCount += (Number(safeGet(eq, 'SoLuong')) || 1);
                              });
                              const isChecked = safeGet(item, sys.key) === 'Có' || (sys.key === 'DungCuPCCC' && !safeGet(item, 'DungCuPCCC'));
                              return (
                                <div key={sys.key} className="flex items-center justify-between">
                                  <span className="text-gray-600 font-medium flex items-center gap-1.5"><sys.Icon size={12} className={sys.color}/> {sys.label}</span>
                                  {isChecked ? <span className="font-bold text-emerald-600">Có {sysCount > 0 ? `(${sysCount})` : ''}</span> : <span className="text-gray-400">Không</span>}
                                </div>
                              )
                            })}
                          </div>
                        </td>

                        <td className="p-4 text-center align-middle">
                          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                            <button onClick={() => openModal('view', item)} className="p-2 w-8 h-8 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors flex justify-center items-center" title="Xem chi tiết"><Eye size={14} /></button>
                            <button onClick={() => openModal('update', item)} className="p-2 w-8 h-8 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors flex justify-center items-center" title="Sửa"><Edit size={14} /></button>
                            <button onClick={() => { setItemToDelete(getPcccIdSafe(item)); setIsConfirmOpen(true); }} className="p-2 w-8 h-8 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors flex justify-center items-center" title="Xóa"><Trash2 size={14} /></button>
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

      {/* 🟢 MODAL NHẬP THÔNG TIN PCCC ALL-IN-ONE */}
      {isModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 ${!isListCollapsed ? 'lg:pl-80' : ''}`}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between p-5 border-b border-gray-100 bg-red-50 rounded-t-2xl shrink-0">
              <h3 className="text-xl font-bold text-red-700 flex items-center gap-2"><Flame size={24}/> {modalMode === 'create' ? 'Tạo Hồ sơ PCCC Mới' : modalMode === 'view' ? 'Chi tiết Hồ sơ PCCC' : 'Cập nhật Hồ sơ PCCC'}</h3>
              <button onClick={() => setIsModalOpen(false)} disabled={submitting} className="text-gray-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">
                <fieldset disabled={modalMode === 'view'} className="space-y-6 border-0 m-0 p-0">
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-blue-50/40 p-5 rounded-xl border border-blue-100 shadow-sm h-full flex flex-col">
                      <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 border-b border-blue-200 pb-2"><FileText size={18}/> 1. Pháp lý & Bảo hiểm</h4>
                      <div className="space-y-4 flex-1">
                        <div><label className="block text-xs font-bold text-gray-700 mb-1">Đơn vị / Cơ sở *</label><select required name="ID_DonVi" value={formData.ID_DonVi || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500 font-bold text-[#05469B]"><option value="">-- Chọn đơn vị --</option>{buildHierarchicalOptions(donViList.filter(dv => allowedDonViIds.includes(dv.ID_DonVi))).map(({ unit, prefix }, idx) => (<option key={`${unit.ID_DonVi}-${idx}`} value={unit.ID_DonVi}>{prefix}{getUnitEmoji(unit.loaiHinh)} {unit.TenDonVi}</option>))}</select></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Giấy phép PCCC</label><select name="GiayPhepPCCC" value={formData.GiayPhepPCCC || 'Nghiệm thu'} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500 font-bold text-emerald-700"><option value="Nghiệm thu">Nghiệm thu</option><option value="Đã phê duyệt">Đã phê duyệt</option><option value="Chưa có">Chưa có</option></select></div>
                          <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Bảo hiểm Cháy nổ</label><select name="BaoHiemChayNo" value={formData.BaoHiemChayNo || 'Có'} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500"><option value="Có">Có</option><option value="Không">Không</option></select></div>
                        </div>
                        {formData.BaoHiemChayNo === 'Có' && (<div><label className="block text-[10px] font-bold text-red-600 mb-1 uppercase">Ngày hết hạn Bảo Hiểm *</label><input type="date" name="NgayHetHanBH" value={formData.NgayHetHanBH ? formData.NgayHetHanBH.split('T')[0] : ''} onChange={handleInputChange} className="w-full p-2 border border-red-300 rounded-lg bg-red-50 outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-700 text-sm" /></div>)}
                        <div><label className="block text-[10px] font-bold text-purple-700 mb-1 uppercase">Link Phương án CC (Drive/PDF)</label><div className="relative"><LinkIcon className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} /><input type="url" name="LinkPhuongAn_PCCC" value={formData.LinkPhuongAn_PCCC || ''} onChange={handleInputChange} className="w-full pl-7 pr-2 py-2 border border-purple-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-purple-500 text-blue-600 text-sm" placeholder="Dán link..." /></div></div>
                      </div>
                    </div>
                    <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-100 shadow-sm h-full flex flex-col">
                      <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2 border-b border-emerald-200 pb-2"><Users size={18}/> 2. Đội PCCC Cơ sở & Diễn tập</h4>
                      <div className="space-y-4 flex-1">
                        <div className="grid grid-cols-1 gap-4"><div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Đội trưởng PCCC</label><input type="text" name="HoTenDoiTruong_PCCC" value={formData.HoTenDoiTruong_PCCC || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-[#05469B]" placeholder="Họ và tên..." /></div></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Chức vụ</label><input type="text" name="ChucVu" value={formData.ChucVu || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="VD: Trưởng phòng..." /></div>
                          <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">SĐT Đội trưởng</label><input type="text" name="SDT" value={formData.SDT || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="xxxx xxx xxx" /></div>
                        </div>
                        <div className="grid grid-cols-4 gap-3 border-t border-emerald-100 pt-4">
                          <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Users size={12} className="text-emerald-600"/> Tổng Thành viên</label><input type="number" name="TongSoThanhVien" value={formData.TongSoThanhVien || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-800" placeholder="Số lượng..." /></div>
                          <div className="col-span-1"><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Sun size={12} className="text-orange-500"/> Ngày</label><input type="number" name="SLHuyDongBanNgay" value={formData.SLHuyDongBanNgay || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="SL..." /></div>
                          <div className="col-span-1"><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Moon size={12} className="text-indigo-500"/> Đêm</label><input type="number" name="SLHuyDongBanDem" value={formData.SLHuyDongBanDem || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="SL..." /></div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 border-t border-emerald-100 pt-4"><div><label className="block text-[10px] font-bold text-emerald-700 mb-1 uppercase">Ngày Diễn tập gần nhất</label><input type="date" name="NgayDienTap" value={formData.NgayDienTap ? formData.NgayDienTap.split('T')[0] : ''} onChange={handleInputChange} className="w-full p-2 border border-emerald-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-800 font-bold text-sm" /></div></div>
                      </div>
                    </div>
                  </div>

                  {/* 🟢 DÒNG 2: TỔNG QUAN HỆ THỐNG VÀ BẢNG THIẾT BỊ */}
                  <div className="bg-orange-50/40 p-5 rounded-xl border border-orange-200 shadow-sm mt-6">
                    <div className="flex justify-between items-center mb-4 border-b border-orange-200 pb-2">
                      <h4 className="font-bold text-orange-800 flex items-center gap-2"><Droplets size={18}/> 3. Hệ thống Cố định & Thiết bị PCCC</h4>
                      {modalMode !== 'view' && (<button type="button" onClick={addEquipmentRow} className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 transition-colors shadow-sm"><PlusCircle size={16} /> Thêm Thiết bị</button>)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-orange-200">
                      {PCCC_SYSTEMS.map(sys => (
                        <div key={sys.key} className="bg-white p-3 rounded-lg border border-orange-100 flex flex-col justify-between gap-2 h-full">
                          <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5"><sys.Icon size={14} className={sys.color}/> {sys.label}</span>
                          <select name={sys.key} value={formData[sys.key] || (sys.key === 'HT_ChuaChayTuDongNuoc' ? 'Không' : 'Có')} onChange={handleInputChange} className="w-full p-2 text-xs font-bold border border-gray-200 rounded outline-none focus:ring-2 focus:ring-orange-500 text-[#05469B] bg-blue-50 mt-auto"><option value="Có">Có</option><option value="Không">Không</option></select>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-xs italic text-gray-500 mb-3 px-1">Kê khai chi tiết các thiết bị thuộc các hệ thống trên (Tủ điều khiển, Bình chữa cháy, Đầu báo khói...)</p>
                    
                   <div className="w-full border border-gray-200 rounded-xl overflow-hidden overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">
                            <th className="p-2 w-[18%]">Nhóm Hệ Thống</th>
                            <th className="p-2 w-[20%]">Tên/Loại Thiết Bị</th>
                            <th className="p-2 w-[7%] text-center">Số lượng</th>
                            <th className="p-2 w-[7%]">ĐVT</th>
                            <th className="p-2 w-[14%]">Vị trí bố trí</th>
                            <th className="p-2 w-[10%]">Ngày bơm sạc/KT</th>
                            <th className="p-2 w-[10%] text-red-600">Hạn sạc tiếp theo</th>
                            <th className="p-2 w-[10%]">Tình trạng</th>
                            {modalMode !== 'view' && <th className="p-2 w-[4%] text-center">#</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {equipmentList.length === 0 ? (
                            <tr><td colSpan={9} className="p-8 text-center text-gray-400 italic bg-white">Chưa có thiết bị nào. Vui lòng bấm "Thêm Thiết bị"</td></tr>
                          ) : (
                            equipmentList.map((eq, idx) => {
                              const standardOptions = getAvailableEquipmentGroups(formData);
                              // Hiển thị dạng Input tự do nếu Nhóm hệ thống là 'Khác' HOẶC là 1 giá trị mà không nằm trong danh sách chuẩn
                              const isCustomUI = eq.NhomHeThong === 'Khác' || (eq.NhomHeThong !== '' && !standardOptions.includes(eq.NhomHeThong));

                              return (
                                <tr key={idx} className="hover:bg-orange-50/50 transition-colors bg-white">
                                  <td className="p-1.5">
                                    {isCustomUI ? (
                                      <div className="flex items-center relative w-full">
                                        <input 
                                          type="text" 
                                          value={eq.NhomHeThong === 'Khác' ? '' : eq.NhomHeThong} 
                                          onChange={e => handleEquipmentChange(idx, 'NhomHeThong', e.target.value || 'Khác')} 
                                          className="w-full p-1.5 text-xs border border-blue-300 rounded outline-none focus:border-blue-500 bg-blue-50 pr-6" 
                                          placeholder="Tự nhập tên..." 
                                          autoFocus 
                                        />
                                        <button type="button" onClick={() => handleEquipmentChange(idx, 'NhomHeThong', standardOptions.length > 0 ? standardOptions[0] : '')} className="absolute right-1 text-gray-400 hover:text-red-500" title="Hủy tự nhập"><X size={14}/></button>
                                      </div>
                                    ) : (
                                      <select value={eq.NhomHeThong || ''} onChange={e => handleEquipmentChange(idx, 'NhomHeThong', e.target.value)} className="w-full p-1.5 text-xs border border-gray-200 rounded outline-none focus:border-orange-500 bg-white">
                                        {!eq.NhomHeThong && <option value="">-- Chọn --</option>}
                                        {standardOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        <option value="Khác">Khác (Tự nhập...)</option>
                                      </select>
                                    )}
                                  </td>
                                  <td className="p-1.5"><input type="text" value={eq.LoaiThietBi || ''} onChange={e => handleEquipmentChange(idx, 'LoaiThietBi', e.target.value)} placeholder="VD: Bình bột ABC 4kg..." className="w-full p-1.5 text-xs border border-gray-200 rounded outline-none focus:border-orange-500 bg-white font-medium" /></td>
                                  <td className="p-1.5"><input type="number" value={eq.SoLuong || ''} onChange={e => handleEquipmentChange(idx, 'SoLuong', e.target.value)} className="w-full p-1.5 text-xs border border-gray-200 rounded outline-none focus:border-orange-500 bg-white text-center font-bold" /></td>
                                  <td className="p-1.5"><input type="text" value={eq.DonViTinh || ''} onChange={e => handleEquipmentChange(idx, 'DonViTinh', e.target.value)} placeholder="Bình/Cái..." className="w-full p-1.5 text-xs border border-gray-200 rounded outline-none focus:border-orange-500 bg-white" /></td>
                                  <td className="p-1.5"><input type="text" value={eq.ViTriBoTri || ''} onChange={e => handleEquipmentChange(idx, 'ViTriBoTri', e.target.value)} placeholder="Khu trưng bày..." className="w-full p-1.5 text-xs border border-gray-200 rounded outline-none focus:border-orange-500 bg-white" /></td>
                                  <td className="p-1.5"><input type="date" value={eq.NgayBomsac ? eq.NgayBomsac.split('T')[0] : ''} onChange={e => handleEquipmentChange(idx, 'NgayBomsac', e.target.value)} className="w-full p-1.5 text-xs border border-gray-200 rounded outline-none focus:border-orange-500 bg-white text-gray-600" /></td>
                                  <td className="p-1.5"><input type="date" value={eq.NgayHetHan ? eq.NgayHetHan.split('T')[0] : ''} onChange={e => handleEquipmentChange(idx, 'NgayHetHan', e.target.value)} className="w-full p-1.5 text-xs border border-red-300 rounded outline-none focus:border-red-500 bg-red-50 font-bold text-red-700" title="Dùng để chạy hệ thống cảnh báo" /></td>
                                  <td className="p-1.5"><select value={eq.TinhTrang || 'Hoạt động tốt'} onChange={e => handleEquipmentChange(idx, 'TinhTrang', e.target.value)} className={`w-full p-1.5 text-xs font-bold border rounded outline-none focus:border-orange-500 ${eq.TinhTrang === 'Hư hỏng' ? 'bg-red-50 text-red-600 border-red-200' : eq.TinhTrang === 'Cần bơm sạc' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}><option value="Hoạt động tốt">Hoạt động tốt</option><option value="Cần bơm sạc">Cần bơm sạc</option><option value="Hư hỏng">Hư hỏng</option></select></td>
                                  {modalMode !== 'view' && (<td className="p-1.5 text-center"><button type="button" onClick={() => removeEquipmentRow(idx)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14}/></button></td>)}
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-purple-50/40 p-5 rounded-xl border border-purple-100 shadow-sm mt-6">
                    <h4 className="font-bold text-purple-800 mb-4 flex items-center gap-2 border-b border-purple-200 pb-2"><PhoneCall size={18}/> 4. Danh bạ Khẩn cấp & Ghi chú Tồn tại (Mẫu PC01)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-5 pb-5 border-b border-purple-100/50">
                      {EMERGENCY_CONTACTS.map(contact => (
                        <div key={contact.key}>
                          <label className={`block text-[10px] font-bold uppercase mb-1 ${contact.color}`}>📞 {contact.label}</label>
                          <input type="text" name={contact.key} value={formData[contact.key] || contact.def} onChange={handleInputChange} className={`w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm ${contact.bg} ${contact.key==='SDT_PCCC'?'border-red-300 font-bold':''}`} placeholder="xxxx xxx xxx" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div><label className="block text-[10px] font-bold text-orange-600 mb-1 uppercase">Khu vực rủi ro cháy nổ cao</label><textarea name="KhuVucRuiRoCao" value={formData.KhuVucRuiRoCao || ''} onChange={handleInputChange} rows={2} className="w-full p-2 border border-orange-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none" placeholder="VD: Kho sơn tĩnh điện, Kho xăng dầu..."></textarea></div>
                      <div><label className="block text-[10px] font-bold text-red-600 mb-1 uppercase">Lỗi / Tồn tại chưa khắc phục (CA Yêu cầu)</label><textarea name="LoiTonTaiChuaKhacPhuc" value={formData.LoiTonTaiChuaKhacPhuc || ''} onChange={handleInputChange} rows={2} className="w-full p-2 border border-red-300 rounded-lg bg-red-50 text-red-800 font-medium outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none" placeholder="Ghi nhận các lỗi hệ thống..."></textarea></div>
                    </div>
                  </div>

                </fieldset>
              </div>

              {/* NÚT LƯU */}
              <div className="p-5 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50 rounded-b-2xl">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-xl font-bold transition-colors">Đóng</button>
                {modalMode !== 'view' && (
                  <button type="submit" disabled={submitting} className="px-8 py-3 text-white bg-red-600 hover:bg-red-700 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-colors">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Lưu Hồ Sơ PCCC
                  </button>
                )}
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
