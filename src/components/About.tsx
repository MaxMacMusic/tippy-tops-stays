import deck from "@/assets/deck-view.jpeg";

const facts = [
  { label: "Sleeps", value: "Up to 4" },
  { label: "Minimum stay", value: "2 nights" },
  { label: "Rate", value: "$260 / night" },
  { label: "Setting", value: "Off-grid hilltop" },
];

export function About() {
  return (
    <section id="about" className="bg-secondary/40 py-24">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 md:grid-cols-2 md:items-center">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl" style={{ boxShadow: "var(--shadow-lift)" }}>
          <img src={deck} alt="The Sunset Shanty deck" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">About the shanty</p>
          <h2 className="mt-3 text-4xl leading-tight md:text-5xl">
            Slow mornings, long shadows, and the kind of quiet you can hear.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            The Sunset Shanty is a rustic timber retreat perched at Tippy Tops, deep in the
            Gloucester / Barrington Hinterland. It&apos;s simple by design — built for the view,
            the weather, and the wildlife that wanders past the deck at dusk.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Bring boots, a bottle of red, and someone you like. Two-night minimum so you can
            actually unwind.
          </p>
          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border">
            {facts.map((f) => (
              <div key={f.label} className="bg-card p-5">
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">{f.label}</dt>
                <dd className="mt-2 font-display text-2xl text-primary">{f.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Grand opening rate. Limited dates.
          </p>
        </div>
      </div>
    </section>
  );
}
