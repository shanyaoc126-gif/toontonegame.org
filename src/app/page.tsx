import ColorGame from './components/ColorGame';
import { SiteFooter, PaperDecor, JsonLd } from './components/ContentPage';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'VideoGame',
      name: 'ToonTone Proofing Lab',
      alternateName: 'ToonTone Challenge',
      url: 'https://toontonegame.org/',
      applicationCategory: 'GameApplication',
      gamePlatform: 'Web Browser',
      operatingSystem: 'Any (web browser)',
      browserRequirements: 'Requires JavaScript',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description:
        'Free color matching game: match the target color with HSB, RGB, or CMYK sliders. Scored by CIEDE2000 color difference — the closer your eye, the higher your score.',
    },
    {
      '@type': 'HowTo',
      name: 'How to play ToonTone Proofing Lab',
      step: [
        {
          '@type': 'HowToStep',
          name: 'Open the lab',
          text: 'The home page starts playing immediately: today\'s Daily Challenge begins automatically — the same five target colors for every player, seeded from the UTC date. Each game has 5 rounds. A monitor check and color vision assist live under the CALIBRATE button in the nav, any time you want them.',
        },
        {
          '@type': 'HowToStep',
          name: 'Pick a color mode',
          text: 'Choose HSB, RGB, or CMYK sliders — whichever color model you think in. Practice mode offers endless random proofs — 5 rounds per run.',
        },
        {
          '@type': 'HowToStep',
          name: 'Match the target',
          text: 'Adjust the sliders until your color looks identical to the target color.',
        },
        {
          '@type': 'HowToStep',
          name: 'Submit and score',
          text: 'Submit your guess. The CIEDE2000 color difference (ΔE) between the two colors sets your score from 0 to 100.',
        },
        {
          '@type': 'HowToStep',
          name: 'Finish all 5 rounds',
          text: 'After 5 rounds you get a total score, an average, and a rating from Color Novice to Color Master, plus a Color Vision Profile graded from your mean ΔE and a shareable report card.',
        },
      ],
    },
  ],
};

export default function Home() {
  return (
    <main className="relative min-h-screen bg-canvas">
      <JsonLd data={jsonLd} />
      <PaperDecor />
      <div className="relative z-10 flex flex-col min-h-screen">
        <ColorGame />
        <SiteFooter />
      </div>
    </main>
  );
}
