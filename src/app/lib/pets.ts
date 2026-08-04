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
  | 'corgi'
  | 'golden-retriever'
  | 'border-collie'
  | 'husky'
  | 'samoyed'
  | 'siamese'
  | 'maine-coon';

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
  {
    slug: 'golden-retriever',
    name: 'Golden Retriever',
    nameZh: '金毛寻回犬',
    keywords: 'golden retriever, golden retriever dog print job',
    description:
      'Calibrate the coat of the Golden Retriever — five ink zones of sun-warmed gold and field grass. Match each target color with HSB, RGB, or CMYK sliders, scored by CIEDE2000.',
    personalityZh: '尾巴是一台全年无休的雨刷器，热情浓度按升计算。',
    personalityEn: 'A tail that wags like a year-round wiper; enthusiasm measured in litres.',
    zones: [
      { id: 'z1', part: '金色被毛', partEn: 'The golden body coat', note: 'The sun-warmed golden body coat, sampled from the photo.', completedFill: '#51461a', target: { h: 48, s: 68, b: 32 } },
      { id: 'z2', part: '金色被毛', partEn: 'The golden body coat', note: 'Bright gold highlights on the coat.', completedFill: '#d09f5d', target: { h: 34, s: 55, b: 82 } },
      { id: 'z3', part: '头耳被毛', partEn: 'The head & ear coat', note: 'The rich head and ear gold.', completedFill: '#b7783c', target: { h: 29, s: 67, b: 72 } },
      { id: 'z4', part: '头耳被毛', partEn: 'The head & ear coat', note: 'Deeper gold in the ear shadows.', completedFill: '#3d2a17', target: { h: 30, s: 62, b: 24 } },
      { id: 'z5', part: '草地背景', partEn: 'The grass & leafy backdrop', note: 'The field green behind him.', completedFill: '#6a702f', target: { h: 66, s: 58, b: 44 } },
    ],
  },
  {
    slug: 'border-collie',
    name: 'Border Collie',
    nameZh: '边境牧羊犬',
    keywords: 'border collie, border collie dog print job',
    description:
      'Calibrate the Border Collie — black coat, white blaze and chest, amber eyes. Five ink zones, matched by eye and scored by CIEDE2000.',
    personalityZh: '智商排名第一的卷王，看谁都像需要被牧羊。',
    personalityEn: 'The valedictorian of dogkind; everyone looks like they need herding.',
    zones: [
      { id: 'z1', part: '深棕被毛', partEn: 'The mid warm fur', note: 'The warm brown mid tones of the coat.', completedFill: '#57473b', target: { h: 26, s: 32, b: 34 } },
      { id: 'z2', part: '头耳被毛', partEn: 'The head & ear coat', note: 'The deep head and ear black.', completedFill: '#322517', target: { h: 31, s: 54, b: 20 } },
      { id: 'z3', part: '深棕被毛', partEn: 'The mid warm fur', note: 'Mid coat browns in the mane.', completedFill: '#382920', target: { h: 23, s: 43, b: 22 } },
      { id: 'z4', part: '深墨细节', partEn: 'The dark points & outline', note: 'The darkest coat shadows.', completedFill: '#281d14', target: { h: 27, s: 50, b: 16 } },
      { id: 'z5', part: '暖棕过渡', partEn: 'The mid warm fur', note: 'Lighter warm browns on the ruff.', completedFill: '#6e5b4d', target: { h: 25, s: 30, b: 43 } },
    ],
  },
  {
    slug: 'husky',
    name: 'Siberian Husky',
    nameZh: '哈士奇',
    keywords: 'siberian husky, husky dog print job',
    description:
      'Calibrate the Siberian Husky — copper-red saddle, cream mask and white chest. Five ink zones, matched by eye and scored by CIEDE2000.',
    personalityZh: '颜值与拆家能力成正比的雪原戏精。',
    personalityEn: 'A snowfield drama queen whose looks scale directly with his chaos.',
    zones: [
      { id: 'z1', part: '浅棕被毛', partEn: 'The mid warm fur', note: 'The lighter saddle browns.', completedFill: '#928160', target: { h: 40, s: 34, b: 57 } },
      { id: 'z2', part: '浅棕被毛', partEn: 'The mid warm fur', note: 'Mid warm browns across the back.', completedFill: '#837352', target: { h: 40, s: 37, b: 51 } },
      { id: 'z3', part: '头耳被毛', partEn: 'The head & ear coat', note: 'The copper head and ear red.', completedFill: '#ad8263', target: { h: 25, s: 43, b: 68 } },
      { id: 'z4', part: '深墨细节', partEn: 'The dark points & outline', note: 'The darkest mask shadows.', completedFill: '#281e15', target: { h: 28, s: 48, b: 16 } },
      { id: 'z5', part: '头耳被毛', partEn: 'The head & ear coat', note: 'Soft copper on the cheeks.', completedFill: '#a58665', target: { h: 31, s: 39, b: 65 } },
    ],
  },
  {
    slug: 'samoyed',
    name: 'Samoyed',
    nameZh: '萨摩耶',
    keywords: 'samoyed, samoyed dog print job',
    description:
      'Calibrate the Samoyed — a cloud of white with soft grey shadows and the famous smile. Five ink zones of near-white, matched by eye and scored by CIEDE2000.',
    personalityZh: '微笑天使，掉毛量以"季"为计量单位。',
    personalityEn: 'The smiling angel; sheds measured by the season.',
    zones: [
      { id: 'z1', part: '浅色绒毛', partEn: 'The pale under-fur', note: 'The soft grey-white under-fur.', completedFill: '#bdbdb5', target: { h: 60, s: 4, b: 74 } },
      { id: 'z2', part: '浅色绒毛', partEn: 'The pale under-fur', note: 'Warmer shadow whites.', completedFill: '#989283', target: { h: 43, s: 14, b: 60 } },
      { id: 'z3', part: '浅色胸腹', partEn: 'The bright chest & paws', note: 'The brightest chest white.', completedFill: '#d2d2d1', target: { h: 60, s: 0, b: 82 } },
      { id: 'z4', part: '柔和阴影', partEn: 'The soft grey shadows', note: 'The cool grey shadows in the fluff.', completedFill: '#bbbdbc', target: { h: 150, s: 1, b: 74 } },
      { id: 'z5', part: '草地背景', partEn: 'The grass & leafy backdrop', note: 'The green lawn behind.', completedFill: '#365b2d', target: { h: 108, s: 51, b: 36 } },
    ],
  },
  {
    slug: 'siamese',
    name: 'Siamese',
    nameZh: '暹罗猫',
    keywords: 'siamese cat, siamese cat print job',
    description:
      'Calibrate the Siamese — cream body, seal points and sapphire eyes. Five ink zones, matched by eye and scored by CIEDE2000.',
    personalityZh: '话痨程度与嗓门成正比的挖煤小能手。',
    personalityEn: 'A chatty coal-miner whose volume scales with her opinions.',
    zones: [
      { id: 'z1', part: '浅色胸腹', partEn: 'The bright chest & paws', note: 'The pale cream chest.', completedFill: '#e5e7eb', target: { h: 220, s: 3, b: 92 } },
      { id: 'z2', part: '浅色胸腹', partEn: 'The bright chest & paws', note: 'Cool cream on the flanks.', completedFill: '#dbdfea', target: { h: 224, s: 6, b: 92 } },
      { id: 'z3', part: '浅色胸腹', partEn: 'The bright chest & paws', note: 'The brightest body cream.', completedFill: '#e9ecee', target: { h: 204, s: 2, b: 93 } },
      { id: 'z4', part: '深墨细节', partEn: 'The dark points & outline', note: 'The seal-brown face points.', completedFill: '#36342f', target: { h: 43, s: 13, b: 21 } },
      { id: 'z5', part: '草地背景', partEn: 'The grass & leafy backdrop', note: 'The green grass behind.', completedFill: '#768e52', target: { h: 84, s: 42, b: 56 } },
    ],
  },
  {
    slug: 'maine-coon',
    name: 'Maine Coon',
    nameZh: '缅因猫',
    keywords: 'maine coon, maine coon cat print job',
    description:
      'Calibrate the Maine Coon — a gentle giant in smoke-grey with lynx-tipped ears. Five ink zones, matched by eye and scored by CIEDE2000.',
    personalityZh: '体型是猫，性格是狗的温柔大块头。',
    personalityEn: 'A gentle giant with a cat body and a dog heart.',
    zones: [
      { id: 'z1', part: '浅色绒毛', partEn: 'The pale under-fur', note: 'The silvery ruff.', completedFill: '#797070', target: { h: 0, s: 7, b: 47 } },
      { id: 'z2', part: '深墨细节', partEn: 'The dark points & outline', note: 'The near-black face mask.', completedFill: '#141217', target: { h: 264, s: 22, b: 9 } },
      { id: 'z3', part: '柔和阴影', partEn: 'The soft grey shadows', note: 'Mid smoke-grey tones.', completedFill: '#484142', target: { h: 351, s: 10, b: 28 } },
      { id: 'z4', part: '深墨细节', partEn: 'The dark points & outline', note: 'The deepest ear and ear-tip blacks.', completedFill: '#141319', target: { h: 250, s: 24, b: 10 } },
      { id: 'z5', part: '深棕过渡', partEn: 'The mid fur below', note: 'Dark plum-brown on the body.', completedFill: '#211c1f', target: { h: 324, s: 15, b: 13 } },
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
