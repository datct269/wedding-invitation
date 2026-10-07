import { resolveInvitation, invitationMetadata, OG_VERSION } from '../src/invitation.js';

export const HTML_CACHE_CONTROL = 'private, no-store';

function escapeAttribute(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

// Production origins come from configuration, never forwarded request headers.
export function requestURL(request, environment = process.env) {
  const configured = environment.SITE_URL || (environment.VERCEL_URL && `https://${environment.VERCEL_URL}`);
  let origin = 'http://localhost:5173';
  if (configured) {
    const site = new URL(configured);
    if (!['https:', 'http:'].includes(site.protocol) || site.username || site.password) {
      throw new Error('SITE_URL must be an HTTP(S) URL without credentials');
    }
    origin = site.origin;
  } else {
    const host = request.headers?.host || '';
    if (/^(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(host)) origin = `http://${host}`;
  }
  const incoming = new URL(request.url || '/', origin);
  return new URL(incoming.pathname + incoming.search, origin);
}

export function renderInvitationHTML(template, url, { staticPreview = false } = {}) {
  const page = new URL(url);
  const context = resolveInvitation(page.searchParams);
  const metadata = invitationMetadata(context);
  const pathname = page.pathname.startsWith('/wedding-invitation/') ? '/wedding-invitation/' : '/';
  const canonical = `${page.origin}${pathname}${staticPreview ? '' : '?' + context.query}`;
  const image = staticPreview ? `${page.origin}${pathname}public/images/og-preview.png` : `${page.origin}/api/og?${context.query}&v=${encodeURIComponent(OG_VERSION)}`;
  const values = {
    description: metadata.description,
    'og:title': metadata.title,
    'og:description': metadata.description,
    'og:url': canonical,
    'og:image': image,
    'twitter:title': metadata.title,
    'twitter:description': metadata.description,
    'twitter:image': image,
  };
  let html = template.replace(/<meta\b[^>]*>/gi, tag => {
    const name = /\b(?:name|property)=["']([^"']+)["']/i.exec(tag)?.[1];
    if (!Object.hasOwn(values, name)) return tag;
    return tag.replace(/\bcontent=["'][^"']*["']/i, () => `content="${escapeAttribute(values[name])}"`);
  });
  html = html.replace(/<title>[^<]*<\/title>/i, () => `<title>${escapeAttribute(metadata.title)}</title>`);
  return html;
}
