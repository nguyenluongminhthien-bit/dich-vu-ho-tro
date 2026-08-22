import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { User } from '../types';

interface AppUser {
  id: string;
  user_name: string;
  ho_ten: string;
  id_don_vi: string;
  quyen: string; 
  quyen_truy_cap?: string; 
  quyen_chi_tiet?: string;
  password?: string; // Mật khẩu dùng để đối chiếu đổi mật khẩu ngầm
}

interface AuthContextType {
  user: AppUser | null;
  login: (username: string, pass: string, remember?: boolean) => Promise<void>;
  logout: () => void;
  checkPermission: (moduleId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Hằng số phiên bản ứng dụng và thời hạn phiên
const APP_VERSION = '1.1.0';
const SESSION_EXPIRY_MS = 2 * 24 * 60 * 60 * 1000; // 2 ngày (48 giờ)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    // 🟢 TỰ ĐỘNG DỌN DẸP NHẬT KÝ HỆ THỐNG CŨ (> 5 ngày) CHẠY NGẦM
    apiService.cleanOldLogs?.(5).catch(err => {
      console.warn("Lỗi tự động dọn dẹp log:", err);
    });

    // 🟢 1. KIỂM TRA PHIÊN BẢN ỨNG DỤNG (APP VERSIONING)
    const currentVersion = localStorage.getItem('appVersion');
    if (currentVersion !== APP_VERSION) {
      // Xóa thông tin đăng nhập và cache cũ khi có cập nhật lớn để tránh xung đột
      localStorage.removeItem('authUser');
      localStorage.removeItem('sessionExpiry');
      sessionStorage.removeItem('authUser');
      
      // Xóa các dữ liệu API đệm (cache) lưu trong localStorage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('api_cache_') || key.startsWith('offline_records_'))) {
          localStorage.removeItem(key);
        }
      }
      localStorage.setItem('appVersion', APP_VERSION);
    }

    const storedUser = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      
      // 🟢 2. KIỂM TRA THỜI HẠN PHIÊN (SESSION EXPIRATION - 2 NGÀY)
      if (localStorage.getItem('authUser')) {
        const expiry = localStorage.getItem('sessionExpiry');
        if (expiry && Date.now() > Number(expiry)) {
          // Phiên đăng nhập đã quá hạn 2 ngày -> tự động logout
          localStorage.removeItem('authUser');
          localStorage.removeItem('sessionExpiry');
          window.location.reload();
          return;
        }
      }

      // Đăng nhập nhanh bằng dữ liệu cache (tránh giật lag giao diện)
      setUser(parsedUser);
      apiService.setCurrentUser(parsedUser as unknown as User);

      // 🟢 3. ĐỒNG BỘ NGẦM QUYỀN HẠN & MẬT KHẨU TỪ DATABASE (DATABASE SYNC)
      apiService.validateAndRefreshUser(parsedUser.id).then((freshUser) => {
        if (freshUser) {
          // A. Kiểm tra xem mật khẩu có bị đổi không
          if (parsedUser.password && freshUser.password !== parsedUser.password) {
            logout();
            alert("Tài khoản của bạn đã bị đổi mật khẩu hoặc khóa bởi quản trị viên. Vui lòng đăng nhập lại!");
            return;
          }

          // B. Tính toán đơn vị mặc định
          let finalIdDonVi = '';
          if (String(freshUser.quyen || '').toUpperCase() === 'ADMIN') {
            finalIdDonVi = 'ALL';
          } else {
            finalIdDonVi = freshUser.id_don_vi ? String(freshUser.id_don_vi).trim() : 'HO';
          }

          // C. So sánh dữ liệu mới và cũ
          const hasChanges = 
            freshUser.ho_ten !== parsedUser.ho_ten ||
            finalIdDonVi !== parsedUser.id_don_vi ||
            freshUser.quyen !== parsedUser.quyen ||
            (freshUser.quyen_truy_cap || '') !== (parsedUser.quyen_truy_cap || '') ||
            (freshUser.quyen_chi_tiet || '') !== (parsedUser.quyen_chi_tiet || '');

          if (hasChanges) {
            const updatedUser: AppUser = {
              id: parsedUser.id,
              user_name: parsedUser.user_name,
              ho_ten: String(freshUser.ho_ten || 'Người dùng'),
              id_don_vi: finalIdDonVi,
              quyen: String(freshUser.quyen || 'USER'),
              quyen_truy_cap: String(freshUser.quyen_truy_cap || ''),
              quyen_chi_tiet: String(freshUser.quyen_chi_tiet || ''),
              password: String(freshUser.password || '')
            };

            setUser(updatedUser);
            if (localStorage.getItem('authUser')) {
              localStorage.setItem('authUser', JSON.stringify(updatedUser));
              // Gia hạn thời điểm hết hạn từ lúc đồng bộ thành công
              localStorage.setItem('sessionExpiry', String(Date.now() + SESSION_EXPIRY_MS));
            } else {
              sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
            }
            apiService.setCurrentUser(updatedUser as unknown as User);
            console.log("Đã đồng bộ ngầm thông tin phân quyền mới thành công.");
          }
        } else {
          // Tài khoản không tồn tại trong DB (bị xóa) -> tự động logout
          logout();
          alert("Tài khoản của bạn không còn tồn tại trên hệ thống!");
        }
      }).catch((err) => {
        console.warn("⚠️ Không thể đồng bộ ngầm thông tin phân quyền (Đang chạy offline):", err);
      });
    }
  }, []);

  const login = async (username: string, pass: string, remember: boolean = false) => {
    try {
      const responseData = await apiService.login(username, pass);
      
      if (!responseData) throw new Error("Không nhận được dữ liệu từ máy chủ.");
      
      let userData: any = null;
      if (responseData.data) {
        userData = responseData.data; 
      } else if (Array.isArray(responseData)) {
        userData = responseData[0];   
      } else {
        userData = responseData;      
      }

      if (!userData) throw new Error("Dữ liệu tài khoản bị trống.");

      // 🟢 1. PHÂN LỌC QUYỀN TRUY CẬP (NHẬN TRỰC TIẾP TỪ DATABASE)
      const rawRole = String(userData.quyen || userData.NhomQuyen || userData.role || 'USER').trim();

      // 🟢 2. QUYẾT ĐỊNH ID_DON_VI (Chỉ duy nhất ADMIN mới được ép thành 'ALL')
      let finalIdDonVi = '';
      if (rawRole.toUpperCase() === 'ADMIN') {
        finalIdDonVi = 'ALL';
      } else {
        const rawId = userData.id_don_vi || userData.ID_DonVi || userData.idDonVi;
        finalIdDonVi = rawId ? String(rawId).trim() : 'HO';
      }

      // 🟢 3. CHUẨN HÓA THÔNG TIN NGƯỜI DÙNG (Bao gồm cả Cột Truy Cập)
      const mappedUser: AppUser = {
        id: String(userData.id || userData.ID || userData.ID_User || 'Unknown'),
        user_name: String(userData.user_name || userData.Username || userData.username || username),
        ho_ten: String(userData.ho_ten || userData.HoTen || userData.hoTen || 'Người dùng'),
        id_don_vi: finalIdDonVi,
        quyen: rawRole, // Lấy chuẩn chữ viewer_hanche
        quyen_truy_cap: String(userData.quyen_truy_cap || ''),
        quyen_chi_tiet: String(userData.quyen_chi_tiet || ''),
        password: String(userData.password || '') // Lưu password để đối chiếu đổi mật khẩu ngầm
      };

      // Lưu User vào state và LocalStorage/SessionStorage tùy chọn
      setUser(mappedUser);
      if (remember) {
        localStorage.setItem('authUser', JSON.stringify(mappedUser));
        localStorage.setItem('sessionExpiry', String(Date.now() + SESSION_EXPIRY_MS)); // Lưu mốc hết hạn 2 ngày
        sessionStorage.removeItem('authUser');
      } else {
        sessionStorage.setItem('authUser', JSON.stringify(mappedUser));
        localStorage.removeItem('authUser');
        localStorage.removeItem('sessionExpiry');
      }
      
      apiService.setCurrentUser(mappedUser as unknown as User);
      apiService.writeLog('ĐĂNG NHẬP', 'Truy cập hệ thống');

      // Chỉ preload danh mục đơn vị cơ bản ngầm (nhẹ) nếu cần, tránh tải ồ ạt toàn bộ bảng nhân sự, an ninh, pháp nhân
      setTimeout(() => {
        apiService.getDonVi().catch(() => {});
      }, 300);

    } catch (error) {
      console.error("Login Error:", error);
      throw error; 
    }
  };

  const logout = () => {
    apiService.writeLog('ĐĂNG XUẤT', 'Thoát hệ thống');
    setTimeout(() => {
      setUser(null);
      localStorage.removeItem('authUser');
      localStorage.removeItem('sessionExpiry'); // Xóa thời hạn hết hạn
      sessionStorage.removeItem('authUser');
      apiService.setCurrentUser(null);
      window.location.reload();
    }, 500);
  };

  const checkPermission = (moduleId: string) => {
    if (!user) return false;
    const quyenUpper = String(user.quyen || '').toUpperCase();
    const quyenTruyCap = String(user.quyen_truy_cap || '').trim();

    // 1. ADMIN hoặc ALL thì luôn có toàn quyền
    if (quyenUpper === 'ADMIN' || quyenTruyCap.includes('ALL')) {
      return true;
    }

    // 2. Nếu quyen_truy_cap rỗng (tài khoản mặc định chưa bị giới hạn riêng) -> cho phép truy cập module
    if (!quyenTruyCap && String(user.quyen).toLowerCase() !== 'viewer_hanche') {
      return true;
    }

    // 3. Tương thích ngược: Nếu tài khoản có trọn bộ 9 module cũ trước khi có BaoCao -> tự động mở BaoCao
    const legacyModules = ['TongQuan', 'CongTy', 'NhanSu', 'PCCC', 'ATVSLD', 'Xe', 'ThietBi', 'VanBan', 'QuyDinh'];
    const isLegacyFullAccess = legacyModules.every(m => quyenTruyCap.includes(m));
    if (moduleId === 'BaoCao' && isLegacyFullAccess) {
      return true;
    }

    return quyenTruyCap.includes(moduleId);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, checkPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};