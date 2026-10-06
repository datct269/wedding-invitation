import {invitationData} from './data.js';

export function defaultInvitation(data=invitationData){
  return {...data,guestName:data.guestName,event:{...data.event,receptionDate:'2026-10-31',receptionWeekday:'Thứ Bảy',receptionLunarDate:'22/09 năm Bính Ngọ',receptionTime:'10:00'}};
}

export async function resolveInvitation(search,endpoint,fetcher=globalThis.fetch){
  const token=new URLSearchParams(search).get('i')||'';
  if(!endpoint||! /^[a-f0-9]{64}$/.test(token))return null;
  try{
    const response=await fetcher(`${endpoint.replace(/\/$/,'')}?i=${encodeURIComponent(token)}`,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(4000)});
    if(!response.ok)return null;
    const value=await response.json();
    if(typeof value.name!=='string'||!value.name.trim()||!['Nhà trai','Nhà gái'].includes(value.group)||!['2026-10-30T17:00','2026-10-31T10:00'].includes(value.event))return null;
    return {name:value.name.trim().slice(0,80),group:value.group,event:value.event};
  }catch{return null;}
}
