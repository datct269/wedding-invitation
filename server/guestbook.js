import { createHmac } from 'node:crypto';
import { normalizeGuestName } from '../src/invitation.js';
import { invitationData } from '../src/data.js';

export class GuestbookError extends Error {
  constructor(status, message, retryAfter) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export function validateWish(body) {
  if (!body || typeof body.name !== 'string' || typeof body.message !== 'string') {
    throw new GuestbookError(400, 'Vui lòng điền đầy đủ tên và lời chúc.');
  }
  const rawName = body.name.normalize('NFC').trim();
  const name = normalizeGuestName(rawName);
  const message = body.message.trim();
  if (!name || !message) throw new GuestbookError(400, 'Vui lòng điền đầy đủ tên và lời chúc.');
  if (rawName.length > 80 || message.length > 1000) throw new GuestbookError(400, 'Tên tối đa 80 ký tự, lời chúc tối đa 1000 ký tự.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId || '')) {
    throw new GuestbookError(400, 'Yêu cầu gửi lời chúc không hợp lệ. Vui lòng thử lại.');
  }
  return { name, message, requestId: body.requestId.toLowerCase() };
}

export function encodeCursor(row) {
  return Buffer.from(JSON.stringify({ date: row.date, id: row.id })).toString('base64url');
}

export function decodeCursor(value) {
  if (!value) return null;
  try {
    if (value.length > 512 || !/^[\w-]+$/.test(value)) throw new Error();
    const cursor = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (typeof cursor.date !== 'string' || !/^[\w-]{1,128}$/.test(cursor.id) || new Date(cursor.date).toISOString() !== cursor.date) throw new Error();
    return cursor;
  } catch { throw new GuestbookError(400, 'Trang lời chúc không hợp lệ. Vui lòng tải lại trang.'); }
}

const publicRow = snapshot => {
  const row = snapshot.data();
  return { id: snapshot.id, name: row.name, message: row.message, date: row.createdAt.toDate().toISOString() };
};

export function createFirestoreGuestbook({ db, Timestamp, FieldPath, ipSecret, clock = () => new Date() }) {
  const wishes = db.collection('guestbook_messages');
  return {
    async list(cursor) {
      let query = wishes.orderBy('createdAt', 'desc').orderBy(FieldPath.documentId(), 'desc');
      if (cursor) query = query.startAfter(Timestamp.fromDate(new Date(cursor.date)), cursor.id);
      const snapshot = await query.limit(invitationData.guestbook.pageSize).get();
      const items = snapshot.docs.map(publicRow);
      return { items, nextCursor: items.length === invitationData.guestbook.pageSize ? encodeCursor(items.at(-1)) : null };
    },
    async add(entry, ip) {
      const message = wishes.doc(entry.requestId);
      const addressKey = createHmac('sha256', ipSecret).update(ip || 'unknown').digest('hex');
      const rate = db.collection('guestbook_rate_limits').doc(addressKey);
      const now = clock();
      return db.runTransaction(async transaction => {
        const existing = await transaction.get(message);
        if (existing.exists) {
          const row = publicRow(existing);
          if (row.name !== entry.name || row.message !== entry.message) throw new GuestbookError(409, 'Nội dung đã thay đổi. Vui lòng gửi lại lời chúc.');
          return row;
        }
        const previous = await transaction.get(rate);
        const windowStart = previous.exists ? previous.data().windowStart.toMillis() : 0;
        const inWindow = now.getTime() - windowStart < 60_000;
        const count = inWindow ? previous.data().count : 0;
        if (count >= 10) throw new GuestbookError(429, 'Bạn gửi lời chúc quá nhanh. Vui lòng chờ một chút rồi thử lại.', Math.max(1, Math.ceil((windowStart + 60_000 - now.getTime()) / 1000)));
        const createdAt = Timestamp.fromDate(now);
        transaction.set(rate, { windowStart: inWindow ? previous.data().windowStart : createdAt, count: count + 1 });
        transaction.set(message, { name: entry.name, message: entry.message, createdAt });
        return { id: message.id, name: entry.name, message: entry.message, date: now.toISOString() };
      });
    }
  };
}

let repository;
export async function getFirestoreGuestbook() {
  if (repository) return repository;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const emulator = !process.env.VERCEL && process.env.FIRESTORE_EMULATOR_HOST;
  if (!projectId || (!emulator && (!clientEmail || !privateKey))) {
    throw new GuestbookError(503, 'Sổ lưu bút tạm thời chưa khả dụng. Vui lòng thử lại sau.');
  }
  const { initializeApp, cert, getApps } = await import('firebase-admin/app');
  const { getFirestore, Timestamp, FieldPath } = await import('firebase-admin/firestore');
  const app = getApps().find(app => app.name === 'wedding-guestbook') || initializeApp({ projectId, ...(emulator ? {} : { credential: cert({ projectId, clientEmail, privateKey }) }) }, 'wedding-guestbook');
  repository = createFirestoreGuestbook({ db: getFirestore(app), Timestamp, FieldPath, ipSecret: privateKey || 'local-emulator-only' });
  return repository;
}
