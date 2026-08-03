import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell, H1, H2, H3, P, QA, DataTable, CtaBlock, JsonLd } from '../components/ContentPage';

export const metadata: Metadata = {
  title: 'How to Play ToonTone: Rules, HSB Tips & Scoring',
  description: 'Five rounds, one target color, three slider modes. Learn the rules, HSB technique and ΔE scoring behind ToonTone — then take today\'s proof.',
  alternates: { canonical: 'https://toontonegame.org/how-to-play' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'HowTo',
      name: 'How to Play ToonTone',
      step: [
        { '@type': 'HowToStep', name: 'Open the lab and pick a mode', text: 'The home page starts playing immediately: today\'s Daily Challenge begins automatically — the same five target colors for every player on the planet. A monitor check and the color vision assist toggle live under the CALIBRATE button in the nav, any time you want them. If you want reps without stakes, switch to Practice mode for endless random proofs — 5 rounds per run. Both modes use identical rules and scoring.' },
        { '@type': 'HowToStep', name: 'Read the proof', text: 'Each round shows a single flat target swatch. No gradients, no texture, no hints — just one color your eye has to hold while your hands work the sliders. Take a second to name what you see before touching anything.' },
        { '@type': 'HowToStep', name: 'Dial in your match', text: 'You get three slider channels. The default mode is HSB (hue, saturation, brightness); you can switch to RGB or CMYK at any time — the color you\'re building stays put, only the controls change.' },
        { '@type': 'HowToStep', name: 'Submit your proof', text: 'Hit submit when you think it would pass on press. The lab computes the CIEDE2000 color difference (ΔE) between your swatch and the target — no appeals, no rounding in your favor.' },
        { '@type': 'HowToStep', name: 'Read your QC report', text: 'After five rounds you get a total score out of 500, a per-round ΔE breakdown, and a press rating from Color Novice to Color Master, plus a Color Vision Profile graded from your mean ΔE. Finish a Daily Challenge and your streak grows by one day.' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Is it spelled toontone, toon tone, or toon tones?', acceptedAnswer: { '@type': 'Answer', text: 'All three spellings refer to the same genre of color matching game that spread from streaming clips. This site\'s brand is ToonTone Proofing Lab, at toontonegame.org. However you typed it, you found the proofing room.' } },
        { '@type': 'Question', name: 'How many rounds are in one game?', acceptedAnswer: { '@type': 'Answer', text: 'Five, always. Each round is scored out of 100, so a full game totals 500 points. The five-round format keeps a session under three minutes — short enough for a daily habit, long enough that one lucky round won\'t carry you.' } },
        { '@type': 'Question', name: 'What\'s the difference between Daily Challenge and Practice?', acceptedAnswer: { '@type': 'Answer', text: 'The Daily Challenge gives every player worldwide the same five colors, seeded from the UTC date, and counts toward your streak. Practice mode deals endless random colors — 5 rounds per run — with identical scoring. Technique is built in Practice; reputations are made in the Daily.' } },
        { '@type': 'Question', name: 'Where is my streak stored?', acceptedAnswer: { '@type': 'Answer', text: 'On your device, in your browser\'s local storage. Nothing is uploaded, and there is no account to sync — clearing browser data or switching devices resets it.' } },
        { '@type': 'Question', name: 'Do I need an account or an app?', acceptedAnswer: { '@type': 'Answer', text: 'No. ToonTone runs entirely in the browser. There is no sign-up, no download, and nothing to install.' } },
        { '@type': 'Question', name: 'Does ToonTone work on mobile?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. The proofing table is designed for phones as well as desktops — sliders are thumb-reachable and the full five-round loop works on a small screen.' } },
        { '@type': 'Question', name: 'Why did a color that looked identical still cost me points?', acceptedAnswer: { '@type': 'Answer', text: 'Two usual suspects: a hue slightly off in a low-saturation color (the eye — and CIEDE2000 — is unforgiving there), or display conditions like a warm night filter shifting what you saw relative to the values you set.' } },
      ],
    },
  ],
};

export default function HowToPlayPage() {
  return (
    <PageShell>
      <JsonLd data={jsonLd} />
      <H1>How to Play ToonTone</H1>

      <P>ToonTone Proofing Lab is a color matching game played like a press check. Each round deals you one target swatch — the proof — and your job is to reproduce it with sliders before you sign it off. Five rounds per game, one score per round, and a quality control report at the end. No account, no download: open the page and you are at the proofing table.</P>

      <H2>The 5 Steps</H2>

      <H3>1. Open the lab and pick a mode</H3>
      <P>The home page starts playing immediately: today&apos;s <strong>Daily Challenge</strong> begins automatically — the same five target colors for every player on the planet. A monitor check and the <strong>color vision assist</strong> toggle live under the <strong>CALIBRATE</strong> button in the nav — open them any time; closing the panel never interrupts the game in progress. If you want reps without stakes, switch to <strong>Practice mode</strong> for endless random proofs — 5 rounds per run. Both modes use identical rules and scoring.</P>

      <H3>2. Read the proof</H3>
      <P>Each round shows a single flat target swatch. No gradients, no texture, no hints — just one color your eye has to hold while your hands work the sliders. Take a second to name what you see before touching anything: &quot;a dusty teal, fairly dark&quot; is a working hypothesis you can test.</P>

      <H3>3. Dial in your match</H3>
      <P>You get three slider channels. The default mode is <strong>HSB</strong> (hue, saturation, brightness); you can switch to <strong>RGB</strong> or <strong>CMYK</strong> at any time — the color you&apos;re building stays put, only the controls change. Drag a channel, watch your swatch, compare it against the proof. Repeat until you can&apos;t see the join.</P>

      <H3>4. Submit your proof</H3>
      <P>Hit submit when you think it would pass on press. The lab computes the CIEDE2000 color difference (ΔE) between your swatch and the target — no appeals, no rounding in your favor.</P>

      <H3>5. Read your QC report</H3>
      <P>After five rounds you get a total score out of 500, a per-round ΔE breakdown, and a press rating from <strong>Color Novice</strong> to <strong>Color Master</strong>. The report also prints a <strong>Color Vision Profile</strong> — a vision grade graded from your mean ΔE (PRESS-ROOM GRADE under 2, PROOFER under 5, APPRENTICE under 10, otherwise TRAINEE) with a per-round ΔE strip; it&apos;s a shop-floor honorific, not a vision test. Finish a Daily Challenge and your streak grows by one day. Share the report card if you dare.</P>

      <H2>HSB Tuning: Hue First, Then Saturation, Then Brightness</H2>
      <P>Every how-to-play guide for this genre tells you to set hue first. Few explain why, so here is the lab version.</P>
      <P><strong>Hue is categorical; saturation and brightness are relative.</strong> Saturation and brightness only mean something once a hue family is fixed — &quot;60% saturation of the wrong hue&quot; is still the wrong color. Get the hue slider into the right neighborhood first (±10° is close enough to refine), then use saturation to control how far the color sits from gray, then brightness to place it on the light–dark axis. Working in that order means each slider answers one perceptual question instead of three at once.</P>
      <P><strong>Why pastels are harder than they look.</strong> Low-saturation colors compress your margin for error. In a vivid red, being 8° off in hue is a modest shift; in a pale, washed-out tint, the eye is far more sensitive to small hue and chroma moves — and CIEDE2000 knows it. The formula&apos;s weighting terms make tiny differences count more in low-chroma regions, exactly where human vision is most discriminating. So when the proof looks like &quot;barely pink paper,&quot; slow down: pastel rounds punish sloppy hue work harder than saturated ones.</P>
      <P><strong>Your screen is part of the test.</strong> The arithmetic runs on RGB values, but your eye judges through your display and your room. Keep screen brightness steady across rounds, switch off night-shift and warm color filters while you play, and avoid judging a proof next to a sunlit window. A display that drifts warmer over the evening won&apos;t change the numbers — it will change your readings of them.</P>

      <H2>Daily Challenge vs. Practice Mode</H2>
      <DataTable
        head={['', 'Daily Challenge', 'Practice']}
        rows={[
          ['Target colors', 'Same 5 for everyone, seeded from the UTC date', 'Random every round'],
          ['Resets', '00:00 UTC, with an on-page countdown', 'Never — play as long as you like'],
          ['Streak', '+1 per completed day, stored on your device', 'Not tracked'],
          ['Purpose', 'The daily shared benchmark', 'Repetitions and technique work'],
        ]}
      />
      <P>The Daily seed is deterministic: the date goes in, five colors come out, and no server is involved. Two devices on the same day see the same proofs — which is what makes comparing scores with a colleague meaningful.</P>

      <H2>How Your Score Is Calculated (Short Version)</H2>
      <P>Each round, the lab measures the ΔE (CIEDE2000) between your swatch and the target, then maps it to points: <strong>score = 100 − ΔE</strong>, clamped to 0–100 and rounded. Five rounds make 500 possible points; your average sets the rating: 60+ Color Apprentice, 75+ Color Pro, 90+ Color Master. For the full story on what ΔE is and why CIEDE2000 is the fair referee, read <Link href="/what-is-delta-e" className="text-accent hover:underline">what Delta E means and how the ΔE scoring works</Link>. New to the three sliders themselves? The <Link href="/hsb-color-guide" className="text-accent hover:underline">HSB color model guide</Link> is the primer. Other questions live in the <Link href="/faq" className="text-accent hover:underline">ToonTone FAQ</Link>.</P>

      <H2>FAQ</H2>
      <QA q="Is it spelled toontone, toon tone, or toon tones?">
        All three spellings refer to the same genre of color matching game that spread from streaming clips. This site&apos;s brand is <strong>ToonTone Proofing Lab</strong>, at toontonegame.org. However you typed it, you found the proofing room.
      </QA>
      <QA q="How many rounds are in one game?">
        Five, always. Each round is scored out of 100, so a full game totals 500 points. The five-round format keeps a session under three minutes — short enough for a daily habit, long enough that one lucky round won&apos;t carry you.
      </QA>
      <QA q="What's the difference between Daily Challenge and Practice?">
        The Daily Challenge gives every player worldwide the same five colors, seeded from the UTC date, and counts toward your streak. Practice mode deals endless random colors — 5 rounds per run — with identical scoring. Technique is built in Practice; reputations are made in the Daily.
      </QA>
      <QA q="Where is my streak stored?">
        On your device, in your browser&apos;s local storage. Nothing is uploaded, and there is no account to sync — clearing browser data or switching devices resets it.
      </QA>
      <QA q="Do I need an account or an app?">
        No. ToonTone runs entirely in the browser. There is no sign-up, no download, and nothing to install.
      </QA>
      <QA q="Does ToonTone work on mobile?">
        Yes. The proofing table is designed for phones as well as desktops — sliders are thumb-reachable and the full five-round loop works on a small screen.
      </QA>
      <QA q="Why did a color that looked identical still cost me points?">
        Two usual suspects: a hue slightly off in a low-saturation color (the eye — and CIEDE2000 — is unforgiving there), or display conditions like a warm night filter shifting what you saw relative to the values you set.
      </QA>

      <CtaBlock
        primary={{ label: "Start Today's Proof", href: '/' }}
        secondary={{ label: 'Drill Random Proofs in Practice', href: '/?mode=practice' }}
      />
    </PageShell>
  );
}
