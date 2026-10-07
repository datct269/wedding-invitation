import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderInvitationHTML, requestURL, HTML_CACHE_CONTROL } from '../server/html.js';
import { resolveInvitation } from '../src/invitation.js';
import { renderPreview } from '../server/og.js';

const root = process.cwd();
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };

export function createInvitationServer() {
  return http.createServer(handleRequest);
}

async function handleRequest(request, response) {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end('Method not allowed');
      return;
    }
    const url = requestURL(request);
    const pathname = decodeURIComponent(url.pathname).replace(/^\/wedding-invitation(?=\/|$)/, '') || '/';
    let data;
    let type;
    let cache = 'no-cache';
    if (pathname === '/' || pathname === '/index.html') {
      const template = await readFile(path.join(root, 'index.html'), 'utf8');
      data = renderInvitationHTML(template, url);
      type = types['.html'];
      cache = HTML_CACHE_CONTROL;
    } else if (pathname === '/api/og') {
      data = await renderPreview(resolveInvitation(url.searchParams));
      type = types['.png'];
    } else {
      if (!/^\/(src|public)\//.test(pathname) || pathname.includes('\\')) throw new Error('Invalid path');
      const file = path.resolve(root, '.' + pathname);
      const allowed = ['src', 'public'].some(directory => file.startsWith(path.join(root, directory) + path.sep));
      if (!allowed) throw new Error('Invalid path');
      data = await readFile(file);
      type = types[path.extname(file)] || 'application/octet-stream';
    }
    response.writeHead(200, { 'Content-Type': type, 'Cache-Control': cache });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch (error) {
    if (error.code !== 'ENOENT') console.error(error.message);
    response.writeHead(404);
    response.end('Not found');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  createInvitationServer().listen(5173, '0.0.0.0', () => console.log('Invitation ready at http://localhost:5173'));
}
