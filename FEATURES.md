# 📋 FEATURES.md — DANH MỤC TÍNH NĂNG QTVP-ASDS (dành cho người dùng)

> Dựng lại dựa trên menu thật trong `Sidebar.tsx` và các trang thật trong `src/pages/`. Phần kỹ thuật/tên file chi tiết xem `ARCHITECTURE.md`.

## 1. Bảng điều khiển
- **Tổng quan (Dashboard):** biểu đồ, số liệu KPI, cảnh báo hạn (thiết bị, chứng chỉ...), tùy chỉnh bố cục dashboard. ✅ Xong

## 2. Quản lý hoạt động

| Tính năng | Mô tả | Trạng thái |
|---|---|---|
| Thông tin Công ty | Hồ sơ chi tiết từng đơn vị: An ninh bảo vệ, PCCC, ATVSLĐ, Phòng chống thiên tai, Phục vụ hậu cần, Phòng họp, Pháp nhân/xuất hóa đơn | ✅ Xong |
| Nhân sự | Hồ sơ nhân sự, bằng cấp, thâm niên, chốt nghỉ việc/vào lại; **Cước điện thoại di động** (thuê bao, cước hàng tháng, biểu đồ, nhập hàng loạt) | ✅ Xong |
| An toàn PCCC | Thiết bị PCCC, hạn kiểm định | ✅ Xong |
| **ATVSLĐ (An toàn vệ sinh lao động)** | 4 phân hệ: Hồ sơ; Đào tạo (kế hoạch + khóa học/học viên); Thiết bị yêu cầu nghiêm ngặt; Khám sức khỏe & bệnh nghề nghiệp | 🔧 3/4 phân hệ đã xong, **phân hệ "Khám sức khỏe" mới là khung placeholder, chưa có dữ liệu thật** |
| Phương tiện | Danh sách xe, chi phí hoạt động xe | ✅ Xong |
| Tài sản & Thiết bị | Cấp phát/thu hồi, nhật ký thiết bị | ✅ Xong |
| Tài liệu | Lưu trữ văn bản, import Excel hàng loạt (paste-import) | ✅ Xong |
| Quy định/Quy trình | Theo dõi hiệu lực văn bản quy định | ✅ Xong |
| Báo cáo | Trình tạo báo cáo tùy chỉnh (chọn nguồn dữ liệu, bộ lọc, mẫu có sẵn, xem trước, xuất) | ✅ Xong |
| Tài khoản | Quản lý user, phân quyền | ✅ Xong |
| Nhật ký hệ thống | Audit log mọi thao tác tạo/sửa/xóa | ✅ Xong |

## 3. Đang phát triển / Kế hoạch tiếp theo

- [ ] **Phân hệ Khám sức khỏe & Bệnh nghề nghiệp** (trong module ATVSLĐ) — hiện chỉ có giao diện "sắp cập nhật", chưa có bảng dữ liệu, chưa nhập liệu được.
- [ ] Refactor tiếp `AtvsldPage.tsx` và tách nhỏ module Cước ĐTDĐ (đang là 2 file lớn nhất hệ thống).
- [ ] Dọn dẹp cột dữ liệu dư thừa, xác minh lại công thức tính hạn chứng chỉ ATVSLĐ trên dữ liệu cũ.

---

> 💡 Tra tính năng ở đây trước khi hỏi AI. Khi cần sửa code, chuyển sang `ARCHITECTURE.md` để biết đúng file/bảng dữ liệu.
