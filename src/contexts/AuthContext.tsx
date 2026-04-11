import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { User } from '../types';

interface AppUser {
  id: string;
  user_name: string;
  ho_ten: string;
  id_don_vi: string;
  quyen: 'ADMIN' | 'USER';
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
      
      // Đồng bộ thông tin user xuống apiService để tự động ghi log
      apiService.setCurrentUser({
        id: parsedUser.id,
        user_name: parsedUser.user_name,
        ho_ten: parsedUser.ho_ten,
        id_don_vi: parsedUser.id_don_vi,
        quyen: parsedUser.quyen
      } as User);
    }
  }, []);

  const login = async (username: string, pass: string) => {
    try {
      // Gọi API login từ apiService
      const responseData = await apiService.login(username, pass);
      
      // 1. CHỐNG LỖI NGẦM: Bắt mọi kiểu dữ liệu trả về
      if (!responseData) throw new Error("Không nhận được dữ liệu từ máy chủ.");
      
      let userData: any = null;
      if (responseData.data) {
        userData = responseData.data; // Trường hợp API tự bọc {success: true, data: {...}}
      } else if (Array.isArray(responseData)) {
        userData = responseData[0];   // Trường hợp API trả về mảng
      } else {
        userData = responseData;      // Trường hợp Supabase .single() trả thẳng object
      }

      if (!userData) throw new Error("Dữ liệu tài khoản bị trống.");

      // 2. PHÂN LỌC QUYỀN TRUY CẬP (Bắt mọi tên cột cũ/mới)
      const rawRole = String(userData.quyen || userData.NhomQuyen || userData.role || '').toUpperCase().trim();
      const role: 'ADMIN' | 'USER' = rawRole === 'ADMIN' ? 'ADMIN' : 'USER';

      // 3. 🔴 CHÌA KHÓA FIX LỖI: QUYẾT ĐỊNH ID_DON_VI DỰA VÀO QUYỀN
      // Nếu là ADMIN -> Bắt buộc là 'ALL' để xem toàn hệ thống
      // Nếu là USER -> Lấy ID Đơn vị từ Database, nếu không có thì gán 'UNKNOWN'
      let finalIdDonVi = '';
      if (role === 'ADMIN') {
        finalIdDonVi = 'ALL';
      } else {
        finalIdDonVi = String(userData.id_don_vi || userData.ID_DonVi || userData.idDonVi || 'UNKNOWN').trim();
      }

      // 4. CHUẨN HÓA THÔNG TIN NGƯỜI DÙNG THEO ĐÚNG INTERFACE AppUser
      const mappedUser: AppUser = {
        id: String(userData.id || userData.ID_User || 'Unknown'),
        user_name: String(userData.user_name || userData.Username || userData.username || username),
        ho_ten: String(userData.ho_ten || userData.HoTen || userData.hoTen || 'Người dùng'),
        id_don_vi: finalIdDonVi,
        quyen: role
      };

      // 5. Lưu User vào state và LocalStorage
      setUser(mappedUser);
      localStorage.setItem('authUser', JSON.stringify(mappedUser));
      
      apiService.setCurrentUser(mappedUser as unknown as User);
      apiService.writeLog('ĐĂNG NHẬP', 'Truy cập hệ thống');

      // =========================================================
      // KHỐI TẢI NGẦM (PREFETCH)
      // Lén hút dữ liệu về RAM để các trang load siêu mượt
      // =========================================================
      setTimeout(() => {
        apiService.getDonVi().catch(()=>{});
        apiService.getPersonnel().catch(()=>{});
        apiService.getAnNinh().catch(()=>{});
        apiService.getPhapNhan().catch(()=>{});
        if (apiService.getPhongHop) apiService.getPhongHop().catch(()=>{});
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