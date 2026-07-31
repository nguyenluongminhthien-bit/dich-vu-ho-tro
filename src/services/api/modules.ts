import { Personnel, DonVi, User, SysLog, ThueBao, CuocThang } from '../../types';
import { fetchWithCache, resolveTable, invalidateCache } from './cache';
import { SUPABASE_URL, HEADERS, API_MODE } from './client';
import { writeLog } from './logs';
import { getLocalRecords, saveLocalRecord, deleteLocalRecord } from './localStore';
import { currentUser } from './auth';
import { getAllSubordinateIds } from '../../utils/hierarchy';

// Helper wrapper cho tất cả GET requests có chế độ fallback
async function getWithFallback<T>(tableName: string, forceRefresh = false): Promise<T[]> {
  if (API_MODE === 'MOCK') {
    return getLocalRecords(tableName) as T[];
  }
  try {
    return await fetchWithCache(tableName, forceRefresh) as T[];
  } catch (err) {
    console.warn(`⚠️ Không thể tải dữ liệu bảng ${tableName} từ Supabase. Tự động dùng dữ liệu offline Local!`);
    return getLocalRecords(tableName) as T[];
  }
}

export const getPersonnel = (forceRefresh = false) => getWithFallback<Personnel>('ns_dich_vu', forceRefresh);
export const getDonVi = (forceRefresh = false) => getWithFallback<DonVi>('dm_don_vi', forceRefresh);
export const getAnNinh = () => getWithFallback<any>('hs_an_ninh');
export const getXe = () => getWithFallback<any>('ts_xe');
export const getChiPhiXe = () => getWithFallback<any>('cp_hoat_dong_xe');
export const getPhapNhan = (forceRefresh = false) => getWithFallback<any>('dm_phap_nhan', forceRefresh);
export const getPhongHop = () => getWithFallback<any>('dm_phong_hop');
export const getQuyDinh = () => getWithFallback<any>('qd_qt');
export const getThietBi = () => getWithFallback<any>('ts_thiet_bi');
export const getNhatKyThietBi = () => getWithFallback<any>('nk_thiet_bi');
export const getVanBan = () => getWithFallback<any>('vb_tb');
export const getPVHC = () => getWithFallback<any>('hs_pvhc');
export const getATVSLD = () => getWithFallback<any>('hs_an_toan_lao_dong');
export const getPCTT = () => getWithFallback<any>('hs_pctt');
export const getPCCC = () => getWithFallback<any>('hs_pccc');
export const getTsPCCC = () => getWithFallback<any>('ts_pccc');
export const getUsers = () => getWithFallback<User>('config_users');
export const getLogs = () => getWithFallback<SysLog>('sys_logs');
export const getThueBao   = () => getWithFallback<ThueBao>('dm_thue_bao');
export const getCuocThang = () => getWithFallback<CuocThang>('cp_cuoc_thang');
export const getKhoaHuanLuyen = () => getWithFallback<any>('hs_khoa_huan_luyen');
export const getHocVienKhoaHuanLuyen = () => getWithFallback<any>('hs_hoc_vien_khoa_huan_luyen');
export const getChuKyATVSLD = (forceRefresh = false) => getWithFallback<any>('dm_chu_ky_atvsld', forceRefresh);
export const getThietBiNghiemNgat = () => getWithFallback<any>('ts_thiet_bi_nghiem_ngat');
export const getKiemDinhTBNN = () => getWithFallback<any>('nk_kiem_dinh_tbnn');

// Helper làm sạch payload trước khi gửi lên Supabase (loại bỏ trường UI-only, rỗng "" -> null)
function sanitizePayload(item: Record<string, any>, isUpdate: boolean = false): Record<string, any> {
  const cleaned: Record<string, any> = {};
  const uiOnlyKeys = new Set(['STT', 'stt', 'isEditing', 'isSelected', 'action', '__rowNum__']);

  Object.keys(item || {}).forEach(key => {
    // Loại bỏ các trường nội bộ bắt đầu bằng _ hoặc trường UI-only
    if (key.startsWith('_') || uiOnlyKeys.has(key)) return;

    let value = item[key];
    if (value === '') value = null;
    cleaned[key] = value;
  });

  if (isUpdate) {
    delete cleaned.id;
    delete cleaned.ID;
  }

  return cleaned;
}

// Helper trích xuất tóm tắt ngắn gọn các trường định danh của bản ghi
function extractRecordSummary(data: any, tableName: string): string {
  if (!data) return '';
  const parts: string[] = [];

  const recordId = data.id || data.ID || data.ID_Xe || data.ID_User;
  if (recordId) {
    parts.push(`ID: ${recordId}`);
  }

  const table = tableName.toLowerCase();
  
  if (table.includes('ns_dich_vu')) {
    if (data.ho_ten) parts.push(`Họ tên: ${data.ho_ten}`);
    if (data.ma_so_nhan_vien) parts.push(`MSNV: ${data.ma_so_nhan_vien}`);
  } else if (table.includes('ts_xe')) {
    if (data.bien_so) parts.push(`Biển số: ${data.bien_so}`);
    if (data.hieu_xe || data.loai_xe) parts.push(`Xe: ${[data.hieu_xe, data.loai_xe].filter(Boolean).join(' ')}`);
  } else if (table.includes('ts_thiet_bi')) {
    if (data.ten_thiet_bi) parts.push(`Tên TB: ${data.ten_thiet_bi}`);
    if (data.ma_kiem_soat) parts.push(`Mã KS: ${data.ma_kiem_soat}`);
  } else if (table.includes('vb_tb')) {
    if (data.so_hieu) parts.push(`Số hiệu: ${data.so_hieu}`);
    if (data.tieu_de) parts.push(`Tiêu đề: ${data.tieu_de}`);
  } else if (table.includes('hs_khoa_huan_luyen')) {
    if (data.ten_khoa_hoc) parts.push(`Khóa học: ${data.ten_khoa_hoc}`);
  } else if (table.includes('hs_hoc_vien_khoa_huan_luyen')) {
    if (data.ho_ten_nv) parts.push(`Học viên: ${data.ho_ten_nv}`);
    if (data.msnv) parts.push(`MSNV: ${data.msnv}`);
  } else if (table.includes('config_users')) {
    if (data.user_name) parts.push(`Username: ${data.user_name}`);
    if (data.ho_ten) parts.push(`Họ tên: ${data.ho_ten}`);
  } else if (table.includes('hs_an_ninh')) {
    if (data.nguoi_lien_he) parts.push(`Liên hệ: ${data.nguoi_lien_he}`);
  } else if (table.includes('dm_don_vi')) {
    if (data.ten_don_vi) parts.push(`Tên ĐV: ${data.ten_don_vi}`);
  } else if (table.includes('dm_phap_nhan')) {
    if (data.ten_phap_nhan) parts.push(`Pháp nhân: ${data.ten_phap_nhan}`);
  }

  if (parts.length <= 1) {
    const commonName = data.ten || data.name || data.tieu_de || data.title || data.noi_dung;
    if (commonName) {
      parts.push(`Tên/Nội dung: ${String(commonName).substring(0, 50)}`);
    }
  }

  return parts.join(' | ');
}

// Helper kiểm tra phạm vi ghi (chặn thật việc ghi dữ liệu ngoài phạm vi đơn vị)
async function checkUnitPermission(item: any, tableName: string) {
  if (!currentUser || currentUser.quyen === 'ADMIN') return;

  const targetIdDonVi = item?.id_don_vi;
  if (targetIdDonVi === undefined || targetIdDonVi === null || String(targetIdDonVi).trim() === '') return;

  const strTargetId = String(targetIdDonVi).trim();
  const userIdDonVi = String(currentUser.id_don_vi || (currentUser as any).idDonVi || '').trim();
  
  if (!userIdDonVi || userIdDonVi === 'ALL' || userIdDonVi === 'HO' || userIdDonVi === 'DV_HO') return;

  const allUnits = await getDonVi();
  const subIds = getAllSubordinateIds(userIdDonVi, allUnits);
  const allowedIds = new Set([userIdDonVi, ...subIds].map(id => String(id).trim()));

  if (!allowedIds.has(strTargetId)) {
    throw new Error(`Bạn không có quyền ghi dữ liệu cho đơn vị này (Mã ĐV: ${strTargetId}). Vui lòng liên hệ Quản trị viên nếu đây là nhầm lẫn.`);
  }
}

export async function save(data: any, action: 'create' | 'update', tableName: string): Promise<any> {
  // Thực hiện kiểm tra phạm vi ghi (Chặn thật ở Bước B)
  if (Array.isArray(data)) {
    for (const item of data) {
      await checkUnitPermission(item, tableName);
    }
  } else {
    await checkUnitPermission(data, tableName);
  }

  if (API_MODE === 'MOCK') {
    return saveLocalRecord(data, action, tableName);
  }

  try {
    const realTableName = resolveTable(tableName);

    // Xử lý lưu nhiều dòng (Mảng)
    if (Array.isArray(data)) {
      const cleanArray = data.map(item => sanitizePayload(item, false));

      const response = await fetch(`${SUPABASE_URL}/rest/v1/${realTableName}`, {
        method: 'POST', 
        headers: HEADERS,
        body: JSON.stringify(cleanArray)
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Lỗi Supabase: ${errText}`);
      }
      invalidateCache(realTableName);
      let arraySummary = '';
      if (Array.isArray(data) && data.length > 0) {
        const samples = data.slice(0, 3).map(item => {
          const detail = extractRecordSummary(item, realTableName);
          return `{${detail}}`;
        }).join(', ');
        arraySummary = ` | Chi tiết mẫu: [${samples}${data.length > 3 ? '...' : ''}]`;
      }
      void writeLog('CẬP NHẬT MẢNG', `Bảng: ${realTableName} | Lưu ${data.length} bản ghi${arraySummary}`);
      return response.json();
    }

    // Làm sạch dữ liệu Object (biến "" thành null, loại bỏ trường UI-only)
    const cleanedData = sanitizePayload(data, action === 'update');

    if (action === 'create' && !cleanedData.id) {
      const prefix = realTableName.substring(0, 2).toUpperCase();
      cleanedData.id = `${prefix}${Date.now()}${Math.floor(Math.random() * 100)}`;
    }

    let url = `${SUPABASE_URL}/rest/v1/${realTableName}`;
    let method = 'POST'; 

    if (action === 'update') {
      const recordId = data.id || data.ID || data.ID_Xe || data.ID_User; 
      url = `${url}?id=eq.${recordId}`; 
      method = 'PATCH'; 
    }

    const response = await fetch(url, {
      method: method, 
      headers: HEADERS,
      body: JSON.stringify(cleanedData)
    });
    
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
    
    invalidateCache(realTableName);
    const tenHanhDong = action === 'create' ? 'THÊM MỚI' : 'CẬP NHẬT';
    const detailSummary = extractRecordSummary(data, realTableName);
    void writeLog(tenHanhDong, `Bảng: ${realTableName} | ${detailSummary}`);

    const resultData = await response.json();
    return Array.isArray(resultData) ? resultData[0] : resultData;
  } catch (err: any) {
    console.error(`🔴 Giao tiếp Supabase thất bại cho bảng ${tableName}:`, err.message);
    throw err;
  }
}

export async function deleteRecord(id: string, tableName: string): Promise<boolean> {
  if (API_MODE === 'MOCK') {
    return deleteLocalRecord(id, tableName);
  }

  try {
    const realTableName = resolveTable(tableName);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${realTableName}?id=eq.${id}`, {
      method: 'DELETE', 
      headers: HEADERS
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Lỗi xóa ${realTableName}: ${errorText}`);
    }
    
    invalidateCache(realTableName);
    void writeLog('XÓA', `Bảng: ${realTableName} | ID Đối tượng: ${id}`);
    return true;
  } catch (err: any) {
    console.error(`🔴 Giao tiếp Supabase thất bại cho bảng ${tableName}:`, err.message);
    throw err;
  }
}
