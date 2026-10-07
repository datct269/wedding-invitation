import { invitationData, invitationDefaults, receptionSlots } from './data.js';

// Bump when the preview design or wedding configuration changes.
export const OG_VERSION = '2026-10-v1';
export const normalizeGuestName = value => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').normalize('NFC').trim().slice(0, 80).replace(/[\uD800-\uDBFF]$/, '').trim();

export function resolveInvitation(search = '') {
  const params = new URLSearchParams(search);
  const side = ['groom', 'bride'].includes(params.get('side')) ? params.get('side') : invitationDefaults.side;
  const slot = Object.hasOwn(receptionSlots, params.get('slot')) ? params.get('slot') : invitationDefaults.slot;
  const reception = receptionSlots[slot];
  const personalizedName = normalizeGuestName(params.get('to'));
  const guestName = personalizedName || invitationData.guestName;
  const roles = side === 'bride' ? ['bride', 'groom'] : ['groom', 'bride'];
  const names = roles.map(role => invitationData.couple[role]);
  const fullNames = roles.map(role => invitationData.couple[role + 'Full']);
  const event = { ...invitationData.event, date: reception.date, receptionDate: reception.date, receptionWeekday: reception.weekday, receptionLunarDate: reception.lunarDate, receptionTime: reception.time };
  const query = new URLSearchParams({ side, slot });
  if (personalizedName) query.set('to', personalizedName);
  return {
    side, slot, personalizedName, guestName, names, fullNames, reception, event, query,
    data: {
      ...invitationData, event, guestName,
      hero: { ...invitationData.hero, alt: `Ảnh cưới ${fullNames.join(' và ')}` },
      gallery: invitationData.gallery.map((photo, index) => ({ ...photo, alt: `Ảnh cưới ${index + 1} của ${names.join(' và ')}` })),
      families: side === 'bride' ? [...invitationData.families].reverse() : [...invitationData.families],
      gifts: roles.map(role => invitationData.gifts.find(gift => gift.id === role))
    }
  };
}

export function invitationMetadata(context = resolveInvitation()) {
  const { names, fullNames, guestName, reception } = context;
  const date = reception.date.split('-').reverse().join('/');
  return {
    title: `${names.join(' & ')} · Thiệp Mời Cưới!`,
    description: `Đám cưới ${fullNames.join(' & ')} trân trọng kính mời ${guestName} | ${reception.weekday}, ${date}, ${reception.time} | ${reception.lunarDate} âm lịch | Hà Nội – Bắc Ninh`
  };
}
