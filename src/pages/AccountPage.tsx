import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, X, AlertCircle, Loader2, Save, UserCog, Shield, Key, Building2, Mail } from 'lucide-react';
import { apiService } from '../services/api';
import { User, DonVi } from '../types';
import { buildHierarchicalOptions, getUnitEmoji } from '../utils/hierarchy'; // IMPORT TÍNH NĂNG VẼ CÂY

export default function AccountPage() {
  const [data, setData] = useState<User[]>([]);
  const [donViList, setDonViList] = useState<DonVi[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'update'>('create');
  const [formData, setFormData] = useState<Partial<User>>({});

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true); setError(null);
      try {
        const [rawUsers, donvis] = await Promise.all([apiService.getUsers(), apiService.getDonVi()]);
        
        // 🚀 BỘ QUÉT DỮ LIỆU THÔNG MINH (CHỐNG MỌI LỖI TỪ GOOGLE SHEETS)
        const cleanUsers = rawUsers.map((item: any, index: number) => {
          if (!item) return null;
          
          // Trường hợp Google trả về mảng đơn thuần
          if (Array.isArray(item)) {
            return {
              ID_User: String(item[0] || '').trim(),
              Username: String(item[1] || '').trim(),
              Password: String(item[2] || '').trim(),
              HoTen: String(item[3] || '').trim(),
              ID_DonVi: String(item[4] || '').trim(),
              NhomQuyen: String(item[5] || 'USER').trim()
            };
          }
          
          // Trường hợp Google trả về Object (Dò tìm thông minh bỏ qua hoa/thường/khoảng trắng)
          const getValue = (keys: string[]) => {
            for (let k of Object.keys(item)) {
              const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (keys.includes(cleanK)) return item[k];
            }
            return '';
          };

          return {
            ID_User: String(item.ID_User || getValue(['iduser', 'manguoidung']) || `U_${index}`).trim(),
            Username: String(item.Username || getValue(['username', 'tendangnhap', 'email']) || '').trim(),
            Password: String(item.Password || getValue(['password', 'matkhau']) || '').trim(),
            HoTen: String(item.HoTen || getValue(['hoten', 'ten']) || '').trim(),
            ID_DonVi: String(item.ID_DonVi || getValue(['iddonvi', 'donvi', 'macongty']) || '').trim(),
            NhomQuyen: String(item.NhomQuyen || getValue(['nhomquyen', 'quyen', 'role']) || 'USER').trim()
          };
        }).filter((u: any) => u !== null && !u.ID_User.toLowerCase().includes('id_user') && !u.Username.toLowerCase().includes('username'));

        setData(cleanUsers); 
        setDonViList(donvis);
      } catch (err: any) { 
        setError(err.message || 'Lỗi tải dữ liệu tài khoản.'); 
      } finally { 
        setLoading(false); 
      }
    };
    loadData();
  }, []);

  const donViMap = useMemo(() => {
    const map: Record<string, string> = {};
    donViList.forEach(dv => { map[dv.ID_DonVi] = dv.TenDonVi; });
    return map;
  }, [donViList]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter(item => 
      item.Username?.toLowerCase().includes(lower) || 
      item.HoTen?.toLowerCase().includes(lower) ||
      item.ID_User?.toLowerCase().includes(lower)
    );
  }, [data, searchTerm]);

  const openModal = (mode: 'create' | 'update', item?: User) => {
    setModalMode(mode);
    setFormData(item ? { ...item } : { ID_User: '', Username: '', Password: '', HoTen: '', ID_DonVi: '', NhomQuyen: 'USER' });
    setIsModalOpen(true); setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    try {
      const response = await apiService.save(formData, modalMode, "Config_Users");
      if (modalMode === 'create') {
        formData.ID_User = response.newId || formData.ID_User; 
        setData(prev => [...prev, formData as User]);
      } else {
        setData(prev => prev.map(item => item.ID_User === formData.ID_User ? formData as User : item));
      }
      setIsModalOpen(false);
    } catch (err: any) { setError(err.message || 'Lỗi lưu tài khoản.'); } 
    finally { setSubmitting(false); }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return; setSubmitting(true); setError(null);
    try {
      await apiService.delete(itemToDelete, "Config_Users");
      setData(prev => prev.filter(item => item.ID_User !== itemToDelete));
      setIsConfirmOpen(false); setItemToDelete(null);
    } catch (err: any) { setError(err.message || 'Lỗi xóa tài khoản.'); } 
    finally { setSubmitting(false); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-[#05469B] flex items-center gap-2"><UserCog size={28} /> Quản lý Tài khoản</h2>
          <p className="text-sm font-medium text-gray-500 mt-1">Cấp quyền truy cập và bảo mật hệ thống</p>
        </div>
        <div className="flex gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Tìm tài khoản, họ tên..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#05469B] outline-none shadow-sm text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => openModal('create')} className="flex items-center gap-2 bg-[#05469B] hover:bg-[#04367a] text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-all"><Plus size={20} /> Cấp tài khoản</button>
        </div>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-100"><AlertCircle size={20}/> {error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-[#f8fafc] border-b border-gray-200 sticky top-0 z-10">
              <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="p-4 w-24">Mã User</th><th className="p-4">Thông tin User</th><th className="p-4">Đơn vị quản lý</th><th className="p-4 w-32">Phân quyền</th><th className="p-4 text-center w-32">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (<tr><td colSpan={5} className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#05469B] mb-2"/> Đang tải...</td></tr>) 
              : filteredData.length === 0 ? (<tr><td colSpan={5} className="p-12 text-center text-gray-400"><UserCog size={40} className="mx-auto mb-3 opacity-50"/> Không có dữ liệu tài khoản.</td></tr>) 
              : filteredData.map(user => (
                <tr key={user.ID_User} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="p-4 font-bold text-gray-700">{user.ID_User}</td>
                  <td className="p-4">
                    <p className="font-bold text-[#05469B] text-base">{user.HoTen}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{user.Username}</p>
                  </td>
                  <td className="p-4 font-semibold text-gray-700">{donViMap[user.ID_DonVi] || (!user.ID_DonVi || user.ID_DonVi === 'ALL' ? <span className="text-indigo-600 font-bold px-2 py-1 bg-indigo-50 rounded">TẤT CẢ ĐƠN VỊ (HO)</span> : user.ID_DonVi)}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-black border tracking-wider ${user.NhomQuyen.toUpperCase() === 'ADMIN' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                      {user.NhomQuyen.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal('update', user)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"><Edit size={16}/></button>
                      <button onClick={() => {setItemToDelete(user.ID_User); setIsConfirmOpen(true)}} className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-in zoom-in duration-200 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b bg-[#05469B] text-white">
              <h3 className="text-xl font-bold flex items-center gap-2"><UserCog size={24}/> {modalMode === 'create' ? 'Cấp tài khoản mới' : 'Cập nhật tài khoản'}</h3>
              <button onClick={() => setIsModalOpen(false)} disabled={submitting} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Mã User *</label><input type="text" required name="ID_User" value={formData.ID_User || ''} onChange={e=>setFormData({...formData, ID_User: e.target.value})} disabled={modalMode==='update'} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] disabled:bg-gray-100 outline-none focus:ring-2 focus:ring-[#05469B] disabled:opacity-70" placeholder="VD: U01"/></div>
                <div><label className="block text-xs font-bold text-gray-600 mb-1">Họ và Tên *</label><input type="text" required name="HoTen" value={formData.HoTen || ''} onChange={e=>setFormData({...formData, HoTen: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]"/></div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Tên đăng nhập (Email) *</label>
                  <div className="relative"><Mail className="absolute left-3 top-3 text-gray-400" size={18}/><input type="text" required name="Username" value={formData.Username || ''} onChange={e=>setFormData({...formData, Username: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] font-medium"/></div>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Mật khẩu *</label>
                  <div className="relative"><Key className="absolute left-3 top-3 text-gray-400" size={18}/><input type="text" required name="Password" value={formData.Password || ''} onChange={e=>setFormData({...formData, Password: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] font-mono tracking-widest text-indigo-700 font-bold"/></div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Nhóm Quyền *</label>
                  <div className="relative"><Shield className="absolute left-3 top-3 text-gray-400" size={18}/><select required name="NhomQuyen" value={formData.NhomQuyen || 'USER'} onChange={e=>setFormData({...formData, NhomQuyen: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B] font-bold"><option value="USER">USER (Nhân viên)</option><option value="ADMIN">ADMIN (Quản trị)</option></select></div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Đơn vị quản lý</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 text-gray-400" size={18}/>
                    <select 
                      name="ID_DonVi" 
                      value={formData.ID_DonVi || ''} 
                      onChange={e=>setFormData({...formData, ID_DonVi: e.target.value})} 
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-[#FFFFF0] outline-none focus:ring-2 focus:ring-[#05469B]"
                      style={{ fontFamily: 'monospace, sans-serif' }}
                    >
                      <option value="">-- Quản trị Toàn quốc (HO) --</option>
                      {buildHierarchicalOptions(donViList).map(({ unit, prefix }) => (
                        <option key={unit.ID_DonVi} value={unit.ID_DonVi} className="font-normal text-gray-700">
                          {prefix}{getUnitEmoji(unit.loaiHinh)} {unit.TenDonVi}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-gray-100 font-bold rounded-lg hover:bg-gray-200 border border-gray-200">Hủy</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-[#05469B] text-white font-bold rounded-lg flex items-center gap-2">{submitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Lưu Tài Khoản</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl text-center shadow-xl max-w-sm w-full animate-in zoom-in">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-100"><AlertCircle size={32}/></div>
            <h3 className="text-xl font-bold mb-2">Xóa tài khoản?</h3>
            <p className="text-gray-500 text-sm mb-6">Tài khoản này sẽ bị thu hồi quyền truy cập vĩnh viễn.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsConfirmOpen(false)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl">Hủy</button>
              <button onClick={confirmDelete} disabled={submitting} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl">{submitting ? <Loader2 className="animate-spin mx-auto"/> : 'Xóa'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
