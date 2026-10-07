import test from 'node:test';
import assert from 'node:assert/strict';
import { invitationData, receptionSlots } from '../src/data.js';
import { resolveInvitation } from '../src/invitation.js';
import { InvitationCover } from '../src/components/cover.js';
import { OpeningHero, Footer, ReceptionInfo, WeddingCeremony, VenueSection } from '../src/components/sections.js';
import { GiftModal } from '../src/components/gifts.js';
import { PhotoGallery, PhotoLightbox } from '../src/components/gallery.js';

for (const side of ['groom', 'bride']) for (const slot of ['oct30', 'oct31']) {
  test(`invitation components share ${side}/${slot} while ceremony stays fixed`, () => {
    const context = resolveInvitation(`?side=${side}&slot=${slot}&to=Nguyễn%20Văn%20An`);
    const first = side === 'bride' ? 'Huyền Dịu' : 'Tiến Đạt';
    const second = side === 'bride' ? 'Tiến Đạt' : 'Huyền Dịu';
    for (const html of [InvitationCover(context), OpeningHero(context), Footer(context), PhotoGallery(context.data), PhotoLightbox(context.data)]) {
      assert.ok(html.indexOf(first) < html.indexOf(second));
    }
    const day = slot === 'oct30' ? '30' : '31';
    const reception = ReceptionInfo(context);
    assert.ok(InvitationCover(context).includes(receptionSlots[slot].time));
    assert.ok(reception.includes(receptionSlots[slot].time));
    assert.ok(reception.includes(receptionSlots[slot].weekday.toUpperCase()));
    assert.ok(reception.includes(receptionSlots[slot].lunarDate.toUpperCase()));
    assert.ok(reception.includes(`<b>${day}</b>`));
    assert.ok(reception.includes(`aria-label="Ngày cưới ${day}"`));
    assert.ok(!reception.includes('Thêm vào lịch'));
    const ceremony = WeddingCeremony();
    assert.ok(ceremony.includes('13:30'));
    assert.ok(ceremony.includes('<b>31</b>'));
    assert.ok(ceremony.indexOf('Chu Tiến Đạt') < ceremony.indexOf('Nguyễn Huyền Dịu'));
    const venue = VenueSection(context);
    assert.ok(venue.indexOf(side === 'bride' ? 'Nhà gái' : 'Nhà trai') < venue.indexOf(side === 'bride' ? 'Nhà trai' : 'Nhà gái'));
    const gifts = GiftModal(context.data);
    assert.ok(gifts.indexOf(`data-gift="${side}"`) < gifts.indexOf(`data-gift="${side === 'bride' ? 'groom' : 'bride'}"`));
    for (const gift of invitationData.gifts) {
      assert.equal(context.data.gifts.find(item => item.id === gift.id), gift);
    }
    assert.equal(invitationData.event.ceremonyTime, '13:30');
    assert.equal(invitationData.event.receptionDate, '2026-10-31');
  });
}

test('normalization is deterministic, bounds names and keeps guest binding safe', () => {
  const invalid = resolveInvitation('?side=other&slot=__proto__&to=%20%20');
  assert.equal(invalid.side, 'groom');
  assert.equal(invalid.slot, 'oct31');
  assert.equal(invalid.guestName, 'Quý khách');
  assert.equal(invalid.personalizedName, '');
  assert.equal(invalid.query.has('to'), false);
  const name = 'Nguyễn Văn An '.repeat(12);
  const long = resolveInvitation(new URLSearchParams({ to: name }));
  assert.ok(long.personalizedName.length <= 80);
  assert.equal(long.query.get('to'), long.guestName);
  assert.equal(resolveInvitation(long.query).guestName, long.guestName);
  assert.equal(resolveInvitation(new URLSearchParams({ to: 'Nguyễn Văn An' })).guestName, 'Nguyễn Văn An');
  assert.equal(resolveInvitation(new URLSearchParams({ to: 'A'.repeat(79) + '😀' })).guestName, 'A'.repeat(79));
  const malicious = resolveInvitation(new URLSearchParams({ to: '<script>alert(1)</script>' }));
  assert.ok(!InvitationCover(malicious).includes(malicious.guestName));
  assert.ok(InvitationCover(malicious).includes('<p class="guest-name"></p>'));
});
