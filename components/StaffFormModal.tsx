
import React, { useState, useEffect } from 'react';
import { NhanSu, DonVi } from '../types';
import { X, Save, User, ShieldCheck, Award, Utensils, Coffee, Languages, Monitor, LifeBuoy, Flame, Zap, HeartPulse, Sword, Info, Calendar } from 'lucide-react';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (staff: NhanSu) => void;
  initialData?: NhanSu | null;
  units: DonVi[];
  currentUserEmail?: string;
}

const TRINH_DO_OPTIONS = [
  'Tiểu học', 'Trung học cơ sở', 'Trung học phổ thông', 
  'Sơ cấp: Chứng chỉ nghề 3 tháng', 'Sơ cấp: Chứng chỉ nghề 6 tháng', 
  'Trung cấp nghề', 'Trung cấp chuyên nghiệp', 'Cao đẳng', 'Đại học', 'Thạc sĩ/Tiến sĩ'
];

const GPLX_OPTIONS = [
  { label: 'Không có', value: 'Không có' },
  { label: 'Nhóm xe máy (Mô tô)', isHeader: true },
  { label: 'Hạng A1: Xe mô tô hai bánh đến 125 cm³', value: 'A1' },
  { label: 'Hạng A: Xe mô tô hai bánh trên 125 cm³', value: 'A' },
  { label: 'Hạng B1: Xe mô tô ba bánh', value: 'B1' },
  { label: 'Nhóm xe ô tô chở người', isHeader: true },
  { label: 'Hạng B: Xe đến 8 chỗ, tải đến 3.500 kg', value: 'B' },
  { label: 'Hạng D1: Xe từ 8 đến 16 chỗ', value: 'D1' },
  { label: 'Hạng D2: Xe từ 16 đến 29 chỗ', value: 'D2' },
  { label: 'Hạng D: Xe trên 29 chỗ', value: 'D' },
  { label: 'Nhóm xe tải và xe chuyên dùng', isHeader: true },
  { label: 'Hạng C1: Xe tải từ 3.500 kg đến 7.500 kg', value: 'C1' },
  { label: 'Hạng C: Xe tải trên 7.500 kg', value: 'C' },
  { label: 'Nhóm xe kéo rơ moóc (Bằng kéo)', isHeader: true },
  { label: 'Hạng BE: Xe hạng B kéo rơ moóc > 750 kg', value: 'BE' },
  { label: 'Hạng C1E: Xe hạng C1 kéo rơ moóc > 750 kg', value: 'C1E' },
  { label: 'Hạng CE: Xe đầu kéo, container', value: 'CE' },
  { label: 'Hạng D1E: Xe hạng D1 kéo rơ moóc > 750 kg', value: 'D1E' },
  { label: 'Hạng D2E: Xe hạng D2 kéo rơ moóc > 750 kg', value: 'D2E' },
  { label: 'Hạng DE: Xe hạng D kéo rơ moóc > 750 kg', value: 'DE' },
];

const INPUT_CLASS = "w-full text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary p-2 border bg-[#FFFFF0] !text-black placeholder-gray-400 transition-all";
const SECTION_TITLE = "text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-4 flex items-center gap-2";

const StaffFormModal: React.FC<StaffFormModalProps> = ({ isOpen, onClose, onSave, initialData, units, currentUserEmail }) => {
  const defaultData = { 
    id: '', msnv: '', hoTen: '', gioiTinh: 'Nam', ngaySinh: '', tuoi: 0, 
    maDonVi: '', maCapTren: '', viTri: '', ngayVaoLam: '', trinhDo: 'Đại học', 
    thamNienBV: 0, kinhNghiem: '', moTaNgoaiHinh: '', gplx: 'Không có', thuNhap: 0,
    atvsld: false, anbv: false, pccc: false, chcn: false, soCapCuu: false, 
    cpr: false, voThuat: false, attp: false, phaChe: false, ngoaingu: false, tinhoc: false,
    createdBy: currentUserEmail || '', ghiChu: '', sdt: '', email: ''
  };

  const [formData, setFormData] = useState<any>(defaultData);
  const [selectedParentCode, setSelectedParentCode] = useState('');

  const parentUnits = React.useMemo(() => units.filter(u => u.maCapTren === 'HO'), [units]);
  const showrooms = React.useMemo(() => units.filter(u => u.maCapTren === selectedParentCode), [units, selectedParentCode]);

  useEffect(() => {
    if (isOpen) {
      const data = initialData ? { ...defaultData, ...initialData } : defaultData;
      setFormData(data);
      
      if (data.maDonVi) {
        if (data.maCapTren === 'HO') {
          setSelectedParentCode(data.maDonVi);
        } else {
          setSelectedParentCode(data.maCapTren || '');
        }
      } else {
        setSelectedParentCode('');
      }
    }
  }, [isOpen, initialData]);

  const formatDatePicker = (value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 8);
    if (clean.length >= 5) return `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4)}`;
    if (clean.length >= 3) return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    return clean;
  };

  const calculateYears = (dateStr: string) => {
    if (!dateStr || dateStr.length < 10) return 0;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const year = parseInt(parts[2], 10);
      const currentYear = new Date().getFullYear();
      if (!isNaN(year)) return currentYear - year;
    }
    return 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    if (type === 'number') finalValue = Number(value);

    if (name === 'thuNhap') {
      const numericValue = Number(value.replace(/\D/g, ''));
      setFormData((prev: any) => ({ ...prev, [name]: numericValue }));
      return;
    }
    
    // Tự động format ngày tháng
    if (name === 'ngaySinh' || name === 'ngayVaoLam') {
      finalValue = formatDatePicker(value);
      
      // Tự động tính toán khi format xong (đủ 10 ký tự dd/mm/yyyy)
      setFormData((prev: any) => {
        const updated = { ...prev, [name]: finalValue };
        if (finalValue.length === 10) {
          if (name === 'ngaySinh') updated.tuoi = calculateYears(finalValue);
          if (name === 'ngayVaoLam') updated.thamNienBV = calculateYears(finalValue);
        }
        return updated;
      });
      return;
    }

    if (name === 'maDonVi') {
      const selectedUnit = units.find(u => u.maDonVi === value);
      setFormData((prev: any) => ({ ...prev, maDonVi: value, maCapTren: selectedUnit?.maCapTren || 'HO' }));
      return;
    }

    if (name === 'parentUnit') {
      setSelectedParentCode(value);
      setFormData((prev: any) => ({ ...prev, maDonVi: value, maCapTren: 'HO' }));
      return;
    }

    if (name === 'showroomUnit') {
      if (value === '') {
        setFormData((prev: any) => ({ ...prev, maDonVi: selectedParentCode, maCapTren: 'HO' }));
      } else {
        setFormData((prev: any) => ({ ...prev, maDonVi: value, maCapTren: selectedParentCode }));
      }
      return;
    }

    setFormData((prev: any) => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = () => {
    if (!formData.msnv || !formData.hoTen || !formData.maDonVi) {
      alert("Vui lòng nhập đầy đủ MSNV, Họ tên và Đơn vị!");
      return;
    }
    const dataToSave = { ...formData };
    if (!dataToSave.id) dataToSave.id = dataToSave.msnv;
    onSave(dataToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-5xl h-full sm:h-auto sm:max-h-[95vh] flex flex-col overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b bg-gray-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-primary rounded-xl shrink-0"><User className="w-5 h-5 sm:w-6 sm:h-6" /></div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">{initialData ? 'Cập nhật Nhân sự' : 'Thêm Nhân sự Mới'}</h2>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium italic tracking-wide truncate">Dữ liệu tự động tính Tuổi & Thâm niên</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors shrink-0"><X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" /></button>
        </div>

        <div className="p-4 sm:p-8 overflow-y-auto space-y-6 sm:space-y-8 custom-scrollbar flex-1">
          <section>
            <h3 className={SECTION_TITLE}><Info className="w-4 h-4 text-blue-500" /> 1. Thông tin định danh & Cá nhân</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 sm:gap-5">
                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-tighter">MSNV *</label>
                  <input required name="msnv" value={formData.msnv || ''} onChange={handleChange} className={INPUT_CLASS} disabled={!!initialData} />
                </div>
                <div className="sm:col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-tighter">Họ và Tên *</label>
                  <input required name="hoTen" value={formData.hoTen || ''} onChange={handleChange} className={INPUT_CLASS} />
                </div>
                <div className="sm:col-span-2 md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-tighter">Vị trí công việc</label>
                  <input name="viTri" value={formData.viTri || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="Vd: Nhân viên AN-BV" />
                </div>
                
                <div className="sm:col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-tighter">Số điện thoại</label>
                  <input name="sdt" value={formData.sdt || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="09xxxxxxxx" />
                </div>
                <div className="sm:col-span-1 md:col-span-3">
                  <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-tighter">Email</label>
                  <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="example@thaco.vn" />
                </div>

                <div className="grid grid-cols-2 gap-4 sm:col-span-2 md:col-span-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-tighter">Giới tính</label>
                  <select name="gioiTinh" value={formData.gioiTinh || 'Nam'} onChange={handleChange} className={INPUT_CLASS}>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-tighter flex items-center gap-1"><Calendar className="w-3 h-3"/> Ngày sinh *</label>
                  <input required name="ngaySinh" value={formData.ngaySinh || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="dd/mm/yyyy" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 sm:col-span-2 md:col-span-1">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-tighter">Tuổi (Tự động)</label>
                  <input type="number" name="tuoi" value={formData.tuoi || 0} readOnly className={`${INPUT_CLASS} bg-gray-100 cursor-not-allowed`} />
                </div>
              </div>

              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-tighter">Đơn vị (HO) *</label>
                <select required name="parentUnit" value={selectedParentCode} onChange={handleChange} className={INPUT_CLASS}>
                  <option value="">-- Chọn Đơn vị --</option>
                  {parentUnits.map(u => <option key={u.id} value={u.maDonVi}>{u.tenDonVi}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-tighter">Showroom (Trực thuộc)</label>
                <select name="showroomUnit" value={formData.maCapTren === 'HO' ? '' : formData.maDonVi} onChange={handleChange} className={INPUT_CLASS} disabled={!selectedParentCode}>
                  <option value="">-- Chọn Showroom (Nếu có) --</option>
                  {showrooms.map(u => <option key={u.id} value={u.maDonVi}>{u.tenDonVi}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section>
            <h3 className={SECTION_TITLE}><Award className="w-4 h-4 text-orange-500" /> 2. Trình độ & Thâm niên</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-tighter">Trình độ</label>
                <select name="trinhDo" value={formData.trinhDo || 'Đại học'} onChange={handleChange} className={INPUT_CLASS}>
                  <option value="">-- Chọn trình độ --</option>
                  {TRINH_DO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-tighter flex items-center gap-1"><Calendar className="w-3 h-3"/> Ngày vào làm *</label>
                <input required name="ngayVaoLam" value={formData.ngayVaoLam || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="dd/mm/yyyy" />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-tighter">Thâm niên BV (Tự động)</label>
                <input type="number" name="thamNienBV" value={formData.thamNienBV || 0} readOnly className={`${INPUT_CLASS} bg-gray-100 cursor-not-allowed`} />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-tighter">Lương (VNĐ)</label>
                <input 
                  type="text" 
                  name="thuNhap" 
                  value={formData.thuNhap ? new Intl.NumberFormat('vi-VN').format(formData.thuNhap) : ''} 
                  onChange={handleChange} 
                  className={INPUT_CLASS} 
                  placeholder="0"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-tighter">Kinh nghiệm</label>
                <input name="kinhNghiem" value={formData.kinhNghiem || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="Kinh nghiệm trước đó" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-tighter">Mô tả ngoại hình (Cao, nặng, tác phong...)</label>
                <input name="moTaNgoaiHinh" value={formData.moTaNgoaiHinh || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="Vd: Cao 1m75, nặng 70kg, tác phong nhanh nhẹn" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-tighter">GPLX</label>
                <select name="gplx" value={formData.gplx || 'Không có'} onChange={handleChange} className={INPUT_CLASS}>
                   {GPLX_OPTIONS.map((opt, i) => opt.isHeader ? (
                     <optgroup key={i} label={opt.label}></optgroup>
                   ) : (
                     <option key={i} value={opt.value}>{opt.label}</option>
                   ))}
                </select>
              </div>
              <div className="sm:col-span-2 md:col-span-4">
                <label className="block text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-tighter">Ghi chú khác</label>
                <textarea name="ghiChu" value={formData.ghiChu || ''} onChange={handleChange} className={`${INPUT_CLASS} h-20 resize-none`} placeholder="Nhập ghi chú hoặc link ảnh nhân viên..." />
              </div>
            </div>
          </section>

          <section>
            <h3 className={SECTION_TITLE}><ShieldCheck className="w-4 h-4 text-green-500" /> 3. Chứng chỉ & Kỹ năng</h3>
            <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-100 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-y-6 gap-x-2 sm:gap-x-4">
              <SkillCheck name="atvsld" label="AT VSLĐ" checked={formData.atvsld} onChange={handleChange} icon={ShieldCheck} color="bg-green-500" />
              <SkillCheck name="anbv" label="AN-BV" checked={formData.anbv} onChange={handleChange} icon={Zap} color="bg-indigo-500" />
              <SkillCheck name="pccc" label="PCCC" checked={formData.pccc} onChange={handleChange} icon={Flame} color="bg-red-500" />
              <SkillCheck name="chcn" label="Cứu hộ CN" checked={formData.chcn} onChange={handleChange} icon={LifeBuoy} color="bg-blue-500" />
              <SkillCheck name="soCapCuu" label="Sơ cấp cứu" checked={formData.soCapCuu} onChange={handleChange} icon={Award} color="bg-amber-500" />
              <SkillCheck name="cpr" label="Hồi sức CPR" checked={formData.cpr} onChange={handleChange} icon={HeartPulse} color="bg-rose-500" />
              <SkillCheck name="voThuat" label="Võ thuật" checked={formData.voThuat} onChange={handleChange} icon={Sword} color="bg-slate-700" />
              <SkillCheck name="attp" label="AT Thực phẩm" checked={formData.attp} onChange={handleChange} icon={Utensils} color="bg-emerald-500" />
              <SkillCheck name="phaChe" label="Pha chế" checked={formData.phaChe} onChange={handleChange} icon={Coffee} color="bg-yellow-600" />
              <SkillCheck name="ngoaingu" label="Ngoại ngữ" checked={formData.ngoaingu} onChange={handleChange} icon={Languages} color="bg-sky-500" />
              <SkillCheck name="tinhoc" label="Tin học" checked={formData.tinhoc} onChange={handleChange} icon={Monitor} color="bg-slate-500" />
            </div>
          </section>
        </div>

        <div className="p-4 sm:p-5 border-t bg-gray-50 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
          <button onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-all">Đóng</button>
          <button onClick={handleSave} className="w-full sm:w-auto px-10 py-2.5 bg-primary text-white rounded-xl flex items-center justify-center gap-2 font-bold shadow-xl hover:bg-blue-700 transition-all active:scale-95">
            <Save className="w-5 h-5" /> Lưu thông tin
          </button>
        </div>
      </div>
    </div>
  );
};

const SkillCheck = ({ name, label, checked, onChange, icon: Icon, color }: any) => (
  <label className="flex flex-col items-center gap-2 cursor-pointer group select-none">
    <div className={`p-3 rounded-xl border-2 transition-all ${checked ? `${color} border-transparent text-white shadow-lg` : 'bg-white border-gray-100 text-gray-400 group-hover:border-primary/30 group-hover:text-primary/50'}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="flex items-center gap-1.5">
      <input type="checkbox" name={name} checked={!!checked} onChange={onChange} className="w-3.5 h-3.5 text-primary rounded border-gray-300" />
      <span className={`text-[10px] font-bold truncate ${checked ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
    </div>
  </label>
);

export default StaffFormModal;
