import { readFile } from 'node:fs/promises';
import { ImageResponse } from '@vercel/og';
import { invitationData } from '../src/data.js';
import { OG_VERSION, resolveInvitation } from '../src/invitation.js';

const resource = path => readFile(new URL('../' + path.replace(/^\.\//, ''), import.meta.url));
let resources;
function loadResources() {
  return resources ||= Promise.all([
    resource('public/fonts/CormorantGaramond.ttf'),
    resource('public/fonts/BeVietnamPro-Regular.ttf'),
    resource('public/fonts/NotoSansSymbols2-Regular.ttf'),
    resource(invitationData.decorations.floral),
    resource(invitationData.decorations.paper)
  ]).then(([serif, sans, symbols, floral, paper]) => ({
    fonts: [
      { name: 'Cormorant', data: serif, weight: 400, style: 'normal' },
      { name: 'BeVietnamPro', data: sans, weight: 400, style: 'normal' },
      { name: 'Symbols', data: symbols, weight: 400, style: 'normal' }
    ],
    floral: `data:image/svg+xml;base64,${floral.toString('base64')}`,
    paper: `data:image/svg+xml;base64,${paper.toString('base64')}`
  }));
}

const element = (type, style, children, props = {}) => ({ type, props: { style, ...props, children } });
const div = (style, children) => element('div', { display: 'flex', ...style }, children);

export function previewLayout(context, assets) {
  const [year, month, day] = context.reception.date.split('-').map(Number);
  const column = { position: 'absolute', top: 86, height: 398, width: 480, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' };
  const flower = style => element('img', { position: 'absolute', width: 250, height: 320, ...style }, undefined, { src: assets.floral });
  const heart = element('svg', { width: 24, height: 24 }, element('path', {}, undefined, { d: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z', fill: '#fbf5e3' }), { viewBox: '0 0 24 24' });
  return div({ width: 1200, height: 630, alignItems: 'center', justifyContent: 'center', color: '#511419', fontFamily: 'BeVietnamPro', backgroundImage: 'radial-gradient(ellipse at 20% 15%,#722127 0%,#511419 56%,#300b10 100%)' }, [
    div({ position: 'relative', width: 1140, height: 570, overflow: 'hidden', borderRadius: 14, backgroundColor: '#f8f2e9', backgroundImage: `url("${assets.paper}")`, boxShadow: '0 22px 48px #17020566' }, [
      flower({ left: -72, top: -50, transform: 'rotate(22deg)' }),
      flower({ right: -72, bottom: -54, transform: 'rotate(202deg)' }),
      div({ position: 'absolute', left: 569, top: 105, width: 1, height: 360, backgroundImage: 'linear-gradient(transparent,#bc9844 18%,#bc9844 82%,transparent)' }),
      div({ position: 'absolute', left: 540, top: 30, width: 60, height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 30, backgroundImage: 'radial-gradient(circle at 30% 20%,#d8b65e,#b48d30)' }, heart),
      div({ ...column, left: 65 }, [
        div({ fontFamily: 'Cormorant', fontSize: 58, flexDirection: 'column', alignItems: 'center', lineHeight: 1.05 }, [
          div({}, context.names[0]), div({ color: '#bc9844', fontSize: 40 }, '&'), div({}, context.names[1])
        ]),
        div({ color: '#bc9844', fontFamily: 'Symbols', fontSize: 25, marginTop: 14 }, '❦'),
        div({ fontSize: 22, color: '#765258', marginTop: 12 }, `${day} tháng ${month}, ${year}`),
        div({ fontSize: 22, color: '#765258', marginTop: 8 }, context.reception.time)
      ]),
      div({ ...column, right: 65 }, [
        div({ fontSize: 26, letterSpacing: '0.16em', color: '#826065' }, 'THÂN MỜI'),
        div({ width: 370, maxHeight: 180, marginTop: 30, padding: '15px 20px', borderRadius: 18, backgroundColor: '#5114190b', fontSize: context.guestName.length > 40 ? 24 : context.guestName.length > 24 ? 28 : 34, lineHeight: 1.4, justifyContent: 'center', flexWrap: 'wrap', wordBreak: 'break-all' }, context.guestName),
        div({ marginTop: 26, width: 330, fontSize: 18, lineHeight: 1.7, color: '#79595c' }, 'Đến dự buổi tiệc chung vui cùng gia đình')
      ])
    ])
  ]);
}

// Small per-instance cache; the CDN caches each distinct, versioned image URL.
const previews = new Map();
export async function renderPreview(context = resolveInvitation()) {
  const key = `${OG_VERSION}:${context.query}`;
  if (previews.has(key)) return previews.get(key);
  const pending = (async () => {
    const assets = await loadResources();
    const response = new ImageResponse(previewLayout(context, assets), { width: 1200, height: 630, fonts: assets.fonts, emoji: 'none' });
    return Buffer.from(await response.arrayBuffer());
  })();
  previews.set(key, pending);
  if (previews.size > 50) previews.delete(previews.keys().next().value);
  try { return await pending; }
  catch (error) { previews.delete(key); throw error; }
}
