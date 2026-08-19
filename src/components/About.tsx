import deck from "@/assets/valley-hills.jpg";

const facts = [
  { label: "Sleeps", value: "2 guests" },
  { label: "Bed", value: "One queen" },
  { label: "Setting", value: "Off-grid hilltop" },
  { label: "Getting there", value: "4WD friendly" },
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
            The Sunset Shanty is a rustic retreat perched at Tippy Tops, deep in the
            Gloucester / Barrington Hinterland. It&apos;s simple by design — built for the view,
            the weather, and the wildlife that wanders past the deck at dusk.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Roll out a mat for yoga on the deck as the valley wakes up, and earn your stay
            by crossing eleven causeways on the drive in — a slow, winding ribbon of water
            and gravel that delivers you to this little slice of peaceful heaven.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Tucked between Nabiac and Gloucester, it&apos;s roughly 3 hours 15 minutes from
            Wahroonga. The track in is most easily navigated by 4WD, though it&apos;s not
            compulsory — just take it slow.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            You&apos;re only 40 minutes from the beaches of Forster and Black Head, and 30
            minutes from the mountains, walks and rivers around Gloucester. Or do nothing
            at all — bring a book, leave the phone in the car, and call it a digital detox.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            At night, the sky out here is something else — no light pollution, just a
            blanket of stars so bright you&apos;ll forget what a streetlight looks like.
            It&apos;s the perfect place to watch satellites drift by and wish on shooting
            stars.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Inside you&apos;ll find one queen bed for two guests, a kitchenette with everything you
            need, a dining space, TV, air conditioning, BBQ, toaster and kettle — plus two
            bathrooms, one of which is outside for that true country feel. Everything runs on
            off-grid power, and high-speed Starlink internet keeps you connected if you
            decide to.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Bring boots, a bottle of red, and someone you like. The shanty is set up for two.
          </p>
          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border">
            {facts.map((f) => (
              <div key={f.label} className="bg-card p-5">
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">{f.label}</dt>
                <dd className="mt-2 font-display text-2xl text-primary">{f.value}</dd>
              </div>
            ))}
          </dl>

        </div>
      </div>
    </section>
  );
}
