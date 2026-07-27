// Bộ từ điển dịch tên cột DB (Supabase) sang tên Tiếng Việt cho dễ đọc trên Nhật ký
const FIELD_DICTIONARY: Record<string, string> = {
  ho_ten: 'Họ và Tên',
  ma_nv: 'Mã Nhân viên',
  chuc_vu: 'Chức vụ',
  sdt: 'SĐT Công ty',
  sdt_ca_nhan: 'SĐT Cá nhân',
  email: 'Email',
  gioi_tinh: 'Giới tính',
  nam_sinh: 'Năm sinh',
  ngay_nhan_viec: 'Ngày nhận việc',
  ngay_nghi_viec: 'Ngày nghỉ việc',
  id_don_vi: 'Đơn vị công tác',
  phan_loai: 'Phân loại',
  trang_thai: 'Trạng thái làm việc',
  thu_nhap: 'Mức thu nhập',
  trinh_do: 'Trình độ học vấn',
  mo_ta_ngoai_hinh: 'Ngoại hình',
  ghi_chu: 'Ghi chú',
  
  // Các trường của Xe và Thiết bị
  ten_thiet_bi: 'Tên thiết bị',
  bien_so: 'Biển số xe',
  loai_xe: 'Loại xe',
  hien_trang: 'Hiện trạng',
  tinh_trang: 'Tình trạng',
  so_luong: 'Số lượng',
  gia_mua: 'Giá mua',
  nguyen_gia: 'Nguyên giá',
  
  // Các trường của Văn bản
  tieu_de: 'Tiêu đề',
  noi_dung: 'Nội dung',
  ngay_ban_hanh: 'Ngày ban hành',
  so_hieu: 'Số hiệu',
  hieu_luc: 'Hiệu lực',
  muc_do_khan: 'Độ khẩn',
};

// Hàm so sánh và tạo chuỗi Log
export const generateDiffLog = (oldData: any, newData: any): string => {
  if (!oldData) return 'Tạo mới dữ liệu.';
  
  let changes: string[] = [];
  
  // Duyệt qua từng trường dữ liệu trong form mới
  Object.keys(newData).forEach(key => {
    // Bỏ qua các trường ID hệ thống hoặc ngày tạo/cập nhật ẩn của Supabase
    if (['id', 'id_don_vi', 'id_xe', 'id_ts_thiet_bi', 'id_user', 'created_at', 'updated_at'].includes(key)) return;

    const oldVal = String(oldData[key] || '').trim();
    const newVal = String(newData[key] || '').trim();

    if (oldVal !== newVal) {
      const fieldName = FIELD_DICTIONARY[key] || key; // Lấy tên Tiếng Việt, nếu không có thì lấy tên gốc
      changes.push(`• ${fieldName}: [${oldVal || 'Trống'}] ➔ [${newVal || 'Trống'}]`);
    }
  });

  if (changes.length === 0) return 'Không có dữ liệu nào thay đổi.';
  
  return `Cập nhật dữ liệu:\n${changes.join('\n')}`;
};