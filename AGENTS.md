# AGENTS.md

## Tổng quan dự án

Đây là thiệp cưới trực tuyến dành cho khách mời của **Tiến Đạt & Huyền Dịu**. Giao diện theo phong cách Romantic Đỏ với tông đỏ, kem và vàng; có hiệu ứng mở thiệp, chuyển động hoa/cánh hoa nhẹ, album ảnh 3D, lightbox, sổ lưu bút, hộp quà mừng, nhạc nền và tự động cuộn.

Website đang được xuất bản bằng GitHub Pages tại:

- https://datct269.github.io/wedding-invitation/

## Công nghệ và lệnh làm việc

Dự án là website tĩnh, không dùng framework hoặc thư viện giao diện lớn. Mã nguồn dùng HTML, CSS và JavaScript ES modules; các script Node.js đảm nhiệm chạy local, kiểm tra và build.

Yêu cầu Node.js 20 trở lên.

```bash
npm run dev
npm test
npm run build
```

- `npm run dev`: chạy website local tại `http://localhost:5173`.
- `npm test`: chạy các bài kiểm tra trong `tests/*.test.mjs`.
- `npm run build`: kiểm tra cú pháp và tạo bản build trong `dist/`.
- Không commit thư mục `dist/`.

## Cấu trúc chính

- `index.html`: HTML gốc và Open Graph/Twitter metadata được crawler đọc trực tiếp.
- `src/main.js`: khởi tạo trang, ghép các phần giao diện và kết nối hành vi chính.
- `src/data.js`: nguồn dữ liệu trung tâm cho thông tin cưới, ảnh, địa điểm, quà mừng, nhạc và cấu hình chuyển động.
- `src/styles.css`: toàn bộ giao diện responsive và animation.
- `src/components/cover.js`: bìa và hiệu ứng mở thiệp.
- `src/components/sections.js`: thông tin lễ cưới, lịch, địa điểm và các phần nội dung.
- `src/components/gallery.js`: album 3D, autoplay và lightbox.
- `src/components/guestbook.js`: giao diện sổ lưu bút.
- `src/components/gifts.js`: nút và popup quà mừng.
- `src/components/controls.js`: điều khiển nhạc và tự động cuộn.
- `src/components/overlay.js`: hành vi chung cho các lớp phủ/modal.
- `src/guestbook-store.js`: lớp lưu lời chúc bằng `localStorage`, được thiết kế để có thể thay bằng API sau này.
- `src/scroll.js`: logic tự động cuộn và tạm dừng khi người dùng tương tác.
- `src/lib.js`: tiện ích xử lý tên khách, escape nội dung, ảnh và lịch.
- `public/images/wedding/`: ảnh cưới theo từng kích thước sử dụng.
- `public/images/gift/`: ảnh QR quà mừng.
- `public/audio/`: nhạc nền.
- `scripts/`: server local, build và công cụ tạo/tối ưu tài nguyên.

## Dữ liệu cưới hiện tại

- Chú rể: Chu Tiến Đạt.
- Cô dâu: Nguyễn Huyền Dịu.
- Tiệc mặc định: 10:00 ngày 31/10/2026, tức 22/09 năm Bính Ngọ âm lịch; token có thể chọn 17:00 ngày 30/10/2026 (21/09 âm lịch).
- Lễ thành hôn: 13:30 ngày 31/10/2026, tức 22/09 năm Bính Ngọ âm lịch; phần này không đổi theo token.
- Thông tin hai gia đình, địa chỉ và tọa độ bản đồ nằm trong `src/data.js`.

Khi thay đổi nội dung, hãy sửa nguồn dữ liệu trong `src/data.js` thay vì viết trực tiếp vào component. Không sao chép thông tin tài khoản ngân hàng sang tài liệu hoặc component khác.

## Cá nhân hóa tên khách

Lời mời dùng mã ngẫu nhiên 32 ký tự hex trong query parameter `i`. Worker tra binding KV `INVITATIONS` để lấy tên, nhóm và lịch; không dùng JWT. `to` cũ bị bỏ qua.

```text
https://YOUR-WORKER/invite?i=<mã-32-ký-tự>
```

- Mã có 128 bit ngẫu nhiên, không chứa dữ liệu khách và không cần secret ký JWT. Quyền Cloudflare chỉ ở môi trường quản lý; không đưa vào JavaScript public hoặc Git. Không cung cấp API liệt kê/ghi KV công khai.
- Token thiếu/sai hoặc Worker lỗi dùng `Quý khách`, Tiến Đạt – Huyền Dịu và 31/10/2026 10:00.
- Hiển thị bằng text binding an toàn; không dùng `innerHTML` với dữ liệu do khách nhập.
- Khi Worker trả tên đã xác minh, sổ lưu bút dùng cùng tên và khóa trường tên. Khi fallback, khách có thể nhập tên.
- Tool XLSX/CSV và cấu hình môi trường xem `docs/invitation-links.md`, deploy xem `docs/production-deployment.md`; dữ liệu khách, batch KV và credential phải bị Git bỏ qua.

## Quy tắc ảnh và tài nguyên

- Mọi đường dẫn ảnh dùng trong giao diện phải được khai báo tập trung trong `src/data.js`.
- Không rải URL ảnh trực tiếp trong component.
- Giữ nguyên ảnh gốc trong `public/images/wedding/originals/`.
- Giao diện thường dùng ảnh trong `optimized/`; lightbox dùng `lightbox/`; ảnh nhỏ dùng `thumbnails/`.
- Giữ container có tỷ lệ cố định, `object-fit` và fallback để ảnh lỗi không phá bố cục.
- Không chỉnh sửa, nén đè hoặc xóa ảnh gốc nếu không có yêu cầu rõ ràng.
- QR và nhạc là tài nguyên cấu hình; component chỉ đọc đường dẫn từ dữ liệu.

## Social preview

- Ảnh preview: `public/images/og-preview.png`, kích thước 1200 × 630 px.
- URL công khai: `https://datct269.github.io/wedding-invitation/public/images/og-preview.png`.
- Metadata Open Graph và Twitter nằm trực tiếp trong `index.html`, không chèn bằng JavaScript phía client.
- Công cụ tạo lại ảnh preview: `scripts/create-og-preview.mjs`. Công cụ này đọc dữ liệu cưới từ `src/data.js` và tái sử dụng họa tiết hiện có.
- Khi thay ảnh hoặc metadata, luôn giữ URL tuyệt đối và đường dẫn `/wedding-invitation/` tương thích với GitHub Pages.

## Hành vi cần bảo toàn

- Thiệp bắt đầu ở trạng thái đóng; nội dung chính chỉ hoạt động sau khi mở thiệp.
- Nhạc và tự động cuộn bắt đầu theo luồng mở thiệp hiện có.
- Tự động cuộn phải tạm dừng khi mở lightbox, mở popup quà, nhập lời chúc hoặc thao tác album.
- Album phải tiếp tục hỗ trợ autoplay, điều hướng thủ công, swipe trên mobile và bàn phím trong lightbox.
- Sổ lưu bút hiện chỉ lưu trên trình duyệt; chưa có backend.
- Không thêm RSVP, đếm ngược, trang quản trị hoặc trình chỉnh sửa nếu chưa được yêu cầu.

## Quy tắc chỉnh sửa

- Giữ thay đổi nhỏ và đúng phạm vi yêu cầu.
- Tái sử dụng kiến trúc, state, config và component hiện có.
- Không đổi phong cách Romantic Đỏ, font, màu, animation, bố cục hoặc nội dung không liên quan.
- Giữ chuyển động chậm, mềm và ưu tiên `transform`/`opacity` để đảm bảo hiệu năng.
- Kiểm tra desktop và đặc biệt viewport mobile khoảng 390 × 844; không để tràn ngang hoặc che nút quan trọng.
- Tôn trọng `prefers-reduced-motion`.
- Trước khi commit, chạy `npm test` và `npm run build`, sau đó kiểm tra `git diff` để tránh đưa thay đổi ngoài phạm vi lên Git.

## Triển khai GitHub Pages

GitHub Pages phục vụ trực tiếp dự án dưới đường dẫn `/wedding-invitation/`. Các đường dẫn hiện có dạng `./public/...` là có chủ đích và phải tiếp tục hoạt động ở cả local lẫn URL đã publish. Không chuyển sang quy ước asset của Vite nếu dự án vẫn dùng hệ thống build hiện tại.
