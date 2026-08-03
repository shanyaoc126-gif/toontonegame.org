import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PETS, getPet, PetSlug } from '../../lib/pets';
import { ContentHeader, SiteFooter, PaperDecor, JsonLd } from '../../components/ContentPage';

// Pet dex — one SEO page per breed. Server component: the spec data is static
// (mirrored from public/pets/*.spec.json), so no fetch needed at build time.

export function generateStaticParams() {
  return PETS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pet = getPet(slug);
  if (!pet) return {};
  const title = `${pet.name} Print Job — ${pet.nameZh} · ToonTone Proofing Lab`;
  return {
    title,
    description: pet.description,
    alternates: { canonical: `/pets/${pet.slug}` },
    openGraph: {
      type: 'website',
      url: `https://toontonegame.org/pets/${pet.slug}`,
      siteName: 'ToonTone Proofing Lab',
      title,
      description: pet.description,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${pet.name} color matching print job` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: pet.description,
      images: ['/og-image.png'],
    },
  };
}

// Breed-keyworded copy per slug for the intro paragraph.
function introCopy(slug: PetSlug): string {
  switch (slug) {
    case 'golden-shaded-longhair':
      return 'The Golden Shaded Longhair is a five-layer gradient walking around in cat form. Calibrate each ink zone — from the warm cream undercoat to the golden fur tips — and print your own copy.';
    case 'ragdoll':
      return 'The Ragdoll is soft cream, seal points, and two deep-blue eyes. Five ink zones make up her evening gown — calibrate each one and pull your own proof.';
    case 'shiba-inu':
      return 'The Shiba Inu runs on red-orange confidence, white brow spots, and a permanently welded grin. Five ink zones — match them all and the press runs in his honor.';
    case 'corgi':
      return 'The Pembroke Welsh Corgi is a limited edition on short legs: tan coat, four white socks, and one very large pink tongue. Five ink zones, calibrated by you.';
  }
}

export default async function PetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pet = getPet(slug);
  if (!pet) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: `${pet.name} Print Job`,
    alternateName: `${pet.nameZh} 填色挑战`,
    url: `https://toontonegame.org/pets/${pet.slug}`,
    applicationCategory: 'GameApplication',
    gamePlatform: 'Web Browser',
    description: pet.description,
    keywords: pet.keywords,
    isPartOf: {
      '@type': 'VideoGame',
      name: 'ToonTone Proofing Lab',
      url: 'https://toontonegame.org/',
    },
  };

  return (
    <main className="relative min-h-screen bg-canvas">
      <JsonLd data={jsonLd} />
      <PaperDecor />
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 pt-5 pb-14 md:px-8 md:pt-8">
        <ContentHeader />

        <div className="sticker-card mt-8 p-6 md:p-12">
          <div className="grid gap-x-10 gap-y-8 md:grid-cols-12">
            {/* Left: breed intro */}
            <div className="md:col-span-7">
              <p className="tt-label text-secondary">Pet print job · {pet.keywords}</p>
              <h1 className="tt-heading text-ink mt-2">
                {pet.name}
                <span className="block text-[20px] md:text-[24px] text-secondary mt-1">{pet.nameZh}</span>
              </h1>
              <p className="text-[16px] md:text-[17px] leading-[1.75] text-ink mt-5 max-w-[56ch]">
                {introCopy(pet.slug)}
              </p>
              <p className="text-[15px] leading-[1.7] text-secondary mt-4 max-w-[56ch]">
                {pet.personalityEn}
              </p>
              <p className="text-[13px] text-secondary mt-1">
                性格 · {pet.personalityZh}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={`/?pet=${pet.slug}&mode=printjob`}
                  className="btn-pill btn-grass px-8 py-3.5 text-[14px]"
                >
                  Calibrate this print job
                </Link>
                <Link href="/" className="text-[13px] uppercase tracking-wide text-ink underline decoration-accent decoration-2 underline-offset-4 hover:opacity-70">
                  Daily proof →
                </Link>
              </div>
            </div>

            {/* Right: the original photo (the reference players re-ink in game) */}
            <div className="md:col-span-5">
              <div className="swatch-card">
                {/* eslint-disable-next-line @next/next/no-img-element -- static photo asset, no optimization needed */}
                <img
                  src={`/pets/photos/${pet.slug}-orig.jpg`}
                  alt={`Original photo of ${pet.name} (${pet.nameZh})`}
                  width={640}
                  height={640}
                  className="w-full h-auto rounded-[24px]"
                />
              </div>
              <p className="tt-label text-secondary px-3 mt-3">
                Reference photo · {pet.name} · TheCatAPI
              </p>
            </div>
          </div>

          {/* Zone spec cards */}
          <section className="mt-12 border-t border-hairline pt-8" aria-labelledby="zone-spec-title">
            <h2 id="zone-spec-title" className="text-[22px] md:text-[26px] font-medium tracking-[-0.02em] text-ink">
              Five ink zones
            </h2>
            <p className="text-[15px] text-secondary mt-2 max-w-[56ch]">
              Each zone is one round in the print job: the target is the real
              average color sampled from the photo — match it and your ink
              re-tints that part of the picture.
            </p>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {pet.zones.map((zone, i) => (
                <li key={zone.id} className="rounded-[34px] border-2 border-ink bg-surface p-5">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block w-10 h-10 rounded-[12px] border-2 border-ink shrink-0"
                      style={{ backgroundColor: zone.completedFill }}
                      role="img"
                      aria-label={`Zone color ${zone.completedFill}`}
                    />
                    <span>
                      <span className="block tt-label text-secondary">{zone.id.toUpperCase()} · {zone.part}</span>
                      <span className="block text-[15px] font-medium text-ink leading-tight">{zone.partEn}</span>
                    </span>
                  </div>
                  <p className="text-[13px] leading-[1.6] text-secondary mt-3">{zone.note}</p>
                  <p className="tabular text-[12px] text-secondary mt-3">
                    Target HSB {zone.target.h}° / {zone.target.s}% / {zone.target.b}% · Fill {zone.completedFill}
                  </p>
                  <span className="sr-only">Zone {i + 1} of 5</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Other pets */}
          <section className="mt-12 border-t border-hairline pt-8" aria-labelledby="other-pets-title">
            <h2 id="other-pets-title" className="text-[22px] font-medium tracking-[-0.02em] text-ink">
              More pets on the job board
            </h2>
            <ul className="flex flex-wrap gap-3 mt-4">
              {PETS.filter((p) => p.slug !== pet.slug).map((p) => (
                <li key={p.slug}>
                  <Link href={`/pets/${p.slug}`} className="btn-pill btn-ghost px-6 py-2.5 text-[13px]">
                    {p.name} · {p.nameZh}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
