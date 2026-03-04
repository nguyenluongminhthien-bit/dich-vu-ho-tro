
import React, { useState, useEffect } from 'react';
import { DonVi } from '../types';
import { X, Save, MapPin, Phone, Mail, User, Briefcase, FileText, Link as LinkIcon, Building, Shield } from 'lucide-react';

interface UnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (unit: DonVi) => void;
  initialData?: DonVi | null;
}

const MIEN_OPTIONS = ['VPĐH', 'CTy TT Phía Nam', 'CTy TT Phía Bắc'];
const LOAI_HINH_OPTIONS = ['Văn phòng', 'Showroom', 'Đại lý'];
const LD_OPTIONS = ['PCT TT', 'Tổng Giám đốc', 'P. Tổng Giám đốc', 'Giám đốc SR', 'P. Giám đốc SR', 'Trưởng phòng', 'Phó phòng'];
const DVHT_OPTIONS = ['PT DV HTKD', 'CV DV HTKD', 'Tổ trưởng AN-BV, ĐTKH', 'Tổ trưởng PVHC', 'Tổ trưởng AN-BV, ĐTKH & PVHC', 'AN-BV, ĐTKH', 'PVHC', 'Đầu mối HR'];
const TRANG_THAI_OPTIONS = ['Hoạt động', 'Đại lý', 'Đầu tư mới'];

const emptyUnit: DonVi = {
  id: '', mien: '', tenDonVi: '', maDonVi: '', maCapTren: '', diaChi: '', loaiHinh: '',
  soCong: 0, dienTich: 0, ham: 0, tang: 0, phongCho: 0, luotKhachTB: 0, 
  ldDonVi: '', hoTenLD: '', sdtLD: '', mailLD: '', 
  dvhtKd1: '', hoTenDvht1: '', sdtDvht1: '', mailDvht1: '', 
  dvhtKd2: '', hoTenDvht2: '', sdtDvht2: '', mailDvht2: '',
  tongNsAnBv: 0, tongNsPvhc: 0, slAnBvNoiBo: 0, slAnBvDichVu: 0, 
  slPvhcKhach: 0, slPvhcVs: 0, soCbNv: 0, trangThai: 'Hoạt động',
  phuonganpctt: '', phuonganpccn: '', phuongAnAnBv: '', thuctrangANBV: '',
  phiaTruoc: '', benPhai: '', benTrai: '', phiaSau: '',
  dinhBienAN: 0, anbvNgayCoDinh: 0, anbvNgayTuanTra: 0, anbvDemCoDinh: 0, anbvDemTuanTra: 0,
  viTriBvDv: '', chiPhiBvDv: 0, dinhBienPVHC: 0, pvhcdv: '', chiPhiPvhcDv: 0,
  // New fields init
  slCamera: 0, thoiGianLuuHinh: 0, htBaoChayTuDong: false, viTriTuBaoChay: '', heThongBomPccc: false
};

const INPUT_CLASS = "w-full text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary p-2 border bg-[#FFFFF0] !text-black placeholder-gray-400 transition-all";
const SECTION_TITLE = "text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 mt-2 flex items-center gap-2";

const UnitFormModal: React.FC<UnitFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<DonVi>(emptyUnit);

  useEffect(() => {
    if (isOpen) {
      // Merge initialData with emptyUnit to ensure all fields are present
      setFormData(initialData ? { ...emptyUnit, ...initialData } : { ...emptyUnit, id: `DV_${Date.now()}` });
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // Handle number and checkbox specifically
    let finalValue: any = value;
    if (type === 'number') {
        finalValue = Number(value);
    } else if (type === 'checkbox') {
        finalValue = (e.target as HTMLInputElement).checked;
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Tự động tính tổng trước khi lưu
    const finalData = {
      ...formData,
      tongNsAnBv: Number(formData.slAnBvNoiBo || 0) + Number(formData.slAnBvDichVu || 0),
      tongNsPvhc: Number(formData.slPvhcKhach || 0) + Number(formData.slPvhcVs || 0)
    };
    onSave(finalData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-xl shadow-2xl w-full max-w-5xl h-full sm:h-auto sm:max-h-[95vh] flex flex-col overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-50 text-primary rounded-lg shrink-0"><Building className="w-5 h-5 sm:w-6 sm:h-6"/></div>
             <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 truncate">{initialData ? 'Cập nhật Đơn vị' : 'Thêm Đơn vị Mới'}</h2>
                <p className="text-[10px] sm:text-xs text-gray-500 truncate">Nhập đầy đủ thông tin vận hành và nhân sự</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors shrink-0"><X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">
          
          {/* 1. THÔNG TIN CHUNG */}
          <div>
            <h3 className={SECTION_TITLE}><Building className="w-4 h-4 text-blue-500"/> 1. Thông tin chung & Cơ sở vật chất</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Mã Đơn vị *</label>
                <input required name="maDonVi" value={formData.maDonVi || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="VD: HCM" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Tên Đơn vị *</label>
                <input required name="tenDonVi" value={formData.tenDonVi || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="VD: THACO AUTO TPHCM" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Mã Cấp trên</label>
                <input name="maCapTren" value={formData.maCapTren || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="VD: HO" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Vùng / Miền</label>
                <select name="mien" value={formData.mien || ''} onChange={handleChange} className={INPUT_CLASS}>
                  <option value="">-- Chọn Miền --</option>
                  {MIEN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Loại hình</label>
                <select name="loaiHinh" value={formData.loaiHinh || ''} onChange={handleChange} className={INPUT_CLASS}>
                  <option value="">-- Chọn Loại hình --</option>
                  {LOAI_HINH_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Trạng thái</label>
                <select name="trangThai" value={formData.trangThai || 'Hoạt động'} onChange={handleChange} className={INPUT_CLASS}>
                  {TRANG_THAI_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Tổng CBNV (Người)</label>
                <input type="number" name="soCbNv" value={formData.soCbNv || 0} onChange={handleChange} className={INPUT_CLASS} />
              </div>

              <div className="sm:col-span-2 md:col-span-4">
                 <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Địa chỉ (Hiển thị Google Maps)</label>
                 <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input name="diaChi" value={formData.diaChi || ''} onChange={handleChange} className={`${INPUT_CLASS} pl-9`} placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố" />
                 </div>
              </div>

              {/* Thông số kỹ thuật */}
              <div className="sm:col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-6 gap-4 border-t border-gray-100 pt-4 mt-2">
                 <div>
                   <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Diện tích (m²)</label>
                   <input type="number" name="dienTich" value={formData.dienTich || 0} onChange={handleChange} className={INPUT_CLASS} />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Số tầng</label>
                   <input type="number" name="tang" value={formData.tang || 0} onChange={handleChange} className={INPUT_CLASS} />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Số hầm</label>
                   <input type="number" name="ham" value={formData.ham || 0} onChange={handleChange} className={INPUT_CLASS} />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Số cổng</label>
                   <input type="number" name="soCong" value={formData.soCong || 0} onChange={handleChange} className={INPUT_CLASS} />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Phòng chờ</label>
                   <input type="number" name="phongCho" value={formData.phongCho || 0} onChange={handleChange} className={INPUT_CLASS} />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Lượt khách TB/Ngày</label>
                   <input type="number" name="luotKhachTB" value={formData.luotKhachTB || 0} onChange={handleChange} className={INPUT_CLASS} />
                 </div>
              </div>
            </div>
          </div>

          {/* 2. LÃNH ĐẠO */}
          <div>
            <h3 className={SECTION_TITLE}><User className="w-4 h-4 text-orange-500"/> 2. Lãnh đạo Đơn vị</h3>
            <div className="grid grid-cols-1 gap-6">
               <div className="space-y-3 bg-orange-50 p-4 rounded-xl border border-orange-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-orange-100 rounded-bl-full -mr-8 -mt-8 z-0"></div>
                  <div className="flex items-center gap-2 mb-2 relative z-10">
                     <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold shadow-md">LĐ</span>
                     <span className="text-sm font-bold text-orange-800 uppercase">Lãnh đạo Đơn vị</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Chức danh</label>
                        <select name="ldDonVi" value={formData.ldDonVi || ''} onChange={handleChange} className={INPUT_CLASS}>
                        <option value="">-- Chọn Chức danh --</option>
                        {LD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Họ và Tên</label>
                        <input name="hoTenLD" value={formData.hoTenLD || ''} onChange={handleChange} className={INPUT_CLASS} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                    <div className="relative">
                       <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/>
                       <input name="sdtLD" value={formData.sdtLD || ''} onChange={handleChange} className={`${INPUT_CLASS} pl-8`} placeholder="SĐT" />
                    </div>
                    <div className="relative">
                       <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/>
                       <input name="mailLD" value={formData.mailLD || ''} onChange={handleChange} className={`${INPUT_CLASS} pl-8`} placeholder="Email" />
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* 3. PHỤ TRÁCH DV HTKD */}
          <div>
            <h3 className={SECTION_TITLE}><User className="w-4 h-4 text-blue-500"/> 3. Phụ trách DV HTKD</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-3 p-4 rounded-xl border border-gray-200 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                     <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold border border-gray-200">01</span>
                     <span className="text-sm font-bold text-gray-800 uppercase">Phụ trách DV HTKD 1</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Vị trí / Chức danh</label>
                    <select name="dvhtKd1" value={formData.dvhtKd1 || ''} onChange={handleChange} className={INPUT_CLASS}>
                      <option value="">-- Chọn Vị trí --</option>
                      {DVHT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Họ và Tên</label>
                    <input name="hoTenDvht1" value={formData.hoTenDvht1 || ''} onChange={handleChange} className={INPUT_CLASS} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                       <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/>
                       <input name="sdtDvht1" value={formData.sdtDvht1 || ''} onChange={handleChange} className={`${INPUT_CLASS} pl-8`} placeholder="SĐT" />
                    </div>
                    <div className="relative">
                       <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/>
                       <input name="mailDvht1" value={formData.mailDvht1 || ''} onChange={handleChange} className={`${INPUT_CLASS} pl-8`} placeholder="Email" />
                    </div>
                  </div>
               </div>

               <div className="space-y-3 p-4 rounded-xl border border-gray-200 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                     <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold border border-gray-200">02</span>
                     <span className="text-sm font-bold text-gray-800 uppercase">Phụ trách DV HTKD 2 (Nếu có)</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Vị trí / Chức danh</label>
                    <select name="dvhtKd2" value={formData.dvhtKd2 || ''} onChange={handleChange} className={INPUT_CLASS}>
                        <option value="">-- Chọn Vị trí --</option>
                        {DVHT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Họ và Tên</label>
                    <input name="hoTenDvht2" value={formData.hoTenDvht2 || ''} onChange={handleChange} className={INPUT_CLASS} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     <div className="relative">
                        <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/>
                        <input name="sdtDvht2" value={formData.sdtDvht2 || ''} onChange={handleChange} className={`${INPUT_CLASS} pl-8`} placeholder="SĐT" />
                     </div>
                     <div className="relative">
                        <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/>
                        <input name="mailDvht2" value={formData.mailDvht2 || ''} onChange={handleChange} className={`${INPUT_CLASS} pl-8`} placeholder="Email" />
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* 4. ĐỊNH BIÊN NHÂN SỰ */}
          <div>
            <h3 className={SECTION_TITLE}><Briefcase className="w-4 h-4 text-green-500"/> 4. Định biên Nhân sự (Tự động tính tổng)</h3>
            <div className="mb-6">
              <h4 className="text-[11px] font-bold text-indigo-700 mb-2 uppercase border-l-2 border-indigo-500 pl-2">
                AN NINH – BẢO VỆ
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">SL ANBV Nội bộ</label>
                  <input type="number" name="slAnBvNoiBo" value={formData.slAnBvNoiBo || 0} onChange={handleChange} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">SL ANBV Dịch vụ</label>
                  <input type="number" name="slAnBvDichVu" value={formData.slAnBvDichVu || 0} onChange={handleChange} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-indigo-700 mb-1">Tổng ANBV</label>
                  <input type="number" readOnly value={(Number(formData.slAnBvNoiBo) || 0) + (Number(formData.slAnBvDichVu) || 0)} className={`${INPUT_CLASS} bg-gray-100 font-bold text-indigo-700`} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-red-600 mb-1">Định biên AN</label>
                  <input type="number" name="dinhBienAN" value={formData.dinhBienAN || 0} onChange={handleChange} className={INPUT_CLASS} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Ca ngày – Cố định</label>
                  <input type="number" name="anbvNgayCoDinh" value={formData.anbvNgayCoDinh || 0} onChange={handleChange} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Ca ngày – Tuần tra</label>
                  <input type="number" name="anbvNgayTuanTra" value={formData.anbvNgayTuanTra || 0} onChange={handleChange} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Ca đêm – Cố định</label>
                  <input type="number" name="anbvDemCoDinh" value={formData.anbvDemCoDinh || 0} onChange={handleChange} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Ca đêm – Tuần tra</label>
                  <input type="number" name="anbvDemTuanTra" value={formData.anbvDemTuanTra || 0} onChange={handleChange} className={INPUT_CLASS} />
                </div>
              </div>

              {Number(formData.slAnBvDichVu) > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Vị trí BV dịch vụ</label>
                    <input type="text" name="viTriBvDv" value={formData.viTriBvDv || ""} onChange={handleChange} className={INPUT_CLASS} placeholder="Mô tả vị trí..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Chi phí BV dịch vụ (VNĐ)</label>
                    <input type="number" name="chiPhiBvDv" value={formData.chiPhiBvDv || 0} onChange={handleChange} className={INPUT_CLASS} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <h4 className="text-[11px] font-bold text-green-700 mb-2 uppercase border-l-2 border-green-500 pl-2">
                PHỤC VỤ HẬU CẦN
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">SL PVHC Khách</label>
                  <input type="number" name="slPvhcKhach" value={formData.slPvhcKhach || 0} onChange={handleChange} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">SL PVHC Vệ sinh</label>
                  <input type="number" name="slPvhcVs" value={formData.slPvhcVs || 0} onChange={handleChange} className={INPUT_CLASS} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-green-700 mb-1">Tổng PVHC</label>
                  <input type="number" readOnly value={(Number(formData.slPvhcKhach) || 0) + (Number(formData.slPvhcVs) || 0)} className={`${INPUT_CLASS} bg-gray-100 font-bold text-green-700`} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-red-600 mb-1">Định biên PVHC</label>
                  <input type="number" name="dinhBienPVHC" value={formData.dinhBienPVHC || 0} onChange={handleChange} className={INPUT_CLASS} />
                </div>
              </div>

              {/* Phần Vị trí & Chi phí PVHC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-green-50 p-3 rounded-lg border border-green-100">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Vị trí PVHC dịch vụ</label>
                  <input type="text" name="pvhcdv" value={formData.pvhcdv || ""} onChange={handleChange} className={INPUT_CLASS} placeholder="Mô tả vị trí/khu vực làm việc..." />
                </div>
                {/* Chỉ hiện Chi phí khi Vị trí có nội dung */}
                {formData.pvhcdv && String(formData.pvhcdv).trim() !== "" && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Chi phí PVHC dịch vụ (VNĐ)</label>
                    <input type="number" name="chiPhiPvhcDv" value={formData.chiPhiPvhcDv || 0} onChange={handleChange} className={INPUT_CLASS} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. HỒ SƠ & PHƯƠNG ÁN */}
          <div>
             <h3 className={SECTION_TITLE}><FileText className="w-4 h-4 text-purple-500"/> 5. Hồ sơ & Phương án (Link)</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase flex items-center gap-1"><LinkIcon className="w-3 h-3"/> P.Án PCTT</label>
                  <input name="phuonganpctt" value={formData.phuonganpctt || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="https://..." />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase flex items-center gap-1"><LinkIcon className="w-3 h-3"/> P.Án PCCN</label>
                  <input name="phuonganpccn" value={formData.phuonganpccn || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="https://..." />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase flex items-center gap-1"><LinkIcon className="w-3 h-3"/> P.Án ANBV</label>
                  <input name="phuongAnAnBv" value={formData.phuongAnAnBv || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="https://..." />
               </div>
               
               <div className="sm:col-span-2 md:col-span-3 mt-2">
                 <label className="block text-[10px] font-bold text-gray-700 mb-2 uppercase border-b border-gray-100 pb-1">Tiếp giáp địa lý</label>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   <input name="phiaTruoc" value={formData.phiaTruoc || ""} onChange={handleChange} className={INPUT_CLASS} placeholder="Phía trước" />
                   <input name="benPhai" value={formData.benPhai || ""} onChange={handleChange} className={INPUT_CLASS} placeholder="Bên phải" />
                   <input name="benTrai" value={formData.benTrai || ""} onChange={handleChange} className={INPUT_CLASS} placeholder="Bên trái" />
                   <input name="phiaSau" value={formData.phiaSau || ""} onChange={handleChange} className={INPUT_CLASS} placeholder="Phía sau" />
                 </div>
               </div>
               
               <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Đánh giá tình hình ANTT</label>
                  <textarea rows={3} name="thuctrangANBV" value={formData.thuctrangANBV || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="Mô tả thực trạng an ninh..."></textarea>
               </div>
             </div>
          </div>

          {/* 6. HỆ THỐNG AN NINH & PCCC */}
          <div>
            <h3 className={SECTION_TITLE}><Shield className="w-4 h-4 text-red-500"/> 6. Hệ thống An ninh & PCCC</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">SL Camera</label>
                    <input type="number" name="slCamera" value={formData.slCamera || 0} onChange={handleChange} className={INPUT_CLASS} />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">TG Lưu hình (Ngày)</label>
                    <input type="number" name="thoiGianLuuHinh" value={formData.thoiGianLuuHinh || 0} onChange={handleChange} className={INPUT_CLASS} />
                </div>
                <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Vị trí Tủ báo cháy</label>
                    <input name="viTriTuBaoChay" value={formData.viTriTuBaoChay || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="VD: Phòng bảo vệ, Tầng hầm..." />
                </div>
                
                <div className="col-span-2 flex items-center gap-2 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                    <input type="checkbox" name="htBaoChayTuDong" checked={!!formData.htBaoChayTuDong} onChange={handleChange} className="w-4 h-4 text-primary rounded shrink-0" id="chk_baochay" />
                    <label htmlFor="chk_baochay" className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer">Có Hệ thống Báo cháy tự động</label>
                </div>
                
                <div className="col-span-2 flex items-center gap-2 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                    <input type="checkbox" name="heThongBomPccc" checked={!!formData.heThongBomPccc} onChange={handleChange} className="w-4 h-4 text-primary rounded shrink-0" id="chk_bompccc" />
                    <label htmlFor="chk_bompccc" className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer">Có Hệ thống Bơm PCCC</label>
                </div>
            </div>
          </div>

          {/* 7. THÔNG TIN PHÒNG HỌP */}
          <div>
            <h3 className={SECTION_TITLE}><Building className="w-4 h-4 text-teal-500"/> 7. Thông tin Phòng họp</h3>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => {
                const phopKey = `phop${i}` as keyof DonVi;
                const vitriKey = `vitriPhop${i}` as keyof DonVi;
                const scKey = `scPhop${i}` as keyof DonVi;
                const manKey = `manPhop${i}` as keyof DonVi;
                const onlineKey = `onlinePhop${i}` as keyof DonVi;
                const layoutKey = `layout${i}` as keyof DonVi;

                return (
                  <div key={i} className="bg-teal-50/50 p-4 rounded-xl border border-teal-100">
                    <div className="flex items-center gap-2 mb-3 border-b border-teal-200 pb-2">
                      <input 
                        type="checkbox" 
                        name={phopKey} 
                        checked={!!formData[phopKey]} 
                        onChange={handleChange} 
                        className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                        id={`chk_phop${i}`}
                      />
                      <label htmlFor={`chk_phop${i}`} className="text-sm font-bold text-teal-800 uppercase cursor-pointer">
                        Phòng họp {i}
                      </label>
                    </div>

                    {formData[phopKey] && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-fadeIn">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Vị trí (Tên - Tầng)</label>
                          <input name={vitriKey} value={formData[vitriKey] as string || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="VD: Phòng họp lớn - Tầng 2" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Sức chứa (Người)</label>
                          <input type="number" name={scKey} value={formData[scKey] as number || 0} onChange={handleChange} className={INPUT_CLASS} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Màn hình / Tivi</label>
                          <input name={manKey} value={formData[manKey] as string || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="VD: Tivi 65 inch" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Link Layout (Drive)</label>
                          <input name={layoutKey} value={formData[layoutKey] as string || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="https://..." />
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-2 mt-4 bg-white p-2 rounded border border-teal-100">
                           <input type="checkbox" name={onlineKey} checked={!!formData[onlineKey]} onChange={handleChange} className="w-4 h-4 text-teal-600 rounded" id={`chk_online${i}`} />
                           <label htmlFor={`chk_online${i}`} className="text-xs font-medium text-gray-700 cursor-pointer">Hỗ trợ họp Online</label>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
            
        </form>

        <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
          <button onClick={onClose} className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Hủy bỏ</button>
          <button onClick={handleSubmit} className="w-full sm:w-auto px-8 py-2.5 bg-primary text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md active:scale-95">
            <Save className="w-4 h-4" /> Lưu Đơn vị
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitFormModal;
