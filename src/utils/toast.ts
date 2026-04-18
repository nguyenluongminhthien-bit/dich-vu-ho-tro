// Toast notification nhẹ — không cần cài thêm thư viện
type ToastType = 'success' | 'error' | 'warning' | 'info';

const COLORS: Record<ToastType, string> = {
  success: 'bg-emerald-600 text-white',
  error:   'bg-red-600 text-white',
  warning: 'bg-amber-500 text-white',
  info:    'bg-[#05469B] text-white',
};

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

function show(message: string, type: ToastType = 'info', duration = 3000) {
  const container = getOrCreateContainer();
  const toast = document.createElement('div');
  toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold
    transition-all duration-300 translate-y-2 opacity-0 ${COLORS[type]}`;
  toast.innerHTML = `
    <span class="text-base font-black">${ICONS[type]}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });
  });

  // Auto remove
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function getOrCreateContainer() {
  let el = document.getElementById('toast-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end';
    document.body.appendChild(el);
  }
  return el;
}

export const toast = {
  success: (msg: string, duration?: number) => show(msg, 'success', duration),
  error:   (msg: string, duration?: number) => show(msg, 'error', duration),
  warning: (msg: string, duration?: number) => show(msg, 'warning', duration),
  info:    (msg: string, duration?: number) => show(msg, 'info', duration),
};

// CÁCH IMPORT VÀ SỬ DỤNG: import { toast } from '../utils/toast';

// Thay alert("Lỗi...") bằng: toast.error("Lỗi khi lưu dữ liệu!");

// Thêm thông báo thành công sau khi save: toast.success("Lưu thành công!");

// Cảnh báo: toast.warning("Vui lòng chọn Đơn vị công tác!");

// Thông tin: toast.info("Đang xử lý...");