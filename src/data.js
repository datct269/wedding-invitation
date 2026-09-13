// Replace asset files or update paths here. Components never import photographs.
export const invitationData = {
  couple: { groom: 'Tiến Đạt', bride: 'Huyền Dịu', groomFull: 'Chu Tiến Đạt', brideFull: 'Nguyễn Huyền Dịu' },
  guestName: 'Quý khách',
  event: { date: '2026-10-18', weekday: 'Chủ Nhật', ceremonyTime: '09:00', receptionTime: '18:00', endTime: '20:30', lunarDate: '09/09 năm Bính Ngọ', ceremonyVenue: 'Tư gia' },
  families: [
    { title: 'Nhà trai', father: 'Chu Văn Phi', mother: 'Đinh Thị Thu', address: 'Xóm Đình Tràng, Thôn Đình Ngọc, Xã Thư Lâm, TP. Hà Nội' },
    { title: 'Nhà gái', father: 'Nguyễn Hữu Thủy', mother: 'Trương Thị Oanh', address: 'Khu phố Mai Động, Phường Phù Khê, Tỉnh Bắc Ninh' }
  ],
  hero: { src:'./public/images/wedding/hero.svg',alt:'Minh họa cô dâu và chú rể — ảnh cưới sẽ được cập nhật',position:'center' },
  gallery: Array.from({length:12},(_,i)=>({id:`photo-${String(i+1).padStart(2,'0')}`,src:`./public/images/wedding/gallery/${String(i+1).padStart(2,'0')}.svg`,thumbnailSrc:`./public/images/wedding/gallery/${String(i+1).padStart(2,'0')}.svg`,alt:`Khoảnh khắc ${i+1} của Tiến Đạt và Huyền Dịu`,position:'center'})),
  decorations: { floral:'./public/images/decorations/floral.svg',paper:'./public/images/decorations/paper.svg',palace:'./public/images/decorations/palace.svg',fallback:'./public/images/wedding/hero.svg' },
  gifts: [
    {id:'groom',role:'Mừng chú rể',bank:'ACB',holder:'CHU TIẾN ĐẠT',account:'83263405',qrSrc:'./public/images/gift/groom-qr.svg',placeholder:true},
    {id:'bride',role:'Mừng cô dâu',bank:'ABBANK',holder:'NGUYỄN HUYỀN DỊU',account:'348866322',qrSrc:'./public/images/gift/bride-qr.svg',placeholder:true}
  ],
  music: {src:'./public/audio/ceremony.wav',volume:0.25},
  guestbookSeed: [
    {name:'Duy Khang',message:'Chúc mừng ngày vui của hai bạn, trăm năm hạnh phúc bền lâu!',date:'2026-07-26T12:30:00+07:00'},
    {name:'Lan Chi',message:'Đẹp đôi quá! Chúc hai bạn sống bên nhau đầu bạc răng long.',date:'2026-07-26T12:30:00+07:00'},
    {name:'Tuấn Anh',message:'Mừng hạnh phúc hai bạn! Chúc gia đình nhỏ luôn đầy ắp tiếng cười.',date:'2026-07-26T12:30:00+07:00'},
    {name:'Khánh Vy',message:'Chúc cô dâu chú rể luôn giữ được nụ cười này mãi mãi nhé!',date:'2026-07-26T12:30:00+07:00'},
    {name:'Gia Bảo',message:'Chúc gia đình nhỏ luôn ngập tràn yêu thương và hạnh phúc.',date:'2026-07-26T12:30:00+07:00'}
  ]
};
export const motion = {
  sealPulse:2000,sealGlow:600,sealBreak:500,floralReveal:1200,opening:2100,contentReveal:1200,coverFade:700,
  galleryTransition:1100,galleryAutoplay:4800,dotTransition:300,overlay:300,
  floatDistance:8,floatDurations:[5000,5500,6000,6500],
  petals:{count:12,minDuration:11000,maxDuration:24000},
  autoScrollSpeed:18,interactionPause:9000
};
