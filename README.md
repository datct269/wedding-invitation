# Romantic Đỏ — thiệp cưới Tiến Đạt & Huyền Dịu

Website HTML/CSS/JavaScript ES modules, dùng Node.js **20.9 trở lên** (khuyến nghị Node.js 24).

```sh
npm ci
npm run dev
npm test
npm run build
```

Local: http://localhost:5173. Build tĩnh nằm trong `dist/`; không commit thư mục này.

## Link cá nhân hóa

Ví dụ khách nhà gái, tiệc chiều 30/10:

```text
http://localhost:5173/?side=bride&slot=oct30&to=Nguyễn%20Văn%20An
```

| Param | Giá trị | Ý nghĩa |
| --- | --- | --- |
| `side` | `groom` / `bride` | Chú rể / cô dâu đứng trước, trừ phần thông tin lễ cưới |
| `slot` | `oct30` | 30/10/2026 · Thứ Sáu · 21/09 năm Bính Ngọ · 17:00 |
| `slot` | `oct31` | 31/10/2026 · Thứ Bảy · 22/09 năm Bính Ngọ · 10:00 |
| `to` | Tên khách, tối đa 80 ký tự | Hiển thị trên bìa, preview; điền và khóa tên sổ lưu bút |

Thiếu hoặc sai `side`/`slot` dùng mặc định `groom`/`oct31`. Tên trống dùng **Quý khách**, cho nhập tên sổ lưu bút. Tên được chuẩn hóa bằng `URLSearchParams`, `trim()` và giới hạn 80 ký tự; URL không xác thực danh tính khách.

Khi tạo link bằng JavaScript, dùng `URLSearchParams` để mã hóa tên chính xác:

```js
const link = new URL('https://TEN-DU-AN.vercel.app/');
link.search = new URLSearchParams({ side: 'bride', slot: 'oct30', to: 'Nguyễn Văn An' });
console.log(link.href);
```

Lễ thành hôn luôn là **13:30 ngày 31/10/2026**, không đổi theo lời mời. Nút thêm lịch đã được bỏ; lịch tháng vẫn đánh dấu đúng ngày tiệc.

## Preview và deploy Vercel

`src/data.js` chứa thông tin và tài nguyên; `src/invitation.js` chuẩn hóa lời mời dùng chung cho giao diện, metadata và ảnh preview. Vercel Functions trả HTML có Open Graph/Twitter ngay từ máy chủ và PNG 1200 × 630 tại `/api/og`. Bộ dựng dùng font có giấy phép OFL đã lưu cục bộ và họa tiết hiện có. Override `sharp` ở bản đã vá, tương thích Node.js 20.9+.

Các bước chuẩn bị deploy:

1. Import repository GitHub vào Vercel, chọn **Hobby**, framework **Other**, Node.js **24**.
2. Giữ build command `npm run build` và output directory `dist`; `vercel.json` đã cấu hình Functions, tài nguyên và thứ tự routing để HTML động được trả trước file tĩnh.
3. Có thể đặt `SITE_URL=https://TEN-DU-AN.vercel.app` hoặc tên miền riêng để metadata dùng URL công khai ổn định. Khi chưa đặt, dùng `VERCEL_URL` của deployment. Khi kiểm tra một preview deployment, dùng origin của chính deployment đó hoặc cập nhật `SITE_URL` cho môi trường Preview.
4. Sau deploy, đọc source của link cá nhân hóa và mở URL `og:image` để xác nhận metadata/PNG đúng; gửi thử link cho Facebook/Zalo. Crawler không cần JavaScript để đọc metadata.

Ảnh có cache theo URL chứa `side`, `slot`, `to` đã chuẩn hóa và phiên bản `OG_VERSION`; HTML cá nhân hóa dùng `private, no-store`. Khi sửa thiết kế preview hoặc thông tin cưới, tăng `OG_VERSION`, chạy `npm run preview:image` rồi build lại. Facebook/Zalo có bộ nhớ đệm riêng; bản sửa có thể cần yêu cầu quét lại hoặc gửi URL ảnh/trang có phiên bản mới.

```sh
npm run preview:image
```

Lệnh này tạo lại ảnh mặc định **Quý khách · 31/10/2026 · 10:00** và metadata mặc định trong `index.html`, dùng chung renderer với ảnh động.

GitHub Pages vẫn hoạt động dưới `/wedding-invitation/` với các đường dẫn `./public/...`; nội dung khi mở trang đọc param bằng JavaScript. **Preview trên GitHub Pages chỉ là preview mặc định**. Muốn preview riêng theo khách, gửi link Vercel sau khi deploy. Đường dẫn `/wedding-invitation/` cũng được hỗ trợ trên Vercel/local.

## Tài nguyên và hành vi

- Giữ nguyên ảnh gốc trong `public/images/wedding/originals/`; giao diện dùng `optimized/`, lightbox dùng `lightbox/`, ảnh nhỏ dùng `thumbnails/`.
- QR và nhạc đọc từ cấu hình; không chạy `scripts/create-assets.mjs` sau khi đã thay tài nguyên thật.
- Sổ lưu bút lưu trên trình duyệt bằng `localStorage`, chưa có backend dùng chung.
- Giữ luồng mở thiệp, nhạc, album, popup và tạm dừng tự cuộn khi tương tác; tôn trọng `prefers-reduced-motion`.
- Không có trang quản trị, RSVP hoặc đếm ngược.
