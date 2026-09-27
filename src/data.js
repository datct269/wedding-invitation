// Replace asset files or update paths here. Components never import photographs.
export const invitationData = {
  couple: { groom: 'Tiến Đạt', bride: 'Huyền Dịu', groomFull: 'Chu Tiến Đạt', brideFull: 'Nguyễn Huyền Dịu' },
  guestName: 'Quý khách',
  event: { date: '2026-10-18', weekday: 'Chủ Nhật', ceremonyTime: '14:00', receptionTime: '10:00', endTime: '20:30', lunarDate: '09/09 năm Bính Ngọ', ceremonyVenue: 'Tư gia' },
  families: [
    { title: 'Nhà trai', mapQuery: '21.131066103159878,105.9095027585827', father: 'Chu Văn Phi', mother: 'Đinh Thị Thu', address: 'Xóm Đình Tràng, Thôn Đình Ngọc, Xã Thư Lâm, TP. Hà Nội' },
    { title: 'Nhà gái', mapQuery: '21.15289342058316,105.94212620314183', father: 'Nguyễn Hữu Thủy', mother: 'Trương Thị Oanh', address: 'TDP Mai Động, Phường Phù Khê, TP Bắc Ninh' }
  ],
  hero: { src:'./public/images/wedding/originals/06.jpg',alt:'Ảnh cưới Chu Tiến Đạt và Nguyễn Huyền Dịu',position:'center' },
  gallery: [6,8,3,11,4,9,5,12,7,10,1,2].map(n=>({id:`photo-${String(n).padStart(2,'0')}`,src:`./public/images/wedding/originals/${String(n).padStart(2,'0')}.jpg`,thumbnailSrc:`./public/images/wedding/originals/${String(n).padStart(2,'0')}.jpg`,alt:`Ảnh a${n} của Tiến Đạt và Huyền Dịu`,position:'center'})),
  decorations: { floral:'./public/images/decorations/floral.svg',paper:'./public/images/decorations/paper.svg',palace:'./public/images/decorations/palace.svg',fallback:'./public/images/wedding/originals/06.jpg' },
  gifts: [
    {id:'groom',role:'Mừng chú rể',bank:'MB Bank',holder:'CHU TIẾN ĐẠT',account:'333332692222',qrSrc:'./public/images/gift/groom-qr.jpg',placeholder:false},
    {id:'bride',role:'Mừng cô dâu',bank:'VietinBank',holder:'NGUYỄN HUYỀN DỊU',account:'108873902258',qrSrc:'./public/images/gift/bride-qr.jpg',placeholder:false}
  ],
  music: {src:'./public/audio/le-duong-mot-doi.mp3',volume:0.25},
  guestbookSeed: []
};
export const motion = {
  sealPulse:2000,sealGlow:600,sealBreak:500,floralReveal:1200,opening:2100,contentReveal:1200,coverFade:700,
  galleryTransition:1100,galleryAutoplay:4800,dotTransition:300,overlay:300,
  floatDistance:8,floatDurations:[5000,5500,6000,6500],
  petals:{count:12,minDuration:11000,maxDuration:24000},
  autoScrollSpeed:18,interactionPause:9000
};
