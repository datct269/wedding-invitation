import { readFile, writeFile } from 'node:fs/promises';
import { renderPreview } from '../server/og.js';
import { resolveInvitation } from '../src/invitation.js';
import { invitationData } from '../src/data.js';
import { renderInvitationHTML } from '../server/html.js';

// Static and dynamic previews share the same design and configuration.
const output = new URL('../public/images/og-preview.png', import.meta.url);
await writeFile(output, await renderPreview(resolveInvitation()));
const index = new URL('../index.html', import.meta.url);
await writeFile(index, renderInvitationHTML(await readFile(index, 'utf8'), invitationData.publicSiteURL, { staticPreview: true }));
console.log('Default social preview created at public/images/og-preview.png');
