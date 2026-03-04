
import React, { useState, useMemo, memo } from 'react';
import { NhanSu, DonVi, User as UserType, Role } from '../types';
import { Search, Plus, UserCircle, Edit2, UserX, Info, Trash2, Banknote, ShieldCheck, Flame, Utensils, Coffee, Languages, Monitor, LifeBuoy, Zap, HeartPulse, Sword, Award, Eye, EyeOff, Filter, X as CloseIcon, Phone, Mail } from 'lucide-react';
import { useDebounce } from '../src/hooks/useDebounce';
import StaffDetailModal from './StaffDetailModal';

const TRINH_DO_OPTIONS = [
  'Tiểu học', 'Trung học cơ sở', 'Trung học phổ thông', 
  'Sơ cấp', 'Trung cấp', 'Trung cấp nghề', 'Trung cấp chuyên nghiệp', 
  'Cao đẳng', 'Đại học', 'Thạc sĩ', 'Tiến sĩ'
];

const SKILL_FIELDS = [
  { key: 'atvsld', label: 'ATVSLĐ', icon: ShieldCheck },
  { key: 'anbv', label: 'AN-BV', icon: Zap },
  { key: 'pccc', label: 'PCCC', icon: Flame },
  { key: 'chcn', label: 'CHCN', icon: LifeBuoy },
  { key: 'soCapCuu', label: 'Sơ cấp cứu', icon: Award },
  { key: 'cpr', label: 'CPR', icon: HeartPulse },
  { key: 'voThuat', label: 'Võ thuật', icon: Sword },
  { key: 'attp', label: 'ATTP', icon: Utensils },
  { key: 'phaChe', label: 'Pha chế', icon: Coffee },
  { key: 'ngoaingu', label: 'Ngoại ngữ', icon: Languages },
  { key: 'tinhoc', label: 'Tin học', icon: Monitor },
];

interface StaffListProps {
  staff: NhanSu[];
  units: DonVi[];
  isReadOnly: boolean;
  onAdd: () => void;
  onEdit: (staff: NhanSu) => void;
  onDelete: (msnv: string) => void;
  currentUser: UserType | null;
}

const SkillBadge = ({ icon: Icon, color, label }: any) => (
  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border border-transparent shadow-sm ${color}`} title={label}>
    <Icon className="w-2.5 h-2.5" />
    <span>{label}</span>
  </div>
);

const StaffTableRow = memo(({ person, onPreview, onEdit, onDelete, isReadOnly, currentUser, units, isSalaryVisible, formatCurrency, unitDisplay }: {
  person: NhanSu;
  onPreview: (staff: NhanSu) => void;
  onEdit: (staff: NhanSu) => void;
  onDelete: (msnv: string) => void;
  isReadOnly: boolean;
  currentUser: UserType | null;
  units: DonVi[];
  isSalaryVisible: boolean;
  formatCurrency: (amount: number | undefined) => string;
  unitDisplay: string;
}) => {
  const getInitial = (name: any) => {
    const safeName = String(name || '').trim();
    return safeName ? safeName.charAt(0).toUpperCase() : '?';
  };

  return (
    <tr className="hidden md:table-row hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => onPreview(person)}>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold border border-blue-200 shrink-0">
            {getInitial(person.hoTen)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{String(person.hoTen || '---')}</p>
            <p className="text-[10px] text-gray-500 uppercase font-semibold">
              {String(person.msnv || '---')} • {String(person.gioiTinh || 'N/A')} • {person.tuoi || '--'} tuổi
            </p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <p className="text-sm text-gray-900 font-medium">{person.viTri || '---'}</p>
      </td>
      <td className="p-4">
        <p className="text-sm text-gray-900 font-bold leading-tight">{unitDisplay}</p>
      </td>
      <td className="p-4">
        <div className="flex flex-col gap-1 text-xs">
          {person.sdt && (
            <div className="flex items-center gap-1.5 text-gray-700">
              <Phone className="w-3 h-3 text-gray-400" />
              <a href={`tel:${person.sdt}`} className="hover:text-primary transition-colors">{person.sdt}</a>
            </div>
          )}
          {person.email && (
            <div className="flex items-center gap-1.5 text-gray-700">
              <Mail className="w-3 h-3 text-gray-400" />
              <a href={`mailto:${person.email}`} className="hover:text-primary transition-colors truncate max-w-[150px]">{person.email}</a>
            </div>
          )}
          {!person.sdt && !person.email && <span className="text-gray-400 italic">---</span>}
        </div>
      </td>
      <td className="p-4">
        <div className="flex flex-wrap justify-center gap-1.5 max-w-[320px] mx-auto">
          {person.atvsld && <SkillBadge icon={ShieldCheck} color="bg-green-100 text-green-700" label="ATVSLĐ" />}
          {person.anbv && <SkillBadge icon={Zap} color="bg-indigo-100 text-indigo-700" label="AN-BV" />}
          {person.pccc && <SkillBadge icon={Flame} color="bg-red-100 text-red-700" label="PCCC" />}
          {person.chcn && <SkillBadge icon={LifeBuoy} color="bg-orange-100 text-orange-700" label="CHCN" />}
          {person.soCapCuu && <SkillBadge icon={Award} color="bg-amber-100 text-amber-700" label="Sơ cấp cứu" />}
          {person.cpr && <SkillBadge icon={HeartPulse} color="bg-rose-100 text-rose-700" label="CPR" />}
          {person.voThuat && <SkillBadge icon={Sword} color="bg-slate-200 text-slate-800" label="Võ thuật" />}
          {person.attp && <SkillBadge icon={Utensils} color="bg-yellow-100 text-yellow-700" label="ATTP" />}
          {person.phaChe && <SkillBadge icon={Coffee} color="bg-yellow-200 text-yellow-800" label="Pha chế" />}
          {person.ngoaingu && <SkillBadge icon={Languages} color="bg-blue-100 text-blue-700" label="Ngoại ngữ" />}
          {person.tinhoc && <SkillBadge icon={Monitor} color="bg-slate-100 text-slate-700" label="Tin học" />}
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
          <Banknote className="w-3.5 h-3.5" />
          {formatCurrency(person.thuNhap)}
        </div>
      </td>
      <td className="p-4 text-right">
        <div className="flex justify-end gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); onPreview(person); }} 
            className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
          {!isReadOnly && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(person); }} 
                className="p-2 text-primary hover:bg-blue-100 rounded-lg transition-all border border-transparent hover:border-blue-200"
                title="Sửa"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Xác nhận xóa nhân sự ${person.hoTen} (${person.msnv})?`)) {
                    onDelete(person.msnv);
                  }
                }} 
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
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

const StaffCard = memo(({ person, onPreview, onEdit, isReadOnly, formatCurrency, unitDisplay }: {
  person: NhanSu;
  onPreview: (staff: NhanSu) => void;
  onEdit: (staff: NhanSu) => void;
  isReadOnly: boolean;
  formatCurrency: (amount: number | undefined) => string;
  unitDisplay: string;
}) => {
  const getInitial = (name: any) => {
    const safeName = String(name || '').trim();
    return safeName ? safeName.charAt(0).toUpperCase() : '?';
  };

  return (
    <div className="md:hidden p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors" onClick={() => onPreview(person)}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-primary flex items-center justify-center font-bold border border-blue-200 shrink-0 text-lg">
            {getInitial(person.hoTen)}
          </div>
          <div>
            <p className="font-bold text-gray-900">{person.hoTen || '---'}</p>
            <p className="text-xs text-gray-500 font-semibold uppercase">
              {person.msnv} • {person.gioiTinh} • {person.tuoi} tuổi
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {!isReadOnly && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(person); }} 
              className="p-2 text-primary hover:bg-blue-50 rounded-lg"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Vị trí:</span>
          <span className="font-medium text-gray-900">{person.viTri}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Đơn vị:</span>
          <span className="font-bold text-gray-900 text-right max-w-[200px]">{unitDisplay}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Liên hệ:</span>
          <div className="text-right flex flex-col items-end">
            {person.sdt && <a href={`tel:${person.sdt}`} className="font-medium text-gray-900 hover:text-primary">{person.sdt}</a>}
            {person.email && <a href={`mailto:${person.email}`} className="text-xs text-gray-500 hover:text-primary truncate max-w-[180px]">{person.email}</a>}
            {!person.sdt && !person.email && <span className="text-gray-400 italic">---</span>}
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Thu nhập:</span>
          <span className="font-bold text-emerald-600">{formatCurrency(person.thuNhap)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {person.atvsld && <SkillBadge icon={ShieldCheck} color="bg-green-100 text-green-700" label="ATVSLĐ" />}
        {person.anbv && <SkillBadge icon={Zap} color="bg-indigo-100 text-indigo-700" label="AN-BV" />}
        {person.pccc && <SkillBadge icon={Flame} color="bg-red-100 text-red-700" label="PCCC" />}
        {person.chcn && <SkillBadge icon={LifeBuoy} color="bg-orange-100 text-orange-700" label="CHCN" />}
      </div>
    </div>
  );
});

const StaffList: React.FC<StaffListProps> = ({ staff, units, isReadOnly, onAdd, onEdit, onDelete, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedPersonForPreview, setSelectedPersonForPreview] = useState<NhanSu | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isSalaryVisible, setIsSalaryVisible] = useState(false); // Default hidden for privacy

  // Filter states
  const [filters, setFilters] = useState({
    trinhDo: '',
    tuoiRange: '', // '18-25', '26-35', '36-45', '46+'
    thamNienRange: '', // '0-1', '1-3', '3-5', '5+'
    maCapTren: '', // Đơn vị (HO)
    maDonVi: '',   // Showroom
    skills: [] as string[]
  });

  const parentUnits = useMemo(() => units.filter(u => u.maCapTren === 'HO'), [units]);
  const showrooms = useMemo(() => {
    if (!filters.maCapTren) return [];
    return units.filter(u => u.maCapTren === filters.maCapTren);
  }, [units, filters.maCapTren]);

  const safeLower = (val: any) => String(val || '').toLowerCase().trim();

  const filteredStaff = useMemo(() => {
    if (!Array.isArray(staff)) return [];
    let result = staff;

    // Search filter
    const search = safeLower(debouncedSearch);
    if (search) {
      result = result.filter(s => 
        safeLower(s.hoTen).includes(search) || 
        safeLower(s.msnv).includes(search) || 
        safeLower(s.maDonVi).includes(search)
      );
    }

    // Education filter
    if (filters.trinhDo) {
      result = result.filter(s => s.trinhDo === filters.trinhDo);
    }

    // Age filter
    if (filters.tuoiRange) {
      result = result.filter(s => {
        const age = s.tuoi || 0;
        if (filters.tuoiRange === '18-25') return age >= 18 && age <= 25;
        if (filters.tuoiRange === '26-35') return age >= 26 && age <= 35;
        if (filters.tuoiRange === '36-45') return age >= 36 && age <= 45;
        if (filters.tuoiRange === '46+') return age >= 46;
        return true;
      });
    }

    // Seniority filter
    if (filters.thamNienRange) {
      result = result.filter(s => {
        const years = s.thamNienBV || 0;
        if (filters.thamNienRange === '0-1') return years < 1;
        if (filters.thamNienRange === '1-3') return years >= 1 && years <= 3;
        if (filters.thamNienRange === '3-5') return years >= 3 && years <= 5;
        if (filters.thamNienRange === '5+') return years > 5;
        return true;
      });
    }

    // Unit filter
    if (filters.maCapTren) {
      result = result.filter(s => s.maCapTren === filters.maCapTren || s.maDonVi === filters.maCapTren);
    }

    // Showroom filter
    if (filters.maDonVi) {
      result = result.filter(s => s.maDonVi === filters.maDonVi);
    }

    // Skills filter
    if (filters.skills.length > 0) {
      result = result.filter(s => 
        filters.skills.every(skill => (s as any)[skill] === true)
      );
    }

    return result;
  }, [staff, debouncedSearch, filters]);

  const toggleSkill = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const resetFilters = () => {
    setFilters({
      trinhDo: '',
      tuoiRange: '',
      thamNienRange: '',
      maCapTren: '',
      maDonVi: '',
      skills: []
    });
    setSearchTerm('');
  };

  const visibleStaff = filteredStaff.slice(0, visibleCount);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.trinhDo) count++;
    if (filters.tuoiRange) count++;
    if (filters.thamNienRange) count++;
    if (filters.maCapTren) count++;
    if (filters.maDonVi) count++;
    count += filters.skills.length;
    return count;
  }, [filters]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden animate-fadeIn">
      <div className="p-4 border-b border-gray-100 flex flex-col gap-4 bg-white sticky top-0 z-20">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <div className="flex items-center gap-2">
               <div className="p-2 bg-blue-50 text-primary rounded-lg">
                  <UserCircle className="w-5 h-5" />
               </div>
               <h3 className="font-bold text-gray-800 hidden md:block">Nhân sự HTKD</h3>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Tìm theo tên, MSNV, đơn vị..." 
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
              <button onClick={onAdd} className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95">
                <Plus className="w-4 h-4" /> THÊM NHÂN SỰ
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 animate-slideDown">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Trình độ</label>
                <select 
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary"
                  value={filters.trinhDo}
                  onChange={(e) => setFilters(prev => ({ ...prev, trinhDo: e.target.value }))}
                >
                  <option value="">Tất cả trình độ</option>
                  {TRINH_DO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Độ tuổi</label>
                <select 
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary"
                  value={filters.tuoiRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, tuoiRange: e.target.value }))}
                >
                  <option value="">Tất cả độ tuổi</option>
                  <option value="18-25">Từ 18 - 25 tuổi</option>
                  <option value="26-35">Từ 26 - 35 tuổi</option>
                  <option value="36-45">Từ 36 - 45 tuổi</option>
                  <option value="46+">Trên 45 tuổi</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Thâm niên (Năm)</label>
                <select 
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary"
                  value={filters.thamNienRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, thamNienRange: e.target.value }))}
                >
                  <option value="">Tất cả thâm niên</option>
                  <option value="0-1">Dưới 1 năm</option>
                  <option value="1-3">Từ 1 - 3 năm</option>
                  <option value="3-5">Từ 3 - 5 năm</option>
                  <option value="5+">Trên 5 năm</option>
                </select>
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
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Chứng chỉ & Kỹ năng (Chọn nhiều)</label>
              <div className="flex flex-wrap gap-2">
                {SKILL_FIELDS.map(skill => (
                  <button
                    key={skill.key}
                    onClick={() => toggleSkill(skill.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                      filters.skills.includes(skill.key)
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-primary/30'
                    }`}
                  >
                    <skill.icon className="w-3 h-3" />
                    {skill.label}
                  </button>
                ))}
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
        {visibleStaff.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <table className="w-full text-left border-collapse hidden md:table">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Thông tin chung</th>
                  <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Vị trí</th>
                  <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Đơn vị</th>
                  <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Liên hệ</th>
                  <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Chứng chỉ / Kỹ năng</th>
                  <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => currentUser?.vaiTro === Role.ADMIN && setIsSalaryVisible(!isSalaryVisible)}>
                      Thu nhập
                      {currentUser?.vaiTro === Role.ADMIN && (
                        isSalaryVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="p-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleStaff.map((person, index) => {
                  const canSeeIncome = (() => {
                    if (!currentUser) return false;
                    if (currentUser.vaiTro === Role.ADMIN) return true;
                    if (person.createdBy && currentUser.email.toLowerCase() === person.createdBy.toLowerCase()) return true;
                    return false;
                  })();

                  const formatCurrency = (amount: number | undefined) => {
                    if (!canSeeIncome) return '***';
                    if (!isSalaryVisible) return '***';
                    if (amount === undefined || amount === null || isNaN(amount)) return '---';
                    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
                  };

                  const getUnitDisplay = () => {
                    const parent = units.find(u => u.maDonVi === person.maCapTren);
                    const child = units.find(u => u.maDonVi === person.maDonVi);
                    
                    if (parent && child && person.maCapTren !== 'HO') {
                      return `${parent.tenDonVi} - ${child.tenDonVi}`;
                    }
                    return child?.tenDonVi || person.maDonVi;
                  };

                  const unitDisplay = getUnitDisplay();

                  return (
                    <StaffTableRow 
                      key={person.id || String(person.msnv || index)} 
                      person={person} 
                      onPreview={setSelectedPersonForPreview}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isReadOnly={isReadOnly}
                      currentUser={currentUser}
                      units={units}
                      isSalaryVisible={isSalaryVisible}
                      formatCurrency={formatCurrency}
                      unitDisplay={unitDisplay}
                    />
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {visibleStaff.map((person, index) => {
                const canSeeIncome = (() => {
                  if (!currentUser) return false;
                  if (currentUser.vaiTro === Role.ADMIN) return true;
                  if (person.createdBy && currentUser.email.toLowerCase() === person.createdBy.toLowerCase()) return true;
                  return false;
                })();

                const formatCurrency = (amount: number | undefined) => {
                  if (!canSeeIncome) return '***';
                  if (!isSalaryVisible) return '***';
                  if (amount === undefined || amount === null || isNaN(amount)) return '---';
                  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
                };

                const getUnitDisplay = () => {
                  const parent = units.find(u => u.maDonVi === person.maCapTren);
                  const child = units.find(u => u.maDonVi === person.maDonVi);
                  
                  if (parent && child && person.maCapTren !== 'HO') {
                    return `${parent.tenDonVi} - ${child.tenDonVi}`;
                  }
                  return child?.tenDonVi || person.maDonVi;
                };

                const unitDisplay = getUnitDisplay();

                return (
                  <StaffCard 
                    key={person.id || String(person.msnv || index)} 
                    person={person} 
                    onPreview={setSelectedPersonForPreview}
                    onEdit={onEdit}
                    isReadOnly={isReadOnly}
                    formatCurrency={formatCurrency}
                    unitDisplay={unitDisplay}
                  />
                );
              })}
            </div>
            {filteredStaff.length > visibleCount && (
              <div className="p-4 text-center">
                <button 
                  onClick={() => setVisibleCount(prev => prev + 20)}
                  className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-all"
                >
                  XEM THÊM ({filteredStaff.length - visibleCount} nhân sự)
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-20 flex flex-col items-center justify-center text-gray-400">
            <UserX className="w-16 h-16 mb-4 opacity-20" />
            <p className="italic text-sm">Không tìm thấy dữ liệu nhân sự.</p>
          </div>
        )}
      </div>
      <div className="p-3 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-medium flex justify-between">
        <span>Tổng cộng: {filteredStaff.length} nhân sự</span>
        <span className="flex items-center gap-1"><Info className="w-3 h-3"/> Dữ liệu tự động đồng bộ từ Google Sheet</span>
      </div>

      <StaffDetailModal 
        isOpen={!!selectedPersonForPreview}
        onClose={() => setSelectedPersonForPreview(null)}
        person={selectedPersonForPreview}
        units={units}
        currentUser={currentUser}
      />
    </div>
  );
};

export default memo(StaffList);
