
import React, { useState, useEffect } from 'react';
import { User, Role, DonVi } from '../types';
import { X, Save, ShieldCheck, Check } from 'lucide-react';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  initialData?: User | null;
  units: DonVi[]; // Nhận danh sách đơn vị để hiển thị dropdown
}

const INPUT_CLASS = "w-full text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary p-2 border bg-[#FFFFF0] !text-black placeholder-gray-400";

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, initialData, units }) => {
  const defaultData = { 
    email: '', hoTen: '', vaiTro: Role.CTY, 
    maDonVi: '', phanQuyen: 'View', password: '123' 
  };

  const [formData, setFormData] = useState<any>(defaultData);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      const data = initialData ? { ...defaultData, ...initialData } : defaultData;
      setFormData(data);
      // Parse maDonVi string to array
      if (data.maDonVi) {
        setSelectedUnits(data.maDonVi.split(',').map((s: string) => s.trim()).filter(Boolean));
      } else {
        setSelectedUnits([]);
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const toggleUnit = (code: string) => {
    setSelectedUnits(prev => {
      if (code === 'ALL') {
        return prev.includes('ALL') ? [] : ['ALL'];
      }

      let newSelection = prev.filter(u => u !== 'ALL');
      
      if (newSelection.includes(code)) {
        newSelection = newSelection.filter(u => u !== code);
      } else {
        newSelection.push(code);
      }
      return newSelection;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const maDonViString = selectedUnits.join(',');
    onSave({ ...formData, maDonVi: maDonViString });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-xl shadow-2xl w-full max-w-md h-full sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2 truncate">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <span className="truncate">{initialData ? 'Sửa Người dùng' : 'Thêm Người dùng mới'}</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full shrink-0"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Email (Tên đăng nhập) *</label>
            <input required type="email" name="email" value={formData.email || ''} onChange={handleChange} className={INPUT_CLASS} disabled={!!initialData} placeholder="name@thaco.com.vn" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Họ và Tên *</label>
            <input required name="hoTen" value={formData.hoTen || ''} onChange={handleChange} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Mật khẩu *</label>
            <input required type="password" name="password" value={formData.password || ''} onChange={handleChange} className={INPUT_CLASS} />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Đơn vị phụ trách (Chọn nhiều) *</label>
            <div className="border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto bg-[#FFFFF0]">
              {/* Option ALL */}
              <div 
                className={`flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-blue-50 ${selectedUnits.includes('ALL') ? 'bg-blue-100' : ''}`}
                onClick={() => toggleUnit('ALL')}
              >
                <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedUnits.includes('ALL') ? 'bg-primary border-primary' : 'border-gray-400'}`}>
                  {selectedUnits.includes('ALL') && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm font-medium">ALL - Toàn quyền Hệ thống</span>
              </div>

              {/* Option HO */}
              <div 
                className={`flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-blue-50 ${selectedUnits.includes('HO') ? 'bg-blue-100' : ''}`}
                onClick={() => toggleUnit('HO')}
              >
                <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedUnits.includes('HO') ? 'bg-primary border-primary' : 'border-gray-400'}`}>
                  {selectedUnits.includes('HO') && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm">HO - Văn phòng điều hành</span>
              </div>

              {/* List Units */}
              {units.map(u => (
                <div 
                  key={u.id} 
                  className={`flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-blue-50 ${selectedUnits.includes(u.maDonVi) ? 'bg-blue-100' : ''}`}
                  onClick={() => toggleUnit(u.maDonVi)}
                >
                  <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedUnits.includes(u.maDonVi) ? 'bg-primary border-primary' : 'border-gray-400'}`}>
                    {selectedUnits.includes(u.maDonVi) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm">{u.maDonVi} - {u.tenDonVi}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-1 italic">
              * Chọn "ALL" để quản lý tất cả. Có thể chọn nhiều đơn vị (VD: HN, DN) để quản lý đồng thời.
            </p>
            {selectedUnits.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedUnits.map(u => (
                  <span key={u} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200">
                    {u}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Vai trò</label>
              <select name="vaiTro" value={formData.vaiTro || Role.CTY} onChange={handleChange} className={INPUT_CLASS}>
                <option value={Role.ADMIN}>Quản trị (Admin)</option>
                <option value={Role.CTY}>VP Công ty</option>
                <option value={Role.SR}>Showroom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Phân quyền</label>
              <select name="phanQuyen" value={formData.phanQuyen || 'View'} onChange={handleChange} className={INPUT_CLASS}>
                <option value="All">All (Đọc/Ghi)</option>
                <option value="View">Chỉ xem (View)</option>
              </select>
            </div>
          </div>
        </form>
        <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
          <button onClick={onClose} className="w-full sm:w-auto px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Hủy</button>
          <button onClick={handleSubmit} className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-lg flex items-center justify-center gap-2 font-bold shadow-md hover:bg-blue-700 transition-all"><Save className="w-4 h-4" /> Lưu tài khoản</button>
        </div>
      </div>
    </div>
  );
};

export default UserFormModal;
