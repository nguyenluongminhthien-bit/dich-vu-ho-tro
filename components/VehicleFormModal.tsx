
import React, { useState, useEffect } from 'react';
import { Xe, DonVi } from '../types';
import { X, Save, Car, Info, Fuel, Settings, Database, Activity, MapPin, Gauge, Shield, CreditCard, FileText } from 'lucide-react';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: Xe) => void;
  initialData?: Xe | null;
  units: DonVi[];
}

const BRAND_OPTIONS = ['Kia', 'Mazda', 'Peugeot', 'BMW', 'Thaco Bus', 'Thaco Truck', 'Van', 'Fuso', 'Khác'];
const VEHICLE_TYPE_OPTIONS = ['Ô tô du lịch', 'Ô tô tải', 'Xe chuyên dùng', 'Mô tô', 'Khác'];
const FUEL_OPTIONS = ['Xăng', 'Dầu', 'Điện', 'Khác'];
const OWNERSHIP_OPTIONS = ['Sở hữu', 'Thuê tài chính', 'Quản lý sử dụng'];
const FREQUENCY_OPTIONS = ['Thường xuyên', 'Ít sử dụng', 'Lưu kho'];
const STATUS_OPTIONS = ['Bình thường', 'Đang sửa chữa', 'Hỏng', 'Thanh lý'];
const MUC_DICH_OPTIONS = ['Xe Công', 'Xe Lái thử', 'Xe Thay thế KH', 'Xe Sửa chữa lưu động', 'Xe Chuyên dụng'];

const INPUT_CLASS = "w-full text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary p-2 border bg-[#FFFFF0] !text-black placeholder-gray-400 transition-all";
const SECTION_TITLE = "text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-blue-100 pb-2 mt-2";

const VehicleFormModal: React.FC<VehicleFormModalProps> = ({ isOpen, onClose, onSave, initialData, units }) => {
  const defaultData = { 
    id: `XE_${Date.now()}`, 
    bienSo: '', 
    hieuXe: 'Kia', 
    loaiXe: '', 
    phienBan: '',
    loaiPhuongTien: 'Ô tô du lịch', 
    maDonVi: '', 
    maCapTren: 'HO',
    mauXe: '', 
    namSX: new Date().getFullYear(), 
    namDK: new Date().getFullYear(),
    soCho: 5, 
    kmHienTai: 0, 
    chiPhiNguyenLieu: 0, 
    hienTrang: 'Bình thường', 
    mucDichSuDung: '', 
    maTaiSan: '', 
    hinhThucSoHuu: 'Sở hữu',
    donViChuSoHuu: 'THACO AUTO', 
    nguyenGia: 0, 
    chiPhiThueKhauHao: 0,
    phanNhanChiuChiPhi: '', 
    loaiNhienLieu: 'Xăng', 
    dungTich: '', 
    congThucBanh: '',
    tanSuat: 'Thường xuyên', 
    nlSuDungTrongThang: 0, 
    gps: true, 
    soKhung: '',
    soMay: '',
    ghiChu: ''
  };

  const [formData, setFormData] = useState<any>(defaultData);
  const [bienSoError, setBienSoError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const data = initialData ? { ...defaultData, ...initialData } : defaultData;
      setFormData(data);
      
      // Validate initial bienSo
      if (data.bienSo && !/^[a-zA-Z0-9]*$/.test(data.bienSo)) {
        setBienSoError('Biển số không được chứa ký tự đặc biệt hoặc khoảng cách (VD: 51H12345)');
      } else {
        setBienSoError('');
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;

    if (type === 'number') {
      finalValue = value === '' ? 0 : Number(value);
    } else if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    }

    if (name === 'bienSo') {
      const regex = /^[a-zA-Z0-9]*$/;
      if (!regex.test(value)) {
        setBienSoError('Biển số không được chứa ký tự đặc biệt hoặc khoảng cách (VD: 51H12345)');
      } else {
        setBienSoError('');
      }
    }

    if (name === 'maCapTren') {
      setFormData((prev: any) => ({ 
        ...prev, 
        maCapTren: value,
        maDonVi: '' // Reset showroom when management unit changes
      }));
      return;
    }

    setFormData((prev: any) => ({ ...prev, [name]: finalValue }));
  };

  const managementUnits = units.filter(u => u.maCapTren === 'HO');
  const showrooms = units.filter(u => u.maCapTren === formData.maCapTren);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bienSo || !formData.maDonVi) {
      alert("Vui lòng nhập Biển số và Đơn vị quản lý!");
      return;
    }
    if (bienSoError) {
      alert("Vui lòng sửa lỗi Biển số trước khi lưu!");
      return;
    }
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-6xl h-full sm:h-auto sm:max-h-[95vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b bg-gray-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-blue-100 text-primary rounded-xl shadow-inner shrink-0">
              <Car className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                {initialData ? `Cập nhật: ${formData.bienSo || ''}` : 'Thêm Phương tiện Mới'}
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium truncate">Quản lý chi tiết hồ sơ xe hệ thống THACO AUTO</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors group shrink-0">
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-8 overflow-y-auto space-y-6 sm:space-y-8 custom-scrollbar flex-1 bg-white">
          
          {/* Section 1: Định danh & Phân loại */}
          <section>
            <h3 className={SECTION_TITLE}><Info className="w-4 h-4" /> 1. Định danh & Phân loại</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Biển số *</label>
                <input required name="bienSo" value={formData.bienSo || ''} onChange={handleChange} className={`${INPUT_CLASS} ${bienSoError ? 'border-red-500 bg-red-50' : ''}`} placeholder="VD: 51H12345" />
                {bienSoError && <p className="text-[9px] text-red-500 mt-1 font-bold leading-tight">{bienSoError}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Hiệu xe *</label>
                <select required name="hieuXe" value={formData.hieuXe || 'Kia'} onChange={handleChange} className={INPUT_CLASS}>
                  {BRAND_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Dòng xe / Model *</label>
                <input required name="loaiXe" value={formData.loaiXe || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="VD: Carnival, CX-5..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Phiên bản</label>
                <input name="phienBan" value={formData.phienBan || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="VD: Premium, Luxury..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Loại phương tiện</label>
                <select name="loaiPhuongTien" value={formData.loaiPhuongTien || 'Ô tô du lịch'} onChange={handleChange} className={INPUT_CLASS}>
                  {VEHICLE_TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Đơn vị quản lý *</label>
                <select required name="maCapTren" value={formData.maCapTren || ''} onChange={handleChange} className={INPUT_CLASS}>
                  <option value="">-- Chọn Đơn vị quản lý --</option>
                  {managementUnits.map(u => <option key={u.id} value={u.maDonVi}>{u.tenDonVi}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Showroom sử dụng *</label>
                <select required name="maDonVi" value={formData.maDonVi || ''} onChange={handleChange} className={INPUT_CLASS} disabled={!formData.maCapTren}>
                  <option value="">-- Chọn Showroom --</option>
                  {showrooms.map(u => <option key={u.id} value={u.maDonVi}>{u.tenDonVi}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Màu xe</label>
                <input name="mauXe" value={formData.mauXe || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="VD: Trắng, Đen..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Số chỗ ngồi</label>
                <input type="number" name="soCho" value={formData.soCho || 0} onChange={handleChange} className={INPUT_CLASS} />
              </div>
            </div>
          </section>

          {/* Section 2: Thông số kỹ thuật & Vận hành */}
          <section>
            <h3 className={SECTION_TITLE}><Settings className="w-4 h-4" /> 2. Thông số kỹ thuật & Vận hành</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Năm sản xuất</label>
                <input type="number" name="namSX" value={formData.namSX || 0} onChange={handleChange} className={INPUT_CLASS} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Năm đăng ký lần đầu</label>
                <input type="number" name="namDK" value={formData.namDK || 0} onChange={handleChange} className={INPUT_CLASS} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Số khung</label>
                <input name="soKhung" value={formData.soKhung || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="Nhập số khung..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Số máy</label>
                <input name="soMay" value={formData.soMay || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="Nhập số máy..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Loại nhiên liệu</label>
                <select name="loaiNhienLieu" value={formData.loaiNhienLieu || 'Xăng'} onChange={handleChange} className={INPUT_CLASS}>
                  {FUEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Dung tích xi lanh</label>
                <input name="dungTich" value={formData.dungTich || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="VD: 2.2L, 1.5 Turbo..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Công thức bánh xe</label>
                <input name="congThucBanh" value={formData.congThucBanh || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="VD: 4x2, 4x4..." />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                  <div className={`p-2 rounded-lg border transition-all ${formData.gps ? 'bg-blue-500 text-white border-blue-600 shadow' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" name="gps" checked={!!formData.gps} onChange={handleChange} className="w-4 h-4 text-primary rounded border-gray-300" />
                    <span className="text-xs font-bold text-gray-700">Có gắn GPS</span>
                  </div>
                </label>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Km hiện tại</label>
                <div className="relative">
                  <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input type="number" name="kmHienTai" value={formData.kmHienTai || 0} onChange={handleChange} className={`${INPUT_CLASS} pl-9`} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Tần suất sử dụng</label>
                <select name="tanSuat" value={formData.tanSuat || 'Thường xuyên'} onChange={handleChange} className={INPUT_CLASS}>
                  {FREQUENCY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Section 3: SỞ HỮU */}
          <section>
            <h3 className={SECTION_TITLE}><Database className="w-4 h-4" /> 3. SỞ HỮU</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Hình thức sở hữu</label>
                <select name="hinhThucSoHuu" value={formData.hinhThucSoHuu || 'Sở hữu'} onChange={handleChange} className={INPUT_CLASS}>
                  {OWNERSHIP_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Đơn vị sở hữu (trên Cavet)</label>
                <input name="donViChuSoHuu" value={formData.donViChuSoHuu || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="VD: THACO AUTO TPHCM..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Mã tài sản (SAP/ERP)</label>
                <input name="maTaiSan" value={formData.maTaiSan || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="VD: TS-123456" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Mục đích sử dụng chính</label>
                <select name="mucDichSuDung" value={formData.mucDichSuDung || ''} onChange={handleChange} className={INPUT_CLASS}>
                  <option value="">-- Chọn mục đích --</option>
                  {MUC_DICH_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Phòng/Nhan chịu chi phí</label>
                <input name="phanNhanChiuChiPhi" value={formData.phanNhanChiuChiPhi || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="VD: Phòng Hành chính, Showroom A..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Nguyên giá (VNĐ)</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input type="number" name="nguyenGia" value={formData.nguyenGia || 0} onChange={handleChange} className={`${INPUT_CLASS} pl-9 font-mono`} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Chi phí Thuê/Khấu hao (Tháng)</label>
                <input type="number" name="chiPhiThueKhauHao" value={formData.chiPhiThueKhauHao || 0} onChange={handleChange} className={`${INPUT_CLASS} font-mono`} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">NL tiêu thụ TB (Lít/Km)</label>
                <div className="relative">
                  <Fuel className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input type="number" name="nlSuDungTrongThang" value={formData.nlSuDungTrongThang || 0} onChange={handleChange} className={`${INPUT_CLASS} pl-9`} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Chi phí nhiên liệu/Tháng</label>
                <input type="number" name="chiPhiNguyenLieu" value={formData.chiPhiNguyenLieu || 0} onChange={handleChange} className={`${INPUT_CLASS} font-mono`} />
              </div>
            </div>
          </section>

          {/* Section 4: Hiện trạng & Ghi chú */}
          <section>
            <h3 className={SECTION_TITLE}><Activity className="w-4 h-4" /> 4. Hiện trạng & Ghi chú</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-5">
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Hiện trạng xe</label>
                <select name="hienTrang" value={formData.hienTrang || 'Bình thường'} onChange={handleChange} className={INPUT_CLASS}>
                  {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Ghi chú chi tiết</label>
                <div className="relative">
                   <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-300" />
                   <textarea name="ghiChu" value={formData.ghiChu || ''} onChange={handleChange} rows={2} className={`${INPUT_CLASS} pl-9 resize-none`} placeholder="Nhập các lưu ý đặc biệt về phương tiện..."></textarea>
                </div>
              </div>
            </div>
          </section>

        </form>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t bg-gray-50 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose} 
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-all"
          >
            Hủy bỏ
          </button>
          <button 
            type="submit"
            onClick={handleSubmit} 
            className="w-full sm:w-auto px-12 py-2.5 bg-primary text-white rounded-xl flex items-center justify-center gap-2 font-bold shadow-xl hover:bg-blue-700 transition-all active:scale-95"
          >
            <Save className="w-5 h-5" /> Lưu Hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleFormModal;
