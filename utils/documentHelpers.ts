import { toUnaccented } from './formatters';

// HÀM KIỂM TRA VĂN BẢN MẬT
export const isMatDocument = (val: any): boolean => {
  if (val === true || val === 'TRUE' || val === 'true' || val === 'Có' || String(val).trim() === '1') return true;
  return false;
};

// HÀM KIỂM TRA VĂN BẢN MỚI (TRONG VÒNG 7 NGÀY)
export const isNewDocument = (dateString: string | null): boolean => {
  if (!dateString) return false;
  const docDate = new Date(dateString).getTime();
  const now = new Date().getTime();
  const diffInDays = (now - docDate) / (1000 * 3600 * 24);
  return diffInDays >= -1 && diffInDays <= 7;
};

// HÀM CHUẨN HÓA TÊN NGƯỜI KÝ (COLLAPSE CÁC BIẾN THỂ TRÙNG LẶP)
export const normalizeSignerName = (name: string): string => {
  if (!name) return '';
  let normalized = name.normalize('NFC').trim().replace(/\s+/g, ' '); 
  normalized = normalized.split(' ').map(word => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
  
  if (normalized === 'Nguyển Quang Bảo' || normalized === 'Nguyen Quang Bao') {
    return 'Nguyễn Quang Bảo';
  }
  return normalized;
};

// HÀM KIỂM TRA TRẠNG THÁI HIỆU LỰC BỊ THAY THẾ (TƯƠNG THÍCH DỮ LIỆU CŨ VÀ MỚI)
export const isReplacedStatus = (status: string): boolean => {
  return status === 'Được thay thế bằng VB' || status === 'Thay thế VB khác';
};

export const isExpiredOrReplaced = (status: string): boolean => {
  return status === 'Hết hiệu lực' || isReplacedStatus(status);
};

// HÀM LẤY NHÃN HIỂN THỊ ĐỘNG CHO NƠI GỬI/NHẬN
export const getNoiGuiNhanLabel = (phanLoai: string): string => {
  switch(phanLoai) {
    case 'Công văn đến': return 'Cơ quan / Đơn vị gửi đến';
    case 'Công văn đi': return 'Nơi nhận (Kính gửi / Đồng kính gửi)';
    case 'Quyết định': return 'Đơn vị / Cá nhân nhận Quyết định';
    case 'Tờ trình': return 'Kính gửi (Nơi nhận Tờ trình)';
    case 'Thông báo': return 'Nơi nhận Thông báo';
    default: return 'Nơi nhận / Gửi';
  }
};
