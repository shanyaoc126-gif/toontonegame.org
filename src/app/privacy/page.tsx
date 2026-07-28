import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — ToonTone Challenge',
  description: 'Privacy policy for ToonTone Challenge, a free browser-based color matching game.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-canvas py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-[20px] font-bold uppercase tracking-tight text-ink mb-6">Privacy Policy</h1>
        <div className="bg-surface border border-hairline rounded-[8px] p-6 space-y-4 text-[15px] text-ink leading-relaxed">
          <p><strong>Last updated:</strong> July 2026</p>

          <h2 className="text-[13px] font-bold uppercase tracking-wide text-ink pt-2">No accounts, no personal data</h2>
          <p>
            ToonTone Challenge is a fully client-side game. There is no sign-up, no login,
            and no account system. We do not collect, store, or transmit any personal
            information. Your in-progress game state (rounds and scores) lives only in your
            browser memory and disappears when you close or refresh the page; only your
            streak and best score persist locally (see Local storage below).
          </p>

          <h2 className="text-[13px] font-bold uppercase tracking-wide text-ink pt-2">No cookies, no tracking</h2>
          <p>
            This site does not set cookies, does not use analytics or advertising trackers,
            and does not fingerprint your device.
          </p>

          <h2 className="text-[13px] font-bold uppercase tracking-wide text-ink pt-2">Local storage</h2>
          <p>
            Your Daily Challenge streak and personal best score are stored only in your
            browser&apos;s local storage, on your own device. This data is never uploaded,
            never synced, and never leaves your browser — clearing your browser data resets it.
          </p>

          <h2 className="text-[13px] font-bold uppercase tracking-wide text-ink pt-2">Third-party services</h2>
          <p>
            The site is hosted on GitHub Pages and may be served through the Cloudflare CDN.
            These providers may process standard technical data (such as your IP address)
            as part of delivering web pages, under their own privacy policies.
          </p>

          <h2 className="text-[13px] font-bold uppercase tracking-wide text-ink pt-2">Contact</h2>
          <p>
            Questions about this policy: <span className="font-mono text-accent">contact@toontonegame.org</span>
          </p>
        </div>

        <p className="text-center font-mono text-[12px] uppercase tracking-wide text-secondary mt-8 space-x-4">
          <Link href="/" className="text-accent hover:underline">← Back to game</Link>
          <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link>
        </p>
      </div>
    </main>
  );
}
