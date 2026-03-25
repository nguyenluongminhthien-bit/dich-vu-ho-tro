import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Edit, Trash2, X, AlertCircle, Loader2, Save, 
  Users, ShieldCheck, Flame, LifeBuoy, Heart, Activity, 
  Dumbbell, Car, Utensils, Coffee, Languages, Monitor, Copy, Eye, User as UserIcon, 
  Building2, Phone, Mail, Info, MapPin, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen, CheckCheck, Briefcase
} from 'lucide-react';
import { apiService } from '../services/api';
import { Personnel, DonVi } from '../types';
import { useAuth } from '../contexts/AuthContext';

// HÀM FORMAT SỐ ĐIỆN THOẠI 4-3-3
const formatPhoneNumber = (val: string | number | undefined | null) => {
  if (!val) return '';
  const cleaned = val.toString().replace(/\D/g, ''); 
  if (cleaned.length <= 4) return cleaned;
  if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
};

const CERTIFICATES = [
  { id: 'CC_ATVSLD', label: 'ATVSLĐ', icon: ShieldCheck }, { id: 'CC_ANBV', label: 'ANBV', icon: ShieldCheck },
  { id: 'CC_PCCC', label: 'PCCC', icon: Flame }, { id: 'CC_CHCN', label: 'CHCN', icon: LifeBuoy },
  { id: 'CC_SoCapCuu', label: 'Sơ cấp cứu', icon: Heart }, { id: 'CC_CPR', label: 'CPR', icon: Activity },
  { id: 'CC_VoThuat', label: 'Võ thuật', icon: Dumbbell }, { id: 'CC_GPLX', label: 'GPLX', icon: Car },
  { id: 'CC_ATTP', label: 'ATTP', icon: Utensils }, { id: 'CC_PhaChe', label: 'Pha chế', icon: Coffee },
  { id: 'CC_NgoaiNgu', label: 'Ngoại ngữ', icon: Languages }, { id: 'CC_TinHoc', label: 'Tin học', icon: Monitor }
];

const formatCurrency = (val: string | number | undefined | null) => {
  if (!val) return '';
  return val.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export default function PersonnelPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Personnel[]>([]);
  const [donViList, setDonViList] = useState<DonVi[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [personnelSearchTerm, setPersonnelSearchTerm] = useState('');
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
  const [formData, setFormData] = useState<Partial<Personnel>>({});
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState<Personnel | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [copiedRole, setCopiedRole] = useState<string | null>(null);

  const gplxGroups = [
    { title: 'Tùy chọn chung', options: [{ label: 'Không có', value: 'Không có' }] },
    { title: 'Nhóm xe máy (Mô tô)', options: [{ label: 'Hạng A1 (Đến 125 cm³)', value: 'A1' }, { label: 'Hạng A (Trên 125 cm³)', value: 'A' }, { label: 'Hạng B1 (Ba bánh)', value: 'B1' }] },
    { title: 'Nhóm xe ô tô chở người', options: [{ label: 'Hạng B (Đến 8 chỗ, < 3.5T)', value: 'B' }, { label: 'Hạng D1 (8 - 16 chỗ)', value: 'D1' }, { label: 'Hạng D2 (16 - 29 chỗ)', value: 'D2' }, { label: 'Hạng D (Trên 29 chỗ)', value: 'D' }] },
    { title: 'Nhóm xe tải và chuyên dùng', options: [{ label: 'Hạng C1 (3.5T - 7.5T)', value: 'C1' }, { label: 'Hạng C (Trên 7.5T)', value: 'C' }] },
    { title: 'Nhóm xe kéo rơ moóc (Bằng E)', options: [{ label: 'Hạng BE (B kéo > 750kg)', value: 'BE' }, { label: 'Hạng C1E (C1 kéo > 750kg)', value: 'C1E' }, { label: 'Hạng CE (Đầu kéo, container)', value: 'CE' }, { label: 'Hạng D1E (D1 kéo > 750kg)', value: 'D1E' }, { label: 'Hạng D2E (D2 kéo > 750kg)', value: 'D2E' }, { label: 'Hạng DE (D kéo > 750kg)', value: 'DE' }] }
  ];

  const handleGPLXChange = (value: string, isChecked: boolean) => {
    let currentArr = formData.GPLX ? formData.GPLX.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    if (value === 'Không có') {
      currentArr = isChecked ? ['Không có'] : [];
    } else {
      currentArr = currentArr.filter((item: string) => item !== 'Không có');
      if (isChecked) { if (!currentArr.includes(value)) currentArr.push(value); } 
      else { currentArr = currentArr.filter((item: string) => item !== value); }
    }
    setFormData({ ...formData, GPLX: currentArr.join(', ') });
  };

  const currentGPLXList = useMemo(() => {
    return formData.GPLX ? formData.GPLX.split(',').map((s: string) => s.trim()) : [];
  }, [formData.GPLX]);

  const loadData = async () => {
    setLoading(true); setError(null);
    try {
      const [nsResult, dvResult] = await Promise.all([apiService.getPersonnel(), apiService.getDonVi()]);
      setData(nsResult); setDonViList(dvResult);
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

  const calculateSeniority = (startDate: string) => {
    if (!startDate) return 'Chưa có';
    const start = new Date(startDate);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    if (months < 0) { years--; months += 12; }
    if (years === 0 && months === 0) return 'Mới nhận việc';
    if (years === 0) return `${months} tháng`;
    return `${years} năm ${months} tháng`;
  };

  // --- FIX TÌM KIẾM CÂY THƯ MỤC CỰC THÔNG MINH (KÉO RỄ - XỔ CÀNH) ---
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

  const filteredPersonnel = useMemo(() => {
    let result = data.filter(item => allowedDonViIds.includes(item.ID_DonVi));
    if (selectedUnitFilter) {
      result = result.filter(item => item.ID_DonVi === selectedUnitFilter);
    }
    if (personnelSearchTerm) {
      const lower = personnelSearchTerm.toLowerCase();
      result = result.filter(item => 
        String(item.MaNV || '').toLowerCase().includes(lower) || 
        String(item.HoTen || '').toLowerCase().includes(lower) || 
        String(donViMap[item.ID_DonVi || ''] || '').toLowerCase().includes(lower) ||
        String(item.ChucVu || '').toLowerCase().includes(lower) 
      );
    }
    return result;
  }, [data, personnelSearchTerm, selectedUnitFilter, allowedDonViIds, donViMap]);

  const selectedUnitName = useMemo(() => {
    if (!selectedUnitFilter) return 'Tất cả Đơn vị';
    const unit = donViList.find(d => d.ID_DonVi === selectedUnitFilter);
    return unit ? unit.TenDonVi : 'Đơn vị không xác định';
  }, [selectedUnitFilter, donViList]);

  const handleCopyMail = (roleType: 'LD' | 'DVHT' | 'NS') => {
    let emails: string[] = [];
    filteredPersonnel.forEach(p => {
      if (!p.Email) return;
      const chucVu = String(p.ChucVu || '').toLowerCase();
      if (roleType === 'LD' && chucVu.includes('tổng giám đốc')) { emails.push(p.Email); } 
      else if (roleType === 'DVHT' && (chucVu.includes('dvht') || chucVu.includes('dịch vụ hỗ trợ'))) { emails.push(p.Email); } 
      else if (roleType === 'NS' && chucVu.includes('nhân sự')) { emails.push(p.Email); }
    });

    if (emails.length === 0) {
      alert('Không tìm thấy email nào phù hợp với chức vụ này trong danh sách hiện tại!'); return;
    }
    const uniqueEmails = Array.from(new Set(emails)).join('; ');
    navigator.clipboard.writeText(uniqueEmails).then(() => {
      setCopiedRole(roleType);
      setTimeout(() => setCopiedRole(null), 2000);
    });
  };

  const openModal = (mode: 'create' | 'update', item?: Personnel) => {
    setModalMode(mode);
    if (item) { setFormData({ ...item, SDT: formatPhoneNumber(item.SDT) }); } 
    else {
      setFormData({
        MaNV: '', HoTen: '', ChucVu: '', SDT: '', Email: '', GioiTinh: 'Nam', NamSinh: '', NgayNhanViec: '', 
        ID_DonVi: selectedUnitFilter || '', PhanLoai: 'Lãnh đạo', TrinhDoHocVan: '', ThuNhap: '', MoTaNgoaiHinh: '', GhiChu: '', GPLX: '',
        CC_ATVSLD: false, CC_ANBV: false, CC_PCCC: false, CC_CHCN: false, CC_SoCapCuu: false, CC_CPR: false, 
        CC_VoThuat: false, CC_GPLX: false, CC_ATTP: false, CC_PhaChe: false, CC_NgoaiNgu: false, CC_TinHoc: false
      });
    }
    setIsModalOpen(true); setError(null);
  };

  const handleView = (item: Personnel) => { setViewData(item); setIsViewModalOpen(true); };

  const handleDuplicate = (item: Personnel) => {
    setModalMode('create');
    setFormData({ ...item, ID_NhanSu: '', ChucVu: item.ChucVu ? `${item.ChucVu} (Kiêm nhiệm)` : 'Kiêm nhiệm' });
    setIsModalOpen(true); setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ID_DonVi) return alert("Vui lòng chọn Đơn vị công tác!");
    
    let calculatedTuoi = '';
    if (formData.NamSinh) {
      const birthDate = new Date(formData.NamSinh); const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
      calculatedTuoi = age.toString();
    }

    const finalDataToSave = { ...formData, Tuoi: calculatedTuoi, ThamNien: calculateSeniority(formData.NgayNhanViec || '') };

    setSubmitting(true); setError(null);
    try {
      const response = await apiService.save(finalDataToSave, modalMode, "NS_DichVu");
      if (modalMode === 'create') {
        finalDataToSave.ID_NhanSu = response.newId; 
        setData(prev => [...prev, finalDataToSave as Personnel]); 
      } else {
        setData(prev => prev.map(item => item.ID_NhanSu === finalDataToSave.ID_NhanSu ? finalDataToSave as Personnel : item));
      }
      setIsModalOpen(false); 
    } catch (err: any) { setError(err.message || 'Lỗi lưu dữ liệu.'); } 
    finally { setSubmitting(false); }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return; setSubmitting(true); setError(null);
    try {
      await apiService.delete(itemToDelete, "NS_DichVu");
      setData(prev => prev.filter(item => item.ID_NhanSu !== itemToDelete));
      setIsConfirmOpen(false); setItemToDelete(null); 
    } catch (err: any) { setError(err.message || 'Lỗi xóa dữ liệu.'); } 
    finally { setSubmitting(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, type } = e.target;
    let value: string | boolean = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    if (name === 'ThuNhap') { value = (value as string).replace(/\D/g, ''); }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const renderUnitTree = (parent: DonVi, level: number = 1) => {
    const children = getChildUnits(parent.ID_DonVi);
    // FIX: Tự động mở thư mục khi đang tìm kiếm
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
          <div className={`mt-1 border-l-2 border-gray-100 pl-2 space-y-1 ${level === 1 ? 'ml-6' : 'ml-4'}`}>
            {children.map(child => renderUnitTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full bg-[#f4f7f9] overflow-hidden relative">
      {/* MOBILE MENU TOGGLE */}
      {isListCollapsed && (
        <button onClick={() => setIsListCollapsed(false)} className="absolute top-6 left-6 z-20 bg-white p-2.5 rounded-lg shadow-md border border-gray-200 text-[#05469B] hover:bg-blue-50 transition-all" title="Mở bộ lọc đơn vị">
          <PanelLeftOpen size={20} />
        </button>
      )}

      {/* CỘT TRÁI (BỘ LỌC ĐƠN VỊ) - TỰ ĐỘNG ẨN TRÊN MOBILE, BẤM NÚT MỚI HIỆN */}
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
            <Users size={18} className={selectedUnitFilter === null ? 'text-[#05469B]' : 'text-gray-400'} /> Tất cả Nhân sự Toàn quốc
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

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative transition-all duration-300">
        
        {/* HEADER CÓ CHỨA 3 NÚT COPY MAIL */}
        <div className={`flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 transition-all duration-300 ${isListCollapsed ? 'pl-10 lg:pl-12' : ''}`}>
          <div>
            <h2 className="text-2xl font-bold text-[#05469B] flex items-center gap-2"><Users size={28} /> Quản lý Nhân sự</h2>
            <p className="text-sm font-medium text-gray-500 mt-1">Đang xem: <span className="text-emerald-600 font-bold">{selectedUnitName}</span> ({filteredPersonnel.length} nhân sự)</p>
          </div>
          
          <div className="flex flex-col items-end gap-3 w-full xl:w-auto">
            {/* Thanh Tìm kiếm & Thêm Mới */}
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Tìm Mã NV, Họ Tên, Chức vụ..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#05469B] outline-none shadow-sm text-sm" value={personnelSearchTerm} onChange={(e) => setPersonnelSearchTerm(e.target.value)} />
              </div>
              <button onClick={() => openModal('create')} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#05469B] hover:bg-[#04367a] text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-all whitespace-nowrap"><Plus className="w-5 h-5" /> Thêm Mới</button>
            </div>
            
            {/* 3 NÚT COPY MAIL */}
            <div className="flex flex-wrap justify-end gap-2 w-full sm:w-auto">
              <button onClick={() => handleCopyMail('LD')} className="text-[11px] font-bold px-3 py-1.5 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded flex items-center gap-1.5 transition-colors shadow-sm" title="Copy Mail Tổng Giám đốc">
                {copiedRole === 'LD' ? <CheckCheck size={14} className="text-green-600"/> : <Copy size={14} />} Copy Mail LĐ
              </button>
              <button onClick={() => handleCopyMail('DVHT')} className="text-[11px] font-bold px-3 py-1.5 border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded flex items-center gap-1.5 transition-colors shadow-sm" title="Copy Mail PT DVHT">
                {copiedRole === 'DVHT' ? <CheckCheck size={14} className="text-green-600"/> : <Copy size={14} />} Copy Mail PT DVHT
              </button>
              <button onClick={() => handleCopyMail('NS')} className="text-[11px] font-bold px-3 py-1.5 border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 rounded flex items-center gap-1.5 transition-colors shadow-sm" title="Copy Mail PT Nhân sự">
                {copiedRole === 'NS' ? <CheckCheck size={14} className="text-green-600"/> : <Copy size={14} />} Copy Mail PT NS
              </button>
            </div>
          </div>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start gap-3 rounded-lg shadow-sm"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><p>{error}</p></div>}

        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ${isListCollapsed ? 'ml-10 lg:ml-0' : ''}`}>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[1050px]">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <th className="p-4 w-24">Mã NV</th><th className="p-4">Họ Tên</th><th className="p-4 w-48">Đơn Vị</th><th className="p-4 w-36">Chức vụ</th><th className="p-4 w-32">SĐT</th><th className="p-4 w-32">Thâm niên</th><th className="p-4 text-center w-40">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={7} className="p-12 text-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#05469B]" />Đang tải dữ liệu...</td></tr>
                ) : filteredPersonnel.length === 0 ? (
                  <tr><td colSpan={7} className="p-16 text-center text-gray-500">
                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">Không có nhân sự nào trong danh sách hiển thị.</p>
                  </td></tr>
                ) : (
                  filteredPersonnel.map((item) => (
                    <tr key={item.ID_NhanSu} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="p-4 font-semibold text-gray-800">{item.MaNV}</td>
                      <td className="p-4 font-bold text-[#05469B]">{item.HoTen}</td>
                      <td className="p-4 text-sm font-medium text-gray-700">{donViMap[item.ID_DonVi] || item.ID_DonVi || '-'}</td>
                      <td className="p-4 text-sm text-gray-600">{item.ChucVu}</td>
                      
                      <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{formatPhoneNumber(item.SDT)}</td>
                      
                      <td className="p-4 text-sm font-medium text-emerald-600"><span className="bg-emerald-50/50 rounded-md inline-block px-2 py-1 border border-emerald-100">{calculateSeniority(item.NgayNhanViec)}</span></td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleView(item)} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors" title="Xem chi tiết"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleDuplicate(item)} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors" title="Nhân bản (Tạo hồ sơ kiêm nhiệm)"><Copy className="w-4 h-4" /></button>
                          <button onClick={() => openModal('update', item)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Sửa"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => { setItemToDelete(item.ID_NhanSu); setIsConfirmOpen(true); }} className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Xóa"><Trash2 className="w-4 h-4" /></button>
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

      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-100 bg-[#05469B] rounded-t-2xl text-white shrink-0">
              <h3 className="text-lg font-bold flex items-center gap-2"><UserIcon size={20} /> Chi tiết Hồ sơ Nhân sự</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-white hover:text-red-300 hover:bg-white/10 rounded-full p-1.5 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 border-b border-gray-100 pb-6 text-center sm:text-left">
                <div className="w-24 h-24 rounded-full bg-blue-100 text-[#05469B] flex items-center justify-center text-4xl font-black shrink-0 border-4 border-white shadow-md">
                  {viewData.HoTen?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2 sm:gap-3 mb-1">
                    <h2 className="text-2xl font-black text-gray-800">{viewData.HoTen}</h2>
                    <span className="px-2.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-bold text-gray-600">ID: {viewData.MaNV}</span>
                  </div>
                  <p className="text-lg font-bold text-[#05469B] mb-3">{viewData.ChucVu}</p>
                  <div className="flex flex-col sm:flex-row flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 text-sm text-gray-600 font-medium">
                    <span className="flex items-center justify-center sm:justify-start gap-1.5"><Phone size={16} className="text-gray-400"/> {formatPhoneNumber(viewData.SDT) || 'Chưa có SĐT'}</span>
                    <span className="flex items-center justify-center sm:justify-start gap-1.5"><Mail size={16} className="text-gray-400"/> {viewData.Email || 'Chưa có Email'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-3 uppercase tracking-wider text-sm flex items-center gap-2"><Building2 size={18} className="text-[#05469B]"/> Thông tin Công tác</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div><p className="text-xs text-gray-500 uppercase font-bold mb-1">Đơn vị</p><p className="font-semibold text-gray-800 break-words">{donViMap[viewData.ID_DonVi] || viewData.ID_DonVi || '---'}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase font-bold mb-1">Phân loại</p><p className="font-semibold text-gray-800">{viewData.PhanLoai || '---'}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase font-bold mb-1">Ngày nhận việc</p><p className="font-semibold text-gray-800">{viewData.NgayNhanViec ? new Date(viewData.NgayNhanViec).toLocaleDateString('vi-VN') : '---'}</p></div>
                  <div><p className="text-xs text-gray-500 uppercase font-bold mb-1">Thâm niên</p><p className="font-semibold text-emerald-600">{calculateSeniority(viewData.NgayNhanViec)}</p></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-gray-800 mb-3 uppercase tracking-wider text-sm flex items-center gap-2"><UserIcon size={18} className="text-orange-500"/> Cá nhân & Ngoại hình</h4>
                  <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between border-b border-orange-100 pb-2 gap-1 sm:gap-4"><span className="text-gray-500 text-sm sm:w-20 shrink-0">Giới tính:</span><span className="font-semibold text-gray-800 text-sm sm:text-right">{viewData.GioiTinh || '---'}</span></div>
                    <div className="flex flex-col sm:flex-row sm:justify-between border-b border-orange-100 pb-2 gap-1 sm:gap-4">
                      <span className="text-gray-500 text-sm sm:w-20 shrink-0">Năm sinh:</span>
                      <span className="font-semibold text-gray-800 text-sm sm:text-right">
                        {viewData.NamSinh ? new Date(viewData.NamSinh).toLocaleDateString('vi-VN') : '---'} 
                        {viewData.Tuoi && <span className="ml-2 text-orange-600 font-bold">({viewData.Tuoi} tuổi)</span>}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between border-b border-orange-100 pb-2 gap-1 sm:gap-4"><span className="text-gray-500 text-sm sm:w-20 shrink-0">Trình độ:</span><span className="font-semibold text-gray-800 text-sm sm:text-right">{viewData.TrinhDoHocVan || '---'}</span></div>
                    <div className="flex flex-col sm:flex-row sm:justify-between border-b border-orange-100 pb-2 gap-1 sm:gap-4"><span className="text-gray-500 text-sm sm:w-20 shrink-0">Thu nhập:</span><span className="font-semibold text-gray-800 text-sm sm:text-right">{formatCurrency(viewData.ThuNhap) || '---'} VNĐ</span></div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4"><span className="text-gray-500 text-sm sm:w-20 shrink-0">Ngoại hình:</span><span className="font-semibold text-gray-800 text-sm sm:text-right whitespace-pre-wrap flex-1">{viewData.MoTaNgoaiHinh || '---'}</span></div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <h4 className="font-bold text-gray-800 mb-3 uppercase tracking-wider text-sm flex items-center gap-2"><Info size={18} className="text-blue-500"/> Ghi chú khác</h4>
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex-1">
                    <p className="text-sm font-semibold text-gray-800 whitespace-pre-wrap">{viewData.GhiChu || 'Không có ghi chú.'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-3 uppercase tracking-wider text-sm flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-500"/> Chứng chỉ / Kỹ năng</h4>
                <div className="flex flex-col gap-3">
                  
                  {viewData.GPLX && viewData.GPLX !== 'Không có' && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-sm font-bold text-gray-600 mr-1 shrink-0">Bằng lái xe:</span>
                      {viewData.GPLX.split(',').map((bang, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-blue-100 text-[#05469B] font-black rounded-md text-xs border border-blue-200">
                          Hạng {bang.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-2">
                    {CERTIFICATES.filter(cert => viewData[cert.id as keyof Personnel]).length > 0 ? (
                      CERTIFICATES.filter(cert => viewData[cert.id as keyof Personnel]).map(cert => {
                        const Icon = cert.icon;
                        return (
                          <div key={cert.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-bold shadow-sm">
                            <Icon size={16} /> {cert.label}
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-gray-400 italic">Chưa cập nhật chứng chỉ khác.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end shrink-0">
              <button onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-100 bg-gray-50 rounded-t-2xl shrink-0">
              <h3 className="text-xl font-bold text-[#05469B]">{modalMode === 'create' ? 'Thêm Hồ sơ' : 'Cập nhật Hồ sơ'}</h3>
              <button onClick={() => setIsModalOpen(false)} disabled={submitting} className="text-gray-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-6">
              
              <div className="bg-blue-50/40 p-4 sm:p-5 rounded-xl border border-blue-100">
                <h4 className="font-bold text-[#05469B] mb-4 flex items-center gap-2"><div className="w-2 h-6 bg-[#05469B] rounded-full"></div> Thông tin cá nhân</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Mã NV *</label><input type="text" required name="MaNV" value={formData.MaNV || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Họ và Tên *</label><input type="text" required name="HoTen" value={formData.HoTen || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Giới tính</label><select name="GioiTinh" value={formData.GioiTinh || 'Nam'} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]"><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Năm sinh</label><input type="date" name="NamSinh" value={formData.NamSinh ? formData.NamSinh.split('T')[0] : ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại</label><input type="tel" name="SDT" value={formData.SDT || ''} onChange={(e) => setFormData({...formData, SDT: formatPhoneNumber(e.target.value)})} maxLength={13} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] font-bold tracking-wide" placeholder="09xx xxx xxx" /></div>
                  <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Email</label><input type="email" name="Email" value={formData.Email || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><div className="w-2 h-6 bg-gray-400 rounded-full"></div> Công việc</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Đơn vị công tác *</label>
                    <select required name="ID_DonVi" value={formData.ID_DonVi || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] text-sm">
                      <option value="">-- Chọn đơn vị --</option>
                      {donViList.filter(dv => allowedDonViIds.includes(dv.ID_DonVi)).map(dv => (
                        <option key={dv.ID_DonVi} value={dv.ID_DonVi}>{dv.TenDonVi}</option>
                      ))}
                    </select>
                  </div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Chức vụ *</label><input type="text" required name="ChucVu" value={formData.ChucVu || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phân loại</label>
                    <select name="PhanLoai" value={formData.PhanLoai || 'Lãnh đạo'} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]">
                      <option value="Lãnh đạo">Lãnh đạo</option>
                      <option value="PT DVHT KD">PT DVHT KD</option>
                      <option value="PT PVHC">PT PVHC</option>
                      <option value="PT NS">PT NS</option>
                      <option value="BV, ĐTKH">BV, ĐTKH</option>
                    </select>
                  </div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Ngày nhận việc</label><input type="date" name="NgayNhanViec" value={formData.NgayNhanViec ? formData.NgayNhanViec.split('T')[0] : ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Trình độ học vấn</label>
                    <select name="TrinhDoHocVan" value={formData.TrinhDoHocVan || ''} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]">
                      <option value="">-- Chọn trình độ --</option>
                      <option value="Tiểu học">Tiểu học</option>
                      <option value="Trung học cơ sở">Trung học cơ sở</option>
                      <option value="Trung học phổ thông">Trung học phổ thông</option>
                      <option value="Sơ cấp: Chứng chỉ nghề 3 tháng">Sơ cấp: Chứng chỉ nghề 3 tháng</option>
                      <option value="Sơ cấp: Chứng chỉ nghề 6 tháng">Sơ cấp: Chứng chỉ nghề 6 tháng</option>
                      <option value="Trung cấp nghề">Trung cấp nghề</option>
                      <option value="Trung cấp chuyên nghiệp">Trung cấp chuyên nghiệp</option>
                      <option value="Cao đẳng">Cao đẳng</option>
                      <option value="Đại học">Đại học</option>
                      <option value="Thạc sĩ/Tiến sĩ">Thạc sĩ/Tiến sĩ</option>
                    </select>
                  </div>
                  <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Mức thu nhập (VNĐ)</label><input type="text" name="ThuNhap" value={formatCurrency(formData.ThuNhap)} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]" /></div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-2">Giấy phép lái xe (Tick chọn nhiều)</label>
                <div className="bg-[#FFFFF0] border border-gray-200 rounded-xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gplxGroups.map((group, groupIdx) => (
                      <div key={groupIdx} className="space-y-2">
                        <h5 className="text-[11px] font-black text-[#05469B] uppercase border-b border-blue-100 pb-1 mb-2">
                          {group.title}
                        </h5>
                        <div className="flex flex-col gap-2">
                          {group.options.map((opt, optIdx) => {
                            const isChecked = currentGPLXList.includes(opt.value);
                            return (
                              <label key={optIdx} className="flex items-start gap-2 cursor-pointer group/cb">
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={(e) => handleGPLXChange(opt.value, e.target.checked)}
                                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#05469B] focus:ring-[#05469B] cursor-pointer"
                                />
                                <span className={`text-sm transition-colors ${isChecked ? 'font-bold text-[#05469B]' : 'font-medium text-gray-600 group-hover/cb:text-[#05469B]'}`}>
                                  {opt.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50/40 p-4 sm:p-5 rounded-xl border border-emerald-100">
                <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2"><div className="w-2 h-6 bg-emerald-500 rounded-full"></div> Chứng chỉ phụ trợ</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {CERTIFICATES.map(cert => {
                    const Icon = cert.icon;
                    return (
                      <label key={cert.id} className="flex items-center p-2.5 border border-emerald-200 rounded-lg bg-[#FFFFF0] cursor-pointer hover:border-emerald-500 transition-colors shadow-sm">
                        <input type="checkbox" name={cert.id} checked={formData[cert.id as keyof Personnel] as boolean || false} onChange={handleInputChange} className="w-4 h-4 text-emerald-600 rounded border-gray-300 mr-2 focus:ring-emerald-500" />
                        <Icon size={16} className="text-gray-500 mr-1.5 shrink-0" />
                        <span className="text-[11px] sm:text-xs font-bold text-gray-700 leading-tight">{cert.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="bg-orange-50/40 p-4 sm:p-5 rounded-xl border border-orange-100">
                <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2"><div className="w-2 h-6 bg-orange-500 rounded-full"></div> Thông tin Bổ sung</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Mô tả ngoại hình</label>
                    <textarea name="MoTaNgoaiHinh" value={formData.MoTaNgoaiHinh || ''} onChange={handleInputChange} rows={3} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] resize-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Ghi chú khác</label>
                    <textarea name="GhiChu" value={formData.GhiChu || ''} onChange={handleInputChange} rows={3} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] resize-none"></textarea>
                  </div>
                </div>
              </div>

              <div className="pt-4 sm:pt-5 border-t border-gray-100 flex justify-end gap-3 mt-6 sm:mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition-colors">Hủy</button>
                <button type="submit" disabled={submitting} className="w-full sm:w-auto px-8 py-3 text-white bg-[#05469B] hover:bg-[#04367a] rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-colors">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Lưu Dữ Liệu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isConfirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center animate-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border-4 border-red-100"><AlertCircle className="w-8 h-8" /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-gray-500 text-sm mb-6">Hành động này sẽ xóa nhân sự này vĩnh viễn.</p>
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
