# Triển khai production và tạo link khách mời

## Quyết định và trạng thái

- Production đã chốt mã ngẫu nhiên **32 ký tự hex**, Worker tra KV `INVITATIONS` lấy tên/nhóm/lịch; không dùng JWT hoặc secret ký. Mã có 128 bit ngẫu nhiên mật mã.
- Website chính ở https://datct269.github.io/wedding-invitation/. Worker dùng Cloudflare, không cung cấp API liệt kê/ghi dữ liệu công khai.
- Tool, Worker và client đã chuyển sang KV. Worker production chưa deploy, namespace production chưa tạo; API/prefix production còn trống. ID KV toàn số 0 trong config chỉ dành cho local.
- Bốn trang demo public ở commit `4fd8e1f` chỉ có khách giả, độc lập với KV. Link JWT cũ cần sinh lại; không cắt JWT thành mã ngắn.
- Hướng dẫn tool đầy đủ: [invitation-links.md](invitation-links.md). Tool chính `scripts/create-guest-links.mjs`, tool nhập `scripts/import-invitations.mjs`, config `config/link-targets.json`.

## Prefix mong muốn

```text
https://wedding-invitation.dat-diu.workers.dev/invite
```

Subdomain tài khoản `dat-diu` **chưa xác nhận khả dụng**. Xác nhận URL thật trước khi cấu hình; nếu khác cần chủ website chọn lại, không tự đoán.

Link gửi: `<prefix>?i=<mã-32-ký-tự>`. Prefix không chứa `?i`. Bot Telegram nhận HTML OG/ảnh riêng; người mở được chuyển đến `https://datct269.github.io/wedding-invitation/?i=<mã>`. Link thẳng Pages chỉ có metadata mặc định; gửi link Worker `/invite` để có preview cá nhân hóa.

## Quyền truy cập và dữ liệu

Chủ website đã yêu cầu triển khai production. Cần chủ website đăng nhập Cloudflare hoặc cấp quyền qua cấu hình riêng; không gửi mật khẩu/credential trong chat.

```powershell
npx wrangler login
npx wrangler whoami
```

Nếu dùng API token, cấu hình `CLOUDFLARE_API_TOKEN` và `CLOUDFLARE_ACCOUNT_ID` riêng trong môi trường, giới hạn đúng tài khoản với quyền Workers Scripts và Workers KV Storage cần thiết. Credential phải mạnh, giữ riêng, không commit hoặc đưa vào JS public. Không cần `INVITATION_JWT_SECRET`; key tạm `secret` không dùng trên production. Đổi credential quản lý không làm mất hiệu lực các mã khách.

Không nhập khách thật trước khi chủ website cho phép batch cụ thể. Bước kiểm tra production chỉ dùng khách giả. Batch KV, file input và output chứa dữ liệu riêng, không đặt trong public và không commit.

## Các bước triển khai

1. Xác nhận tài khoản và workers.dev subdomain. Tạo namespace:

   ```powershell
   npx wrangler kv namespace create INVITATIONS --config worker/wrangler.toml
   ```

   Thay ID placeholder của binding `INVITATIONS` trong `worker/wrangler.toml` bằng ID thật. Namespace ID không phải secret. Giữ KV local và remote riêng.

2. Giữ `SITE_URL=https://datct269.github.io/wedding-invitation/`; CORS cho origin `https://datct269.github.io`. Không bật `LOCAL_DEVELOPMENT` ở production.
3. Kiểm tra trước deploy:

   ```powershell
   npm test
   npm run build
   npx wrangler deploy --config worker/wrangler.toml --dry-run
   npx wrangler deploy --config worker/wrangler.toml
   ```

   Ghi URL Worker thật và version ID vào nhật ký dưới đây; kiểm tra prefix mong muốn trước khi publish Pages.

4. Đặt `invitationLookupUrl.production` trong `src/data.js` thành `<Worker-origin>/api/invitation`. Đặt prefix target `github` thành `<Worker-origin>/invite`, siteUrl giữ Pages. Chỉ đổi `defaultTarget` sang `github` khi production đã kiểm tra thành công.
5. Tạo một Excel/CSV giả gồm hai nhóm × hai lịch, sinh batch và nhập:

   ```powershell
   npm run links:create -- guest-links-input-smoke.xlsx guest-links-output-smoke.xlsx --target github
   npm run links:import -- guest-links-output-smoke-kv.json --remote
   ```

   Import kiểm tra mã đã có và từ chối ghi dữ liệu khác. Không nhập đồng thời nhiều tiến trình. KV có độ trễ lan truyền; đợi API tra được trước khi gửi link. Giữ file output cùng batch, không sinh lại rồi nhập batch cũ.
6. Commit/publish cấu hình Pages theo quyền được chủ website cấp. Chờ workflow đúng SHA báo Success; kiểm tra các URL thật trên desktop/mobile và Telegram.
7. Sau khi chủ website xem kết quả và cho phép batch khách thật, dùng cùng lệnh với input/output riêng. Giữ các bản ghi cũ khi thêm batch để link đã gửi tiếp tục hoạt động. Sao lưu input/output/bulk KV ở nơi riêng.

## Checklist nghiệm thu

- Hai nhóm cho đúng thứ tự tên ở bìa/giới thiệu/chân trang; tên HTML có escape an toàn, guestbook khóa cùng tên đã tra.
- 30/10/2026: Thứ Sáu, 21/09 Bính Ngọ, 17:00; 31/10/2026: Thứ Bảy, 22/09 Bính Ngọ, 10:00. Bìa và preview có cả ngày/giờ.
- Lễ cưới giữ nguyên markup/nội dung và 13:30 ngày 31/10/2026.
- Thiếu/sai/sửa mã, query `to`, Worker/KV lỗi: Quý khách, Tiến Đạt – Huyền Dịu, 31/10/2026 10:00; không treo thiệp.
- XLSX/CSV đọc được, dropdown, trống dùng mặc định, bỏ dòng không tên, trùng tên vẫn khác mã, mã đúng 32 hex, batch tương ứng link.
- API không liệt kê/ghi công khai; CORS đúng; preview PNG 1200×630, redirect đúng Pages. Kiểm tra chính link `/invite` khi gửi Telegram.
- Desktop và mobile 390×844 không tràn ngang; giữ style, ảnh, font, animation và hành vi thiệp.
- Test/build đạt; xem git diff/status và `git check-ignore` bảo đảm không commit khách thật, credential hoặc dist.
- Theo dõi lỗi Worker qua Dashboard; không thêm log tên, token hoặc credential.

## Khôi phục và nhật ký

Trước deploy ghi version Worker, SHA Pages và namespace ID; backup KV riêng. Nếu Worker lỗi, rollback version đã hoạt động bằng Cloudflare Dashboard; nếu frontend lỗi, revert commit Pages rồi publish lại. Worker/client phải cùng loại mã. Không xóa KV khi rollback. Bản JWT cũ không đọc được mã KV; quay về JWT cần phục hồi cả Worker/client/tool và đúng key riêng, các mã KV sẽ không dùng được ở bản đó.

Thu hồi lời mời bằng cách xóa đúng mã khi được yêu cầu; nếu thay link, sinh mã mới và nhập đúng bản ghi. Không ghi credential hoặc dữ liệu khách vào nhật ký trong repo.

| Mục | Trạng thái |
| --- | --- |
| Tài khoản Cloudflare | Chờ xác nhận đăng nhập |
| Worker URL | Chưa xác nhận |
| Namespace ID | Chưa tạo |
| Worker version | Chưa deploy |
| Pages SHA cho API production | Chưa publish |
| Smoke test public | Chưa thực hiện |
| Batch khách thật | Chưa nhập |
