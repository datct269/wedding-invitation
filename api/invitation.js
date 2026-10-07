import { readFile } from 'node:fs/promises';
import { renderInvitationHTML, requestURL, HTML_CACHE_CONTROL } from '../server/html.js';

const template = readFile(new URL('../index.html', import.meta.url), 'utf8');

export default async function invitation(request, response) {
  response.setHeader('Cache-Control', HTML_CACHE_CONTROL);
  if (request.method && !['GET', 'HEAD'].includes(request.method)) {
    response.setHeader('Allow', 'GET, HEAD');
    response.statusCode = 405;
    response.end('Method not allowed');
    return;
  }
  try {
    const html = renderInvitationHTML(await template, requestURL(request));
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.statusCode = 200;
    response.end(request.method === 'HEAD' ? undefined : html);
  } catch (error) {
    console.error('Could not render invitation:', error);
    response.statusCode = 500;
    response.end('Unable to load invitation');
  }
}
