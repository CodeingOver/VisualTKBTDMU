# Nhật ký thay đổi – Visual TKB DMU

### [v0.4.0] – 2026-07-21

#### - **[Thêm mới]** Hiển thị Khung giờ dưới Tiết & Trình tạo File Excel mẫu
  - Hiển thị trực quan mốc khung giờ chính thức (ví dụ: `07:00 - 07:50`, `07:50 - 08:40`...) ngay bên dưới nhãn **Tiết 1 – Tiết 15** ở cột bên trái.
  - Thêm tính năng **Tải file mẫu (.xlsx)**: Cho phép tạo và tải file `DSDKMH_Mau.xlsx` chứa dữ liệu đăng ký môn học chuẩn TDMU trực tiếp từ trình duyệt bằng thư viện SheetJS.
  - Thêm tính năng **Dùng dữ liệu mẫu**: Cho phép tải nhanh dữ liệu thời khóa biểu demo vào ứng dụng mà không cần chọn file thủ công.

---

### [v0.3.1] – 2026-07-21

#### - **[Cập nhật]** Ánh xạ chính xác khung giờ Tiết học chuẩn Trường Đại học Thủ Dầu Một (TDMU)
  - Cập nhật hàm quy đổi giờ học (`startTimeToTiet` & `endTimeToTiet`) khớp 100% sơ đồ 15 Tiết học chính thức của nhà trường:
    - **Buổi Sáng**: Ca 1 (Tiết 1–3: 07:00–09:30), Ca 2 (Tiết 4–6: 09:45–12:15).
    - **Buổi Chiều**: Ca 3 (Tiết 7–9: 13:00–15:30), Ca 4 (Tiết 10–12: 15:45–18:15).
    - **Buổi Tối**: Ca 5 (Tiết 13–15: 18:30–21:00).
  - Tự động hiển thị 12 Tiết mặc định và mở rộng đến Tiết 15 nếu có lớp học buổi tối, đảm bảo vừa khít màn hình không bị tràn khung.

---

### [v0.3.0] – 2026-07-21

#### - **[Cập nhật]** Tái thiết kế giao diện theo phong cách Portal Thời Khóa Biểu
  - Thiết kế lại màu sắc chủ đạo xanh dương portal (`#0b6ec5`), nền lưới trắng sáng viền xanh dịu mắt giống 100% hình mẫu.
  - Chuyển đổi trục dọc bên trái từ dạng Giờ sang dạng **Tiết 1 – Tiết 16** với màu xanh portal nổi bật, chữ trắng đậm.
  - Ánh xạ chính xác thời gian bắt đầu và kết thúc từ file Excel sang các Tiết học (ví dụ: ca sáng 07:00–09:30 → Tiết 1–3, ca chiều 13:00–15:30 → Tiết 6–9).
  - Tái cấu trúc thông tin thẻ môn học (`.session-block`): màu xanh pastel nhạt (`#d4e8fd`), viền xanh đậm (`#2563eb`), hiển thị đủ **Tên môn (Số TC) (Mã môn)**, **Nhóm**, **Phòng**, **GV**.
  - Tích hợp nút chuyển tuần `←` và `→` trực tiếp ở 2 góc header của bảng thời khóa biểu.

---

### [v0.2.0] – 2026-07-21

#### - **[Cập nhật]** Chuyển đổi giao diện sang Chế độ sáng (Light Mode)
  - Thay đổi toàn bộ hệ thống màu thiết kế (design tokens) từ Dark Mode sang Light Mode hiện đại, tươi sáng và tương phản cao (`--bg: #f4f6fb`, `--surface: #ffffff`, `--text-primary: #0f172a`).
  - Cập nhật bảng màu đại diện môn học (`PALETTE`) gồm 12 tông màu rực rỡ, độ tương phản cao sắc nét trên nền sáng.
  - Cập nhật màu sắc thương hiệu, đường viền phân cách và màu highlight ngày "Hôm nay".

---

### [v0.1.1] – 2026-07-21

#### - **[Cập nhật]** Dynamic Viewport Fit & Tối ưu Giao diện
  - Thu gọn kích thước và padding các phần tử UI (sidebar header, khu vực tải file, bảng tín chỉ, danh sách môn học và thanh điều hướng tuần).
  - Tự động tính toán tỷ lệ chiều cao lưới giờ học (`pxPerMin`) dựa theo chiều cao thực tế của cửa sổ trình duyệt, giúp toàn bộ thời khóa biểu hiển thị vừa khít 100% màn hình mà không cần cuộn trang theo chiều dọc.
  - Tự động thu gọn khoảng giờ hiển thị (mặc định 07:00–18:00 và tự mở rộng nếu có môn học tối đến 21:00) nhằm tối ưu không gian hiển thị.
  - Thêm sự kiện lắng nghe `resize` để giao diện tự co giãn linh hoạt khi thay đổi kích thước cửa sổ trình duyệt.

---

### [v0.1.0] – 2026-07-21

#### - **[Thêm mới]** `index.html` – Giao diện web app hai cột (sidebar + timetable)
  - Upload area có hỗ trợ kéo thả file `.xlsx`
  - Sidebar chứa danh sách môn học với checkbox
  - Bảng thống kê tín chỉ (đang xem / đã đăng ký / tổng)
  - Điều hướng tuần (← →) và phím tắt bàn phím
  - Trạng thái chào mừng khi chưa tải file

#### - **[Thêm mới]** `style.css` – Thiết kế premium dark mode
  - Bảng màu tối (`#0b0d17`, `#10131f`, `#161929`)
  - Timetable grid với giờ học hiển thị dạng block tuyệt đối
  - Animation xung đột giờ học (pulse đỏ)
  - Responsive cho màn hình nhỏ

#### - **[Thêm mới]** `app.js` – Logic ứng dụng hoàn chỉnh
  - Parse file `.xlsx` bằng thư viện SheetJS (CDN)
  - Parse chuỗi "Buổi học" nhiều dòng thành session objects
    - Hỗ trợ cả khoảng ngày `DD/MM/YY đến DD/MM/YY` lẫn ngày đơn `DD/MM/YY`
  - Render timetable theo tuần với block được định vị theo giờ thực
  - Xử lý các buổi học trùng giờ trong cùng cột (chia cột tự động)
  - Phát hiện xung đột giờ giữa các môn khác nhau (highlight đỏ)
  - Toggle checkbox → cập nhật lịch tức thì (real-time preview)
  - Điều hướng tuần: nút ← →, phím mũi tên, nút "Tuần đầu"
  - Nút Chọn tất cả / Bỏ chọn / Reset về trạng thái đã đăng ký
  - Tô màu riêng cho từng môn (12 màu xoay vòng)
  - Hiển thị cột "Hôm nay" nổi bật màu accent
