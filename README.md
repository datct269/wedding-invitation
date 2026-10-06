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

## Lời mời cá nhân hóa

Tên khách không nằm trong URL. GitHub Pages đọc mã `?i=` rồi tra một bản ghi trong Cloudflare Worker/KV; `?to=` cũ bị bỏ qua. Worker chỉ có endpoint đọc một mã, CORS chỉ cho `https://datct269.github.io`. Khi chưa cấu hình Worker hoặc tra cứu lỗi, thiệp dùng “Quý khách”, thứ tự Tiến Đạt – Huyền Dịu và tiệc 31/10/2026 lúc 10:00.

Sau khi Worker được triển khai, đặt URL endpoint (không bao gồm query string) tại `invitationLookupUrl.production` trong `src/data.js`. `invitationLookupUrl.local` chỉ dành cho máy local. Tạo KV namespace production và preview, rồi thay hai ID mẫu trong `worker/wrangler.toml`. Worker production chỉ cho CORS từ origin GitHub Pages đã xuất bản; cập nhật nếu domain website thay đổi.

### Tạo link từ Excel hoặc CSV

Cần Node.js 20+. Tạo mẫu Excel có dropdown nhóm/lịch và mặc định bằng:

```sh
npm run links:template
```

Điền cột `Tên khách`, `Nhóm khách`, `Lịch tiệc`; dòng tên trống được bỏ qua. Dùng `Nhà trai`/`Nhà gái` và `30/10/2026 17:00`/`31/10/2026 10:00`. Giá trị nhóm/lịch trống được hiểu lần lượt là `Nhà gái` và `31/10/2026 10:00`. XLSX và CSV đều được đọc. Tạo đầu ra XLSX:

```sh
npm run links:create -- guest-links-input.xlsx guest-links-output.xlsx
```

Hoặc CSV:

```sh
npm run links:create -- guest-links-input.csv guest-links-output.csv
```

Mỗi dòng có tên nhận token ngẫu nhiên riêng, kể cả tên trùng nhau. Đầu ra gồm tên, nhóm, lịch đã chọn và link cá nhân. Có thể tạo thêm JSON để nhập KV bằng cách đặt biến môi trường `INVITATION_KV_JSON=guest-links-kv-records.json` khi chạy script; JSON này chứa mã và hồ sơ, nên giữ riêng tư như danh sách đầu vào. Các file `guest-links-input*`, `guest-links-output*`, `guest-links-kv*` đã bị loại khỏi Git. Không đưa file khách thật vào repo.

### Kiểm thử Worker/KV cục bộ

Để thử luồng hoàn toàn cục bộ, mở hai terminal trong thư mục dự án:

```sh
npm run worker:dev
npm run dev
```

Sau đó chạy `npm run links:seed-local`. Lệnh tạo ba khách giả, nạp chúng vào Wrangler KV local và in ra các link tại `http://localhost:5173/`. Mở một link để thử tra cứu. Tại localhost, trang dùng endpoint Worker local; Worker chỉ cho phép CORS từ localhost khi chạy bằng lệnh dev. Production URL vẫn để trống nên không gửi request Cloudflare. Dữ liệu local nằm trong `.wrangler/` và không được commit.
