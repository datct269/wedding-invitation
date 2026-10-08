import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parse } from 'dotenv';

test('Firebase setup writes ignored local configuration without printing credentials', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'wedding-firebase-test-'));
  t.after(async () => {
    if (!path.resolve(directory).startsWith(path.resolve(tmpdir()) + path.sep)) throw new Error('Unexpected temp directory');
    await rm(directory, { recursive: true, force: true });
  });
  const account = { project_id: 'demo-wedding', client_email: 'test@example.invalid', private_key: 'test-key-line-one\ntest-key-line-two\n' };
  const input = path.join(directory, 'test account.json');
  await writeFile(input, JSON.stringify(account));
  await writeFile(path.join(directory, '.env.local'), 'SITE_URL="https://wedding.example"\n');
  const script = fileURLToPath(new URL('../scripts/configure-firebase.mjs', import.meta.url));
  const output = execFileSync(process.execPath, [script, input], { cwd: directory, encoding: 'utf8' });
  assert.ok(!output.includes('test-key-line-one'));
  const environment = parse(await readFile(path.join(directory, '.env.local')));
  assert.equal(environment.FIREBASE_PRIVATE_KEY, account.private_key);
  assert.equal(environment.FIREBASE_PROJECT_ID, account.project_id);
  assert.equal(environment.FIREBASE_CLIENT_EMAIL, account.client_email);
  assert.equal(environment.SITE_URL, 'https://wedding.example');
});
