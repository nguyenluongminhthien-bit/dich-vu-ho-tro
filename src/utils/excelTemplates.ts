import { toast } from './toast';

export interface ExcelTemplateConfig {
  filename: string;
  headers: string[];
  dummyRow: string[];
}

export const EXCEL_TEMPLATES: Record<string, ExcelTemplateConfig> = {
  personnel: {
    filename: 'Mau_Form_Them_Nhan_Su_Hang_Loat.xls',
    headers: [
      "Số TT", "Mã NV *", "Họ tên *", "Chức danh *", "Bộ phận",
      "Đơn vị (để trống)", "Showroom (để trống)", "Phía (để trống)",
      "Phân loại", "SĐT Cty", "Giới tính", "Năm sinh", "Ngày làm",
      "SĐT CNhân", "Email", "Ngạch", "Nhóm ATVSLĐ", "HL Từ",
      "HL Đến", "Giá trị đến", "Khối", "Địa điểm LV", "CCCD",
      "Thẻ thang", "Thẻ xe", "Hãng Loại xe", "Biển kiểm soát"
    ],
    dummyRow: [
      "1", "2112277", "Nguyễn Văn A", "Chuyên viên Quản trị Văn phòng", "QTVP",
      "", "", "", "Chuyên viên", "0901234567", "Nam", "1990", "01/01/2020",
      "0987654321", "nguyenvana@thaco.com.vn", "G2", "4", "", "", "", "", "VP Sadora (HCM)", "079090123456", "TRUE", "1236", "Yamaha Exciter", "66F118251"
    ]
  },
  osh_training: {
    filename: 'Mau_Form_Them_Hoc_Vien_ATVSLD_Hang_Loat.xls',
    headers: [
      "STT", "MSNV *", "Họ và tên", "Ngày sinh", "Giới tính",
      "Số CCCD", "Quốc tịch", "Chức vụ", "Đơn vị", "Nhóm (1-6)",
      "Nội dung huấn luyện", "Thời gian huấn luyện", "Điểm lý thuyết",
      "Điểm thực hành", "Kết quả", "Ghi chú"
    ],
    dummyRow: [
      "1", "22091296", "Nguyễn Thị Hoàng Yến", "24/12/2000", "Nữ",
      "082300009847", "Việt Nam", "Hỗ trợ bán hàng", "Công ty TNHH THACO AUTO TP.HCM (Showroom Bình Triệu)", "4",
      "- Kiến thức cơ bản về an toàn, vệ sinh lao động\n- Nội dung huấn luyện trực tiếp tại nơi làm việc",
      "06/05 - 07/05/2026", "65", "60", "Đạt", "Định kỳ"
    ]
  },
  strict_equipment: {
    filename: 'Mau_Form_Them_Thiet_Bi_Nghiem_Ngat_Hang_Loat.xls',
    headers: [
      "Số TT", "Số Serial", "Tên Thiết bị *", "Mã Thiết bị", "Mã Chế tạo",
      "Thông số KT", "Ngày Kiểm định *", "Hiệu lực KĐ", "Hạn Kiểm định *",
      "Người Ký", "Đơn vị", "Giá thành", "Định kì/bất thường",
      "Cấp lý lịch", "Người hỗ trợ", "Tình Trạng Hồ Sơ Lưu Trữ"
    ],
    dummyRow: [
      "135", "0135/2026", "CẦU NÂNG Ô TÔ BỐN TRỤ", "TN-3000", "TN-3000-01", "3,0 Tấn",
      "21/01/2026", "1 Năm", "21/01/2027", "NGUYỄN CHU TẤN", "THACO GÒ VẤP",
      "1500000", "Định kì", "", "Trần Quốc Bảo", "Đủ biên bản"
    ]
  },
  office_equipment: {
    filename: 'Mau_Form_Them_Trang_Thiet_Bi_Van_Phong_Hang_Loat.xls',
    headers: [
      "Mã tài sản *", "Tên thiết bị *", "Đơn vị", "Nhóm thiết bị", "Số lượng",
      "Đơn vị tính", "Vị trí bố trí", "Nhà cung cấp", "Ngày mua", "Giá mua",
      "Hạn bảo hành", "Thời gian khấu hao", "Tài sản thuộc", "CPU", "RAM",
      "SSD", "HDD", "VGA", "Màn hình", "Thông số kỹ thuật chung", "Tình trạng",
      "Quy cách/chất liệu", "Số seri", "Phụ kiện/Ghi chú thêm", "Mô tả đặc điểm",
      "Link hồ sơ", "Link hình ảnh"
    ],
    dummyRow: [
      "TS0001", "Máy tính xách tay Dell Latitude 5420", "Văn phòng Sala", "Máy tính xách tay", "1",
      "Cái", "Phòng họp lớn", "FPT Shop", "2024-01-01", "18500000",
      "2026-01-01", "36 tháng", "Công ty", "Core i5-1135G7", "16GB",
      "512GB", "", "Intel Iris Xe", "14 inch FHD", "Vỏ nhôm xám", "Đang sử dụng",
      "Nhựa/Nhôm", "DELL5420-999", "Cáp sạc, túi chống sốc", "Mới 98%",
      "http://link-ho-so.com", "http://link-hinh-anh.com"
    ]
  }
};

export const downloadExcelTemplate = (moduleKey: keyof typeof EXCEL_TEMPLATES) => {
  const config = EXCEL_TEMPLATES[moduleKey];
  if (!config) {
    console.error(`Không tìm thấy cấu hình form mẫu cho module: ${moduleKey}`);
    return;
  }

  const headerHTML = config.headers.map(h => `<th>${h}</th>`).join('');
  const dummyHTML = config.dummyRow.map(d => `<td>${d}</td>`).join('');

  const tableHTML = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><style>table { border-collapse: collapse; font-family: 'Arial', sans-serif; } th, td { border: 1px solid #000000; padding: 6px; vertical-align: middle; } .header { background-color: #d9e1f2; color: #000000; font-weight: bold; text-align: center; }</style></head><body><table><thead><tr class="header">${headerHTML}</tr></thead><tbody><tr>${dummyHTML}</tr></tbody></table></body></html>`;

  const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = config.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success(`Đã tải mẫu form thêm hàng loạt thành công!`);
};
