import { Personnel, DonVi, User, SysLog } from '../types';

const API_URL = "https://script.google.com/macros/s/AKfycbyTGotz2w-j6fg9Swk6U3oQeF277BdB5u-c0-kOEV6ZES4C0fCGnuRnXhTZxzKsTwfzNQ/exec";

// 1. BỘ NHỚ ĐỆM TỐC ĐỘ CAO (Đã có từ trước)
const apiCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000;

async function fetchWithCache(sheetName: string, forceRefresh = false) {
  if (!forceRefresh && apiCache[sheetName] && (Date.now() - apiCache[sheetName].timestamp < CACHE_DURATION)) {
    return apiCache[sheetName].data;
  }
  const response = await fetch(`${API_URL}?action=read&sheetName=${sheetName}`);
  if (!response.ok) throw new Error(`Lỗi tải dữ liệu ${sheetName}`);
  const result = await response.json();
  
  if (result.status === 'error') {
    throw new Error(`Lỗi từ Google Sheets: ${result.message}`);
  }
  
  let finalData = [];
  if (result.status === 'success') finalData = result.data;
  else if (Array.isArray(result)) finalData = result;
  else finalData = result.data || [];

  apiCache[sheetName] = { data: finalData, timestamp: Date.now() };
  return finalData;
}

// 2. BIẾN TOÀN CỤC LƯU NGƯỜI DÙNG ĐỂ GHI LOG
let currentUser: User | null = null;

export const apiService = {
  // Hàm này được AuthContext gọi để nạp thông tin người dùng đang đăng nhập
  setCurrentUser: (user: User | null) => { currentUser = user; },

  // HÀM NGẦM TỰ ĐỘNG GHI NHẬT KÝ (CÓ KEEPALIVE CHỐNG LỖI KHI F5/ĐĂNG XUẤT)
  writeLog: (hanhDong: string, chiTiet: string) => {
    if (!currentUser) return;
    const logData = {
      ID_Log: `LOG_${Date.now()}`,
      ThoiGian: new Date().toLocaleString('vi-VN'), // Lưu giờ Việt Nam
      ID_User: currentUser.ID_User || currentUser.Username || 'System',
      HanhDong: hanhDong,
      ChiTiet: chiTiet
    };
    
    // Gửi ngầm lên Sheet Sys_Logs bằng no-cors và keepalive để tránh bị trình duyệt chặn
    fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors', // Bỏ qua lằn ranh bảo mật CORS trình duyệt
      keepalive: true, // QUAN TRỌNG: Sống sót qua cả lệnh reload trang
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: 'create', sheetName: 'Sys_Logs', rowData: logData })
    }).catch(e => console.log("Hệ thống đã gửi log ngầm."));
  },

  login: async (username: string, password: string): Promise<User> => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "login", username, password })
    });
    if (!response.ok) throw new Error('Lỗi mạng khi kết nối máy chủ');
    const result = await response.json();
    if (result.status === "error") throw new Error(result.message); 
    return result.data as User;
  },

  // ===============================================
  // CÁC HÀM TẢI DỮ LIỆU
  // ===============================================
  getPersonnel: async (): Promise<Personnel[]> => fetchWithCache('NS_DichVu'),
  getDonVi: async (): Promise<DonVi[]> => fetchWithCache('DM_Donvi'),
  getAnNinh: async (): Promise<any[]> => fetchWithCache('HS_AnNinh'),
  getXe: async (): Promise<any[]> => fetchWithCache('TS_Xe'),
  getChiPhiXe: async (): Promise<any[]> => fetchWithCache('CP_HoatDongXe'),
  getPhapNhan: async (): Promise<any[]> => fetchWithCache('PhapNhan'),
  getPhongHop: async (): Promise<any[]> => fetchWithCache('PhongHop'),
  getVanBan: async (): Promise<any[]> => fetchWithCache('VB_TB'),
  getQuyDinh: async (): Promise<any[]> => fetchWithCache('QD_QT'),
  getThietBi: async (): Promise<any[]> => fetchWithCache('TS_ThietBi'),
  getNhatKyThietBi: async (): Promise<any[]> => fetchWithCache('NK_ThietBi'),
  
  // 🟢 [ĐÃ THÊM MỚI: API GỌI DỮ LIỆU PHỤC VỤ HẬU CẦN]
  getPVHC: async (): Promise<any[]> => fetchWithCache('HS_PVHC'),
// 🟢 [ĐÃ THÊM MỚI: API GỌI DỮ LIỆU PHỤC VỤ HẬU CẦN]
  getPVHC: async (): Promise<any[]> => fetchWithCache('HS_PVHC'),

  // 🟢 [ĐÃ THÊM MỚI: API GỌI DỮ LIỆU PCCC]
  getPCCC: async (): Promise<any[]> => fetchWithCache('HS_PCCC'),

  // 👉 2 HÀM MỚI ĐÃ ĐƯỢC THÊM LẠI ĐỂ FIX LỖI CHO TRANG TÀI KHOẢN VÀ NHẬT KÝ
  getUsers: async (): Promise<User[]> => fetchWithCache('Config_Users'),
  
  // 👉 2 HÀM MỚI ĐÃ ĐƯỢC THÊM LẠI ĐỂ FIX LỖI CHO TRANG TÀI KHOẢN VÀ NHẬT KÝ
  getUsers: async (): Promise<User[]> => fetchWithCache('Config_Users'),
  getLogs: async (): Promise<SysLog[]> => fetchWithCache('Sys_Logs'),

  // 3. HÀM LƯU DỮ LIỆU CÓ TÍCH HỢP AUTO-LOGGING
  save: async (data: any, action: 'create' | 'update', sheetName: string) => {
    const response = await fetch(API_URL, {
      method: 'POST', 
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, rowData: data, sheetName })
    });
    if (!response.ok) throw new Error(`Lỗi lưu ${sheetName}`);
    
    delete apiCache[sheetName]; 
    
    // Tự động ghi Log
    const tenHanhDong = action === 'create' ? 'THÊM MỚI' : 'CẬP NHẬT';
    const ID_TaiSan = data.ID_Xe || data.ID_NhanSu || data.ID_TTB || data.ID_VanBan || data.ID_DonVi || data.ID_User || 'Dữ liệu mới';
    apiService.writeLog(tenHanhDong, `Bảng: ${sheetName} | ID Đối tượng: ${ID_TaiSan}`);

    return response.json();
  },

  // 4. HÀM XÓA DỮ LIỆU CÓ TÍCH HỢP AUTO-LOGGING
  delete: async (id: string, sheetName: string) => {
    const response = await fetch(API_URL, {
      method: 'POST', 
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "delete", id: String(id).trim(), sheetName })
    });
    if (!response.ok) throw new Error(`Lỗi xóa ${sheetName}`);
    
    delete apiCache[sheetName];

    // Tự động ghi log
    apiService.writeLog('XÓA', `Bảng: ${sheetName} | ID Đối tượng: ${id}`);

    return response.json();
  }
};
