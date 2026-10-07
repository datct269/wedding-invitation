# Tạo lời mời bằng mã 32 ký tự

Tool `scripts/create-guest-links.mjs` dùng ExcelJS đọc/ghi XLSX/CSV, sinh 16 byte ngẫu nhiên mật mã thành 32 ký tự hex và xuất batch KV. Worker tra KV, không dùng JWT hay secret ký. Link JWT cũ cần tạo lại. File và credential riêng không được commit.

## Chuẩn bị local

Node.js 20 trở lên:

```powershell
npm ci
```

Mở hai terminal ở thư mục repo:

```powershell
npm run worker:dev
```

```powershell
npm run dev
```

Website ở http://localhost:5173, Worker ở http://localhost:8787. KV giả lập dùng binding `INVITATIONS` trong `worker/wrangler.toml`, không cần tài khoản Cloudflare. ID toàn số 0 chỉ dành cho local, phải thay trước deploy.

## Tạo Excel mẫu và điền khách

```powershell
npm run links:template
```

Tool mẫu `scripts/create-link-template.mjs` tạo `guest-links-input-template.xlsx`, có dropdown/mặc định ở 100 dòng:

| Cột | Giá trị |
| --- | --- |
| Tên khách | Tên có dấu, tối đa 80 ký tự sau trim; tên trống bị bỏ qua |
| Nhóm khách | Nhà trai hoặc Nhà gái; trống mặc định Nhà gái |
| Lịch tiệc | 30/10/2026 17:00 hoặc 31/10/2026 10:00; trống mặc định 31/10/2026 10:00 |

CSV dùng UTF-8 và cùng header, không có dropdown:

```csv
Tên khách,Nhóm khách,Lịch tiệc
Khách thử nhà trai,Nhà trai,30/10/2026 17:00
Khách thử nhà gái,,
```

## Sinh link và nhập KV

```powershell
npm run links:create -- guest-links-input-template.xlsx guest-links-output.xlsx --target local
npm run links:import -- guest-links-output-kv.json --local
```

Hoặc CSV:

```powershell
npm run links:create -- guest-links-input.csv guest-links-output-csv.csv --target local
npm run links:import -- guest-links-output-csv-kv.json --local
```

Excel/CSV kết quả có tên, nhóm, lịch và link. Batch JSON nằm cạnh output với hậu tố `-kv.json`; mỗi bản ghi có `key` là mã, `value` là chuỗi JSON `{name,group,event}`. Dòng trùng tên vẫn có mã khác. Tool từ chối ghi đè output/batch đã có; dùng tên output mới cho batch mới và giữ cặp file cùng batch.

`scripts/import-invitations.mjs` kiểm tra batch, tra mã hiện có và từ chối dữ liệu khác trước khi nhập. Nhập lại cùng dữ liệu được phép. Không chạy hai tiến trình nhập đồng thời; KV không có thao tác ghi có điều kiện nguyên tử. Link chỉ hoạt động sau khi nhập đúng batch; KV production có thể cần thời gian lan truyền.

Tạo bốn ví dụ local (hai nhóm × hai lịch):

```powershell
npm run links:examples
npm run links:import -- .local/guest-links-examples-kv.json --local
```

Các link nằm trong `.local/guest-links-examples.json`. Không gửi localhost cho Telegram/người ở máy khác. `npm run links:demo` tạo bốn trang khách giả và mẫu public “Bạn Đạt” do chủ website yêu cầu; không dùng tool demo cho danh sách khách thật.

## Prefix và config riêng

`config/link-targets.json` chứa `defaultTarget`, target `local`, `github`, `cloudflare` với `prefix` (Worker `/invite`) và `siteUrl` (website). Tool đọc prefix bằng `scripts/link-config.mjs`; có thể override:

```powershell
npm run links:create -- guest-links-input-template.xlsx guest-links-output-batch2.xlsx --config path/to/link-targets.json --target github
npm run links:create -- guest-links-input.csv guest-links-output-batch3.csv --prefix https://YOUR-WORKER/invite
```

`--prefix` ưu tiên hơn config. Không thêm `?i` vào prefix; tool tự thêm mã. Prefix production hiện trống cho đến khi có URL Worker thật. Target `github` vẫn dùng URL share Worker; Worker chuyển người mở về Pages. Target `cloudflare` dành cho website ở URL khác, phải cấu hình SITE_URL/API/CORS tương ứng.

## Dùng production sau deploy

Xem [quy trình deploy](production-deployment.md). Khi URL/binding đã cấu hình và được phép ghi dữ liệu Cloudflare:

```powershell
npm run links:create -- guest-links-input-template.xlsx guest-links-output-prod.xlsx --target github
npm run links:import -- guest-links-output-prod-kv.json --remote
```

Kiểm tra link thật trước khi gửi. API `/api/invitation?i=<mã>` chỉ trả tên, nhóm, lịch của một mã; không liệt kê/ghi KV công khai. `/invite` trả preview cho bot và redirect người mở, `/preview.png` trả PNG 1200×630 theo cùng dữ liệu. CORS chỉ cho origin website; localhost chỉ trong local mode.

Thiếu/sai mã hoặc lỗi Worker dùng Quý khách, Tiến Đạt – Huyền Dịu và 31/10/2026 10:00. Query `to`/nhóm/lịch tự thêm bị bỏ qua. Sổ lưu bút khóa cùng tên đã tra. Lễ cưới giữ 13:30 ngày 31/10/2026.

## Dữ liệu riêng

`guest-links-input*.xlsx/csv`, `guest-links-output*.xlsx/csv/json`, `.local/`, `.dev.vars*`, `.env*` và `dist/` bị Git bỏ qua. Nếu đặt tên khác, thêm ignore trước khi tạo. Batch KV chứa tên khách; không đặt trong public hoặc log. Giữ bản sao input/output/batch ở nơi riêng. Kiểm tra `git status`, `git diff --cached`, `git check-ignore <file>` trước commit.

Ai có link có thể xem lời mời. Không lưu thêm thông tin nhạy cảm trong KV; xóa đúng mã để thu hồi lời mời nếu được yêu cầu.
