# 📑 ARCHITECTURE.MD - BẢN ĐỒ HỆ THỐNG ERP MINI (THACO AUTO)

## 1. TỔNG QUAN HỆ THỐNG
* **Mục tiêu:** Quản trị tập trung tổng thể Hành chính - Nhân sự - Tài sản - PCCC cho hệ thống Showroom/Đơn vị.
* **Mô hình kiến trúc:** JAMstack (React + Supabase).
* **Đặc tính cốt lõi:** Phân quyền dữ liệu theo dạng cây phân cấp đơn vị (Hierarchy-based Access Control kết hợp Role-based Access Control).

## 2. CÔNG NGHỆ (TECH STACK)
* **Frontend:** React (Vite), TypeScript.
* **Styling & UI:** Tailwind CSS.
* **Icon:** Lucide React.
* **Backend & Database:** Supabase (PostgreSQL & Authentication).
* **Xử lý Excel:** `xlsx` (SheetJS) - *Dự kiến tích hợp*.

## 3. CẤU TRÚC THƯ MỤC & CHỨC NĂNG (PROJECT STRUCTURE)

### 📂 `src/pages/` (Các Module Chức Năng Chính)
* `AccountPage.tsx`: Quản lý tài khoản hệ thống, phân quyền (Admin/User), gán tài khoản thuộc đơn vị nào.
* `DashboardPage.tsx`: Trang tổng quan thống kê (Charts, Metrics).
* `DepartmentPage.tsx`: Quản lý danh sách Cơ cấu tổ chức (Chi nhánh, Showroom, Đại lý) theo dạng cây.
* `EquipmentPage.tsx`: Quản lý Tài sản & Thiết bị (Cấp phát, Thu hồi, Báo hỏng).
* `FireSafetyPage.tsx`: Quản lý an toàn PCCC & An ninh bảo vệ (Thiết bị PCCC, Đội PCCC cơ sở, Hạn kiểm định).
* `PersonnelPage.tsx`: Quản lý Hồ sơ Nhân sự (Thông tin, Bằng cấp/Chứng chỉ, Thâm niên, Chốt nghỉ việc, Vào làm lại).
* `PolicyPage.tsx`: Quản lý Quy định, Quy trình & Văn bản (Theo dõi hiệu lực, Tích hợp link tài liệu gốc).
* `VehiclePage.tsx`: Quản lý Phương tiện & Xe cộ.
* `LogPage.tsx`: Nhật ký hệ thống (Audit Trail) ghi vết thao tác người dùng.
* `LoginPage.tsx`: Giao diện đăng nhập.
* `DocumentPage.tsx`: Module quản lý tài liệu lưu trữ.

### 📂 `src/components/` (Thành Phần Giao Diện Dùng Chung)
* `Layout.tsx`: Bộ khung bọc ngoài các trang (chứa Header, Sidebar và khu vực Content).

### 📂 `src/contexts/` (Quản Lý Trạng Thái Toàn Cục)
* `AuthContext.tsx`: Chịu trách nhiệm quản lý phiên đăng nhập. **Nhiệm vụ cốt lõi:** Giải mã `user_metadata` từ Supabase để trích xuất quyền (`quyen`) và mã đơn vị (`id_don_vi`) của người dùng đang đăng nhập.

### 📂 `src/services/` (Giao Tiếp Cơ Sở Dữ Liệu)
* `api.ts`: Gateway duy nhất giao tiếp với Supabase. Chứa tất cả các hàm CRUD (Create, Read, Update, Delete).

### 📂 `src/utils/` (Hàm Tiện Ích)
* `hierarchy.ts`: Thuật toán xử lý mảng Đơn vị thành cấu trúc Cây (Tree), tạo tiền tố thụt lề (`│ ├──`) và gán Emoji tương ứng cấp bậc.

---

## 4. CƠ CHẾ PHÂN QUYỀN (AUTHORIZATION LOGIC) - ⚠️ RẤT QUAN TRỌNG

Hệ thống lọc dữ liệu hiển thị dựa trên sự kết hợp của 2 yếu tố:

### A. Định danh người dùng (Lấy từ Supabase)
Code không đọc bảng `users` thuần, mà phải đọc qua `user_metadata` trong JWT Token của Supabase.
* Quy tắc xác định: `const meta = userData.user_metadata;`

### B. Logic Cấp quyền (Trong các file Page)
1. **Quyền Toàn Hệ Thống (Mở khóa 100%):**
   * Nếu Role là `ADMIN`.
   * Hoặc Unit ID là `HO`, `ALL`, hoặc có chứa từ khóa `TOÀN QUỐC` / `(HO)`.
2. **Quyền Theo Đơn Vị Phân Cấp (Hierarchy):**
   * Nếu Unit ID là một mã cụ thể (VD: `DNB`), hệ thống sử dụng thuật toán đệ quy (Recursive) để tìm chính nó và **TẤT CẢ** các đơn vị con, cháu trực thuộc nó.
   * Để chống lỗi Database lưu nhầm Tên thay vì Mã, thuật toán sẽ đối chiếu và quy đổi 2 chiều giữa `id` và `ten_don_vi`.

### C. Logic Hiển Thị Menu (Cây Đơn Vị Bên Trái)
* Biến `parentUnits`: Lọc ra các đơn vị làm "Gốc" của cây Menu. 
* Nguyên tắc: Nếu cấp quản lý (cha) của một đơn vị KHÔNG nằm trong quyền được xem của User, thì hệ thống tự động đẩy đơn vị đó lên làm Đơn vị Gốc (Root) đối với User đó.

---

## 5. QUY ƯỚC LẬP TRÌNH (CODING CONVENTIONS)
* **Ảnh Avatar/Hồ sơ:** Sử dụng link chia sẻ Google Drive, đi qua hàm bóc tách `getDirectImageLink` để chuyển thành link ảnh thumbnail trực tiếp.
* **Format Dữ liệu:** * Số điện thoại: Chia block `4-3-3` (Ví dụ: `0901 234 567`).
  * Tiền tệ: Phân cách hàng nghìn bằng dấu cách (Ví dụ: `15 000 000`).
* **Trạng thái Nhân sự:** Các nhân sự "Đã nghỉ việc" luôn bị đẩy xuống cuối bảng và bị giảm độ sáng (`opacity-60`). Khi chốt nghỉ việc, hệ thống bắt buộc rà soát chéo xem nhân sự có đang giữ tài sản cấp phát nào không.

---

### 💡 PROMPT HƯỚNG DẪN KHI CHAT VỚI AI
Mỗi khi bắt đầu một phiên làm việc mới, hãy thực hiện theo thứ tự sau để AI không bị mất bối cảnh:
1. Copy và gửi toàn bộ nội dung file `ARCHITECTURE.md` này kèm câu lệnh: *"Đây là bản đồ kiến trúc hệ thống của tôi, hãy đọc kỹ để nắm bối cảnh."*
2. Gửi (các) file `.tsx` hoặc `.ts` đang cần chỉnh sửa.
3. Nêu rõ vấn đề đang gặp phải hoặc tính năng cần phát triển.