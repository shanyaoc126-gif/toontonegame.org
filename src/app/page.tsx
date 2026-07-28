import Link from 'next/link';
import ColorGame from './components/ColorGame';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'ToonTone Challenge',
      url: 'https://toontonegame.org/',
      applicationCategory: 'GameApplication',
      operatingSystem: 'Any (web browser)',
      browserRequirements: 'Requires JavaScript',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description:
        'Free color matching game: match the target color with HSB, RGB, or CMYK sliders. Scored by CIEDE2000 color difference.',
    },
    {
      '@type': 'HowTo',
      name: 'How to play ToonTone Challenge',
      step: [
        {
          '@type': 'HowToStep',
          name: 'Start the game',
          text: 'Press Start Game to get a random target color. Each game has 5 rounds.',
        },
        {
          '@type': 'HowToStep',
          name: 'Pick a color mode',
          text: 'Choose HSB, RGB, or CMYK sliders — whichever color model you think in.',
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
          text: 'After 5 rounds you get a total score, an average, and a rating from Color Novice to Color Master.',
        },
      ],
    },
  ],
};

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ColorGame />
      <footer className="max-w-5xl mx-auto px-4 mt-8 pt-4 border-t border-hairline font-mono text-[12px] uppercase tracking-wide text-secondary flex flex-wrap gap-x-6 gap-y-2 justify-center">
        <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
        <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link>
        <span>Not affiliated with toontone.com</span>
      </footer>
    </main>
  );
}
