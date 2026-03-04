
import React, { useState } from 'react';
import { Xe, DonVi } from '../types';
import { X, Car, Info, Settings, Database, Activity, MapPin, Gauge, Shield, CreditCard, FileText, Fuel } from 'lucide-react';

interface VehicleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Xe | null;
  units: DonVi[];
}

const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({ isOpen, onClose, vehicle, units }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'specs' | 'cost' | 'status'>('info');

  if (!isOpen || !vehicle) return null;

  const getFullUnitName = (maCapTren: string, maDonVi: string) => {
    const parent = units.find(u => u.maDonVi === maCapTren);
    const child = units.find(u => u.maDonVi === maDonVi);
    if (parent && child && maCapTren !== 'HO') {
      return `${parent.tenDonVi} - ${child.tenDonVi}`;
    }
    return child?.tenDonVi || maDonVi;
  };

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
      className={`flex items-center gap-2 px-6 py-3 text-xs font-bold transition-all border-b-2 ${
        activeTab === id 
          ? 'border-primary text-primary bg-blue-50/50' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl w-full max-w-4xl h-full sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-white shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-primary/10 text-primary rounded-xl sm:rounded-2xl shadow-inner">
              <Car className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight truncate">
                {vehicle.bienSo}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">
                {vehicle.hieuXe} {vehicle.loaiXe} • {vehicle.loaiPhuongTien}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors group shrink-0">
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-gray-900" />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b bg-white px-4 sm:px-6 overflow-x-auto no-scrollbar scroll-smooth">
          <TabButton id="info" label="ĐỊNH DANH" icon={Info} />
          <TabButton id="specs" label="KỸ THUẬT" icon={Settings} />
          <TabButton id="cost" label="SỞ HỮU" icon={Database} />
          <TabButton id="status" label="HIỆN TRẠNG" icon={Activity} />
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 animate-fadeIn">
              <InfoRow label="Biển số" value={vehicle.bienSo} icon={Shield} />
              <InfoRow label="Hiệu xe" value={vehicle.hieuXe} />
              <InfoRow label="Dòng xe / Model" value={vehicle.loaiXe} />
              <InfoRow label="Phiên bản" value={vehicle.phienBan} />
              <InfoRow label="Loại phương tiện" value={vehicle.loaiPhuongTien} />
              <InfoRow label="Đơn vị quản lý" value={getFullUnitName(vehicle.maCapTren || '', vehicle.maDonVi)} />
              <InfoRow label="Màu xe" value={vehicle.mauXe} />
              <InfoRow label="Số chỗ ngồi" value={vehicle.soCho} />
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 animate-fadeIn">
              <InfoRow label="Năm sản xuất" value={vehicle.namSX} />
              <InfoRow label="Năm đăng ký lần đầu" value={vehicle.namDK} />
              <InfoRow label="Số khung" value={vehicle.soKhung} />
              <InfoRow label="Số máy" value={vehicle.soMay} />
              <InfoRow label="Loại nhiên liệu" value={vehicle.loaiNhienLieu} icon={Fuel} />
              <InfoRow label="Dung tích xi lanh" value={vehicle.dungTich} />
              <InfoRow label="Công thức bánh xe" value={vehicle.congThucBanh} />
              <InfoRow label="Km hiện tại" value={`${vehicle.kmHienTai?.toLocaleString()} km`} icon={Gauge} />
              <InfoRow label="Tần suất sử dụng" value={vehicle.tanSuat} />
              <InfoRow label="Có gắn GPS" value={vehicle.gps ? 'Có' : 'Không'} icon={MapPin} />
            </div>
          )}

          {activeTab === 'cost' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 animate-fadeIn">
              <InfoRow label="Hình thức sở hữu" value={vehicle.hinhThucSoHuu} />
              <InfoRow label="Đơn vị sở hữu" value={vehicle.donViChuSoHuu} />
              <InfoRow label="Mã tài sản" value={vehicle.maTaiSan} />
              <InfoRow label="Mục đích sử dụng" value={vehicle.mucDichSuDung} />
              <InfoRow label="Phòng/Nhân chịu chi phí" value={vehicle.phanNhanChiuChiPhi} />
              <InfoRow label="Nguyên giá" value={`${vehicle.nguyenGia?.toLocaleString()} VNĐ`} icon={CreditCard} />
              <InfoRow label="Chi phí Thuê/Khấu hao" value={`${vehicle.chiPhiThueKhauHao?.toLocaleString()} VNĐ/Tháng`} />
              <InfoRow label="NL tiêu thụ TB" value={`${vehicle.nlSuDungTrongThang} Lít/Km`} icon={Fuel} />
              <InfoRow label="Chi phí nhiên liệu/Tháng" value={`${vehicle.chiPhiNguyenLieu?.toLocaleString()} VNĐ`} />
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-3 sm:space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <InfoRow label="Hiện trạng xe" value={vehicle.hienTrang} />
              </div>
              <div className="flex flex-col p-4 sm:p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ghi chú chi tiết</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed italic">
                  {vehicle.ghiChu || 'Không có ghi chú bổ sung cho phương tiện này.'}
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

export default VehicleDetailModal;
