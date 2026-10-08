# VanTanTheDEV — Commercial Software Booking & Development Platform

Nền tảng thương mại dịch vụ lập trình và phát triển phần mềm chuyên nghiệp, được xây dựng và vận hành bởi **Nguyễn Văn Tấn** (Brand: **VanTanTheDEV**).

![Platform Preview](https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80)

---

## 🚀 Giới Thiệu (Overview)

VanTanTheDEV không đơn thuần là một website portfolio, mà là một **Commercial Service Marketplace & Software Agency Platform** hoàn chỉnh với quy trình đặt hàng, thanh toán tự động VietQR, theo dõi tiến độ dự án thời gian thực và không gian quản trị vận hành dành riêng cho khách hàng và admin.

### ✨ Các Tính Năng Nổi Bật (Features)

* **Commercial Service Catalog:**
  * Khám phá 8 dịch vụ công nghệ then chốt (Website doanh nghiệp, Web App & SaaS, E-Commerce, Mobile App Flutter, API & Microservices, DevOps & Cloud, Tối ưu hiệu năng, Bảo trì phần mềm).
  * Lọc theo nhóm công nghệ, tìm kiếm thời gian thực.
* **Package Comparison Matrix:**
  * Bảng so sánh trực quan 3 gói giải pháp: **Basic**, **Standard**, **Premium** trên từng dịch vụ.
  * Phân định rõ ràng: Phạm vi bao gồm (**What's Included**) và Phạm vi không bao gồm (**What's Not Included**).
  * Tiện ích mở rộng (**Add-ons**) linh hoạt.
* **Smart 5-Step Booking Flow:**
  * Quy trình đặt dịch vụ 5 bước thông minh: Chọn gói ➔ Điền bài toán & yêu cầu kỹ thuật ➔ Chọn addon ➔ Áp mã giảm giá & chọn phương thức thanh toán ➔ Xác nhận khởi tạo.
  * Sinh mã đơn hàng chuẩn định dạng: `VT-YYYY-XXXXX`.
* **VietQR & Automated Payments:**
  * Tích hợp mã VietQR tự động hóa theo chuẩn liên ngân hàng, tự động gắn số tiền và nội dung chuyển khoản là mã đơn hàng.
  * Hỗ trợ xác nhận ủy nhiệm chi và webhook đối soát thanh toán.
* **Client Workspace (`/dashboard`):**
  * Theo dõi tiến độ dự án trực quan qua 6 mốc tiến trình (`pending` ➔ `confirmed` ➔ `in_progress` ➔ `waiting_customer` ➔ `revision` ➔ `completed`).
  * Kênh trao đổi 2 chiều trực tiếp giữa khách hàng và nhà phát triển (kèm tệp đính kèm).
  * Quản lý tệp tài liệu bàn giao (**Deliverables**).
  * Đánh giá nghiệm thu dự án & in hóa đơn thương mại chuẩn (`/invoices`).
* **Admin Control Center (`/admin`):**
  * Bảng điều khiển KPI: Doanh thu thực nhận, tổng đơn hàng, tỷ lệ chuyển đổi.
  * Quản trị đơn hàng: Duyệt đối soát thanh toán 1-chạm, cập nhật trạng thái tiến độ.
  * Quản lý khách hàng, sinh mã giảm giá (Coupons), kiểm duyệt đánh giá, quản lý lead tư vấn và CMS Settings.
* **Kiến Trúc & Bảo Mật:**
  * Mật khẩu mã hóa bảo mật với thuật toán `scrypt` kèm salt độc quyền.
  * Phiên làm việc quản lý qua cookie `HttpOnly` an toàn, chống CSRF & XSS.
  * Hệ thống nhật ký kiểm toán (**Audit Logs**) ghi nhận mọi thao tác quan trọng.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

* **Frontend:** React 19, TypeScript, React Router 7, Vite, Lucide Icons, Pure CSS Design System.
* **Backend:** Node.js, Express 5, Helmet, Zod.
* **Database:** SQLite (WAL mode, foreign keys, transaction-safe migrations).
* **Payment Integration:** Chuẩn VietQR API.

---

## 🏁 Cài Đặt & Chạy Thử (Quick Start)

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Khởi chạy môi trường phát triển (Dev)
```bash
npm run dev
```

### 3. Biên dịch và chạy môi trường thực tế (Production)
```bash
npm run build
npm start
```
Hệ thống sẽ chạy tại `http://localhost:3001`.

---

## 🔑 Tài Khoản Trải Nghiệm Mẫu (Demo Credentials)

* **Quản trị viên (Admin):**
  * Email: `admin@vantanthedev.com`
  * Mật khẩu: `Admin@2026!`
* **Khách hàng mẫu (Customer):**
  * Email: `khachhang@example.com`
  * Mật khẩu: `Customer@2026!`

*(Có sẵn nút đăng nhập nhanh 1-chạm tại trang `/login`)*

---

## 📄 Bản Quyền & Tác Giả (Author)

* **Chủ sở hữu:** Nguyễn Văn Tấn
* **Brand:** VanTanTheDEV
* **Email:** `contact@vantanthedev.com`
