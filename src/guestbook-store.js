import {invitationData} from './data.js';
const KEY='romantic-invitation-guestbook-v1';
// Async adapter: replace these two methods with API calls when a backend is ready.
export const guestbookStore={
  async list(){try {const rows=JSON.parse(localStorage.getItem(KEY)||'[]');return [...(Array.isArray(rows)?rows.filter(r=>typeof r.name==='string'&&typeof r.message==='string'&&typeof r.date==='string'):[]),...invitationData.guestbookSeed];}catch{return [...invitationData.guestbookSeed];}},
  async add({name,message}){const entry={name:name.trim(),message:message.trim(),date:new Date().toISOString()};if(!entry.name||!entry.message)throw new Error('Vui lòng điền đầy đủ tên và lời chúc.');let rows=[];try{rows=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(rows))rows=[];}catch{}try{localStorage.setItem(KEY,JSON.stringify([entry,...rows].slice(0,100)));}catch{throw new Error('Trình duyệt chưa cho phép lưu lời chúc. Vui lòng thử lại.');}return entry;}
};
