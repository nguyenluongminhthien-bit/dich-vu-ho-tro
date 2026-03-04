
import React, { useState, useEffect, useRef } from 'react';
import { VanBan, DonVi } from '../types';
import { X, Save, FileText, Info, ChevronDown, Check } from 'lucide-react';

interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doc: VanBan) => void;
  initialData?: VanBan | null;
  defaultType: 'ThongBao' | 'QuyDinh';
  units: DonVi[];
}

const INPUT_CLASS = "w-full text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary p-2 border bg-[#FFFFF0] !text-black placeholder-gray-400";

const DocumentFormModal: React.FC<DocumentFormModalProps> = ({ isOpen, onClose, onSave, initialData, defaultType, units }) => {
  const defaultData = { 
    id: '', soHieu: '', ngayBanHanh: '', noiDungTen: '', linkFile: '', 
    loai: defaultType, loaiVanBan: 'Thông báo', dmQuyTrinh: 'AN-BV',
    nguoiKy: '', chucVu: '', donViTrinh: '', nguoiLaySo: '', phamVi: '', hieuLuc: 'Còn hiệu lực'
  };

  const [formData, setFormData] = useState<any>(defaultData);
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const scopeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData ? { ...defaultData, ...initialData } : defaultData);
    }
  }, [isOpen, initialData, defaultType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (scopeRef.current && !scopeRef.current.contains(event.target as Node)) {
        setIsScopeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDatePicker = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 8);
    if (v.length >= 5) return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    if (v.length >= 3) return `${v.slice(0, 2)}/${v.slice(2)}`;
    return v;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let finalValue = value;
    
    // Tự động format ngày tháng ngay khi gõ (chỉ áp dụng cho Ngày ban hành)
    if (name === 'ngayBanHanh') {
      finalValue = formatDatePicker(value);
    }
    
    setFormData((prev: any) => ({ ...prev, [name]: finalValue }));
  };

  const handleScopeToggle = (value: string) => {
    const currentScopes = formData.phamVi ? formData.phamVi.split(',').map((s: string) => s.trim()) : [];
    let newScopes;
    if (currentScopes.includes(value)) {
      newScopes = currentScopes.filter((s: string) => s !== value);
    } else {
      newScopes = [...currentScopes, value];
    }
    setFormData((prev: any) => ({ ...prev, phamVi: newScopes.join(', ') }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id) {
      formData.id = formData.soHieu || `DOC_${Date.now()}`;
    }
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  // Filter units where maCapTren is 'HO'
  const hoUnits = units.filter(u => u.maCapTren === 'HO');
  const scopeOptions = ['Toàn Hệ thống', ...hoUnits.map(u => u.tenDonVi)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-xl shadow-2xl w-full max-w-2xl h-full sm:h-auto sm:max-h-[95vh] flex flex-col overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2 truncate">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <span className="truncate">{initialData ? 'Cập nhật Văn bản' : `Thêm ${defaultType === 'ThongBao' ? 'Thông báo' : 'Quy định'}`}</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors shrink-0"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
               <Info className="w-3 h-3 text-primary" /> Thông tin định danh
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Số hiệu văn bản *</label>
                <input required name="soHieu" value={formData.soHieu || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="Ví dụ: 01/2024/TB-THACO" disabled={!!initialData} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Ngày ban hành (dd/mm/yyyy)*</label>
                <input required name="ngayBanHanh" value={formData.ngayBanHanh || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="dd/mm/yyyy" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Nội dung / Tên văn bản *</label>
                <textarea required name="noiDungTen" value={formData.noiDungTen || ''} onChange={handleChange} className={`${INPUT_CLASS} resize-none text-black`} rows={2} placeholder="Nhập tiêu đề hoặc trích yếu nội dung văn bản..."></textarea>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
               <Info className="w-3 h-3 text-orange-500" /> Nhân sự & Đơn vị liên quan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Người ký</label>
                <input name="nguoiKy" value={formData.nguoiKy || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="Họ tên người ký" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Chức vụ</label>
                <input name="chucVu" value={formData.chucVu || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="Chức vụ người ký" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Đơn vị trình</label>
                <div className="relative">
                  <input 
                    list="unit-options" 
                    name="donViTrinh" 
                    value={formData.donViTrinh || ''} 
                    onChange={handleChange} 
                    className={INPUT_CLASS} 
                    placeholder="Chọn hoặc nhập Đơn vị trình..." 
                  />
                  <datalist id="unit-options">
                    {hoUnits.map(u => (
                      <option key={u.maDonVi} value={u.tenDonVi} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Người lấy số</label>
                <input name="nguoiLaySo" value={formData.nguoiLaySo || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="Họ tên người đăng ký số" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Bộ phận</label>
                <div className="relative">
                  <input 
                    list="dept-options" 
                    name="boPhan" 
                    value={formData.boPhan || ''} 
                    onChange={handleChange} 
                    className={INPUT_CLASS} 
                    placeholder="Nhập hoặc chọn bộ phận..." 
                  />
                  <datalist id="dept-options">
                    <option value="HCNS" />
                    <option value="Kế toán" />
                    <option value="Kinh doanh" />
                    <option value="Dịch vụ" />
                    <option value="Kho" />
                    <option value="Marketing" />
                    <option value="CSKH" />
                    <option value="CNTT" />
                  </datalist>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
               <Info className="w-3 h-3 text-green-500" /> Phân loại & Hiệu lực
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div ref={scopeRef} className="relative">
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Phạm vi áp dụng</label>
                <div 
                  onClick={() => setIsScopeOpen(!isScopeOpen)} 
                  className={`${INPUT_CLASS} cursor-pointer flex items-center justify-between bg-white`}
                >
                  <span className="truncate pr-2">{formData.phamVi || 'Chọn phạm vi...'}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                </div>
                
                {isScopeOpen && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1 p-1">
                    {scopeOptions.map((option) => {
                      const isSelected = formData.phamVi?.split(',').map((s: string) => s.trim()).includes(option);
                      return (
                        <div 
                          key={option} 
                          onClick={() => handleScopeToggle(option)}
                          className={`flex items-center gap-2 p-2 hover:bg-blue-50 cursor-pointer rounded-md text-sm ${isSelected ? 'bg-blue-50 text-primary font-medium' : 'text-gray-700'}`}
                        >
                          <div className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span>{option}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Trạng thái Hiệu lực</label>
                <select name="hieuLuc" value={formData.hieuLuc || 'Còn hiệu lực'} onChange={handleChange} className={INPUT_CLASS}>
                  <option value="Còn hiệu lực">Còn hiệu lực</option>
                  <option value="Hết hiệu lực">Hết hiệu lực</option>
                </select>
              </div>
              
              {formData.loai === 'ThongBao' ? (
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Loại văn bản</label>
                  <select name="loaiVanBan" value={formData.loaiVanBan || 'Thông báo'} onChange={handleChange} className={INPUT_CLASS}>
                    <option value="Thông báo">Thông báo</option>
                    <option value="Công văn đến">Công văn đến</option>
                    <option value="Công văn đi">Công văn đi</option>
                    <option value="Tờ trình">Tờ trình</option>
                    <option value="Quyết định">Quyết định</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Danh mục Quy trình</label>
                  <select name="dmQuyTrinh" value={formData.dmQuyTrinh || 'AN-BV'} onChange={handleChange} className={INPUT_CLASS}>
                    <option value="AN-BV">AN-BV</option>
                    <option value="PVHC">PVHC</option>
                    <option value="PCCC">PCCC</option>
                    <option value="PCTT">PCTT</option>
                    <option value="ATVSLĐ">ATVSLĐ</option>
                    <option value="Chi phí">Chi phí</option>
                    <option value="Hành chính">Hành chính</option>
                  </select>
                </div>
              )}
              
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase">Đường dẫn file</label>
                <input name="linkFile" value={formData.linkFile || ''} onChange={handleChange} className={INPUT_CLASS} placeholder="https://drive.google.com/..." />
              </div>
            </div>
          </div>
        </form>

        <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
          <button onClick={onClose} className="w-full sm:w-auto px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Hủy</button>
          <button onClick={handleSubmit} className="w-full sm:w-auto px-8 py-2.5 bg-primary text-white rounded-lg flex items-center justify-center gap-2 font-bold shadow-md hover:bg-blue-700 transition-all">
            <Save className="w-4 h-4" /> Lưu Văn bản
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentFormModal;
