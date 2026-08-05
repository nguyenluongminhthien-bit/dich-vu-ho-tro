# 🏢 HỆ THỐNG QUẢN TRỊ VĂN PHÒNG & AN SINH ĐỜI SỐNG (QTVP-ASDS)

Tài liệu này cung cấp bức tranh toàn cảnh 100% về kiến trúc, tất cả 12 phân hệ nghiệp vụ, cơ chế phân quyền, nguyên tắc tối ưu hiệu năng và giải thích cấu trúc file dự án **QTVP-ASDS**.

---

## 1. TỔNG QUAN HỆ THỐNG & CÔNG NGHỆ (SYSTEM OVERVIEW & TECH STACK)

### 1.1. Mục tiêu Hệ thống
* **Mục tiêu:** Số hóa, chuẩn hóa và quản trị tập trung toàn bộ các mảng nghiệp vụ: **QTVP&ASĐS - Nhân sự - Tài sản - Xe - Thiết bị - PCCC - ATVSLĐ - An ninh Bảo vệ - VTLT - Báo cáo** cho hệ thống Đơn vị Công ty Tỉnh thành/Showroom/Điểm bán hàng trực thuộc trên toàn quốc.
* **Mô hình kiến trúc:** Single Page Application (SPA) React + TypeScript kết hợp Supabase REST API & Smart Two-Layer Cache.
* **Cơ chế phân quyền:** Quản trị phân quyền dựa trên cây dữ liệu đệ quy (Hierarchy-based Access Control) kết hợp vai trò người dùng (Role-based Access Control).

### 1.2. Công nghệ sử dụng (Tech Stack)
* **Core Frontend:** React 19, TypeScript 5.8 (Strict Type Checking), Vite 6.
* **Giao diện & Biểu tượng:** Tailwind CSS v4, Lucide React Icons, Motion (Framer Motion).
* **Mã QR & Tiện ích:** `qrcode.react`, `html5-qrcode` (Quét & tạo mã QR tài sản).
* **Backend & Database:** Supabase (PostgreSQL Database, REST API, Row Level Security).
* **Xuất Báo cáo & Excel:** Xuất file Excel HTML/XML đa sheet hỗ trợ tiếng Việt có dấu.

---

## 2. BẢN ĐỒ TẤT CẢ 13 PHÂN HỆ NGHIỆP VỤ (MODULE SITEMAP)

Hệ thống bao gồm 13 phân hệ chính được tích hợp liền mạch trên thanh Sidebar bên trái:

```text
QTVP-ASDS App
├── 📊 01. Tổng quan (Dashboard)
├── 🏢 02. Đơn vị & Sơ đồ tổ chức (Departments)
├── 👥 03. Quản lý Nhân sự & Cước Di động (Personnel)
├── 🧯 04. Quản lý PCCC & CNCH (Fire Safety)
├── 🛡️ 05. Quản lý ATVSLĐ & Thiết bị Nghiêm ngặt (ATVSLĐ)
├── 🚗 06. Quản lý Xe & Chi phí Vận hành (Vehicles)
├── 💻 07. Quản lý Trang thiết bị & QR Code (Equipments)
├── 🤝 08. Quản lý Nhà cung cấp (Suppliers)
├── 📄 09. Quản lý Văn bản & Thông báo (Documents)
├── 📜 10. Quản lý Quy định & Quy trình (Policies)
├── 📊 11. Báo cáo Tổng hợp & Custom Builder (Reports)
├── 👤 12. Quản lý Tài khoản (Accounts)
└── 📜 13. Nhật ký Hệ thống (System Logs)
```

---

### 🟢 CHI TIẾT TÍNH NĂNG TỪNG PHÂN HỆ

#### 📊 01. Phân hệ Tổng quan (DashboardPage.tsx)
- **Hệ thống Thẻ KPI**: Hiển thị tổng số nhân sự, đơn vị, xe, thiết bị, tình hình PCCC và ATVSLĐ thuộc phạm vi quản lý.
- **Biểu đồ Nhân sự (PersonnelDoughnutChart.tsx)**: Phân tích cơ cấu nhân sự theo phân loại, thâm niên, độ tuổi và giới tính.
- **Bảng Cảnh báo Hạn (ExpiryAlertPanel.tsx)**: Tự động gom nhóm các đối tượng Sắp hết hạn / Quá hạn (Biên bản kiểm định thiết bị nghiêm ngặt, Chứng chỉ ATVSLĐ, Bảo hiểm chay nổ PCCC, Bơm sạc bình PCCC, Kiểm định xe...).
- **Tùy chỉnh Dashboard (DashboardCustomizerModal.tsx)**: Cho phép bật/tắt và sắp xếp các widget theo sở thích cá nhân.

#### 🏢 02. Phân hệ Đơn vị & Sơ đồ Tổ chức (DepartmentPage.tsx)
- **Cấu trúc Cây Đơn vị đệ quy**: Quản lý cấp quan hệ cha-con từ Văn phòng Điều hành -> Công ty Tỉnh thành -> Showroom / Điểm bán hàng.
- **Quản lý Pháp nhân (PnModal.tsx)**: Lưu giữ thông tin Mã số thuế, tên công ty, địa chỉ xuất hóa đơn, giấy phép kinh doanh.
- **Quản lý Phòng họp (PhModal.tsx)**: Quản lý vị trí, sức chứa, thiết bị trình chiếu, thiết bị họp online, layout bàn ghế.
- **Tích hợp các Sub-modal nghiệp vụ**: Nhật ký An ninh bảo vệ (SecurityModal), Phục vụ hành chính (PvhcModal), PCCC (PcccModal), ATVSLĐ (AtvsldModal), PCTT (PcttModal).

#### 👥 03. Phân hệ Quản lý Nhân sự & Cước Di động (PersonnelPage.tsx)
- **Hồ sơ Nhân sự 360°**: Quản lý đầy đủ mã nhân viên, họ tên, chức danh, bộ phận, khối, ngạch lương, thâm niên, ngày nhận việc, CCCD, thông tin xe cá nhân, bằng cấp chứng chỉ (ANBV, PCCC, CNCH, Sơ cấp cứu, Võ thuật, GPLX, Tin học, Ngoại ngữ...).
- **Quản lý Thuê bao & Cước di động (`CuocDiDongTab.tsx`)**:
  - Quản lý danh mục số thuê bao công ty cấp cho nhân sự/bộ phận.
  - Theo dõi lịch sử người sử dụng thuê bao (`lich_su_nsd`).
  - Quản lý chi tiết chi phí cước tháng phát sinh (`cp_cuoc_thang`), so sánh với snapshot định mức, hiển thị biểu đồ biến động cước (`PersonnelDetailCuocChart.tsx`, `ThueBaoDetailCuocChart.tsx`).
- **Thao tác Nghiệp vụ Nâng cao**: Tạo hồ sơ kiêm nhiệm (`handleDuplicate`), Điều chuyển / Nghỉ việc (`handleOffboardClick` - tự động kiểm tra tài sản chưa trả), Vào làm lại (`handleConfirmRehire`).
- **Xuất danh bạ (Excel)**: Chuyển đổi vai trò hiển thị và lọc từ "PT DVHT KD" thành "PT QTVP", chỉ trích xuất các nhân sự có chức vụ chính xác là "PT QTVP" hoặc "Trưởng phòng QTVP" (hỗ trợ so khớp NFC không phân biệt chữ hoa/thường). Tên file tải về định dạng: `Danh_Ba_Lanh_Dao_QTVP_YYYY-MM-DD.xls`.
- **Nhập Dán Excel Hàng Loạt (Paste Import)**: Cho phép copy-paste toàn bộ bảng Excel vào phần mềm.
  - *Quy tắc bảo toàn dữ liệu*: Bắt buộc MSNV và Họ tên. Đối với nhân sự đã tồn tại, các cột để trống trong file Excel sẽ **GIỮ NGUYÊN 100% dữ liệu cũ trong CSDL**, không bị ghi đè hay nhảy chức danh.

#### 🧯 04. Phân hệ Quản lý PCCC & CNCH (FireSafetyPage.tsx)
- **Hồ sơ Đội PCCC cơ sở**: Số lượng đội viên, khả năng huy động ban ngày/ban đêm, phương án PCCC, hotline khẩn cấp (PCCC, UBND, Công an, Điện lực, Cấp nước, Y tế).
- **Quản lý Tài sản PCCC (TS_PCCC)**: Danh mục bình chữa cháy, hệ thống báo cháy, vách tường, dụng cụ CNCH.
- **Cảnh báo Lịch Bơm Sạc & Bảo hiểm**: Hệ thống cảnh báo tự động ngày đến hạn bơm sạc bình chữa cháy và ngày hết hạn bảo hiểm cháy nổ bắt buộc.

#### 🛡️ 05. Phân hệ Quản lý ATVSLĐ & Thiết bị Nghiêm ngặt (AtvsldPage.tsx)
- **Tab 1: Hồ sơ Báo cáo Cơ sở (`HoSoTab.tsx`)**: Tự động tổng hợp số liệu huấn luyện các Nhóm 1-6 và thiết bị nghiêm ngặt từ database mà không cần nhập tay.
- **Tab 2: Kế hoạch Đào tạo đợt tới (`KeHoachTab.tsx`)**: Quét và phân loại tự động nhân sự thành 4 diện: *Chưa học*, *Quá hạn*, *Sắp hết hạn (<60 ngày)*, *An toàn*. Hỗ trợ xuất danh sách Excel theo mẫu.
- **Tab 3: Khóa học Huấn luyện (`KhoaHocTab.tsx`)**: Quản lý các đợt đào tạo, nhập danh sách học viên qua dán Excel. Hỗ trợ **Đồng bộ chứng chỉ ngầm (Background Batch Sync)** cập nhật ngược về hồ sơ nhân sự theo lô (batch size 15).
- **Tab 4: Thiết bị yêu cầu Nghiêm ngặt về ATLĐ (`StrictEquipmentTab.tsx`)**:
  - Quản lý danh mục thiết bị có yêu cầu nghiêm ngặt (xe nâng, nồi hơi, thang máy, bình chịu áp lực...).
  - Quản lý nhật ký/lịch sử kiểm định (`nk_kiem_dinh_tbnn`), đơn vị kiểm định, chi phí, link biên bản PDF.
  - Cảnh báo thời hạn kiểm định qua huy hiệu màu chuẩn: *Đỏ (Quá hạn)*, *Cam (Dưới 30 ngày)*, *Vàng (Dưới 60 ngày)*, *Xanh (An toàn)*.
- **⚠️ Tab 5: Khám sức khỏe & Bệnh nghề nghiệp — MỚI XÁC MINH (chưa có trong tài liệu gốc):** Đã có khung giao diện (`activeTab === 'khamsuckhoe'`) hiển thị thông báo "đang được lên kế hoạch phát triển", nhưng **CHƯA có bảng dữ liệu Supabase, chưa có component riêng, chưa nhập liệu được**. Đây là phân hệ thứ 5 thực tế trong module ATVSLĐ, cần bổ sung khi triển khai.

#### 🚗 06. Phân hệ Quản lý Xe & Chi phí Vận hành (VehiclePage.tsx)
- **Master Tài sản Xe (TS_Xe)**: Quản lý biển số, loại phương tiện, hiệu xe, số khung, số máy, năm sản xuất, hình thức sở hữu, GPS, hiện trạng.
- **Nhật ký Chi phí Vận hành (CP_HoatDongXe)**: Theo dõi số km, số lít nhiên liệu, chi phí nhiên liệu, cầu đường bến bãi, rửa xe, bảo dưỡng sửa chữa, khấu hao theo từng tháng/năm.

#### 💻 07. Phân hệ Quản lý Trang thiết bị & QR Code (EquipmentPage.tsx)
- **Master Thiết bị CNTT & Văn phòng**: Quản lý mã tài sản, tên thiết bị, nhóm, thông số kỹ thuật (CPU, RAM, SSD, VGA, màn hình...), hạn bảo hành, nhà cung cấp.
- **Nhật ký Thiết bị (NhatKyThietBi)**: Ghi nhận lịch sử bàn giao người sử dụng, phòng ban quản lý, lịch sử sửa chữa, nâng cấp, báo hỏng, chi phí.
- **Deep Link & Quét mã QR**: Tạo mã QR tài sản (`qrcode.react`), hỗ trợ quét mã QR qua camera (`html5-qrcode`) hoặc truy cập thẳng qua URL `/?tab=equipment&qr=MÃ_TÀI_SẢN` để mở ngay chi tiết thiết bị.

#### 🤝 08. Phân hệ Quản lý Nhà cung cấp (SupplierPage.tsx)
- **Quản lý Đối tác & Nhà cung cấp**: Quản lý đầy đủ danh sách nhà cung cấp dịch vụ hành chính/tiện ích/kỹ thuật cho các đơn vị trên toàn quốc (16 nhóm dịch vụ cố định).
- **Bộ lọc đa chiều**: Lọc đệ quy theo Cây đơn vị (Unit Tree), phân nhóm dịch vụ, trạng thái hợp tác (Đang hợp tác/Ngừng hợp tác) và tìm kiếm thông tin nhanh.
- **Quản lý Hợp đồng & Thời hạn**: Tự động tính toán và hiển thị huy hiệu cảnh báo thời hạn hết hạn hợp đồng nếu còn dưới 30 ngày (sử dụng hàm kiểm tra `getExpiryStatus`).
- **Modal Thao tác Nghiệp vụ**: Xem chi tiết toàn diện thông tin doanh nghiệp, thông tin liên hệ đầu mối trực tiếp, đánh giá dịch vụ, và dán đường dẫn file hồ sơ năng lực trực tuyến.

#### 📄 09. Phân hệ Quản lý Văn bản & Thông báo (DocumentPage.tsx)
- **Phân loại Văn bản**: Quản lý văn bản đến/đi, thông báo, quyết định, quy định.
- **Phân quyền thao tác**:
  - Chỉ đơn vị ban hành hoặc HO Admin mới có quyền Sửa/Xóa văn bản đó.
  - Các đơn vị khác chỉ có quyền Xem (Read-only).
- **Auto-fill Người lấy số**: Nhập mã nhân viên tự động điền Họ tên và Bộ phận lấy số.

#### 📜 10. Phân hệ Quản lý Quy định & Quy trình (PolicyPage.tsx)
- Lưu trữ, phân loại và tra cứu các quy định hành chính, quy trình làm việc chuẩn áp dụng trong toàn hệ thống.

#### 📊 11. Phân hệ Báo cáo Tổng hợp & Custom Builder (ReportPage.tsx)
- **Mẫu báo cáo Cấu trúc Đơn vị (`ReportList.tsx`)**: Tổng hợp sơ đồ và thông tin liên hệ đơn vị.
- **Mẫu báo cáo Pháp nhân Hóa đơn**: Tổng hợp mã số thuế và tên công ty xuất hóa đơn.
- **Mẫu báo cáo Khảo sát An ninh Bảo vệ 13 mục**: Cho phép xuất file Excel đa Worksheet (mỗi đơn vị/showroom 1 Sheet) theo đúng chuẩn khảo sát AN-BV.
- **Trình dựng Báo cáo Tùy chỉnh (`CustomReportBuilder.tsx`)**: Cho phép chọn bảng dữ liệu, chọn cột hiển thị, thiết lập bộ lọc và xuất file Excel theo ý muốn.
- **Tải Form Nhập Hàng Loạt**: Tích hợp khu vực tải tập trung 4 biểu mẫu dán Excel chuẩn hóa (Nhân sự, Học viên ATVSLĐ, Thiết bị nghiêm ngặt, Trang thiết bị văn phòng) ngay bên dưới mục "VĂN BẢN". Mỗi file tải về bao gồm cấu trúc cột hoàn chỉnh và kèm theo đúng 1 dòng dữ liệu ví dụ thực tế hợp lệ (đáp ứng đầy đủ các kiểm duyệt định dạng ngày tháng `dd/mm/yyyy`, CCCD, nhóm,...), giúp người dùng dễ tham khảo và chạy thử nghiệm dán mẫu thành công không phát sinh lỗi.

#### 👤 12. Phân hệ Quản lý Tài khoản (AccountPage.tsx)
- **Quản lý Người dùng**: Tạo mới, cập nhật thông tin tài khoản, cấp lại mật khẩu.
- **Phân quyền chi tiết (Granular Permissions)**: Phân quyền theo Cây đơn vị (`id_don_vi`) và Phân quyền Module thanh menu (`quyen_truy_cap`).

#### 📜 13. Phân hệ Nhật ký Hệ thống (LogPage.tsx)
- **Ghi vết Tự động (SysLog)**: Tự động lưu vết lịch sử Đăng nhập, Đăng xuất, Thêm mới, Cập nhật, Xóa bản ghi của tất cả người dùng kèm thời gian và IP/thông tin thao tác.

---

## 3. KIẾN TRÚC KỸ THUẬT & TỐI ƯU HIỆU NĂNG (PERFORMANCE ARCHITECTURE)

### 3.1. Bộ Đệm 2 Tầng Thông Minh (Smart Two-Layer Cache)
Nằm trong `src/services/api/cache.ts`:
1. **Layer 1 - In-Memory Cache**: Trả về dữ liệu siêu tốc (<1ms) trong phiên làm việc đối với các bảng chưa hết hạn TTL (5 phút).
2. **Layer 2 - Persistent LocalStorage Cache**: Lưu bản nạp dữ liệu offline.
   - *Cơ chế an toàn*: Tự động bắt lỗi `QuotaExceededError` khi `localStorage` chạm ngưỡng 5MB, tự động dọn dẹp cache cũ và hạ cấp mượt mà xuống In-Memory cache mà không làm đơ/crash ứng dụng.

### 3.2. Quản lý Render DOM Thông Minh (TabContainer Optimization)
Trong `src/App.tsx`:
- Sử dụng `React.memo` cho `TabContainer`.
- Khi chuyển đổi tab, các tab không active sẽ được gán thuộc tính `hidden` (`display: none`), ngắt hoàn toàn pipeline tính toán Layout/Paint/Compositing của trình duyệt giúp chuyển tab nhẹ và cuộn trang mượt mà.

### 3.3. Thuật Toán Tra Cứu Map O(1)
Trong `src/pages/PersonnelPage.tsx`:
- Thay thế tìm kiếm mảng đệ quy O(N) `.find()` trong các hàm tra cứu tên đơn vị bằng `donViLookupMap` dạng `Map<string, DonVi>` cho tốc độ tra cứu O(1), tối ưu cho bảng dữ liệu chứa hàng ngàn nhân sự.

### 3.4. Cổng ghi dữ liệu duy nhất (đã xác minh trực tiếp trong `services/api/modules.ts`)
- Toàn bộ thao tác **Đọc** đi qua các hàm `getX()` (VD `getPersonnel()`, `getThietBi()`...), có cơ chế fallback tự động sang dữ liệu offline (`getLocalRecords`) nếu Supabase lỗi.
- Toàn bộ thao tác **Ghi/Sửa** bắt buộc qua `apiService.save(data, action, tableName)` — hàm tự làm sạch payload, tự sinh `id`, và tự gọi `invalidateCache()` + `writeLog()` (ghi Audit log). Không được gọi thẳng Supabase REST trong component.
- Toàn bộ thao tác **Xóa** qua `apiService.deleteRecord(id, tableName)`.

---

## 4. GIẢI THÍCH CẤU TRÚC FILE DỰ ÁN (HÌNH 1 VS HÌNH 2)

Dưới đây là giải thích chi tiết lý do vì sao phiên bản gốc (Hình 1) chỉ có các file cơ bản, và phiên bản hiện tại (Hình 2) phát sinh thêm một số file ngoài thư mục root:

```text
📁 Cấu trúc Thư mục Root
├── 📂 dist/                      # [Có ở cả 2 hình] Chứa sản phẩm đã build (HTML, JS, CSS)
├── 📂 node_modules/              # [Mới ở Hình 2] Thư mục chứa thư viện npm (phát sinh khi chạy npm install)
├── 📂 public/                    # [Có ở cả 2 hình] Chứa tài nguyên tĩnh (favicon, logo)
├── 📂 src/                       # [Có ở cả 2 hình] Thư mục chứa 100% mã nguồn React TypeScript
├── 📄 .gitignore                 # [Mới ở Hình 2] File cấu hình Git loại trừ các thư mục rác (dist, node_modules)
├── 📄 ARCHITECTURE.md            # [Mới ở Hình 2] Tài liệu mô tả kiến trúc mã nguồn dành cho AI/Developer
├── 📄 deptTabStats_restored.ts   # [Mới ở Hình 2] File nháp tạm khôi phục code (đã loại trừ khỏi build)
├── 📄 find_stats.cjs             # [Mới ở Hình 2] Script công cụ hỗ trợ tìm kiếm code nội bộ
├── 📄 find_stats.js              # [Mới ở Hình 2] Script công cụ hỗ trợ tìm kiếm code nội bộ
├── 📄 search_results.txt         # [Mới ở Hình 2] File văn bản lưu kết quả xuất ra từ script tìm kiếm
├── 📄 index.html                 # [Có ở cả 2 hình] File HTML gốc của ứng dụng React SPA
├── 📄 metadata.json              # [Có ở cả 2 hình] File thông tin cấu hình dự án
├── 📄 package.json               # [Có ở cả 2 hình] File khai báo danh sách thư viện phụ thuộc
├── 📄 package-lock.json          # [Có ở cả 2 hình] File khóa phiên bản chính xác của các gói npm
├── 📄 README.md                  # [Có ở cả 2 hình] Tài liệu hướng dẫn sử dụng và tổng quan nghiệp vụ này
├── 📄 tsconfig.json              # [Có ở cả 2 hình] File cấu hình trình biên dịch TypeScript (đã chỉnh include src)
└── 📄 vite.config.ts             # [Có ở cả 2 hình] File cấu hình đóng gói Vite (đã chỉnh emptyOutDir: false)
```

### 💡 Bảng so sánh & Giải thích nguyên nhân phát sinh:

| File / Thư mục phát sinh | Nguyên nhân xuất hiện | Chức năng & Vai trò |
| :--- | :--- | :--- |
| **`node_modules/`** | Phát sinh khi thực hiện chạy lệnh `npm install` hoặc khởi chạy môi trường dev. | Chứa toàn bộ bộ mã nguồn của các thư viện dependency (React, Vite, Tailwind, Supabase...). |
| **`.gitignore`** | Được khởi tạo để quản lý phiên bản mã nguồn Git. | Khai báo danh sách file/folder không cần đẩy lên kho lưu trữ code (như `node_modules`, `dist`). |
| **`ARCHITECTURE.md`** | Tài liệu kỹ thuật dành riêng cho AI/Developer đọc trước khi sửa code. | Bản đồ kiến trúc mã nguồn, bảng ánh xạ Tính năng ↔ File ↔ Bảng Supabase, quy ước code, nợ kỹ thuật. |
| **`deptTabStats_restored.ts`** | File nháp phát sinh trong phiên khôi phục đoạn tính toán thống kê phòng ban cũ. | File code nháp ngoài root (đã được cấu hình loại trừ khỏi dự án trong `tsconfig.json`). |
| **`find_stats.cjs` / `.js`** | Script nhỏ bằng Node.js được tạo ra để tìm kiếm code. | Công cụ phụ trợ quét và định vị đoạn code tính toán trong dự án. |
| **`search_results.txt`** | File kết quả do script tìm kiếm xuất ra. | File lưu nhật ký văn bản kết quả tìm kiếm. |

---

## 5. HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH (OPERATIONAL GUIDE)

### 5.1. Chạy trên máy Cục bộ (Local Development)
1. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
2. Chạy Server phát triển tại cổng 3000:
   ```bash
   npm run dev
   ```
3. Truy cập trình duyệt tại địa chỉ: [http://127.0.0.1:3000/](http://127.0.0.1:3000/) hoặc [http://localhost:3000/](http://localhost:3000/)

### 5.2. Kiểm tra Cú pháp & Đóng gói Production
1. Kiểm tra linter & kiểu dữ liệu TypeScript (Strict mode):
   ```bash
   npx tsc --noEmit
   ```
2. Đóng gói sản phẩm sản xuất (Output xuất ra thư mục `dist/`):
   ```bash
   npx vite build
   ```

---

## 6. NGUYÊN TẮC PHÁT TRIỂN & BẢO TRÌ DÀNH CHO AI / DEVELOPERS

> ⚠️ **2 NGUYÊN TẮC LÀM VIỆC BẮT BUỘC KHI CẬP NHẬT CODE:**
> 1. **Nguyên tắc 1 (Trình bày tóm tắt trước khi code)**: Trước bất kỳ lần sửa đổi mã nguồn nào, phải lập bản tóm tắt phương án triển khai rõ ràng, người dùng xem và bấm **Đồng ý** thì mới được phép ghi code.
> 2. **Nguyên tắc 2 (Không tự ý bỏ / thay thế tính năng)**: Tuyệt đối không tự ý xóa bỏ hoặc thay thế bất kỳ tính năng, liên kết hay trường dữ liệu nào. Nếu bắt buộc phải thay đổi, phải giải thích lý do và có sự đồng ý của người dùng mới được triển khai.
> 3. **Nguyên tắc 3 (Đồng bộ tài liệu bắt buộc)**: Sau khi hoàn thành bất kỳ thay đổi code nào (thêm/sửa/xóa tính năng, đổi bảng Supabase, thêm file mới...), AI PHẢI tự đề xuất nội dung cần cập nhật vào ĐÚNG 1 trong 2 file:
>    - Thay đổi thuộc về **nghiệp vụ/tính năng người dùng thấy được** (tab mới, quy tắc nhập liệu mới, cách vận hành...) → cập nhật `README.md` (mục 2 tương ứng phân hệ, hoặc mục 7 nếu là vấn đề kỹ thuật cần lưu ý).
>    - Thay đổi thuộc về **cấu trúc code** (file mới, đổi tên bảng Supabase, đổi luồng gọi API, nợ kỹ thuật mới phát sinh...) → cập nhật `ARCHITECTURE.md` mục 3 (bảng ánh xạ) hoặc mục 7 (nợ kỹ thuật).
>    - Nếu thay đổi ảnh hưởng cả 2 khía cạnh, phải đề xuất cập nhật CẢ 2 file.
>    - AI không tự ý sửa file tài liệu — chỉ đề xuất nội dung, chờ bạn duyệt rồi mới ghi.

---

## 7. VẤN ĐỀ KỸ THUẬT ĐÃ XÁC MINH TRỰC TIẾP TRONG CODE (cập nhật mới nhất)

> Mục này được thêm sau khi quét toàn bộ 81 file `.ts/.tsx` thật trong `src/` (không suy đoán). Xem chi tiết bảng ánh xạ Tính năng ↔ File ↔ Bảng Supabase đầy đủ tại `ARCHITECTURE.md`.

- **Cơ chế xác định Đơn vị mặc định khi truy cập hệ thống**: Tự động chọn đơn vị mặc định khi truy cập bất kỳ phân hệ nào qua hàm `getDefaultUnitId(user, donViList)` trong `src/utils/hierarchy.ts`. Tài khoản Admin/Toàn quyền sẽ hiển thị mặc định đơn vị **THACO AUTO**, tài khoản thường (Showroom, điểm bán lẻ) sẽ hiển thị **Đơn vị mẹ quản lý** (Công ty tỉnh thành) của tài khoản đó.
- **Tab "Khám sức khỏe & Bệnh nghề nghiệp"** (mục 2, phân hệ 05) mới là khung giao diện placeholder, chưa có dữ liệu — xem mục 2 phía trên.
- **`utils/logger.ts` và `utils/logger.tsx` bị trùng lặp**: cả 2 file cùng export hàm `generateDiffLog()`. Cần xác định file nào thực sự đang được import ở nơi khác trong dự án và xóa file thừa để tránh nhầm lẫn khi bảo trì.
- **Bảng `dm_chu_ky_atvsld`**: có hàm đọc `getChuKyATVSLD()` khai báo sẵn trong `services/api/modules.ts`, nhưng không tìm thấy nơi nào trong `pages/` hoặc `components/` gọi hàm này — cần kiểm tra lại thủ công (có thể là bảng chưa nối vào UI, hoặc đã đổi tên biến ở nơi khác).
- **`services/api/client.ts`** chứa `SUPABASE_ANON_KEY` hardcode trực tiếp trong source. Đây là anon key public (được bảo vệ bởi Row Level Security phía Supabase) nên không phải lỗi bảo mật nghiêm trọng, nhưng nên cân nhắc chuyển sang biến môi trường (`.env` + `import.meta.env` của Vite) để thuận tiện đổi giữa môi trường dev/production.
- **2 file lớn nhất hệ thống** (ứng viên hàng đầu nếu cần tách nhỏ để dễ bảo trì): `components/personnel/CuocDiDongTab.tsx` (3.366 dòng) và `pages/PersonnelPage.tsx` (2.851 dòng).
- **Lỗi trùng khớp kết quả OSH (ATVSLĐ) "Chưa đạt"**: Các hàm kiểm tra kết quả học viên đạt trong `KhoaHocTab.tsx`, `HoSoTab.tsx` và `AtvsldPage.tsx` ban đầu sử dụng phương thức `.includes('đạt')` / `.includes('dat')`, gây ra lỗi logic nhận nhầm trạng thái "Chưa đạt" thành "Đạt" (do có chứa từ khóa "đạt"). Đã được khắc phục hoàn toàn bằng cách so khớp chính xác (`=== 'đạt' || === 'dat'`) sau khi chuyển chữ thường, loại bỏ khoảng trắng và chuẩn hóa Unicode bằng `.normalize('NFC')` để chống lệch dấu tiếng Việt.

#### 📄 08. Phân hệ Quản lý Văn bản & Thông báo (DocumentPage.tsx)
- **Line Tab chuyển đổi mượt mà (LineTabs.tsx)**: Phân hệ chuyển đổi giữa các loại văn bản sử dụng component dùng chung `LineTabs.tsx` với hiệu ứng trượt gạch chân mượt mà bằng Framer Motion, đồng bộ thiết kế không đóng khung thống nhất.
- **Cấp số hiệu tự động (Auto-numbering)**: Tích hợp checkbox "Số tự động" cạnh ô Số hiệu giúp tự động tính toán số hiệu tiếp theo dạng `[số]/[năm]/[loại]-[đơn vị]` dựa trên phân loại, đơn vị ban hành, năm hiện hành và viết tắt chức danh người ký.
- **Cấu trúc Component hóa (Modular architecture)**: Tách mã nguồn hiển thị bảng dữ liệu của từng loại văn bản thành các file `.tsx` riêng biệt (`AllDocTable`, `ThongBaoTable`, `QuyetDinhTable`, `CongVanDenTable`, `CongVanDiTable`, `ToTrinhTable`) giúp dễ bảo trì và tối ưu cột hiển thị riêng cho mỗi loại.
- **Copy nhanh Thông tin phản hồi**: Hỗ trợ nút sao chép thông tin phản hồi định dạng chuẩn bên cạnh mục Ban hành trong bảng Chi tiết Văn bản để phản hồi ngay cho người xin cấp số (bao gồm Số hiệu, Nội dung, Ngày ban hành, Người phê duyệt, Nhân sự & Bộ phận trình).