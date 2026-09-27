import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {unlink,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {invitationData as data} from '../src/data.js';

const root=process.cwd();
const temp=path.join(root,'public/images/.og-preview-render.html');
const output=path.join(root,'public/images/og-preview.png');
const browsers=[
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
];
const browser=browsers.find(existsSync);
if(!browser)throw new Error('Không tìm thấy Edge hoặc Chrome để tạo ảnh preview.');

const [year,month,day]=data.event.ceremonyDate.split('-');
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const html=`<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{width:1200px;height:630px;margin:0;overflow:hidden}body{display:grid;place-items:center;background:radial-gradient(ellipse at 20% 15%,#722127 0,#511419 56%,#300b10 100%);font-family:'Times New Roman',serif;color:#511419}.card{position:relative;width:1140px;height:570px;overflow:hidden;border-radius:14px;background:#f8f2e9 url('./decorations/paper.svg');box-shadow:0 22px 48px #17020566;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);padding:72px 82px}.column{position:relative;z-index:2;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.left{padding-right:70px}.right{padding-left:70px}.divider{position:absolute;z-index:3;left:50%;top:105px;width:1px;height:360px;background:linear-gradient(transparent,#bc9844 18%,#bc9844 82%,transparent)}.names{font-size:58px;font-weight:400;line-height:1}.names span{display:block;white-space:nowrap}.names i{display:block;color:#bc9844;font-size:40px;line-height:1.25}.ornament{color:#bc9844;font-size:25px;margin:22px 0 16px}.date{font:500 22px/1.5 'Segoe UI',Arial,sans-serif;color:#765258}.invite{font:600 26px/1.4 'Segoe UI',Arial,sans-serif;letter-spacing:.16em;color:#826065}.guest{margin-top:35px;padding:15px 30px;border-radius:18px;background:#5114190b;font:600 34px/1.4 'Segoe UI',Arial,sans-serif}.message{margin-top:30px;max-width:330px;font:18px/1.7 'Segoe UI',Arial,sans-serif;color:#79595c}.flower{position:absolute;z-index:1;width:250px;height:auto;object-fit:contain;filter:drop-shadow(3px 6px 3px #3b231326)}.flower-a{left:-72px;top:-50px;transform:rotate(22deg)}.flower-b{right:-72px;bottom:-54px;transform:rotate(202deg)}.seal{position:absolute;left:50%;top:30px;z-index:4;width:60px;height:60px;transform:translateX(-50%);display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle at 30% 20%,#d8b65e,#b48d30);color:#fbf5e3;box-shadow:0 4px 16px #b38a364d;font-size:24px}
</style></head><body><main class="card"><img class="flower flower-a" src="./decorations/floral.svg" alt=""><img class="flower flower-b" src="./decorations/floral.svg" alt=""><div class="seal">♥</div><div class="divider"></div><section class="column left"><div class="names"><span>${escape(data.couple.groom)}</span><i>&amp;</i><span>${escape(data.couple.bride)}</span></div><div class="ornament">❦</div><div class="date">${Number(day)} tháng ${Number(month)}, ${year}</div></section><section class="column right"><div class="invite">THÂN MỜI</div><div class="guest">Bạn ABCD</div><div class="message">Đến dự buổi tiệc chung vui cùng gia đình</div></section></main></body></html>`;

await writeFile(temp,html,'utf8');
try{
  execFileSync(browser,['--headless=new','--disable-gpu','--hide-scrollbars','--allow-file-access-from-files',`--screenshot=${output}`,'--window-size=1200,630',pathToFileURL(temp).href],{stdio:'ignore'});
}finally{
  await unlink(temp).catch(()=>{});
}
console.log(`Social preview created at ${output}`);
