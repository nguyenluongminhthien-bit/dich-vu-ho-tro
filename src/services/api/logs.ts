import { SUPABASE_URL, HEADERS, API_MODE } from './client';
import { currentUser } from './auth';
import { saveLocalRecord, getLocalRecords } from './localStore';

export async function writeLog(hanhDong: string, chiTiet: string): Promise<void> {
  try {
    if (!currentUser) return; // Nếu chưa đăng nhập thì không ghi log
    
    const logData: any = {
      id: `LOG${Date.now()}${Math.floor(Math.random() * 1000)}`,
      thoi_gian: new Date().toISOString(), 
      id_user: currentUser?.id || null, 
      ho_ten: currentUser?.ho_ten || null,
      hanh_dong: hanhDong,
      chi_tiet: chiTiet
    };

    // Xử lý an toàn Khóa ngoại
    if (currentUser?.id_don_vi && currentUser.id_don_vi !== 'ALL' && currentUser.id_don_vi !== 'UNKNOWN') {
      logData.id_don_vi = currentUser.id_don_vi;
    } else {
      logData.id_don_vi = null; 
    }

    if (API_MODE === 'MOCK') {
      saveLocalRecord(logData, 'create', 'sys_logs');
      return;
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/sys_logs`, {
      method: 'POST',
      headers: {
        ...HEADERS,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(logData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lỗi Supabase khi ghi Log:", errorText);
      // Fallback
      saveLocalRecord(logData, 'create', 'sys_logs');
    }
  } catch (error) {
    console.error("Lỗi hệ thống khi ghi Log:", error);
    // Fallback
    try {
      const logData: any = {
        id: `LOG${Date.now()}${Math.floor(Math.random() * 1000)}`,
        thoi_gian: new Date().toISOString(), 
        id_user: currentUser?.id || null, 
        ho_ten: currentUser?.ho_ten || null,
        hanh_dong: hanhDong,
        chi_tiet: chiTiet,
        id_don_vi: currentUser?.id_don_vi && currentUser.id_don_vi !== 'ALL' ? currentUser.id_don_vi : null
      };
      saveLocalRecord(logData, 'create', 'sys_logs');
    } catch (e) {}
  }
}

export async function cleanOldLogs(days = 5): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffIso = cutoffDate.toISOString();

  // 1. MOCK mode: xóa trong LocalStorage
  if (API_MODE === 'MOCK') {
    try {
      const allLogs = getLocalRecords('sys_logs') || [];
      const newLogs = allLogs.filter((log: any) => {
        if (!log.thoi_gian) return false;
        return new Date(log.thoi_gian).getTime() >= cutoffDate.getTime();
      });
      localStorage.setItem('db_sys_logs', JSON.stringify(newLogs));
    } catch (e) {
      console.error("Lỗi xóa Log Mock:", e);
    }
    return;
  }

  // 2. Supabase mode: gọi DELETE API qua REST
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/sys_logs?thoi_gian=lt.${encodeURIComponent(cutoffIso)}`, {
      method: 'DELETE',
      headers: {
        ...HEADERS
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lỗi xóa Log Supabase:", errorText);
    }
  } catch (error) {
    console.error("Lỗi hệ thống khi xóa Log:", error);
  }
}
