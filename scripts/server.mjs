import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
http.createServer(async(req,res)=>{
  try {
    const url = new URL(req.url,'http://localhost');
    const relative = decodeURIComponent(url.pathname.endsWith('/') ? url.pathname+'index.html' : url.pathname);
    const file = path.resolve(root,'.'+relative);
    if (!file.startsWith(root+path.sep)) throw new Error('Invalid path');
    // Serve the same public surface as the build, never tool/Worker secrets.
    const publicFile=file===path.join(root,'index.html')||['src','public'].some(dir=>file.startsWith(path.join(root,dir)+path.sep));
    if(!publicFile)throw new Error('Not public');
    const data = await readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(5173,'0.0.0.0',()=>console.log('Invitation ready at http://localhost:5173'));
