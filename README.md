# Romantic Đỏ — thiệp dành cho khách

Chạy với Node.js 20 trở lên:

```sh
npm run dev
npm test
npm run build
```

Mở http://localhost:5173. Build tĩnh nằm trong `dist/`; phục vụ thư mục này tại gốc tên miền.

- `src/data.js`: nội dung, ảnh hero, 12 ảnh gallery, thumbnail, hoa, QR, nhạc và thông số chuyển động.
- `public/images/wedding/`: minh họa tạm. Thay file hoặc cập nhật `src`, `thumbnailSrc`, `alt`, `position` trong cấu hình để dùng JPG/WebP thật.
- `public/images/gift/`: QR minh họa không dùng thanh toán. Thay `qrSrc`, thông tin tài khoản và đặt `placeholder: false` khi có QR thật.
- `public/audio/ceremony.wav`: giai điệu chuông tự tạo để kiểm thử. Thay đường dẫn `music.src` để dùng nhạc chính thức.
- `src/guestbook-store.js`: adapter async dùng localStorage. Thay `list` và `add` để kết nối API. Hiện lời chúc chỉ tồn tại trên trình duyệt đã gửi.
- Font Google và bản đồ Google cần mạng; font có fallback hệ thống. Các ảnh minh họa, hoa, nền và nhạc đều có sẵn cục bộ.

Không có admin, editor, RSVP hoặc countdown. Người dùng bật reduced motion sẽ không bị tự cuộn mặc định và không có chuyển động nền.

`scripts/create-assets.mjs` chỉ để tái tạo bộ asset minh họa ban đầu; không chạy sau khi đã thay ảnh thật.
