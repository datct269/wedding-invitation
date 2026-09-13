import test from 'node:test';
import assert from 'node:assert/strict';
import {AutoScroll} from '../src/scroll.js';
test('auto-scroll pauses for overlapping interactions and resumes only after all release',()=>{
  globalThis.window={scrollY:0,innerHeight:800,addEventListener(){},scrollTo(x,y){this.scrollY=y;}};
  globalThis.document={hidden:false,documentElement:{scrollHeight:3000},addEventListener(){}};
  globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
  const scroll=new AutoScroll();scroll.set(true);scroll.tick(100);scroll.tick(150);assert.ok(window.scrollY>0);
  scroll.hold('overlay',true);scroll.hold('guestbook',true);const before=window.scrollY;scroll.tick(200);scroll.tick(250);assert.equal(window.scrollY,before);
  scroll.hold('overlay',false);scroll.tick(300);scroll.tick(350);assert.equal(window.scrollY,before);
  scroll.hold('guestbook',false);scroll.tick(400);scroll.tick(450);assert.ok(window.scrollY>before);
  scroll.set(false);const stopped=window.scrollY;scroll.tick(500);assert.equal(window.scrollY,stopped);
});
