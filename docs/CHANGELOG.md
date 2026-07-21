# Nhật ký thay đổi – Visual TKB DMU

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
