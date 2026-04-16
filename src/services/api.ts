import { Personnel, DonVi, User, SysLog } from '../types';

const TABLE_MAP: Record<string, string> = {
  'DM_Donvi': 'dm_don_vi',
  'PhapNhan': 'dm_phap_nhan',
  'PhongHop': 'dm_phong_hop',
  'HS_AnNinh': 'hs_an_ninh',
  'HS_PVHC': 'hs_pvhc',
  'HS_PCCC': 'hs_pccc',
  'TS_PCCC': 'ts_pccc',
  'HS_ATVSLD': 'hs_an_toan_lao_dong',
  'HS_PCTT': 'hs_pctt'
};
const resolveTable = (name: string) => TABLE_MAP[name] || name.toLowerCase();

// ===============================================
// 1. CẤU HÌNH KẾT NỐI SUPABASE
// ===============================================
const SUPABASE_URL = 'https://eizpyrhqshkhcghkupjy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpenB5cmhxc2hraGNnaGt1cGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzUyNTcsImV4cCI6MjA5MDk1MTI1N30.Whb7fJVbGMeCPN0M07BchRFvHtIiH5ZTSCeSu2l4RPc';

// Header chuẩn để nói chuyện với Supabase
const HEADERS = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation" // Yêu cầu trả về data sau khi Insert/Update
};

const apiCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000;

// Khi bảng A thay đổi → tự động xóa cache các bảng liên quan
const CACHE_DEPENDENCIES: Record = {
  'ns_dich_vu':          ['dm_don_vi'],        // Thêm/sửa nhân sự → làm mới đơn vị
  'dm_don_vi':           ['ns_dich_vu'],        // Sửa đơn vị → làm mới nhân sự
  'ts_xe':               ['cp_hoat_dong_xe'],   // Sửa xe → làm mới chi phí xe
  'cp_hoat_dong_xe':     ['ts_xe'],             // Sửa chi phí → làm mới xe
  'ts_thiet_bi':         ['nk_thiet_bi'],       // Sửa thiết bị → làm mới nhật ký
  'nk_thiet_bi':         ['ts_thiet_bi'],       // Sửa nhật ký → làm mới thiết bị
  'hs_pccc':             ['ts_pccc'],            // Sửa hồ sơ PCCC → làm mới tài sản PCCC
  'ts_pccc':             ['hs_pccc'],            // Sửa tài sản PCCC → làm mới hồ sơ
};

// ===============================================
// 2. HÀM LÕI TẢI DỮ LIỆU (GET)
// ===============================================
async function fetchWithCache(tableName: string, forceRefresh = false) {
  if (!forceRefresh && apiCache[tableName] && (Date.now() - apiCache[tableName].timestamp < CACHE_DURATION)) {
    return apiCache[tableName].data;
  }

  // Gọi API dạng: https://.../rest/v1/dm_don_vi?select=*
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*`, {
    method: 'GET',
    headers: HEADERS
  });

  if (!response.ok) throw new Error(`Lỗi tải dữ liệu bảng ${tableName}`);
  const finalData = await response.json();
  apiCache[tableName] = { data: finalData, timestamp: Date.now() };
  return finalData;
}

let currentUser: User | null = null;
export const apiService = {
  setCurrentUser: (user: User | null) => { currentUser = user; },

  // CẬP NHẬT HÀM GHI LOG VÀO ĐÂY
  writeLog: async (hanhDong: string, chiTiet: string) => {
    try {
      if (!currentUser) return; // Nếu chưa đăng nhập thì không ghi log
      // 1. Tạo gói dữ liệu chuẩn Supabase (snake_case)
      const logData: any = {
        id: `LOG${Date.now()}${Math.floor(Math.random() * 1000)}`,
        thoi_gian: new Date().toISOString(), 
        
        // 💡 SỬA TẠI ĐÂY: Chỉ dùng ID của user, nếu không có thì để null (bỏ qua tên và email)
        id_user: currentUser?.id || null, 
        
        hanh_dong: hanhDong,
        chi_tiet: chiTiet
      };

      // Xử lý an toàn Khóa ngoại: Nếu là Quản trị viên (ALL) thì gán null
      if (currentUser?.id_don_vi && currentUser.id_don_vi !== 'ALL' && currentUser.id_don_vi !== 'UNKNOWN') {
        logData.id_don_vi = currentUser.id_don_vi;
      } else {
        logData.id_don_vi = null; 
      }

      // 2. Bắn dữ liệu lên Supabase
      const response = await fetch(`${SUPABASE_URL}/rest/v1/sys_logs`, {
        method: 'POST',
        headers: {
          ...HEADERS,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(logData)
      });

      // 3. Nếu Supabase từ chối, in lỗi ra F12 để dễ bắt bệnh
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lỗi Supabase khi ghi Log:", errorText);
      }
    } catch (error) {
      console.error("Lỗi hệ thống khi ghi Log:", error);
    }
  },

  // ĐĂNG NHẬP (Lấy từ bảng config_users)
  login: async (username: string, password: string): Promise<User> => {
    // Gọi chính xác cột user_name và password như trong ảnh của bạn
    const url = `${SUPABASE_URL}/rest/v1/config_users?user_name=eq.${username}&password=eq.${password}&select=*`;
    const response = await fetch(url, { method: 'GET', headers: HEADERS });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("CHI TIẾT LỖI TỪ SUPABASE:", errorText);
      throw new Error(`Lỗi cấu hình Database: ${errorText}`);
    }

    const users = await response.json();
    if (users.length === 0) throw new Error("Sai tên đăng nhập hoặc mật khẩu");
    return users[0] as User;
  },

  // ===============================================
  // 3. DANH SÁCH API LẤY DỮ LIỆU
  // ===============================================
  getPersonnel: async (): Promise<Personnel[]> => fetchWithCache('ns_dich_vu'),
  getDonVi: async (): Promise<DonVi[]> => fetchWithCache('dm_don_vi'),
  getAnNinh: async (): Promise<any[]> => fetchWithCache('hs_an_ninh'),
  getXe: async (): Promise<any[]> => fetchWithCache('ts_xe'),
  getChiPhiXe: async (): Promise<any[]> => fetchWithCache('cp_hoat_dong_xe'),
  getPhapNhan: async (): Promise<any[]> => fetchWithCache('dm_phap_nhan'),
  getPhongHop: async (): Promise<any[]> => fetchWithCache('dm_phong_hop'),
  getQuyDinh: async (): Promise<any[]> => fetchWithCache('qd_qt'),
  getThietBi: async (): Promise<any[]> => fetchWithCache('ts_thiet_bi'),
  getNhatKyThietBi: async (): Promise<any[]> => fetchWithCache('nk_thiet_bi'),
  getVanBan: async (): Promise<any[]> => fetchWithCache('vb_tb'),
  getPVHC: async (): Promise<any[]> => fetchWithCache('hs_pvhc'),
  getATVSLD: async (): Promise<any[]> => fetchWithCache('hs_an_toan_lao_dong'),
  getPCTT: async (): Promise<any[]> => fetchWithCache('hs_pctt'),
  getPCCC: async (): Promise<any[]> => fetchWithCache('hs_pccc'),
  getTsPCCC: async (): Promise<any[]> => fetchWithCache('ts_pccc'),
  getUsers: async (): Promise<User[]> => fetchWithCache('config_users'),
  getLogs: async (): Promise<SysLog[]> => fetchWithCache('sys_logs'),

  // ===============================================
  // 4. HÀM LƯU / CẬP NHẬT DỮ LIỆU (POST / PATCH)
  // ===============================================
  save: async (data: any, action: 'create' | 'update', tableName: string) => {
    // 💡 Tự động Đổi tên bảng cũ sang tên bảng Supabase (chuẩn snake_case)
      const realTableName = resolveTable(tableName);

    // Xử lý lưu nhiều dòng (Mảng)
    if (Array.isArray(data)) {
      // Làm sạch mảng (biến "" thành null)
      const cleanArray = data.map(item => {
        const cleaned = { ...item };
        Object.keys(cleaned).forEach(k => { if (cleaned[k] === '') cleaned[k] = null; });
        return cleaned;
      });

      const response = await fetch(`${SUPABASE_URL}/rest/v1/${realTableName}`, {
        method: 'POST', 
        headers: HEADERS,
        body: JSON.stringify(cleanArray)
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Lỗi Supabase: ${errText}`);
      }
      delete apiCache[realTableName];
      CACHE_DEPENDENCIES[realTableName]?.forEach(dep => delete apiCache[dep]);
      void apiService.writeLog('CẬP NHẬT MẢNG', `Bảng: ${realTableName} | Lưu ${data.length} bản ghi`);
      return response.json();
    }

    // 💡 Tự động Làm sạch dữ liệu Object (biến "" thành null để không bị lỗi cột Số)
    const cleanedData = { ...data };
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === '') cleanedData[key] = null;
    });

// 🟢 GIẢI PHÁP TỐI THƯỢNG: Tự động sinh ID nếu dữ liệu thêm mới bị thiếu ID
    if (action === 'create' && !cleanedData.id) {
      // Lấy 2 chữ cái đầu của tên bảng làm tiền tố (VD: ns_dich_vu -> NS, ts_xe -> TS)
      const prefix = realTableName.substring(0, 2).toUpperCase();
      cleanedData.id = `${prefix}${Date.now()}${Math.floor(Math.random() * 100)}`;
    }

    let url = `${SUPABASE_URL}/rest/v1/${realTableName}`;
    let method = 'POST'; 

    if (action === 'update') {
      const recordId = cleanedData.id || cleanedData.ID || cleanedData.ID_Xe || cleanedData.ID_User; 
      url = `${url}?id=eq.${recordId}`; 
      method = 'PATCH'; 
      // Xóa id khỏi body khi update để an toàn
      delete cleanedData.id;
    }

    const response = await fetch(url, {
      method: method, 
      headers: HEADERS,
      body: JSON.stringify(cleanedData)
    });
    
    // Bắt lỗi chi tiết từ Supabase
    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = errorText;
      try {
        const errJson = JSON.parse(errorText);
        errorMsg = errJson.message || errJson.details || errorText;
      } catch (e) {}
      
      console.error(`🔴 LỖI TỪ SUPABASE (Bảng ${realTableName}):`, errorMsg);
      throw new Error(errorMsg); 
    }
    
    delete apiCache[realTableName];
    CACHE_DEPENDENCIES[realTableName]?.forEach(dep => delete apiCache[dep]);
    const tenHanhDong = action === 'create' ? 'THÊM MỚI' : 'CẬP NHẬT';
    void apiService.writeLog(tenHanhDong, `Bảng: ${realTableName}`);

    // Fetch API của Supabase (khi có Prefer: return=representation) trả về Mảng
    const resultData = await response.json();
    return Array.isArray(resultData) ? resultData[0] : resultData;
  },

  // ===============================================
  // 5. HÀM XÓA DỮ LIỆU (DELETE)
  // ===============================================
  delete: async (id: string, tableName: string) => {
    // 💡 Tự động Đổi tên bảng cũ
      const realTableName = resolveTable(tableName);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${realTableName}?id=eq.${id}`, {
      method: 'DELETE', 
      headers: HEADERS
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Lỗi xóa ${realTableName}: ${errorText}`);
    }
    
    delete apiCache[realTableName];
    CACHE_DEPENDENCIES[realTableName]?.forEach(dep => delete apiCache[dep]);
    void apiService.writeLog('XÓA', `Bảng: ${realTableName} | ID Đối tượng: ${id}`);
    return true;
  }
};