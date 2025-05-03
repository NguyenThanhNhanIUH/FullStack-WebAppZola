# WebApp Zola - Ứng Dụng Nhắn Tin Thời Gian Thực

Ứng dụng nhắn tin thời gian thực được xây dựng với MERN stack (MongoDB, Express.js, React, Node.js) và Socket.IO.

## Tính Năng

- Nhắn tin thời gian thực sử dụng Socket.IO
- Xác thực và phân quyền người dùng
- Nhắn tin cá nhân giữa các người dùng
- Chức năng chat nhóm
- Hệ thống kết bạn
- Chia sẻ file và hình ảnh thông qua Supabase Storage
- Chức năng đặt lại mật khẩu
- Thiết kế responsive

## Công Nghệ Sử Dụng

### Backend
- Node.js
- Express.js
- MongoDB
- Socket.IO
- Supabase Storage
- JSON Web Tokens (JWT)

### Frontend
- React.js
- Socket.IO Client
- React Router
- Modern CSS

## Cấu Trúc Dự Án

```
├── Backend-messaging-app/    # Server Backend
│   ├── controllers/         # Xử lý logic cho các route
│   ├── models/             # Mô hình dữ liệu
│   ├── routes/             # Định tuyến API
│   ├── services/           # Logic nghiệp vụ
│   ├── socket/             # Xử lý Socket.IO
│   └── middleware/         # Middleware Express
│
├── FE-WebAppZola/          # Ứng dụng Frontend React
    ├── src/
    │   ├── components/     # Components tái sử dụng
    │   ├── pages/         # Components trang
    │   ├── services/      # Dịch vụ API
    │   ├── hooks/         # Custom React hooks
    │   └── utils/         # Hàm tiện ích
```

## Hướng Dẫn Cài Đặt

1. Clone repository:
```bash
git clone https://github.com/NguyenThanhNhanIUH/FullStack-WebAppZola.git
```

2. Cài đặt các dependencies:
```bash
# Backend
cd Backend-messaging-app
npm install

# Frontend
cd FE-WebAppZola
npm install
```

3. Thiết lập biến môi trường cho cả backend và frontend

4. Khởi chạy máy chủ phát triển:
```bash
# Backend
cd Backend-messaging-app
npm start

# Frontend
cd FE-WebAppZola
npm start
```