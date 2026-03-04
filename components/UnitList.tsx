
import React, { useState, useEffect, useMemo } from 'react';
import { DonVi } from '../types';
import { 
  Search, Plus, MapPin, Phone, Mail, Edit, Users, Building2, 
  Shield, Flame, CloudRain, ExternalLink, ChevronRight, ChevronDown, 
  FolderOpen, Folder, Maximize2, Layers, Warehouse, UserCheck, 
  DoorOpen, Armchair, Coffee, Store, Layout, CircleDot, Camera, CheckCircle2,
  Navigation, MoveUp, MoveDown, MoveLeft, MoveRight, Presentation
} from 'lucide-react';
import UnitFormModal from './UnitFormModal';

interface UnitListProps {
  units: DonVi[];
  onAdd: (unit: DonVi) => void; 
  onEdit: (unit: DonVi) => void;
  onDelete: (id: string) => Promise<void> | void; 
  isReadOnly: boolean;
  selectedId?: string; 
}

const UnitList: React.FC<UnitListProps> = ({ units, onAdd, onEdit, onDelete, isReadOnly, selectedId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<DonVi | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update selected unit when selectedId changes (from props)
  useEffect(() => {
    if (selectedId) {
      const found = units.find(u => u.id === selectedId);
      if (found) {
        setSelectedUnit(found);
        // Also expand parent if this is a child
        const parent = units.find(p => p.maDonVi === found.maCapTren);
        if (parent) {
          setExpandedIds(prev => [...new Set([...prev, parent.id])]);
        }
      }
    }
  }, [selectedId, units]);

  // Update selected unit if data changes
  useEffect(() => {
    if (selectedUnit) {
      const updated = units.find(u => u.id === selectedUnit.id);
      if (updated) {
        setSelectedUnit(updated);
      } else {
        setSelectedUnit(null);
      }
    }
  }, [units]);

  // Logic to build hierarchy and grouping
  const { groups, childrenMap, flatFilteredUnits } = useMemo(() => {
    const map = new Map<string, DonVi[]>();
    // Set of all unit codes available in the current list
    const availableCodes = new Set(units.map(u => u.maDonVi));
    
    // 1. Map children by parent code (Trim whitespace for safety)
    units.forEach(u => {
      if (u.maCapTren && u.maCapTren !== 'HO') {
        const parentCode = u.maCapTren.trim();
        if (map.has(parentCode)) {
          map.get(parentCode)?.push(u);
        } else {
          map.set(parentCode, [u]);
        }
      }
    });

    // 2. Identify "Root" units for display
    // A unit is a root if: 
    // a) It is type 'Văn phòng' (Company level)
    // b) OR its parent is NOT in the current visible list (Partial view permission)
    const rootList = units.filter(u => 
      u.loaiHinh === 'Văn phòng' || 
      !availableCodes.has(u.maCapTren)
    );

    // 3. Group roots by Region (Mien)
    const grouped: Record<string, DonVi[]> = {
      'VPĐH': [],
      'CTy TT Phía Nam': [],
      'CTy TT Phía Bắc': [],
      'Khác': []
    };

    rootList.forEach(u => {
      const key = u.mien || 'Khác';
      if (grouped[key]) {
        grouped[key].push(u);
      } else {
        grouped['Khác'].push(u);
      }
    });

    // 4. Flat list for search
    const filtered = searchTerm ? units.filter(u => 
      u.tenDonVi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.maDonVi.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    return { groups: grouped, childrenMap: map, flatFilteredUnits: filtered };
  }, [units, searchTerm]);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleUnitClick = (e: React.MouseEvent, unit: DonVi, hasChildren: boolean) => {
    setSelectedUnit(unit);
    setShowDetailOnMobile(true);
    
    // If it has children (is a Company), toggle expansion on click as well
    if (hasChildren) {
       toggleExpand(e, unit.id);
    }
  };

  // Render a single tree item (Nav Style matching the image)
  const renderTreeItem = (unit: DonVi, level: number = 0) => {
    const parentCode = unit.maDonVi.trim();
    const children = childrenMap.get(parentCode) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.includes(unit.id);
    const isSelected = selectedUnit?.id === unit.id;
    
    // Check if unit is disabled (Đại lý or Đầu tư mới)
    const isDisabled = unit.trangThai === 'Đại lý' || unit.trangThai === 'Đầu tư mới';

    // Level 0 (Parents like THACO AUTO TPHCM) are Uppercase & Bold
    // Level 1+ (Children like SR Bien Hoa) are Normal
    const isRoot = level === 0;

    return (
      <div key={`${unit.id}-${unit.maDonVi}`} className="select-none mb-0.5 relative">
        {/* Depth Indicator Line for Mobile */}
        {level > 0 && isMobile && (
          <div 
            className="absolute left-0 top-0 bottom-0 border-l border-gray-100" 
            style={{ left: `${(level - 1) * 12 + 16}px` }}
          />
        )}
        
        <div 
          onClick={(e) => !isDisabled && handleUnitClick(e, unit, hasChildren)}
          className={`
            flex items-center gap-2 py-2.5 px-3 transition-colors relative mr-2 rounded-r-lg
            ${isDisabled 
                ? 'opacity-40 cursor-not-allowed italic text-gray-500 pointer-events-none grayscale' 
                : 'cursor-pointer'
            }
            ${!isDisabled && isSelected 
                ? 'bg-blue-50 text-primary font-bold shadow-sm shadow-blue-100/50' 
                : ''
            }
            ${!isDisabled && !isSelected 
                ? 'text-slate-700 hover:text-primary hover:bg-gray-50' 
                : ''
            }
          `}
          style={{ paddingLeft: `${level * (isMobile ? 12 : 20) + (isMobile ? 8 : 12)}px` }}
        >
          {/* Chevron for Parents */}
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
             {hasChildren ? (
                <button 
                  className={`p-1 rounded-md transition-colors ${!isDisabled ? 'text-gray-400 hover:text-primary hover:bg-blue-50' : 'text-gray-300'}`}
                  onClick={(e) => {
                     if (!isDisabled) {
                        e.stopPropagation();
                        toggleExpand(e, unit.id);
                     }
                  }}
                  disabled={isDisabled}
                >
                   {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
             ) : (
                // Visual spacer for children to align text
                isRoot ? <span className="w-4 h-4" /> : null
             )}
          </div>

          <span className={`text-sm md:text-xs truncate leading-tight ${isRoot ? 'font-bold uppercase tracking-tight' : 'font-medium'}`}>
            {unit.tenDonVi}
          </span>
        </div>

        {/* Children (Showrooms / Đại lý) */}
        {hasChildren && isExpanded && (
          <div className="mt-0.5 animate-fadeIn">
            {children.map(child => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Mapping for Display Labels as per image (NAM, VPĐH)
  const REGION_LABELS: Record<string, string> = {
    'VPĐH': 'VPĐH',
    'CTy TT Phía Nam': 'CTy TT Phía Nam',
    'CTy TT Phía Bắc': 'CTy TT Phía Bắc',
    'Khác': 'KHÁC'
  };

  // --- Helper Component for Section A Cards ---
  const InfoCard = ({ icon: Icon, label, value, colorClass, bgClass, borderClass }: any) => (
    <div className={`relative overflow-hidden rounded-xl bg-white border ${borderClass} shadow-sm hover:shadow-md transition-all duration-200 group`}>
      <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
        <Icon className="w-12 h-12 md:w-16 md:h-16 transform rotate-12 -mr-4 -mt-4" />
      </div>
      <div className="p-3 md:p-4 flex items-start space-x-3 md:space-x-4">
        <div className={`p-2.5 md:p-3 rounded-lg ${bgClass} ${colorClass} shrink-0`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div className="relative z-10 min-w-0">
          <p className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5 md:mb-1 truncate">{label}</p>
          <h4 className="text-base md:text-lg font-bold text-gray-800 truncate">{value}</h4>
        </div>
      </div>
    </div>
  );

  // Safe get char
  const getAvatarChar = (name: string | null | undefined) => {
    return String(name || '?').charAt(0).toUpperCase();
  };

  return (
    <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-2rem)] gap-4 relative">
      {/* Left List - Styles matched to image */}
      <div className={`
        w-full lg:w-72 flex-shrink-0 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden
        ${showDetailOnMobile ? 'hidden lg:flex' : 'flex'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
           <div className="p-1.5 bg-blue-50 text-primary rounded-lg">
             <Layout className="w-5 h-5" />
           </div>
           <h3 className="font-bold text-gray-800 text-sm">Công ty & Showroom</h3>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-50 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm đơn vị, showroom..." 
              className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Tree List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2 bg-white">
           {searchTerm ? (
             <div className="px-2 space-y-1">
               {flatFilteredUnits.map((unit, idx) => {
                 const isDisabled = unit.trangThai === 'Đại lý' || unit.trangThai === 'Đầu tư mới';
                 return (
                 <div 
                   key={`${unit.id}-${unit.maDonVi}-${idx}`}
                   onClick={(e) => !isDisabled && handleUnitClick(e, unit, false)}
                   className={`px-4 py-3 rounded-lg transition-all ${
                     isDisabled ? 'opacity-50 cursor-not-allowed grayscale italic text-gray-400' : 'cursor-pointer'
                   } ${
                     !isDisabled && selectedUnit?.id === unit.id 
                       ? 'bg-blue-50 text-primary font-bold shadow-sm' 
                       : !isDisabled ? 'hover:bg-gray-50 text-gray-700' : ''
                   }`}
                 >
                   <div className="text-sm font-semibold">{unit.tenDonVi}</div>
                   <div className="text-[10px] md:text-xs text-gray-400 mt-0.5 font-mono">{unit.maDonVi}</div>
                 </div>
               )})}
               {flatFilteredUnits.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                   <Search className="w-8 h-8 text-gray-200 mb-2" />
                   <p className="text-gray-400 text-xs">Không tìm thấy kết quả phù hợp.</p>
                 </div>
               )}
             </div>
           ) : (
             <div className="space-y-4 pt-2">
                {['VPĐH', 'CTy TT Phía Nam', 'CTy TT Phía Bắc', 'Khác'].map(groupKey => {
                   const groupUnits = groups[groupKey];
                   if (!groupUnits || (groupUnits as any).length === 0) return null;

                   return (
                     <div key={groupKey}>
                       {/* Group Header with Bullet */}
                       <div className="flex items-center gap-3 px-6 py-2 mb-1 bg-gray-50/50">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-sm shadow-primary/20"></div>
                          <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                            {REGION_LABELS[groupKey] || groupKey}
                          </h4>
                       </div>
                       
                       {/* Units in Group */}
                       <div className="space-y-0.5">
                          {groupUnits.map(unit => renderTreeItem(unit))}
                       </div>
                     </div>
                   );
                })}

                {Object.values(groups).every((g: any) => g && g.length === 0) && (
                   <div className="p-10 text-center flex flex-col items-center justify-center">
                     <Building2 className="w-10 h-10 text-gray-100 mb-2" />
                     <p className="text-xs text-gray-400 italic">Chưa có dữ liệu đơn vị.</p>
                   </div>
                )}
             </div>
           )}
        </div>
        
        {!isReadOnly && (
          <div className="p-3 border-t border-gray-100 bg-gray-50">
             <button 
               onClick={() => setIsModalOpen(true)}
               className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-primary py-2 rounded-lg text-xs font-bold hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
             >
               <Plus className="w-3.5 h-3.5" /> THÊM ĐƠN VỊ
             </button>
          </div>
        )}
      </div>

      {/* Right Detail */}
      <div className={`
        flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-y-auto custom-scrollbar
        ${showDetailOnMobile ? 'flex' : 'hidden lg:flex'}
      `}>
        {selectedUnit ? (
          <div className="flex flex-col w-full">
            {/* Mobile Sticky Header */}
            <div className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-4 flex items-center gap-3 shadow-sm">
              <button 
                onClick={() => setShowDetailOnMobile(false)}
                className="p-2 -ml-2 text-primary hover:bg-blue-50 rounded-full transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-gray-900 truncate">{selectedUnit.tenDonVi}</h2>
                <p className="text-[10px] text-gray-500 font-mono">{selectedUnit.maDonVi}</p>
              </div>
              {!isReadOnly && (
                <button 
                  onClick={() => onEdit(selectedUnit)}
                  className="p-2 text-gray-500 hover:text-primary transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-4 md:p-6 space-y-6 md:space-y-8">
              {/* Header Detail - Hidden on Mobile (moved to sticky header) */}
              <div className="hidden lg:flex flex-col md:flex-row justify-between items-start border-b border-gray-100 pb-5 gap-4">
                <div className="w-full">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex flex-wrap items-center gap-2 md:gap-3">
                    <span className="break-words">{selectedUnit.tenDonVi}</span>
                    <span className={`text-[10px] md:text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap ${
                      selectedUnit.trangThai === 'Hoạt động' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedUnit.trangThai}
                    </span>
                  </h2>
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-gray-500 text-xs md:text-sm mt-2">
                     <div className="flex items-center gap-1.5">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-[10px] md:text-xs text-gray-700 font-bold border border-gray-200">{selectedUnit.maDonVi}</span>
                     </div>
                     <div className="hidden md:block w-1 h-1 rounded-full bg-gray-300"></div>
                     <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer min-w-0">
                        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                        <a href={`https://www.google.com/maps/search/${encodeURIComponent(selectedUnit.diaChi)}`} target="_blank" rel="noreferrer" className="underline decoration-dotted truncate">
                          {selectedUnit.diaChi}
                        </a>
                     </div>
                  </div>
                </div>
                {!isReadOnly && (
                  <button 
                    onClick={() => onEdit(selectedUnit)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <Edit className="w-4 h-4" /> Cập nhật
                  </button>
                )}
              </div>

              {/* Mobile-only Quick Info Row */}
              <div className="lg:hidden flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="truncate max-w-[200px]">{selectedUnit.diaChi}</span>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                  selectedUnit.trangThai === 'Hoạt động' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedUnit.trangThai}
                </span>
              </div>

            {/* A. Thông tin Đơn vị - REDESIGNED */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase mb-4 flex items-center gap-2">
                 <span className="w-1.5 h-6 bg-primary rounded-r"></span>
                 A. Thông tin Đơn vị
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                <InfoCard 
                   icon={Maximize2} 
                   label="Diện tích sàn" 
                   value={`${selectedUnit.dienTich ? selectedUnit.dienTich.toLocaleString() : 0} m²`}
                   bgClass="bg-blue-100" 
                   colorClass="text-blue-600" 
                   borderClass="border-blue-100"
                />
                
                <InfoCard 
                   icon={Layers} 
                   label="Quy mô" 
                   value={`${selectedUnit.ham} Hầm / ${selectedUnit.tang} Tầng`}
                   bgClass="bg-indigo-100" 
                   colorClass="text-indigo-600" 
                   borderClass="border-indigo-100"
                />

                <InfoCard 
                   icon={DoorOpen} 
                   label="Số cổng" 
                   value={`${selectedUnit.soCong} Cổng`}
                   bgClass="bg-cyan-100" 
                   colorClass="text-cyan-600" 
                   borderClass="border-cyan-100"
                />

                <InfoCard 
                   icon={Coffee} 
                   label="Số Phòng chờ" 
                   value={`${selectedUnit.phongCho || 0} Phòng`}
                   bgClass="bg-orange-100" 
                   colorClass="text-orange-600" 
                   borderClass="border-orange-100"
                />

                <InfoCard 
                   icon={Presentation} 
                   label="Số Phòng họp" 
                   value={`${[selectedUnit.phop1, selectedUnit.phop2, selectedUnit.phop3, selectedUnit.phop4, selectedUnit.phop5].filter(Boolean).length} Phòng`}
                   bgClass="bg-purple-100" 
                   colorClass="text-purple-600" 
                   borderClass="border-purple-100"
                />

                <InfoCard 
                   icon={UserCheck} 
                   label="Lượt khách TB ra vào" 
                   value={`${selectedUnit.luotKhachTB} / ngày`}
                   bgClass="bg-emerald-100" 
                   colorClass="text-emerald-600" 
                   borderClass="border-emerald-100"
                />

                <InfoCard 
                   icon={Users} 
                   label="Tổng CB-NV tại Đơn vị" 
                   value={`${selectedUnit.soCbNv} Người`}
                   bgClass="bg-rose-100" 
                   colorClass="text-rose-600" 
                   borderClass="border-rose-100"
                />
              </div>
            </div>

            {/* B. Thông tin Lãnh đạo */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase mb-4 flex items-center gap-2">
                 <span className="w-1.5 h-6 bg-primary rounded-r"></span>
                 B. Thông tin Lãnh đạo
              </h3>
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 md:p-5 border border-blue-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-5 text-center sm:text-left">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center text-blue-600 font-bold text-2xl shadow-sm shrink-0">
                  {getAvatarChar(selectedUnit.hoTenLD)}
                </div>
                <div className="flex-1 w-full">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                     <div>
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] md:text-xs font-bold uppercase mb-1">{selectedUnit.ldDonVi}</span>
                        <h4 className="text-lg md:text-xl font-bold text-gray-900">{selectedUnit.hoTenLD || 'Chưa cập nhật'}</h4>
                     </div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 md:gap-3 mt-4">
                    <a href={`tel:${selectedUnit.sdtLD}`} className="flex items-center gap-2 text-xs md:text-sm text-gray-700 hover:text-primary bg-white px-3 md:px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-all">
                      <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" /> 
                      <span className="font-medium">{selectedUnit.sdtLD}</span>
                    </a>
                    <a href={`mailto:${selectedUnit.mailLD}`} className="flex items-center gap-2 text-xs md:text-sm text-gray-700 hover:text-primary bg-white px-3 md:px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-all">
                      <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" /> 
                      <span className="font-medium truncate max-w-[150px] md:max-w-none">{selectedUnit.mailLD}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* C. PT DV HTKD */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase mb-4 flex items-center gap-2">
                 <span className="w-1.5 h-6 bg-primary rounded-r"></span>
                 C. Phụ trách DV HTKD/NHÂN SỰ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {[
                  { role: selectedUnit.dvhtKd1, name: selectedUnit.hoTenDvht1, phone: selectedUnit.sdtDvht1, mail: selectedUnit.mailDvht1 },
                  selectedUnit.hoTenDvht2 ? { role: selectedUnit.dvhtKd2, name: selectedUnit.hoTenDvht2, phone: selectedUnit.sdtDvht2, mail: selectedUnit.mailDvht2 } : null
                ].filter(Boolean).map((staff, idx) => (
                   <div key={idx} className="bg-white rounded-lg p-3 md:p-4 border border-gray-200 hover:border-gray-300 transition-colors shadow-sm">
                      <div className="flex items-center gap-3 mb-3 md:mb-4">
                         <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs md:text-sm font-bold text-gray-500">{idx + 1}</div>
                         <div className="min-w-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate">{staff?.role}</p>
                            <p className="text-sm md:text-base font-bold text-gray-900 truncate">{staff?.name}</p>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" /> 
                            {staff?.phone ? (
                              <a href={`tel:${staff.phone}`} className="hover:text-primary font-medium transition-colors">
                                {staff.phone}
                              </a>
                            ) : (
                              <span className="text-gray-400">---</span>
                            )}
                         </div>
                         <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" /> 
                            {staff?.mail ? (
                              <a href={`mailto:${staff.mail}`} className="hover:text-primary font-medium transition-colors truncate">
                                {staff.mail}
                              </a>
                            ) : (
                              <span className="text-gray-400">---</span>
                            )}
                         </div>
                      </div>
                   </div>
                ))}
              </div>
            </div>

            {/* D. Thống kê nhân sự */}
            <div>
               <h3 className="text-sm font-bold text-gray-900 uppercase mb-4 flex items-center gap-2">
                 <span className="w-1.5 h-6 bg-primary rounded-r"></span>
                 D. Thống kê Nhân sự
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Table 1: AN-BV */}
                  <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
                      <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex justify-between items-center">
                          <span className="text-[10px] md:text-xs font-bold text-blue-700 uppercase">AN-BV, ĐTKH</span>
                          <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400"/>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs md:text-sm">
                            <tbody className="divide-y divide-gray-100">
                                <tr>
                                    <td className="px-3 md:px-4 py-2.5 md:py-3 text-gray-600">Nội bộ</td>
                                    <td className="px-3 md:px-4 py-2.5 md:py-3 text-right font-mono font-medium">{selectedUnit.slAnBvNoiBo || 0}</td>
                                </tr>
                                <tr>
                                    <td className="px-3 md:px-4 py-2.5 md:py-3 text-gray-600">Dịch vụ</td>
                                    <td className="px-3 md:px-4 py-2.5 md:py-3 text-right font-mono font-medium">{selectedUnit.slAnBvDichVu || 0}</td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-gray-50 border-t border-gray-100">
                                <tr>
                                    <td className="px-3 md:px-4 py-2 font-bold text-gray-800 text-[10px] md:text-xs uppercase">Tổng cộng</td>
                                    <td className="px-3 md:px-4 py-2 text-right font-bold text-primary font-mono">
                                        {(selectedUnit.slAnBvNoiBo || 0) + (selectedUnit.slAnBvDichVu || 0)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                      </div>
                  </div>

                  {/* Table 2: PVHC */}
                  <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
                      <div className="bg-orange-50 px-4 py-2 border-b border-orange-100 flex justify-between items-center">
                          <span className="text-[10px] md:text-xs font-bold text-orange-700 uppercase">Phục vụ Hậu cần</span>
                          <Coffee className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-400"/>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs md:text-sm">
                            <tbody className="divide-y divide-gray-100">
                                <tr>
                                    <td className="px-3 md:px-4 py-2.5 md:py-3 text-gray-600">Phục vụ / Khách</td>
                                    <td className="px-3 md:px-4 py-2.5 md:py-3 text-right font-mono font-medium">{selectedUnit.slPvhcKhach || 0}</td>
                                </tr>
                                <tr>
                                    <td className="px-3 md:px-4 py-2.5 md:py-3 text-gray-600">Vệ sinh</td>
                                    <td className="px-3 md:px-4 py-2.5 md:py-3 text-right font-mono font-medium">{selectedUnit.slPvhcVs || 0}</td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-gray-50 border-t border-gray-100">
                                <tr>
                                    <td className="px-3 md:px-4 py-2 font-bold text-gray-800 text-[10px] md:text-xs uppercase">Tổng cộng</td>
                                    <td className="px-3 md:px-4 py-2 text-right font-bold text-orange-600 font-mono">
                                        {(selectedUnit.slPvhcKhach || 0) + (selectedUnit.slPvhcVs || 0)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                      </div>
                  </div>
               </div>
            </div>

            {/* E. Hệ thống An ninh & PCCC */}
            <div>
               <h3 className="text-sm font-bold text-gray-900 uppercase mb-4 flex items-center gap-2">
                 <span className="w-1.5 h-6 bg-primary rounded-r"></span>
                 E. Hệ thống An ninh & PCCC
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Table 1: Camera (Blue Theme matching AN-BV) */}
                  <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
                      <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex justify-between items-center">
                          <span className="text-xs font-bold text-blue-700 uppercase">Hệ thống Camera</span>
                          <Camera className="w-4 h-4 text-blue-400"/>
                      </div>
                      <table className="w-full text-sm">
                          <tbody className="divide-y divide-gray-100">
                              <tr>
                                  <td className="px-4 py-3 text-gray-600">Số lượng Camera</td>
                                  <td className="px-4 py-3 text-right font-mono font-medium">{selectedUnit.slCamera || 0} mắt</td>
                              </tr>
                              <tr>
                                  <td className="px-4 py-3 text-gray-600">Thời gian lưu hình</td>
                                  <td className="px-4 py-3 text-right font-mono font-medium">{selectedUnit.thoiGianLuuHinh || 0} ngày</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>

                  {/* Table 2: PCCC (Red Theme matching PVHC style but with red) */}
                  <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
                      <div className="bg-red-50 px-4 py-2 border-b border-red-100 flex justify-between items-center">
                          <span className="text-xs font-bold text-red-700 uppercase">Hệ thống PCCC</span>
                          <Flame className="w-4 h-4 text-red-400"/>
                      </div>
                      <table className="w-full text-sm">
                          <tbody className="divide-y divide-gray-100">
                              <tr>
                                  <td className="px-4 py-3 text-gray-600">Báo cháy tự động</td>
                                  <td className="px-4 py-3 text-right">
                                    {selectedUnit.htBaoChayTuDong ? 
                                       <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">
                                          <CheckCircle2 className="w-3 h-3"/> Có
                                       </span> : 
                                       <span className="text-gray-400 text-xs italic">Không</span>
                                    }
                                  </td>
                              </tr>
                              <tr>
                                  <td className="px-4 py-3 text-gray-600">Hệ thống Bơm PCCC</td>
                                  <td className="px-4 py-3 text-right">
                                     {selectedUnit.heThongBomPccc ? 
                                       <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">
                                          <CheckCircle2 className="w-3 h-3"/> Có
                                       </span> : 
                                       <span className="text-gray-400 text-xs italic">Không</span>
                                    }
                                  </td>
                              </tr>
                              <tr>
                                  <td className="px-4 py-3 text-gray-600">Vị trí Tủ báo cháy</td>
                                  <td className="px-4 py-3 text-right font-medium text-gray-900 text-xs">{selectedUnit.viTriTuBaoChay || '---'}</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
               </div>
            </div>

            {/* F. Các Phương án */}
            <div>
               <h3 className="text-sm font-bold text-gray-900 uppercase mb-4 flex items-center gap-2">
                 <span className="w-1.5 h-6 bg-primary rounded-r"></span>
                 F. Các Phương Án
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                     { name: 'P.Án PCTT', link: selectedUnit.phuonganpctt, icon: CloudRain, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                     { name: 'P.Án PCCN', link: selectedUnit.phuonganpccn, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
                     { name: 'P.Án ANBV', link: selectedUnit.phuongAnAnBv, icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                  ].map((item, idx) => (
                     <a 
                        key={idx}
                        href={item.link && item.link !== '#' ? item.link : undefined}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 group ${item.bg} ${item.border} ${item.link && item.link !== '#' ? 'hover:shadow-md cursor-pointer hover:-translate-y-0.5' : 'opacity-60 cursor-not-allowed grayscale'}`}
                     >
                        <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-lg bg-white shadow-sm ${item.color}`}>
                             <item.icon className="w-5 h-5" />
                           </div>
                           <span className="font-semibold text-gray-800">{item.name}</span>
                        </div>
                        {item.link && item.link !== '#' && <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary" />}
                     </a>
                  ))}
               </div>
            </div>

            {/* G. Tiếp giáp địa lý */}
            <div>
               <h3 className="text-sm font-bold text-gray-900 uppercase mb-4 flex items-center gap-2">
                 <span className="w-1.5 h-6 bg-emerald-500 rounded-r"></span>
                 G. Tiếp giáp Địa lý
               </h3>
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-400 shrink-0"><MoveUp className="w-4 h-4"/></div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase truncate">Phía trước</p>
                        <p className="text-sm font-medium text-gray-800 truncate">{selectedUnit.phiaTruoc || '---'}</p>
                      </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-400 shrink-0"><MoveRight className="w-4 h-4"/></div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase truncate">Bên phải</p>
                        <p className="text-sm font-medium text-gray-800 truncate">{selectedUnit.benPhai || '---'}</p>
                      </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-400 shrink-0"><MoveLeft className="w-4 h-4"/></div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase truncate">Bên trái</p>
                        <p className="text-sm font-medium text-gray-800 truncate">{selectedUnit.benTrai || '---'}</p>
                      </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-400 shrink-0"><MoveDown className="w-4 h-4"/></div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase truncate">Phía sau</p>
                        <p className="text-sm font-medium text-gray-800 truncate">{selectedUnit.phiaSau || '---'}</p>
                      </div>
                  </div>
               </div>
            </div>
         

            {/* H. Thực trạng AN-BV */}
            <div>
               <h3 className="text-sm font-bold text-gray-900 uppercase mb-4 flex items-center gap-2">
                 <span className="w-1.5 h-6 bg-primary rounded-r"></span>
                 H. Thực trạng AN-BV
               </h3>
               <div className="p-5 bg-yellow-50 rounded-xl border border-yellow-100 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap shadow-sm">
                  {selectedUnit.thuctrangANBV ? (
                    <div className="flex gap-3">
                       <Shield className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                       <p>{selectedUnit.thuctrangANBV}</p>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Chưa cập nhật thực trạng.</span>
                  )}
               </div>
            </div>

            {/* I. Thông tin Phòng họp */}
            <div>
               <h3 className="text-sm font-bold text-gray-900 uppercase mb-4 flex items-center gap-2">
                 <span className="w-1.5 h-6 bg-teal-500 rounded-r"></span>
                 I. Thông tin Phòng họp
               </h3>
               <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs md:text-sm text-left">
                      <thead className="bg-teal-50 text-teal-800 font-bold uppercase text-[10px] md:text-xs border-b border-teal-100">
                        <tr>
                          <th className="px-4 py-3 whitespace-nowrap">Phòng họp</th>
                          <th className="px-4 py-3 whitespace-nowrap">Vị trí</th>
                          <th className="px-4 py-3 whitespace-nowrap text-center">Sức chứa</th>
                          <th className="px-4 py-3 whitespace-nowrap">Thiết bị</th>
                          <th className="px-4 py-3 whitespace-nowrap text-center">Online</th>
                          <th className="px-4 py-3 whitespace-nowrap text-center">Layout</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {[1, 2, 3, 4, 5].map(i => {
                           const hasRoom = selectedUnit[`phop${i}` as keyof DonVi];
                           if (!hasRoom) return null;
                           return (
                             <tr key={i} className="hover:bg-gray-50 transition-colors">
                               <td className="px-4 py-3 font-bold text-gray-800">Phòng họp {i}</td>
                               <td className="px-4 py-3 text-gray-600">{selectedUnit[`vitriPhop${i}` as keyof DonVi] || '---'}</td>
                               <td className="px-4 py-3 text-center font-mono font-medium text-blue-600">{selectedUnit[`scPhop${i}` as keyof DonVi] || 0}</td>
                               <td className="px-4 py-3 text-gray-600">{selectedUnit[`manPhop${i}` as keyof DonVi] || '---'}</td>
                               <td className="px-4 py-3 text-center">
                                 {selectedUnit[`onlinePhop${i}` as keyof DonVi] ? 
                                   <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto"/> : 
                                   <span className="text-gray-300">-</span>
                                 }
                               </td>
                               <td className="px-4 py-3 text-center">
                                 {selectedUnit[`layout${i}` as keyof DonVi] ? (
                                   <a href={selectedUnit[`layout${i}` as keyof DonVi] as string} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 underline text-xs">Xem</a>
                                 ) : <span className="text-gray-300">-</span>}
                               </td>
                             </tr>
                           );
                        })}
                        {![1, 2, 3].some(i => selectedUnit[`phop${i}` as keyof DonVi]) && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-400 italic">
                              Chưa có thông tin phòng họp.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>

            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-10 h-10 text-gray-300" />
            </div>
            <p className="font-medium text-gray-500">Chọn một đơn vị từ danh sách bên trái</p>
          </div>
        )}
      </div>

      <UnitFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={onAdd}
      />
    </div>
  );
};

export default UnitList;
