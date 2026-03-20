import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tổng quan</h1>
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4">Chào mừng đến với Hệ thống Quản lý Dịch vụ</h2>
        <p className="text-gray-600 mb-2">Bạn đang đăng nhập với tư cách: <span className="font-semibold text-blue-600">{user?.role}</span></p>
        <p className="text-gray-600 mb-2">Đơn vị trực thuộc: <span className="font-semibold">{user?.idDonVi === 'ALL' ? 'Tất cả đơn vị' : user?.idDonVi}</span></p>
        <p className="text-gray-600">Họ và tên: <span className="font-semibold">{user?.hoTen}</span></p>
      </div>
    </div>
  );
}
