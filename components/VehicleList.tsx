
import React, { useState, useMemo, memo } from 'react';
import { Xe, DonVi } from '../types';
import { Search, Plus, CarFront, Edit2, Trash2, Eye, Filter, X as CloseIcon } from 'lucide-react';
import VehicleDetailModal from './VehicleDetailModal';
import { useDebounce } from '../src/hooks/useDebounce';

interface VehicleListProps {
  vehicles: Xe[];
  units: DonVi[];
  isReadOnly: boolean;
  onAdd: () => void;
  onEdit: (vehicle: Xe) => void;
  onDelete: (id: string) => void;
}

const VehicleTableRow = memo(({ v, unitDisplay, onPreview, onEdit, onDelete, isReadOnly }: {
  v: Xe;
  unitDisplay: string;
  onPreview: (v: Xe) => void;
  onEdit: (v: Xe) => void;
  onDelete: (id: string) => void;
  isReadOnly: boolean;
}) => {
  return (
    <tr 
      className="hidden md:table-row hover:bg-blue-50/30 transition-colors group cursor-pointer"
      onClick={() => onPreview(v)}
    >
      <td className="p-4">
        <div className="text-sm font-bold text-gray-900">{v.bienSo}</div>
        <div className="text-[10px] text-gray-500 font-medium">{v.loaiPhuongTien}</div>
      </td>
      <td className="p-4">
        <div className="text-sm font-bold text-gray-800">{v.hieuXe} {v.loaiXe}</div>
        <div className="text-[10px] text-gray-400">{v.phienBan || '---'}</div>
      </td>
      <td className="p-4">
        <div className="text-sm font-bold text-blue-600">
          {unitDisplay}
        </div>
        <div className="text-[10px] text-gray-400 italic">{v.donViChuSoHuu || '---'}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-gray-700">{v.mucDichSuDung || '---'}</div>
      </td>
      <td className="p-4">
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${v.hienTrang === 'Bình thường' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
          {v.hienTrang}
        </span>
      </td>
      <td className="p-4 text-right">
        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onPreview(v); }} 
            className="p-2 text-gray-400 hover:text-primary border border-gray-200 rounded-lg transition-colors"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
          {!isReadOnly && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(v); }} 
                className="p-2 text-gray-400 hover:text-primary border border-gray-200 rounded-lg transition-colors"
                title="Sửa"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Xóa xe ${v.bienSo}?`)) {
                    onDelete(v.id);
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

const VehicleCard = memo(({ v, unitDisplay, onPreview, onEdit, onDelete, isReadOnly }: {
  v: Xe;
  unitDisplay: string;
  onPreview: (v: Xe) => void;
  onEdit: (v: Xe) => void;
  onDelete: (id: string) => void;
  isReadOnly: boolean;
}) => {
  return (
    <div className="md:hidden p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors" onClick={() => onPreview(v)}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-lg font-bold text-gray-900">{v.bienSo}</div>
          <div className="text-xs text-gray-500 font-medium uppercase">{v.loaiPhuongTien}</div>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${v.hienTrang === 'Bình thường' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
          {v.hienTrang}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Loại xe:</span>
          <span className="font-bold text-gray-800">{v.hieuXe} {v.loaiXe}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Đơn vị:</span>
          <span className="font-bold text-blue-600 text-right max-w-[200px]">{unitDisplay}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Mục đích:</span>
          <span className="text-gray-700">{v.mucDichSuDung}</span>
        </div>
      </div>

      {!isReadOnly && (
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(v); }} 
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-primary border border-blue-100 rounded-lg"
          >
            <Edit2 className="w-3 h-3" /> SỬA
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Xóa xe ${v.bienSo}?`)) {
                onDelete(v.id);
              }
            }} 
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-500 border border-red-100 rounded-lg"
          >
            <Trash2 className="w-3 h-3" /> XÓA
          </button>
        </div>
      )}
    </div>
  );
});

const VehicleList: React.FC<VehicleListProps> = ({ vehicles, units, isReadOnly, onAdd, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const [selectedVehicle, setSelectedVehicle] = useState<Xe | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    mucDichSuDung: '',
    hieuXe: '',
    namSX: '',
    maCapTren: '', // Đơn vị (HO)
    maDonVi: '',   // Showroom
    hienTrang: ''
  });

  const BRAND_OPTIONS = ['Kia', 'Mazda', 'Peugeot', 'BMW', 'Thaco Bus', 'Thaco Truck', 'Van', 'Fuso', 'Khác'];
  const MUC_DICH_OPTIONS = ['Xe Công', 'Xe Lái thử', 'Xe Thay thế KH', 'Xe Sửa chữa lưu động', 'Xe Chuyên dụng'];
  
  const parentUnits = useMemo(() => units.filter(u => u.maCapTren === 'HO'), [units]);
  const showrooms = useMemo(() => {
    if (!filters.maCapTren) return [];
    return units.filter(u => u.maCapTren === filters.maCapTren);
  }, [units, filters.maCapTren]);

  const filteredVehicles = useMemo(() => {
    let result = vehicles;
    const search = debouncedSearch.toLowerCase().trim();

    // Search filter
    if (search) {
      result = result.filter(v => {
        const bienSo = String(v.bienSo || '').toLowerCase();
        const hieuXe = String(v.hieuXe || '').toLowerCase();
        const loaiXe = String(v.loaiXe || '').toLowerCase();
        const maDonVi = String(v.maDonVi || '').toLowerCase();
        const donViChuSoHuu = String(v.donViChuSoHuu || '').toLowerCase();
        const mucDichSuDung = String(v.mucDichSuDung || '').toLowerCase();
        
        return bienSo.includes(search) || 
               hieuXe.includes(search) || 
               loaiXe.includes(search) || 
               maDonVi.includes(search) || 
               donViChuSoHuu.includes(search) || 
               mucDichSuDung.includes(search);
      });
    }

    // Advanced filters
    if (filters.mucDichSuDung) {
      result = result.filter(v => v.mucDichSuDung === filters.mucDichSuDung);
    }
    if (filters.hieuXe) {
      result = result.filter(v => v.hieuXe === filters.hieuXe);
    }
    if (filters.namSX) {
      result = result.filter(v => String(v.namSX) === filters.namSX);
    }
    if (filters.maCapTren) {
      result = result.filter(v => v.maCapTren === filters.maCapTren || v.maDonVi === filters.maCapTren);
    }
    if (filters.maDonVi) {
      result = result.filter(v => v.maDonVi === filters.maDonVi);
    }
    if (filters.hienTrang) {
      result = result.filter(v => v.hienTrang === filters.hienTrang);
    }

    return result;
  }, [vehicles, debouncedSearch, filters]);

  const resetFilters = () => {
    setFilters({
      mucDichSuDung: '',
      hieuXe: '',
      namSX: '',
      maCapTren: '',
      maDonVi: '',
      hienTrang: ''
    });
    setSearchTerm('');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.mucDichSuDung) count++;
    if (filters.hieuXe) count++;
    if (filters.namSX) count++;
    if (filters.maCapTren) count++;
    if (filters.maDonVi) count++;
    if (filters.hienTrang) count++;
    return count;
  }, [filters]);

  const visibleVehicles = filteredVehicles.slice(0, visibleCount);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden animate-fadeIn">
      <div className="p-4 border-b border-gray-100 flex flex-col gap-4 bg-white sticky top-0 z-20">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <div className="flex items-center gap-2">
               <CarFront className="w-5 h-5 text-primary" />
               <h3 className="font-bold text-gray-800 hidden md:block">Danh sách phương tiện</h3>
               <span className="ml-2 bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full">{filteredVehicles.length} xe</span>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Tìm biển số, hiệu xe, đơn vị..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-black"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(20); }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                showFilters || activeFilterCount > 0 
                  ? 'bg-blue-50 text-primary border-primary/30' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              BỘ LỌC {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
            {!isReadOnly && (
              <button onClick={onAdd} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2 text-sm font-bold transition-all active:scale-95 whitespace-nowrap">
                <Plus className="w-4 h-4" /> THÊM XE
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 animate-slideDown">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Mục đích</label>
                <select 
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary"
                  value={filters.mucDichSuDung}
                  onChange={(e) => setFilters(prev => ({ ...prev, mucDichSuDung: e.target.value }))}
                >
                  <option value="">Tất cả mục đích</option>
                  {MUC_DICH_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Hiệu xe</label>
                <select 
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary"
                  value={filters.hieuXe}
                  onChange={(e) => setFilters(prev => ({ ...prev, hieuXe: e.target.value }))}
                >
                  <option value="">Tất cả hiệu xe</option>
                  {BRAND_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Năm SX</label>
                <input 
                  type="number"
                  placeholder="Vd: 2023"
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary"
                  value={filters.namSX}
                  onChange={(e) => setFilters(prev => ({ ...prev, namSX: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Đơn vị (HO)</label>
                <select 
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary"
                  value={filters.maCapTren}
                  onChange={(e) => setFilters(prev => ({ ...prev, maCapTren: e.target.value, maDonVi: '' }))}
                >
                  <option value="">Tất cả đơn vị</option>
                  {parentUnits.map(u => <option key={u.id} value={u.maDonVi}>{u.tenDonVi}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Showroom</label>
                <select 
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary"
                  value={filters.maDonVi}
                  onChange={(e) => setFilters(prev => ({ ...prev, maDonVi: e.target.value }))}
                  disabled={!filters.maCapTren}
                >
                  <option value="">Tất cả showroom</option>
                  {showrooms.map(u => <option key={u.id} value={u.maDonVi}>{u.tenDonVi}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Hiện trạng</label>
                <select 
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary"
                  value={filters.hienTrang}
                  onChange={(e) => setFilters(prev => ({ ...prev, hienTrang: e.target.value }))}
                >
                  <option value="">Tất cả hiện trạng</option>
                  <option value="Bình thường">Bình thường</option>
                  <option value="Đang sửa chữa">Đang sửa chữa</option>
                  <option value="Ngưng sử dụng">Ngưng sử dụng</option>
                </select>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
              <button 
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <CloseIcon className="w-3.5 h-3.5" />
                XÓA TẤT CẢ BỘ LỌC
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar">
         {visibleVehicles.length > 0 ? (
           <>
            {/* Desktop Table View */}
            <table className="w-full text-left border-collapse hidden md:table">
              <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold sticky top-0 z-10">
                <tr>
                  <th className="p-4 border-b">Biển số / Loại xe</th>
                  <th className="p-4 border-b">Hiệu xe / Phiên bản</th>
                  <th className="p-4 border-b">Đơn vị / Sở hữu</th>
                  <th className="p-4 border-b">Mục đích sử dụng</th>
                  <th className="p-4 border-b">Hiện trạng</th>
                  <th className="p-4 border-b text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleVehicles.map(v => {
                  const unitDisplay = (() => {
                    const parent = units.find(u => u.maDonVi === v.maCapTren);
                    const child = units.find(u => u.maDonVi === v.maDonVi);
                    if (parent && child && v.maCapTren !== 'HO') {
                      return `${parent.tenDonVi} - ${child.tenDonVi}`;
                    }
                    return child?.tenDonVi || v.maDonVi;
                  })();
                  return (
                    <VehicleTableRow 
                      key={v.id} 
                      v={v} 
                      unitDisplay={unitDisplay}
                      onPreview={setSelectedVehicle}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isReadOnly={isReadOnly}
                    />
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {visibleVehicles.map(v => {
                const unitDisplay = (() => {
                  const parent = units.find(u => u.maDonVi === v.maCapTren);
                  const child = units.find(u => u.maDonVi === v.maDonVi);
                  if (parent && child && v.maCapTren !== 'HO') {
                    return `${parent.tenDonVi} - ${child.tenDonVi}`;
                  }
                  return child?.tenDonVi || v.maDonVi;
                })();
                return (
                  <VehicleCard 
                    key={v.id} 
                    v={v} 
                    unitDisplay={unitDisplay}
                    onPreview={setSelectedVehicle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isReadOnly={isReadOnly}
                  />
                );
              })}
            </div>
            {filteredVehicles.length > visibleCount && (
              <div className="p-4 text-center">
                <button 
                  onClick={() => setVisibleCount(prev => prev + 20)}
                  className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-all"
                >
                  XEM THÊM ({filteredVehicles.length - visibleCount} xe)
                </button>
              </div>
            )}
           </>
         ) : (
           <div className="text-center py-20 text-gray-400 italic">Không tìm thấy phương tiện phù hợp.</div>
         )}
      </div>

      <VehicleDetailModal 
        isOpen={!!selectedVehicle} 
        onClose={() => setSelectedVehicle(null)} 
        vehicle={selectedVehicle} 
        units={units} 
      />
    </div>
  );
};

export default memo(VehicleList);
