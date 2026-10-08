import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Timestamp, FieldPath } from 'firebase-admin/firestore';
import { createFirestoreGuestbook, validateWish, decodeCursor, encodeCursor } from '../server/guestbook.js';
import { createGuestbookHandler } from '../server/guestbook-api.js';
import { createGuestbookStore } from '../src/guestbook-store.js';
import { createInvitationServer } from '../scripts/server.mjs';

// Runs the real repository transaction/query code against a deterministic DB double.
function database() {
  const collections = new Map();
  return {
    collections,
    collection(name) {
      if (!collections.has(name)) collections.set(name, new Map());
      const documents = collections.get(name);
      const query = {
        orderBy() { return this; },
        startAfter(timestamp, id) { this.cursor = [timestamp.toMillis(), id]; return this; },
        limit(count) { this.count = count; return this; },
        async get() {
          let rows = [...documents.entries()].sort(([aId, a], [bId, b]) => b.createdAt.toMillis() - a.createdAt.toMillis() || bId.localeCompare(aId));
          if (this.cursor) rows = rows.filter(([id, row]) => row.createdAt.toMillis() < this.cursor[0] || (row.createdAt.toMillis() === this.cursor[0] && id.localeCompare(this.cursor[1]) < 0));
          return { docs: rows.slice(0, this.count).map(([id, row]) => ({ id, data: () => row })) };
        },
        doc(id) { return { id, documents }; }
      };
      return query;
    },
    async runTransaction(callback) {
      const writes = [];
      const result = await callback({
        get: async ref => ({ id: ref.id, exists: ref.documents.has(ref.id), data: () => ref.documents.get(ref.id) }),
        set: (ref, row) => writes.push(() => ref.documents.set(ref.id, row))
      });
      writes.forEach(write => write());
      return result;
    }
  };
}

function repository() {
  const db = database();
  let time = new Date('2026-10-08T12:00:00Z');
  return { db, advance: ms => { time = new Date(time.getTime() + ms); }, store: createFirestoreGuestbook({ db, Timestamp, FieldPath, ipSecret: 'test-secret', clock: () => time }) };
}

test('wish validation bounds data, normalizes names and checks retry identifiers', () => {
  const wish = { name: ' Nguyễn Văn An ', message: ' Chúc mừng! ', requestId: randomUUID() };
  assert.deepEqual(validateWish(wish), { ...wish, name: 'Nguyễn Văn An', message: 'Chúc mừng!' });
  for (const invalid of [{ ...wish, name: '' }, { ...wish, message: ' ' }, { ...wish, name: 'A'.repeat(81) }, { ...wish, message: 'A'.repeat(1001) }, { ...wish, requestId: '../escape' }, { ...wish, message: 123 }]) {
    assert.throws(() => validateWish(invalid), error => error.status === 400);
  }
  const cursor = { id: randomUUID(), date: new Date().toISOString() };
  assert.deepEqual(decodeCursor(encodeCursor(cursor)), cursor);
  for (const invalid of ['%%', 'a'.repeat(513), Buffer.from('{"date":"bad","id":"id"}').toString('base64url')]) assert.throws(() => decodeCursor(invalid));
});

test('Firestore repository is shared, newest first, paginated and retries are idempotent', async () => {
  const { store, advance, db } = repository();
  const first = validateWish({ name: 'An', message: '<script>alert(1)</script>', requestId: randomUUID() });
  const saved = await store.add(first, 'visitor-one');
  assert.deepEqual(await store.add(first, 'visitor-one'), saved);
  await assert.rejects(() => store.add({ ...first, message: 'Changed' }, 'visitor-one'), error => error.status === 409);
  for (let i = 0; i < 24; i++) {
    advance(1);
    await store.add(validateWish({ name: `Guest ${i}`, message: 'Happy wedding', requestId: randomUUID() }), `visitor-${i}`);
  }
  const firstPage = await store.list(null);
  const secondPage = await store.list(decodeCursor(firstPage.nextCursor));
  assert.equal(firstPage.items.length, 20);
  assert.equal(secondPage.items.length, 5);
  assert.equal(secondPage.nextCursor, null);
  assert.equal(firstPage.items[0].name, 'Guest 23');
  assert.equal(secondPage.items.at(-1).message, '<script>alert(1)</script>');
  assert.equal(new Set([...firstPage.items, ...secondPage.items].map(row => row.id)).size, 25);
  assert.equal(db.collections.get('guestbook_messages').size, 25);
  assert.ok([...db.collections.get('guestbook_rate_limits').keys()].every(key => /^[a-f0-9]{64}$/.test(key)));
});

test('distributed write rate limit survives retries and resets after one minute', async () => {
  const { store, advance } = repository();
  const wish = { name: 'An', message: 'Congratulations' };
  let first;
  for (let i = 0; i < 10; i++) {
    const entry = validateWish({ ...wish, requestId: randomUUID() });
    first ||= entry;
    await store.add(entry, 'one-address');
  }
  await store.add(first, 'one-address');
  const next = validateWish({ ...wish, requestId: randomUUID() });
  await assert.rejects(() => store.add(next, 'one-address'), error => error.status === 429 && error.retryAfter === 60);
  advance(60_001);
  await store.add(next, 'one-address');
});

test('two independent API clients see the same wishes without localStorage', async t => {
  const { store } = repository();
  const server = createInvitationServer({ guestbookHandler: createGuestbookHandler(async () => store) });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const endpoint = `http://127.0.0.1:${server.address().port}/api/guestbook`;
  const one = createGuestbookStore(fetch, endpoint), two = createGuestbookStore(fetch, endpoint);
  const entry = await one.add({ name: 'Nguyễn Văn An', message: 'Chúc hai bạn hạnh phúc!', requestId: randomUUID() });
  assert.deepEqual((await two.list()).items, [entry]);
  const result = await fetch(endpoint);
  assert.equal(result.headers.get('cache-control'), 'public, max-age=0, s-maxage=60');
  await result.arrayBuffer();
  const invalid = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.headers.get('cache-control'), 'no-store');
  await invalid.arrayBuffer();
  const crossSite = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://another-site.example' }, body: '{}' });
  assert.equal(crossSite.status, 403);
  await crossSite.arrayBuffer();
  const badCursor = await fetch(endpoint + '?cursor=%%%');
  assert.equal(badCursor.status, 400);
  await badCursor.arrayBuffer();
  const head = await fetch(endpoint, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  for (const [options, expected] of [
    [{ method: 'DELETE' }, 405],
    [{ method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' }, 415],
    [{ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'not-json' }, 400],
    [{ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'a'.repeat(9000) }, 413]
  ]) {
    const response = await fetch(endpoint, options);
    assert.equal(response.status, expected);
    await response.arrayBuffer();
  }
});

test('same-origin submissions work on deployment aliases when SITE_URL is canonical', async () => {
  const { store } = repository();
  const handler = createGuestbookHandler(async () => store);
  const previous = process.env.SITE_URL;
  process.env.SITE_URL = 'https://canonical.example';
  try {
    const response = { setHeader() {}, end() {} };
    await handler({ method: 'POST', url: '/api/guestbook', headers: { host: 'localhost:5173', origin: 'http://localhost:5173', 'content-type': 'application/json; charset=utf-8' }, body: { name: 'An', message: 'Congratulations!', requestId: randomUUID() } }, response);
    assert.equal(response.statusCode, 201);
  } finally { if (previous === undefined) delete process.env.SITE_URL; else process.env.SITE_URL = previous; }
});

test('API failures stay failures: no local-only success or private credentials leak', async () => {
  const handler = createGuestbookHandler(async () => { throw new Error('private-key-must-not-leak'); });
  const headers = {};
  let body;
  await handler({ method: 'GET', url: '/api/guestbook', headers: {} }, { setHeader: (name, value) => { headers[name] = value; }, end: value => { body = value; } });
  assert.equal(headers['Cache-Control'], 'no-store');
  assert.ok(!body.includes('private-key-must-not-leak'));
  const client = createGuestbookStore(async () => new Response(body, { status: 503 }));
  await assert.rejects(() => client.list(), /Chưa thể kết nối/);
  await assert.rejects(() => client.add({ name: 'An', message: 'Hello', requestId: randomUUID() }), /Chưa thể kết nối/);
});
