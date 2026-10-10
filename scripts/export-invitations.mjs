import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveInvitation, normalizeGuestName } from '../src/invitation.js';
import { receptionSlots } from '../src/data.js';
import { renderPreview } from '../server/og.js';

export function prepareInvitations(entries, baseURL) {
  const base = new URL(baseURL);
  if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password) {
    throw new Error('URL website phải dùng http/https và không chứa thông tin đăng nhập.');
  }
  if (!Array.isArray(entries) || !entries.length) throw new Error('Danh sách khách phải là một mảng không rỗng.');
  return entries.map((entry, index) => {
    if (!entry || typeof entry.to !== 'string' || !normalizeGuestName(entry.to) || entry.to.length > 80 ||
        !['groom', 'bride'].includes(entry.side) || !Object.hasOwn(receptionSlots, entry.slot)) {
      throw new Error(`Khách số ${index + 1}: cần tên to (1–80 ký tự), side groom/bride, slot oct30/oct31.`);
    }
    const context = resolveInvitation(new URLSearchParams(entry));
    const url = new URL(base);
    url.hash = '';
    url.search = context.query.toString();
    return { context, url: url.href, filename: `${String(index + 1).padStart(3, '0')}-${context.side}-${context.slot}` };
  });
}

async function main() {
  const [guestFile, baseURL] = process.argv.slice(2);
  if (!guestFile || !baseURL) throw new Error('Dùng: npm run invitations:export -- danh-sach.json https://domain-cua-ban.vercel.app/');
  const invitations = prepareInvitations(JSON.parse(await readFile(guestFile, 'utf8')), baseURL);
  // Each run gets its own directory so existing exports are preserved.
  const output = path.resolve('invitation-exports', new Date().toISOString().replace(/[:.]/g, '-') + '-' + process.pid);
  await mkdir(output, { recursive: true });
  const manifest = [];
  for (const { context, url, filename } of invitations) {
    await writeFile(path.join(output, filename + '.png'), await renderPreview(context));
    const text = `${context.guestName}\n${context.names.join(' – ')}\n${context.reception.weekday}, ${context.reception.date.split('-').reverse().join('/')}, ${context.reception.time}\n\n${url}\n`;
    await writeFile(path.join(output, filename + '.txt'), text, 'utf8');
    manifest.push({ to: context.guestName, side: context.side, slot: context.slot, url, image: filename + '.png', text: filename + '.txt' });
  }
  await writeFile(path.join(output, 'links.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`Đã tạo ${manifest.length} ảnh thiệp và link tại ${output}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
