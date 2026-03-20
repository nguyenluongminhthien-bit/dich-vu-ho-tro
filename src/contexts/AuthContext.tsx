import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { User } from '../types';

interface AppUser {
  id: string;
  username: string;
  hoTen: string;
  idDonVi: string;
  role: 'ADMIN' | 'USER';
}

interface AuthContextType {
  user: AppUser | null;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      apiService.setCurrentUser({
        ID_User: parsedUser.id,
        Username: parsedUser.username,
        HoTen: parsedUser.hoTen,
        ID_DonVi: parsedUser.idDonVi,
        NhomQuyen: parsedUser.role
      } as User);
    }
  }, []);

  const login = async (username: string, pass: string) => {
    try {
      const responseData = await apiService.login(username, pass);
      
      // 1. CHỐNG LỖI NGẦM: Đảm bảo có dữ liệu
      if (!responseData) throw new Error("Không nhận được dữ liệu từ máy chủ.");
      const userData = Array.isArray(responseData) ? responseData[0] : responseData;
      if (!userData) throw new Error("Dữ liệu tài khoản bị trống.");

      // 2. PHÂN LOẠI QUYỀN
      const isConfigAdmin = userData.NhomQuyen?.toUpperCase() === 'ADMIN' || userData.role?.toUpperCase() === 'ADMIN';
      const role = isConfigAdmin ? 'ADMIN' : 'USER';

      // 3. XỬ LÝ ID_DONVI TRỐNG CHO ADMIN (Gán thành 'ALL')
      let assignedDonVi = userData.ID_DonVi || userData.idDonVi || '';
      if (!assignedDonVi && role === 'ADMIN') {
        assignedDonVi = 'ALL';
      }

      const mappedUser: AppUser = {
        id: userData.ID_User || userData.id || userData.username || userData.Username || 'Unknown',
        username: userData.Username || userData.username || username,
        hoTen: userData.HoTen || userData.hoTen || 'Người dùng',
        idDonVi: assignedDonVi,
        role: role
      };

      // 4. Lưu User vào hệ thống
      setUser(mappedUser);
      localStorage.setItem('authUser', JSON.stringify(mappedUser));
      
      apiService.setCurrentUser(userData);
      apiService.writeLog('ĐĂNG NHẬP', 'Truy cập hệ thống');

      // =========================================================
      // KHỐI TẢI NGẦM (PREFETCH) - Đã bổ sung lại
      // Lén hút dữ liệu về RAM để các trang load siêu mượt
      // =========================================================
      setTimeout(() => {
        apiService.getDonVi().catch(()=>{});
        apiService.getPersonnel().catch(()=>{});
        apiService.getAnNinh().catch(()=>{});
        apiService.getPhapNhan().catch(()=>{});
        apiService.getPhongHop().catch(()=>{});
      }, 500);

    } catch (error) {
      console.error("Login Error:", error);
      // Bắt buộc ném lỗi ra ngoài để màn hình Login tắt vòng xoay loading
      throw error; 
    }
  };

  const logout = () => {
    apiService.writeLog('ĐĂNG XUẤT', 'Thoát hệ thống');
    setTimeout(() => {
      setUser(null);
      localStorage.removeItem('authUser');
      apiService.setCurrentUser(null);
      window.location.reload();
    }, 500);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};