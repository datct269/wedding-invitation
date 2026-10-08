# AGENTS.md

## Tổng quan dự án

Đây là thiệp cưới trực tuyến dành cho khách mời của **Tiến Đạt & Huyền Dịu**. Giao diện theo phong cách Romantic Đỏ với tông đỏ, kem và vàng; có hiệu ứng mở thiệp, chuyển động hoa/cánh hoa nhẹ, album ảnh 3D, lightbox, sổ lưu bút, hộp quà mừng, nhạc nền và tự động cuộn.

Website đang được xuất bản bằng GitHub Pages tại:

- https://datct269.github.io/wedding-invitation/

## Công nghệ và lệnh làm việc

Dự án dùng HTML, CSS và JavaScript ES modules, không dùng framework hoặc thư viện giao diện lớn. Giao diện và tài nguyên là file tĩnh; Vercel Functions phục vụ metadata/preview động và API sổ lưu bút dùng Firebase Firestore. Các script Node.js đảm nhiệm chạy local, kiểm tra và build.

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
- `src/guestbook-store.js`: lớp gọi API sổ lưu bút dùng chung; không lưu lời chúc bằng `localStorage`.
- `api/guestbook.js` và `server/guestbook*.js`: API và lớp lưu Firestore, gồm phân trang, chống gửi trùng và giới hạn gửi.
- `src/scroll.js`: logic tự động cuộn và tạm dừng khi người dùng tương tác.
- `src/lib.js`: tiện ích xử lý tên khách, escape nội dung, ảnh và lịch.
- `public/images/wedding/`: ảnh cưới theo từng kích thước sử dụng.
- `public/images/gift/`: ảnh QR quà mừng.
- `public/audio/`: nhạc nền.
- `scripts/`: server local, build và công cụ tạo/tối ưu tài nguyên.

## Dữ liệu cưới hiện tại

- Chú rể: Chu Tiến Đạt.
- Cô dâu: Nguyễn Huyền Dịu.
- Tiệc cưới: 10:00 ngày 30/10/2026, tức 21/09 năm Bính Ngọ âm lịch.
- Lễ thành hôn: 14:00 ngày 31/10/2026, tức 22/09 năm Bính Ngọ âm lịch.
- Thông tin hai gia đình, địa chỉ và tọa độ bản đồ nằm trong `src/data.js`.

Khi thay đổi nội dung, hãy sửa nguồn dữ liệu trong `src/data.js` thay vì viết trực tiếp vào component. Không sao chép thông tin tài khoản ngân hàng sang tài liệu hoặc component khác.

## Cá nhân hóa tên khách

Tên khách được lấy từ query parameter `to`:

```text
https://datct269.github.io/wedding-invitation/?to=Nguyễn%20Văn%20An
```

- Chuẩn hóa bằng `URLSearchParams` và `trim()` trong `src/lib.js`.
- Giá trị mặc định là `Quý khách` nếu thiếu, rỗng hoặc chỉ có khoảng trắng.
- Hiển thị bằng text binding an toàn; không dùng `innerHTML` với dữ liệu do khách nhập.
- Khi URL có tên khách, sổ lưu bút dùng sẵn tên đó và khóa trường tên. Khi không có tên, khách có thể nhập tên.

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
- Sổ lưu bút lưu chung trên Firestore qua API Vercel/local; tải 20 lời chúc mỗi trang và cache danh sách 60 giây. Không báo thành công nếu lưu API lỗi.
- Khóa Firebase chỉ được đặt trong `.env.local` hoặc biến môi trường Vercel; không đưa vào `src/`, `public/`, tài liệu hay Git.
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
