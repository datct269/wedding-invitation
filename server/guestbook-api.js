import { requestURL } from './html.js';
import { GuestbookError, validateWish, decodeCursor, getFirestoreGuestbook } from './guestbook.js';

async function readBody(request) {
  if (request.headers?.['content-type']?.toLowerCase().split(';')[0].trim() !== 'application/json') throw new GuestbookError(415, 'Yêu cầu gửi lời chúc không hợp lệ.');
  if (Number(request.headers['content-length']) > 8192) throw new GuestbookError(413, 'Lời chúc quá dài.');
  if (request.body && typeof request.body === 'object' && !Buffer.isBuffer(request.body)) {
    if (Buffer.byteLength(JSON.stringify(request.body)) > 8192) throw new GuestbookError(413, 'Lời chúc quá dài.');
    return request.body;
  }
  let text = Buffer.isBuffer(request.body) ? request.body.toString('utf8') : typeof request.body === 'string' ? request.body : '';
  if (!text) {
    let bytes = 0;
    const chunks = [];
    for await (const chunk of request) {
      bytes += Buffer.byteLength(chunk);
      if (bytes > 8192) throw new GuestbookError(413, 'Lời chúc quá dài.');
      chunks.push(Buffer.from(chunk));
    }
    text = Buffer.concat(chunks).toString('utf8');
  }
  if (Buffer.byteLength(text) > 8192) throw new GuestbookError(413, 'Lời chúc quá dài.');
  try { return JSON.parse(text); }
  catch { throw new GuestbookError(400, 'Yêu cầu gửi lời chúc không hợp lệ.'); }
}

export function createGuestbookHandler(getRepository = getFirestoreGuestbook) {
  return async (request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    const send = (status, body) => { response.statusCode = status; response.end(request.method === 'HEAD' ? undefined : JSON.stringify(body)); };
    try {
      if (!['GET', 'HEAD', 'POST'].includes(request.method)) {
        response.setHeader('Allow', 'GET, HEAD, POST');
        throw new GuestbookError(405, 'Phương thức không được hỗ trợ.');
      }
      const url = requestURL(request);
      if (request.method === 'GET' || request.method === 'HEAD') {
        const cursor = decodeCursor(url.searchParams.get('cursor'));
        const page = await (await getRepository()).list(cursor);
        response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60');
        send(200, page);
      } else {
        // SITE_URL is canonical metadata, while visitors may use a Vercel alias.
        const actualOrigin = `${process.env.VERCEL ? 'https' : 'http'}://${request.headers.host}`;
        if (request.headers.origin && ![url.origin, actualOrigin].includes(request.headers.origin)) throw new GuestbookError(403, 'Yêu cầu gửi lời chúc không hợp lệ.');
        const entry = validateWish(await readBody(request));
        const address = process.env.VERCEL ? String(request.headers['x-forwarded-for'] || '').split(',')[0].trim() : request.socket?.remoteAddress;
        const row = await (await getRepository()).add(entry, address);
        send(201, { item: row });
      }
    } catch (error) {
      if (error.retryAfter) response.setHeader('Retry-After', String(error.retryAfter));
      if (!(error instanceof GuestbookError)) console.error('Guestbook storage failed:', error.code || error.name);
      send(error.status || 503, { error: error instanceof GuestbookError ? error.message : 'Chưa thể kết nối sổ lưu bút. Vui lòng thử lại sau.' });
    }
  };
}

export default createGuestbookHandler();
