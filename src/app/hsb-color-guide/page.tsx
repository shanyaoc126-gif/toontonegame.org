import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell, H1, H2, P, UL, QA, CtaBlock, JsonLd } from '../components/ContentPage';

export const metadata: Metadata = {
  title: 'HSB Color Model Explained: Hue, Saturation, Brightness',
  description: 'Hue, saturation, brightness: how the HSB color model works, how it relates to RGB and CMYK, and why it matches how designers actually think about color.',
  alternates: { canonical: 'https://toontonegame.org/hsb-color-guide' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'HSB Color Model Explained',
  description: 'Hue, saturation, brightness: how the HSB color model works, how it relates to RGB and CMYK, and why it matches how designers actually think about color.',
  mainEntityOfPage: 'https://toontonegame.org/hsb-color-guide',
  author: { '@type': 'Organization', name: 'ToonTone Proofing Lab', url: 'https://toontonegame.org/' },
};

export default function HsbColorGuidePage() {
  return (
    <PageShell>
      <JsonLd data={jsonLd} />
      <H1>HSB Color Model Explained</H1>

      <P>HSB is the color model that asks the three questions a person actually asks about a color: <em>what color is it, how strong is it, and how light is it?</em> Hue, saturation, brightness. It is not how screens make color and not how presses lay down ink — it is how minds organize color, which is why nearly every design tool puts HSB sliders within reach and why this lab uses them as its default controls.</P>

      <H2>What the Three Channels Mean</H2>
      <P><strong>Hue (H)</strong> is the color family itself, laid out as an angle on the color wheel: 0° is red, 120° is green, 240° is blue, and 360° wraps back to red. Every named color — coral, teal, chartreuse — is an address on this circle. Hue answers &quot;what color is it?&quot;</P>
      <P><strong>Saturation (S)</strong> runs from 0 to 100 and measures distance from gray. At 0 the color is fully washed out — a pure neutral with no hue identity at all. At 100 the hue is as vivid as the model allows. Saturation answers &quot;how strong is it?&quot;</P>
      <P><strong>Brightness (B)</strong> — the B is why some tools call this model HSV, for &quot;value&quot; — also runs 0 to 100 and measures light. At 0 everything is black regardless of the other channels; at 100 the color shows at full intensity. Brightness answers &quot;how light is it?&quot;</P>
      <P>Together, the three channels describe any RGB color as (angle, strength, light) instead of (red dose, green dose, blue dose).</P>

      <H2>HSB vs. HSV vs. HSL</H2>
      <P>HSB and <strong>HSV</strong> are two names for the same model — brightness and value are interchangeable here. <strong>HSL</strong> is a different animal: it replaces brightness with <em>lightness</em>, where 50% is the &quot;pure&quot; hue, 0% is black, and 100% is white. The practical difference: in HSB, a color at B=100 with S=100 is the vivid pure hue, and white lives at S=0, B=100. In HSL, the pure hue sits at L=50 and white is at the top of the scale. Design tools split on this — Photoshop&apos;s picker and this game use HSB/HSV; CSS offers HSL. The hue angle means the same thing in both.</P>

      <H2>How HSB Relates to RGB and CMYK</H2>
      <P>RGB and CMYK are <em>machine</em> models; HSB is a <em>description</em> model built on top of them.</P>
      <P><strong>RGB</strong> mixes light: three channels, each 0–255, added together. It maps directly onto what a display emits, which makes it unambiguous for screens but awkward for thinking — &quot;reduce the green a bit and maybe the blue?&quot; is not how anyone describes wanting a warmer orange.</P>
      <P><strong>CMYK</strong> mixes ink: cyan, magenta, yellow, and black percentages subtracted from white paper. It&apos;s the pressroom&apos;s native language, governed by ink behavior and paper, and it covers a smaller gamut than RGB — some screen colors simply cannot be printed.</P>
      <P><strong>HSB sits above both.</strong> Any HSB triple converts mathematically to exactly one RGB triple, and that RGB in turn converts to a CMYK recipe. That&apos;s why this game can let you edit one color through three different control panels — HSB, RGB, or CMYK sliders, all moving the same underlying swatch. When you switch modes mid-round, the color doesn&apos;t change; your levers do. Print buyers tend to reach for the CMYK panel out of professional reflex; most everyone else thinks fastest in HSB.</P>

      <H2>Why HSB Matches How Your Eye Thinks</H2>
      <P>Ask someone to describe a color and they will say &quot;a muted dark teal&quot; — hue, strength, light, in that order. Nobody says &quot;about 40 parts red, 110 green, 105 blue.&quot; HSB formalizes that natural grammar:</P>
      <UL>
        <li><strong>One knob per perceptual question.</strong> In RGB, darkening a color means dragging three channels down in ratio; in HSB it&apos;s one slider. Adjusting strength without shifting the family is one slider. Each control has a single, legible effect.</li>
        <li><strong>Hue behaves like the circle we imagine.</strong> Color relationships designers actually use — complements at 180°, analogues within ±30° — are arithmetic on the hue angle. In RGB those relationships are buried in three-axis geometry.</li>
        <li><strong>Gray is a point, not a balancing act.</strong> In RGB, neutral gray requires all three channels to agree exactly. In HSB, gray is simply S=0. This is why desaturating to check a composition&apos;s values is a one-click move in HSB-based tools.</li>
      </UL>
      <P>There is a catch worth respecting: HSB&apos;s axes are perceptually convenient but not perceptually uniform. A 10% brightness step at the dark end looks larger than one at the bright end, and &quot;50% saturation&quot; feels different on yellow than on blue. HSB is a good map of how we <em>talk</em> about color, not a perfect map of how we <em>see</em> it — that job belongs to CIELAB and Delta E, which is why the game scores you with CIEDE2000 and not with slider distance.</P>

      <H2>HSB in a Design Workflow</H2>
      <UL>
        <li><strong>Picking and refining.</strong> The HSB cube is the default picker in Photoshop, Illustrator, and Procreate, and Figma exposes HSB alongside HSL and RGB. Most palette exploration happens here because small, predictable nudges are possible.</li>
        <li><strong>Building palettes.</strong> Complementary, analogous, and triadic schemes are hue-angle arithmetic; tints and shades are brightness and saturation moves on a fixed hue. HSB makes the rules mechanical.</li>
        <li><strong>Value checking.</strong> Dropping saturation to 0 previews a layout in grayscale — a standard test for whether a composition holds up on lightness structure alone.</li>
        <li><strong>Print handoff.</strong> Screen work happens in RGB-described spaces, but the final file must survive CMYK. Knowing that your HSB-chosen vivid cyan may have no printed equivalent is the kind of lesson this game teaches by repetition.</li>
      </UL>

      <H2>Practice HSB in the Lab</H2>
      <P>Reading about sliders builds vocabulary; using them against a target builds judgement. In ToonTone Proofing Lab you get five proofs per game, three slider modes to match them with, and a CIEDE2000 score that tells you exactly how close &quot;looks right to me&quot; actually was. <Link href="/" className="text-accent hover:underline">Practice with sliders</Link> on today&apos;s proof, learn <Link href="/how-to-play" className="text-accent hover:underline">how to play ToonTone</Link> if you&apos;re new, or read <Link href="/what-is-delta-e" className="text-accent hover:underline">what Delta E measures</Link> to understand the scoring. Questions? The <Link href="/faq" className="text-accent hover:underline">FAQ</Link> has answers.</P>

      <H2>FAQ</H2>
      <QA q="Is HSB the same as HSV?">
        Yes — brightness and value are two names for the identical third channel. Both describe a color as hue angle, saturation from gray, and light from black. HSL is the genuinely different model, with lightness replacing brightness.
      </QA>
      <QA q="How do I convert HSB to RGB?">
        Mathematically, hue selects a sector of the color wheel, saturation scales the distance between the strongest and weakest RGB channel, and brightness scales the overall level. In practice you never do this by hand — every design tool and this game&apos;s own code perform the conversion instantly. What matters is the intuition: HSB is a re-description of RGB, not a separate color universe.
      </QA>
      <QA q="Why doesn't 50% brightness look half as bright?">
        Because HSB&apos;s brightness axis is linear in light output while human vision is roughly logarithmic — we compress bright differences and expand dark ones. A B=50 color emits half the maximum light but looks considerably brighter than &quot;half.&quot; Perceptually even scales exist (CIELAB&apos;s L* is one), which is exactly why the game scores with CIEDE2000 rather than HSB distance.
      </QA>
      <QA q="Is HSB used in printing?">
        Not directly. Presses run on CMYK ink percentages, and prepress software converts everything into that language before plating. HSB is a working space for choosing and adjusting colors on screen; CMYK is the delivery space. This game includes a CMYK slider mode so print people can practice in their native units.
      </QA>
      <QA q="What's the practical difference between saturation and brightness?">
        Saturation controls how far a color sits from gray at a given lightness; brightness controls how much light it has overall. Raise saturation and the color gets more vivid; raise brightness and it gets lighter and eventually washes toward white. Mixing them up is the most common beginner mistake — and the first thing matching games train out of you.
      </QA>

      <CtaBlock
        primary={{ label: 'Practice with Sliders', href: '/' }}
        secondary={{ label: "Match Today's Five Proofs", href: '/' }}
      />
    </PageShell>
  );
}
