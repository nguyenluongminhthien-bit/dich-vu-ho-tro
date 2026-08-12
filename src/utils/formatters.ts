export const formatCurrency = (val: string | number | undefined | null): string => {
  if (!val && val !== 0) return 'Chưa cập nhật';
  const num = Number(String(val).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num) || num === 0) return String(val);
  return num.toLocaleString('vi-VN') + ' VNĐ';
};

export const formatCurrencySpace = (val: string | number | undefined | null): string => {
  if (!val) return '';
  return val.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export const parseDateStrict = (val: any): Date | null => {
  if (!val || val === 0 || val === '0') return null;
  const d = new Date(val);
  if (!isNaN(d.getTime()) && d.getFullYear() > 2000) return d;
  const s = String(val).trim().toLowerCase();
  const mVN = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (mVN) {
    const d2 = new Date(parseInt(mVN[3], 10), parseInt(mVN[2], 10) - 1, parseInt(mVN[1], 10));
    if (!isNaN(d2.getTime())) return d2;
  }
  const numMatch = s.match(/\b(\d{5})\b/);
  if (numMatch && Number(numMatch[1]) > 30000) {
    return new Date((Number(numMatch[1]) - 25569) * 86400 * 1000);
  }
  return null;
};

export const formatPhoneNumber = (val: string | number | undefined | null): string => {
  if (!val) return '';
  const cleaned = val.toString().replace(/\D/g, ''); 
  if (cleaned.length <= 4) return cleaned;
  if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 11)}`;
};

export const getDirectImageLink = (url: string): string => {
  if (!url) return '';
  const match = url.match(/[-\w]{25,}/);
  if (match && match[0]) {
    return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w800`;
  }
  return url; 
};

export const toUnaccented = (str: any): string => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, "") // Giữ khoảng trắng (\s)
    .replace(/\s+/g, " ")       // Thu gọn nhiều khoảng trắng liên tiếp
    .trim();                     // Cắt bỏ khoảng trắng ở đầu và cuối
};

export const stripAccents = (str: any): string => {
  if (!str) return '';
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
};

export const normalizeDateToISO = (val: any): string => {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.substring(0, 10);
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(str)) {
    const parts = str.split(/[\/\-]/);
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return str;
};

export const safeGet = (obj: any, key: string): any => {
  if (!obj) return '';
  if (obj[key] !== undefined) return obj[key];
  const lowerKey = key.toLowerCase();
  for (const k in obj) {
    if (k.toLowerCase() === lowerKey) return obj[k];
  }
  return '';
};

// 🟢 1. Hàm làm sạch ký tự kỹ thuật: Xóa khoảng trắng thừa xung quanh dấu gạch ngang (i7 - 1185G7 -> i7-1185G7)
export const cleanTechnicalString = (str: any): string => {
  if (!str) return '';
  let result = String(str).trim();
  // Xóa khoảng trắng quanh dấu gạch ngang giữa các từ/số
  result = result.replace(/(\w+)\s*-\s*(\w+)/g, '$1-$2');
  // Thu gọn nhiều khoảng trắng liên tiếp
  result = result.replace(/\s+/g, ' ');
  return result.trim();
};

// 🟢 2. Hàm tự động chuẩn hóa RAM, SSD, HDD: Thêm đơn vị GB nếu chỉ nhập số (512 -> 512 GB, 16gb -> 16 GB)
export const formatMemorySize = (val: any): string => {
  if (!val) return '';
  let str = String(val).trim();
  if (!str) return '';

  // Nếu là số nguyên (VD: 512, 16, 256, 8, 32, 1000)
  if (/^\d+$/.test(str)) {
    return `${str} GB`;
  }

  // Nếu dính liền chữ gb hoặc GB (VD: 512gb, 16GB, 256Gb)
  if (/^\d+\s*gb$/i.test(str)) {
    const num = str.replace(/\D/g, '');
    return `${num} GB`;
  }

  // Thu gọn khoảng trắng thừa
  return str.replace(/\s+/g, ' ').trim();
};