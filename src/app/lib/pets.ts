// Print Job pet registry — static data mirrored from public/pets/photos/<slug>.json
// (the photo edition: targets are the REAL average colors sampled from each
// pet's original photo). Used by the SEO pet pages (build time, no fetch) and
// as the single source of truth for the /pets/[slug] route list. The in-game
// PrintJob view fetches the live photo manifest so the canvas + masks + spec
// always come from the same deployed asset set.

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
        part: '金色被毛',
        partEn: 'The golden coat',
        note: "Golden fur tones sampled straight from the photo — the heart of the coat.",
        completedFill: '#9c7357',
        target: { h: 24, s: 44, b: 61 },
      },
      {
        id: 'z2',
        part: '金色被毛',
        partEn: 'The golden coat',
        note: "Golden fur tones sampled straight from the photo — the heart of the coat.",
        completedFill: '#21180f',
        target: { h: 30, s: 55, b: 13 },
      },
      {
        id: 'z3',
        part: '金色被毛',
        partEn: 'The golden coat',
        note: "Golden fur tones sampled straight from the photo — the heart of the coat.",
        completedFill: '#654735',
        target: { h: 23, s: 48, b: 40 },
      },
      {
        id: 'z4',
        part: '金色被毛',
        partEn: 'The golden coat',
        note: "Golden fur tones sampled straight from the photo — the heart of the coat.",
        completedFill: '#897664',
        target: { h: 29, s: 27, b: 54 },
      },
      {
        id: 'z5',
        part: '中间暖色毛区',
        partEn: 'The mid warm fur',
        note: "Mid-warm fur tones sampled straight from the photo.",
        completedFill: '#d4bca9',
        target: { h: 27, s: 20, b: 83 },
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
        part: '浅色胸腹',
        partEn: 'The pale chest & belly',
        note: "The pale cream chest and belly fur, sampled straight from the photo.",
        completedFill: '#dad1cc',
        target: { h: 21, s: 6, b: 85 },
      },
      {
        id: 'z2',
        part: '暖玫瑰与姜色斑纹',
        partEn: 'The warm rose & ginger marks',
        note: "Warm rose and ginger marks sampled straight from the photo.",
        completedFill: '#92776b',
        target: { h: 18, s: 27, b: 57 },
      },
      {
        id: 'z3',
        part: '柔和阴影色调',
        partEn: 'The soft shadow tones',
        note: "Soft shadow tones in the fur, sampled straight from the photo.",
        completedFill: '#bda599',
        target: { h: 20, s: 19, b: 74 },
      },
      {
        id: 'z4',
        part: '柔和阴影色调',
        partEn: 'The soft shadow tones',
        note: "Soft shadow tones in the fur, sampled straight from the photo.",
        completedFill: '#c0b1aa',
        target: { h: 19, s: 11, b: 75 },
      },
      {
        id: 'z5',
        part: '金色被毛',
        partEn: 'The golden coat',
        note: "Golden fur tones sampled straight from the photo — the heart of the coat.",
        completedFill: '#5e3e28',
        target: { h: 24, s: 57, b: 37 },
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
        part: '眼睛与绿色反光',
        partEn: 'The eyes & green glints',
        note: "The dark eyes with their green glints, sampled straight from the photo.",
        completedFill: '#0e0f08',
        target: { h: 69, s: 47, b: 6 },
      },
      {
        id: 'z2',
        part: '中间暖色毛区',
        partEn: 'The mid warm fur',
        note: "Mid-warm fur tones sampled straight from the photo.",
        completedFill: '#c0bf69',
        target: { h: 59, s: 45, b: 75 },
      },
      {
        id: 'z3',
        part: '金色被毛',
        partEn: 'The golden coat',
        note: "Golden fur tones sampled straight from the photo — the heart of the coat.",
        completedFill: '#9f7d3d',
        target: { h: 39, s: 62, b: 62 },
      },
      {
        id: 'z4',
        part: '金色被毛',
        partEn: 'The golden coat',
        note: "Golden fur tones sampled straight from the photo — the heart of the coat.",
        completedFill: '#13120a',
        target: { h: 53, s: 47, b: 7 },
      },
      {
        id: 'z5',
        part: '中间暖色毛区',
        partEn: 'The mid warm fur',
        note: "Mid-warm fur tones sampled straight from the photo.",
        completedFill: '#cbc579',
        target: { h: 56, s: 40, b: 80 },
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
        part: '柔和阴影色调',
        partEn: 'The soft shadow tones',
        note: "Soft shadow tones in the fur, sampled straight from the photo.",
        completedFill: '#9f8e84',
        target: { h: 22, s: 17, b: 62 },
      },
      {
        id: 'z2',
        part: '柔和阴影色调',
        partEn: 'The soft shadow tones',
        note: "Soft shadow tones in the fur, sampled straight from the photo.",
        completedFill: '#5d4c4b',
        target: { h: 3, s: 19, b: 36 },
      },
      {
        id: 'z3',
        part: '柔和阴影色调',
        partEn: 'The soft shadow tones',
        note: "Soft shadow tones in the fur, sampled straight from the photo.",
        completedFill: '#9e9186',
        target: { h: 27, s: 15, b: 62 },
      },
      {
        id: 'z4',
        part: '浅色胸腹',
        partEn: 'The pale chest & belly',
        note: "The pale cream chest and belly fur, sampled straight from the photo.",
        completedFill: '#c9bdb8',
        target: { h: 18, s: 8, b: 79 },
      },
      {
        id: 'z5',
        part: '暖玫瑰与姜色斑纹',
        partEn: 'The warm rose & ginger marks',
        note: "Warm rose and ginger marks sampled straight from the photo.",
        completedFill: '#7a5b50',
        target: { h: 16, s: 34, b: 48 },
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
