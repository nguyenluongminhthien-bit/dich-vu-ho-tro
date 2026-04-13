export const formatCurrency = (val: string | number | undefined | null): string => {
  if (!val && val !== 0) return 'Chưa cập nhật';
  const num = Number(String(val).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num) || num === 0) return String(val);
  return num.toLocaleString('vi-VN') + ' VNĐ';
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