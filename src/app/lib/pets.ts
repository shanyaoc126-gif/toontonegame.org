// Print Job pet registry — static data mirrored from public/pets/*.spec.json.
// Used by the SEO pet pages (build time, no fetch) and as the single source of
// truth for the /pets/[slug] route list. The in-game PrintJob view fetches the
// live spec.json so the SVG + spec always come from the same deployed asset.

export type PetSlug =
  | 'golden-shaded-longhair'
  | 'ragdoll'
  | 'shiba-inu'
  | 'corgi';

export interface PetZone {
  id: string;            // z1..z5, in spec order (= round order)
  part: string;          // part name (Chinese)
  partEn: string;        // English part label
  note: string;          // English flavor note for the zone
  completedFill: string; // hex fill used by the completed (-full) artwork
  target: { h: number; s: number; b: number }; // target HSB for calibration
}

export interface PetInfo {
  slug: PetSlug;
  name: string;          // English breed name
  nameZh: string;        // Chinese breed name
  keywords: string;      // breed keywords for metadata/description
  description: string;   // English SEO description
  personalityZh: string; // Chinese personality line (from spec)
  personalityEn: string; // English personality line
  zones: PetZone[];      // 5 zones, z1..z5 order
}

export const PETS: PetInfo[] = [
  {
    slug: 'golden-shaded-longhair',
    name: 'Golden Shaded Longhair',
    nameZh: '长毛金渐层',
    keywords: 'golden shaded cat, golden shaded longhair cat print job',
    description:
      'Calibrate the coat of the Golden Shaded Longhair — five ink zones from warm cream undercoat to golden fur tips. Match each target color with HSB, RGB, or CMYK sliders, scored by CIEDE2000.',
    personalityZh: '把日落穿在毛尖上的行走渐变盘，蓬松度随季节自动膨胀。',
    personalityEn:
      'A walking gradient palette that wears the sunset on its fur tips; fluffiness inflates automatically with the seasons.',
    zones: [
      {
        id: 'z1',
        part: '底绒',
        partEn: 'Undercoat',
        note: 'Warm cream underfur — the canvas base of the whole gradient print.',
        completedFill: '#f5ead6',
        target: { h: 39, s: 13, b: 96 },
      },
      {
        id: 'z2',
        part: '毛尖金',
        partEn: 'Golden fur tips',
        note: 'Golden tips on the crown and back — the signature shaded shine.',
        completedFill: '#e6a94e',
        target: { h: 36, s: 66, b: 90 },
      },
      {
        id: 'z3',
        part: '耳背深金',
        partEn: 'Deep gold ear backs',
        note: 'Deeper golden-brown on the ear backs — the darkest step of the shade.',
        completedFill: '#c17f28',
        target: { h: 34, s: 79, b: 76 },
      },
      {
        id: 'z4',
        part: '绿金眼',
        partEn: 'Green-gold eyes',
        note: 'Big round eyes with a green-gold iris, like two olive candies.',
        completedFill: '#a4b94f',
        target: { h: 72, s: 57, b: 73 },
      },
      {
        id: 'z5',
        part: '腮粉',
        partEn: 'Blush pink',
        note: 'Cheek blush and the pink nose tip — responsible for excessive cuteness.',
        completedFill: '#f4c3bd',
        target: { h: 7, s: 23, b: 96 },
      },
    ],
  },
  {
    slug: 'ragdoll',
    name: 'Ragdoll',
    nameZh: '布偶猫',
    keywords: 'ragdoll cat, ragdoll cat print job',
    description:
      'Print the Ragdoll — cream base, seal points, and those famous blue eyes. Five ink zones, calibrated one color at a time and scored by CIEDE2000.',
    personalityZh: '一抱就软成布偶的蓝眼睛大家闺秀，重点色是她的晚礼服。',
    personalityEn:
      'A blue-eyed lady who goes soft as a ragdoll the moment she is picked up; her points are her evening gown.',
    zones: [
      {
        id: 'z1',
        part: '奶油底',
        partEn: 'Cream base',
        note: 'Creamy longhair base all over — soft as a cloud.',
        completedFill: '#f6ecd9',
        target: { h: 39, s: 12, b: 96 },
      },
      {
        id: 'z2',
        part: '海豹重点',
        partEn: 'Seal points',
        note: 'Seal-brown points on the ears, mask, and tail tip.',
        completedFill: '#5d4738',
        target: { h: 24, s: 40, b: 36 },
      },
      {
        id: 'z3',
        part: '蓝眼',
        partEn: 'Blue eyes',
        note: 'The trademark deep-blue round eyes.',
        completedFill: '#8fc3e8',
        target: { h: 205, s: 38, b: 91 },
      },
      {
        id: 'z4',
        part: '胸白绒',
        partEn: 'White chest ruff',
        note: 'The fluffier, whiter ruff on the chest.',
        completedFill: '#fdfbf6',
        target: { h: 43, s: 3, b: 99 },
      },
      {
        id: 'z5',
        part: '粉鼻',
        partEn: 'Pink nose',
        note: 'A pink nose dot on the pointed face.',
        completedFill: '#f2b6ae',
        target: { h: 7, s: 28, b: 95 },
      },
    ],
  },
  {
    slug: 'shiba-inu',
    name: 'Shiba Inu',
    nameZh: '柴犬',
    keywords: 'shiba inu, shiba inu print job',
    description:
      'Print the Shiba Inu — red-orange back coat, white belly and brow spots, and the little pink tongue. Five ink zones, calibrated by hand and scored by CIEDE2000.',
    personalityZh: '卷尾是肉桂卷，笑容是半永久焊死的那种倔强可爱。',
    personalityEn:
      'A curled tail shaped like a cinnamon roll and a smile welded on permanently — stubbornly adorable.',
    zones: [
      {
        id: 'z1',
        part: '赤背',
        partEn: 'Red back coat',
        note: 'The signature red-orange back coat, including the upright ears and curled tail.',
        completedFill: '#d8793a',
        target: { h: 24, s: 73, b: 85 },
      },
      {
        id: 'z2',
        part: '白腹眉点',
        partEn: 'White belly & brow spots',
        note: 'White cheeks and chest, plus the two “four-eyes” brow spots.',
        completedFill: '#fbf5ea',
        target: { h: 39, s: 7, b: 98 },
      },
      {
        id: 'z3',
        part: '黑鼻眼',
        partEn: 'Black nose & eyes',
        note: 'The black nose and round dark eyes.',
        completedFill: '#33302c',
        target: { h: 34, s: 14, b: 20 },
      },
      {
        id: 'z4',
        part: '耳内奶油',
        partEn: 'Cream inner ears',
        note: 'Cream-colored insides of the upright ears.',
        completedFill: '#f3d9b6',
        target: { h: 34, s: 25, b: 95 },
      },
      {
        id: 'z5',
        part: '舌粉',
        partEn: 'Pink tongue',
        note: 'The little pink tongue when the grin goes wide.',
        completedFill: '#ef9fa0',
        target: { h: 359, s: 33, b: 94 },
      },
    ],
  },
  {
    slug: 'corgi',
    name: 'Pembroke Welsh Corgi',
    nameZh: '柯基',
    keywords: 'corgi, pembroke welsh corgi print job',
    description:
      'Print the Pembroke Welsh Corgi — tan coat, white chest and socks, and the big pink tongue. Five ink zones, calibrated by hand and scored by CIEDE2000.',
    personalityZh: '小短腿限量款，大耳朵是两台时刻接收零食信号的卫星天线。',
    personalityEn:
      'A limited edition on short little legs; those big ears are twin satellite dishes tuned to snack signals.',
    zones: [
      {
        id: 'z1',
        part: '黄棕背',
        partEn: 'Tan coat',
        note: 'The tan main coat on the head and body.',
        completedFill: '#e2a55f',
        target: { h: 32, s: 58, b: 89 },
      },
      {
        id: 'z2',
        part: '白胸腹',
        partEn: 'White chest & belly',
        note: 'The white blaze, chest ruff, and four little white socks.',
        completedFill: '#fdfcf8',
        target: { h: 48, s: 2, b: 99 },
      },
      {
        id: 'z3',
        part: '粉舌',
        partEn: 'Pink tongue',
        note: 'The big pink tongue flung out mid-grin.',
        completedFill: '#f2a0aa',
        target: { h: 353, s: 34, b: 95 },
      },
      {
        id: 'z4',
        part: '黑鼻眼',
        partEn: 'Black nose & eyes',
        note: 'The black nose and round eyes.',
        completedFill: '#33302c',
        target: { h: 34, s: 14, b: 20 },
      },
      {
        id: 'z5',
        part: '耳内奶油',
        partEn: 'Cream inner ears',
        note: 'Cream-colored insides of the oversized upright ears.',
        completedFill: '#f6ddbe',
        target: { h: 33, s: 23, b: 96 },
      },
    ],
  },
];

export function getPet(slug: string): PetInfo | undefined {
  return PETS.find((p) => p.slug === slug);
}

// Whimsical press-floor feedback shown after each submitted zone.
// Keyed by zone id; the fallback covers any future zone.
export function zoneQuip(zoneId: string, deltaE: number): string {
  const clean = deltaE <= 8;
  const table: Record<string, [string, string]> = {
    z1: ['The base coat is looking cozy.', 'The base coat came out a little off-register — charming, in a way.'],
    z2: ['That shade is coming in rich.', 'The shade drifted — the press says it adds character.'],
    z3: ['Deep tones, beautifully pulled.', 'The deep tones landed a bit sideways. The ear backs forgive you.'],
    z4: ['Those eyes are gleaming.', 'The eyes read slightly misprinted — still adorable.'],
    z5: ['The blush is looking toasty.', 'A rosy smudge — we will call it a limited-edition blush.'],
  };
  const pair = table[zoneId] ?? ['Ink laid down nicely.', 'The press hiccuped, but the job moves on.'];
  return clean ? pair[0] : pair[1];
}
