// All invitation variants use these fixed reception slots.
export const receptionSlots = {
  oct30: { date: '2026-10-30', weekday: 'Thứ Sáu', lunarDate: '21/09 năm Bính Ngọ', time: '17:00' },
  oct31: { date: '2026-10-31', weekday: 'Thứ Bảy', lunarDate: '22/09 năm Bính Ngọ', time: '10:00' }
};
export const invitationDefaults = { side: 'groom', slot: 'oct31' };
// Replace asset files or update paths here. Components never import photographs.
export const invitationData = {
  couple: { groom: 'Tiến Đạt', bride: 'Huyền Dịu', groomFull: 'Chu Tiến Đạt', brideFull: 'Nguyễn Huyền Dịu' },
  guestName: 'Quý khách',
  publicSiteURL: 'https://datct269.github.io/wedding-invitation/',
  event: {
    date: '2026-10-31',
    ceremonyDate: '2026-10-31', ceremonyWeekday: 'Thứ Bảy', ceremonyLunarDate: '22/09 năm Bính Ngọ', ceremonyTime: '13:30', ceremonyVenue: 'Tư gia',
    receptionDate: receptionSlots.oct31.date, receptionWeekday: receptionSlots.oct31.weekday, receptionLunarDate: receptionSlots.oct31.lunarDate, receptionTime: receptionSlots.oct31.time
  },
  families: [
    { title: 'Nhà trai', mapQuery: '21.131066103159878,105.9095027585827', father: 'Chu Văn Phi', mother: 'Đinh Thị Thu', address: 'Thôn Đình Ngọc, Xã Thư Lâm, TP Hà Nội' },
    { title: 'Nhà gái', mapQuery: '21.15289342058316,105.94212620314183', father: 'Nguyễn Hữu Thủy', mother: 'Trương Thị Oanh', address: 'TDP Mai Động, Phường Phù Khê, TP Bắc Ninh' }
  ],
  hero: { src:'./public/images/wedding/optimized/06.jpg',alt:'Ảnh cưới Chu Tiến Đạt và Nguyễn Huyền Dịu',position:'center' },
  gallery: [6,8,3,11,4,9,5,12,7,10,1,2].map(n=>{const file=String(n).padStart(2,'0');return {id:`photo-${file}`,src:`./public/images/wedding/optimized/${file}.jpg`,lightboxSrc:`./public/images/wedding/lightbox/${file}.jpg`,thumbnailSrc:`./public/images/wedding/thumbnails/${file}.jpg`,alt:`Ảnh a${n} của Tiến Đạt và Huyền Dịu`,position:'center'};}),
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
