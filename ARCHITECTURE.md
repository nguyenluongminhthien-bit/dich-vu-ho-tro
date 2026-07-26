# 🏗️ KIẾN TRÚC MÃ NGUỒN TSX & DỰ ÁN QTVP-ASDS

Tài liệu này quy hoạch toàn bộ kiến trúc mã nguồn TypeScript React (`.tsx` & `.ts`), sơ đồ phân cấp Component, các Layer xử lý dữ liệu và luồng giao tiếp giữa các phân hệ trong hệ thống **QTVP-ASDS**.

---

## 1. TỔNG QUAN CẤU TRÚC THƯ MỤC MÃ NGUỒN (`src/`)

```text
src/
├── App.tsx                     # Component gốc điều hướng Tab, Code Splitting & Deep Link
├── main.tsx                    # File khởi chạy ứng dụng (Entry Point)
├── index.css                   # System CSS, Tailwind Tokens, Dark Mode PII Styles
│
├── components/                 # TẦNG COMPONENT (Giao diện & Modals)
│   ├── atvsld/                 # Components phân hệ ATVSLĐ & Thiết bị nghiêm ngặt
│   ├── common/                 # Components dùng chung chuẩn hóa (EmptyState, TablePagination)
│   ├── dashboard/              # Widgets trang Tổng quan (Chart, KPI, Alert Panel)
│   ├── department/             # Modals phòng ban (Pháp nhân, Phòng họp, An ninh, PCCC...)
│   ├── personnel/              # Components Nhân sự & Phân hệ Cước di động
│   ├── report/                 # Trình dựng báo cáo động & Preview Table
│   ├── ui/                     # UI Primitives (Button, Modal, Autocomplete, Sidebar Filter)
│   ├── ExpiryAlert.tsx         # Banner cảnh báo thời hạn khẩn cấp
│   ├── ExpiryBadge.tsx         # Huy hiệu trạng thái thời hạn (Quá hạn, Sắp hết, An toàn)
│   ├── Sidebar.tsx             # Thanh Menu điều hướng bên trái
│   └── SkeletonLoader.tsx      # Khung xương chờ tải dữ liệu (Loading Skeletons)
│
├── constants/                  # TẦNG HẰNG SỐ & MẪU DỮ LIỆU
│   ├── certificates.ts         # Danh mục loại chứng chỉ & bằng cấp nghiệp vụ
│   └── reportTemplates.ts      # Cấu hình các mẫu báo cáo chuẩn hệ thống
│
├── contexts/                   # TẦNG STATE TOÀN CỤC
│   └── AuthContext.tsx         # Quản lý phiên Đăng nhập & Phân quyền Module (checkPermission)
│
├── hooks/                      # TẦNG CUSTOM HOOKS
│   ├── useAllowedUnits.ts      # Tính toán danh sách Đơn vị đệ quy được phép truy cập
│   └── useDebounce.ts          # Chống giật lag khi gõ phím tìm kiếm thời gian thực
│
├── pages/                      # TẦNG TRANG PHÂN HỆ NGHIỆP VỤ (12 MODULES)
│   ├── AccountPage.tsx         # [11] Quản lý Tài khoản & Phân quyền
│   ├── AtvsldPage.tsx          # [05] Quản lý ATVSLĐ & Thiết bị Nghiêm ngặt
│   ├── DashboardPage.tsx       # [01] Trang Tổng quan KPI & Biểu đồ
│   ├── DepartmentPage.tsx      # [02] Quản lý Đơn vị & Sơ đồ Tổ chức
│   ├── DocumentPage.tsx        # [08] Quản lý Văn bản & Thông báo
│   ├── EquipmentPage.tsx       # [07] Quản lý Trang thiết bị & Mã QR
│   ├── FireSafetyPage.tsx      # [04] Quản lý PCCC & Cứu nạn Cứu hộ
│   ├── LogPage.tsx             # [12] Nhật ký Hệ thống (Audit Logs)
│   ├── LoginPage.tsx           # Trang Đăng nhập hệ thống
│   ├── PersonnelPage.tsx       # [03] Quản lý Nhân sự & Cước Di động
│   ├── PolicyPage.tsx          # [09] Quản lý Quy định & Quy trình
│   ├── ReportPage.tsx          # [10] Báo cáo Tổng hợp & Custom Builder
│   └── VehiclePage.tsx         # [06] Quản lý Xe & Chi phí Vận hành
│
├── services/                   # TẦNG GIAO TIẾP DỮ LIỆU (SUPABASE REST API & CACHE)
│   ├── api/
│   │   ├── auth.ts             # Xử lý API Đăng nhập
│   │   ├── cache.ts            # Bộ đệm 2 tầng (In-Memory + LocalStorage Quota Safe)
│   │   ├── client.ts           # Cấu hình Supabase REST Endpoint & Headers
│   │   ├── localStore.ts       # CSDL LocalStorage dự phòng (Mock Mode)
│   │   ├── logs.ts             # Tác vụ ghi vết nhật ký tự động (writeLog)
│   │   ├── mockData.ts         # Bộ dữ liệu mẫu ban đầu
│   │   └── modules.ts          # Lớp giao tiếp CRUD các bảng Supabase
│   └── api.ts                  # Export tập trung cổng giao tiếp apiService
│
├── types/                      # TẦNG ĐỊNH NGHĨA KIỂU DỮ LIỆU TYPESCRIPT
│   └── index.ts                # TypeScript Interfaces (Personnel, DonVi, TS_Xe, VB_TB...)
│
└── utils/                      # TẦNG THƯ VIỆN TIỆN ÍCH (HELPERS)
    ├── atvsld.ts               # Thuật toán tính toán chu kỳ chứng chỉ ATVSLĐ
    ├── expiryStatus.ts         # Tính toán số ngày còn lại & mức độ cảnh báo thời hạn
    ├── exportExcel.ts          # Xuất báo cáo Khảo sát An ninh & Danh bạ Lãnh đạo
    ├── exportReports.ts        # Xuất file Excel HTML/XML đa worksheet
    ├── formatters.ts           # Format số điện thoại, tiền tệ, ngày tháng tiếng Việt
    ├── hierarchy.ts            # Xử lý cấu trúc Cây Đơn vị đệ quy & Sắp xếp thứ tự
    ├── logger.ts               # Helper ghi log console & audit
    ├── mathEvaluator.ts        # Bộ tính toán công thức báo cáo động
    └── toast.ts                # Thông báo Pop-up hệ thống (Toast Alerts)
```

---

## 2. SƠ ĐỒ PHÂN CẤP COMPONENT (`COMPONENT HIERARCHY`)

### 2.1. Component Gốc (`App.tsx`)
- **Vai trò:** Trung tâm điều phối ứng dụng.
- **Cơ chế Code Splitting:** Lazy-load 12 trang Module chính qua `React.lazy` và `React.Suspense` để tối ưu thời gian nạp trang đầu.
- **Tối ưu TabContainer:** Bọc từng trang phân hệ bằng `TabContainer` được tối ưu hóa với `React.memo` và class `hidden` (`display: none`) nhằm ngắt pipeline tính toán Render của trình duyệt đối với các tab đang ẩn.
- **Xử lý Deep Link:** Nhận dạng tham số URL quét mã QR `/?tab=equipment&qr=MÃ_TÀI_SẢN` để mở ngay chi tiết thiết bị.

---

### 2.2. Chi tiết Kiến trúc từng Trang Phân hệ (`pages/`) & Sub-components

#### 1. `DashboardPage.tsx` (Trang Tổng quan)
- **Tệp con tích hợp:**
  - `KpiSection.tsx`: Thẻ chỉ số tổng quan.
  - `PersonnelDoughnutChart.tsx`: Biểu đồ cơ cấu nhân sự.
  - `ExpiryAlertPanel.tsx`: Khung danh sách cảnh báo đến hạn.
  - `DashboardCustomizerModal.tsx`: Pop-up bật/tắt hiển thị widget.

#### 2. `DepartmentPage.tsx` (Quản lý Đơn vị & Sơ đồ Tổ chức)
- **Modals nghiệp vụ đi kèm:**
  - `PnModal.tsx`: Form thêm/sửa thông tin Pháp nhân & MST xuất hóa đơn.
  - `PhModal.tsx`: Form quản lý thiết bị & sức chứa Phòng họp.
  - `PvhcModal.tsx`: Form cập nhật thông tin Phục vụ Hành chính.
  - `SecurityModal.tsx`: Khung khảo sát & nhật ký An ninh Bảo vệ.
  - `PcccModal.tsx`: Khung hồ sơ thiết bị & phương án PCCC.
  - `AtvsldModal.tsx`: Form báo cáo ATVSLĐ đơn vị.
  - `PcttModal.tsx`: Form phương án Phòng chống Thiên tai.
  - `PersonnelCard.tsx`: Card hiển thị nhân sự phụ trách gọn đẹp.

#### 3. `PersonnelPage.tsx` (Quản lý Nhân sự & Cước Di động)
- **Sub-components & Modals đi kèm:**
  - `CuocDiDongTab.tsx`: Tab quản lý danh mục thuê bao công ty & chi phí cước tháng.
  - `PersonnelDetailCuocChart.tsx`: Biểu đồ lịch sử cước cá nhân.
  - `ThueBaoDetailCuocChart.tsx`: Biểu đồ lịch sử cước thuê bao.
  - `ThueBaoCuocHistorySection.tsx`: Bảng lịch sử luân chuyển người dùng thuê bao.
  - `PersonnelModal.tsx`: Drawer form cập nhật 360° thông tin hồ sơ nhân viên.
  - `UnitFilterSidebar.tsx`: Sidebar chọn cây đơn vị trực thuộc.
  - `TablePaginationFooter.tsx`: Thanh phân trang mượt mà.

#### 4. `AtvsldPage.tsx` (Quản lý ATVSLĐ & Thiết bị Nghiêm ngặt)
- **Tabs trực thuộc:**
  - `HoSoTab.tsx`: Báo cáo tự động tình hình ATVSLĐ các đơn vị.
  - `KeHoachTab.tsx`: Lập kế hoạch đào tạo đợt tới cho 4 diện nhân sự.
  - `KhoaHocTab.tsx`: Quản lý khóa học & đồng bộ chứng chỉ ngầm (Background Batch Sync).
  - `StrictEquipmentTab.tsx`: Quản lý danh mục thiết bị có yêu cầu nghiêm ngặt về ATLĐ & nhật ký kiểm định.

#### 5. `EquipmentPage.tsx` (Quản lý Trang thiết bị & QR Code)
- **Thành phần đi kèm:**
  - Tích hợp thư viện `qrcode.react` (Tạo mã QR) & `html5-qrcode` (Quét QR qua Camera).
  - Modal xem chi tiết nhật ký bàn giao/sửa chữa thiết bị.

#### 6. `VehiclePage.tsx` (Quản lý Xe & Chi phí Vận hành)
- Bảng danh mục xe master & Form nhật ký chi phí nhiên liệu, rửa xe, bảo dưỡng, khấu hao tháng.

#### 7. `FireSafetyPage.tsx` (Quản lý PCCC & CNCH)
- Bảng quản lý đội PCCC cơ sở, danh mục tài sản PCCC, hotline khẩn cấp và cảnh báo hạn bơm sạc/bảo hiểm.

#### 8. `DocumentPage.tsx` (Quản lý Văn bản & Thông báo)
- Quản lý văn bản đến/đi, tự động cấp số văn bản, khóa quyền Sửa/Xóa đối với văn bản do đơn vị khác ban hành.

#### 9. `ReportPage.tsx` (Báo cáo Tổng hợp & Custom Builder)
- **Sub-components:**
  - `ReportList.tsx`: Thư viện các mẫu báo cáo chuẩn.
  - `ReportFilterBar.tsx`: Toolbar thiết lập bộ lọc động.
  - `ReportPreviewTable.tsx`: Bảng xem trước dữ liệu trước khi xuất Excel.
  - `CustomReportBuilder.tsx`: Trình dựng báo cáo ad-hoc theo ý muốn.

#### 10. `AccountPage.tsx` (Quản lý Tài khoản)
- Form cấp tài khoản mới, phân quyền theo cây đơn vị và phân quyền module menu (`quyen_truy_cap`).

#### 11. `LogPage.tsx` (Nhật ký Hệ thống)
- Bảng xem nhật ký audit log các thao tác Đăng nhập, Đăng xuất, Thêm, Sửa, Xóa.

#### 12. `PolicyPage.tsx` (Quản lý Quy định & Quy trình)
- Danh mục tra cứu các quy trình hành chính chuẩn.

---

### 2.3. Các Components Dùng Chung Chế Bản (`common/` & `ui/`)
- `EmptyState.tsx`: Hiển thị thông điệp hình ảnh khi bảng trống hoặc không tìm thấy kết quả lọc.
- `TablePaginationFooter.tsx`: Thanh phân trang mượt mà hỗ trợ tùy chọn 10, 20, 50, 100 dòng/trang.
- `PasteImportModal.tsx`: Dialog hỗ trợ dán trực tiếp bảng từ Excel qua Clipboard.
- `CustomAutocomplete.tsx`: Ô chọn dữ liệu có tính năng gõ tìm kiếm thông minh.
- `UnitFilterSidebar.tsx`: Khung chọn danh sách cây đơn vị dạng nhánh xòe/gập.

---

## 3. LUỒNG DỮ LIỆU & BỘ ĐỆM 2 TẦNG (`SERVICES LAYER`)

```text
React Pages / Components
         │
         ▼
    apiService (src/services/api/index.ts)
         │
         ├───────────────────────────┐
         ▼                           ▼
fetchWithCache()              save() / deleteRecord()
(src/services/api/cache.ts)    (src/services/api/modules.ts)
         │                           │
  ┌──────┴──────┐                    ▼
  │             │              invalidateCache()
  ▼             ▼             (Xóa cache liên quan)
Layer 1       Layer 2                │
In-Memory    LocalStorage            ▼
  Cache        Persistent       Supabase REST API
 (<1ms)       (Quota Safe)   (https://...supabase.co)
```

1. **Khi Đọc (`GET`)**: Gọi `fetchWithCache()`. Hệ thống ưu tiên đọc từ **Layer 1 (RAM)** -> nếu hết hạn đọc **Layer 2 (LocalStorage)** -> nếu không có mới bắn request tới **Supabase REST API**.
2. **Khi Ghi (`POST/PATCH/DELETE`)**: Gọi `save()` hoặc `deleteRecord()`. Sau khi Supabase phản hồi thành công, hệ thống tự động chạy `invalidateCache()` để xóa bộ đệm của bảng đó và các bảng liên quan (Dependencies), đảm bảo dữ liệu hiển thị luôn chính xác nhất.
3. **An toàn Bộ nhớ LocalStorage**: Hàm `setPersistentCache` tự động xử lý ngoại lệ `QuotaExceededError` khi bộ nhớ `localStorage` chạm ngưỡng 5MB, giúp ứng dụng tự động dọn dẹp cache cũ và tiếp tục chạy mượt trên RAM.

---

## 4. QUY TRÌNH PHÁT TRIỂN & BẢO TRÌ

1. Tất cả các file `.tsx` giao diện phải đặt trong `src/pages/` hoặc `src/components/`.
2. Khi thêm trường dữ liệu mới vào CSDL Supabase, cần cập nhật tương ứng vào `src/types/index.ts`.
3. Tuân thủ **2 Nguyên tắc làm việc**: Tóm tắt phương án trước khi code & Không tự ý xóa bỏ/thay thế tính năng khi chưa được sự đồng ý từ người dùng.
