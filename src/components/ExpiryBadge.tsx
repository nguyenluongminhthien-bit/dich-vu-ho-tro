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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700">
        <Clock size={10} /> Chưa có
      </span>
    );
  }

  const date = parseDateStrict(dateStr);
  if (!date) return <span className="text-xs text-gray-400 dark:text-gray-500">{dateStr}</span>;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(date); expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const dateFormatted = date.toLocaleDateString('vi-VN');

  if (diffDays < criticalDays) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60 animate-pulse">
        <AlertTriangle size={10} /> {label && `${label}: `}{dateFormatted} (Quá hạn)
      </span>
    );
  }

  if (diffDays <= warningDays) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
        <AlertTriangle size={10} /> {label && `${label}: `}{dateFormatted} (Còn {diffDays} ngày)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
      <CheckCircle2 size={10} /> {label && `${label}: `}{dateFormatted}
    </span>
  );
}
