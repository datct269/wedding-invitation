const ORIGIN = 'https://datct269.github.io';
const headers = (origin,local) => ({ 'Access-Control-Allow-Origin': origin && local && /^http:\/\/(localhost|127\.0\.0\.1):5173$/.test(origin) ? origin : ORIGIN, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Accept', 'Vary': 'Origin' });

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin'), local = env.LOCAL_DEVELOPMENT === 'true';
    const allowedOrigin = origin === ORIGIN || (local && /^http:\/\/(localhost|127\.0\.0\.1):5173$/.test(origin || ''));
    const cors = headers(origin,local);
    if (origin && !allowedOrigin) return new Response('Forbidden', { status: 403 });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.pathname !== '/') return new Response('Not found', { status: 404, headers: cors });
    const token = url.searchParams.get('i') || '';
    if (!/^[a-f0-9]{64}$/.test(token)) return Response.json({ error: 'Invalid invitation' }, { status: 400, headers: cors });
    const value = await env.INVITATIONS.get(token, 'json');
    if (!value || typeof value.name !== 'string' || !['Nhà trai', 'Nhà gái'].includes(value.group) || !['2026-10-30T17:00', '2026-10-31T10:00'].includes(value.event)) return Response.json({ error: 'Invitation not found' }, { status: 404, headers: cors });
    return Response.json({ name: value.name, group: value.group, event: value.event }, { headers: cors });
  }
};
