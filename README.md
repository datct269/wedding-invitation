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
- Sổ lưu bút lưu chung trong Firestore qua API Vercel; cần cấu hình Firebase trước khi sử dụng.
- Giữ luồng mở thiệp, nhạc, album, popup và tạm dừng tự cuộn khi tương tác; tôn trọng `prefers-reduced-motion`.
- Không có trang quản trị, RSVP hoặc đếm ngược.

## Sổ lưu bút dùng chung — Firebase Firestore Spark

Giao diện gửi/đọc lời chúc qua `/api/guestbook`, không lưu vào `localStorage` và không báo thành công khi API lỗi. Lời chúc mới nhất đứng trước; mỗi trang tải 20 lời chúc, nút “Xem thêm” tải trang tiếp theo. Danh sách trên Vercel cache 60 giây, nên khách khác có thể thấy lời chúc mới sau khoảng một phút. Người gửi thấy ngay lời chúc vừa lưu.

API giới hạn tên 80 ký tự, lời chúc 1000 ký tự và 10 lượt gửi/phút cho mỗi địa chỉ IP. Gửi lại cùng yêu cầu sau lỗi mạng không tạo lời chúc trùng. Tên trong URL chỉ là cá nhân hóa, không xác thực danh tính. SDK Firebase chỉ chạy phía máy chủ; bản sửa dependency `uuid` được ghim để dùng SDK tương thích Node.js 20 mà không giữ lỗi đã được công bố.

### 1. Tạo Firebase miễn phí

1. Vào https://console.firebase.google.com/, **Create a project**; ví dụ `wedding-dat-diu`. Có thể tắt Google Analytics. Giữ gói **Spark**, không cần nâng lên Blaze.
2. Mở **Build → Firestore Database → Create database**. Dùng **Standard edition**, database **`(default)`**, **Production mode**; chọn **Singapore (`asia-southeast1`)**. Vị trí database không đổi được sau khi tạo.
3. Trong tab **Rules**, dùng nội dung `firestore.rules` của repository và nhấn **Publish**. Rule chặn truy cập trực tiếp từ trình duyệt; API sử dụng Admin SDK nên vẫn đọc/ghi được. Không bật Test mode hay rule cho phép mọi người ghi trực tiếp.
4. Mở **Project settings → Service accounts → Generate new private key**, tải file JSON về và giữ riêng. Không commit file hoặc gửi khóa qua chat.

### 2. Cấu hình local

Sau khi tải file JSON, chạy từ thư mục dự án (thay đường dẫn bên dưới):

```powershell
npm run configure:firebase -- "C:\Users\DELL\Downloads\your-service-account.json"
npm run dev
```

Công cụ tạo `.env.local` đã được Git bỏ qua, không in khóa ra màn hình. Nếu server local đang chạy, dừng rồi khởi động lại để nạp cấu hình.

Mở thiệp ở hai trình duyệt hoặc một cửa sổ thường và một cửa sổ ẩn danh. Gửi lời chúc ở cửa sổ thứ nhất, tải lại cửa sổ thứ hai; lời chúc phải xuất hiện ở cả hai. Kiểm tra collection `guestbook_messages` trong Firebase Console để xác nhận dữ liệu được lưu thật.

### 3. Cấu hình Vercel

Vào **Project → Settings → Environment Variables**, thêm ba biến cho môi trường Production (và Preview nếu cần thử):

| Biến | Giá trị lấy từ file JSON đã tải |
| --- | --- |
| `FIREBASE_PROJECT_ID` | `project_id` |
| `FIREBASE_CLIENT_EMAIL` | `client_email` |
| `FIREBASE_PRIVATE_KEY` | `private_key`, gồm toàn bộ BEGIN/END PRIVATE KEY và các dòng khóa |

Không đặt tiền tố `NEXT_PUBLIC_` hay đưa các giá trị này vào `src/data.js`. File `.env.example` chỉ là mẫu. Sau khi thêm/sửa biến môi trường, **Redeploy** rồi kiểm tra lại gửi/đọc lời chúc bằng hai trình duyệt trên URL công khai. Trước khi có cấu hình hợp lệ, API trả 503 và giao diện cho phép thử lại; các phần thiệp khác vẫn hoạt động.

Firestore tự tạo `guestbook_messages` và `guestbook_rate_limits` khi gửi lời chúc đầu tiên. Query dùng index mặc định cho `createdAt`; không cần realtime listener, Cloud Functions Firebase, Storage hay database khác. Có thể xóa lời chúc không phù hợp trực tiếp trong Firebase Console. Các lời chúc thử nghiệm trước đây trong `localStorage` không tự được đăng lên cơ sở dữ liệu chung.

## Gửi thiệp khi Messenger không hiện ảnh preview

Messenger quyết định cách hiển thị preview; Sharing Debugger đọc được ảnh không đảm bảo Messenger hiển thị ảnh. Có thể gửi trực tiếp ảnh thiệp cá nhân hóa cùng link, không cần scrape từng khách.

Tạo một file JSON theo `scripts/invitation-guests.example.json`: mỗi khách có `to` (tên), `side` (`groom`/`bride`) và `slot` (`oct30`/`oct31`). Chạy:

```bash
npm run invitations:export -- scripts/invitation-guests.example.json https://wedding-invitation-dat-diu.vercel.app/
```

Mỗi lần chạy tạo thư mục riêng trong `invitation-exports/`, gồm ảnh PNG và file TXT chứa link tương ứng cho từng khách, cùng `links.json` tổng hợp. Ảnh dùng lại mẫu preview và dữ liệu cưới hiện có. Gửi ảnh dưới dạng ảnh trong Messenger rồi dán link từ file TXT; ảnh đính kèm không tự là link bấm được. Công cụ chỉ tạo file local, không gửi tin nhắn, không cần Firebase hoặc deploy. Danh sách khách và ảnh xuất được giữ local, không đưa lên Git; công cụ không sửa preview tự động của Messenger.
