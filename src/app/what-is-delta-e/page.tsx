import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell, H1, H2, P, UL, QA, DataTable, CtaBlock, JsonLd } from '../components/ContentPage';

export const metadata: Metadata = {
  title: 'What Is Delta E (ΔE)? Color Difference Explained',
  description: 'Delta E measures how different two colors look. Learn what ΔE values mean, why CIEDE2000 judges matches fairly, and how ToonTone turns ΔE into your score.',
  alternates: { canonical: 'https://toontonegame.org/what-is-delta-e' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'What Is Delta E (ΔE)?',
      description: 'Delta E measures how different two colors look. Learn what ΔE values mean, why CIEDE2000 judges matches fairly, and how ToonTone turns ΔE into your score.',
      mainEntityOfPage: 'https://toontonegame.org/what-is-delta-e',
      author: { '@type': 'Organization', name: 'ToonTone Proofing Lab', url: 'https://toontonegame.org/' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'What is a good Delta E value?', acceptedAnswer: { '@type': 'Answer', text: 'In print proofing, ΔE00 under 1 is treated as a match, under 2 as commercially acceptable for most brand work. In this game, an average under 10 across five rounds (a Color Master rating) means your eye is doing pressroom-grade work. Anything under 25 average is a respectable shift at the proofing table.' } },
        { '@type': 'Question', name: 'Can Delta E be zero?', acceptedAnswer: { '@type': 'Answer', text: 'Yes — it means the two colors are numerically identical in CIELAB. In the game it happens when you land on the exact target RGB values. It is rare and worth a small celebration: ΔE 0 with sliders is threading a needle.' } },
        { '@type': 'Question', name: 'What\'s the difference between ΔE76, ΔE94, and CIEDE2000?', acceptedAnswer: { '@type': 'Answer', text: 'All three measure distance in CIELAB-type spaces. ΔE76 is plain Euclidean distance. ΔE94 added weighting for chroma and lightness, tuned on graphic-arts data. CIEDE2000 refined that with better lightness, chroma, and hue weightings plus a rotation term for blue hues, and it agrees with human judgement across the widest range of colors. ToonTone uses CIEDE2000.' } },
        { '@type': 'Question', name: 'Does Delta E depend on lighting?', acceptedAnswer: { '@type': 'Answer', text: 'The CIELAB coordinates behind ΔE are computed relative to a reference illuminant — this game uses D65, standard daylight. Real-world viewing still matters: a print checked under a warm desk lamp won\'t match a ΔE report computed for daylight. That\'s why pressrooms use standardized viewing booths.' } },
        { '@type': 'Question', name: 'Why does the same ΔE feel bigger on some colors than others?', acceptedAnswer: { '@type': 'Answer', text: 'Because no formula is perfectly uniform — CIEDE2000 is the closest industry standard, but human vision still has local quirks. Treat ΔE as a very good ruler, not an oracle: it tells you how much difference there is, and your eye confirms whether anyone will care.' } },
      ],
    },
  ],
};

export default function WhatIsDeltaEPage() {
  return (
    <PageShell>
      <JsonLd data={jsonLd} />
      <H1>What Is Delta E (ΔE)?</H1>

      <P>Delta E is the number that answers the question every printer, designer, and paint matcher eventually asks: <em>how different are these two colors, really?</em> Not &quot;are they different&quot; — your eye can answer that some of the time — but by how much, on a scale where a 2 is a 2 whether you&apos;re comparing two navy inks or two skin tones. ΔE is the unit of that scale: the measured distance between two colors in a space designed to mirror human vision.</P>

      <H2>CIELAB: The Map Delta E Measures On</H2>
      <P>To measure a distance you need a map, and the map ΔE uses is <strong>CIELAB</strong> (also written L*a*b*), published by the CIE in 1976. It describes any color with three coordinates:</P>
      <UL>
        <li><strong>L*</strong> — lightness, from 0 (black) to 100 (white)</li>
        <li><strong>a*</strong> — the green–red axis: negative values lean green, positive lean red</li>
        <li><strong>b*</strong> — the blue–yellow axis: negative values lean blue, positive lean yellow</li>
      </UL>
      <P>The point of CIELAB is <strong>perceptual uniformity</strong>: it was built so that one unit of distance anywhere on the map should look like roughly the same amount of difference to a human observer. That&apos;s what RGB can&apos;t give you — in RGB, a jump of 10 units might be invisible in one region and glaring in another, because RGB describes how much light a screen emits, not how a person sees. Converting a color to CIELAB is like converting raw pixels into the eye&apos;s own bookkeeping. Once two colors sit on this map, the difference between them becomes geometry.</P>

      <H2>Why CIEDE2000 Is Fairer Than ΔE76</H2>
      <P>The original formula, <strong>ΔE76</strong>, is just straight-line Euclidean distance in CIELAB: simple, fast, and honestly not bad. The problem is that CIELAB turned out to be only <em>approximately</em> uniform. Careful testing showed systematic mismatches:</P>
      <UL>
        <li><strong>The eye tolerates bigger chroma differences in vivid colors.</strong> Two saturated reds can be further apart than two grays before anyone notices. ΔE76 treats both gaps identically; CIEDE2000 adds a chroma weighting term that forgives distance in high-chroma regions and tightens tolerance near neutrals.</li>
        <li><strong>The eye is stricter about lightness in mid-tones.</strong> CIEDE2000&apos;s lightness weighting reflects that sensitivity curve.</li>
        <li><strong>Blues misbehave.</strong> Around the blue region, hue differences interact with chroma in a way a plain distance can&apos;t capture, so CIEDE2000 adds a rotation term (R<sub>T</sub>) that twists the calculation there.</li>
      </UL>
      <P>CIEDE2000 (ΔE00) keeps the same three-part skeleton — lightness, chroma, hue — but wraps each in a weighting function derived from real perceptual experiments. The result: its numbers track trained human judgement far more consistently. When a proofreader and a press operator disagree about whether a job matches, ΔE00 is the arbiter the industry reaches for. It&apos;s what this lab uses, with the standard reference conditions (D65 illuminant, k<sub>L</sub> = k<sub>C</sub> = k<sub>H</sub> = 1).</P>

      <H2>Delta E Values in Practice</H2>
      <DataTable
        head={['ΔE00', 'What it means']}
        rows={[
          ['< 1', 'Not perceptible — two proofs read as identical'],
          ['1–2', 'Visible only to a trained eye, usually side by side'],
          ['2–10', 'A clear, nameable difference at a glance'],
          ['> 10', 'Different colors, full stop'],
        ]}
      />
      <P>Context shifts the stakes. A packaging printer may hold brand colors to ΔE &lt; 2 across a run; a textile buyer might accept 3; a billboard nobody compares to a reference can drift further. But the scale itself is stable: a ΔE of 1.5 means the same class of &quot;barely there&quot; in any shop.</P>

      <H2>How ToonTone Scores Your Proofs</H2>
      <P>Here is the exact math this game runs, because a lab that won&apos;t show its formula shouldn&apos;t be trusted:</P>
      <UL>
        <li>Your swatch and the target swatch are converted from RGB to CIELAB (D65 reference white).</li>
        <li>The full CIEDE2000 formula computes ΔE between them — weighting terms, blue-region rotation, and all. No shortcuts, no ΔE76.</li>
        <li><strong>score = 100 − ΔE</strong>, clamped to the 0–100 range and rounded to a whole number. A dead-on match (ΔE under 0.5 after rounding) scores 100; anything ΔE ≥ 100 scores 0, though such misses are rare outside of submitting the wrong hue entirely.</li>
        <li>Five rounds make a game: 500 possible points. Your average sets the press rating — 60+ <strong>Color Apprentice</strong>, 75+ <strong>Color Pro</strong>, 90+ <strong>Color Master</strong>.</li>
      </UL>
      <P>Two consequences worth knowing before you blame the referee. First, because CIEDE2000 tightens tolerances in low-chroma regions, pastel targets punish small hue errors more than saturated targets do — the formula is mirroring your own visual system. Second, the scoring is purely numerical: your display, room light, and fatigue don&apos;t enter the calculation. They only affect what your eye reported. Ready to be measured? <Link href="/" className="text-accent hover:underline">Try the ΔE game</Link> and see your own numbers, or learn <Link href="/how-to-play" className="text-accent hover:underline">how to play ToonTone</Link> step by step. The sliders themselves are covered in the <Link href="/hsb-color-guide" className="text-accent hover:underline">HSB color model guide</Link>, and everything else is in the <Link href="/faq" className="text-accent hover:underline">FAQ</Link>.</P>

      <H2>FAQ</H2>
      <QA q="What is a good Delta E value?">
        In print proofing, ΔE00 under 1 is treated as a match, under 2 as commercially acceptable for most brand work. In this game, an average under 10 across five rounds (a Color Master rating) means your eye is doing pressroom-grade work. Anything under 25 average is a respectable shift at the proofing table.
      </QA>
      <QA q="Can Delta E be zero?">
        Yes — it means the two colors are numerically identical in CIELAB. In the game it happens when you land on the exact target RGB values. It is rare and worth a small celebration: ΔE 0 with sliders is threading a needle.
      </QA>
      <QA q="What's the difference between ΔE76, ΔE94, and CIEDE2000?">
        All three measure distance in CIELAB-type spaces. ΔE76 is plain Euclidean distance. ΔE94 added weighting for chroma and lightness, tuned on graphic-arts data. CIEDE2000 refined that with better lightness, chroma, and hue weightings plus a rotation term for blue hues, and it agrees with human judgement across the widest range of colors. ToonTone uses CIEDE2000.
      </QA>
      <QA q="Does Delta E depend on lighting?">
        The CIELAB coordinates behind ΔE are computed relative to a reference illuminant — this game uses D65, standard daylight. Real-world viewing still matters: a print checked under a warm desk lamp won&apos;t match a ΔE report computed for daylight. That&apos;s why pressrooms use standardized viewing booths.
      </QA>
      <QA q="Why does the same ΔE feel bigger on some colors than others?">
        Because no formula is perfectly uniform — CIEDE2000 is the closest industry standard, but human vision still has local quirks. Treat ΔE as a very good ruler, not an oracle: it tells you how much difference there is, and your eye confirms whether anyone will care.
      </QA>

      <CtaBlock
        primary={{ label: 'Try the ΔE Game', href: '/' }}
        secondary={{ label: "Run Today's Five-Color Proof", href: '/' }}
      />
    </PageShell>
  );
}
