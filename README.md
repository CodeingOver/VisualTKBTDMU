# Visual TKB – Trực quan hóa thời khóa biểu DMU

Ứng dụng web giúp sinh viên **lên kế hoạch đăng ký môn học** bằng cách xem trước thời khóa biểu ngay lập tức khi tick/bỏ tick môn — không cần đăng ký chính thức mới xem được lịch.

---

## Tính năng chính

- 📂 **Tải file Excel** `DSDKMH.xlsx` (kéo thả hoặc chọn file) — tự động parse toàn bộ danh sách môn học
- ☑️ **Toggle môn học realtime** — tick/bỏ tick checkbox → timetable cập nhật tức thì, không cần reload
- 📅 **Timetable dạng tuần** — hiển thị lịch từ Thứ 2 đến Chủ Nhật, điều hướng ← → theo tuần
- ⚠️ **Phát hiện xung đột giờ** — highlight đỏ + badge cảnh báo khi 2 môn trùng giờ học
- 🎨 **Màu sắc phân biệt** — mỗi môn học có màu riêng (12 màu xoay vòng)
- 🔢 **Thống kê tín chỉ realtime** — tổng TC đang xem preview / TC đã đăng ký chính thức / tổng TC
- 📌 **Phân nhóm môn học** — nhóm có lịch / chưa có lịch; badge "Bắt buộc" / "Đã ĐK"
- ⌨️ **Phím tắt** — phím ← → để chuyển tuần; nút "Tuần đầu" để nhảy về tuần có lịch đầu tiên
- 🔄 **Reset về đăng ký gốc** — nút Reset trả về trạng thái các môn đã có `x` trong file Excel

---

## Yêu cầu hệ thống

| Thành phần | Yêu cầu |
|-----------|---------|
| Trình duyệt | Chrome / Edge / Firefox phiên bản mới (hỗ trợ ES2020+) |
| File dữ liệu | `DSDKMH.xlsx` xuất từ hệ thống đăng ký môn DMU |
| Kết nối mạng | Cần kết nối để tải thư viện SheetJS từ CDN (lần đầu) |

> Không cần cài Node.js, Python hay bất kỳ công cụ nào khác.

---

## Hướng dẫn cài đặt

```bash
# Clone hoặc tải về thư mục
git clone <repo-url>
cd VisualTKBTDMU

# Không cần cài đặt thêm gì — chạy thẳng trình duyệt
```

---

## Biến môi trường

Ứng dụng chạy hoàn toàn phía client, **không có biến môi trường** cần cấu hình.

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| *(không có)* | Mọi cấu hình nằm trong `app.js` | — |

> Để thay đổi khoảng giờ hiển thị, chỉnh `GRID_START_H` và `GRID_END_H` trong [`app.js`](./app.js).

---

## Hướng dẫn chạy & Sử dụng

### Cách 1 – Mở trực tiếp (đơn giản nhất)
```
Mở file index.html bằng trình duyệt (double-click hoặc kéo vào Chrome/Edge)
```

### Cách 2 – Chạy qua local server (khuyến nghị nếu gặp lỗi CORS)
```bash
# Dùng Python
python -m http.server 8080
# Truy cập: http://localhost:8080

# Hoặc dùng Node
npx http-server . -p 8080
# Truy cập: http://localhost:8080
```

### Quy trình sử dụng
1. Mở `index.html` → trang chào mừng hiện ra
2. **Kéo thả** hoặc **nhấn vào ô upload** → chọn file `DSDKMH.xlsx`
3. Danh sách môn tải vào sidebar, timetable hiện tuần đầu tiên có lịch
4. **Tick/bỏ tick** các môn bên trái → xem trước lịch thay đổi tức thì
5. Dùng nút **← →** hoặc phím mũi tên để xem các tuần khác
6. Kiểm tra cảnh báo **xung đột** (viền đỏ) nếu 2 môn trùng giờ
