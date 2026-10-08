import { invitationData } from './data.js';

export function createGuestbookStore(fetcher = (...args) => fetch(...args), endpoint = invitationData.guestbook.endpoint) {
  async function request(url, options) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetcher(url, { ...options, signal: controller.signal, credentials: 'same-origin' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Chưa thể kết nối sổ lưu bút. Vui lòng thử lại sau.');
      return data;
    } catch (error) {
      if (error.name === 'AbortError' || error instanceof TypeError || error instanceof SyntaxError) throw new Error('Chưa thể kết nối sổ lưu bút. Vui lòng thử lại sau.');
      throw error;
    } finally { clearTimeout(timeout); }
  }
  return {
    async list(cursor = null) {
      const page = await request(endpoint + (cursor ? '?cursor=' + encodeURIComponent(cursor) : ''), { method: 'GET' });
      if (!Array.isArray(page.items)) throw new Error('Chưa thể tải lời chúc. Vui lòng thử lại.');
      return page;
    },
    async add({ name, message, requestId }) {
      const data = await request(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, message, requestId }) });
      return data.item;
    }
  };
}

// All visitors read and write the same server-side guestbook; no local fallback.
export const guestbookStore = createGuestbookStore();
