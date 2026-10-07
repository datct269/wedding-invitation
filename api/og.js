import { resolveInvitation } from '../src/invitation.js';
import { renderPreview } from '../server/og.js';
import { requestURL } from '../server/html.js';

export const OG_CACHE_CONTROL = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';

export default async function og(request, response) {
  if (request.method && !['GET', 'HEAD'].includes(request.method)) {
    response.statusCode = 405;
    response.setHeader('Allow', 'GET, HEAD');
    response.end('Method not allowed');
    return;
  }
  try {
    const image = await renderPreview(resolveInvitation(requestURL(request).searchParams));
    response.statusCode = 200;
    response.setHeader('Content-Type', 'image/png');
    response.setHeader('Cache-Control', OG_CACHE_CONTROL);
    response.end(request.method === 'HEAD' ? undefined : image);
  } catch (error) {
    console.error('Could not render preview:', error);
    response.statusCode = 500;
    response.setHeader('Cache-Control', 'no-store');
    response.end('Unable to render preview');
  }
}
