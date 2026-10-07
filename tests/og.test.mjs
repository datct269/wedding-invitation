import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveInvitation } from '../src/invitation.js';
import { renderPreview } from '../server/og.js';
import og, { OG_CACHE_CONTROL } from '../api/og.js';
import { createInvitationServer } from '../scripts/server.mjs';

test('preview renders offline PNGs, isolates invitation variants and reuses normalized cache', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Preview unexpectedly requested a remote asset'); };
  try {
    const first = resolveInvitation('?side=bride&slot=oct30&to=Nguyễn%20Văn%20An');
    const image = await renderPreview(first);
    assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(image.readUInt32BE(16), 1200);
    assert.equal(image.readUInt32BE(20), 630);
    assert.equal(await renderPreview(resolveInvitation('?to=%20Nguyễn%20Văn%20An%20&slot=oct30&side=bride')), image);
    for (const search of ['?side=groom&slot=oct30&to=Nguyễn%20Văn%20An', '?side=bride&slot=oct31&to=Nguyễn%20Văn%20An', '?side=bride&slot=oct30&to=Anh%20Bình', '?to=' + 'Á'.repeat(80)]) {
      const variant = await renderPreview(resolveInvitation(search));
      assert.notDeepEqual(variant, image);
      assert.equal(variant.readUInt32BE(16), 1200);
    }
  } finally { globalThis.fetch = originalFetch; }
});

test('OG function returns PNG with cache headers, supports HEAD and rejects writes', async () => {
  for (const method of ['GET', 'HEAD', 'POST']) {
    const headers = {};
    let body;
    const response = { setHeader: (name, value) => { headers[name] = value; }, end: value => { body = value; } };
    await og({ url: '/api/og?side=bride&slot=oct30&to=Anh%20Bình', headers: { host: 'localhost:5173' }, method }, response);
    if (method === 'POST') assert.equal(response.statusCode, 405);
    else {
      assert.equal(response.statusCode, 200);
      assert.equal(headers['Content-Type'], 'image/png');
      assert.equal(headers['Cache-Control'], OG_CACHE_CONTROL);
      if (method === 'HEAD') assert.equal(body, undefined);
      else assert.ok(Buffer.isBuffer(body));
    }
  }
});

test('local HTTP preview URL declared in HTML returns the matching image', async t => {
  const server = createInvitationServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const html = await (await fetch(`${origin}/?side=bride&slot=oct30&to=Anh%20Bình`)).text();
  const url = html.match(/property="og:image" content="([^"]+)"/)[1].replaceAll('&amp;', '&');
  const response = await fetch(url);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  const png = Buffer.from(await response.arrayBuffer());
  assert.deepEqual(png, await renderPreview(resolveInvitation(new URL(url).searchParams)));
});
