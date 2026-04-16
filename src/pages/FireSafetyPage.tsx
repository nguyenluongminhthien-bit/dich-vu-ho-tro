import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, X, AlertCircle, Loader2, Save, Eye,
  Flame, ShieldAlert, Building2, MapPin, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen,
  Calendar, FileText, Link as LinkIcon, Users, Droplets, Phone,
  PlusCircle, AlertTriangle, Sun, Moon, ShieldCheck, CheckCircle2, Siren, PhoneCall,
  HardHat, UserCheck, Briefcase
} from 'lucide-react';
import { apiService } from '../services/api';
import { DonVi } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { buildHierarchicalOptions, getUnitEmoji, sortDonViByThuTu, groupParentUnits } from '../utils/hierarchy'; 

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
const getUnitIdSafe = (item: any) => safeGet(item, 'id_don_vi');
const getPcccIdSafe = (item: any) => safeGet(item, 'id') || safeGet(item, 'id_pccc');
const getTsPcccIdSafe = (item: any) => safeGet(item, 'id') || safeGet(item, 'id_tbpccc');

// 🟢 ĐỊNH NGHĨA CHUẨN TÊN 4 HỆ THỐNG THEO SUPABASE
const PCCC_SYSTEMS = [
  { key: 'he_thong_bao_chay_tu_dong', label: 'Báo cháy tự động', Icon: Siren, color: 'text-orange-500' },
  { key: 'he_thong_chua_chay_tu_dong_nuoc', label: 'Chữa cháy tự động', Icon: Droplets, color: 'text-blue-500' },
  { key: 'he_thong_chua_chay_nuoc', label: 'Chữa cháy vách tường', Icon: Droplets, color: 'text-cyan-500' },
  { key: 'dung_cu_pccc', label: 'Dụng cụ CC & CNCH', Icon: Flame, color: 'text-red-500' },
];

const EMERGENCY_CONTACTS = [
  { key: 'sdt_pccc', label: 'Báo cháy / CNCH', def: '114', color: 'text-red-600', bg: 'bg-red-50' },
  { key: 'sdt_ca_pccc_catt', label: 'CS PCCC Quản lý', def: '', color: 'text-gray-800', bg: 'bg-white' },
  { key: 'sdt_ub', label: 'UBND Xã/Phường', def: '', color: 'text-gray-800', bg: 'bg-white' },
  { key: 'sdt_cax', label: 'Công an Xã/Phường', def: '', color: 'text-gray-800', bg: 'bg-white' },
  { key: 'sdt_dien_luc', label: 'Đơn vị Điện lực', def: '', color: 'text-gray-800', bg: 'bg-white' },
  { key: 'sdt_cap_thoat_nuoc', label: 'Đơn vị Cấp nước', def: '', color: 'text-gray-800', bg: 'bg-white' },
  { key: 'sdt_yte', label: 'Cơ quan Y tế', def: '', color: 'text-gray-800', bg: 'bg-white' },
];

export default function FireSafetyPage() {
  const { user } = useAuth();
  const [donViList, setDonViList] = useState<DonVi[]>([]);
  const [pcccData, setPcccData] = useState<any[]>([]);
  const [tsPcccData, setTsPcccData] = useState<any[]>([]);
  const [personnelData, setPersonnelData] = useState<any[]>([]); // 🟢 STATE NHÂN SỰ
  
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

  // 🟢 STATE CHO MODAL DANH BẠ
  const [isEmergencyContactOpen, setIsEmergencyContactOpen] = useState(false);
  const [selectedPcccForContact, setSelectedPcccForContact] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const [dvResult, pcResult, tsResult, nsResult] = await Promise.all([
        apiService.getDonVi().catch(()=>[]),
        apiService.getPCCC ? apiService.getPCCC().catch(()=>[]) : Promise.resolve([]),
        apiService.getTsPCCC ? apiService.getTsPCCC().catch(()=>[]) : Promise.resolve([]),
        apiService.getPersonnel ? apiService.getPersonnel().catch(()=>[]) : Promise.resolve([])
      ]);
      setDonViList(dvResult || []); 
      setPersonnelData(nsResult || []); // Lưu dữ liệu nhân sự
      
      setPcccData((pcResult || []).map((item: any) => ({
        ...item,
        ngay_het_han_bh: normalizeDateToISO(safeGet(item, 'ngay_het_han_bh')),
        ngay_dien_tap: normalizeDateToISO(safeGet(item, 'ngay_dien_tap')),
      })));
      setTsPcccData((tsResult || []).map((item: any) => ({
        ...item,
        ngay_bom_sac: normalizeDateToISO(safeGet(item, 'ngay_bom_sac')),
        ngay_het_han: normalizeDateToISO(safeGet(item, 'ngay_het_han')),
      })));
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
    return donViList.filter(dv => [...level1, ...level2, ...level3].includes(dv.id)).map(dv => dv.id);
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
    Array.from(matchedIds).forEach(id => addChildren(id));
    return baseUnits.filter(item => matchedIds.has(item.id));
  }, [donViList, unitSearchTerm, allowedDonViIds]);

  const parentUnits = useMemo(() => filteredUnits.filter(item => item.cap_quan_ly === 'HO' || !item.cap_quan_ly), [filteredUnits]);
  const getChildUnits = (parentId: string) => sortDonViByThuTu(filteredUnits.filter(item => item.cap_quan_ly === parentId));

  const { vpdhUnits, ctttNamUnits, ctttBacUnits, otherUnits } = useMemo(() => {
    return groupParentUnits(parentUnits);
  }, [parentUnits]);

  const toggleParent = (parentId: string) => setExpandedParents(prev => prev.includes(parentId) ? prev.filter(id => id !== parentId) : [...prev, parentId]);

  const filteredPCCC = useMemo(() => {
    let result = pcccData.filter(item => allowedDonViIds.includes(item.id_don_vi));
    if (selectedUnitFilter) {
      const childUnitIds = donViList.filter(item => item.cap_quan_ly === selectedUnitFilter).map(c => c.id);
      result = result.filter(item => [selectedUnitFilter, ...childUnitIds].includes(item.id_don_vi));
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(item => 
        String(safeGet(item, 'giay_phep_pccc')).toLowerCase().includes(lower) || 
        String(safeGet(item, 'ho_ten_doi_truong')).toLowerCase().includes(lower) ||
        String(donViMap[item.id_don_vi] || '').toLowerCase().includes(lower)
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

  const getAvailableEquipmentGroups = (form: any) => {
    let groups = new Set<string>();
    PCCC_SYSTEMS.forEach(sys => {
      const val = form[sys.key] || (sys.key === 'ht_chua_chay_tu_dong_nuoc' ? 'Không' : 'Có');
      if (val === 'Có') {
        groups.add(sys.label);
      }
    });
    return Array.from(groups);
  };

  const openModal = (mode: 'create' | 'update' | 'view', item?: any) => {
    setModalMode(mode);
    const defaultDonViId = user?.id_don_vi || (user as any)?.idDonVi;

    if (item) { 
      setFormData({ ...item }); 
      setEquipmentList(tsPcccData.filter(eq => getUnitIdSafe(eq) === item.id_don_vi).map(e => ({...e}))); 
    } else {
      setFormData({
        id: '', id_don_vi: selectedUnitFilter || (defaultDonViId !== 'ALL' ? defaultDonViId : ''), giay_phep_pccc: 'Nghiệm thu', bao_hiem_chay_no: 'Có', ngay_het_han_bh: '', 
        ho_ten_doi_truong: '', sdt_doi_truong: '', chuc_vu: '', tong_sl_thanh_vien: '', sl_huy_dong_ban_ngay: '', sl_huy_dong_ban_dem: '', 
        ngay_dien_tap: '', link_phuong_an_pccc: '', sdt_pccc: '114', sdt_ub: '', sdt_ca_pccc_catt: '', sdt_cax: '', 
        sdt_dien_luc: '', sdt_cap_thoat_nuoc: '', sdt_yte: '', he_thong_bao_chay_tu_dong: 'Có', he_thong_chua_chay_tu_dong_nuoc: 'Không', 
        he_thong_chua_chay_nuoc: 'Có', dung_cu_pccc: 'Có', khu_vuc_rui_ro_cao: '', loi_ton_tai_chua_khac_phuc: ''
      });
      setEquipmentList([]);
    }
    setDeletedEqIds([]);
    setIsModalOpen(true); setError(null);
  };

  const addEquipmentRow = () => {
    const defaultGroup = getAvailableEquipmentGroups(formData)[0] || '';
    setEquipmentList([...equipmentList, { id: '', id_don_vi: '', nhom_he_thong: defaultGroup, loai_thiet_bi: '', so_luong: '', don_vi_tinh: 'Cái', vi_tri_bo_tri: '', ngay_bom_sac: '', ngay_het_han: '', tinh_trang: 'Hoạt động tốt' }]);
  };

  const handleEquipmentChange = (index: number, field: string, value: string) => { const newList = [...equipmentList]; newList[index][field] = value; setEquipmentList(newList); };
  
  const removeEquipmentRow = (index: number) => { 
    const eq = equipmentList[index]; 
    if (eq.id || eq.ID_TBPCCC) setDeletedEqIds([...deletedEqIds, eq.id || eq.ID_TBPCCC]); 
    setEquipmentList(equipmentList.filter((_, i) => i !== index)); 
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('sdt_doi_truong') || name.includes('sdt_doi_truong')) setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id_don_vi) return alert("Vui lòng chọn Đơn vị!");

    let finalData = { ...formData };
    if(!finalData.ngay_het_han_bh) finalData.ngay_het_han_bh = null;
    if(!finalData.ngay_dien_tap) finalData.ngay_dien_tap = null;

    if (modalMode === 'create') {
      finalData.id = `PCCC-${Date.now()}`;
    }

    setSubmitting(true); setError(null);
    try {
      await apiService.save(finalData, modalMode, "hs_pccc");
      for (const delId of deletedEqIds) await apiService.delete(delId, "ts_pccc");
      if (equipmentList.length > 0) {
        for (const eq of equipmentList) {
          let updatedEq = { ...eq, id_don_vi: formData.id_don_vi };
          if (!updatedEq.ngay_bom_sac) updatedEq.ngay_bom_sac = null;
          if (!updatedEq.ngay_het_han) updatedEq.ngay_het_han = null;

          if (!updatedEq.id) {
            updatedEq.id = `TBPCCC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            await apiService.save(updatedEq, 'create', 'ts_pccc');
          } else {
            await apiService.save(updatedEq, 'update', 'ts_pccc');
          }
        }
      }
      setIsModalOpen(false); 
      loadData(); 
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu PCCC.'); } 
    finally { setSubmitting(false); }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return; setSubmitting(true); setError(null);
    try {
      const pcccToDelete = pcccData.find(item => getPcccIdSafe(item) === itemToDelete);
      const relatedDonViId = pcccToDelete ? getUnitIdSafe(pcccToDelete) : null;
      await apiService.delete(itemToDelete, "hs_pccc");
      setPcccData(prev => prev.filter(item => getPcccIdSafe(item) !== itemToDelete));
      if (relatedDonViId) {
        const eqToDelete = tsPcccData.filter(eq => getUnitIdSafe(eq) === relatedDonViId);
        for (const eq of eqToDelete) {
          const eqId = getTsPcccIdSafe(eq);
          if (eqId) await apiService.delete(eqId, "ts_pccc");
        }
        setTsPcccData(prev => prev.filter(eq => getUnitIdSafe(eq) !== relatedDonViId));
      }
      setIsConfirmOpen(false); setItemToDelete(null); 
    } catch (err: any) { setError(err.message || 'Lỗi xóa dữ liệu.'); } 
    finally { setSubmitting(false); }
  };

  const renderUnitTree = (parent: DonVi, level: number = 1, idx: number = 0) => {
    const children = getChildUnits(parent.id);
    const isExpanded = expandedParents.includes(parent.id) || !!unitSearchTerm;
    return (
      <div key={`${parent.id}-${level}-${idx}`} className={level === 1 ? "mb-1" : "mt-1"}>
        <button onClick={() => { setSelectedUnitFilter(parent.id); if (children.length > 0) toggleParent(parent.id); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedUnitFilter === parent.id ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'}`}>
          {children.length > 0 ? (isExpanded ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />) : <div className="w-4 shrink-0" />}
          <span className="shrink-0">{getUnitEmoji(parent.loai_hinh)}</span>
          <span className="truncate text-left">{parent.ten_don_vi}</span>
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
                  <th className="p-4 w-[20%]">Cơ sở / Đơn vị & Pháp lý</th>
                  <th className="p-4 w-[25%]">Đội PCCC & Diễn tập</th>
                  <th className="p-4 w-[20%]">Thiết bị & Cảnh báo</th>
                  <th className="p-4 w-[20%]">Tổng quan Hệ thống</th>
                  <th className="p-4 text-center w-[15%]">Thao tác</th> 
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={5} className="p-12 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-red-600" />Đang tải dữ liệu...</td></tr>
                ) : filteredPCCC.length === 0 ? (
                  <tr><td colSpan={5} className="p-16 text-center text-gray-500"><ShieldAlert size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-lg font-medium">Chưa có hồ sơ PCCC nào được khai báo.</p></td></tr>
                ) : (
                  filteredPCCC.map((item, index) => {
                    const bhStatus = getStatusColor(safeGet(item, 'ngay_het_han_bh'), 'BH');
                    const dtStatus = getStatusColor(safeGet(item, 'ngay_dien_tap'), 'DT');
                    const eqOfUnit = tsPcccData.filter(eq => getUnitIdSafe(eq) === item.id_don_vi);
                    
                    let totalEq = 0;
                    let warningCount = 0;
                    
                    eqOfUnit.forEach(eq => {
                      const sl = Number(safeGet(eq, 'so_luong')) || 1;
                      totalEq += sl;
                      if (getStatusColor(safeGet(eq, 'ngay_het_han'), 'TB').isDanger) { warningCount += sl; }
                    });

                    return (
                      <tr key={`${getPcccIdSafe(item)}-${index}`} className="hover:bg-red-50/30 transition-colors group">
                        <td className="p-4 align-top">
                          <p className="font-bold text-gray-800 text-sm mb-1 line-clamp-2">{donViMap[item.id_don_vi] || item.id_don_vi}</p>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{getPcccIdSafe(item)}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${safeGet(item, 'giay_phep_pccc') === 'Nghiệm thu' ? 'bg-emerald-100 text-emerald-700' : safeGet(item, 'giay_phep_pccc') === 'Đã phê duyệt' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{safeGet(item, 'giay_phep_pccc') || '---'}</span>
                          </div>
                          <div className="space-y-1.5 text-[11px]">
                            {safeGet(item, 'bao_hiem_chay_no') === 'Có' ? (
                              <div className="flex items-center justify-between"><span className="text-gray-500">Hạn BH:</span><span className={`px-1.5 py-0.5 rounded border ${bhStatus.color}`}>{bhStatus.text}</span></div>
                            ) : (
                              <div className="flex items-center justify-between"><span className="text-gray-500">Hạn BH:</span><span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 border border-red-200 rounded">Không có BH</span></div>
                            )}
                            {safeGet(item, 'link_phuong_an_pccc') && (
                              <a href={safeGet(item, 'link_phuong_an_pccc')} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#05469B] hover:text-blue-700 hover:underline font-bold mt-1"><LinkIcon size={10}/> File Phương án CC</a>
                            )}
                            <div className="mt-3 border-t border-gray-100 pt-2">
                              {/* 🟢 NÚT BẤM GỌI MODAL DANH BẠ */}
                              <button onClick={() => { setSelectedPcccForContact(item); setIsEmergencyContactOpen(true); }} className="flex items-center gap-1.5 text-orange-600 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded border border-orange-200 font-bold transition-colors w-full justify-center">
                                <PhoneCall size={12} /> Danh bạ Khẩn cấp
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 align-top">
                          <div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 mb-2">
                            {safeGet(item, 'ho_ten_doi_truong') ? (
                              <div className="flex flex-col mb-1.5 pb-1.5 border-b border-gray-200">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-[#05469B] flex items-center gap-1.5"><ShieldCheck size={14} className="shrink-0"/> <span className="line-clamp-1">{safeGet(item, 'ho_ten_doi_truong')}</span></span>
                                    <span className="text-[10px] text-gray-500 font-normal pl-5 line-clamp-1">{safeGet(item, 'chuc_vu')}</span>
                                  </div>
                                  
                                  {safeGet(item, 'sdt_doi_truong') && (
                                    <a 
                                      href={`tel:${safeGet(item, 'sdt_doi_truong').replace(/\s/g, '')}`} 
                                      className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:shadow-md border border-emerald-200 px-2 py-1 rounded-md transition-all shrink-0" 
                                      title="Bấm để gọi ngay"
                                    >
                                      <Phone size={12} className="animate-pulse" />
                                      {safeGet(item, 'sdt_doi_truong')}
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : (<div className="text-xs text-gray-400 italic mb-2">Chưa báo cáo Đội trưởng</div>)}
                            <div className="flex justify-between items-center text-[10px] font-medium text-gray-600 bg-white border border-gray-100 rounded p-1.5">
                              <span className="flex items-center gap-1">Tổng: <b className="text-gray-800">{safeGet(item, 'tong_sl_thanh_vien') || 0}</b></span><span className="w-px h-3 bg-gray-200"></span>
                              <span className="flex items-center gap-1"><Sun size={10} className="text-orange-500"/> <b className="text-gray-800">{safeGet(item, 'sl_huy_dong_ban_ngay') || 0}</b></span><span className="w-px h-3 bg-gray-200"></span>
                              <span className="flex items-center gap-1"><Moon size={10} className="text-indigo-500"/> <b className="text-gray-800">{safeGet(item, 'sl_huy_dong_ban_dem') || 0}</b></span>
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
                                if (safeGet(eq, 'nhom_he_thong') === sys.label) sysCount += (Number(safeGet(eq, 'so_luong')) || 1);
                              });
                              const isChecked = safeGet(item, sys.key) === 'Có' || (sys.key === 'dung_cu_pccc' && !safeGet(item, 'dung_cu_pccc'));
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
                          <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal('view', item)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded bg-white shadow-sm border border-emerald-100 transition-colors" title="Xem chi tiết"><Eye size={16}/></button>
                            <button onClick={() => openModal('update', item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded bg-white shadow-sm border border-blue-100 transition-colors" title="Sửa"><Edit size={16}/></button>
                            <button onClick={() => { setItemToDelete(getPcccIdSafe(item)); setIsConfirmOpen(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded bg-white shadow-sm border border-red-100 transition-colors" title="Xóa"><Trash2 size={16}/></button>
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
                        <div><label className="block text-xs font-bold text-gray-700 mb-1">Đơn vị / Cơ sở *</label><select required name="id_don_vi" value={formData.id_don_vi || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500 font-bold text-[#05469B]"><option value="">-- Chọn đơn vị --</option>{buildHierarchicalOptions(donViList.filter(dv => allowedDonViIds.includes(dv.id))).map(({ unit, prefix }, idx) => (<option key={`${unit.id}-${idx}`} value={unit.id}>{prefix}{getUnitEmoji(unit.loai_hinh)} {unit.ten_don_vi}</option>))}</select></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Giấy phép PCCC</label><select name="giay_phep_pccc" value={formData.giay_phep_pccc || 'Nghiệm thu'} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500 font-bold text-emerald-700"><option value="Nghiệm thu">Nghiệm thu</option><option value="Đã phê duyệt">Đã phê duyệt</option><option value="Chưa có">Chưa có</option></select></div>
                          <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Bảo hiểm Cháy nổ</label><select name="bao_hiem_chay_no" value={formData.bao_hiem_chay_no || 'Có'} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500"><option value="Có">Có</option><option value="Không">Không</option></select></div>
                        </div>
                        {formData.bao_hiem_chay_no === 'Có' && (<div><label className="block text-[10px] font-bold text-red-600 mb-1 uppercase">Ngày hết hạn Bảo Hiểm *</label><input type="date" name="ngay_het_han_bh" value={formData.ngay_het_han_bh ? formData.ngay_het_han_bh.split('T')[0] : ''} onChange={handleInputChange} className="w-full p-2 border border-red-300 rounded-lg bg-red-50 outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-700 text-sm" /></div>)}
                        <div><label className="block text-[10px] font-bold text-purple-700 mb-1 uppercase">Link Phương án CC (Drive/PDF)</label><div className="relative"><LinkIcon className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} /><input type="url" name="link_phuong_an_pccc" value={formData.link_phuong_an_pccc || ''} onChange={handleInputChange} className="w-full pl-7 pr-2 py-2 border border-purple-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-purple-500 text-blue-600 text-sm" placeholder="Dán link..." /></div></div>
                      </div>
                    </div>
                    <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-100 shadow-sm h-full flex flex-col">
                      <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2 border-b border-emerald-200 pb-2"><Users size={18}/> 2. Đội PCCC Cơ sở & Diễn tập</h4>
                      <div className="space-y-4 flex-1">
                        <div className="grid grid-cols-1 gap-4"><div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Đội trưởng PCCC</label><input type="text" name="ho_ten_doi_truong" value={formData.ho_ten_doi_truong || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-[#05469B]" placeholder="Họ và tên..." /></div></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Chức vụ</label><input type="text" name="chuc_vu" value={formData.chuc_vu || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="VD: Trưởng phòng..." /></div>
                          <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">SĐT Đội trưởng</label><input type="text" name="sdt_doi_truong" value={formData.sdt_doi_truong || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="xxxx xxx xxx" /></div>
                        </div>
                        <div className="grid grid-cols-4 gap-3 border-t border-emerald-100 pt-4">
                          <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Users size={12} className="text-emerald-600"/> Tổng Thành viên</label><input type="number" name="tong_sl_thanh_vien" value={formData.tong_sl_thanh_vien || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-800" placeholder="Số lượng..." /></div>
                          <div className="col-span-1"><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Sun size={12} className="text-orange-500"/> Ngày</label><input type="number" name="sl_huy_dong_ban_ngay" value={formData.sl_huy_dong_ban_ngay || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="SL..." /></div>
                          <div className="col-span-1"><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Moon size={12} className="text-indigo-500"/> Đêm</label><input type="number" name="sl_huy_dong_ban_dem" value={formData.sl_huy_dong_ban_dem || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="SL..." /></div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 border-t border-emerald-100 pt-4"><div><label className="block text-[10px] font-bold text-emerald-700 mb-1 uppercase">Ngày Diễn tập gần nhất</label><input type="date" name="ngay_dien_tap" value={formData.ngay_dien_tap ? formData.ngay_dien_tap.split('T')[0] : ''} onChange={handleInputChange} className="w-full p-2 border border-emerald-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-800 font-bold text-sm" /></div></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50/40 p-5 rounded-xl border border-orange-200 shadow-sm mt-6">
                    <div className="flex justify-between items-center mb-4 border-b border-orange-200 pb-2">
                      <h4 className="font-bold text-orange-800 flex items-center gap-2"><Droplets size={18}/> 3. Hệ thống Cố định & Thiết bị PCCC</h4>
                      {modalMode !== 'view' && (<button type="button" onClick={addEquipmentRow} className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 transition-colors shadow-sm"><PlusCircle size={16} /> Thêm Thiết bị</button>)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-orange-200">
                      {PCCC_SYSTEMS.map(sys => (
                        <div key={sys.key} className="bg-white p-3 rounded-lg border border-orange-100 flex flex-col justify-between gap-2 h-full">
                          <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5"><sys.Icon size={14} className={sys.color}/> {sys.label}</span>
                          <select name={sys.key} value={formData[sys.key] || (sys.key === 'ht_chua_chay_tu_dong_nuoc' ? 'Không' : 'Có')} onChange={handleInputChange} className="w-full p-2 text-xs font-bold border border-gray-200 rounded outline-none focus:ring-2 focus:ring-orange-500 text-[#05469B] bg-blue-50 mt-auto"><option value="Có">Có</option><option value="Không">Không</option></select>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-xs italic text-gray-500 mb-3 px-1">Kê khai chi tiết các thiết bị thuộc các hệ thống trên (Tủ điều khiển, Bình chữa cháy, Đầu báo khói...)</p>
                    
                   <div className="w-full border border-gray-200 rounded-xl overflow-hidden overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase leading-tight">
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
                              const isCustomUI = eq.nhom_he_thong === 'Khác' || (eq.nhom_he_thong !== '' && !standardOptions.includes(eq.nhom_he_thong));

                              return (
                                <tr key={idx} className="hover:bg-orange-50/50 transition-colors bg-white">
                                  <td className="p-1.5">
                                    {isCustomUI ? (
                                      <div className="flex items-center relative w-full">
                                        <input 
                                          type="text" 
                                          value={eq.nhom_he_thong === 'Khác' ? '' : eq.nhom_he_thong} 
                                          onChange={e => handleEquipmentChange(idx, 'nhom_he_thong', e.target.value || 'Khác')} 
                                          className="w-full p-1.5 text-xs border border-blue-300 rounded outline-none focus:border-blue-500 bg-blue-50 pr-6" 
                                          placeholder="Tự nhập tên..." 
                                          autoFocus 
                                        />
                                        <button type="button" onClick={() => handleEquipmentChange(idx, 'nhom_he_thong', standardOptions.length > 0 ? standardOptions[0] : '')} className="absolute right-1 text-gray-400 hover:text-red-500" title="Hủy tự nhập"><X size={14}/></button>
                                      </div>
                                    ) : (
                                      <select value={eq.nhom_he_thong || ''} onChange={e => handleEquipmentChange(idx, 'nhom_he_thong', e.target.value)} className="w-full p-1.5 text-xs border border-gray-200 rounded outline-none focus:border-orange-500 bg-white">
                                        {!eq.nhom_he_thong && <option value="">-- Chọn --</option>}
                                        {standardOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        <option value="Khác">Khác (Tự nhập...)</option>
                                      </select>
                                    )}
                                  </td>
                                  <td className="p-1.5"><input type="text" value={eq.loai_thiet_bi || ''} onChange={e => handleEquipmentChange(idx, 'loai_thiet_bi', e.target.value)} placeholder="VD: Bình bột ABC 4kg..." className="w-full p-1.5 text-xs border border-gray-200 rounded outline-none focus:border-orange-500 bg-white font-medium" /></td>
                                  <td className="p-1.5"><input type="number" value={eq.so_luong || ''} onChange={e => handleEquipmentChange(idx, 'so_luong', e.target.value)} className="w-full p-1.5 text-xs border border-gray-200 rounded outline-none focus:border-orange-500 bg-white text-center font-bold" /></td>
                                  <td className="p-1.5"><input type="text" value={eq.don_vi_tinh || ''} onChange={e => handleEquipmentChange(idx, 'don_vi_tinh', e.target.value)} placeholder="Bình/Cái..." className="w-full p-1.5 text-xs border border-gray-200 rounded outline-none focus:border-orange-500 bg-white" /></td>
                                  <td className="p-1.5"><input type="text" value={eq.vi_tri_bo_tri || ''} onChange={e => handleEquipmentChange(idx, 'vi_tri_bo_tri', e.target.value)} placeholder="Khu trưng bày..." className="w-full p-1.5 text-xs border border-gray-200 rounded outline-none focus:border-orange-500 bg-white" /></td>
                                  <td className="p-1.5"><input type="date" value={eq.ngay_bom_sac ? eq.ngay_bom_sac.split('T')[0] : ''} onChange={e => handleEquipmentChange(idx, 'ngay_bom_sac', e.target.value)} className="w-full p-1.5 text-xs border border-gray-200 rounded outline-none focus:border-orange-500 bg-white text-gray-600" /></td>
                                  <td className="p-1.5"><input type="date" value={eq.ngay_het_han ? eq.ngay_het_han.split('T')[0] : ''} onChange={e => handleEquipmentChange(idx, 'ngay_het_han', e.target.value)} className="w-full p-1.5 text-xs border border-red-300 rounded outline-none focus:border-red-500 bg-red-50 font-bold text-red-700" title="Dùng để chạy hệ thống cảnh báo" /></td>
                                  <td className="p-1.5"><select value={eq.tinh_trang || 'Hoạt động tốt'} onChange={e => handleEquipmentChange(idx, 'tinh_trang', e.target.value)} className={`w-full p-1.5 text-xs font-bold border rounded outline-none focus:border-orange-500 ${eq.tinh_trang === 'Hư hỏng' ? 'bg-red-50 text-red-600 border-red-200' : eq.tinh_trang === 'Cần bơm sạc' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}><option value="Hoạt động tốt">Hoạt động tốt</option><option value="Cần bơm sạc">Cần bơm sạc</option><option value="Hư hỏng">Hư hỏng</option></select></td>
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
                          <input type="text" name={contact.key} value={formData[contact.key] || contact.def} onChange={handleInputChange} className={`w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm ${contact.bg} ${contact.key==='sdt_pccc'?'border-red-300 font-bold':''}`} placeholder="xxxx xxx xxx" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div><label className="block text-[10px] font-bold text-orange-600 mb-1 uppercase">Khu vực rủi ro cháy nổ cao</label><textarea name="khu_vuc_rui_ro_cao" value={formData.khu_vuc_rui_ro_cao || ''} onChange={handleInputChange} rows={2} className="w-full p-2 border border-orange-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none" placeholder="VD: Kho sơn tĩnh điện, Kho xăng dầu..."></textarea></div>
                      <div><label className="block text-[10px] font-bold text-red-600 mb-1 uppercase">Lỗi / Tồn tại chưa khắc phục (CA Yêu cầu)</label><textarea name="loi_ton_tai_chua_khac_phuc" value={formData.loi_ton_tai_chua_khac_phuc || ''} onChange={handleInputChange} rows={2} className="w-full p-2 border border-red-300 rounded-lg bg-red-50 text-red-800 font-medium outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none" placeholder="Ghi nhận các lỗi hệ thống..."></textarea></div>
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

      {/* 🟢 MODAL DANH BẠ KHẨN CẤP (GỌI NHANH - THÔNG MINH) */}
      {isEmergencyContactOpen && selectedPcccForContact && (() => {
        // TỰ ĐỘNG TÌM LÃNH ĐẠO VÀ PT DVHT CỦA ĐƠN VỊ TƯƠNG ỨNG
        const activeUnitPersonnel = personnelData.filter(ns => ns.id_don_vi === safeGet(selectedPcccForContact, 'id_don_vi') && ns.trang_thai !== 'Đã nghỉ việc');
        const pcccLeader = activeUnitPersonnel.find(ns => String(ns.phan_loai).toLowerCase().includes('lãnh đạo') || String(ns.chuc_vu).toLowerCase().includes('giám đốc'));
        const pcccDvht = activeUnitPersonnel.find(ns => String(ns.phan_loai).toLowerCase().includes('pt dvht'));

        return (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in duration-200 overflow-hidden">
              <div className="bg-red-600 p-4 flex justify-between items-center text-white">
                <h3 className="font-bold flex items-center gap-2 text-lg"><Siren size={22}/> Danh bạ Khẩn cấp</h3>
                <button onClick={() => setIsEmergencyContactOpen(false)} className="hover:bg-red-700 p-1.5 rounded-full transition-colors shadow-sm"><X size={20}/></button>
              </div>
              
              <div className="p-0 max-h-[75vh] overflow-y-auto custom-scrollbar divide-y divide-gray-100">
                
                {/* PHẦN 1: GHI CHÚ PCCC */}
                {safeGet(selectedPcccForContact, 'ghi_chu') && (
                  <div className="bg-yellow-50/50 p-4 border-b border-yellow-100">
                    <h4 className="text-[10px] font-black text-yellow-800 uppercase tracking-wider mb-1">Ghi chú Cơ sở</h4>
                    <p className="text-sm text-yellow-900 whitespace-pre-wrap font-medium">{safeGet(selectedPcccForContact, 'ghi_chu')}</p>
                  </div>
                )}

                {/* PHẦN 2: BAN CHỈ HUY ĐƠN VỊ (Tự động kéo từ bảng Nhân sự) */}
                <div className="bg-blue-50/30">
                  <h4 className="px-4 py-2 text-[10px] font-black text-blue-800 uppercase tracking-wider bg-blue-100/50">Ban Chỉ Huy Đơn Vị</h4>
                  
                  {pcccLeader && (pcccLeader.sdt_ca_nhan || pcccLeader.sdt_cong_ty) && (
                    <div className="flex items-center justify-between p-4 hover:bg-white transition-colors border-b border-blue-50">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><UserCheck size={16}/></div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Lãnh đạo Đơn vị</p>
                          <p className="font-bold text-gray-800 text-sm leading-tight">{pcccLeader.ho_ten}</p>
                          <p className="text-[#05469B] font-black text-sm mt-0.5">{formatPhoneNumber(pcccLeader.sdt_ca_nhan || pcccLeader.sdt_cong_ty)}</p>
                        </div>
                      </div>
                      <a href={`tel:${String(pcccLeader.sdt_ca_nhan || pcccLeader.sdt_cong_ty).replace(/[^\d+]/g, '')}`} className="w-10 h-10 shrink-0 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-md"><PhoneCall size={18}/></a>
                    </div>
                  )}

                  {pcccDvht && (pcccDvht.sdt_ca_nhan || pcccDvht.sdt_cong_ty) && (
                    <div className="flex items-center justify-between p-4 hover:bg-white transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><Briefcase size={16}/></div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Phụ trách DV Hỗ trợ KD</p>
                          <p className="font-bold text-gray-800 text-sm leading-tight">{pcccDvht.ho_ten}</p>
                          <p className="text-[#05469B] font-black text-sm mt-0.5">{formatPhoneNumber(pcccDvht.sdt_ca_nhan || pcccDvht.sdt_cong_ty)}</p>
                        </div>
                      </div>
                      <a href={`tel:${String(pcccDvht.sdt_ca_nhan || pcccDvht.sdt_cong_ty).replace(/[^\d+]/g, '')}`} className="w-10 h-10 shrink-0 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-md"><PhoneCall size={18}/></a>
                    </div>
                  )}
                  
                  {!pcccLeader && !pcccDvht && (
                    <div className="p-4 text-center text-gray-400 text-sm italic border-b border-blue-50">Chưa có thông tin Lãnh đạo & PT DVHT.</div>
                  )}
                </div>

                {/* PHẦN 3: LỰC LƯỢNG TẠI CHỖ (ĐỘI TRƯỞNG PCCC) */}
                <div className="bg-orange-50/30">
                  <h4 className="px-4 py-2 text-[10px] font-black text-orange-800 uppercase tracking-wider bg-orange-100/50">Lực lượng tại chỗ</h4>
                  {safeGet(selectedPcccForContact, 'ho_ten_doi_truong') && safeGet(selectedPcccForContact, 'sdt_doi_truong') ? (
                    <div className="flex items-center justify-between p-4 hover:bg-white transition-colors border-t border-orange-100/50">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><HardHat size={16}/></div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Đội trưởng PCCC</p>
                          <p className="font-bold text-gray-800 text-sm leading-tight">{safeGet(selectedPcccForContact, 'ho_ten_doi_truong')}</p>
                          <p className="text-[#05469B] font-black text-sm mt-0.5">{formatPhoneNumber(safeGet(selectedPcccForContact, 'sdt_doi_truong'))}</p>
                        </div>
                      </div>
                      <a href={`tel:${String(safeGet(selectedPcccForContact, 'sdt_doi_truong')).replace(/[^\d+]/g, '')}`} className="w-10 h-10 shrink-0 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-md"><PhoneCall size={18}/></a>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-400 text-sm italic">Chưa cập nhật Đội trưởng PCCC.</div>
                  )}
                </div>

                {/* PHẦN 4: CƠ QUAN CHỨC NĂNG */}
                <div className="bg-red-50/30">
                  <h4 className="px-4 py-2 text-[10px] font-black text-red-800 uppercase tracking-wider bg-red-100/50">Cơ quan Chức năng</h4>
                  {EMERGENCY_CONTACTS.map(contact => {
                    const phone = safeGet(selectedPcccForContact, contact.key) || contact.def;
                    if (!phone) return null;
                    return (
                      <div key={contact.key} className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${contact.bg !== 'bg-white' ? contact.bg : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm ${contact.color}`}>
                            <AlertTriangle size={16}/>
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm leading-tight">{contact.label}</p>
                            <p className={`${contact.color} font-black text-sm mt-0.5`}>{formatPhoneNumber(phone)}</p>
                          </div>
                        </div>
                        <a href={`tel:${String(phone).replace(/[^\d+]/g, '')}`} className="w-10 h-10 shrink-0 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-md">
                          <PhoneCall size={18}/>
                        </a>
                      </div>
                    )
                  })}
                </div>
                
              </div>
            </div>
          </div>
        );
      })()}

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