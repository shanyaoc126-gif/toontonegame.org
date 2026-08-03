import Link from 'next/link';
import { ReactNode } from 'react';

// Shared chrome + prose primitives for the content pages.
// MindMarket storybook language: cream canvas, white sticker cards, Inter,
// oversized tight-tracked headings, generous line spacing for comfort.

export function ContentHeader() {
  return (
    <nav
      className="sticker-nav flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3 md:px-7"
      aria-label="Main"
    >
      <span className="flex items-center gap-2.5">
        <span
          className="inline-block w-3.5 h-3.5 rounded-full border-2 border-ink shrink-0"
          style={{ backgroundColor: '#8ed462' }}
          aria-hidden="true"
        />
        <Link href="/" className="text-[15px] font-medium tracking-tight text-ink hover:opacity-80 whitespace-nowrap">
          ToonTone Proofing Lab
        </Link>
      </span>
      <Link href="/" className="btn-pill btn-grass px-6 py-2 text-[13px]">
        Play ToonTone
      </Link>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative z-10 mx-auto w-full max-w-[1200px] px-4 mt-12 pb-10 md:px-8">
      <div className="border-t-2 border-ink pt-6 text-center">
        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
          <Link href="/how-to-play" className="text-[14px] text-ink hover:underline">How to Play</Link>
          <Link href="/what-is-delta-e" className="text-[14px] text-ink hover:underline">What is ΔE</Link>
          <Link href="/hsb-color-guide" className="text-[14px] text-ink hover:underline">HSB Guide</Link>
          <Link href="/faq" className="text-[14px] text-ink hover:underline">FAQ</Link>
          <Link href="/pets/golden-shaded-longhair" className="text-[14px] text-ink hover:underline">Pets</Link>
          <Link href="/privacy" className="text-[14px] text-secondary hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="text-[14px] text-secondary hover:underline">Terms of Service</Link>
        </div>
        <p className="mt-3 text-[12px] text-secondary">Not affiliated with toontone.com</p>
      </div>
    </footer>
  );
}

// Paper-cut decorations — pure CSS shapes in the four pop colors, fixed to
// the canvas corners at very low presence. No image assets.
export function PaperDecor() {
  return (
    <>
      <div className="paper-decor" style={{ top: '-40px', left: '-40px' }} aria-hidden="true">
        <div style={{ width: '160px', height: '80px', borderBottomLeftRadius: '160px', borderBottomRightRadius: '0', backgroundColor: '#8ed462', borderRadius: '0 0 0 160px' }} />
      </div>
      <div className="paper-decor" style={{ bottom: '-70px', right: '-70px' }} aria-hidden="true">
        <div style={{ width: '220px', height: '220px', borderRadius: '50%', backgroundColor: '#2ba0ff', opacity: 0.6 }} />
      </div>
      <div className="paper-decor" style={{ top: '38%', right: '-26px' }} aria-hidden="true">
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#ff705d' }} />
      </div>
      <div className="paper-decor" style={{ bottom: '18%', left: '-18px' }} aria-hidden="true">
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f5e211' }} />
      </div>
    </>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen bg-canvas">
      <PaperDecor />
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 pt-5 pb-14 md:px-8 md:pt-8">
        <ContentHeader />
        <div className="sticker-card mt-8 p-6 md:p-12">
          <article className="mx-auto max-w-[760px]">{children}</article>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return <h1 className="tt-heading text-ink">{children}</h1>;
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[22px] md:text-[26px] font-medium tracking-[-0.02em] text-ink mt-12 pt-8 border-t border-hairline">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="text-[18px] font-medium text-ink mt-7">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-[16px] md:text-[17px] leading-[1.75] text-ink">{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="mt-4 list-disc pl-5 space-y-2 text-[16px] md:text-[17px] leading-[1.75] text-ink">{children}</ul>;
}

export function QA({ q, children }: { q: string; children: ReactNode }) {
  return (
    <div className="mt-7">
      <p className="font-medium text-[17px] text-ink">{q}</p>
      <p className="mt-2 text-[16px] leading-[1.75] text-ink">{children}</p>
    </div>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full tabular text-[14px] text-ink">
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
    </div>
  );
}

export function CtaBlock({ primary, secondary }: { primary: { label: string; href: string }; secondary?: { label: string; href: string } }) {
  return (
    <div className="mt-10 pt-8 border-t border-hairline flex flex-wrap items-center gap-4">
      <Link href={primary.href} className="btn-pill btn-grass px-8 py-3">
        {primary.label}
      </Link>
      {secondary && (
        <Link href={secondary.href} className="text-[13px] uppercase tracking-wide text-ink underline decoration-accent decoration-2 underline-offset-4 hover:opacity-70">
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
