import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — ToonTone Challenge',
  description: 'Terms of service for ToonTone Challenge, a free browser-based color matching game.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <div className="bg-white rounded-xl p-6 shadow-md space-y-4 text-sm text-gray-700 leading-relaxed">
          <p><strong>Last updated:</strong> July 2026</p>

          <h2 className="text-lg font-bold pt-2">The service</h2>
          <p>
            ToonTone Challenge is a free, browser-based color matching game provided
            &quot;as is&quot;, without warranties of any kind. It runs entirely in your
            browser and requires no account.
          </p>

          <h2 className="text-lg font-bold pt-2">Acceptable use</h2>
          <p>
            You may play the game and share your results freely. Do not attempt to
            disrupt the site, abuse the hosting infrastructure, or misrepresent the
            game as your own product.
          </p>

          <h2 className="text-lg font-bold pt-2">Intellectual property</h2>
          <p>
            ToonTone Challenge is an independent project and is not affiliated with,
            endorsed by, or connected to toontone.com or any similar service.
          </p>

          <h2 className="text-lg font-bold pt-2">Changes</h2>
          <p>
            These terms may be updated at any time; the current version is always
            available on this page.
          </p>

          <h2 className="text-lg font-bold pt-2">Contact</h2>
          <p>
            Questions about these terms: <span className="font-mono">contact@toontonegame.org</span>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8 space-x-4">
          <Link href="/" className="hover:text-gray-600 underline">← Back to game</Link>
          <Link href="/privacy" className="hover:text-gray-600 underline">Privacy Policy</Link>
        </p>
      </div>
    </main>
  );
}
