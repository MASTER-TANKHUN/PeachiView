import videosJson from './videos.json';
import channelJson from './channel.json';

export type Category = 'horror' | 'roblox' | 'minecraft' | 'games' | 'reality' | 'music' | 'talk' | 'live';
export type Era = 'v1' | 'v2' | 'v3';
export interface Video {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  kind: 'video' | 'live' | 'short';
  views: number;
  length: string;
  cats: Category[];
  era: Era;
  hd: boolean;
}

export const videos = videosJson as Video[];
export const channel = channelJson;

export const CHANNEL_URL = 'https://www.youtube.com/@PeachiView249';
export const SUBSCRIBE_URL = `${CHANNEL_URL}?sub_confirmation=1`;

export const socials = [
  { name: 'YouTube', handle: '@PeachiView249', url: CHANNEL_URL, icon: 'youtube' },
  { name: 'X', handle: '@PeachiView', url: 'https://x.com/PeachiView', icon: 'x' },
  { name: 'Instagram', handle: '@peachiview', url: 'https://www.instagram.com/peachiview/', icon: 'instagram' },
  { name: 'TikTok', handle: '@peachiview', url: 'https://www.tiktok.com/@peachiview', icon: 'tiktok' },
] as const;

export const dates = {
  joined: '2018-02-07',
  debut: '2021-01-31',
  lastBeforeBreak: '2022-01-14',
  comeback: '2026-09-12',
};

const dayMs = 86_400_000;
export const daysWaited = Math.round((Date.parse(dates.comeback) - Date.parse(dates.lastBeforeBreak)) / dayMs); // 1702

const byId = new Map(videos.map((v) => [v.id, v]));
export const video = (id: string) => byId.get(id)!;

export const stats = {
  subscribers: 56_200,
  subscribersLabel: '5.62 หมื่น',
  views: 2_048_430,
  videos: videos.length,
  topVideo: [...videos].sort((a, b) => b.views - a.views)[0],
};

export const thumb = (id: string, size: 'mq' | 'hq' | 'sd' | 'maxres' = 'maxres') =>
  `https://i.ytimg.com/vi/${id}/${size}default.jpg`;
export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const thaiDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${thaiMonths[m - 1]} ${y}`;
};
/** film-camera date stamp, e.g. '21 10 22 */
export const filmStamp = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `'${y.slice(2)} ${m} ${d}`;
};
export const compact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}K` : `${n}`;

export const categories: { key: Category | 'all' | 'popular'; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'popular', label: 'ยอดนิยม' },
  { key: 'horror', label: 'เกมผี' },
  { key: 'roblox', label: 'Roblox' },
  { key: 'minecraft', label: 'Minecraft' },
  { key: 'games', label: 'เกมอื่นๆ' },
  { key: 'reality', label: 'REALITY' },
  { key: 'music', label: 'ร้องเพลง & MMD' },
  { key: 'talk', label: 'พูดคุย & สอน' },
  { key: 'live', label: 'ไลฟ์' },
];

export const profile = {
  name: 'PeachiView',
  nick: 'พีชชี่',
  tagline: 'VTuber สาวลูกพีชจากประเทศไทย',
  facts: [
    { k: 'มาจาก', v: 'ประเทศไทย 🇹🇭' },
    { k: 'สรรพนาม', v: 'she / her' },
    { k: 'ชื่อแฟนคลับ', v: 'ลูกพีชน้อย' },
    { k: 'คลิปแรก', v: 'I am Peachi! · 31 ม.ค. 2021' },
    { k: 'เข้าร่วม YouTube', v: '7 ก.พ. 2018' },
    { k: 'ชอบ', v: 'ทำให้ลูกพีชมีความสุข' },
    { k: 'ไอเท็มประจำตัว', v: 'หูฟังชมพู · ลูกพีช · ความน่ารัก' },
  ],
};

export const models: {
  era: Era;
  no: string;
  name: string;
  nick: string;
  period: string;
  first: string;
  img: 'v1-bust' | 'v2-wave' | 'v3-avatar';
  alt: string;
  extra?: 'v1-full' | 'v2-art';
  extraAlt?: string;
  traits: string[];
  palette: string[];
  note: string;
}[] = [
  {
    era: 'v1', no: '01', name: 'Peachi 1.0', nick: 'เสื้อยืดชมพูลายลูกพีช', period: 'ม.ค. – ก.ย. 2021', first: '9qGj77e6Js4',
    img: 'v1-bust', alt: 'โมเดลแรกของพีชชี่ ผมน้ำตาลยาว หูฟังหูแมวสีชมพู ใส่เสื้อยืดสีชมพูลายลูกพีช',
    extra: 'v1-full', extraAlt: 'พีชชี่โมเดลแรกแบบเต็มตัว ชูสองนิ้ว ใส่เสื้อยืดตัวโคร่งสีชมพู',
    traits: ['หูฟังหูแมวสีชมพู', 'ผมน้ำตาลยาวสองข้าง', 'เสื้อยืดตัวโคร่งลายลูกพีช'],
    palette: ['#5b3a30', '#f7bee4', '#ffb8a5', '#9a96a0'],
    note: 'ร่างที่เริ่มทุกอย่าง ตั้งแต่ "I am Peachi!" จนถึง 10,000 ผู้ติดตาม',
  },
  {
    era: 'v2', no: '02', name: 'Peachi 2.0', nick: 'ฮู้ดดี้สีชมพู', period: 'ก.ย. 2021 – ม.ค. 2022', first: 'r0D9kMR1C5I',
    img: 'v2-wave', alt: 'โมเดลที่สองของพีชชี่ ใส่ฮู้ดดี้สีชมพูลายลูกพีช กำลังโบกมือ',
    extra: 'v2-art', extraAlt: 'ภาพวาด 2D ของพีชชี่ชุดสีชมพูที่ใช้ตอนไลฟ์',
    traits: ['ฮู้ดดี้ชมพูลายลูกพีช', 'ท่าโบกมือสุดคุ้น', 'ภาพวาด 2D สำหรับไลฟ์'],
    palette: ['#5b3a30', '#f59ac8', '#ffc0d8', '#ffffff'],
    note: 'ร่างที่พาไปถึง 40,000 ผู้ติดตาม คลิปฮิตที่สุดก็มาจากร่างนี้',
  },
  {
    era: 'v3', no: '03', name: 'Peachi 3.0', nick: 'ร่างใหม่ 2026', period: 'ก.ย. 2026 – ตอนนี้', first: 'gp5nmWYqZeg',
    img: 'v3-avatar', alt: 'โมเดลใหม่ของพีชชี่ปี 2026 ผมไล่สีน้ำตาลเป็นชมพู หูฟังหูแมว โชคเกอร์หัวใจ เสื้อลายลูกพีช',
    traits: ['ผมไล่สีน้ำตาล → ชมพู', 'โชคเกอร์หัวใจ', 'แจ็กเก็ตฮู้ดชมพูขาว'],
    palette: ['#5e2a2a', '#d37a85', '#f1bbc5', '#f569c0'],
    note: 'ร่างคัมแบ็ก! สวยขึ้น โตขึ้น แต่ยังเป็นพีชชี่คนเดิม',
  },
];

export const journey: { id: string; date: string; title: string; note: string }[] = [
  { id: '9qGj77e6Js4', date: '2021-01-31', title: 'I am Peachi!', note: 'สวัสดีครั้งแรก — คลิปแนะนำตัวคลิปแรกของช่อง' },
  { id: 'DbS91kVw_Jc', date: '2021-04-12', title: 'ป่วน VTuber ในแอป REALITY', note: 'คลิปแจ้งเกิดของช่อง!' },
  { id: '5gR4Lqc05Io', date: '2021-04-27', title: 'วิธีเป็น VTuber ง่ายๆ ฟรีๆ', note: 'คลิปสอนเป็น VTuber ที่คนดูกันหลักแสน' },
  { id: 'UMb8qhQ_o3Q', date: '2021-08-05', title: 'กลับมาแล้วนะคะ :D', note: 'หายไปสองเดือนแล้วกลับมาพร้อมมีมฮาๆ' },
  { id: 'W1aHgtCZ7vE', date: '2021-09-01', title: '10,000 ผู้ติดตาม!', note: 'ฉลองหลักหมื่นด้วย Q&A' },
  { id: 'r0D9kMR1C5I', date: '2021-09-24', title: 'เปิดตัวชุดฮู้ดดี้', note: 'Q&A แนะนำตัวในลุคใหม่ — ฮู้ดดี้ชมพูลายลูกพีช' },
  { id: 'ymj0KAE7Zsk', date: '2021-10-17', title: 'MMD Gasoline (Cover)', note: 'MMD เต้นเท่ๆ พร้อมคำแปลไทย' },
  { id: '3aYOMCILtU0', date: '2021-10-22', title: 'วิธีเป็น VTuber ในมือถือ', note: 'คลิปยอดวิวสูงสุดของช่อง 👑' },
  { id: 'NU7rNJ1KgiQ', date: '2021-12-09', title: 'ขอบคุณ 40,000 ลูกพีชน้อย', note: 'จากศูนย์ถึงสี่หมื่นในปีเดียว' },
  { id: 'dvLkIPZb-iQ', date: '2021-12-27', title: 'Snowman นางหิมะ ❄', note: 'คัฟเวอร์เพลง Snowman ต้อนรับหน้าหนาว' },
  { id: 'apZ2gs8Wjac', date: '2021-12-29', title: 'วีทูปเบอร์เปิดหน้า!?', note: 'ชื่อคลิปแบบนี้ ใครจะอดใจไม่กดได้ล่ะ!' },
  { id: '_MUm-QmvAPo', date: '2022-01-14', title: 'วีทูปเบอร์ขายอาหาร', note: 'คลิปสุดท้ายก่อนหายไป… (ขายไอติมใน Roblox)' },
];

export const fanMessages = [
  'ยังรออยู่นะคะ ♥',
  'กลับมาลงคลิปหน่อยยย',
  'สบายดีไหมพีชชี่',
  'เปิด Snowman ฟังวนอีกแล้ว ❄',
  'คิดถึงเสียงกรี๊ดตอนเล่นเกมผี',
  'ลูกพีชน้อยยังอยู่ตรงนี้นะ',
  'ปีใหม่อีกแล้ว… พีชชี่อยู่ไหนน้า',
  'ขอให้มีความสุขนะ ไม่ว่าจะอยู่ที่ไหน',
];

export const letter = {
  greeting: 'ถึง พีชชี่ 🍑',
  paragraphs: [
    'ยินดีต้อนรับกลับบ้านนะ!',
    'ตอนคลิป "หายไปไหนนานจัง?" เด้งขึ้นมา กดเข้าไปดูแทบไม่ทันเลย แล้วพีชชี่ก็ถามว่า "ยังคิดถึงกันมั้ยคะ" — คิดถึงสิ คิดถึงมากด้วย',
    'ตลอด 1,702 วันที่หายไป เรายังแวะกลับไปเปิด Snowman ฟังอยู่บ่อยๆ ยังเห็นลูกพีชน้อยคนอื่นๆ เข้าไปคอมเมนต์ถามในคลิปเก่าว่าสบายดีไหม แล้วก็ยังเก็บมีมที่เคยทำให้เมื่อ 4 ปีก่อนไว้ด้วยนะ',
    'จำไลฟ์ชื่อ "I\'ll See You Soon!" ได้ไหม — soon ของพีชชี่นานไปหน่อยนะ แต่ไม่เป็นไรเลย ขอแค่กลับมาแบบมีความสุขก็พอแล้ว',
    'จะเป็นเสื้อยืดชมพู ชุดฮู้ดดี้ หรือร่างใหม่ที่สวยขึ้นเยอะมาก พีชชี่ก็ยังเป็นพีชชี่คนเดิมที่ทำให้พวกเรายิ้มได้เสมอ',
    'ครั้งนี้จะเล่นเกมผี ตะลุย Roblox หรือทำคลิปแบบไหนก็ตาม เราจะอยู่ตรงนี้คอยเชียร์ทุกคลิป ไม่ต้องรีบ ไม่ต้องกดดันตัวเอง ดูแลตัวเองดีๆ นะ',
    'ขอบคุณที่กลับมานะ ✦',
  ],
  from: 'จาก ลูกพีชน้อยคนหนึ่ง',
  signature: 'Master Tankhun | Tankhun Gaming',
};

/**
 * เพลงของเครื่องเล่นแผ่นเสียงในส่วน #radio
 * เล่นผ่าน YouTube embed ตั้งแต่วินาทีที่ `start` จนจบเพลง
 * เพลงมีลิขสิทธิ์ของเจ้าของผลงาน — เว็บไม่ได้เก็บ/แจกไฟล์เพลง และมีคำเตือนไว้ที่ปุ่มเล่นแล้ว
 *
 * เนื้อเพลง: วางแบบ LRC ใน `lrc` — หนึ่งบรรทัดต่อหนึ่งท่อน, เวลาเป็น "เวลาในคลิป YouTube"
 *   [00:36.50] ท่อนแรก
 *   [00:40.10] ท่อนถัดไป
 * ถ้าเว้นว่างไว้ กล่องเนื้อเพลงจะโชว์ชื่อเพลง/ศิลปินแทน
 */
export const song = {
  id: 'FJtJ0E-lUg8',
  title: 'Make a wish',
  artist: 'P9d ft. TL',
  start: 36.5,
  url: 'https://www.youtube.com/watch?v=FJtJ0E-lUg8',
  lrc: ``,
};
