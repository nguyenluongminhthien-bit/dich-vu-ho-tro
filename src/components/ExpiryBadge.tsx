// Component hiển thị trạng thái hạn — dùng ở bảng danh sách
// Thay thế mọi logic check ngày tháng rải rác trong code
import React from 'react';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { parseDateStrict } from '../utils/formatters';

interface Props {
  dateStr: string | null | undefined;
  label?: string;              // VD: "Hạn BH", "Hạn kiểm định"
  warningDays?: number;        // Mặc định 30 ngày
  criticalDays?: number;       // Mặc định 0 (đã hết hạn)
}

export default function ExpiryBadge({ dateStr, label, warningDays = 30, criticalDays = 0 }: Props) {
  if (!dateStr) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
        <Clock size={10} /> Chưa có
      </span>
    );
  }

  const date = parseDateStrict(dateStr);
  if (!date) return <span className="text-xs text-gray-400">{dateStr}</span>;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(date); expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const dateFormatted = date.toLocaleDateString('vi-VN');

  if (diffDays < criticalDays) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200 animate-pulse">
        <AlertTriangle size={10} /> {label && `${label}: `}{dateFormatted} (Quá hạn)
      </span>
    );
  }

  if (diffDays <= warningDays) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
        <AlertTriangle size={10} /> {label && `${label}: `}{dateFormatted} (Còn {diffDays} ngày)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 size={10} /> {label && `${label}: `}{dateFormatted}
    </span>
  );
}
