# Triển khai production và tạo link khách mời

## Trạng thái và quyết định đã chốt

- Website chính: https://datct269.github.io/wedding-invitation/ trên GitHub Pages.
- Bản demo công khai đã được publish ở commit `4fd8e1f`. Bốn mã 32 ký tự trong `public/invitation-demos/` chỉ dùng khách giả và bảng tra tĩnh; không dùng cách này cho khách thật.
- Code hiện tại: tool sinh JWT HS256, Worker xác minh JWT; không có KV binding. Worker mới được kiểm thử local, chưa deploy Cloudflare. API production và prefix production đang trống.
- **Quyết định production mới:** mã ngẫu nhiên đúng 32 ký tự hex, Worker tra Cloudflare KV để lấy tên khách, nhóm và lịch. Chuyển đổi này chưa được triển khai; hướng dẫn KV bên dưới là quy trình cần hoàn thiện trước khi deploy.
- Mã được sinh từ 16 byte ngẫu nhiên mật mã (128 bit), mỗi dòng một mã kể cả trùng tên. Không chứa tên, không phải JWT rút gọn và không cần secret ký JWT.
- Quyền ghi KV dùng đăng nhập Wrangler hoặc API token Cloudflare riêng có quyền tối thiểu cần thiết. Không dùng key tạm `secret` trên production, không để credential trong Git, config public hoặc JavaScript trình duyệt.

## URL production

Prefix mong muốn, **chưa xác nhận subdomain tài khoản còn khả dụng**:

```text
https://wedding-invitation.dat-diu.workers.dev/invite
```

Link gửi khách có dạng `<prefix>?i=<mã-32-ký-tự>`. Không đặt `?i` trong giá trị prefix; tool tự thêm query và mã. Nếu `dat-diu` không khả dụng, xác nhận địa chỉ khác với chủ website trước khi cấu hình; không tự đoán URL.

Worker trả HTML/ảnh Open Graph cá nhân hóa cho crawler Telegram, và redirect trình duyệt tới:

```text
https://datct269.github.io/wedding-invitation/?i=<mã-32-ký-tự>
```

Gửi link `/invite` để có preview theo khách/lịch. Link thẳng GitHub Pages có metadata mặc định vì crawler không chạy JavaScript. Không cần thêm query `preview`.

## Tool hiện có: chạy được ngay ở local (JWT)

Tool chính: `scripts/create-guest-links.mjs` (`npm run links:create`). Tool mẫu: `scripts/create-link-template.mjs` (`npm run links:template`). Tool dùng ExcelJS đọc/ghi XLSX/CSV; `scripts/link-config.mjs` đọc cấu hình URL. Các lệnh trong mục này hiện sinh **JWT dài**, chưa sinh mã production 32 ký tự.

### 1. Cài đặt và mở local

Yêu cầu Node.js 20 trở lên. Tại thư mục repo:

```powershell
npm ci
```

Nếu chưa có `worker/.dev.vars`, tạo secret local riêng (không in ra màn hình). Lệnh dưới thay key nếu file đã tồn tại; thay key sẽ làm link JWT cũ mất hiệu lực:

```powershell
node -e "require('fs').writeFileSync('worker/.dev.vars','INVITATION_JWT_SECRET='+require('crypto').randomBytes(32).toString('hex')+'\n')"
```

Mở hai terminal:

```powershell
npm run worker:dev
```

```powershell
npm run dev
```

Website ở `http://localhost:5173/`, Worker ở `http://localhost:8787/`. Không gửi localhost cho Telegram hoặc người dùng trên máy khác.

### 2. Tạo và điền file đầu vào

```powershell
npm run links:template
```

Mở `guest-links-input-template.xlsx`, điền ba cột:

| Cột | Giá trị |
| --- | --- |
| Tên khách | Tên có dấu, tối đa 80 ký tự sau khi trim; bỏ qua dòng trống |
| Nhóm khách | Nhà trai hoặc Nhà gái; trống mặc định Nhà gái |
| Lịch tiệc | 30/10/2026 17:00 hoặc 31/10/2026 10:00; trống mặc định 31/10/2026 10:00 |

Excel mẫu có dropdown và mặc định sẵn ở 100 dòng. CSV dùng cùng header, UTF-8 và không có dropdown, ví dụ với dữ liệu giả:

```csv
Tên khách,Nhóm khách,Lịch tiệc
Khách thử nhà trai,Nhà trai,30/10/2026 17:00
Khách thử nhà gái,,
```

### 3. Sinh file kết quả

Tool và Worker local phải dùng cùng secret. Trong terminal sinh link:

```powershell
$env:INVITATION_JWT_SECRET = ((Get-Content worker/.dev.vars | Where-Object { $_ -match '^INVITATION_JWT_SECRET=' }) -replace '^INVITATION_JWT_SECRET=', '').Trim('"')
try {
  npm run links:create -- guest-links-input-template.xlsx guest-links-output.xlsx --target local
  # Hoặc CSV:
  # npm run links:create -- guest-links-input.csv guest-links-output.csv --target local
} finally {
  Remove-Item Env:INVITATION_JWT_SECRET
}
```

Kết quả gồm tên, nhóm, lịch và link riêng. Dòng trùng tên vẫn có token khác nhau. Mở link trong cột `Link riêng` trên máy đang chạy hai server.

`npm run links:examples` tạo bốn link JWT giả trong `.local/guest-links-examples.json`. `npm run links:demo` tạo trang demo tĩnh với khách giả; không đưa khách thật vào tool demo.

### 4. Cấu hình prefix/đường dẫn config

`config/link-targets.json` có `defaultTarget` và target `local`, `github`, `cloudflare`; mỗi target có `prefix` và `siteUrl`. Target `github` vẫn dùng prefix Worker `/invite` để preview hoạt động, còn `siteUrl` là GitHub Pages. Hai prefix production hiện trống có chủ đích.

Các ví dụ sau chỉ chạy sau khi đặt secret cho tool; địa chỉ `YOUR-WORKER` cần thay bằng URL thực tế:

```powershell
npm run links:create -- guest-links-input-template.xlsx guest-links-output.xlsx --target github
npm run links:create -- guest-links-input.csv guest-links-output.csv --prefix https://YOUR-WORKER/invite
npm run links:create -- guest-links-input-template.xlsx guest-links-output.xlsx --config path/to/link-targets.json --target github
```

`--prefix` ưu tiên hơn prefix target; `--config` chọn file cấu hình khác. Các tùy chọn này đã có nhưng không tự chuyển JWT sang mã 32 ký tự.

## Việc cần triển khai trước production (32 ký tự + KV)

1. Thay sinh/xác minh JWT bằng mã ngẫu nhiên 32 hex và tra KV. Kiểm tra trùng mã khi sinh và khi nhập; không ghi đè mã đã có với dữ liệu khác. Giữ luồng nhập XLSX/CSV và tùy chọn prefix/config.
2. Tool xuất Excel/CSV cùng file bulk JSON cho KV: mỗi bản ghi có `key` là mã, `value` là chuỗi JSON chứa `{name, group, event}`. Giá trị `event`: `2026-10-30T17:00` hoặc `2026-10-31T10:00`. Dự kiến file mặc định `guest-links-output-kv.json`; CLI xuất file này chưa có.
3. Khôi phục binding KV `INVITATIONS` trong Worker. API chỉ tra một mã ở `/api/invitation?i=...`, trả `{name, group, event}`; không cung cấp API liệt kê hay ghi KV công khai. `/invite` và `/preview.png` dùng cùng kết quả tra để bìa/preview đồng nhất.
4. Đổi client sang API mã 32 ký tự, không nhầm với bảng tra demo tĩnh. Query `to`, nhóm hay lịch tự thêm không được đổi thông tin đã tra.
5. Giữ CORS cho origin `https://datct269.github.io`; `SITE_URL` là URL Pages đầy đủ. Không bật `LOCAL_DEVELOPMENT` ở production.
6. Mã thiếu/sai, chưa nhập hoặc lỗi Worker: Quý khách, Tiến Đạt – Huyền Dịu, 31/10/2026 10:00. Nhà gái đảo thứ tự tên ở bìa/giới thiệu/chân trang; lễ cưới luôn giữ 13:30 ngày 31/10/2026. Tên gắn an toàn, guestbook nhận cùng tên đã xác thực.
7. Link JWT thử nghiệm cũ cần tạo lại; không cắt ngắn JWT. Chuyển sang KV sẽ cần nhập dữ liệu khách lên Cloudflare, chỉ thực hiện sau khi chủ website cho phép.

## Quy trình deploy sau khi hoàn thiện KV

**Không chạy mục này với code JWT hiện tại.** Cần chủ website cho phép deploy và nhập KV; chủ website đăng nhập Cloudflare hoặc cấp API token qua cấu hình riêng, không gửi mật khẩu/secret trong chat.

1. Xác nhận đúng tài khoản và workers.dev subdomain. Nếu dùng đăng nhập tương tác:

   ```powershell
   npx wrangler login
   npx wrangler whoami
   ```

   Nếu dùng API token, cấu hình `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` riêng cho terminal và giới hạn đúng tài khoản cùng quyền Workers Scripts và Workers KV Storage cần thiết. Không ghi credential vào tài liệu. Mã khách 128 bit không cần `INVITATION_JWT_SECRET`; thu hồi key JWT cũ khi hoàn tất chuyển đổi.

2. Tạo namespace production:

   ```powershell
   npx wrangler kv namespace create INVITATIONS --config worker/wrangler.toml
   ```

   Lấy ID trả về để cấu hình binding `INVITATIONS` trong `worker/wrangler.toml`. Namespace ID không phải secret. KV local và production phải tách biệt.

3. Chạy `npm test`, `npm run build`; kiểm tra bundle Worker và chỉ deploy khi đạt:

   ```powershell
   npx wrangler deploy --config worker/wrangler.toml --dry-run
   npx wrangler deploy --config worker/wrangler.toml
   ```

   Ghi lại URL Worker thực tế, version ID và commit vào nhật ký triển khai; không ghi credential. Giữ `SITE_URL` là Pages.

4. Cấu hình `invitationLookupUrl.production` trong `src/data.js` thành `<Worker-origin>/api/invitation`; cấu hình target `github` trong `config/link-targets.json` với prefix `<Worker-origin>/invite`. Đặt `defaultTarget` là `github` sau khi production đã được kiểm tra; vẫn dùng `--target local` khi thử local.
5. Sinh một batch khách giả bằng tool đã chuyển sang mã 32 ký tự. Nhập đúng bulk file tương ứng:

   ```powershell
   npx wrangler kv bulk put guest-links-output-kv.json --binding INVITATIONS --config worker/wrangler.toml --remote
   ```

   Đây là thao tác ghi Cloudflare. Không nhập file khách thật ở bước smoke test. KV có thể mất thời gian lan truyền; xác nhận API đọc được trước khi gửi link. Không sinh lại token sau khi nhập mà dùng file output cùng batch.

6. Commit/publish thay đổi cấu hình Pages theo quy trình đã được chủ website cho phép. Chờ workflow của đúng commit báo Success, sau đó mở chính link công khai và gửi thử Telegram.
7. Sau khi chủ website xem xét kết quả, mới sinh và nhập batch khách thật theo cùng quy trình. Link vừa tạo chưa hoạt động cá nhân hóa cho đến khi KV được nhập và đọc được. Khi nhập thêm, giữ bản ghi cũ để link đã gửi tiếp tục hoạt động.

## Checklist nghiệm thu và bảo vệ dữ liệu

- Test hai nhóm × hai lịch: 30/10/2026 Thứ Sáu, 21/09 Bính Ngọ, 17:00; 31/10/2026 Thứ Bảy, 22/09 Bính Ngọ, 10:00. Lễ cưới không đổi theo token.
- Test thiếu/sai/sửa token, Worker mất mạng, tên có dấu/ký tự HTML, guestbook dùng tên xác thực; không treo thiệp, không dùng `innerHTML` cho tên.
- Test XLSX/CSV, dropdown, mặc định khi trống, bỏ dòng tên trống, trùng tên vẫn link khác, độ dài/định dạng mã và tra KV local.
- Kiểm tra desktop và mobile 390 × 844, không tràn ngang; giữ style, animation, ảnh, tài khoản ngân hàng và các hành vi hiện có.
- Kiểm tra API production, CORS, redirect, HTML OG và PNG công khai; Telegram phải lấy đúng tên/nhóm/ngày/giờ từ link `/invite`.
- `guest-links-input*`, `guest-links-output*`, `.local/`, `.dev.vars*` và `dist/` được Git bỏ qua; tên file khác cần thêm ignore trước khi tạo. Bulk KV cũng là dữ liệu riêng. Kiểm tra `git status`, `git diff --cached` và `git check-ignore <file>` trước commit; không đặt dữ liệu khách trong `public/`.
- Lưu bản sao file input/output/bulk KV ở nơi riêng có kiểm soát truy cập. Ai có link đều có thể mở lời mời; không dùng nó để lưu thông tin nhạy cảm khác.
- Theo dõi lỗi Worker/API sau publish bằng Cloudflare Dashboard hoặc `npx wrangler tail --config worker/wrangler.toml`; không log token, tên khách hoặc credential.

## Khôi phục và lưu vết

- Trước deploy, ghi commit Pages, version Worker, namespace ID và thời điểm vào nhật ký; sao lưu dữ liệu KV riêng, không commit bản sao.
- Nếu lỗi Worker, khôi phục version hoạt động trong Cloudflare; nếu lỗi frontend, revert commit cấu hình/code Pages rồi publish lại. Worker và frontend phải dùng cùng loại token.
- Nếu cần quay về JWT, phải quay cả tool/Worker/client và dùng lại đúng key riêng trước đó; mã KV không dùng được với Worker JWT. Không xóa KV hoặc thay mã khi rollback để tránh mất link đã gửi.
- Thu hồi một lời mời KV bằng cách xóa đúng mã khi được yêu cầu; tạo mã mới nếu cần thay link. Đổi quyền truy cập Cloudflare không làm vô hiệu mã khách đang có.
- Hiện chưa có production Worker, namespace ID, URL xác nhận hay batch khách thật. Điền nhật ký sau khi triển khai thực tế; không ghi trạng thái thành công trước khi kiểm tra công khai.
