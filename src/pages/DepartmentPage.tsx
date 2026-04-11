import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, X, AlertCircle, Loader2, Save, 
  Building2, MapPin, ChevronDown, ChevronRight, Phone, Mail as MailIcon, 
  PanelLeftClose, PanelLeftOpen, Shield, Camera, Users, Map, 
  Link as LinkIcon, FileText, Briefcase, ExternalLink,
  Maximize2, Layers, DoorOpen, Coffee, UserCheck, Copy, CheckCheck,
  HardHat, CloudLightning, Utensils, Monitor,
  Projector, Video, LayoutTemplate, MousePointerClick, 
  SquarePen, PenTool, Wand2, Compass, Clock, Sun, Moon,
  MonitorSmartphone, Tag, Car, Pocket, Store, Warehouse,
  Flame, ShieldAlert, Droplets, BellRing, BatteryWarning, Settings,
  PhoneCall, PlusCircle, ShieldCheck, CheckCircle2, Siren, AlertTriangle, Eye
} from 'lucide-react';
import { apiService } from '../services/api';
import { DonVi, Personnel, AnNinh, PhapNhan, PhongHop, TS_Xe, ThietBi } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { buildHierarchicalOptions, getUnitEmoji } from '../utils/hierarchy'; 

// 🟢 [HÀM TIỆN ÍCH CHUNG]
const safeGet = (obj: any, key: string) => {
  if (!obj) return '';
  if (obj[key] !== undefined) return obj[key];
  const lowerKey = key.toLowerCase();
  for (const k in obj) { if (k.toLowerCase() === lowerKey) return obj[k]; }
  return '';
};

const getSecId = (sec: any) => safeGet(sec, 'id');
const getPvhcId = (p: any) => safeGet(p, 'id');
const getPcccIdSafe = (item: any) => safeGet(item, 'id');
const getTsPcccIdSafe = (item: any) => safeGet(item, 'id');
const getUnitIdSafe = (item: any) => safeGet(item, 'id_don_vi');

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

const formatToVN = (isoStr: string) => {
  if (!isoStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) {
    const parts = isoStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr; 
};

const formatCurrency = (val: string | number | undefined | null) => {
  if (!val) return '';
  return val.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const formatPhoneNumber = (val: string | number | undefined | null) => {
  if (!val) return '';
  const cleaned = val.toString().replace(/\D/g, ''); 
  if (cleaned.length <= 4) return cleaned;
  if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
};

const renderContractWarning = (ngayKy: any, soThang: any) => {
  if (!ngayKy || !soThang) return null;
  
  const startDate = new Date(ngayKy);
  if (isNaN(startDate.getTime())) return null;
  
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + Number(soThang));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const endFormat = endDate.toLocaleDateString('vi-VN');

  if (diffDays < 0) {
    return <p className="text-[10px] text-red-600 font-bold bg-red-100 p-1 rounded mt-1 w-max">Đã hết hạn ({endFormat})</p>;
  } else if (diffDays <= 30) {
    return <p className="text-[10px] text-orange-600 font-bold bg-orange-100 p-1 rounded mt-1 animate-pulse w-max">⚠️ Sắp hết ({diffDays} ngày - {endFormat})</p>;
  } else {
    return <p className="text-[10px] text-emerald-600 font-medium mt-1">Hạn HĐ: {endFormat}</p>;
  }
};

// 🟢 [CẤU HÌNH PCCC]
const PCCC_SYSTEMS = [
  { key: 'he_thong_bao_chay_tu_dong', label: 'Hệ thống Báo cháy tự động', Icon: Siren, color: 'text-orange-500' },
  { key: 'he_thong_chua_chay_tu_dong_nuoc', label: 'Hệ thống Chữa cháy tự động', Icon: Droplets, color: 'text-blue-500' },
  { key: 'he_thong_chua_chay_nuoc', label: 'Hệ thống Chữa cháy vách tường', Icon: Droplets, color: 'text-cyan-500' },
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
    if (val === 'Có') groups.add(sys.label);
  });
  return Array.from(groups);
};

const initialFormState: Partial<DonVi> = {
  id: '', ten_don_vi: '', cap_quan_ly: '', dia_chi: '', dien_tich: '', so_tang: '', so_ham: '',
  so_phong_cho: '', so_cong: '', luot_khach_bq: '', tong_nhan_su: '', loai_hinh: 'Showroom Quản trị', trang_thai: 'Hoạt động', phia: 'CTTT Phía Nam', kinh_doanh: ''
};

const KINH_DOANH_OPTIONS = ['Kia', 'Mazda', 'Peugeot', 'BMW', 'Du lịch', 'Tải, Bus'];

export default function DepartmentPage() {
  const { user } = useAuth();
  
  const [data, setData] = useState<DonVi[]>([]);
  const [personnelData, setPersonnelData] = useState<Personnel[]>([]);
  const [anNinhData, setAnNinhData] = useState<any[]>([]); 
  const [phapNhanData, setPhapNhanData] = useState<PhapNhan[]>([]); 
  const [phongHopData, setPhongHopData] = useState<PhongHop[]>([]); 
  const [xeData, setXeData] = useState<TS_Xe[]>([]);
  const [thietBiData, setThietBiData] = useState<ThietBi[]>([]);
  const [pvhcData, setPvhcData] = useState<any[]>([]);
  
  const [pcccData, setPcccData] = useState<any[]>([]);
  const [tsPcccData, setTsPcccData] = useState<any[]>([]);
  const [isPcccModalOpen, setIsPcccModalOpen] = useState(false);
  const [isEmergencyContactOpen, setIsEmergencyContactOpen] = useState(false); // <--- Dòng bạn vừa thêm
  const [pcccFormData, setPcccFormData] = useState<any>({}); 
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [deletedEqIds, setDeletedEqIds] = useState<string[]>([]);

  const [atvsldData, setAtvsldData] = useState<any[]>([]);
  const [isAtvsldModalOpen, setIsAtvsldModalOpen] = useState(false);
  const [atvsldFormData, setAtvsldFormData] = useState<any>({});

  const [pcttData, setPcttData] = useState<any[]>([]);
  const [isPcttModalOpen, setIsPcttModalOpen] = useState(false);
  const [pcttFormData, setPcttFormData] = useState<any>({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'update' | 'view'>('create');
  const [formData, setFormData] = useState<Partial<DonVi>>(initialFormState);
  const [customKD, setCustomKD] = useState('');

  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [securityFormData, setSecurityFormData] = useState<any>({});

  const [isPnModalOpen, setIsPnModalOpen] = useState(false);
  const [pnModalMode, setPnModalMode] = useState<'create' | 'update'>('create');
  const [pnFormData, setPnFormData] = useState<Partial<PhapNhan>>({});
  
  const [isPhModalOpen, setIsPhModalOpen] = useState(false);
  const [phModalMode, setPhModalMode] = useState<'create' | 'update'>('create');
  const [phFormData, setPhFormData] = useState<Partial<PhongHop>>({});

  const [isPvhcModalOpen, setIsPvhcModalOpen] = useState(false);
  const [pvhcFormData, setPvhcFormData] = useState<any>({});

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'donvi' | 'phapnhan' | 'phonghop' | 'pccc' | 'pctt'} | null>(null);

  const loadData = async () => {
    setLoading(true); setError(null);
    try { 
      const [dvResult, nsResult, anResult, pnResult, phResult, xeResult, tbResult, pvhcResult, pcResult, atvsldResult, pcttResult, tsPcccResult] = await Promise.all([
        apiService.getDonVi(), apiService.getPersonnel(), apiService.getAnNinh(), apiService.getPhapNhan(), 
        apiService.getPhongHop ? apiService.getPhongHop() : Promise.resolve([]),
        apiService.getXe ? apiService.getXe().catch(() => []) : Promise.resolve([]),
        apiService.getThietBi ? apiService.getThietBi().catch(() => []) : Promise.resolve([]),
        apiService.getPVHC ? apiService.getPVHC().catch(() => []) : Promise.resolve([]),
        apiService.getPCCC ? apiService.getPCCC().catch(() => []) : Promise.resolve([]),
        apiService.getATVSLD ? apiService.getATVSLD().catch(() => []) : Promise.resolve([]),
        apiService.getPCTT ? apiService.getPCTT().catch(() => []) : Promise.resolve([]),
        apiService.getTsPCCC ? apiService.getTsPCCC().catch(() => []) : Promise.resolve([])
      ]);
      setData(dvResult || []); setPersonnelData(nsResult || []); setAnNinhData(anResult || []); setPhapNhanData(pnResult || []); setPhongHopData(phResult || []);
      setXeData(xeResult || []); setThietBiData(tbResult || []); setPvhcData(pvhcResult || []);
      
      const cleanPccc = (pcResult || []).map((item: any) => ({
        ...item,
        ngay_het_han_bh: normalizeDateToISO(safeGet(item, 'ngay_het_han_bh')),
        ngay_dien_tap: normalizeDateToISO(safeGet(item, 'ngay_dien_tap')),
      }));
      setPcccData(cleanPccc);

      const cleanTsPccc = (tsPcccResult || []).map((item: any) => ({
        ...item,
        ngay_bom_sac: normalizeDateToISO(safeGet(item, 'ngay_bom_sac')),
        ngay_het_han: normalizeDateToISO(safeGet(item, 'ngay_het_han')),
      }));
      setTsPcccData(cleanTsPccc);

      const cleanAtvsld = (atvsldResult || []).map((item: any) => ({
        ...item,
        ngay_huan_luyen_gan_nhat: normalizeDateToISO(item.ngay_huan_luyen_gan_nhat),
        ngay_kham_sk_gan_nhat: normalizeDateToISO(item.ngay_ksk),
        ngay_kham_benh_nghe_nghiep: normalizeDateToISO(item.nngay_kham_bnn),
        ngay_quan_trac_moi_truong: normalizeDateToISO(item.ngay_quan_trac_mt),
        ngay_tu_kiem_tra_gan_nhat: normalizeDateToISO(item.ngay_tu_kiem_tra),
      }));
      setAtvsldData(cleanAtvsld);

      const cleanPctt = (pcttResult || []).map((item: any) => ({
        ...item,
        ngay_kiem_tra_pctt: normalizeDateToISO(item.ngay_kiem_tra_pctt),
        ngay_cap_nhat_tai_san: normalizeDateToISO(item.ngay_cap_nhat_tai_san),
      }));
      setPcttData(cleanPctt);
    } 
    catch (err: any) { setError(err.message || 'Lỗi tải dữ liệu. Vui lòng kiểm tra lại kết nối mạng.'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);
  const getAllSubordinateIds = (unitId: string, allUnits: DonVi[]): string[] => {
    const subordinates = allUnits.filter(u => u.cap_quan_ly === unitId);
    let ids = subordinates.map(u => u.id);
    subordinates.forEach(sub => { ids = [...ids, ...getAllSubordinateIds(sub.id, allUnits)]; });
    return ids;
  };

  const allowedDonViIds = useMemo(() => {
    if (!user) return [];
    if (user.id_don_vi === 'ALL') return data.map(dv => dv.id);
    const subIds = getAllSubordinateIds(user.id_don_vi, data);
    const allAllowed = [user.id_don_vi, ...subIds];
    return data.filter(dv => allAllowed.includes(dv.id)).map(dv => dv.id);
  }, [user, data]);

  const filteredData = useMemo(() => {
    let baseUnits = data.filter(item => allowedDonViIds.includes(item.id));
    if (!searchTerm) return baseUnits;

    const lower = searchTerm.toLowerCase();
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
  }, [data, searchTerm, allowedDonViIds]);

  useEffect(() => {
    if (filteredData.length > 0 && !selectedUnitId) { setSelectedUnitId(filteredData[0].id); }
  }, [filteredData, selectedUnitId]);

  const parentUnits = useMemo(() => filteredData.filter(item => item.cap_quan_ly === 'HO' || !item.cap_quan_ly), [filteredData]);
  const getChildUnits = (parentId: string) => filteredData.filter(item => item.cap_quan_ly === parentId);

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
  const selectedUnit = useMemo(() => data.find(item => item.id === selectedUnitId) || null, [data, selectedUnitId]);
  
  const donViMap = useMemo(() => {
    const map: Record<string, string> = {};
    data.forEach(dv => { map[dv.id] = dv.ten_don_vi; });
    return map;
  }, [data]);

  const selectedUnitSubordinates = useMemo(() => {
    if (!selectedUnitId) return [];
    const subIds = getAllSubordinateIds(selectedUnitId, data);
    return [selectedUnitId, ...subIds];
  }, [selectedUnitId, data]);

  const currentAnNinh = useMemo(() => anNinhData.find(item => getUnitIdSafe(item) === selectedUnitId) || null, [anNinhData, selectedUnitId]);
  const currentPvhc = useMemo(() => pvhcData.find(item => getUnitIdSafe(item) === selectedUnitId) || null, [pvhcData, selectedUnitId]);
  const currentPccc = useMemo(() => pcccData.find(item => getUnitIdSafe(item) === selectedUnitId) || null, [pcccData, selectedUnitId]);
  const currentAtvsld = useMemo(() => atvsldData.find(item => getUnitIdSafe(item) === selectedUnitId) || null, [atvsldData, selectedUnitId]);
  const currentPctt = useMemo(() => pcttData.find(item => getUnitIdSafe(item) === selectedUnitId) || null, [pcttData, selectedUnitId]);

  const currentPhapNhanList = useMemo(() => phapNhanData.filter(item => selectedUnitSubordinates.includes(getUnitIdSafe(item))), [phapNhanData, selectedUnitSubordinates]);
  const currentPhongHopList = useMemo(() => phongHopData.filter(item => getUnitIdSafe(item) === selectedUnitId), [phongHopData, selectedUnitId]);
  const unitStaff = useMemo(() => personnelData.filter(p => getUnitIdSafe(p) === selectedUnitId), [personnelData, selectedUnitId]);

  const isParentUnit = selectedUnitSubordinates.length > 1;

  const branchStats = useMemo(() => {
    if (!isParentUnit) return null;
    const subordinates = data.filter(u => selectedUnitSubordinates.includes(u.id) && u.id !== selectedUnitId);
    return {
      total: subordinates.length,
      srQt: subordinates.filter(u => String(u.loai_hinh).toLowerCase().includes('quản trị') || String(u.loai_hinh).toLowerCase().includes('công ty tỉnh')).length,
      sr: subordinates.filter(u => String(u.loai_hinh).toLowerCase().trim() === 'showroom').length,
      dkd: subordinates.filter(u => String(u.loai_hinh).toLowerCase().includes('điểm kinh doanh')).length,
      kho: subordinates.filter(u => String(u.loai_hinh).toLowerCase().includes('kho')).length,
    };
  }, [isParentUnit, selectedUnitSubordinates, data, selectedUnitId]);

  const aggregatedStats = useMemo(() => {
    if (!isParentUnit) return null;
    let totalDienTich = 0, totalPhongCho = 0, totalCong = 0, totalKhach = 0, totalNhanSu = 0, childCount = 0;
    let showroomCount = 0, diemKdCount = 0, xuongDvCount = 0; 

    data.forEach(dv => {
      if (selectedUnitSubordinates.includes(dv.id) && dv.trang_thai === 'Hoạt động') {
        if (dv.id !== selectedUnitId) {
          childCount++;
          if (dv.loai_hinh === 'Showroom') showroomCount++;
          if (dv.loai_hinh === 'Điểm Kinh Doanh') diemKdCount++;
          if (dv.loai_hinh === 'Xưởng Dịch vụ') xuongDvCount++; 
        }
        totalDienTich += Number(dv.dien_tich) || 0;
        totalPhongCho += Number(dv.so_phong_cho) || 0;
        totalCong += Number(dv.so_cong) || 0;
        totalKhach += Number(dv.luot_khach_bq) || 0;
        totalNhanSu += Number(dv.tong_nhan_su) || 0;
      }
    });

    return { childCount, showroomCount, diemKdCount, xuongDvCount, totalDienTich, totalPhongCho, totalCong, totalKhach, totalNhanSu };
  }, [isParentUnit, selectedUnitSubordinates, data, selectedUnitId]);

  const aggregatedSecurity = useMemo(() => {
    if (!isParentUnit) return null;
    let tongANBV = 0, noiBo = 0, dichVu = 0, chiPhi = 0, tongCam = 0, camHD = 0, camHu = 0;
    data.forEach(dv => {
      if (selectedUnitSubordinates.includes(dv.id) && dv.trang_thai === 'Hoạt động') {
        const sec = anNinhData.find(a => getUnitIdSafe(a) === dv.id);
        if (sec) {
          tongANBV += Number(safeGet(sec, 'tong_bv')) || 0;
          noiBo += Number(safeGet(sec, 'bv_noi_bo')) || 0;
          dichVu += Number(safeGet(sec, 'bv_dich_vu')) || 0;
          chiPhi += Number(safeGet(sec, 'chi_phi_thue')) || 0;
          tongCam += Number(safeGet(sec, 'sl_camera')) || 0;
          camHD += Number(safeGet(sec, 'camera_hoat_dong')) || 0;
          camHu += Number(safeGet(sec, 'camera_hu')) || 0;
        }
      }
    });
    return { tongANBV, noiBo, dichVu, chiPhi, tongCam, camHD, camHu };
  }, [isParentUnit, selectedUnitSubordinates, anNinhData, data]);

  const expiringContracts = useMemo(() => {
    if (!isParentUnit) return [];
    const warnings: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    data.forEach(dv => {
      if (selectedUnitSubordinates.includes(dv.id) && dv.trang_thai === 'Hoạt động') {
        const sec = anNinhData.find(a => getUnitIdSafe(a) === dv.id);
        if (sec && Number(safeGet(sec, 'bv_dich_vu')) >= 1) {
          const ngayKy = safeGet(sec, 'ngay_ky_hd');
          const soThang = Number(safeGet(sec, 'han_hop_dong'));
          
          if (ngayKy && soThang) {
            const startDate = new Date(ngayKy);
            if (!isNaN(startDate.getTime())) {
              const endDate = new Date(startDate);
              endDate.setMonth(endDate.getMonth() + soThang);
              endDate.setHours(0, 0, 0, 0);
              
              const diffTime = endDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              warnings.push({
                unitName: dv.ten_don_vi,
                provider: safeGet(sec, 'ncc_dich_vu') || 'Chưa rõ',
                endDate: endDate.toLocaleDateString('vi-VN'),
                diffDays: diffDays
              });
            }
          }
        }
      }
    });
    return warnings.sort((a, b) => a.diffDays - b.diffDays);
  }, [isParentUnit, selectedUnitSubordinates, data, anNinhData]);

  const aggregatedPvhc = useMemo(() => {
    if (!isParentUnit) return null;
    let dinhBien = 0, hienHuu = 0, khachCho = 0, veSinh = 0, dichVu = 0, chiPhi = 0;
    data.forEach(dv => {
      if (selectedUnitSubordinates.includes(dv.id) && dv.trang_thai === 'Hoạt động') {
        const pvhc = pvhcData.find(p => getUnitIdSafe(p) === dv.id);
        if (pvhc) {
          dinhBien += Number(safeGet(pvhc, 'dinh_bien')) || 0;
          hienHuu += Number(safeGet(pvhc, 'hien_huu')) || 0;
          khachCho += Number(safeGet(pvhc, 'pvhc_khach_cho')) || 0;
          veSinh += Number(safeGet(pvhc, 'pvhc_ve_sinh')) || 0;
          dichVu += Number(safeGet(pvhc, 'pvhc_dich_vu')) || 0;
          chiPhi += Number(safeGet(pvhc, 'chi_phi_thue')) || 0;
        }
      }
    });
    return { dinhBien, hienHuu, khachCho, veSinh, dichVu, chiPhi };
  }, [isParentUnit, selectedUnitSubordinates, pvhcData, data]);

  const currentXeList = useMemo(() => xeData.filter(item => selectedUnitSubordinates.includes(getUnitIdSafe(item))), [xeData, selectedUnitSubordinates]);
  const currentTbList = useMemo(() => thietBiData.filter(item => selectedUnitSubordinates.includes(getUnitIdSafe(item))), [thietBiData, selectedUnitSubordinates]);

  const xeStats = useMemo(() => {
    const active = currentXeList.filter(x => safeGet(x, 'hien_trang') === 'Đang hoạt động').length;
    const inactive = currentXeList.length - active;
    const grouped: Record<string, { total: number, brands: Record<string, { total: number, models: Record<string, number> }> }> = {};
    currentXeList.forEach(xe => {
      const purpose = safeGet(xe, 'muc_dich_su_dung') || 'Khác';
      const brand = safeGet(xe, 'hieu_xe') || 'Khác';
      const model = safeGet(xe, 'loai_xe') || 'Không rõ';
      if (!grouped[purpose]) grouped[purpose] = { total: 0, brands: {} };
      grouped[purpose].total++;
      if (!grouped[purpose].brands[brand]) grouped[purpose].brands[brand] = { total: 0, models: {} };
      grouped[purpose].brands[brand].total++;
      if (!grouped[purpose].brands[brand].models[model]) grouped[purpose].brands[brand].models[model] = 0;
      grouped[purpose].brands[brand].models[model]++;
    });
    return { total: currentXeList.length, active, inactive, grouped };
  }, [currentXeList]);

  const tbStats = useMemo(() => {
    const active = currentTbList.filter(t => safeGet(t, 'tinh_trang') === 'Đang sử dụng').length;
    const inactive = currentTbList.length - active;
    const grouped: Record<string, number> = {};
    currentTbList.forEach(tb => {
      const group = safeGet(tb, 'nhom_thiet_bi') || 'Khác';
      grouped[group] = (grouped[group] || 0) + 1;
    });
    const sortedGroups = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
    return { total: currentTbList.length, active, inactive, groups: sortedGroups };
  }, [currentTbList]);

  const subordinateStats = useMemo(() => {
    if (selectedUnitSubordinates.length <= 1) return [];
    const stats: { id: string, name: string, xe: number, tb: number }[] = [];
    selectedUnitSubordinates.forEach(unitId => {
      const xeCount = currentXeList.filter(x => getUnitIdSafe(x) === unitId).length;
      const tbCount = currentTbList.filter(t => getUnitIdSafe(t) === unitId).length;
      if (xeCount > 0 || tbCount > 0) stats.push({ id: unitId, name: donViMap[unitId] || unitId, xe: xeCount, tb: tbCount });
    });
    return stats;
  }, [selectedUnitSubordinates, currentXeList, currentTbList, donViMap]);

  const leader = useMemo(() => unitStaff.find(p => p.id === selectedUnit?.id_giam_doc) || unitStaff.find(p => p.phan_loai === 'Lãnh đạo'), [unitStaff, selectedUnit]);
  const kdXe = useMemo(() => unitStaff.find(p => p.id === selectedUnit?.id_ptkd_xe) || unitStaff.find(p => String(p.chuc_vu || '').toLowerCase().includes('kinh doanh xe') || String(p.chuc_vu || '').toLowerCase().includes('kd xe')), [unitStaff, selectedUnit]);
  const kdDvpt = useMemo(() => unitStaff.find(p => p.id === selectedUnit?.id_ptkd_dvpt) || unitStaff.find(p => String(p.chuc_vu || '').toLowerCase().includes('dvpt') || String(p.chuc_vu || '').toLowerCase().includes('dịch vụ phụ tùng') || String(p.chuc_vu || '').toLowerCase().includes('phó tổng giám đốc')), [unitStaff, selectedUnit]);
  const dvht1 = useMemo(() => unitStaff.find(p => p.id === selectedUnit?.id_pt_dvht1) || unitStaff.find(p => String(p.chuc_vu || '').toLowerCase().includes('dvht 1') || String(p.chuc_vu || '').toLowerCase().includes('hỗ trợ 1') || String(p.chuc_vu || '').toLowerCase().includes('dvht kd 1')), [unitStaff, selectedUnit]);
  const dvht2 = useMemo(() => unitStaff.find(p => p.id === selectedUnit?.id_pt_dvht2) || unitStaff.find(p => String(p.chuc_vu || '').toLowerCase().includes('dvht 2') || String(p.chuc_vu || '').toLowerCase().includes('hỗ trợ 2') || String(p.chuc_vu || '').toLowerCase().includes('dvht kd 2')), [unitStaff, selectedUnit]);
  const ptNhanSu = useMemo(() => unitStaff.find(p => p.id === selectedUnit?.id_pt_nhan_su) || unitStaff.find(p => String(p.chuc_vu || '').toLowerCase().includes('nhân sự') || String(p.chuc_vu || '').toLowerCase().includes('hành chính')), [unitStaff, selectedUnit]);

  const isSelectedUnitDimmed = selectedUnit?.trang_thai === 'Đại lý' || selectedUnit?.trang_thai === 'Đầu tư mới';

  const handleButVietChange = (color: string, isChecked: boolean) => {
    let currentColors = phFormData.but_viet ? phFormData.but_viet.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    if (isChecked) { if (!currentColors.includes(color)) currentColors.push(color); } 
    else { currentColors = currentColors.filter((c: string) => c !== color); }
    setPhFormData({ ...phFormData, but_viet: currentColors.join(', ') });
  };

  const handleKinhDoanhChange = (val: string, isChecked: boolean) => {
    let currentList = formData.kinh_doanh ? formData.kinh_doanh.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    if (isChecked) { if (!currentList.includes(val)) currentList.push(val); } 
    else { currentList = currentList.filter((item: string) => item !== val); }
    setFormData({ ...formData, kinh_doanh: currentList.join(', ') });
  };

  const addCustomKD = () => {
    if (!customKD.trim()) return;
    let currentList = formData.kinh_doanh ? formData.kinh_doanh.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    if (!currentList.includes(customKD.trim())) {
      currentList.push(customKD.trim());
      setFormData({ ...formData, kinh_doanh: currentList.join(', ') });
    }
    setCustomKD('');
  };

  const handleCopyInvoice = (pn: PhapNhan) => {
    const textToCopy = `Tên công ty: ${pn.ten_cong_ty}\nMST: ${pn.ma_so_thue}\nĐịa chỉ: ${pn.dia_chi || ''}\nEmail: ${pn.mail || ''}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedId(pn.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleInlineAssign = async (fieldKey: string, idNhanSu: string) => {
    if (!selectedUnit) return;
    const updatedUnit = { ...selectedUnit, [fieldKey]: idNhanSu };
    try {
      await apiService.save(updatedUnit, 'update', 'dm_don_vi');
      setData(prev => prev.map(item => item.id === updatedUnit.id ? updatedUnit : item));
    } catch (err) { alert("Lỗi cập nhật nhân sự."); }
  };

  const PersonnelCard = ({ title, person, roleDefault, fieldKey, isLarge = false }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSavingLocal, setIsSavingLocal] = useState(false);

    const onSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedId = e.target.value;
      setIsSavingLocal(true);
      await handleInlineAssign(fieldKey, selectedId);
      setIsSavingLocal(false); setIsEditing(false);
    };

    const sdt = person ? (person.sdt_ca_nhan || person.sdt_cong_ty || '') : '';
    const email = person?.email || '';
    const hoTen = person?.ho_ten || '';
    const maNV = person?.ma_so_nhan_vien || '';
    const chucVu = person ? person.chuc_vu : title;

    // Tìm Lãnh đạo và Phụ trách DVHT của Đơn vị đang được chọn
  const currentUnitPersonnel = personnelData.filter(ns => ns.id_don_vi === selectedUnitId && ns.trang_thai !== 'Đã nghỉ việc');
  
  const leader = currentUnitPersonnel.find(ns => 
    String(ns.phan_loai).toLowerCase().includes('lãnh đạo') || 
    String(ns.chuc_vu).toLowerCase().includes('giám đốc')
  );
  
  const dvht1 = currentUnitPersonnel.find(ns => 
    String(ns.phan_loai).toLowerCase().includes('pt dvht')
  );

    return (
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-md relative group ${isLarge ? 'md:col-span-2' : ''}`}>
        {!isEditing && !isSavingLocal && person && (
          <button onClick={() => setIsEditing(true)} className="absolute top-2 right-2 p-1.5 bg-white border border-blue-200 text-[#05469B] hover:bg-[#05469B] hover:text-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-all z-20" title="Chuyển người khác"><Edit size={14}/></button>
        )}
        <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 min-h-[50px] flex items-center">
          <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider leading-snug pr-6">{chucVu}</h4>
        </div>
        <div className="p-4 flex-1 flex flex-col relative h-full min-h-[110px]">
          {isSavingLocal && <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20"><Loader2 className="animate-spin text-[#05469B] mb-2" size={24}/><span className="text-xs font-bold text-gray-500">Đang lưu...</span></div>}
          {isEditing ? (
            <div className="flex flex-col h-full justify-center">
              <label className="text-xs font-bold text-[#05469B] mb-2">Chọn nhân sự phụ trách:</label>
              <select onChange={onSelectChange} defaultValue={person?.id || ''} className="w-full p-2 border border-blue-300 rounded-lg bg-blue-50 outline-none focus:ring-2 focus:ring-[#05469B] text-sm font-semibold text-gray-800">
                <option value="">-- Trống (Xóa người này) --</option>
                {unitStaff.map(p => (<option key={p.id} value={p.id}>{p.ho_ten} ({p.ma_so_nhan_vien})</option>))}
              </select>
              <button onClick={() => setIsEditing(false)} className="mt-3 text-xs font-bold text-gray-400 hover:text-red-500 text-center">Hủy thao tác</button>
            </div>
          ) : person ? (
            <>
              <p className={`font-black text-[#05469B] mb-4 ${isLarge ? 'text-xl' : 'text-lg'}`}>{hoTen}</p>
              <div className="space-y-2 mt-auto">
                <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-md border border-gray-200 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/50 group/phone">
                  <Phone size={14} className="text-gray-400 shrink-0 group-hover/phone:text-[#05469B]"/>
                  {sdt ? <a href={`tel:${sdt.replace(/\s/g, '')}`} className="text-sm font-semibold text-gray-700 group-hover/phone:text-[#05469B] w-full" title="Bấm để gọi">{formatPhoneNumber(sdt)}</a> : <span className="text-sm font-semibold text-gray-400">---</span>}
                </div>
                <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-md border border-gray-200 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/50 group/mail">
                  <MailIcon size={14} className="text-gray-400 shrink-0 group-hover/mail:text-[#05469B]"/>
                  {email ? <a href={`mailto:${email}`} className="text-sm font-semibold text-gray-700 truncate group-hover/mail:text-[#05469B] w-full" title="Bấm để gửi mail">{email}</a> : <span className="text-sm font-semibold text-gray-400 truncate">---</span>}
                </div>
              </div>
            </>
          ) : (
            <div onClick={() => { if(unitStaff.length > 0) setIsEditing(true); else alert('Chưa có nhân sự nào trong danh sách!'); }} className="flex-1 flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors group/box">
              <p className="text-sm text-gray-400 group-hover/box:text-[#05469B] font-medium italic transition-colors">Chưa có {roleDefault}</p>
            </div>
          )}
        </div>
      </div>
    );
  };
  const openModal = (mode: 'create' | 'update', item?: DonVi) => {
    setModalMode(mode); 
    setCustomKD(''); 
    setFormData(item ? { ...item } : { ...initialFormState, id: `DV${Date.now()}` }); 
    setIsModalOpen(true); setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    try {
      const res = await apiService.save(formData, modalMode, "dm_don_vi");
      const savedId = res?.newId || res?.id || formData.id;
      const finalData = { ...formData, id: savedId } as DonVi;
      if (modalMode === 'create') { setData(prev => [...prev, finalData]); setSelectedUnitId(savedId); } 
      else { setData(prev => prev.map(item => item.id === savedId ? finalData : item)); }
      setIsModalOpen(false); 
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu.'); } 
    finally { setSubmitting(false); }
  };

  const openPnModal = (mode: 'create' | 'update', item?: PhapNhan) => {
  setPnModalMode(mode);
  if (item) { setPnFormData({ ...item }); } 
  else { setPnFormData({ id: `PN${Date.now()}`, id_don_vi: selectedUnitId || '', ten_cong_ty: '', ma_so_thue: '', dia_chi: '', gpkd: '', mail: '' }); }
  setIsPnModalOpen(true);
};

  const handlePnSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    try {
      const response = await apiService.save(pnFormData, pnModalMode, "dm_phap_nhan");
      const savedId = response?.newId || response?.id || pnFormData.id;
      const finalData = { ...pnFormData, id: savedId } as PhapNhan;
      if (pnModalMode === 'create') { setPhapNhanData(prev => [...prev, finalData]); } 
      else { setPhapNhanData(prev => prev.map(item => item.id === savedId ? finalData : item)); }
      setIsPnModalOpen(false);
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu Pháp nhân.'); } 
    finally { setSubmitting(false); }
  };

  const openPhModal = (mode: 'create' | 'update', item?: any) => {
    setPhModalMode(mode);
    if (item) { setPhFormData({ ...item, id: item.id }); } 
    else { setPhFormData({ id: `PH${Date.now()}`, id_don_vi: selectedUnitId || '', ten_phong_hop: '', vi_tri: '', suc_chua: '', tb_trinh_chieu: '', tb_hop_online: false, bang_viet: false, but_viet: '', but_chi: '', tb_chuyen_slide: false, layout: '', ghi_chu: '' }); }
    setIsPhModalOpen(true);
  };

  const handlePhSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    try {
      const response = await apiService.save(phFormData, phModalMode, "dm_phong_hop");
      const savedId = response?.newId || response?.id || phFormData.id;
      const finalData = { ...phFormData, id: savedId } as PhongHop;
      if (phModalMode === 'create') { setPhongHopData(prev => [...prev, finalData]); } 
      else { setPhongHopData(prev => prev.map(item => item.id === savedId ? finalData : item)); }
      setIsPhModalOpen(false);
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu Phòng họp.'); } 
    finally { setSubmitting(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, formType: 'pn' | 'ph' | 'sec' | 'pvhc' | 'pccc' | 'atvsld' | 'pctt' = 'pn') => {
    const { name, value, type } = e.target;
    let finalValue: string | boolean = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    if (formType === 'pn') { setPnFormData(prev => ({ ...prev, [name]: finalValue })); } 
    else if (formType === 'ph') { setPhFormData(prev => ({ ...prev, [name]: finalValue })); } 
    else if (formType === 'sec') {
      if (name === 'chi_phi_thue') finalValue = value.replace(/\D/g, '');
      setSecurityFormData(prev => ({ ...prev, [name]: finalValue }));
    }
    else if (formType === 'pvhc') {
      if (name === 'chi_phi_thue') finalValue = value.replace(/\D/g, '');
      setPvhcFormData((prev: any) => ({ ...prev, [name]: finalValue }));
    }
    else if (formType === 'pccc') { 
      if (name.includes('sdt') || name.includes('std')) finalValue = formatPhoneNumber(value as string);
      setPcccFormData((prev: any) => ({ ...prev, [name]: finalValue })); 
    }
    else if (formType === 'atvsld') { setAtvsldFormData((prev: any) => ({ ...prev, [name]: finalValue })); }
    else if (formType === 'pctt') { setPcttFormData((prev: any) => ({ ...prev, [name]: finalValue })); }
  };

  const openSecurityModal = () => {
    if (currentAnNinh) { setSecurityFormData({ ...currentAnNinh, id: getSecId(currentAnNinh) }); } 
    else { setSecurityFormData({ id: `AN${Date.now()}`, id_don_vi: selectedUnitId || '', bv_noi_bo: '', bv_dich_vu: '', vi_tri_bv_dv: '', ncc_dich_vu: '', chi_phi_thue: '', ngay_ky_hd: '', han_hop_dong: '', tong_bv: '', dinh_bien_bv: '', ngay_co_dinh: '', ngay_tuan_tra: '', dem_co_dinh: '', dem_tuan_tra: '', bo_tri_nghi_ca: '', sl_camera: '', camera_hoat_dong: '', camera_hu: '', ly_do_camera_hu: '', thoi_gian_luu: '', vi_tri_he_thong_camera: '', vi_tri_gs_camera: '', link_pa_anbv: '', tinh_hinh_khu_vuc: '', tiep_giap_truoc: '', tiep_giap_sau: '', tiep_giap_trai: '', tiep_giap_phai: '' }); }
    setIsSecurityModalOpen(true);
  };

  const handleSecuritySave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    const soNB = Number(securityFormData.bv_noi_bo) || 0;
    const soDV = Number(securityFormData.bv_dich_vu) || 0;
    let finalData: any = { ...securityFormData, tong_bv: soNB + soDV };
    if (soDV < 1) { finalData.vi_tri_bv_dv = ''; finalData.ncc_dich_vu = ''; finalData.chi_phi_thue = ''; }
    
    const isCreate = !currentAnNinh;
    const mode = isCreate ? 'create' : 'update';
    if (isCreate && (!finalData.id || finalData.id === '')) finalData.id = `AN${Date.now()}`;

    try {
      await apiService.save(finalData, mode, "hs_an_ninh");
      if (mode === 'create') setAnNinhData(prev => [...prev, finalData as AnNinh]);
      else setAnNinhData(prev => prev.map(item => item.id === finalData.id ? (finalData as AnNinh) : item));
      setIsSecurityModalOpen(false);
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu An Ninh.'); } 
    finally { setSubmitting(false); }
  };

  const openPvhcModal = () => {
    if (currentPvhc) { setPvhcFormData({ ...currentPvhc, id: getPvhcId(currentPvhc) }); } 
    else { setPvhcFormData({ id: `HC${Date.now()}`, id_don_vi: selectedUnitId || '', dinh_bien: '', pvhc_khach_cho: '', pvhc_ve_sinh: '', hien_huu: '', pvhc_dich_vu: '', vi_tri: '', ncc_dich_vu: '', chi_phi_thue: '' }); }
    setIsPvhcModalOpen(true);
  };

  const handlePvhcSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    const khachCho = Number(pvhcFormData.pvhc_khach_cho) || 0;
    const veSinh = Number(pvhcFormData.pvhc_ve_sinh) || 0;
    const dichVu = Number(pvhcFormData.pvhc_dich_vu) || 0;
    let finalData: any = { ...pvhcFormData, hien_huu: khachCho + veSinh };
    if (dichVu < 1) { finalData.vi_tri = ''; finalData.ncc_dich_vu = ''; finalData.chi_phi_thue = ''; }
    
    const isCreate = !currentPvhc;
    const mode = isCreate ? 'create' : 'update';
    if (isCreate && (!finalData.id || finalData.id === '')) finalData.id = `HC${Date.now()}`;

    try {
      await apiService.save(finalData, mode, "hs_pvhc");
      if (mode === 'create') setPvhcData(prev => [...prev, finalData]);
      else setPvhcData(prev => prev.map(item => item.id === finalData.id ? finalData : item));
      setIsPvhcModalOpen(false);
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu Hậu cần.'); } 
    finally { setSubmitting(false); }
  };

  const openPcccModal = (mode: 'create' | 'update' | 'view') => {
    setModalMode(mode as any);
    if (currentPccc && mode !== 'create') { 
      setPcccFormData({ ...currentPccc, id: getPcccIdSafe(currentPccc) }); 
      setEquipmentList(tsPcccData.filter(eq => getUnitIdSafe(eq) === currentPccc.id_don_vi).map(e => ({...e}))); 
    } else { 
  setPcccFormData({ 
    id: `PC${Date.now()}`, id_don_vi: selectedUnitId || '', giay_phep_pccc: 'Nghiệm thu', bao_hiem_chay_no: 'Có', ngay_het_han_bh: '', 
        ho_ten_doi_truong: '', sdt_doi_truong: '', chuc_vu: '', tong_sl_thanh_vien: '', sl_huy_dong_ban_ngay: '', sl_huy_dong_ban_dem: '', 
        ngay_dien_tap: '', link_phuong_an_pccc: '', sdt_pccc: '114', sdt_ub: '', sdt_ca_pccc_catt: '', sdt_cax: '', 
        sdt_dien_luc: '', sdt_cap_thoat_nuoc: '', sdt_yte: '', ht_bao_chay_tu_dong: 'Có', ht_chua_chay_tu_dong_nuoc: 'Không', 
        ht_chua_chay_nuoc: 'Có', dung_cu_pccc: 'Có', khu_vuc_rui_ro_cao: '', loi_ton_tai_chua_khac_phuc: '', ghi_chu: ''
      }); 
      setEquipmentList([]);
    }
    setDeletedEqIds([]);
    setIsPcccModalOpen(true);
  };

  const addEquipmentRow = () => {
    const defaultGroup = getAvailableEquipmentGroups(pcccFormData)[0] || '';
    setEquipmentList([...equipmentList, { id: '', id_don_vi: '', nhom_he_thong: defaultGroup, loai_thiet_bi: '', so_luong: '', don_vi_tinh: 'Cái', vi_tri_bo_tri: '', ngay_bom_sac: '', ngay_het_han: '', tinh_trang: 'Hoạt động tốt' }]);
  };

  const handleEquipmentChange = (index: number, field: string, value: string) => {
    const newList = [...equipmentList]; newList[index][field] = value; setEquipmentList(newList);
  };

  const removeEquipmentRow = (index: number) => {
    const eq = equipmentList[index];
    if (eq.id) setDeletedEqIds([...deletedEqIds, eq.id]); 
    setEquipmentList(equipmentList.filter((_, i) => i !== index));
  };

  const handlePcccSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    let finalData = { ...pcccFormData };
    
    const isCreate = modalMode === 'create';
    if (isCreate && (!finalData.id || finalData.id === '')) finalData.id = `PC${Date.now()}`;

    try {
      await apiService.save(finalData, modalMode, "hs_pccc");
      
      for (const delId of deletedEqIds) { await apiService.delete(delId, "ts_pccc"); }
      if (equipmentList.length > 0) {
        const eqToSave = equipmentList.map((eq, i) => {
          const cleaned = { ...eq, id_don_vi: finalData.id_don_vi };
          if (!cleaned.id || cleaned.id === '') cleaned.id = `EQ${Date.now()}${i}`;
          return cleaned;
        });
        await apiService.save(eqToSave, 'update', 'ts_pccc'); 
      }
      setIsPcccModalOpen(false); loadData(); 
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu PCCC.'); } 
    finally { setSubmitting(false); }
  };

  const openAtvsldModal = () => {
    if (currentAtvsld) { setAtvsldFormData({ ...currentAtvsld, id: safeGet(currentAtvsld, 'id') }); } 
    else { setAtvsldFormData({ id: `AT${Date.now()}`, id_don_vi: selectedUnitId || '', nguoi_phu_trach: '', so_luong_mang_luoi: '', link_ho_so_quy_dinh: '', ngay_huan_luyen_gan_nhat: '', ty_le_hoan_thanh_hl: '100%', ngay_ksk: '', nngay_kham_bnn: '', so_luong_thiet_bi_nghiem_ngat: '', so_luong_thiet_bi_qua_han_kt: '0', ngay_quan_trac_mt: '', ty_le_cap_bhld: 'Đầy đủ', ngay_tu_kiem_tra: '', cac_loi_hien_truong: '', so_tai_nan_trong_nam: '0', link_bien_ban_kiem_tra: '', ghi_chu: '' }); }
    setIsAtvsldModalOpen(true);
  };

  const handleAtvsldSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    let finalData = { ...atvsldFormData };

    const isCreate = !currentAtvsld;
    const mode = isCreate ? 'create' : 'update';
    if (isCreate && (!finalData.id || finalData.id === '')) finalData.id = `AT${Date.now()}`;

    try {
      await apiService.save(finalData, mode, "hs_an_toan_lao_dong");
      if (mode === 'create') setAtvsldData(prev => [finalData, ...prev]);
      else setAtvsldData(prev => prev.map(item => item.id === finalData.id ? finalData : item));
      setIsAtvsldModalOpen(false);
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu ATVSLĐ.'); } 
    finally { setSubmitting(false); }
  };

  const openPcttModal = () => {
    if (currentPctt) { setPcttFormData({ ...currentPctt, id: safeGet(currentPctt, 'id') }); } 
    else { setPcttFormData({ id: '', id_don_vi: selectedUnitId || '', doi_truong_pctt: '', sl_nhan_su_doi: '', link_pa_pctt: '', vi_tri_di_doi: '', ngay_kiem_tra_pctt: '', tinh_trang_ha_tang: 'Đã hoàn thành', tinh_trang_bao_hiem: 'Đầy đủ', ngay_cap_nhat_tai_san: '', so_vu_thien_tai: '0', link_ho_so_boi_thuong: '', tinh_trang_khac_phuc: 'Không có sự cố', ghi_chu: '' }); }
    setIsPcttModalOpen(true);
  };

  const handlePcttSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    let finalData = { ...pcttFormData };

    const isCreate = !currentPctt;
    const mode = isCreate ? 'create' : 'update';
    if (isCreate && (!finalData.id || finalData.id === '')) finalData.id = `PT${Date.now()}`;

    try {
      await apiService.save(finalData, mode, "hs_pctt");
      if (mode === 'create') setPcttData(prev => [finalData, ...prev]);
      else setPcttData(prev => prev.map(item => item.id === finalData.id ? finalData : item));
      setIsPcttModalOpen(false);
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu PCTT.'); } 
    finally { setSubmitting(false); }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return; setSubmitting(true); setError(null);
    try {
      if (itemToDelete.type === 'donvi') {
        await apiService.delete(itemToDelete.id, "dm_don_vi");
        setData(prev => prev.filter(item => item.id !== itemToDelete.id));
        if (selectedUnitId === itemToDelete.id) setSelectedUnitId(null);
      } else if (itemToDelete.type === 'phapnhan') {
        await apiService.delete(itemToDelete.id, "dm_phap_nhan");
        setPhapNhanData(prev => prev.filter(item => item.id !== itemToDelete.id));
      } else if (itemToDelete.type === 'phonghop') {
        await apiService.delete(itemToDelete.id, "dm_phong_hop");
        setPhongHopData(prev => prev.filter(item => item.id !== itemToDelete.id));
      } else if (itemToDelete.type === 'pccc') {
        const pcccToDelete = pcccData.find(item => getPcccIdSafe(item) === itemToDelete.id);
        const relatedDonViId = pcccToDelete ? getUnitIdSafe(pcccToDelete) : null;
        await apiService.delete(itemToDelete.id, "hs_pccc");
        setPcccData(prev => prev.filter(item => getPcccIdSafe(item) !== itemToDelete.id));
        if (relatedDonViId) {
          const eqToDelete = tsPcccData.filter(eq => getUnitIdSafe(eq) === relatedDonViId);
          for (const eq of eqToDelete) {
            const eqId = getTsPcccIdSafe(eq);
            if (eqId) await apiService.delete(eqId, "ts_pccc");
          }
          setTsPcccData(prev => prev.filter(eq => getUnitIdSafe(eq) !== relatedDonViId));
        }
      } else if (itemToDelete.type === 'pctt') {
        await apiService.delete(itemToDelete.id, "hs_pctt");
        setPcttData(prev => prev.filter(item => safeGet(item, 'id') !== itemToDelete.id));
      }
      setIsConfirmOpen(false); setItemToDelete(null);
    } catch (err: any) { setError(err.message || 'Lỗi xóa dữ liệu.'); } 
    finally { setSubmitting(false); }
  };

  const renderUnitTree = (parent: DonVi, level: number = 1) => {
    const children = getChildUnits(parent.id);
    const isExpanded = expandedParents.includes(parent.id) || !!searchTerm;
    const isParentDimmed = parent.trang_thai === 'Đại lý' || parent.trang_thai === 'Đầu tư mới';

    return (
      <div key={parent.id} className={level === 1 ? "mb-1" : "mt-1"}>
        <button onClick={() => { setSelectedUnitId(parent.id); if (children.length > 0) toggleParent(parent.id); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedUnitId === parent.id ? 'bg-blue-50 text-[#05469B]' : 'text-gray-700 hover:bg-gray-50'} ${isParentDimmed ? 'opacity-50' : ''}`}>
          {children.length > 0 ? (isExpanded ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />) : <div className="w-4 shrink-0" />}
          <span className={`shrink-0 ${selectedUnitId === parent.id ? 'opacity-100' : 'opacity-70'}`}>{getUnitEmoji(parent.loai_hinh)}</span>
          <span className="truncate text-left">{parent.ten_don_vi}</span>
        </button>
        {isExpanded && children.length > 0 && (<div className={`ml-${level === 1 ? '6' : '4'} mt-1 border-l-2 border-gray-100 pl-2 space-y-1`}>{children.map(child => renderUnitTree(child, level + 1))}</div>)}
      </div>
    );
  };
  return (
    <div className="flex h-full bg-[#f4f7f9] overflow-hidden relative">
      {isListCollapsed && (
        <button onClick={() => setIsListCollapsed(false)} className="absolute top-6 left-6 z-20 bg-white p-2.5 rounded-lg shadow-md border border-gray-200 text-[#05469B] hover:bg-blue-50 transition-all" title="Mở danh sách đơn vị"><PanelLeftOpen size={20} /></button>
      )}

      {/* CỘT TRÁI BỘ LỌC */}
      <div className={`${isListCollapsed ? 'w-0 opacity-0 -ml-80 lg:ml-0' : 'w-80 opacity-100 absolute lg:relative inset-y-0 left-0'} transition-all duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col h-full shadow-2xl lg:shadow-sm z-50 lg:z-10 shrink-0 overflow-hidden`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[#05469B] flex items-center gap-2 whitespace-nowrap"><Building2 size={20} /> Công ty & Showroom</h2>
            <button onClick={() => setIsListCollapsed(true)} className="p-1.5 text-gray-400 hover:text-[#05469B] hover:bg-blue-50 rounded-md transition-colors"><PanelLeftClose size={18} /></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Tìm đơn vị, showroom..." className="w-full pl-9 pr-4 py-2 bg-[#FFFFF0] border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#05469B] outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-w-[319px]">
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

        <div className="p-4 border-t border-gray-100 bg-gray-50 min-w-[319px]">
          <button onClick={() => openModal('create')} className="w-full py-2.5 bg-white border border-dashed border-[#05469B] text-[#05469B] hover:bg-blue-50 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"><Plus size={18} /> THÊM ĐƠN VỊ</button>
        </div>
      </div>

      {/* CỘT PHẢI CHI TIẾT */}
      <div className="flex-1 overflow-y-auto p-6 relative transition-all duration-300 w-full">
        <div className={`max-w-6xl mx-auto space-y-8 pb-12 transition-all duration-300 ${isListCollapsed ? 'pl-10 lg:pl-12' : ''}`}>
          {error && <div className="mb-4 p-4 bg-red-50 text-red-700 flex gap-3 rounded-lg"><AlertCircle size={20} /> <p>{error}</p></div>}
          {!selectedUnit ? (
            <div className="h-[80vh] flex items-center justify-center text-gray-400 flex-col"><Building2 size={64} className="mb-4 opacity-20" /><p className="text-lg">Vui lòng chọn một Đơn vị ở danh sách bên trái</p></div>
          ) : (
            <div className="animate-in fade-in duration-300 space-y-8">
              
              <div className="flex flex-col md:flex-row justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-4">
                <div>
                  <h1 className="text-3xl font-black text-[#05469B] mb-3">{selectedUnit.ten_don_vi}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 font-medium">
                    <span className="flex items-center gap-1.5 group">
                      <MapPin size={16} className="text-red-500 shrink-0" /> 
                      {selectedUnit.dia_chi ? (
                        <a href={`http://maps.google.com/?q=$?q=${encodeURIComponent(selectedUnit.dia_chi)}`} target="_blank" rel="noreferrer" className="group-hover:text-blue-600 group-hover:underline transition-colors break-words" title="Xem trên Google Maps">{selectedUnit.dia_chi}</a>
                      ) : 'Chưa cập nhật địa chỉ'}
                    </span>
                    <span className="px-2.5 py-1 bg-gray-100 rounded-md text-xs border border-gray-200">ID: {selectedUnit.id}</span>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs border border-blue-100">{selectedUnit.loai_hinh}</span>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${isSelectedUnitDimmed ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>{selectedUnit.trang_thai || 'Hoạt động'}</span>
                    {selectedUnit.phia && <span className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md text-xs border border-gray-200">{selectedUnit.phia}</span>}
                    
                    {selectedUnit.loai_hinh === 'Showroom Quản trị' && selectedUnit.kinh_doanh && (
                      <>
                        <div className="w-px h-4 bg-gray-300 hidden sm:block mx-1"></div>
                        {selectedUnit.kinh_doanh.split(',').map((kd: string, idx: number) => {
                          const kdTrim = kd.trim();
                          if(!kdTrim) return null;
                          return (
                            <span key={idx} className="px-2 py-1 bg-[#00559B] text-white rounded text-[10px] font-black uppercase tracking-wider shadow-sm">
                              {kdTrim}
                            </span>
                          )
                        })}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 w-full md:w-auto justify-end">
                  <button onClick={() => openModal('update', selectedUnit)} className="px-4 py-2.5 text-sm font-bold text-[#05469B] bg-white border border-[#05469B] hover:bg-blue-50 rounded-lg flex items-center gap-2 shadow-sm"><Edit size={16} /> Cập nhật</button>
                  <button onClick={() => { setItemToDelete({id: selectedUnit.id, type: 'donvi'}); setIsConfirmOpen(true); }} className="p-2.5 text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg shadow-sm"><Trash2 size={20} /></button>
                </div>
              </div>

              <div className={`space-y-8 transition-all duration-300 ${isSelectedUnitDimmed ? 'opacity-40 pointer-events-none select-none grayscale-[30%]' : ''}`}>
                
                {/* A. LÃNH ĐẠO */}
                <section>
                  <h3 className="text-lg font-black text-[#05469B] mb-5 flex items-center gap-2 uppercase tracking-wider"><div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> A. THÔNG TIN LÃNH ĐẠO</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <PersonnelCard title="Giám đốc SR / Lãnh đạo" person={leader} roleDefault="Lãnh đạo" fieldKey="id_giam_doc" />
                    <PersonnelCard title="Phụ trách Kinh doanh xe" person={kdXe} roleDefault="PT KD Xe" fieldKey="id_ptkd_xe" />
                    <PersonnelCard title="Phụ trách Kinh doanh DVPT" person={kdDvpt} roleDefault="PT KD DVPT" fieldKey="id_ptkd_dvpt" />
                  </div>
                </section>

                {/* B. HỖ TRỢ & NHÂN SỰ */}
                <section>
                  <h3 className="text-lg font-black text-[#05469B] mb-5 flex items-center gap-2 uppercase tracking-wider"><div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> B. PHỤ TRÁCH DV HỖ TRỢ & PT NHÂN SỰ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <PersonnelCard title="Dịch vụ Hỗ trợ KD 1" person={dvht1} roleDefault="PT DVHT 1" fieldKey="id_pt_dvht1" />
                    <PersonnelCard title="Dịch vụ Hỗ trợ KD 2" person={dvht2} roleDefault="PT DVHT 2" fieldKey="id_pt_dvht2" />
                    <PersonnelCard title="Hành chính - Nhân sự" person={ptNhanSu} roleDefault="Hành chính NS" fieldKey="id_pt_nhan_su" />
                  </div>
                </section>
                
                {/* C. QUY MÔ MẠNG LƯỚI */}
                <section>
                  <h3 className="text-lg font-black text-[#05469B] mb-5 flex items-center gap-2 uppercase tracking-wider">
                    <div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> {isParentUnit ? 'C. QUY MÔ HỆ THỐNG TRỰC THUỘC' : 'C. THÔNG TIN CƠ SỞ VẬT CHẤT'}
                  </h3>
                  
                  {isParentUnit && branchStats && (
                    <div className="mb-6 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in">
                      <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2">
                        <Layers size={18} /> Sức mạnh Mạng lưới
                      </h4>
                      <div className="flex flex-col md:flex-row gap-4 items-stretch">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col justify-center items-center md:w-1/4 shrink-0">
                          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">Tổng Đơn vị</span>
                          <span className="text-4xl font-black text-[#05469B]">{branchStats.total}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 flex-1">
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:border-indigo-300 transition-colors">
                            <Store className="text-indigo-600 mb-1" size={24}/>
                            <span className="text-2xl font-black text-gray-800">{branchStats.srQt}</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase mt-1 line-clamp-1">SR Quản trị</span>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:border-emerald-300 transition-colors">
                            <Briefcase className="text-emerald-600 mb-1" size={24}/>
                            <span className="text-2xl font-black text-gray-800">{branchStats.sr}</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase mt-1">Showroom</span>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:border-amber-300 transition-colors">
                            <Warehouse className="text-amber-600 mb-1" size={24}/>
                            <span className="text-2xl font-black text-gray-800">{aggregatedStats?.xuongDvCount || 0}</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase mt-1">Xưởng Dịch vụ</span>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:border-orange-300 transition-colors">
                            <MapPin className="text-orange-600 mb-1" size={24}/>
                            <span className="text-2xl font-black text-gray-800">{branchStats.dkd}</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase mt-1 line-clamp-1">Điểm Kinh Doanh</span>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:border-gray-400 transition-colors">
                            <Warehouse className="text-gray-600 mb-1" size={24}/>
                            <span className="text-2xl font-black text-gray-800">{branchStats.kho}</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase mt-1">Kho Xe</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isParentUnit && aggregatedStats ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in">
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all relative overflow-hidden group flex items-center gap-4">
                        <Maximize2 className="absolute -right-4 -bottom-4 w-20 h-20 text-blue-500 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 z-10"><Maximize2 size={24} strokeWidth={2} /></div>
                        <div className="relative z-10 flex-1">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng diện tích mặt bằng</p>
                          <p className="text-2xl font-black text-gray-800">{formatCurrency(aggregatedStats.totalDienTich)} <span className="text-sm font-semibold text-gray-500">m²</span></p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all relative overflow-hidden group flex items-center gap-4">
                        <DoorOpen className="absolute -right-4 -bottom-4 w-20 h-20 text-cyan-500 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                        <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 z-10"><DoorOpen size={24} strokeWidth={2} /></div>
                        <div className="relative z-10 flex-1">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng số cổng an ninh</p>
                          <p className="text-2xl font-black text-gray-800">{formatCurrency(aggregatedStats.totalCong)} <span className="text-sm font-semibold text-gray-500">Cổng</span></p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all relative overflow-hidden group flex items-center gap-4">
                        <Coffee className="absolute -right-4 -bottom-4 w-20 h-20 text-orange-500 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                        <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 z-10"><Coffee size={24} strokeWidth={2} /></div>
                        <div className="relative z-10 flex-1">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng số phòng chờ</p>
                          <p className="text-2xl font-black text-gray-800">{formatCurrency(aggregatedStats.totalPhongCho)} <span className="text-sm font-semibold text-gray-500">Phòng</span></p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all relative overflow-hidden group flex items-center gap-4">
                        <UserCheck className="absolute -right-4 -bottom-4 w-20 h-20 text-emerald-500 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 z-10"><UserCheck size={24} strokeWidth={2} /></div>
                        <div className="relative z-10 flex-1">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng lượt khách trung bình</p>
                          <p className="text-2xl font-black text-gray-800">{formatCurrency(aggregatedStats.totalKhach)} <span className="text-sm font-semibold text-gray-500">/ ngày</span></p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-rose-200 transition-all relative overflow-hidden group flex items-center gap-4">
                        <Users className="absolute -right-4 -bottom-4 w-20 h-20 text-rose-500 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 z-10"><Users size={24} strokeWidth={2} /></div>
                        <div className="relative z-10 flex-1">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng nhân sự hệ thống</p>
                          <p className="text-2xl font-black text-gray-800">{formatCurrency(aggregatedStats.totalNhanSu)} <span className="text-sm font-semibold text-gray-500">Người</span></p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all relative overflow-hidden group flex items-center gap-4">
                        <Maximize2 className="absolute -right-4 -bottom-4 w-20 h-20 text-blue-500 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 z-10"><Maximize2 size={24} strokeWidth={2} /></div>
                        <div className="relative z-10 flex-1">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Diện tích sàn</p>
                          <p className="text-2xl font-black text-gray-800">{formatCurrency(selectedUnit.dien_tich || 0)} <span className="text-sm font-semibold text-gray-500">m²</span></p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all relative overflow-hidden group flex items-center gap-4">
                        <Layers className="absolute -right-4 -bottom-4 w-20 h-20 text-purple-500 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 z-10"><Layers size={24} strokeWidth={2} /></div>
                        <div className="relative z-10 flex-1">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Quy mô</p>
                          <p className="text-2xl font-black text-gray-800">{selectedUnit.so_ham || 0} <span className="text-sm font-semibold text-gray-500">Hầm</span> / {selectedUnit.so_tang || 0} <span className="text-sm font-semibold text-gray-500">Tầng</span></p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all relative overflow-hidden group flex items-center gap-4">
                        <DoorOpen className="absolute -right-4 -bottom-4 w-20 h-20 text-cyan-500 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                        <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 z-10"><DoorOpen size={24} strokeWidth={2} /></div>
                        <div className="relative z-10 flex-1">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Số cổng</p>
                          <p className="text-2xl font-black text-gray-800">{selectedUnit.so_cong || 0} <span className="text-sm font-semibold text-gray-500">Cổng</span></p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all relative overflow-hidden group flex items-center gap-4">
                        <Coffee className="absolute -right-4 -bottom-4 w-20 h-20 text-orange-500 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                        <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 z-10"><Coffee size={24} strokeWidth={2} /></div>
                        <div className="relative z-10 flex-1">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Số phòng chờ</p>
                          <p className="text-2xl font-black text-gray-800">{selectedUnit.so_phong_cho || 0} <span className="text-sm font-semibold text-gray-500">Phòng</span></p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all relative overflow-hidden group flex items-center gap-4">
                        <UserCheck className="absolute -right-4 -bottom-4 w-20 h-20 text-emerald-500 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 z-10"><UserCheck size={24} strokeWidth={2} /></div>
                        <div className="relative z-10 flex-1">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Khách TB ra vào</p>
                          <p className="text-2xl font-black text-gray-800">{formatCurrency(selectedUnit.luot_khach_bq || 0)} <span className="text-sm font-semibold text-gray-500">/ ngày</span></p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-rose-200 transition-all relative overflow-hidden group flex items-center gap-4">
                        <Users className="absolute -right-4 -bottom-4 w-20 h-20 text-rose-500 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 z-10"><Users size={24} strokeWidth={2} /></div>
                        <div className="relative z-10 flex-1">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nhân sự Đơn vị</p>
                          <p className="text-2xl font-black text-gray-800">{formatCurrency(selectedUnit.tong_nhan_su || 0)} <span className="text-sm font-semibold text-gray-500">Người</span></p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
                
                {/* 🟢 D. AN NINH & HỆ THỐNG CAMERA */}
                <section className="animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-black text-[#05469B] flex items-center gap-2 uppercase tracking-wider">
                      <div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> {isParentUnit ? 'D. TỔNG HỢP AN NINH TOÀN CỤM & CƠ SỞ' : 'D. AN NINH & HỆ THỐNG CAMERA'}
                    </h3>
                    <button onClick={openSecurityModal} className="px-4 py-2 text-sm font-bold text-[#05469B] bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-2 transition-colors border border-blue-100 shadow-sm">
                      {currentAnNinh ? <><Edit size={16} /> Cập nhật</> : <><Plus size={16} /> Cập nhật AN-BV & Camera Giám sát</>}
                    </button>
                  </div>

                  {isParentUnit && aggregatedSecurity && (
                    <div className="mb-6 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100 shadow-sm">
                      <h4 className="font-bold text-indigo-800 mb-4 flex items-center gap-2"><Layers size={18} /> Số liệu Tổng hợp Toàn Cụm</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                          <h5 className="font-bold text-[#05469B] mb-3 flex items-center gap-2 border-b border-gray-100 pb-2"><Shield size={16} /> Tổng lực lượng Bảo vệ</h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 text-center"><p className="text-[10px] font-bold text-blue-600 uppercase">Tổng ANBV</p><p className="text-lg font-black text-[#05469B]">{aggregatedSecurity.tongANBV}</p></div>
                            <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 text-center"><p className="text-[10px] font-bold text-emerald-600 uppercase">Nội bộ</p><p className="text-lg font-black text-emerald-700">{aggregatedSecurity.noiBo}</p></div>
                            <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 text-center"><p className="text-[10px] font-bold text-orange-600 uppercase">Dịch vụ ngoài</p><p className="text-lg font-black text-orange-700">{aggregatedSecurity.dichVu}</p></div>
                            <div className="bg-red-50 p-2 rounded-lg border border-red-100 text-center"><p className="text-[10px] font-bold text-red-600 uppercase">Phí thuê/tháng</p><p className="text-sm font-black text-red-700 mt-1">{formatCurrency(aggregatedSecurity.chiPhi)} đ</p></div>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                          <h5 className="font-bold text-[#05469B] mb-3 flex items-center gap-2 border-b border-gray-100 pb-2"><Camera size={16} /> Tổng hệ thống Camera Giám sát</h5>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 text-center"><p className="text-[10px] font-bold text-blue-600 uppercase">Tổng Camera</p><p className="text-lg font-black text-[#05469B]">{aggregatedSecurity.tongCam}</p></div>
                            <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 text-center"><p className="text-[10px] font-bold text-emerald-600 uppercase">Hoạt động</p><p className="text-lg font-black text-emerald-700">{aggregatedSecurity.camHD}</p></div>
                            <div className="bg-red-50 p-2 rounded-lg border border-red-100 text-center"><p className="text-[10px] font-bold text-red-600 uppercase">Đang hư hỏng</p><p className="text-lg font-black text-red-700">{aggregatedSecurity.camHu}</p></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isParentUnit && (() => {
                    const hasWarnings = expiringContracts.some(c => c.diffDays <= 30);
                    return (
                      <div className={`mb-6 p-5 rounded-2xl border shadow-sm animate-in fade-in ${expiringContracts.length === 0 ? 'bg-gray-50/50 border-gray-100' : hasWarnings ? 'bg-red-50/50 border-red-200' : 'bg-emerald-50/30 border-emerald-200'}`}>
                        {expiringContracts.length === 0 ? (
                          <>
                            <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><ShieldCheck size={18} /> Theo dõi Hợp đồng Dịch vụ Bảo vệ Toàn Cụm</h4>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 text-center flex flex-col items-center shadow-sm">
                              <CheckCircle2 size={32} className="text-gray-400 mb-2"/>
                              <p className="text-gray-500 font-medium text-sm">Chưa có dữ liệu Hợp đồng Dịch vụ Bảo vệ của các đơn vị trực thuộc.</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <h4 className={`font-bold mb-4 flex items-center gap-2 ${hasWarnings ? 'text-red-700' : 'text-emerald-800'}`}>
                              {hasWarnings ? <AlertTriangle size={20} className="animate-pulse" /> : <ShieldCheck size={20} />}
                              {hasWarnings ? 'Cảnh báo Hợp đồng BV Dịch vụ Sắp hết hạn' : 'Theo dõi Hợp đồng Dịch vụ Bảo vệ Toàn Cụm'}
                            </h4>
                            <div className={`overflow-x-auto bg-white rounded-xl border shadow-sm ${hasWarnings ? 'border-red-200' : 'border-emerald-200'}`}>
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className={`border-b text-xs font-bold uppercase tracking-wider ${hasWarnings ? 'bg-red-50 border-red-100 text-red-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'}`}>
                                    <th className="p-3">Đơn vị / Showroom</th>
                                    <th className="p-3">Nhà cung cấp BV</th>
                                    <th className="p-3 text-center">Ngày hết hạn</th>
                                    <th className="p-3 text-right">Tình trạng cảnh báo</th>
                                  </tr>
                                </thead>
                                <tbody className={`divide-y ${hasWarnings ? 'divide-red-50' : 'divide-emerald-50'}`}>
                                  {expiringContracts.map((contract, idx) => (
                                    <tr key={idx} className={`transition-colors ${hasWarnings ? 'hover:bg-red-50/50' : 'hover:bg-emerald-50/50'}`}>
                                      <td className="p-3 font-bold text-gray-800 text-sm">{contract.unitName}</td>
                                      <td className="p-3 font-semibold text-gray-600 text-sm uppercase">{contract.provider}</td>
                                      <td className="p-3 text-center font-bold text-gray-800 text-sm">{contract.endDate}</td>
                                      <td className="p-3 text-right">
                                        {contract.diffDays < 0 ? (
                                          <span className="inline-block px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-black border border-red-200 animate-pulse shadow-sm">Quá hạn {Math.abs(contract.diffDays)} ngày</span>
                                        ) : contract.diffDays === 0 ? (
                                          <span className="inline-block px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-black border border-red-200 animate-pulse shadow-sm">Hết hạn ngay hôm nay!</span>
                                        ) : contract.diffDays <= 30 ? (
                                          <span className="inline-block px-2.5 py-1 bg-orange-100 text-orange-700 rounded text-xs font-black border border-orange-200 shadow-sm">Chỉ còn {contract.diffDays} ngày</span>
                                        ) : (
                                          <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold border border-emerald-200 shadow-sm">An toàn ({contract.diffDays} ngày)</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}
                  
                  {currentAnNinh ? (
                    <div className="space-y-5 animate-in fade-in duration-300">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                          <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><Users size={18} /> Lực lượng BV, ĐTKH</h4>
                          <div className="space-y-3 text-sm flex-1">
                             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0"><span className="text-gray-500 font-medium whitespace-nowrap shrink-0">Tổng ANBV / Định biên:</span><span className="font-black text-[#05469B] sm:text-right">{currentAnNinh.tong_bv || 0} / {currentAnNinh.dinh_bien_bv || 0}</span></div>
                             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0"><span className="text-gray-500 font-medium whitespace-nowrap shrink-0">Bảo vệ Nội bộ:</span><span className="font-bold text-gray-800 sm:text-right">{currentAnNinh.bv_noi_bo || 0} người</span></div>
                             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0"><span className="text-gray-500 font-medium whitespace-nowrap shrink-0">Bảo vệ Dịch vụ:</span><span className="font-bold text-gray-800 sm:text-right">{currentAnNinh.bv_dich_vu || 0} người</span></div>
                             {Number(currentAnNinh.bv_dich_vu) >= 1 && (
                                <div className="pt-3 mt-2 border-t border-gray-100 space-y-2.5">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-0">
                                      <span className="text-gray-500 font-medium whitespace-nowrap shrink-0">Vị trí BV Dịch vụ:</span>
                                      <span className="font-bold text-gray-800 sm:text-right break-words">{currentAnNinh.vi_tri_bv_dv || '---'}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-0">
                                      <span className="text-gray-500 font-medium whitespace-nowrap shrink-0">Nhà cung cấp:</span>
                                      <span className="font-bold text-gray-800 sm:text-right uppercase break-words">{currentAnNinh.ncc_dich_vu || '---'}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                                      <span className="text-gray-500 font-medium whitespace-nowrap shrink-0">Chi phí thuê:</span>
                                      <span className="font-black text-red-600 sm:text-right">{formatCurrency(currentAnNinh.chi_phi_thue) || '0'} VNĐ/tháng</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-0">
                                      <span className="text-gray-500 font-medium whitespace-nowrap shrink-0 mt-0.5">Thời hạn HĐ:</span>
                                      <div className="flex flex-col items-start sm:items-end">
                                        <span className="font-bold text-gray-800">{currentAnNinh.han_hop_dong ? `${currentAnNinh.han_hop_dong} tháng` : '---'} {currentAnNinh.ngay_ky_hd ? `(từ ${new Date(currentAnNinh.ngay_ky_hd).toLocaleDateString('vi-VN')})` : ''}</span>
                                        {renderContractWarning(currentAnNinh.ngay_ky_hd, currentAnNinh.han_hop_dong)}
                                      </div>
                                    </div>
                                </div>
                             )}
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-100">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100 flex flex-col justify-center">
                                   <p className="text-[10px] font-bold text-amber-800 mb-1 flex items-center gap-1"><Sun size={12}/> CA NGÀY</p>
                                   <div className="text-xs text-gray-600 flex justify-between mb-0.5"><span className="whitespace-nowrap shrink-0">Cố định:</span> <b>{currentAnNinh.ngay_co_dinh || 0} người</b></div>
                                   <div className="text-xs text-gray-600 flex justify-between"><span className="whitespace-nowrap shrink-0">Tuần tra:</span> <b>{currentAnNinh.ngay_tuan_tra || 0} người</b></div>
                                </div>
                                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 flex flex-col justify-center">
                                   <p className="text-[10px] font-bold text-indigo-800 mb-1 flex items-center gap-1"><Moon size={12}/> CA ĐÊM</p>
                                   <div className="text-xs text-gray-600 flex justify-between mb-0.5"><span className="whitespace-nowrap shrink-0">Cố định:</span> <b>{currentAnNinh.dem_co_dinh || 0} người</b></div>
                                   <div className="text-xs text-gray-600 flex justify-between"><span className="whitespace-nowrap shrink-0">Tuần tra:</span> <b>{currentAnNinh.dem_tuan_tra || 0} người</b></div>
                                </div>
                             </div>
                             <div className="mt-4">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 bg-gradient-to-r from-amber-50 to-indigo-50 px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                                   <div className="flex items-center gap-1.5 shrink-0"><Clock size={14} className="text-[#05469B]"/><span className="text-[#05469B] font-bold text-xs whitespace-nowrap">Bố trí nghỉ ca / Đổi ca:</span></div>
                                   <span className="font-black text-[#05469B] text-xs flex-1 text-left sm:text-right whitespace-pre-wrap break-words">{currentAnNinh.bo_tri_nghi_ca ? `${currentAnNinh.bo_tri_nghi_ca} người` : '---'}</span>
                                </div>
                             </div>
                          </div>
                        </div>
                        <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 shadow-sm flex flex-col h-full">
                           <h4 className="font-bold text-emerald-700 mb-4 flex items-center gap-2 border-b border-emerald-200 pb-2"><Compass size={18} /> Đặc điểm Địa bàn & Phương án</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 flex-1">
                              <div className="bg-white p-3 rounded-lg border border-emerald-100/50 shadow-sm">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tiếp giáp Trước</p>
                                <p className="text-sm font-semibold text-gray-700 line-clamp-2" title={currentAnNinh.tiep_giap_truoc}>{currentAnNinh.tiep_giap_truoc || '---'}</p>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-emerald-100/50 shadow-sm">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tiếp giáp Sau</p>
                                <p className="text-sm font-semibold text-gray-700 line-clamp-2" title={currentAnNinh.tiep_giap_sau}>{currentAnNinh.tiep_giap_sau || '---'}</p>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-emerald-100/50 shadow-sm">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tiếp giáp Trái</p>
                                <p className="text-sm font-semibold text-gray-700 line-clamp-2" title={currentAnNinh.tiep_giap_trai}>{currentAnNinh.tiep_giap_trai || '---'}</p>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-emerald-100/50 shadow-sm">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tiếp giáp Phải</p>
                                <p className="text-sm font-semibold text-gray-700 line-clamp-2" title={currentAnNinh.tiep_giap_phai}>{currentAnNinh.tiep_giap_phai || '---'}</p>
                              </div>
                           </div>
                           <div className="pt-4 border-t border-emerald-200/50">
                              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Đánh giá Tình hình ANTT Khu vực</p>
                              <div className="bg-white text-emerald-800 p-3 rounded-lg border border-emerald-100 shadow-sm text-sm font-medium whitespace-pre-wrap mb-4">
                                {currentAnNinh.tinh_hinh_khu_vuc || 'Chưa cập nhật tình hình...'}
                              </div>
                              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Phương án ANBV</p>
                              {currentAnNinh.link_pa_anbv ? (
                                <a href={currentAnNinh.link_pa_anbv} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full p-3 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-bold transition-colors shadow-sm">
                                  <LinkIcon size={16}/> Xem File Đính Kèm
                                </a>
                              ) : (
                                <div className="flex items-center justify-center gap-2 w-full p-3 bg-white text-gray-400 border border-dashed border-gray-200 rounded-lg text-sm font-medium">
                                  Chưa cập nhật file
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col w-full">
                          <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><Camera size={18} /> Hệ thống Camera Giám sát</h4>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-center flex flex-col justify-center">
                              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Tổng số Camera</p>
                              <p className="text-xl font-black text-[#05469B]">{currentAnNinh.sl_camera || 0} <span className="text-sm font-semibold text-gray-500">Mắt</span></p>
                            </div>
                            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center flex flex-col justify-center">
                              <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Đang hoạt động</p>
                              <p className="text-xl font-black text-emerald-700">{currentAnNinh.camera_hoat_dong || 0} <span className="text-sm font-semibold text-emerald-600/70">Mắt</span></p>
                            </div>
                            <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center flex flex-col justify-center">
                              <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Đang hư hỏng</p>
                              <p className="text-xl font-black text-red-700">{currentAnNinh.camera_hu || 0} <span className="text-sm font-semibold text-red-600/70">Mắt</span></p>
                            </div>
                            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-center flex flex-col justify-center">
                              <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Thời gian lưu hình</p>
                              <p className="text-xl font-black text-indigo-700">{currentAnNinh.thoi_gian_luu || '---'} <span className="text-sm font-semibold text-indigo-600/70">Ngày</span></p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col">
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">Vị trí đặt hệ thống (Đầu ghi)</span>
                              <span className="font-bold text-blue-900 text-sm whitespace-pre-wrap break-words">{currentAnNinh.vi_tri_he_thong_camera || '---'}</span>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col">
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Vị trí giám sát chính</span>
                              <span className="font-bold text-emerald-900 text-sm whitespace-pre-wrap break-words">{currentAnNinh.vi_tri_gs_camera || '---'}</span>
                            </div>
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col">
                              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2">Lý do hư hỏng</span>
                              {Number(currentAnNinh.camera_hu) > 0 ? (
                                <span className="font-bold text-red-900 text-sm whitespace-pre-wrap break-words">{currentAnNinh.ly_do_camera_hu || '---'}</span>
                              ) : (
                                <span className="font-medium text-red-400 italic text-sm">Hệ thống hoạt động tốt</span>
                              )}
                            </div>
                          </div>
                      </div>
                    </div>
                  ) : (
                    !isParentUnit && (
                      <div onClick={openSecurityModal} className="bg-white hover:bg-indigo-50/50 cursor-pointer p-10 rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-300 text-center transition-all group shadow-sm">
                        <Shield size={48} className="mx-auto text-gray-300 group-hover:text-indigo-400 mb-4 transition-colors" />
                        <h4 className="text-lg font-bold text-gray-700 group-hover:text-indigo-700 mb-1">Khai báo Hồ sơ An Ninh & Camera</h4>
                        <p className="text-sm text-gray-400">Click vào đây để khai báo dữ liệu bảo vệ, phân ca trực và khu vực tiếp giáp.</p>
                      </div>
                    )
                  )}
                </section>
                
                {/* 🟢 F. PHÒNG CHỐNG CHÁY NỔ */}
                <section className="animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-black text-[#05469B] flex items-center gap-2 uppercase tracking-wider">
                      <div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> {isParentUnit ? 'F. TỔNG HỢP PCCC TOÀN CỤM & CƠ SỞ' : 'F. PHÒNG CHỐNG CHÁY NỔ'}
                    </h3>
                    <button onClick={() => openPcccModal(currentPccc ? 'update' : 'create')} className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-2 transition-colors border border-red-100 shadow-sm">
                      {currentPccc ? <><Edit size={16} /> Cập nhật</> : <><Plus size={16} /> Khai báo PCCN</>}
                    </button>
                  </div>

                  {isParentUnit && (() => {
                    const childPCCCs = pcccData.filter(p => selectedUnitSubordinates.includes(getUnitIdSafe(p)));
                    const totalPCCC = childPCCCs.length;
                    
                    let hoSoLoi = 0;
                    childPCCCs.forEach(p => {
                      let hasError = false;
                      if (p.giay_phep_pccc === 'Chưa có' || p.bao_hiem_chay_no === 'Không') hasError = true;
                      
                      const eqOfUnit = tsPcccData.filter(eq => getUnitIdSafe(eq) === getUnitIdSafe(p));
                      eqOfUnit.forEach(eq => {
                        if (getStatusColor(safeGet(eq, 'ngay_het_han'), 'TB').isDanger) hasError = true;
                      });

                      if (hasError) hoSoLoi++;
                    });

                    const hoSoChuan = totalPCCC - hoSoLoi;

                    return (
                      <div className="mb-6 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100 shadow-sm">
                        <h4 className="font-bold text-indigo-800 mb-4 flex items-center gap-2"><Layers size={18} /> Số liệu Tổng hợp Toàn Cụm</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 animate-in fade-in">
                          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div><p className="text-[10px] font-bold text-red-600 uppercase mb-1">Cơ sở đã khai báo</p><p className="text-2xl font-black text-red-700">{totalPCCC}</p></div>
                            <Flame size={32} className="text-red-200"/>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div><p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Tốt / Nghiệm thu</p><p className="text-2xl font-black text-emerald-700">{hoSoChuan}</p></div>
                            <Shield size={32} className="text-emerald-200"/>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div><p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Bị Lỗi / Có tồn tại</p><p className="text-2xl font-black text-orange-700">{hoSoLoi}</p></div>
                            <AlertCircle size={32} className="text-orange-200"/>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {currentPccc ? (() => {
                    const bhStatus = getStatusColor(safeGet(currentPccc, 'ngay_het_han_bh'), 'BH');
                    const eqOfUnit = tsPcccData.filter(eq => safeGet(eq, 'id_don_vi') === selectedUnitId);
                    let totalEq = 0;
                    let warningCount = 0;
                    eqOfUnit.forEach(eq => {
                      const sl = Number(safeGet(eq, 'so_luong')) || 1;
                      totalEq += sl;
                      if (getStatusColor(safeGet(eq, 'ngay_het_han'), 'TB').isDanger) warningCount += sl;
                    });

                    return (
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm animate-in fade-in">
                       <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><Flame size={18} /> Thông tin Phòng cháy chữa cháy</h4>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                         <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex flex-col justify-center">
                           <span className="text-[10px] font-bold text-blue-600 uppercase">Tình trạng Pháp lý</span>
                           <span className={`text-sm font-bold mt-1 ${currentPccc.giay_phep_pccc === 'Nghiệm thu' ? 'text-emerald-600' : currentPccc.giay_phep_pccc === 'Đã phê duyệt' ? 'text-blue-700' : 'text-red-600'}`}>{currentPccc.giay_phep_pccc || '---'}</span>
                         </div>
                         <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex flex-col justify-center">
                           <span className="text-[10px] font-bold text-emerald-600 uppercase">Đội PCCC Cơ sở</span>
                           <span className="text-sm font-bold text-emerald-800 mt-1">{currentPccc.tong_sl_thanh_vien || 0} Thành viên</span>
                         </div>
                         <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex flex-col justify-center">
                           <span className="text-[10px] font-bold text-indigo-600 uppercase">Tổng Thiết bị / Bình</span>
                           <span className="text-sm font-bold text-indigo-800 mt-1">{totalEq}</span>
                         </div>
                         <div className={`${warningCount > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'} border rounded-lg p-3 flex flex-col justify-center`}>
                           <span className={`text-[10px] font-bold uppercase ${warningCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Cảnh báo Hạn sạc</span>
                           <span className={`text-sm font-bold mt-1 ${warningCount > 0 ? 'text-red-700 animate-pulse' : 'text-emerald-700'}`}>{warningCount > 0 ? `${warningCount} thiết bị quá hạn!` : 'Hoạt động tốt'}</span>
                         </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="space-y-3 md:col-span-1">
                           <h4 className="font-bold text-red-700 border-b border-gray-100 pb-2 text-sm flex items-center gap-1.5"><FileText size={16}/> Pháp lý & Hồ sơ</h4>
                           <div className="flex justify-between text-sm"><span className="text-gray-500">Bảo hiểm Cháy nổ:</span><span className={`font-bold ${currentPccc.bao_hiem_chay_no === 'Có' ? 'text-emerald-600' : 'text-red-600'}`}>{currentPccc.bao_hiem_chay_no || '---'}</span></div>
                           {currentPccc.bao_hiem_chay_no === 'Có' && <div className="flex justify-between text-sm"><span className="text-gray-500">Hạn Bảo hiểm:</span><span className={`px-1.5 py-0.5 rounded border ${bhStatus.color}`}>{bhStatus.text}</span></div>}
                           {currentPccc.link_phuong_an_pccc && (<div className="pt-2 border-t border-gray-50"><a href={currentPccc.link_phuong_an_pccc} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#05469B] hover:text-blue-700 hover:underline font-bold mt-1"><LinkIcon size={10}/> File Phương án CC</a></div>)}
                         </div>
                         
                         <div className="space-y-3 md:col-span-1 border-l border-gray-100 pl-6">
                           <h4 className="font-bold text-emerald-700 border-b border-gray-100 pb-2 text-sm flex items-center gap-1.5"><Users size={16}/> Đội PCCC & Liên hệ</h4>
                           <div className="flex justify-between text-sm"><span className="text-gray-500">Đội trưởng:</span><span className="font-bold text-[#05469B] text-right">{currentPccc.ho_ten_doi_truong || '---'}</span></div>
                           <div className="flex justify-between text-sm items-center"><span className="text-gray-500">SĐT Đội trưởng:</span>{currentPccc.sdt_doi_truong ? <a href={`tel:${String(currentPccc.sdt_doi_truong).replace(/[^\d+]/g, '')}`} className="font-bold text-[#05469B] hover:text-blue-700 flex items-center gap-1.5 transition-colors"><PhoneCall size={12}/> {formatPhoneNumber(currentPccc.sdt_doi_truong)}</a> : <span className="font-bold text-gray-800">---</span>}</div>
                           <div className="pt-2 border-t border-gray-50">
                             <button onClick={() => setIsEmergencyContactOpen(true)} className="flex items-center gap-1.5 text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded border border-orange-200 font-bold transition-colors w-full justify-center text-sm shadow-sm">
                               <Siren size={14} /> Mở Danh bạ Khẩn cấp
                             </button>
                           </div>
                         </div>

                         <div className="space-y-2.5 md:col-span-1 border-l border-gray-100 pl-6">
                           <h4 className="font-bold text-orange-600 border-b border-gray-100 pb-2 text-sm flex items-center gap-1.5"><Layers size={16}/> Các hệ thống PCCC</h4>
                           {PCCC_SYSTEMS.map(sys => {
                             let sysCount = 0;
                             eqOfUnit.forEach(eq => {
                               if (safeGet(eq, 'nhom_he_thong') === sys.label) sysCount += (Number(safeGet(eq, 'so_luong')) || 1);
                             });
                             const isChecked = safeGet(currentPccc, sys.key) === 'Có' || (sys.key === 'dung_cu_pccc' && !safeGet(currentPccc, 'dung_cu_pccc'));
                             return (
                               <div key={sys.key} className="flex items-center justify-between text-sm">
                                 <span className="text-gray-600 font-medium flex items-center gap-1.5"><sys.Icon size={12} className={sys.color}/> {sys.label}</span>
                                 {isChecked ? <span className="font-bold text-emerald-600">Có {sysCount > 0 ? `(${sysCount})` : ''}</span> : <span className="text-gray-400">Không</span>}
                               </div>
                             )
                           })}
                         </div>
                       </div>
                    </div>
                  );
                  })() : (
                    <div onClick={() => openPcccModal('create')} className="bg-white hover:bg-red-50/50 cursor-pointer p-10 rounded-2xl border-2 border-dashed border-gray-300 hover:border-red-300 text-center transition-all group shadow-sm">
                      <Flame size={48} className="mx-auto text-gray-300 group-hover:text-red-400 mb-4 transition-colors" />
                      <h4 className="text-lg font-bold text-gray-700 group-hover:text-red-700 mb-1">Khai báo Hồ sơ PCCC</h4>
                      <p className="text-sm text-gray-400">Click vào đây để khai báo hệ thống và tình trạng an toàn PCCC.</p>
                    </div>
                  )}
                </section>

                {/* 🟢 G. AN TOÀN VỆ SINH LAO ĐỘNG */}
                <section className="animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-black text-[#05469B] flex items-center gap-2 uppercase tracking-wider">
                      <div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> {isParentUnit ? 'G. TỔNG HỢP ATVSLĐ TOÀN CỤM & CƠ SỞ' : 'G. AN TOÀN VỆ SINH LAO ĐỘNG'}
                    </h3>
                    <button onClick={openAtvsldModal} className="px-4 py-2 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-2 transition-colors border border-emerald-100 shadow-sm">
                      {currentAtvsld ? <><Edit size={16} /> Cập nhật</> : <><Plus size={16} /> Khai báo ATVSLĐ</>}
                    </button>
                  </div>

                  {isParentUnit && (() => {
                    const childData = atvsldData.filter(p => selectedUnitSubordinates.includes(getUnitIdSafe(p)));
                    const totalThietBi = childData.reduce((sum, item) => sum + (Number(item.so_luong_thiet_bi_nghiem_ngat) || 0), 0);
                    const totalLoi = childData.reduce((sum, item) => sum + (Number(item.so_luong_thiet_bi_qua_han_kt) || 0), 0);
                    const totalTaiNan = childData.reduce((sum, item) => sum + (Number(item.so_tai_nan_trong_nam) || 0), 0);
                    return (
                      <div className="mb-6 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100 shadow-sm">
                        <h4 className="font-bold text-indigo-800 mb-4 flex items-center gap-2"><Layers size={18} /> Số liệu Tổng hợp Toàn Cụm</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 animate-in fade-in">
                          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div><p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Cơ sở đã khai báo</p><p className="text-2xl font-black text-emerald-700">{childData.length}</p></div>
                            <HardHat size={32} className="text-emerald-200"/>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div><p className="text-[10px] font-bold text-red-600 uppercase mb-1">Thiết bị Quá hạn/Nguy hiểm</p><p className="text-2xl font-black text-red-700">{totalThietBi} / {totalLoi}</p></div>
                            <AlertCircle size={32} className={totalLoi > 0 ? 'text-red-400' : 'text-gray-300'}/>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div><p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Số sự cố / Tai nạn</p><p className="text-2xl font-black text-orange-700">{totalTaiNan}</p></div>
                            <ShieldAlert size={32} className={totalTaiNan > 0 ? 'text-orange-400' : 'text-gray-300'}/>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {currentAtvsld ? (
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm animate-in fade-in">
                       <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><HardHat size={18} /> Thông tin ATVSLĐ</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h4 className="font-bold text-emerald-700 border-b border-gray-100 pb-2 text-sm flex items-center gap-1.5"><Users size={16}/> Tổ chức & Huấn luyện</h4>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Phụ trách ATVSLĐ:</span><span className="font-bold text-[#05469B] text-right">{currentAtvsld.nguoi_phu_trach || '---'}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Mạng lưới ATVS Viên:</span><span className="font-bold text-gray-800">{currentAtvsld.so_luong_mang_luoi || 0} Người</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Khám SK / Bệnh Nghề nghiệp:</span><span className="font-bold text-gray-800">{formatToVN(currentAtvsld.ngay_ksk) || '---'} / {formatToVN(currentAtvsld.nngay_kham_bnn) || '---'}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Huấn luyện ATVSLĐ:</span><span className="font-bold text-emerald-600">{currentAtvsld.ty_le_hoan_thanh_hl || '0%'} (Gần nhất: {formatToVN(currentAtvsld.ngay_huan_luyen_gan_nhat) || '---'})</span></div>
                            <div className="flex justify-between text-sm pt-2 border-t border-gray-50"><span className="text-gray-500">Cấp phát BHLĐ:</span><span className={`font-bold ${currentAtvsld.ty_le_cap_bhld === 'Đầy đủ' ? 'text-emerald-600' : 'text-orange-600'}`}>{currentAtvsld.ty_le_cap_bhld}</span></div>
                          </div>
                          <div className="space-y-3 border-l border-gray-100 pl-6">
                            <h4 className="font-bold text-red-600 border-b border-gray-100 pb-2 text-sm flex items-center gap-1.5"><AlertCircle size={16}/> Máy móc, Môi trường & Hiện trường</h4>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Đo kiểm Môi trường:</span><span className="font-semibold text-gray-800 text-right">{formatToVN(currentAtvsld.ngay_quan_trac_mt) || 'Chưa đo'}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Thiết bị Nghiêm ngặt (Tổng/Quá hạn):</span><span className={`font-black ${Number(currentAtvsld.so_luong_thiet_bi_qua_han_kt) > 0 ? 'text-red-600 animate-pulse' : 'text-emerald-600'}`}>{currentAtvsld.so_luong_thiet_bi_nghiem_ngat || 0} / {currentAtvsld.so_luong_thiet_bi_qua_han_kt || 0}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Số vụ Tai nạn (Năm):</span><span className={`font-bold ${Number(currentAtvsld.so_tai_nan_trong_nam) > 0 ? 'text-orange-600' : 'text-gray-800'}`}>{currentAtvsld.so_tai_nan_trong_nam || 0} Vụ</span></div>
                            <div className="mt-2 pt-2 border-t border-gray-50">
                              <span className="text-gray-500 text-sm block mb-1">Tuần tra & Lỗi hiện trường:</span>
                              {currentAtvsld.cac_loi_hien_truong ? (
                                <div className="bg-red-50 text-red-700 p-2 rounded text-xs font-semibold border border-red-100">{currentAtvsld.cac_loi_hien_truong}</div>
                              ) : (
                                <div className="bg-emerald-50 text-emerald-600 p-2 rounded text-xs font-semibold border border-emerald-100">Không có lỗi / Đã xử lý (Kiểm tra: {formatToVN(currentAtvsld.ngay_tu_kiem_tra) || '---'})</div>
                              )}
                            </div>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div onClick={openAtvsldModal} className="bg-white hover:bg-emerald-50/50 cursor-pointer p-10 rounded-2xl border-2 border-dashed border-gray-300 hover:border-emerald-300 text-center transition-all group shadow-sm">
                      <HardHat size={48} className="mx-auto text-gray-300 group-hover:text-emerald-400 mb-4 transition-colors" />
                      <h4 className="text-lg font-bold text-gray-700 group-hover:text-emerald-700 mb-1">Khai báo Hồ sơ ATVSLĐ</h4>
                      <p className="text-sm text-gray-400">Khai báo thiết bị kiểm định, môi trường, huấn luyện an toàn & sức khỏe.</p>
                    </div>
                  )}
                </section>

                {/* 🟢 H. PHÒNG CHỐNG THIÊN TAI */}
                <section className="animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-black text-[#05469B] flex items-center gap-2 uppercase tracking-wider">
                      <div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> {isParentUnit ? 'H. TỔNG HỢP PCTT TOÀN CỤM & CƠ SỞ' : 'H. PHÒNG CHỐNG THIÊN TAI'}
                    </h3>
                    <button onClick={openPcttModal} className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-2 transition-colors border border-blue-100 shadow-sm">
                      {currentPctt ? <><Edit size={16} /> Cập nhật</> : <><Plus size={16} /> Khai báo PCTT</>}
                    </button>
                  </div>

                  {isParentUnit && (() => {
                    const childData = pcttData.filter(p => selectedUnitSubordinates.includes(getUnitIdSafe(p)));
                    const thieuBaoHiem = childData.filter(item => item.tinh_trang_bao_hiem !== 'Đầy đủ').length;
                    const tongThienTai = childData.reduce((sum, item) => sum + (Number(item.so_vu_thien_tai) || 0), 0);
                    return (
                      <div className="mb-6 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100 shadow-sm">
                        <h4 className="font-bold text-indigo-800 mb-4 flex items-center gap-2"><Layers size={18} /> Số liệu Tổng hợp Toàn Cụm</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 animate-in fade-in">
                          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div><p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Cơ sở đã khai báo</p><p className="text-2xl font-black text-blue-700">{childData.length}</p></div>
                            <CloudLightning size={32} className="text-blue-200"/>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div><p className={`text-[10px] font-bold uppercase mb-1 ${thieuBaoHiem > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Thiếu Bảo Hiểm TS</p><p className={`text-2xl font-black ${thieuBaoHiem > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{thieuBaoHiem} CS</p></div>
                            <Briefcase size={32} className={thieuBaoHiem > 0 ? 'text-red-200' : 'text-emerald-200'}/>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div><p className={`text-[10px] font-bold uppercase mb-1 ${tongThienTai > 0 ? 'text-orange-600' : 'text-gray-500'}`}>Sự cố / Thiên tai</p><p className={`text-2xl font-black ${tongThienTai > 0 ? 'text-orange-700' : 'text-gray-600'}`}>{tongThienTai}</p></div>
                            <AlertCircle size={32} className={tongThienTai > 0 ? 'text-orange-200' : 'text-gray-200'}/>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {currentPctt ? (
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm animate-in fade-in">
                       <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><CloudLightning size={18} /> Thông tin Phòng chống thiên tai</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h4 className="font-bold text-blue-700 border-b border-gray-100 pb-2 text-sm flex items-center gap-1.5"><Users size={16}/> Tổ chức & Phương án</h4>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Đội trưởng PCTT:</span><span className="font-bold text-[#05469B] text-right">{currentPctt.doi_truong_pctt || '---'}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Lực lượng ứng phó:</span><span className="font-bold text-gray-800">{currentPctt.sl_nhan_su_doi || 0} Người</span></div>
                            <div className="flex flex-col text-sm mt-1 pt-1"><span className="text-gray-500 mb-1">Vị trí di dời xe & tài sản an toàn:</span><span className="font-semibold text-gray-800 bg-gray-50 p-2 rounded border border-gray-100">{currentPctt.vi_tri_di_doi || 'Chưa xác định'}</span></div>
                            <div className="flex justify-between text-sm pt-2 border-t border-gray-50"><span className="text-gray-500">Ngày kiểm tra hạ tầng:</span><span className="font-bold text-gray-800">{formatToVN(currentPctt.ngay_kiem_tra_pctt) || '---'} ({currentPctt.tinh_trang_ha_tang})</span></div>
                          </div>
                          <div className="space-y-3 border-l border-gray-100 pl-6">
                            <h4 className="font-bold text-orange-600 border-b border-gray-100 pb-2 text-sm flex items-center gap-1.5"><ShieldAlert size={16}/> Bảo hiểm & Xử lý sự cố</h4>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Bảo hiểm rủi ro TS:</span><span className={`font-black ${currentPctt.tinh_trang_bao_hiem !== 'Đầy đủ' ? 'text-red-600 animate-pulse' : 'text-emerald-600'}`}>{currentPctt.tinh_trang_bao_hiem || '---'}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Chốt tồn kho / Kế toán:</span><span className="font-semibold text-gray-800 text-right">{formatToVN(currentPctt.ngay_cap_nhat_tai_san) || '---'}</span></div>
                            <div className="flex justify-between text-sm pt-2 border-t border-gray-50"><span className="text-gray-500">Thiên tai (Năm nay):</span><span className={`font-bold ${Number(currentPctt.so_vu_thien_tai) > 0 ? 'text-orange-600' : 'text-gray-800'}`}>{currentPctt.so_vu_thien_tai || 0} Vụ</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Tình trạng khắc phục:</span><span className="font-semibold text-gray-800 text-right">{currentPctt.tinh_trang_khac_phuc || '---'}</span></div>
                            {currentPctt.link_ho_so_boi_thuong && (
                              <div className="mt-2"><a href={currentPctt.link_ho_so_boi_thuong} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-100"><LinkIcon size={14}/> Hồ sơ bồi thường</a></div>
                            )}
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div onClick={openPcttModal} className="bg-white hover:bg-blue-50/50 cursor-pointer p-10 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-300 text-center transition-all group shadow-sm">
                      <CloudLightning size={48} className="mx-auto text-gray-300 group-hover:text-blue-400 mb-4 transition-colors" />
                      <h4 className="text-lg font-bold text-gray-700 group-hover:text-blue-700 mb-1">Khai báo Hồ sơ PCTT</h4>
                      <p className="text-sm text-gray-400">Thiết lập phương án ứng phó bão lụt, quản lý bảo hiểm và ghi nhận thiệt hại.</p>
                    </div>
                  )}
                </section>

                {/* 🟢 I. PHỤC VỤ HẬU CẦN */}
                <section className="animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-black text-[#05469B] flex items-center gap-2 uppercase tracking-wider">
                      <div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> {isParentUnit ? 'I. TỔNG HỢP HẬU CẦN TOÀN CỤM & CƠ SỞ' : 'I. PHỤC VỤ HẬU CẦN'}
                    </h3>
                    <button onClick={openPvhcModal} className="px-4 py-2 text-sm font-bold text-[#05469B] bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-2 transition-colors border border-blue-100 shadow-sm">
                      {currentPvhc ? <><Edit size={16} /> Cập nhật</> : <><Plus size={16} /> Khai báo PVHC</>}
                    </button>
                  </div>

                  {isParentUnit && aggregatedPvhc && (
                    <div className="mb-6 p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100 shadow-sm">
                      <h4 className="font-bold text-indigo-800 mb-4 flex items-center gap-2"><Layers size={18} /> Số liệu Tổng hợp Toàn Cụm</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between"><p className="text-[11px] font-bold text-blue-600 uppercase mb-2">Hiện hữu / Định biên</p><p className="text-2xl font-black text-[#05469B]">{aggregatedPvhc.hienHuu} / {aggregatedPvhc.dinhBien}</p></div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between"><p className="text-[11px] font-bold text-emerald-600 uppercase mb-2">Hậu cần Nội bộ</p><p className="text-xs text-gray-500 font-medium">Chờ: {aggregatedPvhc.khachCho} | VS: {aggregatedPvhc.veSinh}</p><p className="text-2xl font-black text-emerald-700">{aggregatedPvhc.khachCho + aggregatedPvhc.veSinh}</p></div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between"><p className="text-[10px] font-bold text-orange-600 uppercase mb-2">Dịch vụ Thuê ngoài</p><p className="text-2xl font-black text-orange-700">{aggregatedPvhc.dichVu}</p></div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between"><p className="text-[10px] font-bold text-red-600 uppercase mb-2">Tổng Phí thuê/tháng</p><p className="text-lg font-black text-red-700">{formatCurrency(aggregatedPvhc.chiPhi)} đ</p></div>
                      </div>
                    </div>
                  )}

                  {currentPvhc ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-300">
                      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4"><h4 className="font-bold text-[#05469B] flex items-center gap-2"><Pocket size={18} />Phục vụ Hậu cần</h4><span className="text-sm font-black text-[#05469B] bg-blue-50 px-3 py-1 rounded-md border border-blue-100">Hiện hữu: {currentPvhc.hien_huu || 0} / Định biên: {currentPvhc.dinh_bien || 0}</span></div>
                        <div className="space-y-4 flex-1">
                          <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100"><span className="text-emerald-800 font-semibold text-sm flex items-center gap-2"><Coffee size={16}/> NV PVHC (Khách chờ)</span><span className="text-emerald-700 font-black">{currentPvhc.pvhc_khach_cho || 0} Người</span></div>
                          <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100"><span className="text-emerald-800 font-semibold text-sm flex items-center gap-2"><Utensils size={16}/> NV PVHC (Vệ sinh-5S)</span><span className="text-emerald-700 font-black">{currentPvhc.pvhc_ve_sinh || 0} Người</span></div>
                          <div className="mt-4 pt-2"><div className="flex justify-between text-xs mb-1 font-bold text-gray-500"><span>Tỷ lệ lấp đầy định biên</span><span>{currentPvhc.dinh_bien ? Math.round(((Number(currentPvhc.hien_huu) || 0) / (Number(currentPvhc.dinh_bien) || 1)) * 100) : 0}%</span></div><div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(currentPvhc.dinh_bien ? ((Number(currentPvhc.hien_huu) || 0) / (Number(currentPvhc.dinh_bien) || 1)) * 100 : 0, 100)}%` }}></div></div></div>
                        </div>
                      </div>
                      {Number(currentPvhc.pvhc_dich_vu) > 0 ? (
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                          <h4 className="font-bold text-orange-700 flex items-center gap-2 border-b border-gray-100 pb-3 mb-4"><Briefcase size={18} /> Dịch vụ Thuê ngoài</h4>
                          <div className="space-y-4 flex-1">
                            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-100"><span className="text-orange-800 font-semibold text-sm">Nhân sự dịch vụ</span><span className="text-orange-700 font-black">{currentPvhc.pvhc_dich_vu || 0} Người</span></div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100"><span className="text-gray-600 font-semibold text-sm">Vị trí đảm nhận</span><span className="text-gray-800 font-bold text-right break-words">{currentPvhc.vi_tri || '---'}</span></div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100"><span className="text-gray-600 font-semibold text-sm">Nhà cung cấp</span><span className="text-gray-800 font-black uppercase text-right break-words">{currentPvhc.ncc_dich_vu || '---'}</span></div>
                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100"><span className="text-red-800 font-semibold text-sm">Chi phí thuê / tháng</span><span className="text-red-600 font-black">{formatCurrency(currentPvhc.chi_phi_thue) || 0} VNĐ</span></div>
                          </div>
                        </div>
                      ) : (<div className="bg-gray-50 p-5 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400"><Shield size={32} className="mb-2 opacity-30"/><p className="text-sm font-medium">Không có thuê ngoài dịch vụ</p></div>)}
                    </div>
                  ) : (
                    <div onClick={openPvhcModal} className="bg-white hover:bg-indigo-50/50 cursor-pointer p-10 rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-300 text-center transition-all group shadow-sm"><Utensils size={48} className="mx-auto text-gray-300 group-hover:text-indigo-400 mb-4 transition-colors" /><h4 className="text-lg font-bold text-gray-700 group-hover:text-indigo-700 mb-1">Khai báo Hồ sơ Phục vụ Hậu cần</h4><p className="text-sm text-gray-400">Click vào đây để khai báo nhân sự nội bộ, tạp vụ và thuê ngoài.</p></div>
                  )}
                </section>

                {/* J. THÔNG TIN PHÒNG HỌP */}
                <section>
                  <div className="flex justify-between items-center mb-5"><h3 className="text-lg font-black text-[#05469B] flex items-center gap-2 uppercase tracking-wider"><div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> J. THÔNG TIN PHÒNG HỌP</h3><button onClick={() => openPhModal('create')} className="px-4 py-2 text-sm font-bold text-fuchsia-600 bg-fuchsia-50 hover:bg-fuchsia-100 rounded-lg flex items-center gap-2 transition-colors border border-fuchsia-100 shadow-sm"><Plus size={16} /> Thêm Phòng họp</button></div>
                  <div className="flex flex-col gap-4">
                    {currentPhongHopList.length === 0 ? (<div className="py-12 text-center bg-white rounded-xl border border-dashed border-gray-300 text-gray-400"><Monitor size={40} className="mx-auto mb-3 opacity-50"/><p>Chưa có thông tin phòng họp cho đơn vị này.</p></div>) : (
                      currentPhongHopList.map(ph => {
                        const phId = ph.id;
                        return (
                        <div key={phId} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-fuchsia-300 transition-colors group flex flex-col xl:flex-row gap-6 relative items-start xl:items-center">
                          <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button onClick={() => openPhModal('update', ph)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded bg-white shadow-sm border border-blue-100" title="Sửa"><Edit size={14}/></button>
                            <button onClick={() => {setItemToDelete({id: phId, type: 'phonghop'}); setIsConfirmOpen(true);}} className="p-1.5 text-red-600 hover:bg-red-50 rounded bg-white shadow-sm border border-red-100" title="Xóa"><Trash2 size={14}/></button>
                          </div>
                          <div className="flex items-center gap-4 w-full xl:w-1/4 shrink-0">
                            <div className="w-14 h-14 rounded-full bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center shrink-0"><Monitor size={28} /></div>
                            <div className="min-w-0 pr-8 xl:pr-0">
                              <h4 className="font-black text-gray-800 text-lg truncate" title={ph.ten_phong_hop}>{ph.ten_phong_hop}</h4>
                              <p className="text-sm font-semibold text-gray-500 flex items-center gap-1.5 mt-0.5"><MapPin size={14} className="text-gray-400"/> {ph.vi_tri || 'Chưa cập nhật vị trí'}</p>
                              <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-md border border-gray-200"><Users size={14}/> Sức chứa: {ph.suc_chua || 0} người</span>
                            </div>
                          </div>
                          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 border-t xl:border-t-0 xl:border-l border-gray-100 pt-4 xl:pt-0 xl:pl-6">
                            <div className="space-y-3">
                              {ph.tb_trinh_chieu ? (<div className="flex items-start gap-2.5"><Projector size={18} className="text-blue-500 shrink-0 mt-0.5"/><div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Trình chiếu</p><p className="text-sm font-bold text-[#05469B] leading-tight">{ph.tb_trinh_chieu}</p></div></div>) : (<div className="flex items-center gap-2.5 text-gray-400"><Projector size={18}/> <span className="text-sm italic">Không Trình chiếu</span></div>)}
                              {ph.tb_hop_online ? (<div className="flex items-center gap-2.5"><Video size={18} className="text-green-500 shrink-0"/><span className="text-sm font-bold text-gray-800">Có thiết bị Họp Online</span></div>) : (<div className="flex items-center gap-2.5 text-gray-400"><Video size={18} className="shrink-0"/><span className="text-sm italic">Không Họp Online</span></div>)}
                            </div>
                            <div className="space-y-3 lg:col-span-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                  {ph.tb_chuyen_slide && (<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-fuchsia-50 text-fuchsia-700 text-xs font-bold rounded-lg border border-fuchsia-200 shadow-sm"><MousePointerClick size={14}/> Bút chuyển Slide</span>)}
                                  {ph.bang_viet && (<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-bold rounded-lg border border-orange-200 shadow-sm"><SquarePen size={14}/> Bảng viết</span>)}
                                  {ph.but_viet && (<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 shadow-sm"><PenTool size={14}/> Bút lông: {ph.but_viet}</span>)}
                                  {ph.but_chi && Number(ph.but_chi) > 0 && (<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200 shadow-sm"><Wand2 size={14}/> Bút Laser: {ph.but_chi} cái</span>)}
                              </div>
                              {ph.layout && (<div className="mt-2"><a href={ph.layout} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-fuchsia-600 hover:text-fuchsia-800 hover:underline"><LayoutTemplate size={16} /> Xem Layout Phòng họp</a></div>)}
                            </div>
                          </div>
                        </div>
                      )})
                    )}
                  </div>
                </section>

                {/* K. PHÁP NHÂN */}
                <section>
                  <div className="flex justify-between items-center mb-5"><h3 className="text-lg font-black text-[#05469B] flex items-center gap-2 uppercase tracking-wider"><div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> K. PHÁP NHÂN & THÔNG TIN XUẤT HÓA ĐƠN</h3><button onClick={() => openPnModal('create')} className="px-4 py-2 text-sm font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg flex items-center gap-2 transition-colors border border-orange-100 shadow-sm"><Plus size={16} /> Thêm Pháp nhân</button></div>
                  <div className="flex flex-col gap-3">
                    {currentPhapNhanList.length === 0 ? (<div className="py-12 text-center bg-white rounded-xl border border-dashed border-gray-300 text-gray-400"><Briefcase size={40} className="mx-auto mb-3 opacity-50"/><p>Chưa có thông tin pháp nhân cho đơn vị này.</p></div>) : (
                      currentPhapNhanList.map(pn => (
                        <div key={pn.id} className="bg-white px-5 py-4 rounded-xl border border-gray-200 shadow-sm hover:border-orange-300 transition-colors group flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
                          <div className="flex items-center gap-3 md:w-5/12 shrink-0">
                            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0"><FileText size={20} /></div>
                            <div className="min-w-0 pr-4">
                              <h4 className="font-bold text-gray-800 text-sm truncate" title={pn.ten_cong_ty}>{pn.ten_cong_ty}</h4>
                              <div className="flex gap-2 items-center mt-1"><span className="inline-block px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px] font-bold border border-orange-100">MST: {pn.ma_so_thue || '---'}</span><span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100 truncate max-w-[150px]" title={donViMap[pn.id_don_vi] || pn.id_don_vi}>🏢 {donViMap[pn.id_don_vi] || pn.id_don_vi}</span></div>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 border-t border-gray-100 md:border-t-0 pt-2 md:pt-0 space-y-1">
                            <div className="flex items-start gap-2 text-xs text-gray-500 group/map"><MapPin size={14} className="shrink-0 text-red-400 group-hover/map:text-blue-500 mt-0.5"/><span className="truncate" title={pn.dia_chi}>{pn.dia_chi ? (<a href={`http://maps.google.com/?q=$?q=${encodeURIComponent(pn.dia_chi)}`} target="_blank" rel="noreferrer" className="group-hover/map:text-blue-600 group-hover/map:underline transition-colors">{pn.dia_chi}</a>) : 'Chưa cập nhật địa chỉ'}</span></div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 group/mail"><MailIcon size={14} className="shrink-0 text-gray-400 group-hover/mail:text-orange-500"/><span className="truncate">{pn.mail ? (<a href={`mailto:${pn.mail}`} className="group-hover/mail:text-orange-600 group-hover/mail:underline transition-colors">{pn.mail}</a>) : 'Chưa cập nhật Email'}</span></div>
                          </div>
                          <div className="flex items-center justify-end gap-2 shrink-0">
                            <button onClick={() => handleCopyInvoice(pn)} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm border ${copiedId === pn.id ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'}`} title="Copy thông tin xuất hóa đơn">{copiedId === pn.id ? <><CheckCheck size={14}/> Đã Copy</> : <><Copy size={14}/> Copy Hóa đơn</>}</button>
                            {pn.gpkd && (<a href={pn.gpkd} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-1.5 transition-colors shadow-sm"><ExternalLink size={14}/> GPKD</a>)}
                            <div className="flex gap-1 border-l border-gray-100 pl-2 ml-1">
                              <button onClick={() => openPnModal('update', pn)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Sửa"><Edit size={16}/></button>
                              <button onClick={() => {setItemToDelete({id: pn.id, type: 'phapnhan'}); setIsConfirmOpen(true);}} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Xóa"><Trash2 size={16}/></button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* 🟢 L. THỐNG KÊ TÀI SẢN (XE & TRANG THIẾT BỊ) */}
                <section className="animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-5"><h3 className="text-lg font-black text-[#05469B] flex items-center gap-2 uppercase tracking-wider"><div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> L. THỐNG KÊ TÀI SẢN (XE & TRANG THIẾT BỊ)</h3></div>
                  <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch`}>
                     {/* 1. THỐNG KÊ PHƯƠNG TIỆN */}
                     <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full">
                        <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><Car size={18} className="text-[#05469B]" /> 1. Phương tiện (Xe công & Lái thử)</h4>
                        <div className="grid grid-cols-3 gap-4 mb-5">
                           <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center flex flex-col items-center justify-between"><p className="text-[10px] font-bold text-gray-500 uppercase mb-1 whitespace-nowrap w-full truncate" title="Tổng số xe">Tổng số xe</p><p className="text-xl font-black text-[#05469B] mt-auto flex-1 flex items-end">{xeStats.total}</p></div>
                           <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center flex flex-col items-center justify-between"><p className="text-[10px] font-bold text-emerald-600 uppercase mb-1 whitespace-nowrap w-full truncate" title="Đang hoạt động">Đang hoạt động</p><p className="text-xl font-black text-emerald-700 mt-auto flex-1 flex items-end">{xeStats.active}</p></div>
                           <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center flex flex-col items-center justify-between"><p className="text-[10px] font-bold text-red-600 uppercase mb-1 whitespace-nowrap w-full truncate" title="Sửa chữa / Ngừng">Sửa chữa / Ngừng</p><p className="text-xl font-black text-red-700 mt-auto flex-1 flex items-end">{xeStats.inactive}</p></div>
                        </div>
                        {xeStats.total > 0 ? (
                          <div className="overflow-x-auto border border-gray-200 rounded-xl flex-1">
                            <table className="w-full text-left text-sm border-collapse">
                              <thead className="bg-gray-50 border-b border-gray-200"><tr className="text-xs text-gray-600 uppercase tracking-wider"><th className="p-3 border-r border-gray-200 w-1/3 whitespace-nowrap">Phân loại theo Mục đích</th><th className="p-3 border-r border-gray-200 w-24 text-center">SL</th><th className="p-3 whitespace-nowrap">Phân loại theo Loại xe</th></tr></thead>
                              <tbody className="divide-y divide-gray-200">
                                {Object.entries(xeStats.grouped).map(([purpose, pData]) => (
                                  <React.Fragment key={purpose}>
                                    <tr className="bg-gray-100/80"><td className="p-3 font-bold text-gray-800 border-r border-gray-200 flex items-center gap-2"><Tag size={14} className="text-[#05469B]" /> {purpose}</td><td className="p-3 font-black text-[#05469B] text-center border-r border-gray-200">{pData.total}</td><td className="p-3 bg-gray-50/50"></td></tr>
                                    {Object.entries(pData.brands).map(([brand, bData]) => (
                                      <tr key={`${purpose}-${brand}`} className="bg-white hover:bg-blue-50/30 transition-colors">
                                        <td className="p-3 text-gray-600 italic border-r border-gray-200 pl-10 font-medium">{brand}</td>
                                        <td className="p-3 text-center font-bold text-gray-700 border-r border-gray-200">{bData.total}</td>
                                        <td className="p-3">
                                          <div className="flex flex-col gap-1.5">
                                            {Object.entries(bData.models).map(([model, count]) => (
                                              <div key={model} className="flex items-center gap-2 text-xs font-semibold text-gray-700"><Car size={14} className="text-gray-400 shrink-0" /> <span className="truncate">{model}:</span> <span className="text-[#05469B] font-bold whitespace-nowrap">{count} xe</span></div>
                                            ))}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </React.Fragment>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (<div className="text-center py-6 text-gray-400 border border-dashed border-gray-200 rounded-xl flex-1 flex items-center justify-center">Không có dữ liệu xe.</div>)}
                     </div>

                     {/* 2. THỐNG KÊ TRANG THIẾT BỊ VĂN PHÒNG */}
                     <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full">
                        <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><MonitorSmartphone size={18} className="text-[#05469B]" /> 2. Trang thiết bị Văn phòng</h4>
                        <div className="grid grid-cols-3 gap-4 mb-5">
                           <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center flex flex-col items-center justify-between"><p className="text-[10px] font-bold text-gray-500 uppercase mb-1 whitespace-nowrap w-full truncate" title="Tổng thiết bị">Tổng thiết bị</p><p className="text-xl font-black text-[#05469B] mt-auto flex-1 flex items-end">{tbStats.total}</p></div>
                           <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center flex flex-col items-center justify-between"><p className="text-[10px] font-bold text-emerald-600 uppercase mb-1 whitespace-nowrap w-full truncate" title="Đang sử dụng">Đang sử dụng</p><p className="text-xl font-black text-emerald-700 mt-auto flex-1 flex items-end">{tbStats.active}</p></div>
                           <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center flex flex-col items-center justify-between"><p className="text-[10px] font-bold text-red-600 uppercase mb-1 whitespace-nowrap w-full truncate" title="Hỏng / Lưu kho">Hỏng / Lưu kho</p><p className="text-xl font-black text-red-700 mt-auto flex-1 flex items-end">{tbStats.inactive}</p></div>
                        </div>
                        {tbStats.total > 0 ? (
                          <div className="flex flex-wrap gap-2.5 flex-1 content-start">
                            {tbStats.groups.map(([group, count]) => (
                              <div key={group} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-[#05469B] hover:shadow-md transition-all cursor-default group">
                                <span className="text-xs font-bold text-gray-600 group-hover:text-[#05469B]">{group}</span>
                                <span className="bg-blue-50 px-2 py-0.5 rounded text-xs font-black text-[#05469B] border border-blue-100 group-hover:bg-[#05469B] group-hover:text-white transition-colors">{count}</span>
                              </div>
                            ))}
                          </div>
                        ) : (<div className="text-center py-6 text-gray-400 border border-dashed border-gray-200 rounded-xl flex-1 flex items-center justify-center">Không có dữ liệu thiết bị.</div>)}
                     </div>

                     {/* 3. PHÂN BỔ TÀI SẢN */}
                     {subordinateStats.length > 0 && (
                       <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full">
                          <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><Building2 size={18} className="text-[#05469B]" /> 3. Phân bổ Tài sản theo Đơn vị trực thuộc</h4>
                          <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {subordinateStats.map(stat => (
                                <div key={stat.id} className="bg-white p-3 rounded-xl border border-gray-200 hover:border-[#05469B] shadow-sm flex flex-col gap-2 transition-colors">
                                  <p className="text-sm font-bold text-gray-800 truncate" title={stat.name}>{stat.name}</p>
                                  <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100"><Car size={12} className="text-[#05469B]"/> {stat.xe} Xe</span>
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100"><MonitorSmartphone size={12} className="text-[#05469B]"/> {stat.tb} TTB</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                       </div>
                     )}
                  </div>
                </section>

              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 🟢 TẤT CẢ CÁC MODAL BỊ THIẾU Ở ĐÂY */}
      {/* 1. MODAL ĐƠN VỊ CHÍNH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between p-5 border-b bg-gray-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-[#05469B]">{modalMode === 'create' ? 'Thêm Đơn vị' : 'Cập nhật Đơn vị'}</h3>
              <button onClick={() => setIsModalOpen(false)} disabled={submitting} className="text-gray-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Mã Đơn Vị (ID) *</label><input type="text" required name="id" value={formData.id || ''} onChange={(e) => setFormData({...formData, id: e.target.value})} disabled className="w-full p-2.5 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed outline-none" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1 text-gray-600">Tên Đơn Vị *</label><input type="text" required name="ten_don_vi" value={formData.ten_don_vi || ''} onChange={(e) => setFormData({...formData, ten_don_vi: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Cấp Quản Lý (Mẹ) *</label><select required name="cap_quan_ly" value={formData.cap_quan_ly || ''} onChange={(e) => setFormData({...formData, cap_quan_ly: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] font-bold text-[#05469B] outline-none focus:ring-2 focus:ring-blue-500"><option value="">-- Chọn Cấp QL --</option><option value="HO" className="text-red-600">🏢 Tổng Công Ty (HO)</option>{buildHierarchicalOptions(data.filter(d => d.id !== formData.id)).map(({ unit, prefix }) => (<option key={unit.id} value={unit.id}>{prefix}{getUnitEmoji(unit.loai_hinh)} {unit.ten_don_vi}</option>))}</select></div>
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Khu vực (Phía)</label><select name="phia" value={formData.phia || 'VPĐH'} onChange={(e) => setFormData({...formData, phia: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500"><option value="VPĐH">VPĐH</option><option value="CTTT Phía Nam">CTTT Phía Nam</option><option value="CTTT Phía Bắc">CTTT Phía Bắc</option></select></div>
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Loại hình</label><select name="loai_hinh" value={formData.loai_hinh || 'Showroom Quản trị'} onChange={(e) => setFormData({...formData, loai_hinh: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500"><option value="Tổng Công ty">Tổng Công ty</option><option value="Công ty Tỉnh/TP">Công ty Tỉnh/TP</option><option value="Showroom Quản trị">Showroom Quản trị</option><option value="Showroom">Showroom</option><option value="Xưởng Dịch vụ">Xưởng Dịch vụ</option><option value="Điểm Kinh doanh">Điểm Kinh doanh</option><option value="Kho xe">Kho xe</option></select></div>
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Trạng thái</label><select name="trang_thai" value={formData.trang_thai || 'Hoạt động'} onChange={(e) => setFormData({...formData, trang_thai: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700"><option value="Hoạt động">Hoạt động</option><option value="Đại lý">Đại lý</option><option value="Đầu tư mới">Đầu tư mới</option><option value="Ngừng hoạt động">Ngừng hoạt động</option></select></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1 text-gray-600">Địa chỉ</label><input type="text" name="dia_chi" value={formData.dia_chi || ''} onChange={(e) => setFormData({...formData, dia_chi: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              {formData.loai_hinh === 'Showroom Quản trị' && (<div className="bg-[#00559B]/5 p-4 rounded-xl border border-[#00559B]/20 mt-2 animate-in fade-in"><label className="block text-xs font-bold text-[#00559B] mb-3 uppercase tracking-wider">Thương hiệu Kinh Doanh</label><div className="flex flex-wrap gap-3 mb-4">{KINH_DOANH_OPTIONS.map(opt => { const isChecked = (formData.kinh_doanh || '').split(',').map((s:string)=>s.trim()).includes(opt); return (<label key={opt} className="flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-[#00559B]/20 shadow-sm hover:border-[#00559B] transition-colors"><input type="checkbox" checked={isChecked} onChange={(e) => handleKinhDoanhChange(opt, e.target.checked)} className="w-4 h-4 text-[#00559B] rounded border-gray-300 focus:ring-[#00559B] cursor-pointer"/><span className="text-xs font-bold text-gray-700">{opt}</span></label>) })}{(formData.kinh_doanh || '').split(',').map((s:string)=>s.trim()).filter(Boolean).filter((opt:string) => !KINH_DOANH_OPTIONS.includes(opt)).map((opt:string) => ( <label key={opt} className="flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-[#00559B]/20 shadow-sm hover:border-[#00559B] transition-colors"><input type="checkbox" checked={true} onChange={(e) => handleKinhDoanhChange(opt, e.target.checked)} className="w-4 h-4 text-[#00559B] rounded border-gray-300 focus:ring-[#00559B] cursor-pointer"/><span className="text-xs font-bold text-gray-700">{opt}</span></label> ))}</div><div className="flex gap-2 items-center max-w-sm"><input type="text" value={customKD} onChange={e => setCustomKD(e.target.value)} placeholder="Nhập thương hiệu khác..." className="w-full p-2 border border-gray-200 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-[#00559B]" onKeyDown={e => {if (e.key==='Enter') { e.preventDefault(); addCustomKD(); }}} /><button type="button" onClick={addCustomKD} className="px-4 py-2 bg-[#00559B] hover:bg-[#04367a] text-white font-bold rounded-lg text-sm transition-colors shadow-sm">Thêm</button></div></div>)}
              <hr className="border-gray-100"/>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Diện tích (m²)</label><input type="number" name="dien_tich" value={formData.dien_tich || ''} onChange={(e) => setFormData({...formData, dien_tich: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Số Tầng</label><input type="number" name="so_tang" value={formData.so_tang || ''} onChange={(e) => setFormData({...formData, so_tang: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Số Hầm</label><input type="number" name="so_ham" value={formData.so_ham || ''} onChange={(e) => setFormData({...formData, so_ham: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Số Cổng</label><input type="number" name="so_cong" value={formData.so_cong || ''} onChange={(e) => setFormData({...formData, so_cong: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Phòng chờ</label><input type="number" name="so_phong_cho" value={formData.so_phong_cho || ''} onChange={(e) => setFormData({...formData, so_phong_cho: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Khách/Ngày</label><input type="number" name="luot_khach_bq" value={formData.luot_khach_bq || ''} onChange={(e) => setFormData({...formData, luot_khach_bq: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="md:col-span-3"><label className="block text-xs font-bold mb-1 text-gray-600">Tổng CB-NV tại đơn vị</label><input type="number" name="tong_nhan_su" value={formData.tong_nhan_su || ''} onChange={(e) => setFormData({...formData, tong_nhan_su: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div className="pt-5 border-t border-gray-100 flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-xl transition-colors">Hủy</button>
                <button type="submit" disabled={submitting} className="px-8 py-3 text-white bg-[#05469B] hover:bg-[#04367a] font-bold rounded-xl flex items-center gap-2 shadow-lg transition-colors">{submitting ? <Loader2 className="animate-spin" /> : 'Lưu Thay Đổi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL AN NINH */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-indigo-100 bg-indigo-50 rounded-t-2xl text-indigo-900"><h3 className="text-xl font-bold flex items-center gap-2"><Shield size={24}/> Cập nhật An ninh & Hệ thống Camera</h3><button onClick={() => setIsSecurityModalOpen(false)} disabled={submitting} className="text-indigo-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm"><X className="w-6 h-6" /></button></div>
            <form onSubmit={handleSecuritySave} className="p-6 overflow-y-auto space-y-6">
              <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100"><h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 border-b border-blue-200 pb-2"><Users size={18}/> Lực lượng Bảo vệ</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-5"><div><label className="block text-xs font-bold text-gray-700 mb-1">Định biên ANBV (Người)</label><input type="number" name="dinh_bien_bv" value={securityFormData.dinh_bien_bv || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" /></div><div><label className="block text-xs font-bold text-gray-700 mb-1">Bảo vệ Nội bộ (Người)</label><input type="number" name="bv_noi_bo" value={securityFormData.bv_noi_bo || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" /></div><div><label className="block text-xs font-bold text-gray-700 mb-1">Bảo vệ Dịch vụ (Người)</label><input type="number" name="bv_dich_vu" value={securityFormData.bv_dich_vu || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" /></div></div>{Number(securityFormData.bv_dich_vu) >= 1 && (
                    <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-blue-100 animate-in fade-in slide-in-from-top-2">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-[50%]">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Nhà cung cấp BV</label>
                          <input type="text" name="ncc_dich_vu" value={securityFormData.ncc_dich_vu || ''} onChange={(e) => handleInputChange(e, 'sec')} placeholder="YUKI, Sepre 24..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="w-full md:w-[50%]">
                          <label className="block text-xs font-bold text-red-600 mb-1">Chi phí thuê (VNĐ/Tháng)</label>
                          <input type="text" name="chi_phi_thue" value={formatCurrency(securityFormData.chi_phi_thue)} onChange={(e) => handleInputChange(e, 'sec')} placeholder="Nhập số tiền..." className="w-full p-2.5 border border-red-200 text-red-600 font-bold rounded-lg bg-red-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-500" />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-[40%]">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Ngày ký HĐ thuê</label>
                          <input type="date" name="ngay_ky_hd" value={normalizeDateToISO(securityFormData.ngay_ky_hd)} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="w-full md:w-[20%]">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Thời hạn HĐ (tháng)</label>
                          <input type="number" min="1" name="han_hop_dong" value={securityFormData.han_hop_dong || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="w-full md:w-[40%]">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Vị trí (Mô tả)</label>
                          <input type="text" name="vi_tri_bv_dv" value={securityFormData.vi_tri_bv_dv || ''} onChange={(e) => handleInputChange(e, 'sec')} placeholder="Cổng chính, cổng phụ..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
              <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100"><h4 className="font-bold text-amber-800 mb-4 flex items-center gap-2 border-b border-amber-200 pb-2"><Clock size={18}/> Bố trí Ca trực</h4><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4"><div><label className="block text-[10px] font-bold text-amber-700 mb-1 uppercase flex items-center gap-1"><Sun size={12}/> Ngày (Cố định)</label><input type="number" name="ngay_co_dinh" value={securityFormData.ngay_co_dinh || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-500" /></div><div><label className="block text-[10px] font-bold text-amber-700 mb-1 uppercase flex items-center gap-1"><Sun size={12}/> Ngày (Tuần tra)</label><input type="number" name="ngay_tuan_tra" value={securityFormData.ngay_tuan_tra || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-500" /></div><div><label className="block text-[10px] font-bold text-indigo-700 mb-1 uppercase flex items-center gap-1"><Moon size={12}/> Đêm (Cố định)</label><input type="number" name="dem_co_dinh" value={securityFormData.dem_co_dinh || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" /></div><div><label className="block text-[10px] font-bold text-indigo-700 mb-1 uppercase flex items-center gap-1"><Moon size={12}/> Đêm (Tuần tra)</label><input type="number" name="dem_tuan_tra" value={securityFormData.dem_tuan_tra || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" /></div></div><div><label className="block text-xs font-bold text-gray-700 mb-1">Bố trí nghỉ ca / Đổi ca</label><textarea name="bo_tri_nghi_ca" value={securityFormData.bo_tri_nghi_ca || ''} onChange={(e) => handleInputChange(e, 'sec')} rows={2} placeholder="Mô tả cách thức bố trí người nghỉ ca..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white resize-none outline-none focus:ring-2 focus:ring-amber-500"></textarea></div></div>
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200"><h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2"><Camera size={18}/> Hệ thống Camera Giám sát</h4><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4"><div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Tổng SL (Mắt)</label><input type="number" name="sl_camera" value={securityFormData.sl_camera || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" /></div><div><label className="block text-[10px] font-bold text-emerald-600 mb-1 uppercase">Hoạt động</label><input type="number" name="camera_hoat_dong" value={securityFormData.camera_hoat_dong || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-emerald-200 rounded-lg bg-emerald-50 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700" /></div><div><label className="block text-[10px] font-bold text-red-600 mb-1 uppercase">Hư hỏng</label><input type="number" name="camera_hu" value={securityFormData.camera_hu || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-red-200 rounded-lg bg-red-50 outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-700" /></div><div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Lưu hình (Ngày)</label><input type="number" name="thoi_gian_luu" value={securityFormData.thoi_gian_luu || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" /></div></div>{Number(securityFormData.camera_hu) > 0 && (<div className="mb-4 p-4 bg-red-50/50 rounded-lg border border-red-100 animate-in fade-in zoom-in duration-200"><label className="block text-xs font-bold text-red-700 mb-2">Lý do Camera hư/hỏng</label><select value={securityFormData.ly_do_camera_hu && !['Sự cố nguồn điện', 'Dây tín hiệu và Jack kết nối', 'Lỗi phần cứng Camera', 'Lỗi đầu ghi (DVR/NVR) và Lưu trữ', 'Vấn đề phần mềm & Mạng'].includes(securityFormData.ly_do_camera_hu) ? 'Khác' : (securityFormData.ly_do_camera_hu || '')} onChange={(e) => { const val = e.target.value; setSecurityFormData({...securityFormData, ly_do_camera_hu: val === 'Khác' ? 'Khác' : val}); }} className="w-full p-2.5 border border-red-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium text-red-800 mb-2"><option value="">-- Chọn lý do --</option><option value="Sự cố nguồn điện">Sự cố nguồn điện</option><option value="Dây tín hiệu và Jack kết nối">Dây tín hiệu và Jack kết nối</option><option value="Lỗi phần cứng Camera">Lỗi phần cứng Camera</option><option value="Lỗi đầu ghi (DVR/NVR) và Lưu trữ">Lỗi đầu ghi (DVR/NVR) và Lưu trữ</option><option value="Vấn đề phần mềm & Mạng">Vấn đề phần mềm & Mạng</option><option value="Khác">Khác (Nhập lý do cụ thể...)</option></select>{(securityFormData.ly_do_camera_hu && !['Sự cố nguồn điện', 'Dây tín hiệu và Jack kết nối', 'Lỗi phần cứng Camera', 'Lỗi đầu ghi (DVR/NVR) và Lưu trữ', 'Vấn đề phần mềm & Mạng', ''].includes(securityFormData.ly_do_camera_hu)) && (<input type="text" value={securityFormData.ly_do_camera_hu === 'Khác' ? '' : securityFormData.ly_do_camera_hu} onChange={(e) => setSecurityFormData({...securityFormData, ly_do_camera_hu: e.target.value || 'Khác'})} placeholder="Gõ lý do hư hỏng cụ thể..." className="w-full p-2.5 border border-red-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 text-sm" />)}</div>)}<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Vị trí đặt hệ thống (Đầu ghi)</label><input type="text" name="vi_tri_he_thong_camera" value={securityFormData.vi_tri_he_thong_camera || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="VD: Phòng IT..." /></div><div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Vị trí giám sát chính</label><textarea name="vi_tri_gs_camera" value={securityFormData.vi_tri_gs_camera || ''} onChange={(e) => handleInputChange(e, 'sec')} rows={1} placeholder="Mô tả các góc giám sát..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white resize-none outline-none focus:ring-2 focus:ring-indigo-500"></textarea></div></div></div>
              <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100"><h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2 border-b border-emerald-200 pb-2"><Compass size={18}/> Đặc điểm Địa bàn</h4><div className="space-y-5"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Tiếp giáp Trước</label><input type="text" name="tiep_giap_truoc" value={securityFormData.tiep_giap_truoc || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div><div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Tiếp giáp Sau</label><input type="text" name="tiep_giap_sau" value={securityFormData.tiep_giap_sau || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div><div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Tiếp giáp Trái</label><input type="text" name="tiep_giap_trai" value={securityFormData.tiep_giap_trai || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div><div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Tiếp giáp Phải</label><input type="text" name="tiep_giap_phai" value={securityFormData.tiep_giap_phai || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div></div><div><label className="block text-xs font-bold text-emerald-800 mb-1">Đánh giá Tình hình ANTT Khu vực</label><input type="text" name="tinh_hinh_khu_vuc" value={securityFormData.tinh_hinh_khu_vuc || ''} onChange={(e) => handleInputChange(e, 'sec')} placeholder="VD: Phức tạp, Thường xuyên mất cắp..." className="w-full p-2.5 border border-emerald-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div></div></div>
              <div className="bg-purple-50/50 p-5 rounded-xl border border-purple-100"><h4 className="font-bold text-purple-800 mb-4 flex items-center gap-2 border-b border-purple-200 pb-2"><FileText size={18}/> Phương án ANBV</h4><div><label className="block text-xs font-bold text-gray-700 mb-1">Link Phương án ANBV (Drive/PDF)</label><div className="relative"><LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input type="url" name="link_pa_anbv" value={securityFormData.link_pa_anbv || ''} onChange={(e) => handleInputChange(e, 'sec')} placeholder="Dán link phương án..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white text-blue-600 outline-none focus:ring-2 focus:ring-purple-500" /></div></div></div>
              <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-100"><button type="button" onClick={() => setIsSecurityModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shadow-sm font-bold rounded-xl">Hủy</button><button type="submit" disabled={submitting} className="px-8 py-3 bg-[#05469B] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#04367a] shadow-md transition-colors">{submitting ? <Loader2 className="animate-spin"/> : <Save/>} Lưu Cập Nhật</button></div>
            </form>
          </div>
        </div>
      )}
      {/* 3. MODAL HẬU CẦN */}
      {isPvhcModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-emerald-100 bg-emerald-50 rounded-t-2xl text-emerald-900"><h3 className="text-xl font-bold flex items-center gap-2"><Utensils size={24}/> Cập nhật Phục vụ Hậu cần</h3><button onClick={() => setIsPvhcModalOpen(false)} disabled={submitting} className="text-emerald-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm"><X className="w-6 h-6" /></button></div>
            <form onSubmit={handlePvhcSave} className="p-6 overflow-y-auto space-y-6">
              <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100"><h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2 border-b border-emerald-200 pb-2"><Pocket size={18}/> 1. Lực lượng Nội bộ</h4><div className="grid grid-cols-1 sm:grid-cols-3 gap-5"><div><label className="block text-xs font-bold text-gray-700 mb-1">Định biên (Người) *</label><input type="number" required name="dinh_bien" value={pvhcFormData.dinh_bien || ''} onChange={(e) => handleInputChange(e, 'pvhc')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div><div><label className="block text-xs font-bold text-gray-700 mb-1">NV Khách chờ (Phòng chờ)</label><input type="number" name="pvhc_khach_cho" value={pvhcFormData.pvhc_khach_cho || ''} onChange={(e) => handleInputChange(e, 'pvhc')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div><div><label className="block text-xs font-bold text-gray-700 mb-1">NV PVHC (Vệ sinh-5S)</label><input type="number" name="pvhc_ve_sinh" value={pvhcFormData.pvhc_ve_sinh || ''} onChange={(e) => handleInputChange(e, 'pvhc')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div></div><p className="text-[10px] text-gray-500 mt-3 italic">* Hệ thống sẽ tự động tính <strong>Hiện hữu</strong> = Khách chờ + Vệ sinh</p></div>
              <div className="bg-orange-50/50 p-5 rounded-xl border border-orange-100"><h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2 border-b border-orange-200 pb-2"><Briefcase size={18}/> 2. Dịch vụ Thuê ngoài</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5"><div><label className="block text-xs font-bold text-gray-700 mb-1">Số lượng Thuê ngoài (Người)</label><input type="number" name="pvhc_dich_vu" value={pvhcFormData.pvhc_dich_vu || ''} onChange={(e) => handleInputChange(e, 'pvhc')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500" /></div>{Number(pvhcFormData.pvhc_dich_vu) > 0 && (<div className="animate-in fade-in"><label className="block text-xs font-bold text-gray-700 mb-1">Vị trí đảm nhận *</label><input type="text" required name="vi_tri" value={pvhcFormData.vi_tri || ''} onChange={(e) => handleInputChange(e, 'pvhc')} placeholder="VD: Khách chờ, Vệ sinh-5S..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500" /></div>)}</div>{Number(pvhcFormData.pvhc_dich_vu) > 0 && (<div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-orange-100 animate-in fade-in"><div><label className="block text-xs font-bold text-gray-700 mb-1">Nhà cung cấp *</label><input type="text" required name="ncc_dich_vu" value={pvhcFormData.ncc_dich_vu || ''} onChange={(e) => handleInputChange(e, 'pvhc')} placeholder="Tên công ty thuê ngoài..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500" /></div><div><label className="block text-xs font-bold text-red-600 mb-1">Chi phí thuê / tháng (VNĐ) *</label><input type="text" required name="chi_phi_thue" value={formatCurrency(pvhcFormData.chi_phi_thue)} onChange={(e) => handleInputChange(e, 'pvhc')} placeholder="Nhập số tiền..." className="w-full p-2.5 border border-red-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-600" /></div></div>)}</div>
              <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-100"><button type="button" onClick={() => setIsPvhcModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-sm">Hủy</button><button type="submit" disabled={submitting} className="px-8 py-3 bg-[#05469B] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#04367a] shadow-md transition-colors">{submitting ? <Loader2 className="animate-spin"/> : <Save/>} Lưu Cập Nhật</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL PHÁP NHÂN */}
      {isPnModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-orange-100 bg-orange-50 rounded-t-2xl text-orange-900"><h3 className="text-xl font-bold flex items-center gap-2"><Briefcase size={24}/> {pnModalMode === 'create' ? 'Thêm Pháp nhân mới' : 'Cập nhật Pháp nhân'}</h3><button onClick={() => setIsPnModalOpen(false)} disabled={submitting} className="text-orange-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm"><X className="w-6 h-6" /></button></div>
            <form onSubmit={handlePnSave} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Tên Công ty (Pháp nhân) *</label><input type="text" required name="ten_cong_ty" value={pnFormData.ten_cong_ty || ''} onChange={(e) => handleInputChange(e, 'pn')} placeholder="VD: Công ty TNHH MTV Phân phối Ô tô..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-800" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Mã số thuế (MST) *</label><input type="text" required name="ma_so_thue" value={pnFormData.ma_so_thue || ''} onChange={(e) => handleInputChange(e, 'pn')} placeholder="Nhập MST..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-700 tracking-widest" /></div>
                <div className="md:col-span-3"><label className="block text-xs font-bold text-gray-600 mb-1">Đơn vị trực thuộc *</label><select required name="id_don_vi" value={pnFormData.id_don_vi || ''} onChange={(e) => handleInputChange(e, 'pn')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 font-bold text-[#05469B]" style={{ fontFamily: 'monospace, sans-serif' }}><option value="">-- Chọn Đơn vị --</option>{buildHierarchicalOptions(data.filter(dv => selectedUnitSubordinates.includes(dv.id))).map(({ unit, prefix }) => (<option key={unit.id} value={unit.id} className="font-normal text-gray-700">{prefix}{getUnitEmoji(unit.loai_hinh)} {unit.ten_don_vi}</option>))}</select></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Địa chỉ đăng ký kinh doanh</label><input type="text" name="dia_chi" value={pnFormData.dia_chi || ''} onChange={(e) => handleInputChange(e, 'pn')} placeholder="Địa chỉ ghi trên Giấy phép kinh doanh..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Email nhận Hóa đơn</label><input type="email" name="mail" value={pnFormData.mail || ''} onChange={(e) => handleInputChange(e, 'pn')} placeholder="ketoan@thaco.com.vn..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500" /></div>
                <div className="md:col-span-3"><label className="block text-xs font-bold text-gray-600 mb-1">Link Giấy phép Kinh doanh (Drive / File scan)</label><input type="url" name="gpkd" value={pnFormData.gpkd || ''} onChange={(e) => handleInputChange(e, 'pn')} placeholder="Dán link file đính kèm..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 text-blue-600" /></div>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-6"><button type="button" onClick={() => setIsPnModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-xl transition-colors">Hủy</button><button type="submit" disabled={submitting} className="px-8 py-3 text-white bg-orange-600 hover:bg-orange-700 font-bold rounded-xl flex items-center gap-2 shadow-md transition-colors">{submitting ? <Loader2 className="animate-spin" /> : 'Lưu Pháp nhân'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL PHÒNG HỌP */}
      {isPhModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-fuchsia-100 bg-fuchsia-50 rounded-t-2xl text-fuchsia-900"><h3 className="text-xl font-bold flex items-center gap-2"><Monitor size={24}/> {phModalMode === 'create' ? 'Thêm Phòng họp mới' : 'Cập nhật Phòng họp'}</h3><button onClick={() => setIsPhModalOpen(false)} disabled={submitting} className="text-fuchsia-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm"><X className="w-6 h-6" /></button></div>
            <form onSubmit={handlePhSave} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Tên Phòng họp *</label><input type="text" required name="ten_phong_hop" value={phFormData.ten_phong_hop || ''} onChange={(e) => handleInputChange(e, 'ph')} placeholder="VD: Phòng họp Tầng 2..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-fuchsia-500 font-bold text-gray-800" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Vị trí *</label><input type="text" required name="vi_tri" value={phFormData.vi_tri || ''} onChange={(e) => handleInputChange(e, 'ph')} placeholder="VD: Lầu 2..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-fuchsia-500" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Sức chứa tối đa (Người) *</label><input type="number" required name="suc_chua" value={phFormData.suc_chua || ''} onChange={(e) => handleInputChange(e, 'ph')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-fuchsia-500" /></div>
              </div>
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-5">
                <h4 className="text-sm font-bold text-[#05469B] flex items-center gap-2 border-b border-gray-200 pb-2"><Projector size={16}/> Trang thiết bị</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Thiết bị trình chiếu (Loại - Inch)</label><input type="text" name="tb_trinh_chieu" value={phFormData.tb_trinh_chieu || ''} onChange={(e) => handleInputChange(e, 'ph')} placeholder="VD: Tivi - 100 inch..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-fuchsia-500" /></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">Số lượng Bút Laser</label><input type="number" name="but_chi" value={phFormData.but_chi || ''} onChange={(e) => handleInputChange(e, 'ph')} placeholder="Nhập số lượng..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-fuchsia-500" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-fuchsia-500 transition-colors shadow-sm"><input type="checkbox" name="tb_hop_online" checked={phFormData.tb_hop_online || false} onChange={(e) => handleInputChange(e, 'ph')} className="w-4 h-4 text-fuchsia-600 rounded border-gray-300 mr-2.5 focus:ring-fuchsia-500" /><span className="text-xs font-bold text-gray-700">Thiết bị Họp Online</span></label>
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-fuchsia-500 transition-colors shadow-sm"><input type="checkbox" name="bang_viet" checked={phFormData.bang_viet || false} onChange={(e) => handleInputChange(e, 'ph')} className="w-4 h-4 text-fuchsia-600 rounded border-gray-300 mr-2.5 focus:ring-fuchsia-500" /><span className="text-xs font-bold text-gray-700">Bảng viết</span></label>
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-fuchsia-500 transition-colors shadow-sm"><input type="checkbox" name="tb_chuyen_slide" checked={phFormData.tb_chuyen_slide || false} onChange={(e) => handleInputChange(e, 'ph')} className="w-4 h-4 text-fuchsia-600 rounded border-gray-300 mr-2.5 focus:ring-fuchsia-500" /><span className="text-xs font-bold text-gray-700">Bút chuyển slide</span></label>
                  <div className="flex flex-col justify-center bg-white border border-gray-200 rounded-lg p-2 px-3 shadow-sm"><label className="block text-[10px] font-bold text-gray-400 mb-1">MÀU BÚT LÔNG</label><div className="flex gap-3">{['Xanh', 'Đỏ', 'Đen'].map(color => { const isChecked = phFormData.but_viet?.includes(color); return (<label key={color} className="flex items-center cursor-pointer group"><input type="checkbox" checked={isChecked} onChange={(e) => handleButVietChange(color, e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500 mr-1" /><span className={`text-xs font-medium transition-colors ${isChecked ? 'text-gray-800' : 'text-gray-500 group-hover:text-fuchsia-600'}`}>{color}</span></label>) })}</div></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Link Layout Phòng (Drive / File PDF)</label><input type="url" name="layout" value={phFormData.layout || ''} onChange={(e) => handleInputChange(e, 'ph')} placeholder="Dán link layout..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-fuchsia-500 text-blue-600" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Ghi chú khác</label><input type="text" name="ghi_chu" value={phFormData.ghi_chu || ''} onChange={(e) => handleInputChange(e, 'ph')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-fuchsia-500" /></div>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-6"><button type="button" onClick={() => setIsPhModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-xl transition-colors">Hủy</button><button type="submit" disabled={submitting} className="px-8 py-3 text-white bg-fuchsia-600 hover:bg-fuchsia-700 font-bold rounded-xl flex items-center gap-2 shadow-md transition-colors">{submitting ? <Loader2 className="animate-spin" /> : 'Lưu Phòng Họp'}</button></div>
            </form>
          </div>
        </div>
      )}
      {/* 6. MODAL PCCC (ALL IN ONE) */}
      {isPcccModalOpen && (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 ${!isListCollapsed ? 'lg:pl-80' : ''}`}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200 overflow-x-hidden">
            <div className="flex justify-between p-5 border-b border-gray-100 bg-red-50 rounded-t-2xl shrink-0"><h3 className="text-xl font-bold text-red-700 flex items-center gap-2"><Flame size={24}/> {modalMode === 'create' ? 'Tạo Hồ sơ PCCC Mới' : modalMode === 'view' ? 'Chi tiết Hồ sơ PCCC' : 'Cập nhật Hồ sơ PCCC'}</h3><button onClick={() => setIsPcccModalOpen(false)} disabled={submitting} className="text-gray-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm transition-colors"><X className="w-6 h-6" /></button></div>
            <form onSubmit={handlePcccSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">
                <fieldset disabled={modalMode === 'view'} className="space-y-6 border-0 m-0 p-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-blue-50/40 p-5 rounded-xl border border-blue-100 shadow-sm h-full flex flex-col">
                      <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 border-b border-blue-200 pb-2"><FileText size={18}/> 1. Pháp lý & Bảo hiểm</h4>
                      <div className="space-y-4 flex-1">
                        <div><label className="block text-xs font-bold text-gray-700 mb-1">Đơn vị / Cơ sở *</label><select required name="id_don_vi" value={pcccFormData.id_don_vi || ''} onChange={(e) => handleInputChange(e, 'pccc')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-100 outline-none text-gray-600 cursor-not-allowed" style={{ fontFamily: 'monospace, sans-serif' }} disabled><option value={selectedUnitId || ''}>{donViMap[selectedUnitId || ''] || selectedUnitId}</option></select></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Giấy phép PCCC</label><select name="giay_phep_pccc" value={pcccFormData.giay_phep_pccc || 'Nghiệm thu'} onChange={(e) => handleInputChange(e, 'pccc')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500 font-bold text-emerald-700"><option value="Nghiệm thu">Nghiệm thu</option><option value="Đã phê duyệt">Đã phê duyệt</option><option value="Chưa có">Chưa có</option></select></div>
                          <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Bảo hiểm Cháy nổ</label><select name="bao_hiem_chay_no" value={pcccFormData.bao_hiem_chay_no || 'Có'} onChange={(e) => handleInputChange(e, 'pccc')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500"><option value="Có">Có</option><option value="Không">Không</option></select></div>
                        </div>
                        {pcccFormData.bao_hiem_chay_no === 'Có' && (<div><label className="block text-[10px] font-bold text-red-600 mb-1 uppercase">Ngày hết hạn Bảo Hiểm *</label><input type="date" name="ngay_het_han_bh" value={pcccFormData.ngay_het_han_bh ? pcccFormData.ngay_het_han_bh.split('T')[0] : ''} onChange={(e) => handleInputChange(e, 'pccc')} className="w-full p-2 border border-red-300 rounded-lg bg-red-50 outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-700 text-sm" /></div>)}
                        <div><label className="block text-[10px] font-bold text-purple-700 mb-1 uppercase">Link Phương án CC (Drive/PDF)</label><div className="relative"><LinkIcon className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} /><input type="url" name="link_phuong_an_pccc" value={pcccFormData.link_phuong_an_pccc || ''} onChange={(e) => handleInputChange(e, 'pccc')} className="w-full pl-7 pr-2 py-2 border border-purple-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-purple-500 text-blue-600 text-sm" placeholder="Dán link..." /></div></div>
                      </div>
                    </div>
                    <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-100 shadow-sm h-full flex flex-col">
                      <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2 border-b border-emerald-200 pb-2"><Users size={18}/> 2. Đội PCCC Cơ sở & Diễn tập</h4>
                      <div className="space-y-4 flex-1">
                        <div className="grid grid-cols-1 gap-4"><div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Đội trưởng PCCC</label><input type="text" name="ho_ten_doi_truong" value={pcccFormData.ho_ten_doi_truong || ''} onChange={(e) => handleInputChange(e, 'pccc')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-[#05469B]" placeholder="Họ và tên..." /></div></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Chức vụ</label><input type="text" name="chuc_vu" value={pcccFormData.chuc_vu || ''} onChange={(e) => handleInputChange(e, 'pccc')} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="VD: Trưởng phòng..." /></div>
                          <div><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">SĐT Đội trưởng</label><input type="text" name="sdt_doi_truong" value={pcccFormData.sdt_doi_truong || ''} onChange={(e) => handleInputChange(e, 'pccc')} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="xxxx xxx xxx" /></div>
                        </div>
                        <div className="grid grid-cols-4 gap-3 border-t border-emerald-100 pt-4">
                          <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Users size={12} className="text-emerald-600"/> Tổng Thành viên</label><input type="number" name="tong_sl_thanh_vien" value={pcccFormData.tong_sl_thanh_vien || ''} onChange={(e) => handleInputChange(e, 'pccc')} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-800" placeholder="Số lượng..." /></div>
                          <div className="col-span-1"><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Sun size={12} className="text-orange-500"/> Ngày</label><input type="number" name="sl_huy_dong_ban_ngay" value={pcccFormData.sl_huy_dong_ban_ngay || ''} onChange={(e) => handleInputChange(e, 'pccc')} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="SL..." /></div>
                          <div className="col-span-1"><label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><Moon size={12} className="text-indigo-500"/> Đêm</label><input type="number" name="sl_huy_dong_ban_dem" value={pcccFormData.sl_huy_dong_ban_dem || ''} onChange={(e) => handleInputChange(e, 'pccc')} className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="SL..." /></div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 border-t border-emerald-100 pt-4"><div><label className="block text-[10px] font-bold text-emerald-700 mb-1 uppercase">Ngày Diễn tập gần nhất</label><input type="date" name="ngay_dien_tap" value={pcccFormData.ngay_dien_tap ? pcccFormData.ngay_dien_tap.split('T')[0] : ''} onChange={(e) => handleInputChange(e, 'pccc')} className="w-full p-2 border border-emerald-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-800 font-bold text-sm" /></div></div>
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
                          <select name={sys.key} value={pcccFormData[sys.key] || (sys.key === 'ht_chua_chay_tu_dong_nuoc' ? 'Không' : 'Có')} onChange={(e) => handleInputChange(e, 'pccc')} className="w-full p-2 text-xs font-bold border border-gray-200 rounded outline-none focus:ring-2 focus:ring-orange-500 text-[#05469B] bg-blue-50 mt-auto"><option value="Có">Có</option><option value="Không">Không</option></select>
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
                              const standardOptions = getAvailableEquipmentGroups(pcccFormData);
                              const isCustomUI = eq.nhom_he_thong === 'Khác' || (eq.nhom_he_thong !== '' && !standardOptions.includes(eq.nhom_he_thong));

                              return (
                                <tr key={idx} className="hover:bg-orange-50/50 transition-colors bg-white">
                                  <td className="p-1.5">
                                    {isCustomUI ? (
                                      <div className="flex items-center relative w-full">
                                        <input type="text" value={eq.nhom_he_thong === 'Khác' ? '' : eq.nhom_he_thong} onChange={e => handleEquipmentChange(idx, 'nhom_he_thong', e.target.value || 'Khác')} className="w-full p-1.5 text-xs border border-blue-300 rounded outline-none focus:border-blue-500 bg-blue-50 pr-6" placeholder="Tự nhập tên..." autoFocus />
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
                          <input type="text" name={contact.key} value={pcccFormData[contact.key] || contact.def} onChange={(e) => handleInputChange(e, 'pccc')} className={`w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-sm ${contact.bg} ${contact.key==='sdt_pccc'?'border-red-300 font-bold':''}`} placeholder="xxxx xxx xxx" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div><label className="block text-[10px] font-bold text-orange-600 mb-1 uppercase">Khu vực rủi ro cháy nổ cao</label><textarea name="khu_vuc_rui_ro_cao" value={pcccFormData.khu_vuc_rui_ro_cao || ''} onChange={(e) => handleInputChange(e, 'pccc')} rows={2} className="w-full p-2 border border-orange-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none" placeholder="VD: Kho sơn tĩnh điện, Kho xăng dầu..."></textarea></div>
                      <div><label className="block text-[10px] font-bold text-red-600 mb-1 uppercase">Lỗi / Tồn tại chưa khắc phục (CA Yêu cầu)</label><textarea name="loi_ton_tai_chua_khac_phuc" value={pcccFormData.loi_ton_tai_chua_khac_phuc || ''} onChange={(e) => handleInputChange(e, 'pccc')} rows={2} className="w-full p-2 border border-red-300 rounded-lg bg-red-50 text-red-800 font-medium outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none" placeholder="Ghi nhận các lỗi hệ thống..."></textarea></div>
                    </div>
                  </div>

                </fieldset>
              </div>

              <div className="p-5 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50 rounded-b-2xl">
                <button type="button" onClick={() => setIsPcccModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-300 rounded-xl font-bold transition-colors">Đóng</button>
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

      {/* 7. MODAL ATVSLĐ */}
      {isAtvsldModalOpen && (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 ${!isListCollapsed ? 'lg:pl-80' : ''}`}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between p-5 border-b border-emerald-100 bg-emerald-50 rounded-t-2xl shrink-0">
              <h3 className="text-xl font-bold text-emerald-800 flex items-center gap-2"><HardHat size={24}/> {atvsldFormData.id ? 'Cập nhật Hồ sơ ATVSLĐ' : 'Tạo Hồ sơ ATVSLĐ'}</h3>
              <button onClick={() => setIsAtvsldModalOpen(false)} disabled={submitting} className="text-emerald-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleAtvsldSave} className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* CỘT 1 */}
                <div className="space-y-6">
                  <div className="bg-blue-50/40 p-5 rounded-xl border border-blue-100 shadow-sm">
                    <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 border-b border-blue-200 pb-2"><Users size={18}/> 1. Tổ chức & Nhân sự</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Người phụ trách ATVSLĐ</label><input type="text" name="nguoi_phu_trach" value={atvsldFormData.nguoi_phu_trach || ''} onChange={(e) => handleInputChange(e, 'atvsld')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" placeholder="Họ và tên..." /></div>
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">Mạng lưới ATVS Viên (Người)</label><input type="number" name="so_luong_mang_luoi" value={atvsldFormData.so_luong_mang_luoi || ''} onChange={(e) => handleInputChange(e, 'atvsld')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Tỷ lệ Cấp phát BHLĐ</label><select name="ty_le_cap_bhld" value={atvsldFormData.ty_le_cap_bhld || 'Đầy đủ'} onChange={(e) => handleInputChange(e, 'atvsld')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500"><option value="Đầy đủ">Đầy đủ</option><option value="Đang thiếu">Đang thiếu / Chờ cấp</option></select></div>
                      <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Link Quyết định / Quy trình / Kế hoạch năm</label><input type="url" name="link_ho_so_quy_dinh" value={atvsldFormData.link_ho_so_quy_dinh || ''} onChange={(e) => handleInputChange(e, 'atvsld')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500 text-blue-600" placeholder="https://drive.google.com/..." /></div>
                    </div>
                  </div>
                  <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-100 shadow-sm">
                    <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2 border-b border-emerald-200 pb-2"><Shield size={18}/> 2. Sức khỏe & Huấn luyện</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Ngày Huấn luyện gần nhất</label><input type="date" name="ngay_huan_luyen_gan_nhat" value={atvsldFormData.ngay_huan_luyen_gan_nhat ? atvsldFormData.ngay_huan_luyen_gan_nhat.split('T')[0] : ''} onChange={(e) => handleInputChange(e, 'atvsld')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                      <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Tỷ lệ hoàn thành HL (%)</label><input type="text" name="ty_le_hoan_thanh_hl" value={atvsldFormData.ty_le_hoan_thanh_hl || ''} onChange={(e) => handleInputChange(e, 'atvsld')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-emerald-500" placeholder="VD: 100%" /></div>
                      <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Ngày Khám SK Định kỳ</label><input type="date" name="ngay_ksk" value={atvsldFormData.ngay_ksk ? atvsldFormData.ngay_ksk.split('T')[0] : ''} onChange={(e) => handleInputChange(e, 'atvsld')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700" /></div>
                      <div><label className="block text-[10px] font-bold text-orange-600 mb-1 uppercase">Ngày Khám Bệnh Nghề nghiệp</label><input type="date" name="nngay_kham_bnn" value={atvsldFormData.nngay_kham_bnn ? atvsldFormData.nngay_kham_bnn.split('T')[0] : ''} onChange={(e) => handleInputChange(e, 'atvsld')} className="w-full p-2.5 border border-orange-200 rounded-lg bg-orange-50 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-700" title="Dành cho LĐ Nặng nhọc/Độc hại" /></div>
                    </div>
                  </div>
                </div>

                {/* CỘT 2 */}
                <div className="space-y-6">
                  <div className="bg-orange-50/40 p-5 rounded-xl border border-orange-100 shadow-sm">
                    <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2 border-b border-orange-200 pb-2"><Settings size={18}/> 3. Máy móc & Môi trường</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">Tổng Thiết bị Nghiêm ngặt</label><input type="number" name="so_luong_thiet_bi_nghiem_ngat" value={atvsldFormData.so_luong_thiet_bi_nghiem_ngat || ''} onChange={(e) => handleInputChange(e, 'atvsld')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500" placeholder="Thang nâng, máy nén..." /></div>
                      <div><label className="block text-xs font-bold text-red-600 mb-1">Thiết bị Quá hạn Kiểm định</label><input type="number" name="so_luong_thiet_bi_qua_han_kt" value={atvsldFormData.so_luong_thiet_bi_qua_han_kt || '0'} onChange={(e) => handleInputChange(e, 'atvsld')} className="w-full p-2.5 border border-red-300 rounded-lg bg-red-50 outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-700" /></div>
                      <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Ngày Đo kiểm Môi trường LĐ gần nhất</label><input type="date" name="ngay_quan_trac_mt" value={atvsldFormData.ngay_quan_trac_mt ? atvsldFormData.ngay_quan_trac_mt.split('T')[0] : ''} onChange={(e) => handleInputChange(e, 'atvsld')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-700" /></div>
                    </div>
                  </div>

                  <div className="bg-red-50/40 p-5 rounded-xl border border-red-200 shadow-sm">
                    <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2 border-b border-red-200 pb-2"><AlertCircle size={18}/> 4. Hiện trường & Sự cố</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Ngày Tự KT / Checklist</label><input type="date" name="ngay_tu_kiem_tra" value={atvsldFormData.ngay_tu_kiem_tra ? atvsldFormData.ngay_tu_kiem_tra.split('T')[0] : ''} onChange={(e) => handleInputChange(e, 'atvsld')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500" /></div>
                        <div><label className="block text-[10px] font-bold text-red-600 mb-1 uppercase">Số vụ Tai nạn LĐ (Năm)</label><input type="number" name="so_tai_nan_trong_nam" value={atvsldFormData.so_tai_nan_trong_nam || '0'} onChange={(e) => handleInputChange(e, 'atvsld')} className="w-full p-2.5 border border-red-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-700" /></div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-red-700 mb-1">Các rủi ro / Lỗi hiện trường cần khắc phục</label>
                        <textarea name="cac_loi_hien_truong" value={atvsldFormData.cac_loi_hien_truong || ''} onChange={(e) => handleInputChange(e, 'atvsld')} rows={2} className="w-full p-2.5 border border-red-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 resize-none font-medium text-red-800" placeholder="VD: Sàn xưởng trơn trượt, chưa đeo dây đai an toàn..."></textarea>
                      </div>
                      <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Link Biên bản tuần tra (Checklist PDF)</label><input type="url" name="link_bien_ban_kiem_tra" value={atvsldFormData.link_bien_ban_kiem_tra || ''} onChange={(e) => handleInputChange(e, 'atvsld')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 text-blue-600" /></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-gray-100 flex justify-end gap-3 mt-8 shrink-0">
                <button type="button" onClick={() => setIsAtvsldModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition-colors">Hủy</button>
                <button type="submit" disabled={submitting} className="px-8 py-3 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-colors">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Lưu ATVSLĐ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL PCTT */}
      {isPcttModalOpen && (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 ${!isListCollapsed ? 'lg:pl-80' : ''}`}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between p-5 border-b border-blue-100 bg-blue-50 rounded-t-2xl shrink-0">
              <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2"><CloudLightning size={24}/> {pcttFormData.id ? 'Cập nhật Hồ sơ PCTT & Bảo hiểm' : 'Tạo Hồ sơ PCTT'}</h3>
              <button onClick={() => setIsPcttModalOpen(false)} disabled={submitting} className="text-blue-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handlePcttSave} className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2"><Users size={18}/> 1. Tổ chức Đội PCTT & Phương án</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Đội trưởng chỉ huy PCTT</label><input type="text" name="doi_truong_pctt" value={pcttFormData.doi_truong_pctt || ''} onChange={(e) => handleInputChange(e, 'pctt')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" placeholder="VD: GĐ Showroom..." /></div>
                      <div><label className="block text-xs font-bold text-gray-700 mb-1">Lực lượng ứng phó (Người)</label><input type="number" name="sl_nhan_su_doi" value={pcttFormData.sl_nhan_su_doi || ''} onChange={(e) => handleInputChange(e, 'pctt')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" /></div>
                      <div className="col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Vị trí di dời xe & tài sản an toàn</label><textarea name="vi_tri_di_doi" value={pcttFormData.vi_tri_di_doi || ''} onChange={(e) => handleInputChange(e, 'pctt')} rows={2} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Mô tả bãi đỗ xe tránh ngập lụt, cây xanh..."></textarea></div>
                      <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Link Phương án PCTT (PDF/Drive)</label><input type="url" name="link_pa_pctt" value={pcttFormData.link_pa_pctt || ''} onChange={(e) => handleInputChange(e, 'pctt')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 text-blue-600" /></div>
                    </div>
                  </div>
                  <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-100 shadow-sm">
                    <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2 border-b border-emerald-200 pb-2"><Shield size={18}/> 2. Bảo hiểm & Quản trị Tài sản</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Bảo hiểm mọi rủi ro TS</label><select name="tinh_trang_bao_hiem" value={pcttFormData.tinh_trang_bao_hiem || 'Đầy đủ'} onChange={(e) => handleInputChange(e, 'pctt')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"><option value="Đầy đủ">Đầy đủ</option><option value="Đang thiếu">Đang thiếu / Chưa mua</option></select></div>
                      <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Ngày chốt TS gửi Kế toán</label><input type="date" name="ngay_cap_nhat_tai_san" value={pcttFormData.ngay_cap_nhat_tai_san ? pcttFormData.ngay_cap_nhat_tai_san.split('T')[0] : ''} onChange={(e) => handleInputChange(e, 'pctt')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" title="Chốt biến động kho xe, phụ tùng định kỳ" /></div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-orange-50/40 p-5 rounded-xl border border-orange-100 shadow-sm">
                    <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2 border-b border-orange-200 pb-2"><HardHat size={18}/> 3. Hạ tầng & Bảo trì</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Ngày KT/Bảo trì PCTT</label><input type="date" name="ngay_kiem_tra_pctt" value={pcttFormData.ngay_kiem_tra_pctt ? pcttFormData.ngay_kiem_tra_pctt.split('T')[0] : ''} onChange={(e) => handleInputChange(e, 'pctt')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500" /></div>
                      <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Khơi thông cống / Mái tôn</label><select name="tinh_trang_ha_tang" value={pcttFormData.tinh_trang_ha_tang || 'Đã hoàn thành'} onChange={(e) => handleInputChange(e, 'pctt')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500"><option value="Đã hoàn thành">Đã hoàn thành</option><option value="Chờ xử lý">Chờ xử lý / Tắc nghẽn</option></select></div>
                    </div>
                  </div>
                  <div className="bg-red-50/40 p-5 rounded-xl border border-red-200 shadow-sm">
                    <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2 border-b border-red-200 pb-2"><AlertCircle size={18}/> 4. Thiệt hại & Khắc phục</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-[10px] font-bold text-red-600 mb-1 uppercase">Số đợt bão lụt / thiên tai</label><input type="number" name="so_vu_thien_tai" value={pcttFormData.so_vu_thien_tai || '0'} onChange={(e) => handleInputChange(e, 'pctt')} className="w-full p-2.5 border border-red-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-700" /></div>
                        <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Tình trạng khắc phục</label><select name="tinh_trang_khac_phuc" value={pcttFormData.tinh_trang_khac_phuc || 'Không có sự cố'} onChange={(e) => handleInputChange(e, 'pctt')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500"><option value="Không có sự cố">Không có sự cố</option><option value="Đang xử lý">Đang xử lý</option><option value="Đã hoàn thành">Đã hoàn thành</option></select></div>
                      </div>
                      <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Link Hồ sơ bảo hiểm (Hình ảnh, xác nhận)</label><input type="url" name="link_ho_so_boi_thuong" value={pcttFormData.link_ho_so_boi_thuong || ''} onChange={(e) => handleInputChange(e, 'pctt')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 text-blue-600" /></div>
                      <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Ghi chú tổn thất</label><textarea name="ghi_chu" value={pcttFormData.ghi_chu || ''} onChange={(e) => handleInputChange(e, 'pctt')} rows={2} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 resize-none"></textarea></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-5 border-t border-gray-100 flex justify-end gap-3 mt-8 shrink-0">
                <button type="button" onClick={() => setIsPcttModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition-colors">Hủy</button>
                <button type="submit" disabled={submitting} className="px-8 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-colors">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Lưu PCTT</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL CONFIRM XÓA */}
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

      {/* 10. MODAL DANH BẠ KHẨN CẤP (GỌI NHANH) */}
      {isEmergencyContactOpen && (
        <div className={`fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 ${!isListCollapsed ? 'lg:pl-80' : ''}`}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in duration-200 overflow-hidden">
            <div className="bg-red-600 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2 text-lg"><Siren size={22}/> Danh bạ Khẩn cấp</h3>
              <button onClick={() => setIsEmergencyContactOpen(false)} className="hover:bg-red-700 p-1.5 rounded-full transition-colors shadow-sm"><X size={20}/></button>
            </div>
            
            <div className="p-0 max-h-[75vh] overflow-y-auto custom-scrollbar divide-y divide-gray-100">
              
              {/* PHẦN 1: BAN CHỈ HUY ĐƠN VỊ */}
              <div className="bg-blue-50/30">
                <h4 className="px-4 py-2 text-[10px] font-black text-blue-800 uppercase tracking-wider bg-blue-100/50">Ban Chỉ Huy Đơn Vị</h4>
                
                {/* Gọi Lãnh đạo */}
                {leader && (leader.sdt_ca_nhan || leader.sdt_cong_ty) && (
                  <div className="flex items-center justify-between p-4 hover:bg-white transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><UserCheck size={16}/></div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Lãnh đạo Đơn vị</p>
                        <p className="font-bold text-gray-800 text-sm leading-tight">{leader.ho_ten}</p>
                        <p className="text-[#05469B] font-black text-sm mt-0.5">{formatPhoneNumber(leader.sdt_ca_nhan || leader.sdt_cong_ty)}</p>
                      </div>
                    </div>
                    <a href={`tel:${String(leader.sdt_ca_nhan || leader.sdt_cong_ty).replace(/[^\d+]/g, '')}`} className="w-10 h-10 shrink-0 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-md"><PhoneCall size={18}/></a>
                  </div>
                )}

                {/* Gọi PT DVHT */}
                {dvht1 && (dvht1.sdt_ca_nhan || dvht1.sdt_cong_ty) && (
                  <div className="flex items-center justify-between p-4 hover:bg-white transition-colors border-t border-blue-50">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><Briefcase size={16}/></div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Phụ trách DV Hỗ trợ KD</p>
                        <p className="font-bold text-gray-800 text-sm leading-tight">{dvht1.ho_ten}</p>
                        <p className="text-[#05469B] font-black text-sm mt-0.5">{formatPhoneNumber(dvht1.sdt_ca_nhan || dvht1.sdt_cong_ty)}</p>
                      </div>
                    </div>
                    <a href={`tel:${String(dvht1.sdt_ca_nhan || dvht1.sdt_cong_ty).replace(/[^\d+]/g, '')}`} className="w-10 h-10 shrink-0 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-md"><PhoneCall size={18}/></a>
                  </div>
                )}

                {/* Gọi Đội trưởng PCCC */}
                {currentPccc && currentPccc.sdt_doi_truong && (
                  <div className="flex items-center justify-between p-4 hover:bg-white transition-colors border-t border-blue-50">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><HardHat size={16}/></div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Đội trưởng PCCC</p>
                        <p className="font-bold text-gray-800 text-sm leading-tight">{currentPccc.ho_ten_doi_truong}</p>
                        <p className="text-[#05469B] font-black text-sm mt-0.5">{formatPhoneNumber(currentPccc.sdt_doi_truong)}</p>
                      </div>
                    </div>
                    <a href={`tel:${String(currentPccc.sdt_doi_truong).replace(/[^\d+]/g, '')}`} className="w-10 h-10 shrink-0 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-md"><PhoneCall size={18}/></a>
                  </div>
                )}
              </div>

              {/* PHẦN 2: CƠ QUAN CHỨC NĂNG */}
              {currentPccc && (
                <div className="bg-red-50/30">
                  <h4 className="px-4 py-2 text-[10px] font-black text-red-800 uppercase tracking-wider bg-red-100/50">Cơ quan Chức năng</h4>
                  {EMERGENCY_CONTACTS.map(contact => {
                    const phone = currentPccc[contact.key];
                    if (!phone) return null;
                    return (
                      <div key={contact.key} className="flex items-center justify-between p-4 hover:bg-white transition-colors border-b border-red-50 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0"><AlertTriangle size={16}/></div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm leading-tight">{contact.label}</p>
                            <p className="text-red-600 font-black text-sm mt-0.5">{formatPhoneNumber(phone)}</p>
                          </div>
                        </div>
                        <a href={`tel:${String(phone).replace(/[^\d+]/g, '')}`} className="w-10 h-10 shrink-0 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-md"><PhoneCall size={18}/></a>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* PHẦN 3: NẾU TRỐNG TOÀN BỘ */}
              {(!currentPccc || (!currentPccc.sdt_doi_truong && !currentPccc.sdt_pccc)) && !leader && !dvht1 && (
                <div className="p-8 text-center text-gray-400">
                  <PhoneCall size={40} className="mx-auto mb-3 opacity-20"/>
                  <p className="text-sm font-medium">Chưa có dữ liệu danh bạ cho đơn vị này.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
                 
            