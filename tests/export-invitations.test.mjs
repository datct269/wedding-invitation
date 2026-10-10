import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareInvitations } from '../scripts/export-invitations.mjs';

test('exported invitation links and images use the same guest, side and slot', () => {
  const entries = [{ to: ' Đại gia đình ', side: 'bride', slot: 'oct30' }, { to: 'An & Bình', side: 'groom', slot: 'oct31' }];
  const rows = prepareInvitations(entries, 'https://example.com/?old=1#old');
  assert.equal(rows[0].context.names[0], 'Huyền Dịu');
  assert.equal(rows[0].context.reception.time, '17:00');
  assert.equal(new URL(rows[0].url).searchParams.get('to'), 'Đại gia đình');
  assert.equal(new URL(rows[1].url).searchParams.get('to'), 'An & Bình');
  assert.equal(new URL(rows[1].url).searchParams.get('slot'), 'oct31');
  assert.equal(new URL(rows[1].url).hash, '');
  assert.notEqual(rows[0].filename, rows[1].filename);
  for (const entry of [{ ...entries[0], side: 'invalid' }, { ...entries[0], slot: 'invalid' }, { ...entries[0], to: ' ' }]) {
    assert.throws(() => prepareInvitations([entry], 'https://example.com/'));
  }
  assert.throws(() => prepareInvitations(entries, 'file:///tmp/'));
});
