import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'dotenv';

if (!process.argv[2]) {
  console.error('Usage: npm run configure:firebase -- <path-to-service-account.json>');
  process.exit(1);
}
const account = JSON.parse(await readFile(process.argv[2], 'utf8'));
if (!account.project_id || !account.client_email || !account.private_key) throw new Error('File does not contain a Firebase service account.');
let existing = {};
try { existing = parse(await readFile('.env.local')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const environment = { ...existing, FIREBASE_PROJECT_ID: account.project_id, FIREBASE_CLIENT_EMAIL: account.client_email, FIREBASE_PRIVATE_KEY: account.private_key };
await writeFile('.env.local', Object.entries(environment).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join('\n') + '\n');
console.log('Firebase configuration saved to .env.local. Restart npm run dev. No credentials were printed.');
