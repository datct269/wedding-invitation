import { floral } from '../lib.js';
import { resolveInvitation } from '../invitation.js';
import { guestbookStore } from '../guestbook-store.js';

export function Guestbook() {
  return `<section class="guestbook narrow-section" id="guestbook"><div class="guestbook-card">${floral('guestbook-flower')}<h2>SỔ LƯU BÚT</h2><form novalidate><label for="guest-name">Tên của bạn</label><input id="guest-name" name="name" maxlength="80" autocomplete="name" placeholder="Tên của bạn" required aria-describedby="guestbook-status"><label for="guest-message">Lời chúc của bạn</label><textarea id="guest-message" name="message" maxlength="1000" placeholder="Gửi đôi lời yêu thương…" required aria-describedby="guestbook-status"></textarea><p id="guestbook-status" class="form-status" role="status" aria-live="polite"></p><div class="submit-row"><button class="primary" type="submit">GỬI LỜI CHÚC</button></div></form></div><div class="guestbook-messages" tabindex="0" role="region" aria-label="Những lời chúc dành cho đôi bạn"></div><p class="guestbook-list-status" role="status" aria-live="polite"></p><div class="guestbook-actions"><button class="outline-button guestbook-more" type="button" hidden>Xem thêm lời chúc</button><button class="outline-button guestbook-retry" type="button" hidden>Thử lại</button></div></section>`;
}

export function mountGuestbook(scroll, context = resolveInvitation(window.location.search), store = guestbookStore) {
  const root = document.querySelector('#guestbook'), form = root.querySelector('form'), list = root.querySelector('.guestbook-messages');
  const status = root.querySelector('.form-status'), listStatus = root.querySelector('.guestbook-list-status');
  const more = root.querySelector('.guestbook-more'), retry = root.querySelector('.guestbook-retry');
  const name = form.elements.name, message = form.elements.message;
  if (context.personalizedName) { name.value = name.defaultValue = context.personalizedName; name.readOnly = true; }
  let rows = [], submitted = [], nextCursor = null, loading = false, lastCursor = null, pending = null;

  function render() {
    const seen = new Set();
    const items = [...submitted, ...rows].filter(row => { if (seen.has(row.id)) return false; seen.add(row.id); return true; });
    list.replaceChildren(...items.map(row => {
      const article = document.createElement('article'); article.className = 'message';
      const header = document.createElement('header'), author = document.createElement('strong'), date = document.createElement('time'), text = document.createElement('p');
      author.textContent = row.name;
      date.dateTime = row.date;
      date.textContent = new Date(row.date).toLocaleDateString('vi-VN');
      text.textContent = row.message;
      header.append(author, date); article.append(header, text);
      return article;
    }));
    more.hidden = !nextCursor;
    listStatus.textContent = items.length ? '' : 'Chưa có lời chúc. Hãy gửi đôi lời yêu thương!';
  }

  async function load(cursor = null) {
    if (loading) return;
    loading = true; lastCursor = cursor; more.disabled = retry.disabled = true;
    retry.hidden = true; listStatus.textContent = 'Đang tải lời chúc…';
    try {
      const page = await store.list(cursor);
      rows = cursor ? [...rows, ...page.items] : page.items;
      nextCursor = page.nextCursor;
      render();
    } catch (error) {
      listStatus.textContent = error.message;
      retry.hidden = false;
    } finally { loading = false; more.disabled = retry.disabled = false; }
  }

  root.addEventListener('focusin', () => scroll.hold('guestbook', true));
  root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) { scroll.hold('guestbook', false); scroll.pauseBriefly(); } });
  root.addEventListener('pointerdown', () => scroll.pauseBriefly());
  more.onclick = () => load(nextCursor);
  retry.onclick = () => load(lastCursor);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    if (button.disabled) return;
    name.removeAttribute('aria-invalid'); message.removeAttribute('aria-invalid');
    if (!name.value.trim() || !message.value.trim()) {
      const field = !name.value.trim() ? name : message;
      status.textContent = field === name ? 'Vui lòng nhập tên của bạn.' : 'Vui lòng nhập lời chúc của bạn.';
      field.setAttribute('aria-invalid', 'true'); field.focus(); return;
    }
    const author = context.personalizedName || name.value.trim(), text = message.value.trim();
    // Keep this ID on network failure so retrying cannot create a duplicate wish.
    if (!pending || pending.name !== author || pending.message !== text) pending = { name: author, message: text, requestId: crypto.randomUUID() };
    button.disabled = true; status.textContent = 'Đang gửi lời chúc…';
    try {
      const row = await store.add(pending);
      submitted.unshift(row); pending = null;
      form.reset(); render();
      status.textContent = 'Cảm ơn bạn đã gửi lời chúc yêu thương!'; list.scrollTop = 0;
    } catch (error) { status.textContent = error.message; }
    finally { button.disabled = false; }
  });
  return load();
}