import Link from 'next/link';
import { ReactNode } from 'react';

// Shared chrome + prose primitives for the content pages.
// Same Proofing Lab language as the game: hairlines, mono data, accent links.

export function ContentHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-hairline">
      <div>
        <Link href="/" className="text-[20px] font-bold uppercase tracking-tight text-ink hover:opacity-80">
          ToonTone Proofing Lab
        </Link>
        <p className="font-mono text-[12px] uppercase tracking-wide text-secondary mt-1">
          Color QC · CIEDE2000 matching · 5 rounds
        </p>
      </div>
      <Link
        href="/"
        className="px-5 py-2 bg-ink text-surface font-bold uppercase tracking-wide text-[13px] rounded-[4px] hover:opacity-90 transition-opacity"
      >
        Play ToonTone
      </Link>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="max-w-5xl mx-auto px-4 mt-8 pt-4 border-t border-hairline font-mono text-[12px] uppercase tracking-wide text-secondary flex flex-wrap gap-x-6 gap-y-2 justify-center">
      <Link href="/how-to-play" className="text-accent hover:underline">How to Play</Link>
      <Link href="/what-is-delta-e" className="text-accent hover:underline">What is ΔE</Link>
      <Link href="/hsb-color-guide" className="text-accent hover:underline">HSB Guide</Link>
      <Link href="/faq" className="text-accent hover:underline">FAQ</Link>
      <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
      <Link href="/terms" className="text-accent hover:underline">Terms of Service</Link>
      <span>Not affiliated with toontone.com</span>
    </footer>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-canvas py-8">
      <div className="max-w-[760px] mx-auto px-4">
        <ContentHeader />
        <article className="mt-8">{children}</article>
      </div>
      <SiteFooter />
    </main>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return <h1 className="text-[20px] font-bold uppercase tracking-tight text-ink">{children}</h1>;
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[15px] font-bold uppercase tracking-wide text-ink mt-10 pt-6 border-t border-hairline">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="text-[15px] font-bold text-ink mt-6">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-[15px] leading-[1.75] text-ink">{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="mt-4 list-disc pl-5 space-y-2 text-[15px] leading-[1.75] text-ink">{children}</ul>;
}

export function QA({ q, children }: { q: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <p className="font-bold text-[15px] text-ink">{q}</p>
      <p className="mt-2 text-[15px] leading-[1.75] text-ink">{children}</p>
    </div>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <table className="w-full mt-4 font-mono tabular-nums text-[13px] text-ink">
      <thead>
        <tr className="border-b border-hairline text-left text-[12px] uppercase tracking-wide text-secondary">
          {head.map((h, i) => (
            <th key={i} className="py-2 pr-4 font-medium">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-hairline">
            {r.map((c, j) => (
              <td key={j} className="py-2.5 pr-4 align-top">{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CtaBlock({ primary, secondary }: { primary: { label: string; href: string }; secondary?: { label: string; href: string } }) {
  return (
    <div className="mt-10 pt-6 border-t border-hairline flex flex-wrap items-center gap-4">
      <Link
        href={primary.href}
        className="px-8 py-3 bg-ink text-surface font-bold uppercase tracking-wide text-[13px] rounded-[4px] hover:opacity-90 transition-opacity"
      >
        {primary.label}
      </Link>
      {secondary && (
        <Link href={secondary.href} className="font-mono text-[12px] uppercase tracking-wide text-accent hover:underline">
          {secondary.label} →
        </Link>
      )}
    </div>
  );
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
