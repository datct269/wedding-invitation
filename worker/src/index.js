import {verifyInvitation} from '../../shared/invitation-token.js';
import {renderPreview, previewDetails, escape} from './preview.js';

const defaultSite='https://datct269.github.io/wedding-invitation/';
const cacheHeaders={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export default {
  async fetch(request, env) {
    const url=new URL(request.url);
    const local=env.LOCAL_DEVELOPMENT==='true';
    const site=new URL(local ? (env.LOCAL_SITE_URL||'http://localhost:5173/') : (env.SITE_URL||defaultSite));
    const origin=request.headers.get('Origin');
    const allowed=origin===site.origin||(local&&/^http:\/\/(localhost|127\.0\.0\.1):5173$/.test(origin||''));
    if(origin&&!allowed)return new Response('Forbidden',{status:403,headers:cacheHeaders});
    const cors={...cacheHeaders,'Access-Control-Allow-Origin':allowed?origin:site.origin,'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Accept','Vary':'Origin'};
    if(!['/api/invitation','/invite','/preview.png'].includes(url.pathname))return new Response('Not found',{status:404,headers:cacheHeaders});
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
    if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:cors});
    const token=url.searchParams.get('i')||'';
    const selected=await verifyInvitation(token,env.INVITATION_JWT_SECRET);
    if(url.pathname==='/api/invitation')return Response.json(selected||{error:'Invalid invitation'},{status:selected?200:401,headers:cors});
    if(url.pathname==='/preview.png') {
      try {return new Response(await renderPreview(selected),{headers:{...cacheHeaders,'Content-Type':'image/png'}});}
      catch {return new Response('Preview unavailable',{status:503,headers:cacheHeaders});}
    }
    const destination=new URL(site);
    if(selected)destination.searchParams.set('i',token);
    const bot=/TelegramBot|WhatsApp|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Discordbot|Slackbot|SkypeUriPreview|Googlebot|bingbot/i.test(request.headers.get('User-Agent')||'');
    if(!bot)return new Response(null,{status:302,headers:{...cacheHeaders,Location:destination.href}});
    const info=previewDetails(selected), image=new URL('/preview.png',url);
    if(selected)image.searchParams.set('i',token);
    const canonical=new URL('/invite',url);if(selected)canonical.searchParams.set('i',token);
    const title=`${info.first} & ${info.second} · Thân mời ${info.name}`;
    const description=`${info.date} lúc ${info.time} · Đến dự buổi tiệc chung vui cùng gia đình`;
    const html=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escape(title)}</title><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(canonical.href)}"><meta property="og:type" content="website"><meta property="og:image" content="${escape(image.href)}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${escape(image.href)}"></head><body><a href="${escape(destination.href)}">Mở thiệp</a></body></html>`;
    return new Response(html,{headers:{...cacheHeaders,'Content-Type':'text/html; charset=utf-8'}});
  }
};
