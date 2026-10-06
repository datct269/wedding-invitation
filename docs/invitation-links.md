# Tạo lời mời bằng JWT

Để thử công khai trước khi có Worker, `npm run links:demo` tạo bốn trang mẫu với mã 32 ký tự trong `public/invitation-demos/`. Chỉ dữ liệu giả `Khách thử nhà trai/nhà gái` được xuất bản. Đây là bảng tra tĩnh cho demo, không phải JWT rút gọn hay tool dùng cho khách thật. Mỗi trang có ảnh OG riêng và mở đúng bìa/lịch. Link mẫu và Excel ở `.local/public-demo-links.json` và `guest-links-output-public-demo.xlsx`; secret vẫn ở file riêng, hiện dùng key tạm do người dùng chỉ định. JWT production vẫn dùng Worker, không cần KV.

JWT mang `name`, `group`, `event` và `jti` ngẫu nhiên. Payload đọc được bằng Base64URL; secret ký HS256 không nằm trong URL hay JavaScript public. Worker xác minh chữ ký, không dùng KV. JWT không hết hạn mặc định; thay secret vô hiệu hóa tất cả link cũ. Token hex/KV cũ không còn hợp lệ và cần tạo lại.

## Chạy local

1. Tạo secret riêng trong file bị Git bỏ qua (lệnh không in secret):

```powershell
node -e "const fs=require('fs');fs.writeFileSync('worker/.dev.vars','INVITATION_JWT_SECRET='+require('crypto').randomBytes(32).toString('hex')+'\n')"
```

2. Mở hai terminal trong repo:

```powershell
npm run worker:dev
```

```powershell
npm run dev
```

3. Sinh bốn lời mời giả (hai nhóm × hai lịch), không cần seed hay upload:

```powershell
npm run links:examples
```

Các URL nằm trong `.local/guest-links-examples.json`. `share` đi qua Worker local, `site` mở thẳng website local. Cả hai chỉ dùng trên máy chạy local. Telegram cần URL Worker công khai để truy cập; localhost không thể tạo preview trong Telegram.

## Tạo link từ Excel/CSV

```powershell
npm run links:template
```

Điền ba cột `Tên khách`, `Nhóm khách`, `Lịch tiệc` trong `guest-links-input-template.xlsx`. Nhóm chọn `Nhà trai`/`Nhà gái`; lịch chọn `30/10/2026 17:00`/`31/10/2026 10:00`. Tên trống bị bỏ qua. Nhóm/lịch trống mặc định `Nhà gái` và `31/10/2026 10:00`. Mỗi dòng có token riêng kể cả trùng tên.

Tool đọc secret từ `INVITATION_JWT_SECRET`; lấy cùng giá trị Worker local đang dùng mà không in ra:

```powershell
$env:INVITATION_JWT_SECRET = ((Get-Content worker/.dev.vars | Where-Object { $_ -match '^INVITATION_JWT_SECRET=' }) -replace '^INVITATION_JWT_SECRET=', '').Trim('"')
npm run links:create -- guest-links-input-template.xlsx guest-links-output.xlsx --target local
Remove-Item Env:INVITATION_JWT_SECRET
```

CSV dùng cùng header và giá trị:

```powershell
npm run links:create -- guest-links-input.csv guest-links-output.csv --target local
```

Đầu ra có tên, nhóm, lịch và link. Dùng ExcelJS đọc/ghi XLSX/CSV, `jose` ký/xác minh JWT. File đầu vào/kết quả với prefix `guest-links-input*`, `guest-links-output*` bị Git bỏ qua; nếu đặt tên khác phải tự thêm vào `.gitignore`. Không commit dữ liệu khách.

## Cấu hình URL

`config/link-targets.json` chứa `defaultTarget` và ba target `local`, `github`, `cloudflare`. Mỗi target có `prefix` (URL share Worker, thường kết thúc `/invite`) và `siteUrl` (website đích). Tool dùng `prefix`; đặt cùng `siteUrl` vào `SITE_URL` trong cấu hình Worker production hoặc `LOCAL_SITE_URL` khi local. Chọn `--target github`/`--target cloudflare`; hai prefix production đang trống và tool sẽ báo lỗi thay vì tự đoán domain.

Có thể dùng config ở đường dẫn khác hoặc override prefix:

```powershell
npm run links:create -- guest-links-input.xlsx guest-links-output.xlsx --config path/to/link-targets.json --target github
npm run links:create -- guest-links-input.xlsx guest-links-output.xlsx --prefix https://YOUR-WORKER/invite
```

Prefix GitHub vẫn là URL share Worker để bot nhận metadata động; người mở được redirect về GitHub Pages. Link thẳng GitHub Pages chỉ có ảnh OG mặc định tĩnh.

## Worker và preview

- `GET /api/invitation?i=<jwt>` trả `{name, group, event}` sau khi xác minh; token lỗi trả 401. CORS cho origin website cấu hình; localhost chỉ được phép khi bật `LOCAL_DEVELOPMENT=true`.
- `GET /invite?i=<jwt>` redirect trình duyệt tới `SITE_URL` kèm token. Bot Telegram/WhatsApp nhận HTML Open Graph với URL canonical riêng theo token.
- `GET /preview.png?i=<jwt>` trả PNG 1200×630 theo tên, nhóm và lịch. `@resvg/resvg-wasm` render artwork hoa hiện có với font Noto (giấy phép OFL trong `worker/assets/OFL.txt`). Token sai/thiếu cho preview mặc định: Quý khách, Tiến Đạt – Huyền Dịu, 31/10/2026 10:00.

Trang thiệp gọi API Worker bằng URL tập trung ở `invitationLookupUrl` trong `src/data.js`. `production` hiện trống nên public Pages vẫn dùng mặc định. Worker local dùng `.dev.vars`; Worker production phải đặt `INVITATION_JWT_SECRET` bằng Wrangler Secret, cùng giá trị tool dùng. Không đặt secret trong `[vars]`, config target hay JavaScript.

Trước khi dùng công khai cần tự cấu hình domain Worker, `SITE_URL`, secret Worker và `invitationLookupUrl.production` thành `https://YOUR-WORKER/api/invitation`. Không cần KV hay upload danh sách khách. Bước triển khai hiện tại chỉ kiểm thử local, không đăng nhập/deploy Cloudflare.
