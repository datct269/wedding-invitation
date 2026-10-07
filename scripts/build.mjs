import { mkdir,cp } from 'node:fs/promises';
import {readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
async function check(dir){for(const f of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${f.name}`;if(f.isDirectory())await check(path);else if(path.endsWith('.js'))execFileSync(process.execPath,['--check',path],{stdio:'inherit'});}}
await check('src');
await check('server');
await check('api');
await mkdir('dist',{recursive:true});
for(const name of ['index.html','src','public']) await cp(name,`dist/${name}`,{recursive:true});
console.log('Static production build created in dist/');
