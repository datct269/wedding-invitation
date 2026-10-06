import {SignJWT, jwtVerify} from 'jose';

const encoder = new TextEncoder();
export function invitationFields(value) {
  if (!value || typeof value.name !== 'string' || !value.name.trim() || value.name.trim().length > 80 || !['Nhà trai', 'Nhà gái'].includes(value.group) || !['2026-10-30T17:00', '2026-10-31T10:00'].includes(value.event)) return null;
  return {name: value.name.trim(), group: value.group, event: value.event};
}
function key(secret) {
  if (typeof secret !== 'string' || !secret.length) throw new Error('INVITATION_JWT_SECRET must be configured.');
  return encoder.encode(secret);
}
export async function signInvitation(value, secret) {
  const fields = invitationFields(value);
  if (!fields) throw new Error('Invalid invitation fields.');
  return new SignJWT(fields).setProtectedHeader({alg: 'HS256', typ: 'JWT'}).setJti(crypto.randomUUID()).sign(key(secret));
}
export async function verifyInvitation(token, secret) {
  try {
    if (typeof token !== 'string' || token.length > 2048) return null;
    const {payload, protectedHeader} = await jwtVerify(token, key(secret), {algorithms: ['HS256']});
    if (protectedHeader.typ !== 'JWT' || typeof payload.jti !== 'string' || !payload.jti) return null;
    return invitationFields(payload);
  } catch { return null; }
}
