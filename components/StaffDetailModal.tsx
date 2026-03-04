
import React, { useState } from 'react';
import { NhanSu, DonVi, User as UserType, Role } from '../types';
import { 
  X, User, Info, Award, Briefcase, FileText, Calendar, MapPin, 
  GraduationCap, Banknote, ShieldCheck, Zap, Flame, LifeBuoy, 
  HeartPulse, Sword, Utensils, Coffee, Languages, Monitor, Camera, Phone, Mail
} from 'lucide-react';

interface StaffDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: NhanSu | null;
  units: DonVi[];
  currentUser: UserType | null;
}

const SkillItem = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: boolean | string | undefined; color: string }) => {
  const isActive = !!value;
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isActive ? `${color} border-transparent shadow-sm` : 'bg-gray-50 border-gray-100 opacity-40'}`}>
      <div className={`p-2 rounded-lg ${isActive ? 'bg-white/50' : 'bg-gray-200'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
        <span className="text-xs font-bold">{isActive ? (typeof value === 'string' ? value : 'Đã đạt') : 'Chưa có'}</span>
      </div>
    </div>
  );
};

const StaffDetailModal: React.FC<StaffDetailModalProps> = ({ isOpen, onClose, person, units, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'skills' | 'experience' | 'other'>('info');

  const canSeeIncome = React.useMemo(() => {
    if (!currentUser || !person) return false;
    // Admin luôn thấy
    if (currentUser.vaiTro === Role.ADMIN) return true;
    // Người tạo thấy
    if (person.createdBy && currentUser.email.toLowerCase() === person.createdBy.toLowerCase()) return true;
    return false;
  }, [currentUser, person]);

  const unitDisplay = React.useMemo(() => {
    if (!person) return '';
    const parent = units.find(u => u.maDonVi === person.maCapTren);
    const child = units.find(u => u.maDonVi === person.maDonVi);
    
    if (parent && child && person.maCapTren !== 'HO') {
      return `${parent.tenDonVi} - ${child.tenDonVi}`;
    }
    return child?.tenDonVi || person.maDonVi;
  }, [person, units]);

  if (!isOpen || !person) return null;

  const InfoRow = ({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) => (
    <div className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-white transition-all">
      <div className="flex items-center gap-2 mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-sm font-bold text-gray-800">{value || '---'}</span>
    </div>
  );

  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
        activeTab === id 
          ? 'border-primary text-primary bg-blue-50/50' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '---';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl w-full max-w-4xl h-full sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-white shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            {person.ghiChu && person.ghiChu.startsWith('http') ? (
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border-2 border-primary/10">
                <img 
                  src={person.ghiChu} 
                  alt={person.hoTen} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg sm:text-xl shadow-inner border border-primary/5">
                {person.hoTen?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight truncate">
                {person.hoTen}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">
                {person.msnv} • {person.viTri || 'Nhân viên'}
              </p>
              <p className="text-[10px] sm:hidden text-primary font-bold truncate mt-0.5">
                {unitDisplay}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors group shrink-0">
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-gray-900" />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b bg-white px-4 sm:px-6 overflow-x-auto no-scrollbar scroll-smooth">
          <TabButton id="info" label="THÔNG TIN" icon={Info} />
          <TabButton id="skills" label="KỸ NĂNG" icon={Award} />
          <TabButton id="experience" label="KINH NGHIỆM" icon={Briefcase} />
          <TabButton id="other" label="KHÁC" icon={FileText} />
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 animate-fadeIn">
              <InfoRow label="Họ và Tên" value={person.hoTen} icon={User} />
              <InfoRow label="Mã số nhân viên" value={person.msnv} />
              <InfoRow label="Số điện thoại" value={person.sdt} icon={Phone} />
              <InfoRow label="Email" value={person.email} icon={Mail} />
              <InfoRow label="Giới tính" value={person.gioiTinh} />
              <InfoRow label="Ngày sinh" value={person.ngaySinh} icon={Calendar} />
              <InfoRow label="Tuổi" value={person.tuoi ? `${person.tuoi} tuổi` : ''} />
              <InfoRow label="Đơn vị / Showroom" value={unitDisplay} icon={MapPin} />
              <InfoRow label="Vị trí công tác" value={person.viTri} />
              <InfoRow label="Ngày vào làm" value={person.ngayVaoLam} />
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 animate-fadeIn">
              <SkillItem icon={ShieldCheck} label="ATVSLĐ" value={person.atvsld} color="bg-green-50 text-green-700 border-green-200" />
              <SkillItem icon={Zap} label="AN-BV" value={person.anbv} color="bg-indigo-50 text-indigo-700 border-indigo-200" />
              <SkillItem icon={Flame} label="PCCC" value={person.pccc} color="bg-red-50 text-red-700 border-red-200" />
              <SkillItem icon={LifeBuoy} label="CHCN" value={person.chcn} color="bg-orange-50 text-orange-700 border-orange-200" />
              <SkillItem icon={Award} label="Sơ cấp cứu" value={person.soCapCuu} color="bg-amber-50 text-amber-700 border-amber-200" />
              <SkillItem icon={HeartPulse} label="CPR" value={person.cpr} color="bg-rose-50 text-rose-700 border-rose-200" />
              <SkillItem icon={Sword} label="Võ thuật" value={person.voThuat} color="bg-slate-100 text-slate-800 border-slate-300" />
              <SkillItem icon={Utensils} label="ATTP" value={person.attp} color="bg-yellow-50 text-yellow-700 border-yellow-200" />
              <SkillItem icon={Coffee} label="Pha chế" value={person.phaChe} color="bg-yellow-100 text-yellow-800 border-yellow-300" />
              <SkillItem icon={Languages} label="Ngoại ngữ" value={person.ngoaingu} color="bg-blue-50 text-blue-700 border-blue-200" />
              <SkillItem icon={Monitor} label="Tin học" value={person.tinhoc} color="bg-slate-50 text-slate-700 border-slate-200" />
              <SkillItem icon={Briefcase} label="GPLX" value={person.gplx} color="bg-cyan-50 text-cyan-700 border-cyan-200" />
            </div>
          )}

          {activeTab === 'experience' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 animate-fadeIn">
              <InfoRow label="Trình độ học vấn" value={person.trinhDo} icon={GraduationCap} />
              <InfoRow label="Thâm niên Bảo vệ" value={person.thamNienBV ? `${person.thamNienBV} năm` : ''} />
              <div className="md:col-span-2 flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kinh nghiệm làm việc</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed italic">
                  {person.kinhNghiem || 'Chưa cập nhật thông tin kinh nghiệm.'}
                </p>
              </div>
              <div className="md:col-span-2 flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mô tả ngoại hình</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {person.moTaNgoaiHinh || 'Chưa cập nhật mô tả ngoại hình.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'other' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 animate-fadeIn">
              {canSeeIncome ? (
                <InfoRow label="Thu nhập hàng tháng" value={formatCurrency(person.thuNhap)} icon={Banknote} />
              ) : (
                <div className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-100 opacity-60">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Banknote className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thu nhập hàng tháng</span>
                  </div>
                  <span className="text-xs italic text-gray-400">Bạn không có quyền xem thông tin này</span>
                </div>
              )}
              <div className="md:col-span-2 flex flex-col p-4 sm:p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ghi chú / Link ảnh</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed break-all">
                  {person.ghiChu || 'Không có ghi chú bổ sung cho nhân sự này.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t bg-gray-50 flex justify-end shrink-0">
          <button 
            onClick={onClose} 
            className="w-full sm:w-auto px-10 py-3 bg-gray-900 text-white rounded-xl sm:rounded-2xl font-bold shadow-xl hover:bg-gray-800 transition-all active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffDetailModal;
