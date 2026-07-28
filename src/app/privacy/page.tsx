import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — ToonTone Challenge',
  description: 'Privacy policy for ToonTone Challenge, a free browser-based color matching game.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="bg-white rounded-xl p-6 shadow-md space-y-4 text-sm text-gray-700 leading-relaxed">
          <p><strong>Last updated:</strong> July 2026</p>

          <h2 className="text-lg font-bold pt-2">No accounts, no personal data</h2>
          <p>
            ToonTone Challenge is a fully client-side game. There is no sign-up, no login,
            and no account system. We do not collect, store, or transmit any personal
            information. Your game state (rounds and scores) lives only in your browser
            memory and disappears when you close or refresh the page.
          </p>

          <h2 className="text-lg font-bold pt-2">No cookies, no tracking</h2>
          <p>
            This site does not set cookies, does not use analytics or advertising trackers,
            and does not fingerprint your device.
          </p>

          <h2 className="text-lg font-bold pt-2">Third-party services</h2>
          <p>
            The site is hosted on GitHub Pages and may be served through the Cloudflare CDN.
            These providers may process standard technical data (such as your IP address)
            as part of delivering web pages, under their own privacy policies.
          </p>

          <h2 className="text-lg font-bold pt-2">Contact</h2>
          <p>
            Questions about this policy: <span className="font-mono">contact@toontonegame.org</span>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8 space-x-4">
          <Link href="/" className="hover:text-gray-600 underline">← Back to game</Link>
          <Link href="/terms" className="hover:text-gray-600 underline">Terms of Service</Link>
        </p>
      </div>
    </main>
  );
}
