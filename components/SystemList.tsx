
import React, { useState } from 'react';
import { User, Log, Role } from '../types';
import { Search, Shield, Clock, Plus, Edit2, KeyRound, Trash2 } from 'lucide-react';

interface SystemListProps {
  users: User[];
  logs: Log[];
  currentUser: User | null;
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onChangePassword: (user: User) => void;
  checkPermission: (targetUnitCode: string) => boolean;
}

const UserTableRow: React.FC<{ 
  user: User; 
  currentUser: User | null;
  onEdit: (user: User) => void; 
  onChangePass: (user: User) => void;
  onDelete: (user: User) => void;
  canEdit: boolean;
}> = ({ user, currentUser, onEdit, onChangePass, onDelete, canEdit }) => (
  <tr className="hidden md:table-row hover:bg-gray-50 transition-colors">
    <td className="p-4">
      <p className="font-bold text-gray-900 text-sm">{user.hoTen}</p>
      <p className="text-xs text-gray-400">{user.email}</p>
    </td>
    <td className="p-4 text-center">
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase">{user.vaiTro}</span>
    </td>
    <td className="p-4 text-sm font-bold text-gray-700">{user.maDonVi}</td>
    <td className="p-4 text-sm font-medium text-gray-500">{user.phanQuyen}</td>
    <td className="p-4 text-right">
      <div className="flex justify-end gap-2">
        {canEdit && (
          <>
            <button onClick={() => onChangePass(user)} className="p-2 text-gray-400 hover:text-yellow-600 transition-colors" title="Đổi mật khẩu">
              <KeyRound className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit(user)} className="p-2 text-gray-400 hover:text-primary transition-colors" title="Sửa thông tin">
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản ${user.email}?`)) {
                  onDelete(user);
                }
              }} 
              className="p-2 text-gray-400 hover:text-red-600 transition-colors" 
              title="Xóa tài khoản"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </td>
  </tr>
);

const UserCard: React.FC<{ 
  user: User; 
  currentUser: User | null;
  onEdit: (user: User) => void; 
  onChangePass: (user: User) => void;
  onDelete: (user: User) => void;
  canEdit: boolean;
}> = ({ user, currentUser, onEdit, onChangePass, onDelete, canEdit }) => (
  <div className="md:hidden p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
    <div className="flex justify-between items-start mb-2">
      <div className="min-w-0">
        <p className="font-bold text-gray-900 text-sm truncate">{user.hoTen}</p>
        <p className="text-xs text-gray-400 truncate">{user.email}</p>
      </div>
      <div className="flex gap-1">
        {canEdit && (
          <>
            <button onClick={() => onChangePass(user)} className="p-2 text-gray-400 hover:text-yellow-600 transition-colors" title="Đổi mật khẩu">
              <KeyRound className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit(user)} className="p-2 text-gray-400 hover:text-primary transition-colors shrink-0" title="Sửa thông tin">
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản ${user.email}?`)) {
                  onDelete(user);
                }
              }} 
              className="p-2 text-gray-400 hover:text-red-600 transition-colors shrink-0" 
              title="Xóa tài khoản"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
    <div className="flex flex-wrap gap-2 items-center">
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase">{user.vaiTro}</span>
      <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{user.maDonVi}</span>
      <span className="text-xs font-medium text-gray-500">Quyền: {user.phanQuyen}</span>
    </div>
  </div>
);

const LogTableRow: React.FC<{ log: Log }> = ({ log }) => (
  <tr className="hidden md:table-row hover:bg-gray-50 transition-colors">
    <td className="p-4 text-xs text-gray-500 font-mono whitespace-nowrap">{log.thoiGian}</td>
    <td className="p-4 text-sm font-bold text-gray-900">{log.email}</td>
    <td className="p-4">
       <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
         log.hanhDong === 'Đăng nhập' ? 'bg-green-50 text-green-700 border-green-200' :
         log.hanhDong === 'Cập nhật' ? 'bg-blue-50 text-blue-700 border-blue-200' :
         log.hanhDong === 'Thêm mới' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
         log.hanhDong === 'Xóa' ? 'bg-red-50 text-red-700 border-red-200' :
         'bg-gray-50 text-gray-700 border-gray-200'
       }`}>
         {log.hanhDong}
       </span>
    </td>
    <td className="p-4 text-sm text-gray-700 italic">"{log.noiDung}"</td>
  </tr>
);

const LogCard: React.FC<{ log: Log }> = ({ log }) => (
  <div className="md:hidden p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
    <div className="flex justify-between items-start mb-2">
      <p className="text-[10px] text-gray-500 font-mono">{log.thoiGian}</p>
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
         log.hanhDong === 'Đăng nhập' ? 'bg-green-50 text-green-700 border-green-200' :
         log.hanhDong === 'Cập nhật' ? 'bg-blue-50 text-blue-700 border-blue-200' :
         log.hanhDong === 'Thêm mới' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
         log.hanhDong === 'Xóa' ? 'bg-red-50 text-red-700 border-red-200' :
         'bg-gray-50 text-gray-700 border-gray-200'
       }`}>
         {log.hanhDong}
       </span>
    </div>
    <p className="text-sm font-bold text-gray-900 mb-1">{log.email}</p>
    <p className="text-xs text-gray-700 italic">"{log.noiDung}"</p>
  </div>
);

const SystemList: React.FC<SystemListProps> = ({ users, logs, currentUser, onAddUser, onEditUser, onDeleteUser, onChangePassword, checkPermission }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');

  const canManageUser = (targetUser: User) => {
    if (!currentUser) return false;
    
    // Normalize role check (case insensitive)
    const userRole = String(currentUser.vaiTro || '').toLowerCase();
    if (userRole === 'admin' || userRole === 'quản trị') return true;

    // Tự sửa mình
    if (currentUser.email.toLowerCase().trim() === targetUser.email.toLowerCase().trim()) return true;

    // Cty sửa đơn vị trực thuộc
    if (userRole === 'cty') {
      return checkPermission(targetUser.maDonVi);
    }
    return false;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <h2 className="text-lg font-bold text-gray-800">Cấu hình Hệ thống</h2>
          <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'users' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              NGƯỜI DÙNG
            </button>
            <button 
               onClick={() => setActiveTab('logs')}
               className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'logs' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              NHẬT KÝ (LOGS)
            </button>
          </div>
        </div>

        {activeTab === 'users' && (
          <button onClick={onAddUser} className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-md transition-all w-full sm:w-auto">
            <Plus className="w-4 h-4" /> THÊM TÀI KHOẢN
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-0">
        {activeTab === 'users' ? (
          <div className="w-full">
            <table className="w-full text-left hidden md:table">
              <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold sticky top-0 z-10">
                <tr>
                  <th className="p-4 border-b">Họ tên & Email</th>
                  <th className="p-4 border-b text-center">Vai trò</th>
                  <th className="p-4 border-b">Đơn vị</th>
                  <th className="p-4 border-b">Phân quyền</th>
                  <th className="p-4 border-b text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u, index) => (
                  <UserTableRow 
                    key={u.id || `${u.email}-${index}`} 
                    user={u} 
                    currentUser={currentUser}
                    onEdit={onEditUser} 
                    onChangePass={onChangePassword}
                    onDelete={onDeleteUser}
                    canEdit={canManageUser(u)}
                  />
                ))}
              </tbody>
            </table>
            <div className="md:hidden divide-y divide-gray-100">
              {users.map((u, index) => (
                <UserCard 
                  key={u.id || `${u.email}-${index}`} 
                  user={u} 
                  currentUser={currentUser}
                  onEdit={onEditUser} 
                  onChangePass={onChangePassword}
                  onDelete={onDeleteUser}
                  canEdit={canManageUser(u)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-left hidden md:table">
               <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold sticky top-0 z-10">
                <tr>
                  <th className="p-4 border-b">Thời gian</th>
                  <th className="p-4 border-b">Người dùng</th>
                  <th className="p-4 border-b">Hành động</th>
                  <th className="p-4 border-b">Nội dung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((l) => (
                  <LogTableRow key={l.id} log={l} />
                ))}
              </tbody>
            </table>
            <div className="md:hidden divide-y divide-gray-100">
              {logs.map((l) => (
                <LogCard key={l.id} log={l} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemList;
