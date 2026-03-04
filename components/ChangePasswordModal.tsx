import React, { useState } from 'react';
import { X, Save, KeyRound } from 'lucide-react';
import { User } from '../types';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPassword: string) => void;
  targetUser: User | null;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onSave, targetUser }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !targetUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (password.length < 3) {
      setError('Mật khẩu phải có ít nhất 3 ký tự');
      return;
    }
    onSave(password);
    setPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Đổi mật khẩu
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
            <p className="text-xs text-gray-500 mb-1">Đổi mật khẩu cho tài khoản:</p>
            <p className="font-bold text-gray-800">{targetUser.hoTen}</p>
            <p className="text-xs text-gray-500">{targetUser.email}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Mật khẩu mới</label>
            <input 
              type="password" 
              required
              className="w-full text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary p-2 border"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Xác nhận mật khẩu</label>
            <input 
              type="password" 
              required
              className="w-full text-sm border-gray-300 rounded-md focus:ring-primary focus:border-primary p-2 border"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md">Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
