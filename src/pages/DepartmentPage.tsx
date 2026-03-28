import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, X, AlertCircle, Loader2, Save, 
  Building2, MapPin, ChevronDown, ChevronRight, Phone, Mail as MailIcon, 
  PanelLeftClose, PanelLeftOpen, Shield, Camera, Users, Map, 
  Link as LinkIcon, FileText, Briefcase, ExternalLink,
  Maximize2, Layers, DoorOpen, Coffee, UserCheck, Copy, CheckCheck,
  Flame, HardHat, CloudLightning, Utensils, Monitor,
  Projector, Video, LayoutTemplate, MousePointerClick, 
  SquarePen, PenTool, Wand2, Compass, Clock, Sun, Moon,
  MonitorSmartphone, Tag, Car, Pocket, Store, Warehouse
} from 'lucide-react';
import { apiService } from '../services/api';
import { DonVi, Personnel, AnNinh, PhapNhan, PhongHop, TS_Xe, ThietBi } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { buildHierarchicalOptions, getUnitEmoji } from '../utils/hierarchy'; // IMPORT TÍNH NĂNG VẼ CÂY

// 🟢 [KHU VỰC: HÀM TIỆN ÍCH CHUNG - BỌC THÉP TÊN CỘT GOOGLE SHEETS]
const safeGet = (obj: any, key: string) => {
  if (!obj) return '';
  if (obj[key] !== undefined) return obj[key];
  const lowerKey = key.toLowerCase();
  for (const k in obj) {
    if (k.toLowerCase() === lowerKey) return obj[k];
  }
  return '';
};

const getSecId = (sec: any) => safeGet(sec, 'ID_AnNinh') || safeGet(sec, 'id');
const getPvhcId = (p: any) => safeGet(p, 'ID_PVHC') || safeGet(p, 'id');
const getUnitIdSafe = (item: any) => safeGet(item, 'ID_DonVi');

// 👉 Cập nhật giá trị mặc định chuẩn theo list mới
const initialFormState: Partial<DonVi> = {
  ID_DonVi: '', TenDonVi: '', CapQuanLy: '', DiaChi: '', DienTich: '', SoTang: '', SoHam: '',
  SoPhongCho: '', SoCong: '', LuotKhachBQ: '', TongNhanSu: '', loaiHinh: 'Showroom Quản trị', trangThai: 'Hoạt động', Phia: 'CTTT Phía Nam'
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

export default function DepartmentPage() {
  const { user } = useAuth();
  
  // 🟢 [KHU VỰC: QUẢN LÝ DỮ LIỆU (STATES)]
  const [data, setData] = useState<DonVi[]>([]);
  const [personnelData, setPersonnelData] = useState<Personnel[]>([]);
  const [anNinhData, setAnNinhData] = useState<any[]>([]); 
  const [phapNhanData, setPhapNhanData] = useState<PhapNhan[]>([]); 
  const [phongHopData, setPhongHopData] = useState<PhongHop[]>([]); 
  const [xeData, setXeData] = useState<TS_Xe[]>([]);
  const [thietBiData, setThietBiData] = useState<ThietBi[]>([]);
  const [pvhcData, setPvhcData] = useState<any[]>([]); 

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
  const [formData, setFormData] = useState<Partial<DonVi>>(initialFormState);
  
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
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'donvi' | 'phapnhan' | 'phonghop'} | null>(null);

  // 🟢 [KHU VỰC: LẤY DỮ LIỆU TỪ GOOGLE SHEETS]
  const loadData = async () => {
    setLoading(true); setError(null);
    try { 
      const [dvResult, nsResult, anResult, pnResult, phResult, xeResult, tbResult, pvhcResult] = await Promise.all([
        apiService.getDonVi(), apiService.getPersonnel(), apiService.getAnNinh(), apiService.getPhapNhan(), 
        apiService.getPhongHop ? apiService.getPhongHop() : Promise.resolve([]),
        apiService.getXe ? apiService.getXe().catch(() => []) : Promise.resolve([]),
        apiService.getThietBi ? apiService.getThietBi().catch(() => []) : Promise.resolve([]),
        apiService.getPVHC ? apiService.getPVHC().catch(() => []) : Promise.resolve([])
      ]);
      setData(dvResult); setPersonnelData(nsResult); setAnNinhData(anResult || []); setPhapNhanData(pnResult || []); setPhongHopData(phResult || []);
      setXeData(xeResult || []); setThietBiData(tbResult || []); setPvhcData(pvhcResult || []);
    } 
    catch (err: any) { setError(err.message || 'Lỗi tải dữ liệu. Vui lòng kiểm tra lại kết nối mạng.'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  // 🟢 [KHU VỰC TỐI QUAN TRỌNG: THUẬT TOÁN ĐỆ QUY TÌM ĐƠN VỊ CON CHÁU]
  const getAllSubordinateIds = (unitId: string, allUnits: DonVi[]): string[] => {
    const subordinates = allUnits.filter(u => u.CapQuanLy === unitId);
    let ids = subordinates.map(u => u.ID_DonVi);
    subordinates.forEach(sub => {
      ids = [...ids, ...getAllSubordinateIds(sub.ID_DonVi, allUnits)]; 
    });
    return ids;
  };

  const allowedDonViIds = useMemo(() => {
    if (!user) return [];
    if (user.idDonVi === 'ALL') return data.map(dv => dv.ID_DonVi);
    
    const subIds = getAllSubordinateIds(user.idDonVi, data);
    const allAllowed = [user.idDonVi, ...subIds];
    
    return data.filter(dv => allAllowed.includes(dv.ID_DonVi)).map(dv => dv.ID_DonVi);
  }, [user, data]);

  const filteredData = useMemo(() => {
    let baseUnits = data.filter(item => allowedDonViIds.includes(item.ID_DonVi));
    if (!searchTerm) return baseUnits;

    const lower = searchTerm.toLowerCase();
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
  }, [data, searchTerm, allowedDonViIds]);

  useEffect(() => {
    if (filteredData.length > 0 && !selectedUnitId) {
      setSelectedUnitId(filteredData[0].ID_DonVi);
    }
  }, [filteredData, selectedUnitId]);

  const parentUnits = useMemo(() => filteredData.filter(item => item.CapQuanLy === 'HO' || !item.CapQuanLy), [filteredData]);
  const getChildUnits = (parentId: string) => filteredData.filter(item => item.CapQuanLy === parentId);

  const { vpdhUnits, ctttNamUnits, ctttBacUnits, otherUnits } = useMemo(() => {
    const vpdh = parentUnits.filter(u => String(u.Phia || '').toLowerCase().includes('vpđh') || String(u.loaiHinh || '').toLowerCase().includes('tổng công ty') || String(u.loaiHinh || '').toLowerCase().includes('văn phòng'));
    const ctttNam = parentUnits.filter(u => !vpdh.includes(u) && String(u.Phia || '').toLowerCase().includes('nam'));
    const ctttBac = parentUnits.filter(u => !vpdh.includes(u) && !ctttNam.includes(u) && String(u.Phia || '').toLowerCase().includes('bắc'));
    const others = parentUnits.filter(u => !vpdh.includes(u) && !ctttNam.includes(u) && !ctttBac.includes(u));
    return { vpdhUnits: vpdh, ctttNamUnits: ctttNam, ctttBacUnits: ctttBac, otherUnits: others };
  }, [parentUnits]);

  const toggleParent = (parentId: string) => setExpandedParents(prev => prev.includes(parentId) ? prev.filter(id => id !== parentId) : [...prev, parentId]);

  const selectedUnit = useMemo(() => data.find(item => item.ID_DonVi === selectedUnitId) || null, [data, selectedUnitId]);
  
  const donViMap = useMemo(() => {
    const map: Record<string, string> = {};
    data.forEach(dv => { map[dv.ID_DonVi] = dv.TenDonVi; });
    return map;
  }, [data]);

  const selectedUnitSubordinates = useMemo(() => {
    if (!selectedUnitId) return [];
    const subIds = getAllSubordinateIds(selectedUnitId, data);
    return [selectedUnitId, ...subIds];
  }, [selectedUnitId, data]);

  // 🟢 [KHU VỰC: LỌC DỮ LIỆU HIỆN TẠI (CHỈ MỘT ĐƠN VỊ)]
  const currentAnNinh = useMemo(() => anNinhData.find(item => getUnitIdSafe(item) === selectedUnitId) || null, [anNinhData, selectedUnitId]);
  const currentPvhc = useMemo(() => pvhcData.find(item => getUnitIdSafe(item) === selectedUnitId) || null, [pvhcData, selectedUnitId]);
  
  const currentPvhcSafe = useMemo(() => {
    if (!currentPvhc) return null;
    return {
      Hienhuu: safeGet(currentPvhc, 'Hienhuu'),
      DinhBien: safeGet(currentPvhc, 'DinhBien'),
      PVHC_KhachCho: safeGet(currentPvhc, 'PVHC_KhachCho'),
      PVHC_Vesinh: safeGet(currentPvhc, 'PVHC_Vesinh'),
      PVHC_DichVu: safeGet(currentPvhc, 'PVHC_DichVu'),
      Vitri: safeGet(currentPvhc, 'Vitri'),
      NCC_DichVu: safeGet(currentPvhc, 'NCC_DichVu'),
      ChiPhiThue: safeGet(currentPvhc, 'ChiPhiThue')
    };
  }, [currentPvhc]);

  const currentPhapNhanList = useMemo(() => {
    return phapNhanData.filter(item => selectedUnitSubordinates.includes(getUnitIdSafe(item)));
  }, [phapNhanData, selectedUnitSubordinates]);

  const currentPhongHopList = useMemo(() => phongHopData.filter(item => getUnitIdSafe(item) === selectedUnitId), [phongHopData, selectedUnitId]);
  const unitStaff = useMemo(() => personnelData.filter(p => getUnitIdSafe(p) === selectedUnitId), [personnelData, selectedUnitId]);

  // 🟢 [KHU VỰC: CÁC HÀM THỐNG KÊ (AGGREGATION) CHO CÔNG TY MẸ]
  const isParentUnit = selectedUnitSubordinates.length > 1;

  const aggregatedStats = useMemo(() => {
    if (!isParentUnit) return null;
    let totalDienTich = 0, totalPhongCho = 0, totalCong = 0, totalKhach = 0, totalNhanSu = 0, childCount = 0;

    data.forEach(dv => {
      if (selectedUnitSubordinates.includes(dv.ID_DonVi) && dv.trangThai === 'Hoạt động') {
        if (dv.ID_DonVi !== selectedUnitId) { childCount++; }
        totalDienTich += Number(dv.DienTich) || 0;
        totalPhongCho += Number(dv.SoPhongCho) || 0;
        totalCong += Number(dv.SoCong) || 0;
        totalKhach += Number(dv.LuotKhachBQ) || 0;
        totalNhanSu += Number(dv.TongNhanSu) || 0;
      }
    });

    return { childCount, totalDienTich, totalPhongCho, totalCong, totalKhach, totalNhanSu };
  }, [isParentUnit, selectedUnitSubordinates, data, selectedUnitId]);

  const aggregatedSecurity = useMemo(() => {
    if (!isParentUnit) return null;
    let tongANBV = 0, noiBo = 0, dichVu = 0, chiPhi = 0;
    let tongCam = 0, camHD = 0, camHu = 0;
    
    data.forEach(dv => {
      if (selectedUnitSubordinates.includes(dv.ID_DonVi) && dv.trangThai === 'Hoạt động') {
        const sec = anNinhData.find(a => getUnitIdSafe(a) === dv.ID_DonVi);
        if (sec) {
          tongANBV += Number(safeGet(sec, 'TongANBV')) || 0;
          noiBo += Number(safeGet(sec, 'SoBaoVeNoiBo')) || 0;
          dichVu += Number(safeGet(sec, 'SoBaoVeDichvu')) || 0;
          chiPhi += Number(safeGet(sec, 'ChiPhiThue')) || 0;
          tongCam += Number(safeGet(sec, 'SLCAM')) || 0;
          camHD += Number(safeGet(sec, 'CAMHD')) || 0;
          camHu += Number(safeGet(sec, 'CAMHuHong')) || 0;
        }
      }
    });
    return { tongANBV, noiBo, dichVu, chiPhi, tongCam, camHD, camHu };
  }, [isParentUnit, selectedUnitSubordinates, anNinhData, data]);

  const aggregatedPvhc = useMemo(() => {
    if (!isParentUnit) return null;
    let dinhBien = 0, hienHuu = 0, khachCho = 0, veSinh = 0, dichVu = 0, chiPhi = 0;
    
    data.forEach(dv => {
      if (selectedUnitSubordinates.includes(dv.ID_DonVi) && dv.trangThai === 'Hoạt động') {
        const pvhc = pvhcData.find(p => getUnitIdSafe(p) === dv.ID_DonVi);
        if (pvhc) {
          dinhBien += Number(safeGet(pvhc, 'DinhBien')) || 0;
          hienHuu += Number(safeGet(pvhc, 'Hienhuu')) || 0;
          khachCho += Number(safeGet(pvhc, 'PVHC_KhachCho')) || 0;
          veSinh += Number(safeGet(pvhc, 'PVHC_Vesinh')) || 0;
          dichVu += Number(safeGet(pvhc, 'PVHC_DichVu')) || 0;
          chiPhi += Number(safeGet(pvhc, 'ChiPhiThue')) || 0;
        }
      }
    });
    return { dinhBien, hienHuu, khachCho, veSinh, dichVu, chiPhi };
  }, [isParentUnit, selectedUnitSubordinates, pvhcData, data]);

  const currentXeList = useMemo(() => {
    return xeData.filter(item => selectedUnitSubordinates.includes(getUnitIdSafe(item)));
  }, [xeData, selectedUnitSubordinates]);

  const currentTbList = useMemo(() => {
    return thietBiData.filter(item => selectedUnitSubordinates.includes(getUnitIdSafe(item)));
  }, [thietBiData, selectedUnitSubordinates]);

  const xeStats = useMemo(() => {
    const active = currentXeList.filter(x => safeGet(x, 'Hientrang') === 'Đang hoạt động').length;
    const inactive = currentXeList.length - active;
    const grouped: Record<string, { total: number, brands: Record<string, { total: number, models: Record<string, number> }> }> = {};

    currentXeList.forEach(xe => {
      const purpose = safeGet(xe, 'Mucdichsudung') || 'Khác';
      const brand = safeGet(xe, 'HieuXe') || 'Khác';
      const model = safeGet(xe, 'LoaiXe') || 'Không rõ';

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
    const active = currentTbList.filter(t => safeGet(t, 'TinhTrang') === 'Đang sử dụng').length;
    const inactive = currentTbList.length - active;
    const grouped: Record<string, number> = {};
    currentTbList.forEach(tb => {
      const group = safeGet(tb, 'NhomThietBi') || 'Khác';
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
      if (xeCount > 0 || tbCount > 0) {
        stats.push({ id: unitId, name: donViMap[unitId] || unitId, xe: xeCount, tb: tbCount });
      }
    });
    return stats;
  }, [selectedUnitSubordinates, currentXeList, currentTbList, donViMap]);

  const leader = useMemo(() => unitStaff.find(p => p.ID_NhanSu === selectedUnit?.ID_GiamDoc) || unitStaff.find(p => p.PhanLoai === 'Lãnh đạo'), [unitStaff, selectedUnit]);
  const kdXe = useMemo(() => unitStaff.find(p => p.ID_NhanSu === selectedUnit?.ID_PTKDXe) || unitStaff.find(p => String(p.ChucVu || '').toLowerCase().includes('kinh doanh xe') || String(p.ChucVu || '').toLowerCase().includes('kd xe')), [unitStaff, selectedUnit]);
  const kdDvpt = useMemo(() => unitStaff.find(p => p.ID_NhanSu === selectedUnit?.ID_PTKDDVPT) || unitStaff.find(p => String(p.ChucVu || '').toLowerCase().includes('dvpt') || String(p.ChucVu || '').toLowerCase().includes('dịch vụ phụ tùng') || String(p.ChucVu || '').toLowerCase().includes('phó tổng giám đốc')), [unitStaff, selectedUnit]);
  const dvht1 = useMemo(() => unitStaff.find(p => p.ID_NhanSu === selectedUnit?.ID_DVHT1) || unitStaff.find(p => String(p.ChucVu || '').toLowerCase().includes('dvht 1') || String(p.ChucVu || '').toLowerCase().includes('hỗ trợ 1') || String(p.ChucVu || '').toLowerCase().includes('dvht kd 1')), [unitStaff, selectedUnit]);
  const dvht2 = useMemo(() => unitStaff.find(p => p.ID_NhanSu === selectedUnit?.ID_DVHT2) || unitStaff.find(p => String(p.ChucVu || '').toLowerCase().includes('dvht 2') || String(p.ChucVu || '').toLowerCase().includes('hỗ trợ 2') || String(p.ChucVu || '').toLowerCase().includes('dvht kd 2')), [unitStaff, selectedUnit]);
  const ptNhanSu = useMemo(() => unitStaff.find(p => p.ID_NhanSu === selectedUnit?.ID_HCNS) || unitStaff.find(p => String(p.ChucVu || '').toLowerCase().includes('nhân sự') || String(p.ChucVu || '').toLowerCase().includes('hành chính')), [unitStaff, selectedUnit]);

  const isSelectedUnitDimmed = selectedUnit?.trangThai === 'Đại lý' || selectedUnit?.trangThai === 'Đầu tư mới';

  // 🟢 [KHU VỰC: HÀM CẬP NHẬT, THAY ĐỔI FORM]
  const handleButVietChange = (color: string, isChecked: boolean) => {
    let currentColors = phFormData.Butviet ? phFormData.Butviet.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    if (isChecked) {
      if (!currentColors.includes(color)) currentColors.push(color);
    } else {
      currentColors = currentColors.filter((c: string) => c !== color);
    }
    setPhFormData({ ...phFormData, Butviet: currentColors.join(', ') });
  };

  const handleCopyInvoice = (pn: PhapNhan) => {
    const textToCopy = `Tên công ty: ${pn.TenCongty}\nMST: ${pn.MST}\nĐịa chỉ: ${pn.Diachi || ''}\nEmail: ${pn.Mail || ''}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedId(pn.Id_Phapnhan);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleInlineAssign = async (fieldKey: string, idNhanSu: string) => {
    if (!selectedUnit) return;
    const updatedUnit = { ...selectedUnit, [fieldKey]: idNhanSu };
    try {
      await apiService.save(updatedUnit, 'update', 'DM_Donvi');
      setData(prev => prev.map(item => item.ID_DonVi === updatedUnit.ID_DonVi ? updatedUnit : item));
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

    return (
      <div className={`bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-md relative group ${isLarge ? 'md:col-span-2' : ''}`}>
        {!isEditing && !isSavingLocal && person && (
          <button onClick={() => setIsEditing(true)} className="absolute top-2 right-2 p-1.5 bg-white border border-blue-200 text-[#05469B] hover:bg-[#05469B] hover:text-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-all z-20" title="Chuyển người khác"><Edit size={14}/></button>
        )}
        <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 min-h-[50px] flex items-center">
          <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider leading-snug pr-6">{person && !isEditing ? person.ChucVu : title}</h4>
        </div>
        <div className="p-4 flex-1 flex flex-col relative h-full min-h-[110px]">
          {isSavingLocal && <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20"><Loader2 className="animate-spin text-[#05469B] mb-2" size={24}/><span className="text-xs font-bold text-gray-500">Đang lưu...</span></div>}
          {isEditing ? (
            <div className="flex flex-col h-full justify-center">
              <label className="text-xs font-bold text-[#05469B] mb-2">Chọn nhân sự phụ trách:</label>
              <select onChange={onSelectChange} defaultValue={person?.ID_NhanSu || ''} className="w-full p-2 border border-blue-300 rounded-lg bg-blue-50 outline-none focus:ring-2 focus:ring-[#05469B] text-sm font-semibold text-gray-800">
                <option value="">-- Trống (Xóa người này) --</option>
                {unitStaff.map(p => (<option key={p.ID_NhanSu} value={p.ID_NhanSu}>{p.HoTen} ({p.MaNV})</option>))}
              </select>
              <button onClick={() => setIsEditing(false)} className="mt-3 text-xs font-bold text-gray-400 hover:text-red-500 text-center">Hủy thao tác</button>
            </div>
          ) : person ? (
            <>
              <p className={`font-black text-[#05469B] mb-4 ${isLarge ? 'text-xl' : 'text-lg'}`}>{person.HoTen}</p>
              <div className="space-y-2 mt-auto">
                <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-md border border-gray-200 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/50 group/phone">
                  <Phone size={14} className="text-gray-400 shrink-0 group-hover/phone:text-[#05469B]"/>
                  {person.SDT ? <a href={`tel:${person.SDT.replace(/\s/g, '')}`} className="text-sm font-semibold text-gray-700 group-hover/phone:text-[#05469B] w-full" title="Bấm để gọi">{formatPhoneNumber(person.SDT)}</a> : <span className="text-sm font-semibold text-gray-400">---</span>}
                </div>
                <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-md border border-gray-200 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/50 group/mail">
                  <MailIcon size={14} className="text-gray-400 shrink-0 group-hover/mail:text-[#05469B]"/>
                  {person.Email ? <a href={`mailto:${person.Email}`} className="text-sm font-semibold text-gray-700 truncate group-hover/mail:text-[#05469B] w-full" title="Bấm để gửi mail">{person.Email}</a> : <span className="text-sm font-semibold text-gray-400 truncate">---</span>}
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
    setModalMode(mode); setFormData(item ? { ...item } : { ...initialFormState }); setIsModalOpen(true); setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    try {
      await apiService.save(formData, modalMode, "DM_Donvi");
      if (modalMode === 'create') {
        setData(prev => [...prev, formData as DonVi]); setSelectedUnitId(formData.ID_DonVi as string);
      } else {
        setData(prev => prev.map(item => item.ID_DonVi === formData.ID_DonVi ? formData as DonVi : item));
      }
      setIsModalOpen(false); 
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu.'); } 
    finally { setSubmitting(false); }
  };

  const openPnModal = (mode: 'create' | 'update', item?: PhapNhan) => {
    setPnModalMode(mode);
    if (item) { setPnFormData({ ...item }); } 
    else { setPnFormData({ Id_Phapnhan: '', ID_DonVi: selectedUnitId || '', TenCongty: '', MST: '', Diachi: '', GPKD: '', Mail: '' }); }
    setIsPnModalOpen(true);
  };

  const handlePnSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    try {
      const response = await apiService.save(pnFormData, pnModalMode, "PhapNhan");
      if (pnModalMode === 'create') {
        pnFormData.Id_Phapnhan = response.newId; setPhapNhanData(prev => [...prev, pnFormData as PhapNhan]);
      } else {
        setPhapNhanData(prev => prev.map(item => item.Id_Phapnhan === pnFormData.Id_Phapnhan ? pnFormData as PhapNhan : item));
      }
      setIsPnModalOpen(false);
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu Pháp nhân.'); } 
    finally { setSubmitting(false); }
  };

  const openPhModal = (mode: 'create' | 'update', item?: any) => {
    setPhModalMode(mode);
    if (item) { 
      const phId = item.ID_Phonghop || item.iD_Phonghop || item.ID_PhongHop;
      setPhFormData({ ...item, ID_Phonghop: phId }); 
    } 
    else { 
      setPhFormData({ 
        ID_Phonghop: '', ID_DonVi: selectedUnitId || '', Tenphonghop: '', Vitri: '', 
        Succhua: '', TBtrinhchieu: '', TBHopOnline: false, Bangviet: false, 
        Butviet: '', Butchi: '', TBchuyenslide: false, Layout: '', Ghichu: '' 
      }); 
    }
    setIsPhModalOpen(true);
  };

  const handlePhSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    try {
      const response = await apiService.save(phFormData, phModalMode, "PhongHop");
      if (phModalMode === 'create') {
        phFormData.ID_Phonghop = response.newId; 
        setPhongHopData(prev => [...prev, phFormData as PhongHop]);
      } else {
        setPhongHopData(prev => prev.map(item => {
          const itemId = item.ID_Phonghop || item.iD_Phonghop || item.ID_PhongHop;
          return itemId === phFormData.ID_Phonghop ? phFormData as PhongHop : item;
        }));
      }
      setIsPhModalOpen(false);
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu Phòng họp.'); } 
    finally { setSubmitting(false); }
  };

  // 🟢 [KHU VỰC: LƯU LẠI GIÁ TRỊ TỪ FORM CỦA CÁC MODAL BẢNG KHÁC NHAU]
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, formType: 'pn' | 'ph' | 'sec' | 'pvhc' = 'pn') => {
    const { name, value, type } = e.target;
    let finalValue: string | boolean = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    if (formType === 'pn') { setPnFormData(prev => ({ ...prev, [name]: finalValue })); } 
    else if (formType === 'ph') { setPhFormData(prev => ({ ...prev, [name]: finalValue })); } 
    else if (formType === 'sec') {
      if (name === 'ChiPhiThue') finalValue = value.replace(/\D/g, '');
      setSecurityFormData(prev => ({ ...prev, [name]: finalValue }));
    }
    else if (formType === 'pvhc') {
      if (name === 'ChiPhiThue') finalValue = value.replace(/\D/g, '');
      setPvhcFormData((prev: any) => ({ ...prev, [name]: finalValue }));
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return; setSubmitting(true); setError(null);
    try {
      if (itemToDelete.type === 'donvi') {
        await apiService.delete(itemToDelete.id, "DM_Donvi");
        setData(prev => prev.filter(item => item.ID_DonVi !== itemToDelete.id));
        if (selectedUnitId === itemToDelete.id) setSelectedUnitId(null);
      } else if (itemToDelete.type === 'phapnhan') {
        await apiService.delete(itemToDelete.id, "PhapNhan");
        setPhapNhanData(prev => prev.filter(item => item.Id_Phapnhan !== itemToDelete.id));
      } else if (itemToDelete.type === 'phonghop') {
        await apiService.delete(itemToDelete.id, "PhongHop");
        setPhongHopData(prev => prev.filter(item => {
          const itemId = item.ID_Phonghop || item.iD_Phonghop || item.ID_PhongHop;
          return itemId !== itemToDelete.id;
        }));
      }
      setIsConfirmOpen(false); setItemToDelete(null);
    } catch (err: any) { setError(err.message || 'Lỗi xóa dữ liệu.'); } 
    finally { setSubmitting(false); }
  };

  const openSecurityModal = () => {
    if (currentAnNinh) { 
      setSecurityFormData({ ...currentAnNinh, ID_AnNinh: getSecId(currentAnNinh) }); 
    } else {
      setSecurityFormData({
        ID_AnNinh: '', ID_DonVi: selectedUnitId || '', 
        SoBaoVeNoiBo: '', SoBaoVeDichvu: '', VitrBVDV: '', NCC_DichVu: '', ChiPhiThue: '',
        TongANBV: '', DinhbienANBV: '', 
        Ngaycd: '', Ngaytuantra: '', Demcd: '', Demtruantra: '',
        BoTriNghiCa: '',
        SLCAM: '', CAMHD: '', CAMHuHong: '', LyDoHuCam: '', ThoiGianLuu: '', ViTriDatHeThong: '', ViTriGiamSat: '', Link_PhuongAnAN: '',
        TinhHinhKhuVuc: '', TiepGiapTruoc: '', TiepGiapSau: '', TiepGiapTrai: '', TiepGiapPhai: ''
      });
    }
    setIsSecurityModalOpen(true);
  };

  const handleSecuritySave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    const soNB = Number(securityFormData.SoBaoVeNoiBo) || 0;
    const soDV = Number(securityFormData.SoBaoVeDichvu) || 0;
    let finalData: any = { ...securityFormData, TongANBV: soNB + soDV };
    if (soDV < 1) { finalData.VitrBVDV = ''; finalData.NCC_DichVu = ''; finalData.ChiPhiThue = ''; }

    const currentId = getSecId(finalData);
    if (currentId) {
      finalData.ID_AnNinh = currentId;
      finalData.iD_AnNinh = currentId;
      finalData.Id_AnNinh = currentId;
    }

    try {
      const mode = currentId ? 'update' : 'create';
      const res = await apiService.save(finalData, mode, "HS_AnNinh");
      
      const savedId = res?.newId || res?.id || currentId || `AN-${Date.now()}`;
      finalData.ID_AnNinh = savedId;

      if (mode === 'create') {
        setAnNinhData(prev => [...prev, finalData as AnNinh]);
      } else {
        setAnNinhData(prev => prev.map(item => getSecId(item) === currentId ? (finalData as AnNinh) : item));
      }
      setIsSecurityModalOpen(false);
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu An Ninh.'); } 
    finally { setSubmitting(false); }
  };

  // 🟢 [KHU VỰC: XỬ LÝ LOGIC HẬU CẦN (PVHC) - ÁP DỤNG SAFEGET ĐỂ CHỐNG LỖI TÊN CỘT]
  const openPvhcModal = () => {
    if (currentPvhc) { 
      setPvhcFormData({ 
        ...currentPvhc, 
        ID_PVHC: getPvhcId(currentPvhc),
        DinhBien: safeGet(currentPvhc, 'DinhBien'),
        PVHC_KhachCho: safeGet(currentPvhc, 'PVHC_KhachCho'),
        PVHC_Vesinh: safeGet(currentPvhc, 'PVHC_Vesinh'),
        Hienhuu: safeGet(currentPvhc, 'Hienhuu'),
        PVHC_DichVu: safeGet(currentPvhc, 'PVHC_DichVu'),
        Vitri: safeGet(currentPvhc, 'Vitri'), // Đã thêm trường Vitri
        NCC_DichVu: safeGet(currentPvhc, 'NCC_DichVu'),
        ChiPhiThue: safeGet(currentPvhc, 'ChiPhiThue')
      }); 
    } else {
      setPvhcFormData({
        ID_PVHC: '', ID_DonVi: selectedUnitId || '', 
        DinhBien: '', PVHC_KhachCho: '', PVHC_Vesinh: '', Hienhuu: '',
        PVHC_DichVu: '', Vitri: '', NCC_DichVu: '', ChiPhiThue: '' // Đã thêm trường Vitri
      });
    }
    setIsPvhcModalOpen(true);
  };

  const handlePvhcSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    const khachCho = Number(pvhcFormData.PVHC_KhachCho) || 0;
    const veSinh = Number(pvhcFormData.PVHC_Vesinh) || 0;
    const dichVu = Number(pvhcFormData.PVHC_DichVu) || 0;
    
    // Tự động tính Hiện hữu (Khách chờ + Vệ sinh)
    let finalData: any = { ...pvhcFormData, Hienhuu: khachCho + veSinh };
    
    if (dichVu < 1) { 
      finalData.Vitri = ''; // Reset Vitri nếu không có người
      finalData.NCC_DichVu = ''; 
      finalData.ChiPhiThue = ''; 
    }

    const currentId = getPvhcId(finalData);
    if (currentId) {
      finalData.ID_PVHC = currentId;
      finalData.iD_PVHC = currentId;
      finalData.Id_PVHC = currentId;
    }

    try {
      const mode = currentId ? 'update' : 'create';
      const res = await apiService.save(finalData, mode, "HS_PVHC");
      
      const savedId = res?.newId || res?.id || currentId || `PVHC-${Date.now()}`;
      finalData.ID_PVHC = savedId;

      if (mode === 'create') {
        setPvhcData(prev => [...prev, finalData]);
      } else {
        setPvhcData(prev => prev.map(item => getPvhcId(item) === currentId ? finalData : item));
      }
      setIsPvhcModalOpen(false);
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu Hậu cần.'); } 
    finally { setSubmitting(false); }
  };

  // 🟢 [KHU VỰC: RENDER CÂY THƯ MỤC VỚI ICON ĐỘNG ĐƯỢC CHUẨN HÓA]
  const renderUnitTree = (parent: DonVi, level: number = 1) => {
    const children = getChildUnits(parent.ID_DonVi);
    const isExpanded = expandedParents.includes(parent.ID_DonVi) || !!searchTerm;
    const isParentDimmed = parent.trangThai === 'Đại lý' || parent.trangThai === 'Đầu tư mới';

    // Xác định Icon dựa trên loaiHinh của đơn vị với .trim() để tránh lỗi khoảng trắng
    let UnitIcon = Building2;
    const loaiHinhStr = String(parent.loaiHinh || '').toLowerCase().trim();
    
    if (loaiHinhStr.includes('tổng công ty')) UnitIcon = Building2; // 🏢
    else if (loaiHinhStr.includes('công ty tỉnh')) UnitIcon = Store; // 🏪
    else if (loaiHinhStr.includes('quản trị')) UnitIcon = Store; // 🏪
    else if (loaiHinhStr === 'showroom') UnitIcon = Store; // 🏬 (hoặc Briefcase/Store tùy bạn)
    else if (loaiHinhStr.includes('điểm kinh doanh')) UnitIcon = MapPin; // 📍
    else if (loaiHinhStr.includes('kho')) UnitIcon = Warehouse; // 🏭
    else UnitIcon = Briefcase; // Default

    return (
      <div key={parent.ID_DonVi} className={level === 1 ? "mb-1" : "mt-1"}>
        <button onClick={() => { setSelectedUnitId(parent.ID_DonVi); if (children.length > 0) toggleParent(parent.ID_DonVi); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedUnitId === parent.ID_DonVi ? 'bg-blue-50 text-[#05469B]' : 'text-gray-700 hover:bg-gray-50'} ${isParentDimmed ? 'opacity-50' : ''}`}>
          {children.length > 0 ? (isExpanded ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />) : <div className="w-4 shrink-0" />}
          
          <UnitIcon size={level === 1 ? 16 : level === 2 ? 15 : 14} className={`shrink-0 ${selectedUnitId === parent.ID_DonVi ? 'text-[#05469B]' : 'text-gray-400'}`} />
          
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

      {/* CỘT TRÁI */}
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
              
              {/* Header Đơn vị */}
              <div className="flex flex-col md:flex-row justify-between items-start bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-4">
                <div>
                  <h1 className="text-3xl font-black text-[#05469B] mb-3">{selectedUnit.TenDonVi}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 font-medium">
                    <span className="flex items-center gap-1.5 group">
                      <MapPin size={16} className="text-red-500 shrink-0" /> 
                      {selectedUnit.DiaChi ? (
                        <a href={`http://maps.google.com/?q=${encodeURIComponent(selectedUnit.DiaChi)}`} target="_blank" rel="noreferrer" className="group-hover:text-blue-600 group-hover:underline transition-colors break-words" title="Xem trên Google Maps">{selectedUnit.DiaChi}</a>
                      ) : 'Chưa cập nhật địa chỉ'}
                    </span>
                    <span className="px-2.5 py-1 bg-gray-100 rounded-md text-xs border border-gray-200">ID: {selectedUnit.ID_DonVi}</span>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs border border-blue-100">{selectedUnit.loaiHinh}</span>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${isSelectedUnitDimmed ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>{selectedUnit.trangThai || 'Hoạt động'}</span>
                    {selectedUnit.Phia && <span className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-md text-xs border border-gray-200">{selectedUnit.Phia}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 w-full md:w-auto justify-end">
                  <button onClick={() => openModal('update', selectedUnit)} className="px-4 py-2.5 text-sm font-bold text-[#05469B] bg-white border border-[#05469B] hover:bg-blue-50 rounded-lg flex items-center gap-2 shadow-sm"><Edit size={16} /> Cập nhật</button>
                  <button onClick={() => { setItemToDelete({id: selectedUnit.ID_DonVi, type: 'donvi'}); setIsConfirmOpen(true); }} className="p-2.5 text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg shadow-sm"><Trash2 size={20} /></button>
                </div>
              </div>

              {/* WRAPPER BỌC CÁC PHẦN CHI TIẾT */}
              <div className={`space-y-8 transition-all duration-300 ${isSelectedUnitDimmed ? 'opacity-40 pointer-events-none select-none grayscale-[30%]' : ''}`}>
                
                {/* A. THÔNG TIN LÃNH ĐẠO */}
                <section>
                  <h3 className="text-lg font-black text-[#05469B] mb-5 flex items-center gap-2 uppercase tracking-wider"><div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> A. THÔNG TIN LÃNH ĐẠO</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <PersonnelCard title="Giám đốc SR / Lãnh đạo" person={leader} roleDefault="Lãnh đạo" fieldKey="ID_GiamDoc" isLarge={true} />
                    <PersonnelCard title="Phụ trách Kinh doanh xe" person={kdXe} roleDefault="PT KD Xe" fieldKey="ID_PTKDXe" />
                    <PersonnelCard title="Phụ trách Kinh doanh DVPT" person={kdDvpt} roleDefault="PT KD DVPT" fieldKey="ID_PTKDDVPT" />
                  </div>
                </section>

                {/* B. PHỤ TRÁCH DV HỖ TRỢ & PT NHÂN SỰ */}
                <section>
                  <h3 className="text-lg font-black text-[#05469B] mb-5 flex items-center gap-2 uppercase tracking-wider"><div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> B. PHỤ TRÁCH DV HỖ TRỢ & PT NHÂN SỰ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <PersonnelCard title="Dịch vụ Hỗ trợ KD 1" person={dvht1} roleDefault="PT DVHT 1" fieldKey="ID_DVHT1" />
                    <PersonnelCard title="Dịch vụ Hỗ trợ KD 2" person={dvht2} roleDefault="PT DVHT 2" fieldKey="ID_DVHT2" />
                    <PersonnelCard title="Hành chính - Nhân sự" person={ptNhanSu} roleDefault="Hành chính NS" fieldKey="ID_HCNS" />
                  </div>
                </section>
                
                {/* C. THÔNG TIN CƠ SỞ VẬT CHẤT (DYNAMIC VIEW THEO CẤP QUẢN LÝ) */}
                <section>
                  <h3 className="text-lg font-black text-[#05469B] mb-5 flex items-center gap-2 uppercase tracking-wider">
                    <div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> {isParentUnit ? 'C. QUY MÔ CỤM / TỈNH (TỔNG HỢP)' : 'C. THÔNG TIN CƠ SỞ VẬT CHẤT'}
                  </h3>
                  
                  {isParentUnit && aggregatedStats ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all relative overflow-hidden group flex items-center gap-4">
                        <Briefcase className="absolute -right-4 -bottom-4 w-20 h-20 text-indigo-500 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 z-10"><Building2 size={24} strokeWidth={2} /></div>
                        <div className="relative z-10 flex-1">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Đơn vị trực thuộc</p>
                          <p className="text-2xl font-black text-gray-800">{aggregatedStats.childCount} <span className="text-sm font-semibold text-gray-500">Đơn vị</span></p>
                        </div>
                      </div>
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
                          <p className="text-2xl font-black text-gray-800">{formatCurrency(selectedUnit.DienTich || 0)} <span className="text-sm font-semibold text-gray-500">m²</span></p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all relative overflow-hidden group flex items-center gap-4">
                        <Layers className="absolute -right-4 -bottom-4 w-20 h-20 text-purple-500 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 z-10"><Layers size={24} strokeWidth={2} /></div>
                        <div className="relative z-10 flex-1">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Quy mô</p>
                          <p className="text-2xl font-black text-gray-800">{selectedUnit.SoHam || 0} <span className="text-sm font-semibold text-gray-500">Hầm</span> / {selectedUnit.SoTang || 0} <span className="text-sm font-semibold text-gray-500">Tầng</span></p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-cyan-200 transition-all relative overflow-hidden group flex items-center gap-4">
                        <DoorOpen className="absolute -right-4 -bottom-4 w-20 h-20 text-cyan-500 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                        <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 z-10"><DoorOpen size={24} strokeWidth={2} /></div>
                        <div className="relative z-10 flex-1">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Số cổng</p>
                          <p className="text-2xl font-black text-gray-800">{selectedUnit.SoCong || 0} <span className="text-sm font-semibold text-gray-500">Cổng</span></p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all relative overflow-hidden group flex items-center gap-4">
                        <Coffee className="absolute -right-4 -bottom-4 w-20 h-20 text-orange-500 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                        <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 z-10"><Coffee size={24} strokeWidth={2} /></div>
                        <div className="relative z-10 flex-1">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Số phòng chờ</p>
                          <p className="text-2xl font-black text-gray-800">{selectedUnit.SoPhongCho || 0} <span className="text-sm font-semibold text-gray-500">Phòng</span></p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all relative overflow-hidden group flex items-center gap-4">
                        <UserCheck className="absolute -right-4 -bottom-4 w-20 h-20 text-emerald-500 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 z-10"><UserCheck size={24} strokeWidth={2} /></div>
                        <div className="relative z-10 flex-1">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Khách TB ra vào</p>
                          <p className="text-2xl font-black text-gray-800">{formatCurrency(selectedUnit.LuotKhachBQ || 0)} <span className="text-sm font-semibold text-gray-500">/ ngày</span></p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-rose-200 transition-all relative overflow-hidden group flex items-center gap-4">
                        <Users className="absolute -right-4 -bottom-4 w-20 h-20 text-rose-500 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500" strokeWidth={1.5} />
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 z-10"><Users size={24} strokeWidth={2} /></div>
                        <div className="relative z-10 flex-1">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nhân sự Đơn vị</p>
                          <p className="text-2xl font-black text-gray-800">{formatCurrency(selectedUnit.TongNhanSu || 0)} <span className="text-sm font-semibold text-gray-500">Người</span></p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
                
                {/* 🟢 [KHU VỰC: HIỂN THỊ PHẦN D - AN NINH (GIAO DIỆN GỐC)] */}
                <section className="animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-black text-[#05469B] flex items-center gap-2 uppercase tracking-wider">
                      <div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> D. AN NINH & HỆ THỐNG CAMERA
                    </h3>
                    {!isParentUnit && currentAnNinh && (
                      <button onClick={openSecurityModal} className="px-4 py-2 text-sm font-bold text-[#05469B] bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-2 transition-colors border border-blue-100 shadow-sm">
                        <Edit size={16} /> Cập nhật
                      </button>
                    )}
                  </div>

                  {isParentUnit && aggregatedSecurity ? (
                    <div className="space-y-6">
                      {/* Bảng tổng hợp An Ninh Công ty Mẹ */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                          <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><Shield size={18} /> Tổng lực lượng Bảo vệ</h4>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                              <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Tổng ANBV</p>
                              <p className="text-xl font-black text-[#05469B]">{aggregatedSecurity.tongANBV}</p>
                            </div>
                            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                              <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Nội bộ</p>
                              <p className="text-xl font-black text-emerald-700">{aggregatedSecurity.noiBo}</p>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-center">
                              <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Dịch vụ ngoài</p>
                              <p className="text-xl font-black text-orange-700">{aggregatedSecurity.dichVu}</p>
                            </div>
                            <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                              <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Tổng chi phí / Tháng</p>
                              <p className="text-sm font-black text-red-700 mt-1">{formatCurrency(aggregatedSecurity.chiPhi)} đ</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                          <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><Camera size={18} /> Tổng hệ thống Giám sát</h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                              <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Tổng Camera</p>
                              <p className="text-xl font-black text-[#05469B]">{aggregatedSecurity.tongCam}</p>
                            </div>
                            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center">
                              <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Hoạt động</p>
                              <p className="text-xl font-black text-emerald-700">{aggregatedSecurity.camHD}</p>
                            </div>
                            <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                              <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Đang hư hỏng</p>
                              <p className="text-xl font-black text-red-700">{aggregatedSecurity.camHu}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : currentAnNinh ? (
                    <div className="space-y-5 animate-in fade-in duration-300">
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        
                        {/* Cột Trái: Lực lượng & Ca trực */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                          <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><Users size={18} /> Lực lượng Bảo vệ</h4>
                          <div className="space-y-3 text-sm flex-1">
                             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0"><span className="text-gray-500 font-medium whitespace-nowrap shrink-0">Tổng ANBV / Định biên:</span><span className="font-black text-[#05469B] sm:text-right">{currentAnNinh.TongANBV || 0} / {currentAnNinh.DinhbienANBV || 0}</span></div>
                             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0"><span className="text-gray-500 font-medium whitespace-nowrap shrink-0">Bảo vệ Nội bộ:</span><span className="font-bold text-gray-800 sm:text-right">{currentAnNinh.SoBaoVeNoiBo || 0} người</span></div>
                             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0"><span className="text-gray-500 font-medium whitespace-nowrap shrink-0">Bảo vệ Dịch vụ:</span><span className="font-bold text-gray-800 sm:text-right">{currentAnNinh.SoBaoVeDichvu || 0} người</span></div>
                             {Number(currentAnNinh.SoBaoVeDichvu) >= 1 && (
                                <div className="pt-2 border-t border-gray-100 space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0"><span className="text-gray-500 font-medium whitespace-nowrap shrink-0">Vị trí BV Dịch vụ:</span><span className="font-bold text-gray-800 sm:text-right break-words">{currentAnNinh.VitrBVDV || '---'}</span></div>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0"><span className="text-gray-500 font-medium whitespace-nowrap shrink-0">Nhà cung cấp:</span><span className="font-bold text-gray-800 sm:text-right uppercase break-words">{currentAnNinh.NCC_DichVu || '---'}</span></div>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0"><span className="text-gray-500 font-medium whitespace-nowrap shrink-0">Chi phí thuê ngoài:</span><span className="font-black text-red-600 sm:text-right">{formatCurrency(currentAnNinh.ChiPhiThue) || '0'} VNĐ/tháng</span></div>
                                </div>
                             )}
                          </div>

                          {/* Phân bổ ca trực */}
                          <div className="mt-4 pt-4 border-t border-gray-100">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                                   <p className="text-[10px] font-bold text-amber-800 mb-1 flex items-center gap-1"><Sun size={12}/> CA NGÀY</p>
                                   <div className="text-xs text-gray-600 flex justify-between mb-0.5"><span className="whitespace-nowrap shrink-0">Cố định:</span> <b>{currentAnNinh.Ngaycd || 0} người</b></div>
                                   <div className="text-xs text-gray-600 flex justify-between"><span className="whitespace-nowrap shrink-0">Tuần tra:</span> <b>{currentAnNinh.Ngaytuantra || 0} người</b></div>
                                </div>
                                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                                   <p className="text-[10px] font-bold text-indigo-800 mb-1 flex items-center gap-1"><Moon size={12}/> CA ĐÊM</p>
                                   <div className="text-xs text-gray-600 flex justify-between mb-0.5"><span className="whitespace-nowrap shrink-0">Cố định:</span> <b>{currentAnNinh.Demcd || 0} người</b></div>
                                   <div className="text-xs text-gray-600 flex justify-between"><span className="whitespace-nowrap shrink-0">Tuần tra:</span> <b>{currentAnNinh.Demtruantra || 0} người</b></div>
                                </div>
                             </div>
                             
                             <div className="mt-4">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3 bg-gradient-to-r from-amber-50 to-indigo-50 px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                                   <div className="flex items-center gap-1.5 shrink-0"><Clock size={14} className="text-[#05469B]"/><span className="text-[#05469B] font-bold text-xs whitespace-nowrap">Bố trí nghỉ ca / Đổi ca:</span></div>
                                   <span className="font-black text-[#05469B] text-xs flex-1 text-left sm:text-right whitespace-pre-wrap break-words">{currentAnNinh.BoTriNghiCa ? `${currentAnNinh.BoTriNghiCa} người` : '---'}</span>
                                </div>
                             </div>
                          </div>
                        </div>

                        {/* Cột Phải: Giám sát */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                          <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><Camera size={18} /> Hệ thống Giám sát</h4>
                          <div className="space-y-3 text-sm">
                             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0"><span className="text-gray-500 font-medium whitespace-nowrap shrink-0">Tổng số Camera:</span><span className="font-black text-gray-800 sm:ml-2">{currentAnNinh.SLCAM || 0} Mắt</span></div>
                             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0"><span className="text-gray-500 font-medium whitespace-nowrap shrink-0">Camera hoạt động:</span><span className="font-bold text-emerald-600 sm:ml-2">{currentAnNinh.CAMHD || 0} Mắt</span></div>
                             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0"><span className="text-gray-500 font-medium whitespace-nowrap shrink-0">Camera hư/hỏng:</span><span className="font-bold text-red-600 sm:ml-2">{currentAnNinh.CAMHuHong || 0} Mắt</span></div>
                             
                             {Number(currentAnNinh.CAMHuHong) > 0 && (
                                <div className="flex flex-col sm:flex-row justify-between items-start pt-1 pb-1 gap-1 sm:gap-0">
                                  <span className="text-gray-500 font-medium whitespace-nowrap shrink-0 sm:mr-3">Lý do hư hỏng:</span>
                                  <span className="font-bold text-red-600 text-left sm:text-right sm:flex-1 whitespace-pre-wrap break-words">{currentAnNinh.LyDoHuCam || '---'}</span>
                                </div>
                             )}

                             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 border-t border-gray-50 pt-2 mt-1"><span className="text-gray-500 font-medium whitespace-nowrap shrink-0">Thời gian lưu hình:</span><span className="font-bold text-gray-800 sm:ml-2">{currentAnNinh.ThoiGianLuu || '---'} Ngày</span></div>
                             
                             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0"><span className="text-gray-500 font-medium whitespace-nowrap shrink-0">Vị trí đặt hệ thống (Đầu ghi):</span><span className="font-bold text-gray-800 text-left sm:text-right sm:ml-2 break-words">{currentAnNinh.ViTriDatHeThong || '---'}</span></div>
                             <div className="flex flex-col sm:flex-row justify-between items-start pt-2 border-t border-gray-50 mt-1 gap-1 sm:gap-0">
                               <span className="text-gray-500 font-medium whitespace-nowrap shrink-0 sm:mr-3">Vị trí giám sát chính:</span>
                               <span className="font-bold text-gray-800 text-left sm:text-right sm:flex-1 whitespace-pre-wrap break-words">{currentAnNinh.ViTriGiamSat || '---'}</span>
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* Dòng 2: Đặc điểm địa bàn & Phương án ANBV */}
                      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                         <h4 className="font-bold text-emerald-700 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><Compass size={18} /> Đặc điểm Địa bàn & Phương án</h4>
                         
                         {/* 4 Tiếp giáp */}
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tiếp giáp Trước</p>
                              <p className="text-sm font-semibold text-gray-700 line-clamp-2" title={currentAnNinh.TiepGiapTruoc}>{currentAnNinh.TiepGiapTruoc || '---'}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tiếp giáp Sau</p>
                              <p className="text-sm font-semibold text-gray-700 line-clamp-2" title={currentAnNinh.TiepGiapSau}>{currentAnNinh.TiepGiapSau || '---'}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tiếp giáp Trái</p>
                              <p className="text-sm font-semibold text-gray-700 line-clamp-2" title={currentAnNinh.TiepGiapTrai}>{currentAnNinh.TiepGiapTrai || '---'}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tiếp giáp Phải</p>
                              <p className="text-sm font-semibold text-gray-700 line-clamp-2" title={currentAnNinh.TiepGiapPhai}>{currentAnNinh.TiepGiapPhai || '---'}</p>
                            </div>
                         </div>

                         {/* Đánh giá & Phương án */}
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-gray-100">
                            <div className="md:col-span-2">
                               <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Đánh giá Tình hình ANTT Khu vực</p>
                               <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 text-sm font-medium whitespace-pre-wrap">
                                 {currentAnNinh.TinhHinhKhuVuc || 'Chưa cập nhật tình hình...'}
                               </div>
                            </div>
                            <div>
                               <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Phương án ANBV</p>
                               {currentAnNinh.Link_PhuongAnAN ? (
                                 <a href={currentAnNinh.Link_PhuongAnAN} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full p-3 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-bold transition-colors shadow-sm">
                                   <LinkIcon size={16}/> Xem File Đính Kèm
                                 </a>
                               ) : (
                                 <div className="flex items-center justify-center gap-2 w-full p-3 bg-gray-50 text-gray-400 border border-dashed border-gray-200 rounded-lg text-sm font-medium">
                                   Chưa cập nhật file
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div onClick={openSecurityModal} className="bg-white hover:bg-indigo-50/50 cursor-pointer p-10 rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-300 text-center transition-all group shadow-sm">
                      <Shield size={48} className="mx-auto text-gray-300 group-hover:text-indigo-400 mb-4 transition-colors" />
                      <h4 className="text-lg font-bold text-gray-700 group-hover:text-indigo-700 mb-1">Cập nhật Hồ sơ An Ninh & Camera</h4>
                      <p className="text-sm text-gray-400">Click vào đây để khai báo dữ liệu bảo vệ, phân ca trực và khu vực tiếp giáp.</p>
                    </div>
                  )}
                </section>

                {/* F. PHÒNG CHỐNG CHÁY NỔ (Placeholder) */}
                <section>
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-black text-[#05469B] flex items-center gap-2 uppercase tracking-wider">
                      <div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> F. PHÒNG CHỐNG CHÁY NỔ
                    </h3>
                  </div>
                  <div className="bg-gray-50 hover:bg-red-50/50 cursor-not-allowed p-8 rounded-xl border-2 border-dashed border-gray-200 text-center transition-all group shadow-sm">
                    <Flame size={40} className="mx-auto text-gray-300 group-hover:text-red-400 mb-3 transition-colors" />
                    <h4 className="text-base font-bold text-gray-600 group-hover:text-red-700 mb-1">Dữ liệu PCCC chưa cập nhật</h4>
                    <p className="text-xs text-gray-400 group-hover:text-red-500">Module này sẽ được mở khóa sau khi cấu hình Sheet dữ liệu hoàn tất.</p>
                  </div>
                </section>

                {/* G. AN TOÀN VỆ SINH LAO ĐỘNG (Placeholder) */}
                <section>
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-black text-[#05469B] flex items-center gap-2 uppercase tracking-wider">
                      <div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> G. AN TOÀN VỆ SINH LAO ĐỘNG
                    </h3>
                  </div>
                  <div className="bg-gray-50 hover:bg-emerald-50/50 cursor-not-allowed p-8 rounded-xl border-2 border-dashed border-gray-200 text-center transition-all group shadow-sm">
                    <HardHat size={40} className="mx-auto text-gray-300 group-hover:text-emerald-400 mb-3 transition-colors" />
                    <h4 className="text-base font-bold text-gray-600 group-hover:text-emerald-700 mb-1">Dữ liệu ATVSLĐ chưa cập nhật</h4>
                    <p className="text-xs text-gray-400 group-hover:text-emerald-500">Module này sẽ được mở khóa sau khi cấu hình Sheet dữ liệu hoàn tất.</p>
                  </div>
                </section>

                {/* H. PHÒNG CHỐNG THIÊN TAI (Placeholder) */}
                <section>
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-black text-[#05469B] flex items-center gap-2 uppercase tracking-wider">
                      <div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> H. PHÒNG CHỐNG THIÊN TAI
                    </h3>
                  </div>
                  <div className="bg-gray-50 hover:bg-blue-50/50 cursor-not-allowed p-8 rounded-xl border-2 border-dashed border-gray-200 text-center transition-all group shadow-sm">
                    <CloudLightning size={40} className="mx-auto text-gray-300 group-hover:text-blue-400 mb-3 transition-colors" />
                    <h4 className="text-base font-bold text-gray-600 group-hover:text-blue-700 mb-1">Dữ liệu PCTT chưa cập nhật</h4>
                    <p className="text-xs text-gray-400 group-hover:text-blue-500">Module này sẽ được mở khóa sau khi cấu hình Sheet dữ liệu hoàn tất.</p>
                  </div>
                </section>

                {/* 🟢 [KHU VỰC: HIỂN THỊ PHẦN I - PHỤC VỤ HẬU CẦN (DYNAMIC)] */}
                <section>
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-black text-[#05469B] flex items-center gap-2 uppercase tracking-wider">
                      <div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> {isParentUnit ? 'I. TỔNG HỢP HẬU CẦN TOÀN CỤM' : 'I. PHỤC VỤ HẬU CẦN'}
                    </h3>
                    {!isParentUnit && currentPvhcSafe && (
                      <button onClick={openPvhcModal} className="px-4 py-2 text-sm font-bold text-[#05469B] bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-2 transition-colors border border-blue-100 shadow-sm">
                        <Edit size={16} /> Cập nhật
                      </button>
                    )}
                  </div>

                  {isParentUnit && aggregatedPvhc ? (
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in duration-300">
                      <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><Utensils size={18} /> Tổng Nhân sự PVHC (Khách chờ & Vệ sinh)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-between">
                          <p className="text-[11px] font-bold text-blue-600 uppercase mb-2">Tổng Hiện hữu / Định biên</p>
                          <p className="text-2xl font-black text-[#05469B]">{aggregatedPvhc.hienHuu} / {aggregatedPvhc.dinhBien}</p>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-between">
                          <p className="text-[11px] font-bold text-emerald-600 uppercase mb-2">Hậu cần Nội bộ</p>
                          <p className="text-2xl font-black text-emerald-700">{aggregatedPvhc.khachCho + aggregatedPvhc.veSinh} <span className="text-sm font-semibold">Người</span></p>
                          <p className="text-xs text-emerald-600 mt-2 font-medium">Khách chờ: {aggregatedPvhc.khachCho} | Vệ sinh: {aggregatedPvhc.veSinh}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col justify-between">
                          <p className="text-[11px] font-bold text-orange-600 uppercase mb-2">Dịch vụ Thuê ngoài</p>
                          <p className="text-2xl font-black text-orange-700">{aggregatedPvhc.dichVu} <span className="text-sm font-semibold">Người</span></p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col justify-between">
                          <p className="text-[11px] font-bold text-red-600 uppercase mb-2">Tổng Chi phí thuê ngoài</p>
                          <p className="text-lg font-black text-red-700">{formatCurrency(aggregatedPvhc.chiPhi)} đ</p>
                          <p className="text-xs text-red-500 mt-1 font-medium">/ Tháng</p>
                        </div>
                      </div>
                    </div>
                  ) : currentPvhcSafe ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-300">
                      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                          <h4 className="font-bold text-emerald-700 flex items-center gap-2"><Pocket size={18} />Nội bộ</h4>
                          <span className="text-sm font-black text-[#05469B] bg-blue-50 px-3 py-1 rounded-md border border-blue-100">Hiện hữu: {currentPvhcSafe.Hienhuu || 0} / Định biên: {currentPvhcSafe.DinhBien || 0}</span>
                        </div>
                        <div className="space-y-4 flex-1">
                          <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                            <span className="text-emerald-800 font-semibold text-sm flex items-center gap-2"><Coffee size={16}/> Phục vụ Khách chờ</span>
                            <span className="text-emerald-700 font-black">{currentPvhcSafe.PVHC_KhachCho || 0} Người</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                            <span className="text-emerald-800 font-semibold text-sm flex items-center gap-2"><Utensils size={16}/> Nhân viên Vệ sinh</span>
                            <span className="text-emerald-700 font-black">{currentPvhcSafe.PVHC_Vesinh || 0} Người</span>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="mt-4 pt-2">
                            <div className="flex justify-between text-xs mb-1 font-bold text-gray-500">
                              <span>Tỷ lệ lấp đầy định biên</span>
                              <span>{currentPvhcSafe.DinhBien ? Math.round(((Number(currentPvhcSafe.Hienhuu) || 0) / (Number(currentPvhcSafe.DinhBien) || 1)) * 100) : 0}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(currentPvhcSafe.DinhBien ? ((Number(currentPvhcSafe.Hienhuu) || 0) / (Number(currentPvhcSafe.DinhBien) || 1)) * 100 : 0, 100)}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {Number(currentPvhcSafe.PVHC_DichVu) > 0 ? (
                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                          <h4 className="font-bold text-orange-700 flex items-center gap-2 border-b border-gray-100 pb-3 mb-4"><Briefcase size={18} /> Dịch vụ Thuê ngoài</h4>
                          <div className="space-y-4 flex-1">
                            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                              <span className="text-orange-800 font-semibold text-sm">Nhân sự dịch vụ</span>
                              <span className="text-orange-700 font-black">{currentPvhcSafe.PVHC_DichVu || 0} Người</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                              <span className="text-gray-600 font-semibold text-sm">Vị trí đảm nhận</span>
                              <span className="text-gray-800 font-bold text-right break-words">{currentPvhcSafe.Vitri || '---'}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                              <span className="text-gray-600 font-semibold text-sm">Nhà cung cấp</span>
                              <span className="text-gray-800 font-black uppercase text-right break-words">{currentPvhcSafe.NCC_DichVu || '---'}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                              <span className="text-red-800 font-semibold text-sm">Chi phí thuê / tháng</span>
                              <span className="text-red-600 font-black">{formatCurrency(currentPvhcSafe.ChiPhiThue) || 0} VNĐ</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-5 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                          <Shield size={32} className="mb-2 opacity-30"/>
                          <p className="text-sm font-medium">Không có thuê ngoài dịch vụ</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div onClick={openPvhcModal} className="bg-white hover:bg-indigo-50/50 cursor-pointer p-10 rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-300 text-center transition-all group shadow-sm">
                      <Utensils size={48} className="mx-auto text-gray-300 group-hover:text-indigo-400 mb-4 transition-colors" />
                      <h4 className="text-lg font-bold text-gray-700 group-hover:text-indigo-700 mb-1">Cập nhật Hồ sơ Phục vụ Hậu cần</h4>
                      <p className="text-sm text-gray-400">Click vào đây để khai báo nhân sự nội bộ, tạp vụ và thuê ngoài.</p>
                    </div>
                  )}
                </section>

                {/* J. THÔNG TIN PHÒNG HỌP */}
                <section>
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-black text-[#05469B] flex items-center gap-2 uppercase tracking-wider">
                      <div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> J. THÔNG TIN PHÒNG HỌP
                    </h3>
                    <button onClick={() => openPhModal('create')} className="px-4 py-2 text-sm font-bold text-fuchsia-600 bg-fuchsia-50 hover:bg-fuchsia-100 rounded-lg flex items-center gap-2 transition-colors border border-fuchsia-100 shadow-sm">
                      <Plus size={16} /> Thêm Phòng họp
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    {currentPhongHopList.length === 0 ? (
                      <div className="py-12 text-center bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                        <Monitor size={40} className="mx-auto mb-3 opacity-50"/>
                        <p>Chưa có thông tin phòng họp cho đơn vị này.</p>
                      </div>
                    ) : (
                      currentPhongHopList.map(ph => {
                        const phId = ph.ID_Phonghop || ph.iD_Phonghop || ph.ID_PhongHop;
                        return (
                        <div key={phId} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-fuchsia-300 transition-colors group flex flex-col xl:flex-row gap-6 relative items-start xl:items-center">
                          <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button onClick={() => openPhModal('update', ph)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded bg-white shadow-sm border border-blue-100" title="Sửa"><Edit size={14}/></button>
                            <button onClick={() => {setItemToDelete({id: phId, type: 'phonghop'}); setIsConfirmOpen(true);}} className="p-1.5 text-red-600 hover:bg-red-50 rounded bg-white shadow-sm border border-red-100" title="Xóa"><Trash2 size={14}/></button>
                          </div>

                          <div className="flex items-center gap-4 w-full xl:w-1/4 shrink-0">
                            <div className="w-14 h-14 rounded-full bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center shrink-0">
                              <Monitor size={28} />
                            </div>
                            <div className="min-w-0 pr-8 xl:pr-0">
                              <h4 className="font-black text-gray-800 text-lg truncate" title={ph.Tenphonghop}>{ph.Tenphonghop}</h4>
                              <p className="text-sm font-semibold text-gray-500 flex items-center gap-1.5 mt-0.5"><MapPin size={14} className="text-gray-400"/> {ph.Vitri || 'Chưa cập nhật vị trí'}</p>
                              <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-md border border-gray-200"><Users size={14}/> Sức chứa: {ph.Succhua || 0} người</span>
                            </div>
                          </div>

                          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 border-t xl:border-t-0 xl:border-l border-gray-100 pt-4 xl:pt-0 xl:pl-6">
                            <div className="space-y-3">
                              {ph.TBtrinhchieu ? (
                                <div className="flex items-start gap-2.5">
                                  <Projector size={18} className="text-blue-500 shrink-0 mt-0.5"/>
                                  <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Trình chiếu</p>
                                    <p className="text-sm font-bold text-[#05469B] leading-tight">{ph.TBtrinhchieu}</p>
                                  </div>
                                </div>
                              ) : (<div className="flex items-center gap-2.5 text-gray-400"><Projector size={18}/> <span className="text-sm italic">Không Trình chiếu</span></div>)}

                              {ph.TBHopOnline ? (
                                <div className="flex items-center gap-2.5"><Video size={18} className="text-green-500 shrink-0"/><span className="text-sm font-bold text-gray-800">Có thiết bị Họp Online</span></div>
                              ) : (<div className="flex items-center gap-2.5 text-gray-400"><Video size={18} className="shrink-0"/><span className="text-sm italic">Không Họp Online</span></div>)}
                            </div>

                            <div className="space-y-3 lg:col-span-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                  {ph.TBchuyenslide && (<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-fuchsia-50 text-fuchsia-700 text-xs font-bold rounded-lg border border-fuchsia-200 shadow-sm"><MousePointerClick size={14}/> Bút chuyển Slide</span>)}
                                  {ph.Bangviet && (<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-bold rounded-lg border border-orange-200 shadow-sm"><SquarePen size={14}/> Bảng viết</span>)}
                                  {ph.Butviet && (<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 shadow-sm"><PenTool size={14}/> Bút lông: {ph.Butviet}</span>)}
                                  {ph.Butchi && Number(ph.Butchi) > 0 && (<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200 shadow-sm"><Wand2 size={14}/> Bút Laser: {ph.Butchi} cái</span>)}
                              </div>

                              {ph.Layout && (
                                <div className="mt-2">
                                  <a href={ph.Layout} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-fuchsia-600 hover:text-fuchsia-800 hover:underline"><LayoutTemplate size={16} /> Xem Layout Phòng họp</a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )})
                    )}
                  </div>
                </section>

                {/* K. PHÁP NHÂN & THÔNG TIN XUẤT HÓA ĐƠN */}
                <section>
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-black text-[#05469B] flex items-center gap-2 uppercase tracking-wider">
                      <div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> K. PHÁP NHÂN & THÔNG TIN XUẤT HÓA ĐƠN
                    </h3>
                    <button onClick={() => openPnModal('create')} className="px-4 py-2 text-sm font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg flex items-center gap-2 transition-colors border border-orange-100 shadow-sm">
                      <Plus size={16} /> Thêm Pháp nhân
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {currentPhapNhanList.length === 0 ? (
                      <div className="py-12 text-center bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                        <Briefcase size={40} className="mx-auto mb-3 opacity-50"/>
                        <p>Chưa có thông tin pháp nhân cho đơn vị này.</p>
                      </div>
                    ) : (
                      currentPhapNhanList.map(pn => (
                        <div key={pn.Id_Phapnhan} className="bg-white px-5 py-4 rounded-xl border border-gray-200 shadow-sm hover:border-orange-300 transition-colors group flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
                          <div className="flex items-center gap-3 md:w-5/12 shrink-0">
                            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                              <FileText size={20} />
                            </div>
                            <div className="min-w-0 pr-4">
                              <h4 className="font-bold text-gray-800 text-sm truncate" title={pn.TenCongty}>{pn.TenCongty}</h4>
                              <div className="flex gap-2 items-center mt-1">
                                <span className="inline-block px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px] font-bold border border-orange-100">MST: {pn.MST || '---'}</span>
                                <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100 truncate max-w-[150px]" title={donViMap[pn.ID_DonVi] || pn.ID_DonVi}>
                                  🏢 {donViMap[pn.ID_DonVi] || pn.ID_DonVi}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 border-t border-gray-100 md:border-t-0 pt-2 md:pt-0 space-y-1">
                            <div className="flex items-start gap-2 text-xs text-gray-500 group/map">
                              <MapPin size={14} className="shrink-0 text-red-400 group-hover/map:text-blue-500 mt-0.5"/>
                              <span className="truncate" title={pn.Diachi}>
                                {pn.Diachi ? (<a href={`http://maps.google.com/?q=${encodeURIComponent(pn.Diachi)}`} target="_blank" rel="noreferrer" className="group-hover/map:text-blue-600 group-hover/map:underline transition-colors">{pn.Diachi}</a>) : 'Chưa cập nhật địa chỉ'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 group/mail">
                              <MailIcon size={14} className="shrink-0 text-gray-400 group-hover/mail:text-orange-500"/>
                              <span className="truncate">
                                {pn.Mail ? (<a href={`mailto:${pn.Mail}`} className="group-hover/mail:text-orange-600 group-hover/mail:underline transition-colors">{pn.Mail}</a>) : 'Chưa cập nhật Email'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 shrink-0">
                            <button onClick={() => handleCopyInvoice(pn)} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm border ${copiedId === pn.Id_Phapnhan ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'}`} title="Copy thông tin xuất hóa đơn">
                              {copiedId === pn.Id_Phapnhan ? <><CheckCheck size={14}/> Đã Copy</> : <><Copy size={14}/> Copy Hóa đơn</>}
                            </button>
                            {pn.GPKD && (<a href={pn.GPKD} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-1.5 transition-colors shadow-sm"><ExternalLink size={14}/> GPKD</a>)}
                            <div className="flex gap-1 border-l border-gray-100 pl-2 ml-1">
                              <button onClick={() => openPnModal('update', pn)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Sửa"><Edit size={16}/></button>
                              <button onClick={() => {setItemToDelete({id: pn.Id_Phapnhan, type: 'phapnhan'}); setIsConfirmOpen(true);}} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Xóa"><Trash2 size={16}/></button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* 🟢 [KHU VỰC: HIỂN THỊ PHẦN L - THỐNG KÊ TÀI SẢN (DYNAMIC)] */}
                <section className="animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-black text-[#05469B] flex items-center gap-2 uppercase tracking-wider">
                      <div className="w-1.5 h-6 bg-[#05469B] rounded-full"></div> L. THỐNG KÊ TÀI SẢN (XE & TRANG THIẾT BỊ)
                    </h3>
                  </div>

                  <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch`}>
                     
                     {/* 1. THỐNG KÊ PHƯƠNG TIỆN */}
                     <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full">
                        <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                           <Car size={18} className="text-[#05469B]" /> 1. Phương tiện (Xe công & Lái thử)
                        </h4>
                        
                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-4 mb-5">
                           <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center flex flex-col items-center justify-between">
                              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1 whitespace-nowrap w-full truncate" title="Tổng số xe">Tổng số xe</p>
                              <p className="text-xl font-black text-[#05469B] mt-auto flex-1 flex items-end">{xeStats.total}</p>
                           </div>
                           <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center flex flex-col items-center justify-between">
                              <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1 whitespace-nowrap w-full truncate" title="Đang hoạt động">Đang hoạt động</p>
                              <p className="text-xl font-black text-emerald-700 mt-auto flex-1 flex items-end">{xeStats.active}</p>
                           </div>
                           <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center flex flex-col items-center justify-between">
                              <p className="text-[10px] font-bold text-red-600 uppercase mb-1 whitespace-nowrap w-full truncate" title="Sửa chữa / Ngừng">Sửa chữa / Ngừng</p>
                              <p className="text-xl font-black text-red-700 mt-auto flex-1 flex items-end">{xeStats.inactive}</p>
                           </div>
                        </div>

                        {/* Detail Table */}
                        {xeStats.total > 0 ? (
                          <div className="overflow-x-auto border border-gray-200 rounded-xl flex-1">
                            <table className="w-full text-left text-sm border-collapse">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-xs text-gray-600 uppercase tracking-wider">
                                  <th className="p-3 border-r border-gray-200 w-1/3 whitespace-nowrap">Phân loại theo Mục đích</th>
                                  <th className="p-3 border-r border-gray-200 w-24 text-center">SL</th>
                                  <th className="p-3 whitespace-nowrap">Phân loại theo Loại xe</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {Object.entries(xeStats.grouped).map(([purpose, pData]) => (
                                  <React.Fragment key={purpose}>
                                    {/* Category Row */}
                                    <tr className="bg-gray-100/80">
                                      <td className="p-3 font-bold text-gray-800 border-r border-gray-200 flex items-center gap-2">
                                        <Tag size={14} className="text-[#05469B]" /> {purpose}
                                      </td>
                                      <td className="p-3 font-black text-[#05469B] text-center border-r border-gray-200">{pData.total}</td>
                                      <td className="p-3 bg-gray-50/50"></td>
                                    </tr>
                                    {/* Brands Rows */}
                                    {Object.entries(pData.brands).map(([brand, bData]) => (
                                      <tr key={`${purpose}-${brand}`} className="bg-white hover:bg-blue-50/30 transition-colors">
                                        <td className="p-3 text-gray-600 italic border-r border-gray-200 pl-10 font-medium">
                                          {brand}
                                        </td>
                                        <td className="p-3 text-center font-bold text-gray-700 border-r border-gray-200">
                                          {bData.total}
                                        </td>
                                        <td className="p-3">
                                          <div className="flex flex-col gap-1.5">
                                            {Object.entries(bData.models).map(([model, count]) => (
                                              <div key={model} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                                                <Car size={14} className="text-gray-400 shrink-0" /> <span className="truncate">{model}:</span> <span className="text-[#05469B] font-bold whitespace-nowrap">{count} xe</span>
                                              </div>
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
                        ) : (
                          <div className="text-center py-6 text-gray-400 border border-dashed border-gray-200 rounded-xl flex-1 flex items-center justify-center">Không có dữ liệu xe.</div>
                        )}
                     </div>

                     {/* 2. THỐNG KÊ TRANG THIẾT BỊ VĂN PHÒNG */}
                     <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full">
                        <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                           <MonitorSmartphone size={18} className="text-[#05469B]" /> 2. Trang thiết bị Văn phòng
                        </h4>
                        
                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-4 mb-5">
                           <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center flex flex-col items-center justify-between">
                              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1 whitespace-nowrap w-full truncate" title="Tổng thiết bị">Tổng thiết bị</p>
                              <p className="text-xl font-black text-[#05469B] mt-auto flex-1 flex items-end">{tbStats.total}</p>
                           </div>
                           <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center flex flex-col items-center justify-between">
                              <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1 whitespace-nowrap w-full truncate" title="Đang sử dụng">Đang sử dụng</p>
                              <p className="text-xl font-black text-emerald-700 mt-auto flex-1 flex items-end">{tbStats.active}</p>
                           </div>
                           <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center flex flex-col items-center justify-between">
                              <p className="text-[10px] font-bold text-red-600 uppercase mb-1 whitespace-nowrap w-full truncate" title="Hỏng / Lưu kho">Hỏng / Lưu kho</p>
                              <p className="text-xl font-black text-red-700 mt-auto flex-1 flex items-end">{tbStats.inactive}</p>
                           </div>
                        </div>

                        {/* Group Tags */}
                        {tbStats.total > 0 ? (
                          <div className="flex flex-wrap gap-2.5 flex-1 content-start">
                            {tbStats.groups.map(([group, count]) => (
                              <div key={group} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-[#05469B] hover:shadow-md transition-all cursor-default group">
                                <span className="text-xs font-bold text-gray-600 group-hover:text-[#05469B]">{group}</span>
                                <span className="bg-blue-50 px-2 py-0.5 rounded text-xs font-black text-[#05469B] border border-blue-100 group-hover:bg-[#05469B] group-hover:text-white transition-colors">{count}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-400 border border-dashed border-gray-200 rounded-xl flex-1 flex items-center justify-center">Không có dữ liệu thiết bị.</div>
                        )}
                     </div>

                     {/* 3. PHÂN BỔ TÀI SẢN THEO ĐƠN VỊ (NẾU CÓ SUBORDINATES) - NẰM FULL DƯỚI */}
                     {subordinateStats.length > 0 && (
                       <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full">
                          <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                             <Building2 size={18} className="text-[#05469B]" /> 3. Phân bổ Tài sản theo Đơn vị trực thuộc
                          </h4>
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

              </div> {/* Kết thúc wrapper làm mờ */}
            </div>
          )}
        </div>
      </div>

      {/* 🟢 [KHU VỰC: MODAL CẬP NHẬT AN NINH & CAMERA] */}
      {isSecurityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-indigo-100 bg-indigo-50 rounded-t-2xl text-indigo-900">
              <h3 className="text-xl font-bold flex items-center gap-2"><Shield size={24}/> Cập nhật An ninh & Hệ thống Camera</h3>
              <button onClick={() => setIsSecurityModalOpen(false)} disabled={submitting} className="text-indigo-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSecuritySave} className="p-6 overflow-y-auto space-y-6">
              
              {/* KHỐI 1: LỰC LƯỢNG BẢO VỆ */}
              <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 border-b border-blue-200 pb-2"><Users size={18}/> Lực lượng Bảo vệ</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Định biên ANBV (Người)</label><input type="number" name="DinhbienANBV" value={securityFormData.DinhbienANBV || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Bảo vệ Nội bộ (Người)</label><input type="number" name="SoBaoVeNoiBo" value={securityFormData.SoBaoVeNoiBo || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Bảo vệ Dịch vụ (Người)</label><input type="number" name="SoBaoVeDichvu" value={securityFormData.SoBaoVeDichvu || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                
                {Number(securityFormData.SoBaoVeDichvu) >= 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-4 pt-4 border-t border-blue-100 animate-in fade-in slide-in-from-top-2">
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Vị trí BV Dịch vụ (Mô tả)</label><input type="text" name="VitrBVDV" value={securityFormData.VitrBVDV || ''} onChange={(e) => handleInputChange(e, 'sec')} placeholder="Cổng chính, cổng phụ..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-xs font-bold text-gray-700 mb-1">Nhà cung cấp BV</label><input type="text" name="NCC_DichVu" value={securityFormData.NCC_DichVu || ''} onChange={(e) => handleInputChange(e, 'sec')} placeholder="YUKI, Sepre 24..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <div><label className="block text-xs font-bold text-red-600 mb-1">Chi phí thuê (VNĐ/Tháng)</label><input type="text" name="ChiPhiThue" value={formatCurrency(securityFormData.ChiPhiThue)} onChange={(e) => handleInputChange(e, 'sec')} placeholder="Nhập số tiền..." className="w-full p-2.5 border border-red-200 text-red-600 font-bold rounded-lg bg-red-50 focus:bg-white outline-none focus:ring-2 focus:ring-red-500" /></div>
                  </div>
                )}
              </div>

              {/* KHỐI 2: PHÂN BỔ CA TRỰC */}
              <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100">
                <h4 className="font-bold text-amber-800 mb-4 flex items-center gap-2 border-b border-amber-200 pb-2"><Clock size={18}/> Phân bổ Ca trực</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div><label className="block text-[10px] font-bold text-amber-700 mb-1 uppercase flex items-center gap-1"><Sun size={12}/> Ngày (Cố định)</label><input type="number" name="Ngaycd" value={securityFormData.Ngaycd || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-500" /></div>
                  <div><label className="block text-[10px] font-bold text-amber-700 mb-1 uppercase flex items-center gap-1"><Sun size={12}/> Ngày (Tuần tra)</label><input type="number" name="Ngaytuantra" value={securityFormData.Ngaytuantra || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-500" /></div>
                  <div><label className="block text-[10px] font-bold text-indigo-700 mb-1 uppercase flex items-center gap-1"><Moon size={12}/> Đêm (Cố định)</label><input type="number" name="Demcd" value={securityFormData.Demcd || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-[10px] font-bold text-indigo-700 mb-1 uppercase flex items-center gap-1"><Moon size={12}/> Đêm (Tuần tra)</label><input type="number" name="Demtruantra" value={securityFormData.Demtruantra || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                </div>
                {/* TRƯỜNG DỮ LIỆU MỚI: Bố trí nghỉ ca */}
                <div><label className="block text-xs font-bold text-gray-700 mb-1">Bố trí nghỉ ca / Đổi ca</label><textarea name="BoTriNghiCa" value={securityFormData.BoTriNghiCa || ''} onChange={(e) => handleInputChange(e, 'sec')} rows={2} placeholder="Mô tả cách thức bố trí người nghỉ ca, đổi ca..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white resize-none outline-none focus:ring-2 focus:ring-amber-500"></textarea></div>
              </div>

              {/* KHỐI 3: HỆ THỐNG GIÁM SÁT */}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2"><Camera size={18}/> Hệ thống Giám sát</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Tổng SL (Mắt)</label><input type="number" name="SLCAM" value={securityFormData.SLCAM || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  <div><label className="block text-[10px] font-bold text-emerald-600 mb-1 uppercase">Hoạt động</label><input type="number" name="CAMHD" value={securityFormData.CAMHD || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-emerald-200 rounded-lg bg-emerald-50 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700" /></div>
                  <div><label className="block text-[10px] font-bold text-red-600 mb-1 uppercase">Hư hỏng</label><input type="number" name="CAMHuHong" value={securityFormData.CAMHuHong || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-red-200 rounded-lg bg-red-50 outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-700" /></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Lưu hình (Ngày)</label><input type="number" name="ThoiGianLuu" value={securityFormData.ThoiGianLuu || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                </div>

                {Number(securityFormData.CAMHuHong) > 0 && (
                   <div className="mb-4 p-4 bg-red-50/50 rounded-lg border border-red-100 animate-in fade-in zoom-in duration-200">
                     <label className="block text-xs font-bold text-red-700 mb-2">Lý do Camera hư/hỏng</label>
                     <select 
                       value={securityFormData.LyDoHuCam && !['Sự cố nguồn điện', 'Dây tín hiệu và Jack kết nối', 'Lỗi phần cứng Camera', 'Lỗi đầu ghi (DVR/NVR) và Lưu trữ', 'Vấn đề phần mềm & Mạng'].includes(securityFormData.LyDoHuCam) ? 'Khác' : (securityFormData.LyDoHuCam || '')} 
                       onChange={(e) => {
                          const val = e.target.value;
                          setSecurityFormData({...securityFormData, LyDoHuCam: val === 'Khác' ? 'Khác' : val});
                       }}
                       className="w-full p-2.5 border border-red-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium text-red-800 mb-2"
                     >
                       <option value="">-- Chọn lý do --</option>
                       <option value="Sự cố nguồn điện">Sự cố nguồn điện</option>
                       <option value="Dây tín hiệu và Jack kết nối">Dây tín hiệu và Jack kết nối</option>
                       <option value="Lỗi phần cứng Camera">Lỗi phần cứng Camera</option>
                       <option value="Lỗi đầu ghi (DVR/NVR) và Lưu trữ">Lỗi đầu ghi (DVR/NVR) và Lưu trữ</option>
                       <option value="Vấn đề phần mềm & Mạng">Vấn đề phần mềm & Mạng</option>
                       <option value="Khác">Khác (Nhập lý do cụ thể...)</option>
                     </select>

                     {(securityFormData.LyDoHuCam && !['Sự cố nguồn điện', 'Dây tín hiệu và Jack kết nối', 'Lỗi phần cứng Camera', 'Lỗi đầu ghi (DVR/NVR) và Lưu trữ', 'Vấn đề phần mềm & Mạng', ''].includes(securityFormData.LyDoHuCam)) && (
                       <input type="text" 
                          value={securityFormData.LyDoHuCam === 'Khác' ? '' : securityFormData.LyDoHuCam}
                          onChange={(e) => setSecurityFormData({...securityFormData, LyDoHuCam: e.target.value || 'Khác'})}
                          placeholder="Gõ lý do hư hỏng cụ thể..."
                          className="w-full p-2.5 border border-red-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 text-sm"
                       />
                     )}
                   </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Vị trí đặt hệ thống (Đầu ghi)</label>
                    <input type="text" name="ViTriDatHeThong" value={securityFormData.ViTriDatHeThong || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="VD: Phòng IT, Phòng Giám đốc..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Vị trí giám sát chính</label>
                    <textarea name="ViTriGiamSat" value={securityFormData.ViTriGiamSat || ''} onChange={(e) => handleInputChange(e, 'sec')} rows={1} placeholder="Mô tả các góc giám sát quan trọng..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white resize-none outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                  </div>
                </div>
              </div>

              {/* KHỐI 4: ĐẶC ĐIỂM ĐỊA BÀN */}
              <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100">
                <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2 border-b border-emerald-200 pb-2"><Compass size={18}/> Đặc điểm Địa bàn</h4>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Tiếp giáp phía Trước</label><input type="text" name="TiepGiapTruoc" value={securityFormData.TiepGiapTruoc || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                    <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Tiếp giáp phía Sau</label><input type="text" name="TiepGiapSau" value={securityFormData.TiepGiapSau || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                    <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Tiếp giáp phía Trái</label><input type="text" name="TiepGiapTrai" value={securityFormData.TiepGiapTrai || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                    <div><label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Tiếp giáp phía Phải</label><input type="text" name="TiepGiapPhai" value={securityFormData.TiepGiapPhai || ''} onChange={(e) => handleInputChange(e, 'sec')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-800 mb-1">Đánh giá Tình hình ANTT Khu vực</label>
                    <input type="text" name="TinhHinhKhuVuc" value={securityFormData.TinhHinhKhuVuc || ''} onChange={(e) => handleInputChange(e, 'sec')} placeholder="VD: Phức tạp, Thường xuyên mất cắp, An ninh tốt..." className="w-full p-2.5 border border-emerald-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
              </div>

              {/* KHỐI 5: PHƯƠNG ÁN ANBV */}
              <div className="bg-purple-50/50 p-5 rounded-xl border border-purple-100">
                 <h4 className="font-bold text-purple-800 mb-4 flex items-center gap-2 border-b border-purple-200 pb-2"><FileText size={18}/> Phương án ANBV</h4>
                 <div>
                   <label className="block text-xs font-bold text-gray-700 mb-1">Link Phương án ANBV (Drive/PDF)</label>
                   <div className="relative">
                     <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                     <input type="url" name="Link_PhuongAnAN" value={securityFormData.Link_PhuongAnAN || ''} onChange={(e) => handleInputChange(e, 'sec')} placeholder="Dán link phương án..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white text-blue-600 outline-none focus:ring-2 focus:ring-purple-500" />
                   </div>
                 </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-100">
                <button type="button" onClick={() => setIsSecurityModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-sm">Hủy</button>
                <button type="submit" disabled={submitting} className="px-8 py-3 bg-[#05469B] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#04367a] shadow-md transition-colors">{submitting ? <Loader2 className="animate-spin"/> : <Save/>} Lưu Cập Nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 [KHU VỰC: MODAL PHỤC VỤ HẬU CẦN (PVHC)] */}
      {isPvhcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-emerald-100 bg-emerald-50 rounded-t-2xl text-emerald-900">
              <h3 className="text-xl font-bold flex items-center gap-2"><Utensils size={24}/> Cập nhật Phục vụ Hậu cần</h3>
              <button onClick={() => setIsPvhcModalOpen(false)} disabled={submitting} className="text-emerald-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handlePvhcSave} className="p-6 overflow-y-auto space-y-6">
              
              <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100">
                <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2 border-b border-emerald-200 pb-2"><Pocket size={18}/> 1. Lực lượng Nội bộ</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Định biên (Người) *</label>
                    <input type="number" required name="DinhBien" value={pvhcFormData.DinhBien || ''} onChange={(e) => handleInputChange(e, 'pvhc')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">NV Khách chờ (Trà nước)</label>
                    <input type="number" name="PVHC_KhachCho" value={pvhcFormData.PVHC_KhachCho || ''} onChange={(e) => handleInputChange(e, 'pvhc')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">NV Vệ sinh (Tạp vụ)</label>
                    <input type="number" name="PVHC_Vesinh" value={pvhcFormData.PVHC_Vesinh || ''} onChange={(e) => handleInputChange(e, 'pvhc')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-3 italic">* Hệ thống sẽ tự động tính <strong>Hiện hữu</strong> = Khách chờ + Vệ sinh</p>
              </div>

              <div className="bg-orange-50/50 p-5 rounded-xl border border-orange-100">
                <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2 border-b border-orange-200 pb-2"><Briefcase size={18}/> 2. Dịch vụ Thuê ngoài</h4>
                
                {/* Dòng 1: Số lượng và Vị trí */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Số lượng Thuê ngoài (Người)</label>
                    <input type="number" name="PVHC_DichVu" value={pvhcFormData.PVHC_DichVu || ''} onChange={(e) => handleInputChange(e, 'pvhc')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  
                  {Number(pvhcFormData.PVHC_DichVu) > 0 && (
                    <div className="animate-in fade-in">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Vị trí đảm nhận *</label>
                      <input type="text" required name="Vitri" value={pvhcFormData.Vitri || ''} onChange={(e) => handleInputChange(e, 'pvhc')} placeholder="VD: Khách chờ, Vệ sinh..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                  )}
                </div>
                
                {/* Dòng 2: Nhà cung cấp và Chi phí */}
                {Number(pvhcFormData.PVHC_DichVu) > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-orange-100 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Nhà cung cấp *</label>
                      <input type="text" required name="NCC_DichVu" value={pvhcFormData.NCC_DichVu || ''} onChange={(e) => handleInputChange(e, 'pvhc')} placeholder="Tên công ty thuê ngoài..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-red-600 mb-1">Chi phí thuê / tháng (VNĐ) *</label>
                      <input type="text" required name="ChiPhiThue" value={formatCurrency(pvhcFormData.ChiPhiThue)} onChange={(e) => handleInputChange(e, 'pvhc')} placeholder="Nhập số tiền..." className="w-full p-2.5 border border-red-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-600" />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-100">
                <button type="button" onClick={() => setIsPvhcModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-sm">Hủy</button>
                <button type="submit" disabled={submitting} className="px-8 py-3 bg-[#05469B] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#04367a] shadow-md transition-colors">{submitting ? <Loader2 className="animate-spin"/> : <Save/>} Lưu Cập Nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- FORM PHÒNG HỌP --- */}
      {isPhModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-fuchsia-100 bg-fuchsia-50 rounded-t-2xl text-fuchsia-900">
              <h3 className="text-xl font-bold flex items-center gap-2"><Monitor size={24}/> {phModalMode === 'create' ? 'Thêm Phòng họp mới' : 'Cập nhật Phòng họp'}</h3>
              <button onClick={() => setIsPhModalOpen(false)} disabled={submitting} className="text-fuchsia-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handlePhSave} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Tên Phòng họp *</label><input type="text" required name="Tenphonghop" value={phFormData.Tenphonghop || ''} onChange={(e) => handleInputChange(e, 'ph')} placeholder="VD: Phòng họp Tầng 2..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-fuchsia-500 font-bold text-gray-800" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Vị trí *</label><input type="text" required name="Vitri" value={phFormData.Vitri || ''} onChange={(e) => handleInputChange(e, 'ph')} placeholder="VD: Lầu 2, Tòa nhà A..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-fuchsia-500" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Sức chứa tối đa (Người) *</label><input type="number" required name="Succhua" value={phFormData.Succhua || ''} onChange={(e) => handleInputChange(e, 'ph')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-fuchsia-500" /></div>
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-5">
                <h4 className="text-sm font-bold text-[#05469B] flex items-center gap-2 border-b border-gray-200 pb-2"><Projector size={16}/> Trang thiết bị</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Thiết bị trình chiếu (Loại - Inch)</label><input type="text" name="TBtrinhchieu" value={phFormData.TBtrinhchieu || ''} onChange={(e) => handleInputChange(e, 'ph')} placeholder="VD: Tivi - 100 inch hoặc Máy chiếu - 120 inch..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-fuchsia-500" /></div>
                  <div><label className="block text-xs font-bold text-gray-600 mb-1">Số lượng Bút Laser</label><input type="number" name="Butchi" value={phFormData.Butchi || ''} onChange={(e) => handleInputChange(e, 'ph')} placeholder="Nhập số lượng..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-fuchsia-500" /></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-fuchsia-500 transition-colors shadow-sm"><input type="checkbox" name="TBHopOnline" checked={phFormData.TBHopOnline || false} onChange={(e) => handleInputChange(e, 'ph')} className="w-4 h-4 text-fuchsia-600 rounded border-gray-300 mr-2.5 focus:ring-fuchsia-500" /><span className="text-xs font-bold text-gray-700">Thiết bị Họp Online</span></label>
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-fuchsia-500 transition-colors shadow-sm"><input type="checkbox" name="Bangviet" checked={phFormData.Bangviet || false} onChange={(e) => handleInputChange(e, 'ph')} className="w-4 h-4 text-fuchsia-600 rounded border-gray-300 mr-2.5 focus:ring-fuchsia-500" /><span className="text-xs font-bold text-gray-700">Bảng viết</span></label>
                  <label className="flex items-center p-3 border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-fuchsia-500 transition-colors shadow-sm"><input type="checkbox" name="TBchuyenslide" checked={phFormData.TBchuyenslide || false} onChange={(e) => handleInputChange(e, 'ph')} className="w-4 h-4 text-fuchsia-600 rounded border-gray-300 mr-2.5 focus:ring-fuchsia-500" /><span className="text-xs font-bold text-gray-700">Bút chuyển slide</span></label>
                  <div className="flex flex-col justify-center bg-white border border-gray-200 rounded-lg p-2 px-3 shadow-sm">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">MÀU BÚT LÔNG</label>
                    <div className="flex gap-3">
                      {['Xanh', 'Đỏ', 'Đen'].map(color => {
                        const isChecked = phFormData.Butviet?.includes(color);
                        return (
                          <label key={color} className="flex items-center cursor-pointer group"><input type="checkbox" checked={isChecked} onChange={(e) => handleButVietChange(color, e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500 mr-1" /><span className={`text-xs font-medium transition-colors ${isChecked ? 'text-gray-800' : 'text-gray-500 group-hover:text-fuchsia-600'}`}>{color}</span></label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Link Layout Phòng (Drive / File PDF)</label><input type="url" name="Layout" value={phFormData.Layout || ''} onChange={(e) => handleInputChange(e, 'ph')} placeholder="Dán link layout..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-fuchsia-500 text-blue-600" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Ghi chú khác</label><input type="text" name="Ghichu" value={phFormData.Ghichu || ''} onChange={(e) => handleInputChange(e, 'ph')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-fuchsia-500" /></div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsPhModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-xl transition-colors">Hủy</button>
                <button type="submit" disabled={submitting} className="px-8 py-3 text-white bg-fuchsia-600 hover:bg-fuchsia-700 font-bold rounded-xl flex items-center gap-2 shadow-md transition-colors">{submitting ? <Loader2 className="animate-spin" /> : 'Lưu Phòng Họp'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- FORM PHÁP NHÂN --- */}
      {isPnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-orange-100 bg-orange-50 rounded-t-2xl text-orange-900">
              <h3 className="text-xl font-bold flex items-center gap-2"><Briefcase size={24}/> {pnModalMode === 'create' ? 'Thêm Pháp nhân mới' : 'Cập nhật Pháp nhân'}</h3>
              <button onClick={() => setIsPnModalOpen(false)} disabled={submitting} className="text-orange-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handlePnSave} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Tên Công ty (Pháp nhân) *</label><input type="text" required name="TenCongty" value={pnFormData.TenCongty || ''} onChange={(e) => handleInputChange(e, 'pn')} placeholder="VD: Công ty TNHH MTV Phân phối Ô tô..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-800" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Mã số thuế (MST) *</label><input type="text" required name="MST" value={pnFormData.MST || ''} onChange={(e) => handleInputChange(e, 'pn')} placeholder="Nhập MST..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-700 tracking-widest" /></div>
                
                {/* TRƯỜNG CHỌN ĐƠN VỊ ÁP DỤNG MỚI BỔ SUNG */}
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Đơn vị trực thuộc *</label>
                  <select required name="ID_DonVi" value={pnFormData.ID_DonVi || ''} onChange={(e) => handleInputChange(e, 'pn')} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 font-bold text-[#05469B]" style={{ fontFamily: 'monospace, sans-serif' }}>
                    <option value="">-- Chọn Đơn vị --</option>
                    {buildHierarchicalOptions(data.filter(dv => selectedUnitSubordinates.includes(getUnitIdSafe(dv)))).map(({ unit, prefix }) => (
                      <option key={unit.ID_DonVi} value={unit.ID_DonVi} className="font-normal text-gray-700">
                        {prefix}{getUnitEmoji(unit.loaiHinh)} {unit.TenDonVi}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1">Địa chỉ đăng ký kinh doanh</label><input type="text" name="Diachi" value={pnFormData.Diachi || ''} onChange={(e) => handleInputChange(e, 'pn')} placeholder="Địa chỉ ghi trên Giấy phép kinh doanh..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500" /></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Email nhận Hóa đơn</label><input type="email" name="Mail" value={pnFormData.Mail || ''} onChange={(e) => handleInputChange(e, 'pn')} placeholder="ketoan@thaco.com.vn..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500" /></div>
                <div className="md:col-span-3"><label className="block text-xs font-bold text-gray-600 mb-1">Link Giấy phép Kinh doanh (Drive / File scan)</label><input type="url" name="GPKD" value={pnFormData.GPKD || ''} onChange={(e) => handleInputChange(e, 'pn')} placeholder="Dán link file đính kèm..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 text-blue-600" /></div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsPnModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-xl transition-colors">Hủy</button>
                <button type="submit" disabled={submitting} className="px-8 py-3 text-white bg-orange-600 hover:bg-orange-700 font-bold rounded-xl flex items-center gap-2 shadow-md transition-colors">{submitting ? <Loader2 className="animate-spin" /> : 'Lưu Pháp nhân'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ĐƠN VỊ CHÍNH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between p-5 border-b bg-gray-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-[#05469B]">{modalMode === 'create' ? 'Thêm Đơn vị' : 'Cập nhật Đơn vị'}</h3>
              <button onClick={() => setIsModalOpen(false)} disabled={submitting} className="text-gray-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Mã Đơn Vị (ID) *</label><input type="text" required name="ID_DonVi" value={formData.ID_DonVi || ''} onChange={(e) => setFormData({...formData, ID_DonVi: e.target.value})} disabled={modalMode === 'update'} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] disabled:bg-gray-100 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1 text-gray-600">Tên Đơn Vị *</label><input type="text" required name="TenDonVi" value={formData.TenDonVi || ''} onChange={(e) => setFormData({...formData, TenDonVi: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600">Cấp Quản Lý (Mẹ) *</label>
                  <select required name="CapQuanLy" value={formData.CapQuanLy || ''} onChange={(e) => setFormData({...formData, CapQuanLy: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] font-bold text-[#05469B] outline-none focus:ring-2 focus:ring-blue-500" style={{ fontFamily: 'monospace, sans-serif' }}>
                    <option value="">-- Chọn Cấp QL --</option>
                    <option value="HO" className="text-red-600">🏢 Tổng Công Ty (HO)</option>
                    {buildHierarchicalOptions(data.filter(d => getUnitIdSafe(d) !== formData.ID_DonVi)).map(({ unit, prefix }) => (
                      <option key={unit.ID_DonVi} value={unit.ID_DonVi} className="font-normal text-gray-700">
                        {prefix}{getUnitEmoji(unit.loaiHinh)} {unit.TenDonVi}
                      </option>
                    ))}
                  </select>
                </div>
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Khu vực (Phía)</label><select name="Phia" value={formData.Phia || 'VPĐH'} onChange={(e) => setFormData({...formData, Phia: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500"><option value="VPĐH">VPĐH</option><option value="CTTT Phía Nam">CTTT Phía Nam</option><option value="CTTT Phía Bắc">CTTT Phía Bắc</option></select></div>
                
                {/* TRƯỜNG LOẠI HÌNH ĐƯỢC CHUẨN HÓA DANH SÁCH */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600">Loại hình</label>
                  <select name="loaiHinh" value={formData.loaiHinh || 'Showroom Quản trị'} onChange={(e) => setFormData({...formData, loaiHinh: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Tổng Công ty">Tổng Công ty</option>
                    <option value="Công ty Tỉnh thành">Công ty Tỉnh thành</option>
                    <option value="Showroom Quản trị">Showroom Quản trị</option>
                    <option value="Showroom">Showroom</option>
                    <option value="Điểm Kinh doanh">Điểm Kinh doanh</option>
                    <option value="Kho xe">Kho xe</option>
                  </select>
                </div>
                
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Trạng thái</label><select name="trangThai" value={formData.trangThai || 'Hoạt động'} onChange={(e) => setFormData({...formData, trangThai: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700"><option value="Hoạt động">Hoạt động</option><option value="Đại lý">Đại lý</option><option value="Đầu tư mới">Đầu tư mới</option><option value="Ngừng hoạt động">Ngừng hoạt động</option></select></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1 text-gray-600">Địa chỉ</label><input type="text" name="DiaChi" value={formData.DiaChi || ''} onChange={(e) => setFormData({...formData, DiaChi: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <hr className="border-gray-100"/>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Diện tích (m²)</label><input type="number" name="DienTich" value={formData.DienTich || ''} onChange={(e) => setFormData({...formData, DienTich: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Số Tầng</label><input type="number" name="SoTang" value={formData.SoTang || ''} onChange={(e) => setFormData({...formData, SoTang: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Số Hầm</label><input type="number" name="SoHam" value={formData.SoHam || ''} onChange={(e) => setFormData({...formData, SoHam: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Số Cổng</label><input type="number" name="SoCong" value={formData.SoCong || ''} onChange={(e) => setFormData({...formData, SoCong: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Phòng chờ</label><input type="number" name="SoPhongCho" value={formData.SoPhongCho || ''} onChange={(e) => setFormData({...formData, SoPhongCho: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-bold mb-1 text-gray-600">Khách/Ngày</label><input type="number" name="LuotKhachBQ" value={formData.LuotKhachBQ || ''} onChange={(e) => setFormData({...formData, LuotKhachBQ: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="md:col-span-3"><label className="block text-xs font-bold mb-1 text-gray-600">Tổng CB-NV tại đơn vị</label><input type="number" name="TongNhanSu" value={formData.TongNhanSu || ''} onChange={(e) => setFormData({...formData, TongNhanSu: e.target.value})} className="w-full p-2.5 border rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div className="pt-5 border-t border-gray-100 flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-xl transition-colors">Hủy</button>
                <button type="submit" disabled={submitting} className="px-8 py-3 text-white bg-[#05469B] hover:bg-[#04367a] font-bold rounded-xl flex items-center gap-2 shadow-lg transition-colors">{submitting ? <Loader2 className="animate-spin" /> : 'Lưu Thay Đổi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 [KHU VỰC: CẢNH BÁO XÁC NHẬN XÓA] */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl text-center shadow-2xl max-w-sm w-full animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-100"><AlertCircle size={32} /></div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Xác nhận xóa?</h3>
            <p className="text-gray-500 text-sm mb-6">Hành động này sẽ xóa dữ liệu vĩnh viễn.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsConfirmOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-xl transition-colors">Hủy</button>
              <button onClick={confirmDelete} disabled={submitting} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors shadow-md">{submitting ? <Loader2 className="animate-spin" /> : 'Xóa'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
