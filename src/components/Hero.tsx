import heroImage from "@/assets/hero-sunset.jpg";

export function Hero() {
  return (
    <section className="relative h-[92vh] min-h-[640px] w-full overflow-hidden">
      <img
        src={heroImage}
        alt="Sunset over the Barrington hinterland hills"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-20 text-cream">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] opacity-80">
          Gloucester · Barrington Hinterland · NSW
        </p>
        <h1 className="max-w-4xl text-5xl leading-[1.05] md:text-7xl">
          A rustic shack where the hills <em className="italic opacity-90">catch the last light.</em>
        </h1>
        <p className="mt-6 max-w-xl text-base opacity-90 md:text-lg">
          The Sunset Shanty at Tippy Tops — wide skies, belted cows on the lane,
          and a deck that opens onto the valley. Two-night minimum.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="#book"
            className="rounded-full bg-cream px-7 py-3 text-sm font-medium text-primary shadow-lift transition hover:scale-[1.02]"
          >
            Check availability
          </a>
          <a
            href="#gallery"
            className="rounded-full border border-cream/40 px-7 py-3 text-sm font-medium text-cream transition hover:bg-cream/10"
          >
            See the property
          </a>
        </div>
      </div>
    </section>
  );
}
