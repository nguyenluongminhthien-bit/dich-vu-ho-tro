import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2, Save, Utensils, Briefcase, Pocket, History, Filter } from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from "../../utils/toast";
import { NhaCungCap } from '../../types';

const formatCurrency = (val: string | number | undefined | null) => {
  if (!val) return '';
  return val.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const EMPTY_FORM = {
  id: '', id_don_vi: '', dinh_bien: '', pvhc_khach_cho: '', pvhc_ve_sinh: '',
  hien_huu: '', pvhc_dich_vu: '', vi_tri: '', ncc_dich_vu: '', chi_phi_thue: '', id_ncc: null
};

interface Props {
  isOpen: boolean;
  currentData: any | null;
  selectedUnitId: string | null;
  onSaved: (data: any, isCreate: boolean) => void;
  onClose: () => void;
}

export default function PvhcModal({ isOpen, currentData, selectedUnitId, onSaved, onClose }: Props) {
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nccList, setNccList] = useState<NhaCungCap[]>([]);
  const [loadingNcc, setLoadingNcc] = useState(false);
  const [selectedNccGroup, setSelectedNccGroup] = useState<string>('ALL');

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSelectedNccGroup('ALL');
      const initialForm = currentData
        ? { ...currentData, id: currentData.id || '', id_ncc: currentData.id_ncc || null }
        : { ...EMPTY_FORM, id: `HC${Date.now()}`, id_don_vi: selectedUnitId || '' };
      
      setFormData(initialForm);

      setLoadingNcc(true);
      apiService.getNhaCungCap()
        .then(res => {
          setNccList(res || []);
          // Tự động khớp nhà cung cấp cũ qua tên nếu chưa có id_ncc
          if (currentData && !currentData.id_ncc && currentData.ncc_dich_vu) {
            const name = String(currentData.ncc_dich_vu).trim().toLowerCase();
            const matched = (res || []).find(n => 
              n.ten_cong_ty.trim().toLowerCase() === name || 
              (n.ten_goi_tat && n.ten_goi_tat.trim().toLowerCase() === name)
            );
            if (matched) {
              setFormData((prev: any) => ({ ...prev, id_ncc: matched.id }));
            }
          }
        })
        .catch(err => console.error('Lỗi lấy danh sách NCC:', err))
        .finally(() => setLoadingNcc(false));
    }
  }, [isOpen, currentData, selectedUnitId]);

  const displayedNccList = useMemo(() => {
    const logisticsGroups = ['Nước uống', 'Xử lý chất thải & Vệ sinh', 'Tạp phẩm', 'Môi trường, cảnh quan', 'Đồng phục', 'Khác'];
    if (selectedNccGroup === 'ALL') {
      return nccList.filter(ncc => 
        logisticsGroups.includes(ncc.nhom_dich_vu) || 
        ncc.id === formData.id_ncc
      );
    }
    return nccList.filter(ncc => 
      ncc.nhom_dich_vu === selectedNccGroup || 
      ncc.id === formData.id_ncc
    );
  }, [nccList, selectedNccGroup, formData.id_ncc]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'chi_phi_thue' ? value.replace(/\D/g, '') : value;
    setFormData((prev: any) => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setSubmitting(true); 
    setError(null);
    
    const khachCho = Number(formData.pvhc_khach_cho) || 0;
    const veSinh = Number(formData.pvhc_ve_sinh) || 0;
    const dichVu = Number(formData.pvhc_dich_vu) || 0;
    let finalData: any = { ...formData, hien_huu: khachCho + veSinh };
    
    // Đã đổi chuỗi rỗng '' thành null cho an toàn với Database
    if (dichVu < 1) { 
      finalData.vi_tri = null; 
      finalData.ncc_dich_vu = null; 
      finalData.chi_phi_thue = null; 
      finalData.id_ncc = null;
    }

    if (finalData.id_ncc === 'custom') {
      finalData.id_ncc = null;
    }

    // 🟢 Dọn dẹp dữ liệu: Tự động chuyển các chuỗi rỗng còn lại thành null
    Object.keys(finalData).forEach(key => {
      if (finalData[key] === '' || finalData[key] === ' ') {
        finalData[key] = null;
      }
    });

    const isCreate = !currentData;
    const mode = isCreate ? 'create' : 'update';
    if (isCreate && (!finalData.id || finalData.id === '')) finalData.id = `HC${Date.now()}`;
    
    try {
      await apiService.save(finalData, mode, 'hs_pvhc');
      onSaved(finalData, isCreate);
      onClose();
      // 🟢 Thêm thông báo thành công
      if (isCreate) {
        toast.success("Thêm mới hồ sơ Hậu cần thành công!");
      } else {
        toast.success("Cập nhật hồ sơ Hậu cần thành công!");
      }

    } catch (err: any) { 
      setError(err.message || 'Lỗi lưu dữ liệu Hậu cần.'); 
      // 🔴 Thêm thông báo lỗi
      toast.error(err.message || "Đã xảy ra lỗi khi lưu hồ sơ Hậu cần!");
      
    } finally { 
      setSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] sm:max-w-2xl flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in duration-200 mt-auto sm:mt-0 overflow-hidden">
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-emerald-100 bg-emerald-50 rounded-t-3xl sm:rounded-t-2xl text-emerald-900 shrink-0">
          <h3 className="text-xl font-bold flex items-center gap-2"><Utensils size={24}/> Cập nhật Phục vụ Hậu cần</h3>
          <button onClick={onClose} disabled={submitting} className="text-emerald-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm transition-colors ml-1"><X className="w-6 h-6" /></button>
        </div>
        {error && <div className="mx-5 mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>}
        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
          <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100">
            <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2 border-b border-emerald-200 pb-2"><Pocket size={18}/> 1. Lực lượng Nội bộ</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div><label className="block text-xs font-bold text-gray-700 mb-1">Định biên (Người) *</label><input type="number" required name="dinh_bien" value={formData.dinh_bien || ''} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1">NV Khách chờ</label><input type="number" name="pvhc_khach_cho" value={formData.pvhc_khach_cho || ''} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1">NV PVHC (Vệ sinh-5S)</label><input type="number" name="pvhc_ve_sinh" value={formData.pvhc_ve_sinh || ''} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            </div>
            <p className="text-[10px] text-gray-500 mt-3 italic">* Hệ thống sẽ tự tính <strong>Hiện hữu</strong> = Khách chờ + Vệ sinh</p>
          </div>

          <div className="bg-orange-50/50 p-5 rounded-xl border border-orange-100">
            <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2 border-b border-orange-200 pb-2"><Briefcase size={18}/> 2. Dịch vụ Thuê ngoài</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div><label className="block text-xs font-bold text-gray-700 mb-1">Số lượng Thuê ngoài (Người)</label><input type="number" name="pvhc_dich_vu" value={formData.pvhc_dich_vu || ''} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500" /></div>
              {Number(formData.pvhc_dich_vu) > 0 && <div className="animate-in fade-in"><label className="block text-xs font-bold text-gray-700 mb-1">Vị trí đảm nhận *</label><input type="text" required name="vi_tri" value={formData.vi_tri || ''} onChange={handleChange} placeholder="VD: Khách chờ, Vệ sinh-5S..." className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500" /></div>}
            </div>
            {Number(formData.pvhc_dich_vu) > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-orange-100 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                    <span>Nhà cung cấp dịch vụ *</span>
                    {loadingNcc && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
                  </label>
                  
                  {/* Quick filters for Supplier categories */}
                  {formData.id_ncc !== 'custom' && (
                    <div className="mb-2 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase mr-0.5">Lọc:</span>
                      {[
                        { value: 'ALL', label: 'Hậu cần' },
                        { value: 'Nước uống', label: 'Nước' },
                        { value: 'Xử lý chất thải & Vệ sinh', label: 'Vệ sinh' },
                        { value: 'Tạp phẩm', label: 'Tạp phẩm' },
                        { value: 'Khác', label: 'Khác' }
                      ].map(grp => (
                        <button
                          key={grp.value}
                          type="button"
                          onClick={() => setSelectedNccGroup(grp.value)}
                          className={`px-2 py-0.5 text-[9px] font-bold rounded-md border transition-all ${
                            selectedNccGroup === grp.value
                              ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {grp.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {formData.id_ncc === 'custom' ? (
                    <div className="relative">
                      <input
                        type="text"
                        required
                        name="ncc_dich_vu"
                        value={formData.ncc_dich_vu || ''}
                        onChange={handleChange}
                        placeholder="Nhập tên nhà cung cấp tự do..."
                        className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 pr-10 font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, id_ncc: null, ncc_dich_vu: '' }));
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        title="Quay lại danh sách chọn"
                      >
                        <History size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        name="id_ncc"
                        value={formData.id_ncc || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'custom') {
                            setFormData(prev => ({ ...prev, id_ncc: 'custom', ncc_dich_vu: '' }));
                          } else {
                            const selectedNcc = nccList.find(ncc => ncc.id === val);
                            setFormData(prev => ({
                              ...prev,
                              id_ncc: val || null,
                              ncc_dich_vu: selectedNcc ? selectedNcc.ten_cong_ty : ''
                            }));
                          }
                        }}
                        className="flex-1 p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-gray-700 text-sm"
                      >
                        <option value="">-- Chọn Nhà cung cấp --</option>
                        {displayedNccList.map(ncc => (
                          <option key={ncc.id} value={ncc.id}>
                            [{ncc.nhom_dich_vu}] {ncc.ten_cong_ty}
                          </option>
                        ))}
                        <option value="custom" className="text-orange-600 font-bold">+ Khác (Tự nhập)</option>
                      </select>
                    </div>
                  )}
                </div>
                <div><label className="block text-xs font-bold text-red-600 mb-1">Chi phí thuê / tháng (VNĐ) *</label><input type="text" required name="chi_phi_thue" value={formatCurrency(formData.chi_phi_thue)} onChange={handleChange} className="w-full p-2.5 border border-red-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-600" /></div>
              </div>
            )}
          </div>

          </div>
          
          {/* FOOTER */}
          <div className="p-5 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-white rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition-colors shadow-sm">Hủy</button>
            <button type="submit" disabled={submitting} className="px-8 py-3 text-white bg-[#05469B] hover:bg-[#04367a] rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-colors">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Lưu Hậu Cần
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
