export function invitationFields(value) {
  if (!value || typeof value.name !== 'string' || !value.name.trim() || value.name.trim().length > 80 || !['Nhà trai', 'Nhà gái'].includes(value.group) || !['2026-10-30T17:00', '2026-10-31T10:00'].includes(value.event)) return null;
  return {name: value.name.trim(), group: value.group, event: value.event};
}

export function validToken(token) {
  return typeof token === 'string' && /^[a-f0-9]{32}$/.test(token);
}

export function createInvitationToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function lookupInvitation(token, kv) {
  if (!validToken(token) || !kv) return null;
  try {
    return invitationFields(await kv.get(token, {type: 'json'}));
  } catch { return null; }
}
