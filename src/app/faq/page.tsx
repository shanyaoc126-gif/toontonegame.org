import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell, H1, H2, P, QA, CtaBlock, JsonLd } from '../components/ContentPage';

export const metadata: Metadata = {
  title: 'ToonTone FAQ: Rules, Scores, Spelling & Privacy',
  description: 'Answers about ToonTone: rules, scoring, Daily Challenge, streaks, mobile play, spelling variants, privacy, and our relationship to toontone.com.',
  alternates: { canonical: 'https://toontonegame.org/faq' },
};

const FAQ_ITEMS: { section: string; items: { q: string; a: React.ReactNode; aText: string }[] }[] = [
  {
    section: 'Playing the Game',
    items: [
      {
        q: 'What is ToonTone Proofing Lab?',
        a: <>A browser-based color matching game with a print-shop soul. Each round shows you a target color — the proof — and you reproduce it with HSB, RGB, or CMYK sliders. The game measures your match with CIEDE2000, the color difference formula used in professional proofing, and scores you 0–100 per round. Five rounds make a full game.</>,
        aText: 'A browser-based color matching game with a print-shop soul. Each round shows you a target color — the proof — and you reproduce it with HSB, RGB, or CMYK sliders. The game measures your match with CIEDE2000, the color difference formula used in professional proofing, and scores you 0–100 per round. Five rounds make a full game.',
      },
      {
        q: 'How do I play?',
        a: <>Open the home page, study the target swatch, drag the sliders until your swatch matches, submit, repeat for five rounds. Set hue first, then saturation, then brightness — the full technique is in the <Link href="/how-to-play" className="text-accent hover:underline">step-by-step guide</Link>.</>,
        aText: 'Open the home page, study the target swatch, drag the sliders until your swatch matches, submit, repeat for five rounds. Set hue first, then saturation, then brightness — the full technique is in the step-by-step guide.',
      },
      {
        q: 'How does scoring work?',
        a: <>Each round, the CIEDE2000 ΔE between your swatch and the target is computed, then mapped to points: score = 100 − ΔE, clamped to 0–100 and rounded. Five rounds total 500 possible points, and your average sets a rating from Color Novice to Color Master (averages of 60, 75, and 90 are the thresholds). The <Link href="/what-is-delta-e" className="text-accent hover:underline">Delta E page</Link> shows the exact formula.</>,
        aText: 'Each round, the CIEDE2000 ΔE between your swatch and the target is computed, then mapped to points: score = 100 − ΔE, clamped to 0–100 and rounded. Five rounds total 500 possible points, and your average sets a rating from Color Novice to Color Master (averages of 60, 75, and 90 are the thresholds). The Delta E page shows the exact formula.',
      },
      {
        q: 'What is the Daily Challenge?',
        a: <>One set of five target colors per day, the same for every player worldwide. The colors are generated from a deterministic seed built on the UTC date — no server picks them, and they can&apos;t be rigged after the fact. The set resets at 00:00 UTC, with a countdown on the page.</>,
        aText: 'One set of five target colors per day, the same for every player worldwide. The colors are generated from a deterministic seed built on the UTC date — no server picks them, and they can\'t be rigged after the fact. The set resets at 00:00 UTC, with a countdown on the page.',
      },
      {
        q: 'What is Practice mode?',
        a: <>Endless random proofs — 5 rounds per run — with identical rules and scoring, but no streak pressure. It&apos;s where you build technique between Daily Challenges — the equivalent of pulling test proofs before the real run.</>,
        aText: 'Endless random proofs — 5 rounds per run — with identical rules and scoring, but no streak pressure. It\'s where you build technique between Daily Challenges — the equivalent of pulling test proofs before the real run.',
      },
      {
        q: 'What is a streak?',
        a: <>The number of consecutive days you&apos;ve completed the Daily Challenge. It&apos;s stored in your browser&apos;s local storage on your device — never uploaded, never synced. Clear your browser data and it resets, so treat it like a shop attendance board, not a bank balance.</>,
        aText: 'The number of consecutive days you\'ve completed the Daily Challenge. It\'s stored in your browser\'s local storage on your device — never uploaded, never synced. Clear your browser data and it resets, so treat it like a shop attendance board, not a bank balance.',
      },
      {
        q: 'How many rounds are in a game?',
        a: <>Five, always — 100 points per round, 500 per game. Short enough to finish in under three minutes; structured enough that a single lucky round can&apos;t fake a good average.</>,
        aText: 'Five, always — 100 points per round, 500 per game. Short enough to finish in under three minutes; structured enough that a single lucky round can\'t fake a good average.',
      },
    ],
  },
  {
    section: 'Access and Cost',
    items: [
      {
        q: 'Is ToonTone free to play?',
        a: <>Yes. The full game — Daily Challenge, Practice mode, all three slider modes — runs in your browser at no charge, with no account wall in front of it.</>,
        aText: 'Yes. The full game — Daily Challenge, Practice mode, all three slider modes — runs in your browser at no charge, with no account wall in front of it.',
      },
      {
        q: 'Do I need to create an account?',
        a: <>No. There is no registration, login, or password. Your streak and highest score live in local storage on your own device, which is the entire &quot;account system&quot; by design.</>,
        aText: 'No. There is no registration, login, or password. Your streak and highest score live in local storage on your own device, which is the entire "account system" by design.',
      },
      {
        q: 'Do I need to download an app?',
        a: <>No. ToonTone is a web game. Open toontonegame.org in any modern browser and you&apos;re at the proofing table — nothing to install, nothing to update.</>,
        aText: 'No. ToonTone is a web game. Open toontonegame.org in any modern browser and you\'re at the proofing table — nothing to install, nothing to update.',
      },
      {
        q: 'Does ToonTone work on mobile?',
        a: <>Yes. The layout is built for small screens: thumb-reachable sliders, no horizontal scrolling, and the full five-round loop works one-handed on a phone. Scores are comparable across devices, though your display quality is part of the instrument you&apos;re playing with.</>,
        aText: 'Yes. The layout is built for small screens: thumb-reachable sliders, no horizontal scrolling, and the full five-round loop works one-handed on a phone. Scores are comparable across devices, though your display quality is part of the instrument you\'re playing with.',
      },
    ],
  },
  {
    section: 'Identity and Spelling',
    items: [
      {
        q: 'Is it toontone, toon tone, toone tone, or toon tones?',
        a: <>All of those spellings circulate for the same color matching game genre that spread through streaming clips. This site is <strong>ToonTone Proofing Lab</strong> at toontonegame.org — one word, one proofing room. Whatever spelling brought you here, the game you were looking for is on the <Link href="/" className="text-accent hover:underline">home page</Link>.</>,
        aText: 'All of those spellings circulate for the same color matching game genre that spread through streaming clips. This site is ToonTone Proofing Lab at toontonegame.org — one word, one proofing room. Whatever spelling brought you here, the game you were looking for is on the home page.',
      },
      {
        q: 'Is ToonTone affiliated with toontone.com?',
        a: <>No. ToonTone Proofing Lab (toontonegame.org) is an independent project and is <strong>not affiliated with, endorsed by, or connected to toontone.com</strong> or any other similarly named site. The genre is a shared format — many sites run color matching games — but this lab&apos;s code, content, and professional print-shop angle are its own.</>,
        aText: 'No. ToonTone Proofing Lab (toontonegame.org) is an independent project and is not affiliated with, endorsed by, or connected to toontone.com or any other similarly named site. The genre is a shared format — many sites run color matching games — but this lab\'s code, content, and professional print-shop angle are its own.',
      },
    ],
  },
  {
    section: 'Color Vision and Accuracy',
    items: [
      {
        q: 'Can I play ToonTone if I\'m colorblind?',
        a: <>Yes — and the lab is built with you in mind. Any time via the CALIBRATE button in the nav you can switch on <strong>color vision assist</strong>: every swatch then carries a shape code — six anchor hues map to six shapes, hues between two anchors carry both — shown on the target and on your print, so matching shapes means matching hue without betting on eyesight alone. The assist is a workaround, not a cure, and ToonTone remains a matching game, not a vision test: it can&apos;t diagnose, screen, or certify anything about your eyes. If you have concerns, a clinician with proper test plates is the address — not a browser game.</>,
        aText: 'Yes — and the lab is built with you in mind. Any time via the CALIBRATE button in the nav you can switch on color vision assist: every swatch then carries a shape code — six anchor hues map to six shapes, hues between two anchors carry both — shown on the target and on your print, so matching shapes means matching hue without betting on eyesight alone. The assist is a workaround, not a cure, and ToonTone remains a matching game, not a vision test: it can\'t diagnose, screen, or certify anything about your eyes. If you have concerns, a clinician with proper test plates is the address — not a browser game.',
      },
      {
        q: 'What is the CALIBRATE panel?',
        a: <>A two-step panel you can open any time from the nav — it never blocks the game, which starts playing the moment you land. Step one is a monitor check: a dark plate with a barely different dark patch nested inside; if you can just barely separate the two, your display holds shadow detail and the lab reads true for you. Step two offers the color vision assist toggle. Closing the panel returns you to the game exactly as you left it — a run in progress is never interrupted. It changes no score and stores only two flags on your own device.</>,
        aText: 'A two-step panel you can open any time from the nav — it never blocks the game, which starts playing the moment you land. Step one is a monitor check: a dark plate with a barely different dark patch nested inside; if you can just barely separate the two, your display holds shadow detail and the lab reads true for you. Step two offers the color vision assist toggle. Closing the panel returns you to the game exactly as you left it — a run in progress is never interrupted. It changes no score and stores only two flags on your own device.',
      },
      {
        q: 'What is the Color Vision Profile on my results?',
        a: <>After five proofs, the report card grades your eye from the mean CIEDE2000 ΔE: below ΔE 2 is PRESS-ROOM GRADE, below 5 is PROOFER, below 10 is APPRENTICE, otherwise TRAINEE. It&apos;s a shop-floor honorific, not a measurement — the page says so itself. Around ΔE 1 is commonly cited as the smallest difference a human eye can resolve under ideal conditions, and a typical screen observer averaging ΔE 2–5 already has a sharp eye; both are approximations, not lab constants. The profile is a vision grade; your score rating (Color Novice to Color Master) stays separate, and both appear on the report.</>,
        aText: 'After five proofs, the report card grades your eye from the mean CIEDE2000 ΔE: below ΔE 2 is PRESS-ROOM GRADE, below 5 is PROOFER, below 10 is APPRENTICE, otherwise TRAINEE. It\'s a shop-floor honorific, not a measurement — the page says so itself. Around ΔE 1 is commonly cited as the smallest difference a human eye can resolve under ideal conditions, and a typical screen observer averaging ΔE 2–5 already has a sharp eye; both are approximations, not lab constants. The profile is a vision grade; your score rating (Color Novice to Color Master) stays separate, and both appear on the report.',
      },
      {
        q: 'Why did I score low on a color that looked identical to me?',
        a: <>Three common causes: a small hue error in a low-saturation color, where both the eye and CIEDE2000 are unforgiving; a display filter (night mode, warm shift) changing what you saw versus the values you set; or genuinely fine discrimination that improves with practice. Check the per-round ΔE breakdown on your results screen to see where the points went.</>,
        aText: 'Three common causes: a small hue error in a low-saturation color, where both the eye and CIEDE2000 are unforgiving; a display filter (night mode, warm shift) changing what you saw versus the values you set; or genuinely fine discrimination that improves with practice. Check the per-round ΔE breakdown on your results screen to see where the points went.',
      },
      {
        q: 'Does my monitor affect my score?',
        a: <>Indirectly. The scoring math runs on RGB values, so the display never enters the formula — but your eye is the sensor that sets those values, and it reads them through your screen and your room lighting. Steady brightness, no color-shifting filters, and consistent ambient light make your rounds more consistent. Pressrooms standardize viewing conditions for the same reason.</>,
        aText: 'Indirectly. The scoring math runs on RGB values, so the display never enters the formula — but your eye is the sensor that sets those values, and it reads them through your screen and your room lighting. Steady brightness, no color-shifting filters, and consistent ambient light make your rounds more consistent. Pressrooms standardize viewing conditions for the same reason.',
      },
    ],
  },
  {
    section: 'Data and Privacy',
    items: [
      {
        q: 'What data does ToonTone collect?',
        a: <>No accounts, no tracking cookies, no advertising identifiers. Your streak and highest score are stored only in your browser&apos;s local storage on your device and never leave it. This site runs no analytics scripts at all — there is no traffic counter watching you, not even a cookieless one. Full details are in the <Link href="/privacy" className="text-accent hover:underline">privacy policy</Link>, and the ground rules are in the <Link href="/terms" className="text-accent hover:underline">terms of service</Link>.</>,
        aText: 'No accounts, no tracking cookies, no advertising identifiers. Your streak and highest score are stored only in your browser\'s local storage on your device and never leave it. This site runs no analytics scripts at all — there is no traffic counter watching you, not even a cookieless one. Full details are in the privacy policy, and the ground rules are in the terms of service.',
      },
      {
        q: 'Where do the target colors come from?',
        a: <>In the Daily Challenge, from a deterministic pseudo-random generator seeded with the UTC date — the same math produces the same five colors on every device, every time that day. In Practice mode, from your own browser&apos;s random number generator. No color is fetched from a server, and no gameplay data leaves your device.</>,
        aText: 'In the Daily Challenge, from a deterministic pseudo-random generator seeded with the UTC date — the same math produces the same five colors on every device, every time that day. In Practice mode, from your own browser\'s random number generator. No color is fetched from a server, and no gameplay data leaves your device.',
      },
    ],
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.flatMap(s => s.items.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.aText },
  }))),
};

export default function FaqPage() {
  return (
    <PageShell>
      <JsonLd data={jsonLd} />
      <H1>FAQ</H1>

      <P>Straight answers from the proofing table. If your question isn&apos;t covered, the <Link href="/how-to-play" className="text-accent hover:underline">how to play guide</Link> and the <Link href="/what-is-delta-e" className="text-accent hover:underline">Delta E explainer</Link> go deeper on rules and scoring.</P>

      {FAQ_ITEMS.map((section) => (
        <section key={section.section}>
          <H2>{section.section}</H2>
          {section.items.map((item) => (
            <QA key={item.q} q={item.q}>{item.a}</QA>
          ))}
        </section>
      ))}

      <CtaBlock
        primary={{ label: 'Play ToonTone', href: '/' }}
        secondary={{ label: "Take Today's Five-Color Proof", href: '/' }}
      />
    </PageShell>
  );
}
