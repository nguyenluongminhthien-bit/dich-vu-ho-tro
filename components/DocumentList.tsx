
import React, { useState, useMemo, memo } from 'react';
import { VanBan, DonVi, User, Role } from '../types';
import { FileText, FileCheck, Plus, Search, Calendar, Building2, Tag, Eye, Download, Edit2, Trash2 } from 'lucide-react';
import DocumentPreviewModal from './DocumentPreviewModal';
import { useDebounce } from '../src/hooks/useDebounce';

interface DocumentListProps {
  docs: VanBan[];
  units: DonVi[];
  title: string;
  filterType: 'ThongBao' | 'QuyDinh';
  isReadOnly: boolean;
  onAdd: () => void;
  onEdit: (doc: VanBan) => void;
  onDelete: (id: string) => void;
  currentUser?: User | null;
}

const DocumentTableRow = memo(({ d, onPreview, onEdit, onDelete, isReadOnly, handleAction, isConfidential }: { 
  d: VanBan; 
  onPreview: (d: VanBan) => void;
  onEdit: (d: VanBan) => void;
  onDelete: (id: string) => void;
  isReadOnly: boolean;
  handleAction: (e?: React.MouseEvent) => void;
  isConfidential: boolean;
}) => {
  return (
    <tr 
      className={`hidden md:table-row hover:bg-blue-50/30 transition-colors group cursor-pointer ${d.hieuLuc === 'Hết hiệu lực' ? 'opacity-50' : ''}`}
      onClick={handleAction}
    >
      <td className="p-4">
        <div className="text-sm font-bold text-gray-800">{String(d.soHieu)}</div>
        <div className="text-[10px] font-bold text-blue-500 uppercase">{String(d.donViTrinh || '---')}</div>
      </td>
      <td className="p-4 text-sm text-gray-500">{String(d.ngayBanHanh)}</td>
      <td className="p-4">
        <p className="text-sm text-gray-700 font-medium leading-snug line-clamp-2">{String(d.noiDungTen)}</p>
      </td>
      <td className="p-4 text-sm">
        <div className="flex flex-col items-start gap-1">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase whitespace-nowrap ${d.loai === 'ThongBao' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
            {d.loai === 'ThongBao' ? String(d.loaiVanBan || '') : String(d.dmQuyTrinh || '')}
          </span>
          {d.hieuLuc === 'Hết hiệu lực' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold border uppercase bg-red-50 text-red-700 border-red-100">
              Hết hiệu lực
            </span>
          )}
          {isConfidential && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold border uppercase bg-gray-100 text-gray-600 border-gray-200">
              Bảo mật
            </span>
          )}
        </div>
      </td>
      <td className="p-4 text-right">
        <div className="flex justify-end gap-1.5">
          {d.hieuLuc === 'Hết hiệu lực' ? (
            <div className="p-2 text-gray-300 border border-gray-100 rounded-lg cursor-not-allowed" title="Văn bản hết hiệu lực">
              <Eye className="w-4 h-4" />
            </div>
          ) : (
            <button 
              onClick={handleAction} 
              className="p-2 text-gray-400 hover:text-primary border border-gray-200 rounded-lg transition-colors" 
              title={isConfidential ? "Văn bản bảo mật" : "Xem nhanh văn bản"}
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          
          {isConfidential ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                alert("Văn bản bảo mật, vui lòng liên hệ Bộ phận lấy số văn bản");
              }}
              className="p-2 text-gray-400 hover:text-primary border border-gray-200 rounded-lg transition-colors" 
              title="Văn bản bảo mật"
            >
              <Download className="w-4 h-4" />
            </button>
          ) : (
            <a 
              href={d.linkFile} 
              target="_blank" 
              rel="noreferrer" 
              className="p-2 text-gray-400 hover:text-primary border border-gray-200 rounded-lg transition-colors" 
              title="Mở file gốc / Tải về"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-4 h-4" />
            </a>
          )}

          {!isReadOnly && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(d); }} 
                className="p-2 text-gray-400 hover:text-primary border border-gray-200 rounded-lg transition-colors" 
                title="Sửa"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Xác nhận xóa văn bản ${d.soHieu}?`)) {
                    onDelete(d.id);
                  }
                }} 
                className="p-2 text-gray-400 hover:text-red-500 border border-gray-200 rounded-lg transition-colors" 
                title="Xóa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
});

const DocumentCard = memo(({ d, onEdit, isReadOnly, handleAction, isConfidential }: { 
  d: VanBan; 
  onEdit: (d: VanBan) => void;
  isReadOnly: boolean;
  handleAction: (e?: React.MouseEvent) => void;
  isConfidential: boolean;
}) => {
  return (
    <div 
      className={`md:hidden p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${d.hieuLuc === 'Hết hiệu lực' ? 'opacity-60' : ''}`}
      onClick={handleAction}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-sm font-bold text-gray-900">{d.soHieu}</div>
          <div className="text-[10px] font-bold text-blue-500 uppercase">{d.donViTrinh}</div>
        </div>
        <div className="text-xs text-gray-500">{d.ngayBanHanh}</div>
      </div>
      
      <p className="text-sm text-gray-700 font-medium mb-3 line-clamp-2 leading-snug">
        {d.noiDungTen}
      </p>

      <div className="flex justify-between items-center">
        <div className="flex gap-1">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${d.loai === 'ThongBao' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
            {d.loai === 'ThongBao' ? d.loaiVanBan : d.dmQuyTrinh}
          </span>
          {d.hieuLuc === 'Hết hiệu lực' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold border uppercase bg-red-50 text-red-700 border-red-100">
              Hết hiệu lực
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          {!isReadOnly && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(d); }} 
              className="p-1.5 text-primary hover:bg-blue-50 rounded"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={handleAction}
            className="p-1.5 text-gray-400 hover:text-primary rounded"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

const DocumentList: React.FC<DocumentListProps> = ({ docs, units, title, filterType, isReadOnly, onAdd, onEdit, onDelete, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const [filterUnit, setFilterUnit] = useState('');
  const [filterSubType, setFilterSubType] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [activeTab, setActiveTab] = useState<'ThongBao' | 'CongVanDen' | 'CongVanDi'>('ThongBao');
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<VanBan | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);

  const safeLower = (val: any) => String(val || '').toLowerCase().trim();

  // Create unit maps for O(1) lookup
  const { unitMap, unitNameMap } = useMemo(() => {
    const uMap = new Map<string, DonVi>();
    const nMap = new Map<string, string>();
    units.forEach(u => {
      uMap.set(u.maDonVi, u);
      if (u.tenDonVi) nMap.set(u.tenDonVi, u.maDonVi);
    });
    return { unitMap: uMap, unitNameMap: nMap };
  }, [units]);

  const subTypeOptions = useMemo(() => {
    const list = docs.filter(d => d.loai === filterType).map(d => filterType === 'ThongBao' ? d.loaiVanBan : d.dmQuyTrinh);
    return Array.from(new Set(list)).filter(Boolean);
  }, [docs, filterType]);

  const unitOptions = useMemo(() => {
    const list = docs.filter(d => d.loai === filterType).map(d => d.donViTrinh);
    return Array.from(new Set(list)).filter(Boolean);
  }, [docs, filterType]);

  const yearOptions = useMemo(() => {
    const list = docs.filter(d => d.loai === filterType).map(d => {
      const year = String(d.ngayBanHanh || '').split('/')?.[2];
      return year;
    });
    return Array.from(new Set(list)).filter(Boolean).sort((a, b) => Number(b) - Number(a));
  }, [docs, filterType]);

  const filteredDocs = useMemo(() => {
    const search = safeLower(debouncedSearch);
    
    const parseDate = (dateStr: string) => {
        if (!dateStr) return 0;
        const parts = String(dateStr).split('/');
        if (parts.length !== 3) return 0;
        return Number(parts[2] + parts[1] + parts[0]);
    };

    const indexedDocs = docs.map((d, index) => ({ d, index }));

    return indexedDocs.filter(({ d }) => {
      if (d.loai !== filterType) return false;

      // --- PERMISSION CHECK (NEW) ---
      if (filterType === 'ThongBao' && currentUser) {
          // Admin sees all
          if (currentUser.vaiTro !== Role.ADMIN) {
              const userUnitCodes = currentUser.maDonVi ? currentUser.maDonVi.split(',').map(c => c.trim()) : [];
              
              // "ALL" permission sees all
              if (!userUnitCodes.includes('ALL')) {
                  let isVisible = false;

                  // 1. Check Scope (Phạm vi áp dụng) - Hierarchical
                  // If Scope includes "Company A", then "Company A" and its children see it.
                  const docScopes = d.phamVi ? d.phamVi.split(',').map(s => s.trim()) : [];
                  
                  if (docScopes.includes('Toàn Hệ thống')) {
                      isVisible = true;
                  } else {
                       // Check if user's unit or any ancestor is in docScopes
                       const isScopeRelated = userUnitCodes.some(userCode => {
                           let currentUnit = unitMap.get(userCode);
                           while (currentUnit) {
                               if (currentUnit.tenDonVi && docScopes.includes(currentUnit.tenDonVi)) return true;
                               
                               // Move up
                               if (!currentUnit.maCapTren || currentUnit.maCapTren === currentUnit.maDonVi) break;
                               currentUnit = unitMap.get(currentUnit.maCapTren);
                           }
                           return false;
                       });
                       if (isScopeRelated) isVisible = true;
                  }

                  // 2. Check Hierarchy: User is in Issuing Unit OR User is Child of Issuing Unit
                  // "Các Showroom/Đơn vị trực thuộc luôn nhìn thấy các thông báo do Đơn vị cấp trên trực tiếp (hoặc cấp trên nữa) ban hành"
                  if (!isVisible) {
                      let docUnitCode = d.donViTrinh ? d.donViTrinh.trim() : '';
                      
                      // Try to resolve Unit Name to Code if needed
                      if (docUnitCode && !unitMap.has(docUnitCode) && unitNameMap.has(docUnitCode)) {
                          docUnitCode = unitNameMap.get(docUnitCode) || '';
                      }

                      if (docUnitCode) {
                          const isIssuerRelated = userUnitCodes.some(userCode => {
                              // User is in the issuing unit
                              if (userCode === docUnitCode) return true;

                              let currentUnit = unitMap.get(userCode);
                              // Traverse up from user's unit to see if we hit the issuing unit (Ancestor)
                              while (currentUnit) {
                                  if (currentUnit.maCapTren === docUnitCode) return true; // Found ancestor
                                  if (currentUnit.maDonVi === docUnitCode) return true; 
                                  
                                  // Stop if root or circular
                                  if (!currentUnit.maCapTren || currentUnit.maCapTren === currentUnit.maDonVi) break; 
                                  currentUnit = unitMap.get(currentUnit.maCapTren);
                              }
                              return false;
                          });

                          if (isIssuerRelated) isVisible = true;
                      }
                  }

                  if (!isVisible) return false;
              }
          }
      }
      // -----------------------------

      if (filterType === 'ThongBao') {
        if (activeTab === 'ThongBao') {
           if (d.loaiVanBan === 'Công văn đến' || d.loaiVanBan === 'Công văn đi') return false;
        } else if (activeTab === 'CongVanDen') {
           if (d.loaiVanBan !== 'Công văn đến') return false;
        } else if (activeTab === 'CongVanDi') {
           if (d.loaiVanBan !== 'Công văn đi') return false;
        }
      }

      const noiDungTen = safeLower(d.noiDungTen);
      const soHieu = safeLower(d.soHieu);
      const matchSearch = search === '' || noiDungTen.includes(search) || soHieu.includes(search);
      const matchUnit = filterUnit === '' || String(d.donViTrinh || '') === filterUnit;
      const subType = filterType === 'ThongBao' ? d.loaiVanBan : d.dmQuyTrinh;
      const matchSubType = filterSubType === '' || String(subType || '') === filterSubType;
      const dateParts = String(d.ngayBanHanh || '').split('/');
      const month = dateParts?.[1];
      const year = dateParts?.[2];
      const matchMonth = filterMonth === '' || month === filterMonth;
      const matchYear = filterYear === '' || year === filterYear;
      return matchSearch && matchUnit && matchSubType && matchMonth && matchYear;
    }).sort((a, b) => {
      const dateA = parseDate(a.d.ngayBanHanh);
      const dateB = parseDate(b.d.ngayBanHanh);
      if (dateA !== dateB) return dateB - dateA;
      return b.index - a.index;
    }).map(item => item.d);
  }, [docs, filterType, debouncedSearch, filterUnit, filterSubType, filterMonth, filterYear, activeTab, currentUser, unitMap]);

  const tabCounts = useMemo(() => {
    if (filterType !== 'ThongBao') return { thongBao: 0, congVanDen: 0, congVanDi: 0 };
    const filterByYear = (d: VanBan) => {
        if (!filterYear) return true;
        const year = String(d.ngayBanHanh || '').split('/')?.[2];
        return year === filterYear;
    };
    const thongBao = docs.filter(d => d.loai === 'ThongBao' && d.loaiVanBan !== 'Công văn đến' && d.loaiVanBan !== 'Công văn đi' && filterByYear(d)).length;
    const congVanDen = docs.filter(d => d.loai === 'ThongBao' && d.loaiVanBan === 'Công văn đến' && filterByYear(d)).length;
    const congVanDi = docs.filter(d => d.loai === 'ThongBao' && d.loaiVanBan === 'Công văn đi' && filterByYear(d)).length;
    return { thongBao, congVanDen, congVanDi };
  }, [docs, filterType, filterYear]);

  const visibleDocs = filteredDocs.slice(0, visibleCount);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-gray-800">
          {filterType === 'QuyDinh' ? <FileCheck className="w-5 h-5 text-green-600" /> : <FileText className="w-5 h-5 text-primary" />} 
          {title}
          <span className="ml-2 bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full">{filteredDocs.length} tài liệu</span>
        </div>
        {!isReadOnly && (
          <button onClick={onAdd} className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md transition-all">
            <Plus className="w-4 h-4" /> THÊM MỚI
          </button>
        )}
      </div>

      {filterType === 'ThongBao' && (
        <div className="flex border-b border-gray-200 bg-white px-4">
           <button 
             className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'ThongBao' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
             onClick={() => { setActiveTab('ThongBao'); setVisibleCount(20); }}
           >
             Thông báo <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">{tabCounts.thongBao}</span>
           </button>
           <button 
             className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'CongVanDen' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
             onClick={() => { setActiveTab('CongVanDen'); setVisibleCount(20); }}
           >
             Công văn đến <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">{tabCounts.congVanDen}</span>
           </button>
           <button 
             className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'CongVanDi' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
             onClick={() => { setActiveTab('CongVanDi'); setVisibleCount(20); }}
           >
             Công văn đi <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">{tabCounts.congVanDi}</span>
           </button>
        </div>
      )}

      <div className="p-4 bg-gray-50/50 border-b border-gray-100 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm nội dung, số hiệu..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-black"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(20); }}
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none text-black appearance-none"
              value={filterYear}
              onChange={(e) => { setFilterYear(e.target.value); setVisibleCount(20); }}
            >
              <option value="">Tất cả Năm</option>
              {yearOptions.map(y => <option key={String(y)} value={String(y)}>{String(y)}</option>)}
            </select>
          </div>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none text-black appearance-none"
              value={filterUnit}
              onChange={(e) => { setFilterUnit(e.target.value); setVisibleCount(20); }}
            >
              <option value="">Tất cả Đơn vị</option>
              {unitOptions.map(u => <option key={String(u)} value={String(u)}>{String(u)}</option>)}
            </select>
          </div>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none text-black appearance-none"
              value={filterSubType}
              onChange={(e) => { setFilterSubType(e.target.value); setVisibleCount(20); }}
            >
              <option value="">Tất cả Phân loại</option>
              {subTypeOptions.map(opt => <option key={String(opt)} value={String(opt)}>{String(opt)}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        {visibleDocs.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <table className="w-full text-left hidden md:table">
              <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold sticky top-0 z-10">
                <tr>
                  <th className="p-4 border-b w-[20%]">Số hiệu / Đơn vị trình</th>
                  <th className="p-4 border-b w-[12%]">Ngày BH</th>
                  <th className="p-4 border-b w-[40%]">Nội dung</th>
                  <th className="p-4 border-b w-[18%]">Phân loại</th>
                  <th className="p-4 border-b text-right w-[10%]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleDocs.map((d, index) => {
                  const isConfidential = d.linkFile === 'Mật';
                  const handleAction = (e?: React.MouseEvent) => {
                    if (e) e.stopPropagation();
                    if (isConfidential) {
                      alert("Văn bản bảo mật, vui lòng liên hệ Bộ phận lấy số văn bản");
                      return;
                    }
                    if (d.hieuLuc !== 'Hết hiệu lực') {
                      setSelectedDocForPreview(d);
                    }
                  };
                  return (
                    <DocumentTableRow 
                      key={`${String(d.id)}_${index}`} 
                      d={d} 
                      onPreview={setSelectedDocForPreview}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isReadOnly={isReadOnly}
                      handleAction={handleAction}
                      isConfidential={isConfidential}
                    />
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {visibleDocs.map((d, index) => {
                const isConfidential = d.linkFile === 'Mật';
                const handleAction = (e?: React.MouseEvent) => {
                  if (e) e.stopPropagation();
                  if (isConfidential) {
                    alert("Văn bản bảo mật, vui lòng liên hệ Bộ phận lấy số văn bản");
                    return;
                  }
                  if (d.hieuLuc !== 'Hết hiệu lực') {
                    setSelectedDocForPreview(d);
                  }
                };
                return (
                  <DocumentCard 
                    key={`${String(d.id)}_${index}`} 
                    d={d} 
                    onEdit={onEdit}
                    isReadOnly={isReadOnly}
                    handleAction={handleAction}
                    isConfidential={isConfidential}
                  />
                );
              })}
            </div>
            {filteredDocs.length > visibleCount && (
              <div className="p-4 text-center">
                <button 
                  onClick={() => setVisibleCount(prev => prev + 20)}
                  className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-all"
                >
                  XEM THÊM ({filteredDocs.length - visibleCount} văn bản)
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-20 text-center text-gray-400 italic">Không tìm thấy dữ liệu.</div>
        )}
      </div>

      <DocumentPreviewModal 
        isOpen={!!selectedDocForPreview}
        onClose={() => setSelectedDocForPreview(null)}
        doc={selectedDocForPreview}
      />
    </div>
  );
};

export default memo(DocumentList);
