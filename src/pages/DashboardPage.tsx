import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { DonVi, Personnel, ThietBi } from '../types';
import { getUnitEmoji } from '../utils/hierarchy';
import { 
  Building2, MapPin, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen,
  Search, Loader2, Filter, LayoutDashboard, Users, MonitorSmartphone,
  Flame, AlertTriangle, Activity, Briefcase, BellRing, FileText, ShieldAlert, ShieldCheck, Video
} from 'lucide-react';

// 🟢 1. BỘ XỬ LÝ NGÀY THÁNG BẤT TỬ
const parseDateStrict = (val: any): Date | null => {
  if (!val || val === 0 || val === '0') return null;
  const d = new Date(val);
  if (!isNaN(d.getTime()) && d.getFullYear() > 2000) return d;

  const s = String(val).trim().toLowerCase();
  const mVN = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (mVN) {
    const d2 = new Date(parseInt(mVN[3], 10), parseInt(mVN[2], 10) - 1, parseInt(mVN[1], 10));
    if (!isNaN(d2.getTime())) return d2;
  }
  
  const numMatch = s.match(/\b(\d{5})\b/);
  if (numMatch && Number(numMatch[1]) > 30000) {
    return new Date((Number(numMatch[1]) - 25569) * 86400 * 1000);
  }
  return null;
};

// 🟢 2. THUẬT TOÁN TỰ ĐỘNG CỘNG THÁNG VÀO NGÀY BẮT ĐẦU
const extractDateAndAddDuration = (durationRaw: any, startDateRaw: any): Date | null => {
  const baseDate = parseDateStrict(startDateRaw);
  if (!baseDate) return null;
  
  let monthsToAdd = 0;
  const s = String(durationRaw).toLowerCase().trim();
  
  if (/^\d+$/.test(s)) {
    monthsToAdd = parseInt(s, 10);
  } else {
    const monthMatch = s.match(/(\d+)\s*tháng/);
    const yearMatch = s.match(/(\d+)\s*năm/);
    if (monthMatch) monthsToAdd = parseInt(monthMatch[1], 10);
    else if (yearMatch) monthsToAdd = parseInt(yearMatch[1], 10) * 12;
  }
  
  if (monthsToAdd > 0) {
    baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
  }
  return baseDate;
};

// 🟢 3. HÀM ĐỊNH DẠNG TIỀN TỆ (Thêm mới)
const formatCurrency = (val: any) => {
  if (!val) return 'Chưa cập nhật';
  // Lọc lấy phần số
  const num = Number(String(val).replace(/[^0-9.-]+/g,""));
  // Nếu không phải số hợp lệ thì trả về nguyên bản chữ
  if (isNaN(num) || num === 0) return String(val);
  // Định dạng chuẩn Việt Nam
  return num.toLocaleString('vi-VN') + ' VNĐ';
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [donViList, setDonViList] = useState<DonVi[]>([]);
  
  // Dữ liệu thô từ APIs
  const [nsData, setNsData] = useState<Personnel[]>([]);
  const [tbData, setTbData] = useState<ThietBi[]>([]);
  const [tsPcccData, setTsPcccData] = useState<any[]>([]); 
  const [vbData, setVbData] = useState<any[]>([]); 
  const [anNinhData, setAnNinhData] = useState<any[]>([]); 
  
  const [loading, setLoading] = useState(true);

  // --- SLICER STATES ---
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);
  
  const currentYear = new Date().getFullYear();
  const [docYear, setDocYear] = useState<number>(currentYear);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const safeCall = async (apiFunc: any) => {
        if (typeof apiFunc !== 'function') return [];
        try {
          const res = await apiFunc();
          return Array.isArray(res) ? res : [];
        } catch (e) {
          console.warn("API Call Failed, fallback to empty array.");
          return [];
        }
      };

      try {
        const [dvRes, nsRes, tbRes, tsPcccRes, vbRes, anNinhRes] = await Promise.all([
          safeCall(apiService.getDonVi),
          safeCall(apiService.getPersonnel),
          safeCall(apiService.getThietBi),
          safeCall((apiService as any).getTsPCCC),
          safeCall((apiService as any).getVanBan),
          safeCall((apiService as any).getAnNinh) 
        ]);

        setDonViList(dvRes);
        setNsData(nsRes);
        setTbData(tbRes);
        setTsPcccData(tsPcccRes);
        setVbData(vbRes);
        setAnNinhData(anNinhRes);
      } catch (error) {
        console.error("Lỗi tải dữ liệu Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const donViMap = useMemo(() => {
    const map: Record<string, string> = {};
    donViList.forEach(dv => { map[dv.ID_DonVi] = dv.TenDonVi; });
    return map;
  }, [donViList]);

  const getAllSubIds = (unitId: string, allUnits: DonVi[]): string[] => {
    const subs = allUnits.filter(u => u.CapQuanLy === unitId);
    let ids = subs.map(u => u.ID_DonVi);
    subs.forEach(s => { ids = [...ids, ...getAllSubIds(s.ID_DonVi, allUnits)]; });
    return ids;
  };

  const isCountableUnit = (dv: DonVi) => {
    const status = String(dv.trangThai || '').toLowerCase();
    return !status.includes('đại lý') && !status.includes('dự án') && !status.includes('đầu tư mới');
  };

  const allowedDonViIds = useMemo(() => {
    if (!user) return [];
    if (user.idDonVi === 'ALL') return donViList.map(dv => dv.ID_DonVi);
    const level1 = [user.idDonVi];
    const level2 = donViList.filter(dv => level1.includes(dv.CapQuanLy)).map(dv => dv.ID_DonVi);
    const level3 = donViList.filter(dv => level2.includes(dv.CapQuanLy)).map(dv => dv.ID_DonVi);
    return [...level1, ...level2, ...level3];
  }, [user, donViList]);

  const filteredUnits = useMemo(() => {
    let baseUnits = donViList.filter(dv => allowedDonViIds.includes(dv.ID_DonVi));
    if (!unitSearchTerm) return baseUnits;

    const lower = unitSearchTerm.toLowerCase();
    const matchedIds = new Set<string>();

    baseUnits.forEach(u => {
      if (String(u.TenDonVi || '').toLowerCase().includes(lower) || String(u.ID_DonVi || '').toLowerCase().includes(lower)) {
        matchedIds.add(u.ID_DonVi);
        let parentId = u.CapQuanLy;
        let safeCounter = 0;
        while (parentId && parentId !== 'HO' && safeCounter < 10) {
          matchedIds.add(parentId);
          const parentUnit = baseUnits.find(p => p.ID_DonVi === parentId);
          parentId = parentUnit ? parentUnit.CapQuanLy : null;
          safeCounter++;
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

  const { vpdhUnits, ctttNamUnits, ctttBacUnits } = useMemo(() => {
    const vpdh = parentUnits.filter(u => String(u.Phia || '').toLowerCase().includes('vpđh') || String(u.loaiHinh || '').toLowerCase().includes('tổng công ty') || String(u.loaiHinh || '').toLowerCase().includes('văn phòng'));
    const ctttNam = parentUnits.filter(u => !vpdh.includes(u) && String(u.Phia || '').toLowerCase().includes('nam'));
    const ctttBac = parentUnits.filter(u => !vpdh.includes(u) && !ctttNam.includes(u) && String(u.Phia || '').toLowerCase().includes('bắc'));
    return { vpdhUnits: vpdh, ctttNamUnits: ctttNam, ctttBacUnits: ctttBac };
  }, [parentUnits]);

  const toggleParent = (parentId: string) => setExpandedParents(prev => prev.includes(parentId) ? prev.filter(id => id !== parentId) : [...prev, parentId]);

  const renderUnitTree = (parent: DonVi, level: number = 1) => {
    const children = getChildUnits(parent.ID_DonVi);
    const isExpanded = expandedParents.includes(parent.ID_DonVi) || !!unitSearchTerm;
    const isParentDimmed = !isCountableUnit(parent);

    return (
      <div key={parent.ID_DonVi} className={level === 1 ? "mb-1" : "mt-1"}>
        <button 
          onClick={() => { setSelectedUnitFilter(parent.ID_DonVi); if (children.length > 0) toggleParent(parent.ID_DonVi); }} 
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${selectedUnitFilter === parent.ID_DonVi ? 'bg-[#05469B] text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'} ${isParentDimmed ? 'opacity-50' : ''}`}
        >
          {children.length > 0 ? (isExpanded ? <ChevronDown size={16} className="shrink-0" /> : <ChevronRight size={16} className="shrink-0" />) : <div className="w-4 shrink-0" />}
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

  const selectedUnitName = useMemo(() => {
    if (!selectedUnitFilter) return 'Toàn bộ Hệ thống';
    const unit = donViList.find(d => d.ID_DonVi === selectedUnitFilter);
    return unit ? unit.TenDonVi : 'Toàn bộ Hệ thống';
  }, [selectedUnitFilter, donViList]);

  const currentSubordinateIds = useMemo(() => {
    if (!selectedUnitFilter) return donViList.map(u => u.ID_DonVi);
    return [selectedUnitFilter, ...getAllSubIds(selectedUnitFilter, donViList)];
  }, [selectedUnitFilter, donViList]);

  // 🟢 TÍNH TOÁN DỮ LIỆU NHÂN SỰ CHO WIDGET GỘP TRÊN CÙNG
  const { widgetStats, staffRolesStats } = useMemo(() => {
    const totalUnits = donViList.filter(dv => currentSubordinateIds.includes(dv.ID_DonVi) && dv.ID_DonVi !== selectedUnitFilter && isCountableUnit(dv)).length || 0;
    
    let totalStaff = 0;
    let dvht = 0;
    let bv = 0;
    let pvhc = 0;

    nsData.forEach(ns => {
      if (currentSubordinateIds.includes(ns.ID_DonVi) && ns.TrangThai !== 'Đã nghỉ việc') {
        totalStaff++;
        const role = String(ns.PhanLoai || '').toUpperCase();
        if (role.includes('PT DVHT KD')) dvht++;
        if (role.includes('BV, ĐTKH') || role.includes('BẢO VỆ')) bv++;
        if (role.includes('PVHC')) pvhc++;
      }
    });

    return { 
      widgetStats: { totalUnits, totalStaff }, 
      staffRolesStats: { dvht, bv, pvhc } 
    };
  }, [currentSubordinateIds, donViList, nsData, selectedUnitFilter]);

  const companyScaleStats = useMemo(() => {
    const activeNam = ctttNamUnits.filter(u => currentSubordinateIds.includes(u.ID_DonVi));
    const activeBac = ctttBacUnits.filter(u => currentSubordinateIds.includes(u.ID_DonVi));

    const processScale = (units: DonVi[]) => {
      return units.map(u => {
        const subIds = getAllSubIds(u.ID_DonVi, donViList);
        const activeSubCount = subIds.filter(id => {
          if (!currentSubordinateIds.includes(id)) return false;
          const dv = donViList.find(d => d.ID_DonVi === id);
          return dv ? isCountableUnit(dv) : false;
        }).length;
        return { id: u.ID_DonVi, name: u.TenDonVi, count: activeSubCount };
      }).sort((a, b) => b.count - a.count); 
    };
    return { nam: processScale(activeNam), bac: processScale(activeBac) };
  }, [ctttNamUnits, ctttBacUnits, currentSubordinateIds, donViList]);

  const maxScaleNam = Math.max(...companyScaleStats.nam.map(i => i.count), 1);
  const maxScaleBac = Math.max(...companyScaleStats.bac.map(i => i.count), 1);

  // 🟢 [BẢNG 1: PCCC GOM NHÓM - CHỈ LẤY THIẾT BỊ SẮP HẾT HẠN]
  const pcccWarningsGrouped = useMemo(() => {
    const groups: Record<string, any> = {};
    const today = new Date();
    today.setHours(0,0,0,0);

    tsPcccData.forEach(eq => {
      if (currentSubordinateIds.includes(eq.ID_DonVi)) {
        const expDate = parseDateStrict(eq.NgayHetHan || eq.HanKiemDinh);
        if (expDate) {
          const diffTime = expDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 30) {
            const unitName = donViMap[eq.ID_DonVi] || eq.ID_DonVi;
            const dateStr = expDate.toLocaleDateString('vi-VN');
            const key = `${unitName}_${dateStr}`;
            
            if(!groups[key]) {
              groups[key] = {
                unitName,
                dateStr,
                daysLeft: diffDays,
                items: {} 
              };
            }
            
            const itemName = eq.LoaiThietBi || 'Thiết bị';
            groups[key].items[itemName] = (groups[key].items[itemName] || 0) + 1;
          }
        }
      }
    });
    return Object.values(groups).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [tsPcccData, currentSubordinateIds, donViMap]);

  // 🟢 [BẢNG 2: THỐNG KÊ CAMERA TỪ SHEET AN NINH - CẬP NHẬT CÁC CỘT]
  const cameraStatsList = useMemo(() => {
    const list: any[] = [];
    anNinhData.forEach(an => {
      if (currentSubordinateIds.includes(an.ID_DonVi)) {
        // Lấy Tổng SL
        const tongCam = parseInt(String(an.SLCAM || 0).replace(/\D/g,''), 10) || 0;
        // Lấy SL Hư Hỏng
        const camHu = parseInt(String(an.CAMHuHong || 0).replace(/\D/g,''), 10) || 0; 
        // Lấy SL Đang Hoạt Động
        const camHD = parseInt(String(an.CAMHD || 0).replace(/\D/g,''), 10) || (tongCam > 0 ? tongCam - camHu : 0);
        
        const lyDoHu = an.LyDoHuCam || 'Chưa cập nhật lý do'; 
        
        if (tongCam > 0 || camHu > 0 || camHD > 0) {
          list.push({
            unitName: donViMap[an.ID_DonVi] || an.ID_DonVi,
            tongCam,
            camHD,
            camHu,
            lyDoHu
          });
        }
      }
    });
    // Sắp xếp: Đơn vị hư nhiều xếp trước
    return list.sort((a, b) => b.camHu - a.camHu);
  }, [anNinhData, currentSubordinateIds, donViMap]);

  // 🟢 [BẢNG 3: HỢP ĐỒNG BẢO VỆ DỊCH VỤ - BỔ SUNG CHI PHÍ]
  const anNinhStatsList = useMemo(() => {
    const list: any[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    anNinhData.forEach(an => {
      if (currentSubordinateIds.includes(an.ID_DonVi) && an.NCC_DichVu && String(an.NCC_DichVu).trim() !== '') {
        let expDate = null;
        const directExpRaw = an.NgayHetHan || an.NgayHetHanHD || an.NgayKetThuc || an.NgayKT;
        
        if (directExpRaw) {
           expDate = parseDateStrict(directExpRaw);
        }

        if (!expDate) {
           const durationRaw = an.HanHopDong || an.HanHD || an.ThoiHanHD || an.ThoiGianHD || an.Thoihan || an.ThoiGianLuu || an.ThoiHan || ''; 
           const startRaw = an.NgayKyHD || an.Ngaycd || an.NgayKy || an.NgayBatDau || '';
           expDate = extractDateAndAddDuration(durationRaw, startRaw);
        }

        let diffDays = null;
        let dateStr = 'Chưa rõ hạn';

        if (expDate) {
          const diffTime = expDate.getTime() - today.getTime();
          diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          dateStr = expDate.toLocaleDateString('vi-VN');
        }

        // Bổ sung lấy giá trị Chi phí thuê (hỗ trợ đọc từ nhiều tên cột khác nhau nếu sheet đổi tên)
        const costRaw = an.ChiPhiThue || an.ChiPhi || an.GiaTriHD || an.TongChiPhi || '';

        list.push({
          unitName: donViMap[an.ID_DonVi] || an.ID_DonVi,
          provider: an.NCC_DichVu,
          daysLeft: diffDays,
          dateStr: dateStr,
          cost: formatCurrency(costRaw) // 🟢 Thêm trường giá trị thuê
        });
      }
    });
    return list.sort((a, b) => {
      if (a.daysLeft === null) return 1;
      if (b.daysLeft === null) return -1;
      return a.daysLeft - b.daysLeft;
    });
  }, [anNinhData, currentSubordinateIds, donViMap]);

  const staffChartData = useMemo(() => {
    const roleCounts: Record<string, number> = {};
    nsData.forEach(ns => {
      if (currentSubordinateIds.includes(ns.ID_DonVi) && ns.TrangThai !== 'Đã nghỉ việc') {
        const roleName = ns.PhanLoai || 'Chưa phân loại';
        roleCounts[roleName] = (roleCounts[roleName] || 0) + 1;
      }
    });

    const sortedData = Object.keys(roleCounts)
      .map(key => ({ name: key, count: roleCounts[key] }))
      .sort((a, b) => b.count - a.count);

    const maxCount = sortedData.length > 0 ? sortedData[0].count : 1;
    return { data: sortedData, maxCount };
  }, [nsData, currentSubordinateIds]);

  const docChartData = useMemo(() => {
    const deptDocCounts: Record<string, number> = {};
    
    vbData.forEach(vb => {
      if (currentSubordinateIds.includes(vb.ID_DonVi) && String(vb.Phanloai || '').toLowerCase().includes('thông báo')) {
        const d = parseDateStrict(vb.NgayBanHanh);
        if (d && d.getFullYear() === docYear) {
          const deptName = vb.BPlayso || 'Khác';
          deptDocCounts[deptName] = (deptDocCounts[deptName] || 0) + 1;
        }
      }
    });

    const sortedData = Object.keys(deptDocCounts)
      .map(key => ({ name: key, count: deptDocCounts[key] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); 

    const maxCount = sortedData.length > 0 ? sortedData[0].count : 1;
    return { data: sortedData, maxCount };
  }, [vbData, currentSubordinateIds, docYear]);

  const assetChartData = useMemo(() => {
    const groupStats: Record<string, { total: number, dangSuDung: number, luuKho: number, suaChua: number, thanhLy: number }> = {};
    
    tbData.filter(tb => currentSubordinateIds.includes(tb.ID_DonVi)).forEach(tb => {
      const groupName = tb.NhomThietBi || 'Chưa phân nhóm';
      const tt = String(tb.TinhTrang || '').toLowerCase();
      
      if (!groupStats[groupName]) { groupStats[groupName] = { total: 0, dangSuDung: 0, luuKho: 0, suaChua: 0, thanhLy: 0 }; }
      groupStats[groupName].total++;
      
      if (tt.includes('đang sử dụng')) { groupStats[groupName].dangSuDung++; } 
      else if (tt.includes('sửa chữa')) { groupStats[groupName].suaChua++; } 
      else if (tt.includes('thanh lý') || tt.includes('hỏng')) { groupStats[groupName].thanhLy++; } 
      else { groupStats[groupName].luuKho++; }
    });

    return Object.keys(groupStats).map(key => ({ name: key, ...groupStats[key] })).sort((a, b) => b.total - a.total); 
  }, [tbData, currentSubordinateIds]);

  return (
    <div className="flex h-full bg-[#f4f7f9] overflow-hidden relative">
      {isListCollapsed && (
        <button onClick={() => setIsListCollapsed(false)} className="absolute top-6 left-6 z-20 bg-white p-2.5 rounded-lg shadow-md border border-gray-200 text-[#05469B] hover:bg-blue-50 transition-all">
          <PanelLeftOpen size={20} />
        </button>
      )}

      <div className={`${isListCollapsed ? 'w-0 opacity-0 -ml-80 lg:ml-0' : 'w-80 opacity-100 absolute lg:relative inset-y-0 left-0'} transition-all duration-300 ease-in-out bg-white border-r border-gray-200 flex flex-col h-full shadow-2xl lg:shadow-sm z-50 lg:z-10 shrink-0 overflow-hidden`}>
        <div className="p-4 border-b border-gray-100 bg-blue-50/50">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-black text-[#05469B] flex items-center gap-2"><Filter size={20} /> Bộ lọc Báo cáo</h2>
            <button onClick={() => setIsListCollapsed(true)} className="p-1.5 text-gray-400 hover:text-[#05469B] hover:bg-blue-100 rounded-md"><PanelLeftClose size={18} /></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05469B]/50" size={16} />
            <input type="text" placeholder="Tìm tên đơn vị để lọc..." className="w-full pl-9 pr-4 py-2 bg-white border border-blue-100 rounded-lg text-sm focus:ring-2 focus:ring-[#05469B] outline-none shadow-sm" value={unitSearchTerm} onChange={(e) => setUnitSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 min-w-[319px] custom-scrollbar">
          <button onClick={() => setSelectedUnitFilter(null)} className={`w-full flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-black mb-4 transition-all ${selectedUnitFilter === null ? 'bg-gradient-to-r from-[#05469B] to-[#0a5bc4] text-white shadow-md' : 'text-gray-600 hover:bg-blue-50'}`}>
            <Building2 size={18} className={selectedUnitFilter === null ? 'text-blue-100' : 'text-[#05469B]'} /> Báo cáo Tổng quan Hệ thống
          </button>
          <hr className="border-gray-100 mb-4 mx-2"/>
          {loading ? (<div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#05469B]" /></div>) : (
            <div className="space-y-6">
              {vpdhUnits.length > 0 && (<div><p className="px-3 text-[10px] font-black text-[#05469B] uppercase tracking-wider mb-2 flex items-center gap-1">VPĐH / TCT</p>{vpdhUnits.map(dv => renderUnitTree(dv))}</div>)}
              {ctttNamUnits.length > 0 && (<div><p className="px-3 text-[10px] font-black text-orange-600 uppercase tracking-wider mb-2 flex items-center gap-1">CTTT Phía Nam</p>{ctttNamUnits.map(dv => renderUnitTree(dv))}</div>)}
              {ctttBacUnits.length > 0 && (<div><p className="px-3 text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1">CTTT Phía Bắc</p>{ctttBacUnits.map(dv => renderUnitTree(dv))}</div>)}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative transition-all duration-300">
        
        <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 transition-all duration-300 ${isListCollapsed ? 'pl-10 lg:pl-12' : ''}`}>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#05469B] flex items-center gap-2 tracking-tight"><LayoutDashboard size={32} /> Tổng Quan Hệ Thống</h1>
            <p className="text-gray-500 font-medium mt-1 flex items-center gap-2">Đang phân tích dữ liệu: <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-bold text-sm shadow-sm">{selectedUnitName}</span></p>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-[#05469B] mb-4" />
            <p className="text-gray-500 font-bold animate-pulse">Đang tổng hợp số liệu báo cáo...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* 🟢 VÙNG 1: WIDGETS TỔNG QUAN QUY MÔ (ĐÃ CẬP NHẬT GIAO DIỆN 1 HÀNG) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Building2 size={14}/> Thượng Tầng Quản Trị</p>
                <div className="flex items-center justify-between px-2">
                  <div className="text-center">
                    <p className="text-2xl font-black text-[#05469B]">{vpdhUnits.length}</p>
                    <p className="text-[10px] font-bold text-gray-400">VPĐH</p>
                  </div>
                  <div className="w-px h-8 bg-gray-100"></div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-orange-600">{ctttNamUnits.length}</p>
                    <p className="text-[10px] font-bold text-gray-400">PHÍA NAM</p>
                  </div>
                  <div className="w-px h-8 bg-gray-100"></div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-emerald-600">{ctttBacUnits.length}</p>
                    <p className="text-[10px] font-bold text-gray-400">PHÍA BẮC</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 z-10"><Building2 size={28}/></div>
                <div className="z-10">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cơ sở / SR Trực thuộc</p>
                  <p className="text-3xl font-black text-gray-800">{widgetStats.totalUnits}</p>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-5"><Building2 size={100}/></div>
              </div>

              {/* Ô TỔNG NHÂN SỰ VÀ CƠ CẤU (CHIẾM 2 CỘT NGANG) */}
              <div className="xl:col-span-2 bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between relative overflow-hidden gap-4">
                {/* Khối bên trái: Số lượng Tổng */}
                <div className="flex items-center gap-3 shrink-0 z-10 pl-2 border-r border-gray-100 pr-6">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm border border-emerald-100"><Users size={24}/></div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Tổng Nhân sự</p>
                    <p className="text-3xl font-black text-gray-800 leading-none">{widgetStats.totalStaff}</p>
                  </div>
                </div>
                
                {/* Khối bên phải: 3 cột cơ cấu nhỏ */}
                <div className="flex-1 grid grid-cols-3 gap-3 z-10">
                  <div className="bg-blue-50/70 rounded-xl py-2 px-1 text-center border border-blue-100/50 hover:bg-blue-100 transition-colors cursor-help" title="Nhân sự Phụ trách Dịch vụ Hỗ trợ Kinh doanh">
                    <p className="text-[10px] font-bold text-[#05469B]/70 mb-0.5 uppercase">NS PT DVHT KD</p>
                    <p className="font-black text-[#05469B] text-xl">{staffRolesStats.dvht}</p>
                  </div>
                  <div className="bg-blue-50/70 rounded-xl py-2 px-1 text-center border border-blue-100/50 hover:bg-blue-100 transition-colors cursor-help" title="Nhân sự Bảo vệ, Đối tác Khách hàng">
                    <p className="text-[10px] font-bold text-[#05469B]/70 mb-0.5 uppercase">NS BV, ĐTKH</p>
                    <p className="font-black text-[#05469B] text-xl">{staffRolesStats.bv}</p>
                  </div>
                  <div className="bg-blue-50/70 rounded-xl py-2 px-1 text-center border border-blue-100/50 hover:bg-blue-100 transition-colors cursor-help" title="Nhân sự Phục vụ Hành chính">
                    <p className="text-[10px] font-bold text-[#05469B]/70 mb-0.5 uppercase">NS PVHC</p>
                    <p className="font-black text-[#05469B] text-xl">{staffRolesStats.pvhc}</p>
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none"><Users size={150}/></div>
              </div>
            </div>

            {/* VÙNG 1.5: THỐNG KÊ QUY MÔ THEO MIỀN */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b border-orange-50 pb-3">
                  <h3 className="text-sm font-black text-orange-600 uppercase tracking-wider flex items-center gap-2"><MapPin size={18}/> Quy mô CTTT Phía Nam</h3>
                  <span className="text-xs font-bold text-gray-400">Số cơ sở trực thuộc</span>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[220px] custom-scrollbar pr-2 space-y-3">
                  {companyScaleStats.nam.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-4">Không có dữ liệu</p>
                  ) : (
                    companyScaleStats.nam.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-3 group">
                        <div className="w-[140px] sm:w-[180px] xl:w-[220px] text-left shrink-0">
                          <p className="text-xs font-bold text-gray-700 truncate group-hover:text-orange-600 transition-colors" title={item.name}>
                            {idx + 1}. {item.name}
                          </p>
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="h-5 bg-gradient-to-r from-orange-100 to-orange-400 rounded-md transition-all duration-1000 ease-out shadow-sm" style={{ width: `${Math.max((item.count / maxScaleNam) * 100, 2)}%` }}></div>
                          <span className="text-xs font-black text-gray-600 w-6">{item.count}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b border-emerald-50 pb-3">
                  <h3 className="text-sm font-black text-emerald-600 uppercase tracking-wider flex items-center gap-2"><MapPin size={18}/> Quy mô CTTT Phía Bắc</h3>
                  <span className="text-xs font-bold text-gray-400">Số cơ sở trực thuộc</span>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[220px] custom-scrollbar pr-2 space-y-3">
                  {companyScaleStats.bac.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-4">Không có dữ liệu</p>
                  ) : (
                    companyScaleStats.bac.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-3 group">
                        <div className="w-[140px] sm:w-[180px] xl:w-[220px] text-left shrink-0">
                          <p className="text-xs font-bold text-gray-700 truncate group-hover:text-emerald-600 transition-colors" title={item.name}>
                            {idx + 1}. {item.name}
                          </p>
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="h-5 bg-gradient-to-r from-emerald-100 to-emerald-400 rounded-md transition-all duration-1000 ease-out shadow-sm" style={{ width: `${Math.max((item.count / maxScaleBac) * 100, 2)}%` }}></div>
                          <span className="text-xs font-black text-gray-600 w-6">{item.count}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* VÙNG 2: 3 BIỂU ĐỒ TRỰC QUAN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* 1. BIỂU ĐỒ CƠ CẤU NHÂN SỰ */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[450px]">
                <div className="mb-6 shrink-0">
                  <h3 className="text-lg font-bold text-[#05469B] flex items-center gap-2"><Briefcase size={20}/> Cơ cấu Phân loại Nhân sự</h3>
                  <p className="text-[11px] font-semibold text-gray-500 mt-1">Số lượng nhân sự theo từng nhóm nghiệp vụ</p>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                  {staffChartData.data.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <Users size={40} className="mb-2 opacity-50"/>
                      <p className="font-medium text-sm">Chưa có dữ liệu.</p>
                    </div>
                  ) : (
                    staffChartData.data.map((item, idx) => {
                      const widthPct = Math.max((item.count / staffChartData.maxCount) * 100, 2);
                      return (
                        <div key={idx} className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-end">
                            <p className="text-xs font-bold text-gray-700 truncate pr-2">{item.name}</p>
                            <span className="text-xs font-black text-[#05469B] shrink-0">{item.count}</span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-300 to-[#05469B] rounded-full transition-all duration-1000 ease-out" style={{ width: `${widthPct}%` }}></div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* 2. BIỂU ĐỒ THỐNG KÊ THÔNG BÁO VĂN BẢN (CÓ BỘ LỌC NĂM) */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[450px]">
                <div className="mb-6 shrink-0 flex justify-between items-start gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-[#05469B] flex items-center gap-2"><BellRing size={20}/> Thông báo Ban hành</h3>
                    <p className="text-[11px] font-semibold text-gray-500 mt-1">Top 10 Phòng/Bộ phận phát hành nhiều nhất</p>
                  </div>
                  <select 
                    value={docYear} 
                    onChange={(e) => setDocYear(Number(e.target.value))} 
                    className="bg-blue-50 text-[#05469B] text-xs font-bold py-1.5 px-2 rounded-lg outline-none border border-blue-100 cursor-pointer shadow-sm"
                  >
                    {[currentYear + 1, currentYear, currentYear - 1, currentYear - 2].map(y => <option key={y} value={y}>Năm {y}</option>)}
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                  {docChartData.data.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <FileText size={40} className="mb-2 opacity-50"/>
                      <p className="font-medium text-sm">Chưa có dữ liệu năm {docYear}.</p>
                    </div>
                  ) : (
                    docChartData.data.map((item, idx) => {
                      const widthPct = Math.max((item.count / docChartData.maxCount) * 100, 2);
                      return (
                        <div key={idx} className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-end">
                            <p className="text-xs font-bold text-gray-700 truncate pr-2">{item.name}</p>
                            <span className="text-xs font-black text-[#05469B] shrink-0">{item.count}</span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-300 to-[#05469B] rounded-full transition-all duration-1000 ease-out" style={{ width: `${widthPct}%` }}></div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* 3. BIỂU ĐỒ TÌNH TRẠNG TÀI SẢN CHI TIẾT THEO NHÓM */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[450px]">
                <div className="mb-4 shrink-0">
                  <h3 className="text-lg font-bold text-[#05469B] flex items-center gap-2"><Activity size={20}/> Tình trạng Tài sản</h3>
                  <p className="text-[11px] font-semibold text-gray-500 mt-1">Trạng thái chi tiết theo từng nhóm thiết bị</p>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-2 mb-4 text-[10px] font-bold text-gray-600 bg-gray-50 p-2 rounded-lg shrink-0 border border-gray-100">
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Sử dụng</div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>Lưu kho</div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>Sửa chữa</div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>Hỏng/TL</div>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-5">
                  {assetChartData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <MonitorSmartphone size={40} className="mb-2 opacity-50"/>
                      <p className="font-medium text-sm">Chưa có dữ liệu tài sản.</p>
                    </div>
                  ) : (
                    assetChartData.map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold text-gray-700 truncate pr-2" title={item.name}>{item.name}</span>
                          <span className="font-black text-[#05469B] shrink-0 text-xs bg-blue-50 px-2 py-0.5 rounded">Tổng: {item.total}</span>
                        </div>
                        
                        <div className="flex h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          {item.dangSuDung > 0 && <div className="bg-emerald-500 transition-all duration-1000" style={{ width: `${(item.dangSuDung/item.total)*100}%` }}></div>}
                          {item.luuKho > 0 && <div className="bg-blue-400 transition-all duration-1000" style={{ width: `${(item.luuKho/item.total)*100}%` }}></div>}
                          {item.suaChua > 0 && <div className="bg-orange-400 transition-all duration-1000" style={{ width: `${(item.suaChua/item.total)*100}%` }}></div>}
                          {item.thanhLy > 0 && <div className="bg-red-500 transition-all duration-1000" style={{ width: `${(item.thanhLy/item.total)*100}%` }}></div>}
                        </div>
                        
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] font-bold">
                          {item.dangSuDung > 0 && <span className="text-emerald-600">ĐSD: {item.dangSuDung}</span>}
                          {item.luuKho > 0 && <span className="text-blue-500">LK: {item.luuKho}</span>}
                          {item.suaChua > 0 && <span className="text-orange-500">SC: {item.suaChua}</span>}
                          {item.thanhLy > 0 && <span className="text-red-500">TL: {item.thanhLy}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* 🟢 VÙNG 3: BỐ CỤC 3 CỘT MỚI DÀNH CHO CÁC BẢNG CẢNH BÁO */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* BẢNG 1: CẢNH BÁO THIẾT BỊ PCCC */}
              <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-red-600 shrink-0" size={20}/>
                    <h3 className="font-black text-red-800 text-sm uppercase tracking-wider">Cảnh báo PCCC</h3>
                  </div>
                  <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-full">{pcccWarningsGrouped.length}</span>
                </div>
                <div className="p-0 overflow-x-auto flex-1 max-h-[350px] custom-scrollbar">
                  {pcccWarningsGrouped.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                      <Flame size={40} className="mb-2 opacity-30 text-emerald-500"/>
                      <p className="font-medium text-sm text-emerald-600">Tất cả thiết bị đều an toàn.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm cursor-default">
                      <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                        <tr>
                          <th className="p-3">Đơn vị</th>
                          <th className="p-3 text-center">Hạn Kiểm định</th>
                          <th className="p-3 text-right">Tình trạng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pcccWarningsGrouped.map((warn, idx) => {
                          const tooltipText = Object.entries(warn.items).map(([name, count]) => `• ${name}: ${count} thiết bị`).join('\n');
                          return (
                            <tr key={idx} className="hover:bg-red-50/30 transition-colors cursor-help" title={tooltipText}>
                              <td className="p-3 font-bold text-[#05469B] text-xs" title={tooltipText}>{warn.unitName}</td>
                              <td className="p-3 text-center font-semibold text-xs text-gray-700" title={tooltipText}>{warn.dateStr}</td>
                              <td className="p-3 text-right" title={tooltipText}>
                                {warn.daysLeft < 0 ? (
                                  <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 font-black rounded border border-red-200 text-[10px] animate-pulse">Trễ {Math.abs(warn.daysLeft)} ngày!</span>
                                ) : warn.daysLeft === 0 ? (
                                  <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 font-black rounded border border-red-200 text-[10px] animate-pulse">Hết hạn Hôm nay!</span>
                                ) : (
                                  <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 font-bold rounded border border-orange-200 text-[10px]">Còn {warn.daysLeft} ngày</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* 🟢 BẢNG 2: HỆ THỐNG GIÁM SÁT CAMERA */}
              <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Video className="text-indigo-600 shrink-0" size={20}/>
                    <h3 className="font-black text-indigo-800 text-sm uppercase tracking-wider">Hệ thống Giám sát</h3>
                  </div>
                  <span className="bg-indigo-600 text-white text-xs font-black px-2 py-0.5 rounded-full">{cameraStatsList.length}</span>
                </div>
                <div className="p-0 overflow-x-auto flex-1 max-h-[350px] custom-scrollbar">
                  {cameraStatsList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                      <MonitorSmartphone size={40} className="mb-2 opacity-30 text-gray-400"/>
                      <p className="font-medium text-sm text-gray-500">Chưa có dữ liệu hệ thống Camera.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm cursor-default">
                      <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                        <tr>
                          <th className="p-3">Đơn vị</th>
                          <th className="p-3 text-center">Tổng SL</th>
                          <th className="p-3 text-center">Hoạt động</th>
                          <th className="p-3 text-right">Hư/Hỏng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cameraStatsList.map((cam, idx) => {
                          const tooltipText = cam.camHu > 0 ? `Lý do hỏng: ${cam.lyDoHu}` : 'Hệ thống Camera hoạt động tốt';
                          return (
                            <tr key={idx} className="hover:bg-indigo-50/30 transition-colors cursor-help" title={tooltipText}>
                              <td className="p-3 font-bold text-[#05469B] text-xs" title={tooltipText}>{cam.unitName}</td>
                              <td className="p-3 text-center font-black text-gray-700 text-xs" title={tooltipText}>{cam.tongCam}</td>
                              <td className="p-3 text-center font-bold text-emerald-600 text-xs" title={tooltipText}>{cam.camHD}</td>
                              <td className="p-3 text-right" title={tooltipText}>
                                {cam.camHu > 0 ? (
                                  <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 font-black rounded border border-red-200 text-[10px] animate-pulse">{cam.camHu} lỗi</span>
                                ) : (
                                  <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-600 font-bold rounded border border-emerald-200 text-[10px]">Tốt</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* 🟢 BẢNG 3: HỢP ĐỒNG THUÊ DỊCH VỤ BẢO VỆ (ĐÃ CẬP NHẬT TOOLTIP CHI PHÍ) */}
              <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-blue-600 shrink-0" size={20}/>
                    <h3 className="font-black text-blue-800 text-sm uppercase tracking-wider">HĐ Thuê DV Bảo vệ</h3>
                  </div>
                  <span className="bg-blue-600 text-white text-xs font-black px-2 py-0.5 rounded-full">{anNinhStatsList.length}</span>
                </div>
                <div className="p-0 overflow-x-auto flex-1 max-h-[350px] custom-scrollbar">
                  {anNinhStatsList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                      <ShieldAlert size={40} className="mb-2 opacity-30 text-gray-400"/>
                      <p className="font-medium text-sm text-gray-500">Chưa có đơn vị thuê dịch vụ ngoài.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm cursor-default">
                      <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                        <tr>
                          <th className="p-3">Đơn vị thuê</th>
                          <th className="p-3 text-center">Hạn HĐ</th>
                          <th className="p-3 text-right">Tình trạng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {anNinhStatsList.map((stat, idx) => {
                          const isWarning = stat.daysLeft !== null && stat.daysLeft <= 30;
                          
                          // 🟢 CẬP NHẬT HIỂN THỊ TOOLTIP CÓ KÈM CHI PHÍ
                          const tooltipText = `NCC: ${stat.provider}\nChi phí: ${stat.cost}`;
                          
                          return (
                            <tr key={idx} className={`transition-colors cursor-help ${isWarning ? 'hover:bg-red-50/30' : 'hover:bg-blue-50/30'}`} title={tooltipText}>
                              <td className="p-3 font-bold text-[#05469B] text-xs truncate max-w-[120px]" title={tooltipText}>{stat.unitName}</td>
                              <td className="p-3 text-center font-semibold text-xs text-gray-600" title={tooltipText}>{stat.dateStr}</td>
                              <td className="p-3 text-right" title={tooltipText}>
                                {stat.daysLeft === null ? (
                                  <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 font-bold rounded border border-gray-200 text-[10px]">Chưa rõ</span>
                                ) : stat.daysLeft < 0 ? (
                                  <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 font-black rounded border border-red-200 text-[10px] animate-pulse">Quá hạn {Math.abs(stat.daysLeft)}</span>
                                ) : stat.daysLeft === 0 ? (
                                  <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 font-black rounded border border-red-200 text-[10px] animate-pulse">Hết hôm nay!</span>
                                ) : stat.daysLeft <= 30 ? (
                                  <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 font-bold rounded border border-orange-200 text-[10px]">Còn {stat.daysLeft} ngày</span>
                                ) : (
                                  <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-600 font-bold rounded border border-emerald-200 text-[10px]">Hiệu lực</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
