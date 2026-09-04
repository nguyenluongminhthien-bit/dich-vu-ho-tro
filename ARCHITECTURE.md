# 📑 ARCHITECTURE.md — BẢN ĐỒ HỆ THỐNG QTVP-ASDS (dành cho AI)

> File này được dựng lại bằng cách quét trực tiếp 81 file `.ts/.tsx` thật trong repo (không suy đoán từ tên file). Nguồn xác thực: export chính của từng file + tên bảng Supabase thực sự được gọi (`services/api/modules.ts`, `apiService.save(...)`).
> **Quy tắc bắt buộc:** Mỗi khi thêm/sửa 1 tính năng, PHẢI cập nhật bảng mục 3 trong cùng lần commit.

---

## 1. TỔNG QUAN

- **Kiến trúc:** JAMstack — React (Vite, TS) + Supabase (PostgreSQL, REST trực tiếp qua `fetch`, KHÔNG dùng Supabase JS client).
- **Chế độ vận hành:** `API_MODE` ở `services/api/client.ts` chọn `'SUPABASE'` hoặc `'MOCK'` (fallback đọc `localStorage` qua `services/api/localStore.ts` khi mất kết nối — xem mục 6).
- **Phân quyền:** Kết hợp Role (`ADMIN` / `viewer_hanche` / khác) + phân cấp đơn vị (`id_don_vi`), lấy từ `user_metadata` Supabase Auth.

---

## 2. CẤU TRÚC THƯ MỤC THẬT (đã xác minh từng file)

```
src/
├── App.tsx                      # Router nội bộ theo state activeTab (không dùng react-router)
├── main.tsx
├── contexts/AuthContext.tsx      # AuthProvider + useAuth(), checkPermission()
├── hooks/
│   ├── useAllowedUnits.ts        # Tính danh sách đơn vị user được xem
│   └── useDebounce.ts
├── types/index.ts                # Toàn bộ interface dữ liệu (502 dòng)
├── constants/
│   ├── certificates.ts
│   └── reportTemplates.ts        # Định nghĩa mẫu báo cáo cho ReportPage
├── services/
│   ├── api.ts                    # Re-export apiService (entry point duy nhất pages dùng)
│   ├── googleDrive.ts            # Service tìm kiếm tệp tin từ Google Drive API v3
│   └── api/
│       ├── client.ts             # SUPABASE_URL, ANON_KEY, HEADERS, API_MODE
│       ├── cache.ts               # TABLE_MAP, resolveTable(), cache 5 phút, CACHE_DEPENDENCIES
│       ├── modules.ts             # Toàn bộ hàm getX() theo từng bảng + save()/deleteRecord()
│       ├── auth.ts                # setCurrentUser, quản lý session
│       ├── logs.ts                # writeLog() ghi Audit log
│       ├── localStore.ts          # CRUD giả lập khi ở chế độ MOCK/offline
│       └── mockData.ts            # Dữ liệu mẫu cho MOCK mode
├── utils/
│   ├── hierarchy.ts               # Cây đơn vị, emoji cấp bậc, getAllSubordinateIds(), getDefaultUnitId()
│   ├── formatters.ts              # formatCurrency, formatPhoneNumber, getDirectImageLink...
│   ├── expiryStatus.ts            # Tính trạng thái hạn (CẢNH BÁO/QUÁ HẠN...)
│   ├── atvsld.ts                  # getChungNhanByNhom(), calcGiaTriDen() — công thức hạn ATVSLĐ
│   ├── pcccContactParser.ts       # Parser phân tích bảng danh bạ PCCC mẫu PC01 từ PowerPoint/Excel (HTML/Text)
│   ├── exportExcel.ts / exportReports.ts
│   ├── excelTemplates.ts          # Định nghĩa cấu trúc cột và dữ liệu mẫu Excel dán hàng loạt (Nhân sự, OSH, TBNN, TTB VP) + hàm download
│   ├── mathEvaluator.ts           # safeEvalMath() — tính công thức nhập tay
│   ├── logger.ts                  # Ghi nhật ký lịch sử thay đổi (diff log)
│   └── toast.ts
├── pages/                         # 12 trang chính, ánh xạ ở mục 3
└── components/
    ├── ui/                        # Badge, Button, Modal, Pagination, CustomAutocomplete, PasteImportModal, UnitFilterSidebar, SegmentTabs
    ├── common/                    # EmptyState, TablePaginationFooter
    ├── dashboard/                 # KpiSection, ExpiryAlertPanel, PersonnelDoughnutChart, DashboardCustomizerModal
    ├── department/                # 8 Modal theo từng phân hệ hồ sơ đơn vị: SecurityModal, PcccModal, PcccContactPasteModal, AtvsldModal, PcttModal, PvhcModal, PnModal, PhModal
    ├── personnel/                 # Cụm Cước ĐTDĐ + PersonnelModal (mục 3)
    ├── atvsld/                    # 4 Tab con của AtvsldPage (mục 3)
    └── report/                    # CustomReportBuilder + 4 component phụ trợ báo cáo
```

---

## 3. BẢNG ÁNH XẠ TÍNH NĂNG ↔ FILE ↔ BẢNG SUPABASE (xác thực từ code)

| Menu Sidebar (tab id) | Page chính | Component/Modal con | Bảng Supabase thật | Trạng thái |
|---|---|---|---|---|
| Tổng quan (`dashboard`) | `DashboardPage.tsx` (1486 dòng) | `KpiSection`, `ExpiryAlertPanel`, `PersonnelDoughnutChart`, `DashboardCustomizerModal` | đọc `dm_don_vi`, `ns_dich_vu`, `ts_thiet_bi` (tổng hợp, không ghi) | ✅ |
| Thông tin Công ty (`departments`) | `DepartmentPage.tsx` (2944 dòng — **file lớn nhất theo page**) | `SecurityModal`, `PcccModal`, `PcccContactPasteModal`, `AtvsldModal`, `PcttModal`, `PvhcModal`, `PnModal`, `PhModal`, `PersonnelCard`, `DepartmentMapModal` (Sơ đồ showroom bản đồ & OSRM) | `dm_don_vi`, `hs_an_ninh`, `hs_pccc` (gồm 6 cột lãnh đạo mới) + `ts_pccc`, `hs_an_toan_lao_dong`, `hs_pctt`, `hs_pvhc`, `dm_phap_nhan`, `dm_phong_hop` | ✅ |
| Nhân sự (`personnel`) | `PersonnelPage.tsx` (2868 dòng) | `PersonnelModal`, component `SegmentTabs.tsx`; module con **Cước ĐTDĐ**: `CuocDiDongTab.tsx` (3366 dòng — **file lớn nhất toàn repo**), `ThueBaoCuocHistorySection`, `BatchCostEntryModal`, `PersonnelDetailCuocChart`, `ThueBaoDetailCuocChart` | `ns_dich_vu` (hồ sơ NS); Cước ĐTDĐ dùng `dm_thue_bao` + `cp_cuoc_thang` | ✅ |
| An toàn PCCC (`firesafety`) | `FireSafetyPage.tsx` (1465 dòng) | `PcccContactPasteModal`, `pcccContactParser.ts`, dùng chung `PcccModal` (ở `components/department/`) | `hs_pccc` (bổ sung `ten_giam_doc`, `sdt_giam_doc`, `ten_ptkd_dvpt`, `sdt_ptkd_dvpt`, `ten_ptkd_xe`, `sdt_ptkd_xe`), `ts_pccc` | ✅ |
| ATVSLĐ (`atvsld`) | `AtvsldPage.tsx` (676 dòng) — có 5 tab cấp 1: `hoso`, `daotao` (2 tab con `kehoach`/`khoahoc`), `thietbi`, `khamsuckhoe` | `HoSoTab.tsx`, `KeHoachTab.tsx`, `KhoaHocTab.tsx` (1742 dòng), `StrictEquipmentTab.tsx` (996 dòng), `SucKhoeTab.tsx` (705 dòng), modal `AtvsldModal`, component `SegmentTabs.tsx` | `hs_an_toan_lao_dong` (hồ sơ), `hs_khoa_huan_luyen`+`hs_hoc_vien_khoa_huan_luyen` (khóa học), `ts_thiet_bi_nghiem_ngat`+`nk_kiem_dinh_tbnn` (thiết bị nghiêm ngặt), `hs_kham_suc_khoe`+`hs_kham_suc_khoe_campaign` (khám sức khỏe) | ✅ |
| Phương tiện (`vehicles`) | `VehiclePage.tsx` (1380 dòng) | `SegmentTabs.tsx` | `ts_xe`, `cp_hoat_dong_xe`, `nk_su_dung_xe` | ✅ |
| Tài sản-Thiết bị (`equipments`) | `EquipmentPage.tsx` (3205 dòng) | `PasteImportModal`, `CustomAutocomplete`, `SegmentTabs.tsx` | `ts_thiet_bi`, `nk_thiet_bi`, `dm_phap_nhan` (lọc theo `id_don_vi`) | ✅ |
| Nhà cung cấp (`suppliers`) | `SupplierPage.tsx` (khoảng 600 dòng) | modal xem chi tiết, modal thêm/sửa | `dm_ncc` | ✅ |
| Tài liệu (`documents`) | `DocumentPage.tsx` (1674 dòng) | Các component con hiển thị bảng theo tab nằm trong `src/components/document/` (`AllDocTable.tsx`, `ThongBaoTable.tsx`, `QuyetDinhTable.tsx`, `CongVanDenTable.tsx`, `CongVanDiTable.tsx`, `ToTrinhTable.tsx`), file helper `documentHelpers.ts`, component `SegmentTabs.tsx`, tích hợp Google Drive (`googleDrive.ts`, `searchGoogleDriveFile`). | `vb_tb` | ✅ |
| Quy định (`policies`) | `PolicyPage.tsx` (557 dòng) | `SegmentTabs.tsx` | `qd_qt` | ✅ |
| Báo cáo (`reports`) | `ReportPage.tsx` (699 dòng) | `CustomReportBuilder`, `ReportConfigPanel`, `ReportFilterBar`, `ReportList` (tích hợp khối Tải Form Nhập Hàng Loạt qua `excelTemplates.ts` đọc DB mẫu theo 3 tiêu chí), `ReportPreviewTable` | đọc tổng hợp nhiều bảng (`hs_an_ninh`, `dm_don_vi`, `ns_dich_vu`, `dm_phap_nhan`, `vb_tb`), không ghi | ✅ |
| Tài khoản (`accounts`) | `AccountPage.tsx` (516 dòng) | — | `config_users` | ✅ |
| Nhật ký (`logs`) | `LogPage.tsx` (146 dòng) | — | `sys_logs` (ghi qua `writeLog()` ở mọi `save()`/`deleteRecord()`) | ✅ |
| Đăng nhập | `LoginPage.tsx` (131 dòng) | `AuthContext.tsx` | Supabase Auth | ✅ |

> **Cách dùng bảng này:** Tìm theo tên menu hiển thị trên Sidebar → biết ngay Page, Modal/Tab con, và bảng dữ liệu thật liên quan.

---

## 4. TOÀN BỘ 27 BẢNG SUPABASE THẬT (từ `services/api/modules.ts`)

`ns_dich_vu`, `dm_don_vi`, `hs_an_ninh`, `ts_xe`, `cp_hoat_dong_xe`, `nk_su_dung_xe`, `dm_phap_nhan`, `dm_phong_hop`, `qd_qt`, `ts_thiet_bi`, `nk_thiet_bi`, `vb_tb`, `hs_pvhc`, `hs_an_toan_lao_dong`, `hs_pctt`, `hs_pccc`, `ts_pccc`, `config_users`, `sys_logs`, `dm_thue_bao`, `cp_cuoc_thang`, `hs_khoa_huan_luyen`, `hs_hoc_vien_khoa_huan_luyen`, `dm_chu_ky_atvsld`, `ts_thiet_bi_nghiem_ngat`, `nk_kiem_dinh_tbnn`, `dm_ncc`, `hs_kham_suc_khoe`, `hs_kham_suc_khoe_campaign`.

---

## 5. GATEWAY GHI DỮ LIỆU (xác thực từ `modules.ts`)

- **Đọc:** mỗi bảng có 1 hàm riêng `getX()` trong `modules.ts`, gọi `getWithFallback(tableName)` → ưu tiên `fetchWithCache` (Supabase), lỗi thì tự chuyển sang `getLocalRecords()` (offline).
- **Ghi:** DUY NHẤT qua `apiService.save(data, action, tableName)` — action là `'create'` hoặc `'update'`. Hàm tự sinh `id` dạng `{2 ký tự đầu bảng}{timestamp}{random}` khi tạo mới, tự làm sạch payload (`sanitizePayload`: bỏ field UI-only, `""` → `null`).
- **Xóa:** `apiService.deleteRecord(id, tableName)`.
- Mọi `save`/`deleteRecord` tự động gọi `invalidateCache()` + `writeLog()` — KHÔNG được gọi thẳng `fetch()` tới Supabase trong page, nếu không sẽ mất cache-invalidation và audit log.

---

## 6. CƠ CHẾ PHÂN QUYỀN

- `AuthContext.tsx`: đọc `user_metadata` (JWT Supabase) → `quyen` (`ADMIN`/`viewer_hanche`/khác) + `id_don_vi`.
- `checkPermission('TênNhóm')` (dùng trong `Sidebar.tsx`) quyết định nhóm menu nào hiển thị: `TongQuan`, `CongTy`, v.v.
- `utils/hierarchy.ts` → `getAllSubordinateIds()`: đệ quy tìm đơn vị con/cháu cho user có `id_don_vi` cụ thể.
- ADMIN hoặc `id_don_vi` thuộc `HO`/`ALL`/chứa "TOÀN QUỐC" → xem toàn hệ thống.
- `utils/hierarchy.ts` → `getDefaultUnitId()`: tính đơn vị mặc định khi tải trang (THACO AUTO đối với Admin/Toàn quyền, Đơn vị mẹ quản lý cấp tỉnh/thành đối với tài khoản showroom/con).

---

## 7. NỢ KỸ THUẬT & CÁC CẢI TIẾN ĐÃ HOÀN THÀNH

- [x] **Ràng buộc Đơn vị Quản lý ↔ Pháp nhân (Công ty sở hữu)**: Trong Modal Thêm/Sửa thiết bị (`EquipmentPage.tsx`), chọn Đơn vị quản lý tự động lọc danh sách pháp nhân thuộc Đơn vị đó (`dm_phap_nhan` theo `id_don_vi`), hỗ trợ sổ xuống chọn chính xác đối với đơn vị có nhiều pháp nhân trực thuộc.
- [x] **Chuẩn hóa Giao diện Nhập liệu**: Màu nền `#FFFFF0` nhẹ dịu, chữ màu đen rõ ràng và cỡ chữ đồng nhất giữa tất cả các trường dữ liệu trên Modal Thêm mới/Chỉnh sửa thiết bị.
- [x] **Làm sạch Chuỗi Kỹ thuật & Tự thêm đơn vị GB (`utils/formatters.ts`)**: 
  - `cleanTechnicalString`: Xóa khoảng trắng thừa quanh dấu gạch ngang (VD: `i7 - 1185G7` thành `i7-1185G7`).
  - `formatMemorySize`: Nhập số thuần (`512`, `16`) hay chữ dính (`512gb`, `16GB`) $\rightarrow$ tự động gắn đơn vị chuẩn **`512 GB`**, **`16 GB`**. Áp dụng cả khi Dán Excel hàng loạt lẫn Nhập/Sửa từng thiết bị.
- [x] **Form Mẫu Excel Tải Xuất Từ DB theo 3 Tiêu chí (`utils/excelTemplates.ts`)**:
  - Tải Form Mẫu Nhập Hàng Loạt cho **Trang thiết bị văn phòng** và **Nhân sự** tự động trích xuất 01 bản ghi mẫu từ DB thực tế theo ĐÚNG 3 tiêu chí: *1. Điền đầy đủ nhất*, *2. Mới nhất gần thời điểm hiện tại nhất*, *3. Mô tả chi tiết nhất*.
- [x] **Hỗ trợ Đa nghiệp vụ (ngăn cách bằng dấu ";") cho Tài liệu & Quy định**:
  - Tự động tách chuỗi nghiệp vụ ghép (VD: `"Kinh doanh; Nhân sự"`) thành các tag/badge độc lập trên mọi bảng danh sách tài liệu và modal chi tiết.
  - Cập nhật danh sách nhóm nghiệp vụ bên trái ở `PolicyPage.tsx` để hiển thị các nghiệp vụ đơn lẻ, sửa đổi bộ lọc và logic đếm số lượng tài liệu chính xác.
  - Nâng cấp `CustomAutocomplete` ở `DocumentPage.tsx` hỗ trợ tự nhận diện từ khóa và điền gợi ý thông minh sau dấu `;`.
- [x] **utils/logger.tsx trùng lặp đã được xóa**: Đã xóa tệp `utils/logger.tsx` dư thừa, giữ lại `utils/logger.ts` làm nguồn duy nhất chứa logic export hàm `generateDiffLog()`, tránh cảnh báo khi biên dịch.
- [x] **Phân quyền chi tiết (Granular/Advanced Permissions)**: Tích hợp ma trận phân quyền chi tiết (`quyen_chi_tiet`) tại `AccountPage.tsx` để bảo vệ thông tin nhạy cảm ở các phân hệ Nhân sự (`NS_HIDE_SENSITIVE`, `NS_NO_DETAIL`), Thiết bị (`TB_HIDE_PRICE`), Văn bản (`VB_HIDE_BTN`, các quyền xem hạn chế `VB_VIEW_*`), Quy định (`QD_TYPES`, `QD_YEARS`).
- [x] **Tích hợp Google Drive API v3 (`googleDrive.ts` & `DocumentPage.tsx`)**: Xây dựng service tự động quét tìm và liên kết file PDF từ Google Drive. Sử dụng thuật toán so khớp RegExp thông minh ở Client-side hỗ trợ đa tiền tố viết tắt (QĐ/QD, CVĐ/CVD, TTr/TT) giúp tìm chính xác file PDF bất kể sự không đồng nhất về khoảng trắng, dấu chấm phân cách hay hậu tố chữ cái (ví dụ khớp chuẩn: QĐ09, QD34, QĐ.04, QĐ 40, QĐ12B).
- [x] **Nâng cấp giao diện SegmentTabs (`SegmentTabs.tsx`)**: Chuyển đổi toàn bộ cơ chế tab cũ (`LineTabs`) sang `SegmentTabs` sử dụng `motion/react` để tăng tính thẩm mỹ và hiệu năng chuyển động dạng viên thuốc trên toàn bộ các phân hệ chính (Nhân sự, Xe, Thiết bị, Văn bản, ATVSLĐ).
- [x] **Cơ chế bảo mật phiên đăng nhập kết hợp**: Tích hợp kiểm tra phiên bản ứng dụng (`APP_VERSION: '1.1.0'`) để tự dọn dẹp cache, giới hạn phiên đăng nhập tối đa **2 ngày**, và gọi ngầm `apiService.validateAndRefreshUser` trong `AuthContext.tsx` khi mở app để đồng bộ quyền hạn/kiểm tra đổi mật khẩu ngầm.
- [x] **Mẫu báo cáo Quy định - Quy trình hiện hành**: Tích hợp cấu hình mẫu báo cáo mới (`policy_list_report`) vào nhóm Báo cáo Văn bản (hiển thị đối diện với Danh sách Văn bản ban hành), tự động gộp dữ liệu từ 2 nguồn `qd_qt` và `vb_tb` có nghiệp vụ (đảm bảo đầy đủ 116 văn bản), hỗ trợ xem trước, lọc động nâng cao (Bộ phận ban hành, Nghiệp vụ áp dụng, Loại tài liệu, Năm ban hành) và xuất Excel 01 Sheet chuẩn 8 cột (STT, Số hiệu, Tiêu đề, Trích yếu, Nghiệp vụ, Bộ phận ban hành, Ngày ban hành, Đính kèm) có chèn Hyperlink.
- [x] **Mở rộng Nhật ký & Dọn dẹp Log tự động**: Tích hợp cơ chế tự động ghi log Audit khi người dùng thực hiện thao tác **Xem chi tiết** đối tượng (Đơn vị, Nhân sự, Xe, Thiết bị, Nhà cung cấp, Văn bản, Quy định) hoặc khi **Xuất Excel** trên toàn hệ thống. Đồng thời xây dựng hàm `cleanOldLogs(5)` tự động xóa sạch log quá hạn 5 ngày chạy ngầm khi tải ứng dụng.
- [x] **Chuẩn hóa thống kê Nhân sự trang Tổng quan**: Khắc phục lỗi thống kê lệch số lượng nhân sự các nhóm (QTVP, Bảo vệ, PVHC) tại thẻ KPI trang Tổng quan (`DashboardPage.tsx`) bằng cách chuyển sang quét đồng bộ theo phòng ban (`phong_ban`) và phân loại (`phan_loai`) tiếng Việt có dấu tương thích với trang quản lý nhân sự.
- [x] **Xây dựng hoàn thiện phân hệ Khám sức khỏe & Bệnh nghề nghiệp (`SucKhoeTab.tsx`)**: Đã phát triển thành công giao diện và logic hoàn chỉnh, hỗ trợ nhập dữ liệu KSK cá nhân, dán Excel tự động chuẩn hóa chữ hoa, tự động tính toán đợt KSK tổng hợp cấp đơn vị và đồng bộ phân tách bộ lọc: ma trận lọc theo đơn vị hiện tại (xem tiến trình điều chuyển) và danh sách lọc theo đơn vị lúc khám thực tế.
- [x] **Nâng cấp Đào tạo/Huấn luyện sang cơ chế Matrix & List View (`KhoaHocTab.tsx`)**: Tích hợp SubTab để phân nhóm xem "Danh sách khóa học" và "Lịch sử cá nhân". Bảng ma trận hiển thị lịch sử qua các năm (cột năm động) kèm timeline chi tiết, bảng danh sách lọc theo đơn vị lúc học để báo cáo chi phí. Tích hợp nút xuất Excel đề xuất học đợt tiếp theo chuẩn 14 cột. Hỗ trợ validate và đồng bộ ngược thông minh toàn hệ thống theo MSNV kể cả khi nhân sự đã điều chuyển đơn vị.
- [x] **Nâng cấp Tooltip Bản đồ Showroom & Chọn điểm dừng chân 1-Click (`DepartmentMapModal.tsx`)**: Popup đơn vị thiết kế mini-card bọc khung vừa khít (`custom-showroom-popup`, `minWidth: 380px`, `maxWidth: 480px`), trình bày 4 dòng thông tin chuẩn (Lãnh đạo, Diện tích, Số cổng, Quy mô, Lượt khách BQ, Tổng CB-NV theo `tong_nhan_su`), AN-BV (Nội bộ/Dịch vụ, Ca ngày/Ca đêm Cố định/Tuần tra), Tiếp giáp 4 hướng nguyên văn 100% không bị ba chấm `...`, Camera (Hoạt động tốt/Hư hỏng). Hỗ trợ 1-click chọn điểm dừng chân / ghé thăm trực tiếp từ marker bản đồ.
- [x] **Đồng bộ Giao diện Tab & Modal Hồ sơ Nhân sự (`PersonnelPage.tsx` & `PersonnelModal.tsx`)**: Đặt màu xanh thương hiệu `#00539c` cho khối tab lồng liền mạch cấp 1 & cấp 2, cột Họ và tên `whitespace-nowrap`, di chuyển Lịch sử KSK cá nhân vào Modal Xem Chi Tiết Hồ Sơ Nhân Sự phía trên khối Ghi chú khác.
- [x] **Đồng bộ ATVSLĐ Nhân sự Kiêm nhiệm (`KhoaHocTab.tsx`) & Custom Confirm Modal Xóa (`SucKhoeTab.tsx`)**: Tự động quét MSNV đồng bộ trạng thái/chứng chỉ ATVSLĐ cho toàn bộ hồ sơ công tác chính và kiêm nhiệm. Đồng bộ Custom Confirm Modal phông mờ backdrop blur thay thế `window.confirm` native.
- [x] **Tối ưu Dải Phân Trang (`Pagination.tsx`)**: Thu gọn dải phân trang chiều cao `22px - 26px`, font size `11px`.
- [x] **Dán Bảng Danh bạ Khẩn cấp PCCC (Mẫu PC01) từ PowerPoint/Excel & Bảng đối soát 15 đầu mối (`pcccContactParser.ts`, `PcccContactPasteModal.tsx`, `hs_pccc`)**:
  - Xây dựng tiện ích phân tích cú pháp thông minh (`src/utils/pcccContactParser.ts`) bóc tách dữ liệu bảng từ clipboard: ưu tiên parse HTML Table khi copy trực tiếp từ slide PowerPoint hoặc Excel, tự động fallback phân tích dạng plain text theo Tab (`\t`), gạch đứng (`|`) hoặc khoảng trắng.
  - Tự động làm sạch các thẻ ngoặc vuông `[...]` (nếu có), phần mở ngoặc đơn `(...)` và chuẩn hóa số điện thoại theo định dạng chuẩn 4-3-4 bằng `formatPhoneNumber`.
  - Nhận diện và **bỏ qua dòng 113** (Cảnh sát Phản ứng nhanh), **bỏ qua cột 5** (Ghi chú).
  - Bổ sung 6 cột vào bảng CSDL `hs_pccc`: `ten_giam_doc`, `sdt_giam_doc`, `ten_ptkd_dvpt`, `sdt_ptkd_dvpt`, `ten_ptkd_xe`, `sdt_ptkd_xe` để lưu độc lập thông tin liên hệ của 3 vị trí Lãnh đạo Showroom/Đơn vị.
  - Cơ chế gợi ý / fallback: Nếu chưa nhập riêng trong PCCC, tự động gợi ý/hiển thị từ Mục A (Nhân sự đơn vị). Cập nhật Popup Danh bạ Khẩn cấp ngoài trang tự động ưu tiên lấy thông tin lãnh đạo từ hồ sơ PCCC nếu Mục A chưa có.
  - Đồng bộ đồng thời trên cả 2 phân hệ: `DepartmentPage.tsx` (Mục F. Phòng chống cháy nổ), `FireSafetyPage.tsx` (Thêm/Sửa hồ sơ PCCC) và `PcccModal.tsx`.

  ##### 📋 BẢNG ĐỐI SOÁT ÁNH XẠ DỮ LIỆU DANH BẠ KHẨN CẤP PCCC (MẪU PC01)

  | STT Slide | Cơ quan / Bộ phận (PowerPoint) | Từ khóa nhận diện tự động (Match Patterns) | Trường Tên DB (`hs_pccc`) | Trường SĐT DB (`hs_pccc`) | Cơ chế xử lý & Ghi chú nghiệp vụ |
  | :---: | :--- | :--- | :--- | :--- | :--- |
  | **1** | Cảnh sát Phản ứng nhanh (113) | `113`, `phan ung nhanh` | *(Bỏ qua)* | *(Bỏ qua)* | 🔴 **Bỏ qua hoàn toàn**, không ghi vào CSDL |
  | **2** | Cảnh sát PCCC | `canh sat pccc`, `cs pccc`, `pccc va cnch`, `phong pccc` | `ten_ca_pccc` | `sdt_ca_pccc` | Hotline Cảnh sát PCCC & CNCH địa phương |
  | **3** | Cấp cứu y tế | `cap cuu y te`, `cap cuu`, `115` | `ten_yte` | `sdt_yte` | Cơ sở cấp cứu y tế 115 / trung tâm y tế |
  | **4** | Bảo vệ dân phố / Dân quân tự vệ | `dan pho`, `dan quan tu ve`, `dan quan`, `tu ve` | `ten_bv_dan_quan` | `sdt_bv_dan_quan` | Lực lượng an ninh nhân dân địa phương |
  | **5** | Công an khu vực | `cong an khu vuc`, `ca khu vuc` | `ten_ca_khu_vuc` | `sdt_ca_khu_vuc` | Công an phụ trách địa bàn |
  | **6** | Công an Xã/Phường | `cong an xa`, `cong an phuong`, `ca xa`, `ca phuong` | `ten_ca_xa_phuong` | `sdt_ca_xa_phuong` | Trụ sở Công an Xã/Phường sở tại |
  | **7** | PCCC Xã/Phường | `pccc xa`, `pccc phuong` | `ten_pccc_xa_phuong` | `sdt_pccc_xa_phuong` | Đội PCCC cấp Xã/Phường |
  | **8** | Điện lực khu vực | `dien luc`, `dien luc khu vuc` | `ten_dien_luc` | `sdt_dien_luc` | Điện lực khu vực hỗ trợ cắt điện |
  | **9** | Giám đốc Showroom | `giam doc showroom`, `giam doc don vi`, `giam doc` | `ten_giam_doc` | `sdt_giam_doc` | 🟢 Ghi nhận trực tiếp vào PCCC; Gợi ý từ Mục A nếu chưa nhập riêng |
  | **10** | Giám đốc / PT KD DVPT | `ban hang dvpt`, `kinh doanh dvpt`, `dvpt`, `dich vu phu tung`, `ptkd dvpt` | `ten_ptkd_dvpt` | `sdt_ptkd_dvpt` | 🟢 Ghi nhận trực tiếp vào PCCC; Gợi ý từ Mục A nếu chưa nhập riêng |
  | **11** | Giám đốc / PT KD Xe | `ban hang xe`, `kinh doanh xe`, `kd xe`, `ptkd xe` | `ten_ptkd_xe` | `sdt_ptkd_xe` | 🟢 Ghi nhận trực tiếp vào PCCC; Gợi ý từ Mục A nếu chưa nhập riêng |
  | **12** | Phụ trách Kho xe & Lái xe | `kho xe`, `lai xe`, `phu trach kho xe` | `ten_kho_xe` | `sdt_kho_xe` | Điều động di dời xe khi khẩn cấp |
  | **13** | Tổ trưởng bảo vệ, đón tiếp KH | `to truong bao ve`, `don tiep khach hang`, `tt bao ve`, `don tiep kh` | `ten_tt_bao_ve` | `sdt_tt_bao_ve` | Phụ trách lực lượng bảo vệ, mở cổng thoát hiểm |
  | **14** | Phụ trách QTVP (Hành chính) | `dich vu ho tro kd`, `ho tro kd`, `hanh chinh`, `vp cty`, `qtvp`, `hc ns` | `ten_hc_ns` | `sdt_hc_ns` | Hậu cần, cứu nạn và điều phối |
  | **15** | Cơ sở y tế gần nhất (ký HĐ y tế) | `hop dong y te`, `y te gan nhat`, `bv lien ket`, `co so y te gan nhat` | `ten_bv_lien_ket` | `sdt_bv_lien_ket` | Bệnh viện/cơ sở y tế ký hợp đồng |

  > 📌 **Script DDL Supabase Database:**
  > ```sql
  > ALTER TABLE hs_pccc 
  > ADD COLUMN IF NOT EXISTS ten_giam_doc TEXT, 
  > ADD COLUMN IF NOT EXISTS sdt_giam_doc TEXT, 
  > ADD COLUMN IF NOT EXISTS ten_ptkd_dvpt TEXT, 
  > ADD COLUMN IF NOT EXISTS sdt_ptkd_dvpt TEXT, 
  > ADD COLUMN IF NOT EXISTS ten_ptkd_xe TEXT, 
  > ADD COLUMN IF NOT EXISTS sdt_ptkd_xe TEXT;
  > ```


- [ ] Bảng `dm_chu_ky_atvsld` có hàm `getChuKyATVSLD()` trong `modules.ts` nhưng KHÔNG tìm thấy nơi nào trong `components/`/`pages/` gọi hàm này hoặc dùng chuỗi `'dm_chu_ky_atvsld'` trực tiếp — khả năng là bảng chưa được nối vào UI, hoặc đã lệch tên biến. Cần kiểm tra lại thủ công trước khi phát triển thêm module ATVSLĐ.
- [ ] `AtvsldPage.tsx` đã refactor tab (`HoSoTab`, `KeHoachTab`, `KhoaHocTab`, `StrictEquipmentTab`) nhưng bản thân `AtvsldPage.tsx` vẫn còn 663 dòng logic dùng chung (state, modal, hàm `getRegionName`) — có thể tách tiếp nếu muốn gọn hơn.
- [ ] `PersonnelPage.tsx` (2851 dòng) và `CuocDiDongTab.tsx` (3366 dòng) là 2 file lớn nhất hệ thống — ứng viên hàng đầu để tách nhỏ nếu tiếp tục mở rộng module Cước ĐTDĐ.
- [ ] `services/api/client.ts` chứa `SUPABASE_ANON_KEY` hardcode trực tiếp trong source — đây là anon key public (được bảo vệ bởi RLS ở phía Supabase) nên không phải lỗi bảo mật nghiêm trọng, nhưng nên chuyển sang biến môi trường (`.env` + Vite `import.meta.env`) để dễ đổi giữa môi trường dev/prod sau này.

---

## 8. PROMPT MẪU KHI LÀM VIỆC VỚI AI

1. Dán `ARCHITECTURE.md` kèm: *"Đây là bản đồ kiến trúc hệ thống, đọc kỹ trước khi làm."*
2. Tra bảng mục 3 theo tên menu để biết đúng Page/Component/Bảng dữ liệu cần đụng vào.
3. Gửi kèm các file `.tsx` liên quan.
4. Sau khi AI hoàn thành, yêu cầu: *"Đề xuất nội dung cần cập nhật vào bảng mục 3 và mục 7 (nợ kỹ thuật)."*
