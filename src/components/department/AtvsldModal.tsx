import React, { useState, useEffect } from 'react';
import { X, Loader2, Save, HardHat, Users, Shield, Settings, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from "../../utils/toast";


const EMPTY_FORM = {
  id: '', id_don_vi: '', nguoi_phu_trach: '', so_luong_mang_luoi: '', link_ho_so_quy_dinh: '',
  ngay_huan_luyen_gan_nhat: '', ty_le_hoan_thanh_hl: '100%', ngay_ksk: '', nngay_kham_bnn: '',
  so_luong_thiet_bi_nghiem_ngat: '', so_luong_thiet_bi_qua_han_kt: '0', ngay_quan_trac_mt: '',
  ty_le_cap_bhld: 'Đầy đủ', ngay_tu_kiem_tra: '', cac_loi_hien_truong: '',
  so_tai_nan_trong_nam: '0', link_bien_ban_kiem_tra: '', ghi_chu: ''
};

interface Props {
  isOpen: boolean;
  currentData: any | null;
  selectedUnitId: string | null;
  onSaved: (data: any, isCreate: boolean) => void;
  onClose: () => void;
}

export default function AtvsldModal({ isOpen, currentData, selectedUnitId, onSaved, onClose }: Props) {
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setFormData(currentData
        ? { ...currentData, id: currentData.id || '' }
        : { ...EMPTY_FORM, id: `AT${Date.now()}`, id_don_vi: selectedUnitId || '' }
      );
    }
  }, [isOpen, currentData, selectedUnitId]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setSubmitting(true); 
    setError(null);
    
    let finalData: any = { ...formData };

    // 🟢 Dọn dẹp dữ liệu: Tự động chuyển các chuỗi rỗng thành null
    Object.keys(finalData).forEach(key => {
      if (finalData[key] === '' || finalData[key] === ' ') {
        finalData[key] = null;
      }
    });

    const isCreate = !currentData;
    const mode = isCreate ? 'create' : 'update';
    
    if (isCreate && (!finalData.id || finalData.id === '')) {
      finalData.id = `AT${Date.now()}`;
    }
    
    try {
      await apiService.save(finalData, mode, 'hs_an_toan_lao_dong');
      onSaved(finalData, isCreate);
      onClose();
      // 🟢 Thêm thông báo thành công
      if (isCreate) {
        toast.success("Thêm mới hồ sơ An toàn lao động thành công!");
      } else {
        toast.success("Cập nhật hồ sơ An toàn lao động thành công!");
      }

    } catch (err: any) { 
      setError(err.message || 'Lỗi lưu dữ liệu ATVSLĐ.'); 
      // 🔴 Thêm thông báo lỗi
      toast.error(err.message || "Đã xảy ra lỗi khi lưu hồ sơ ATVSLĐ!");
      
    } finally { 
      setSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between p-5 border-b border-emerald-100 bg-emerald-50 rounded-t-2xl shrink-0">
          <h3 className="text-xl font-bold text-emerald-800 flex items-center gap-2"><HardHat size={24}/> {formData.id && currentData ? 'Cập nhật Hồ sơ ATVSLĐ' : 'Tạo Hồ sơ ATVSLĐ'}</h3>
          <button onClick={onClose} disabled={submitting} className="text-emerald-400 hover:text-red-500 rounded-full p-1.5 bg-white shadow-sm transition-colors"><X className="w-6 h-6" /></button>
        </div>
        
        {error && <div className="mx-5 mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>}
        
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CỘT 1 */}
            <div className="space-y-6">
              <div className="bg-blue-50/40 p-5 rounded-xl border border-blue-100 shadow-sm">
                <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 border-b border-blue-200 pb-2"><Users size={18}/> 1. Tổ chức & Nhân sự</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="block text-xs font-bold text-gray-700 mb-1">Người phụ trách ATVSLĐ</label><input type="text" name="nguoi_phu_trach" value={formData.nguoi_phu_trach || ''} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" placeholder="Họ và tên..." /></div>
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Mạng lưới ATVS Viên (Người)</label><input type="number" name="so_luong_mang_luoi" value={formData.so_luong_mang_luoi || ''} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Tỷ lệ Cấp phát BHLĐ</label><select name="ty_le_cap_bhld" value={formData.ty_le_cap_bhld || 'Đầy đủ'} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500"><option value="Đầy đủ">Đầy đủ</option><option value="Đang thiếu">Đang thiếu / Chờ cấp</option></select></div>
                  <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Link Quyết định / Quy trình / Kế hoạch năm</label><input type="url" name="link_ho_so_quy_dinh" value={formData.link_ho_so_quy_dinh || ''} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-blue-500 text-blue-600" placeholder="https://drive.google.com/..." /></div>
                </div>
              </div>
              <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-100 shadow-sm">
                <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2 border-b border-emerald-200 pb-2"><Shield size={18}/> 2. Sức khỏe & Huấn luyện</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Ngày Huấn luyện gần nhất</label><input type="date" name="ngay_huan_luyen_gan_nhat" value={formData.ngay_huan_luyen_gan_nhat ? formData.ngay_huan_luyen_gan_nhat.split('T')[0] : ''} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                  <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Tỷ lệ hoàn thành HL (%)</label><input type="text" name="ty_le_hoan_thanh_hl" value={formData.ty_le_hoan_thanh_hl || ''} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-emerald-500" placeholder="VD: 100%" /></div>
                  <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Ngày Khám SK Định kỳ</label><input type="date" name="ngay_ksk" value={formData.ngay_ksk ? formData.ngay_ksk.split('T')[0] : ''} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700" /></div>
                  <div><label className="block text-[10px] font-bold text-orange-600 mb-1 uppercase">Ngày Khám Bệnh Nghề nghiệp</label><input type="date" name="nngay_kham_bnn" value={formData.nngay_kham_bnn ? formData.nngay_kham_bnn.split('T')[0] : ''} onChange={handleChange} className="w-full p-2.5 border border-orange-200 rounded-lg bg-orange-50 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-700" title="Dành cho LĐ Nặng nhọc/Độc hại" /></div>
                </div>
              </div>
            </div>

            {/* CỘT 2 */}
            <div className="space-y-6">
              <div className="bg-orange-50/40 p-5 rounded-xl border border-orange-100 shadow-sm">
                <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2 border-b border-orange-200 pb-2"><Settings size={18}/> 3. Máy móc & Môi trường</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-gray-700 mb-1">Tổng Thiết bị Nghiêm ngặt</label><input type="number" name="so_luong_thiet_bi_nghiem_ngat" value={formData.so_luong_thiet_bi_nghiem_ngat || ''} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500" placeholder="Thang nâng, máy nén..." /></div>
                  <div><label className="block text-xs font-bold text-red-600 mb-1">Thiết bị Quá hạn Kiểm định</label><input type="number" name="so_luong_thiet_bi_qua_han_kt" value={formData.so_luong_thiet_bi_qua_han_kt || '0'} onChange={handleChange} className="w-full p-2.5 border border-red-300 rounded-lg bg-red-50 outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-700" /></div>
                  <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Ngày Đo kiểm Môi trường LĐ gần nhất</label><input type="date" name="ngay_quan_trac_mt" value={formData.ngay_quan_trac_mt ? formData.ngay_quan_trac_mt.split('T')[0] : ''} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-700" /></div>
                </div>
              </div>

              <div className="bg-red-50/40 p-5 rounded-xl border border-red-200 shadow-sm">
                <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2 border-b border-red-200 pb-2"><AlertCircle size={18}/> 4. Hiện trường & Sự cố</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Ngày Tự KT / Checklist</label><input type="date" name="ngay_tu_kiem_tra" value={formData.ngay_tu_kiem_tra ? formData.ngay_tu_kiem_tra.split('T')[0] : ''} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500" /></div>
                    <div><label className="block text-[10px] font-bold text-red-600 mb-1 uppercase">Số vụ Tai nạn LĐ (Năm)</label><input type="number" name="so_tai_nan_trong_nam" value={formData.so_tai_nan_trong_nam || '0'} onChange={handleChange} className="w-full p-2.5 border border-red-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-700" /></div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-red-700 mb-1">Các rủi ro / Lỗi hiện trường cần khắc phục</label>
                    <textarea name="cac_loi_hien_truong" value={formData.cac_loi_hien_truong || ''} onChange={handleChange} rows={2} className="w-full p-2.5 border border-red-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 resize-none font-medium text-red-800" placeholder="VD: Sàn xưởng trơn trượt, chưa đeo dây đai an toàn..."></textarea>
                  </div>
                  <div><label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Link Biên bản tuần tra (Checklist PDF)</label><input type="url" name="link_bien_ban_kiem_tra" value={formData.link_bien_ban_kiem_tra || ''} onChange={handleChange} className="w-full p-2.5 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-red-500 text-blue-600" /></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-gray-100 flex justify-end gap-3 mt-8 shrink-0">
            <button type="button" onClick={onClose} className="px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition-colors">Hủy</button>
            <button type="submit" disabled={submitting} className="px-8 py-3 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-colors">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Lưu ATVSLĐ</button>
          </div>
        </form>
      </div>
    </div>
  );
}