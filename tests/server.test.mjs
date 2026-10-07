import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderInvitationHTML, requestURL, HTML_CACHE_CONTROL } from '../server/html.js';
import invitation from '../api/invitation.js';
import { createInvitationServer } from '../scripts/server.mjs';

const template = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const attribute = (html, key) => {
  const tag = html.match(new RegExp(`<meta (?:name|property)="${key}"[^>]*>`))?.[0];
  return tag?.match(/content="([^"]*)"/)?.[1].replaceAll('&amp;', '&');
};

for (const side of ['groom', 'bride']) {
  for (const slot of ['oct30', 'oct31']) {
    test(`server metadata resolves ${side}/${slot} before JavaScript`, () => {
      const url = new URL(`https://invitation.example/?side=${side}&slot=${slot}&to=Nguyễn%20Văn%20An`);
      const html = renderInvitationHTML(template, url);
      const title = attribute(html, 'og:title');
      const first = side === 'groom' ? 'Tiến Đạt' : 'Huyền Dịu';
      const second = side === 'groom' ? 'Huyền Dịu' : 'Tiến Đạt';
      assert.ok(title.indexOf(first) < title.indexOf(second));
      const description = attribute(html, 'og:description');
      assert.ok(description.includes('Nguyễn Văn An'));
      assert.ok(description.includes(slot === 'oct30' ? '17:00' : '10:00'));
      assert.ok(description.includes(slot === 'oct30' ? '30/10/2026' : '31/10/2026'));
      assert.equal(attribute(html, 'twitter:description'), description);
      assert.equal(attribute(html, 'twitter:image'), attribute(html, 'og:image'));
      const image = new URL(attribute(html, 'og:image'));
      assert.equal(image.origin, url.origin);
      assert.equal(image.pathname, '/api/og');
      assert.equal(image.searchParams.get('side'), side);
      assert.equal(image.searchParams.get('slot'), slot);
      assert.equal(image.searchParams.get('to'), 'Nguyễn Văn An');
      assert.ok(image.searchParams.get('v'));
      assert.ok(html.includes('./src/main.js'));
    });
  }
}

test('metadata escapes guest text and preserves literal replacement tokens', () => {
  const url = new URL('https://invitation.example/');
  url.searchParams.set('to', `An "<script>alert(1)</script>" & $&`);
  const html = renderInvitationHTML(template, url);
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&quot;&lt;script&gt;alert(1)&lt;/script&gt;&quot; &amp; $&'));
  assert.equal((html.match(/property="og:description"/g) || []).length, 1);
});

test('legacy URL metadata keeps GitHub Pages path while image endpoint uses root', () => {
  const html = renderInvitationHTML(template, 'https://invitation.example/wedding-invitation/?side=bride&slot=oct30&to=An');
  assert.equal(new URL(attribute(html, 'og:url')).pathname, '/wedding-invitation/');
  assert.equal(new URL(attribute(html, 'og:image')).pathname, '/api/og');
});

test('metadata defaults and cache isolation between guests', () => {
  const fallback = renderInvitationHTML(template, 'https://invitation.example/?side=invalid&slot=invalid&to=%20%20');
  assert.ok(attribute(fallback, 'og:description').includes('Quý khách'));
  assert.ok(attribute(fallback, 'og:description').includes('10:00'));
  const one = renderInvitationHTML(template, 'https://invitation.example/?to=An');
  const two = renderInvitationHTML(template, 'https://invitation.example/?to=Bình');
  assert.notEqual(attribute(one, 'og:image'), attribute(two, 'og:image'));
  assert.equal(HTML_CACHE_CONTROL, 'private, no-store');
});

test('Vercel invitation routes precede static index and preserve legacy assets', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  const filesystem = config.routes.findIndex(route => route.handle === 'filesystem');
  for (const pathname of ['/', '/index.html', '/wedding-invitation', '/wedding-invitation/', '/wedding-invitation/index.html']) {
    const routeIndex = config.routes.findIndex(route => route.src && new RegExp(route.src).test(pathname));
    assert.ok(routeIndex >= 0 && routeIndex < filesystem);
    assert.equal(config.routes[routeIndex].dest, '/api/invitation');
  }
  const assets = config.routes.find(route => route.src && new RegExp(route.src).test('/wedding-invitation/public/images/og-preview.png'));
  assert.equal('/wedding-invitation/public/images/og-preview.png'.replace(new RegExp(assets.src), assets.dest), '/public/images/og-preview.png');
});

test('server determines origins from trusted configuration and local hosts', () => {
  const request = { url: '/?to=An', headers: { host: 'localhost:5173' } };
  assert.equal(requestURL(request, {}).origin, 'http://localhost:5173');
  assert.equal(requestURL(request, { SITE_URL: 'https://wedding.example/path' }).origin, 'https://wedding.example');
  assert.equal(requestURL(request, { VERCEL_URL: 'wedding.vercel.app' }).origin, 'https://wedding.vercel.app');
  assert.equal(requestURL({ ...request, headers: { host: 'attacker.example' } }, {}).origin, 'http://localhost:5173');
  assert.equal(requestURL({ ...request, url: 'https://attacker.example/?to=An' }, { SITE_URL: 'https://wedding.example' }).origin, 'https://wedding.example');
  assert.throws(() => requestURL(request, { SITE_URL: 'javascript:alert(1)' }));
});

test('invitation function serves uncached HTML and respects HEAD', async () => {
  for (const method of ['GET', 'HEAD']) {
    const headers = {};
    let body;
    const response = { setHeader: (name, value) => { headers[name] = value; }, end: value => { body = value; } };
    await invitation({ url: '/?to=An&side=bride&slot=oct30', headers: { host: 'localhost:5173' }, method }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(headers['Cache-Control'], HTML_CACHE_CONTROL);
    assert.equal(headers['Content-Type'], 'text/html; charset=utf-8');
    if (method === 'HEAD') assert.equal(body, undefined);
    else assert.ok(body.includes('17:00'));
  }
});

test('local HTTP routes dynamic and legacy invitations, assets and blocks private files', async t => {
  const server = createInvitationServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const pathname of ['/', '/index.html', '/wedding-invitation/', '/wedding-invitation/index.html']) {
    const response = await fetch(`${origin}${pathname}?side=bride&slot=oct30&to=An`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), HTML_CACHE_CONTROL);
    const html = await response.text();
    assert.ok(attribute(html, 'og:description').includes('17:00'));
    assert.equal(new URL(attribute(html, 'og:image')).origin, origin);
  }
  for (const pathname of ['/src/styles.css', '/wedding-invitation/src/styles.css', '/public/images/decorations/floral.svg']) {
    const response = await fetch(`${origin}${pathname}`);
    assert.equal(response.status, 200);
    await response.arrayBuffer();
  }
  for (const pathname of ['/package.json', '/.git/config', '/scripts/server.mjs', '/src/%2e%2e%2fpackage.json', '/src/%5c..%5cpackage.json']) {
    const response = await fetch(`${origin}${pathname}`);
    assert.equal(response.status, 404);
    await response.text();
  }
});
