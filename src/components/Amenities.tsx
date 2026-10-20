const amenities = [
  "Linen",
  "Wi‑Fi",
  "TV",
  "Parking",
  "Air conditioning",
  "Toaster",
  "Kettle",
  "Fridge",
  "Hairdryer",
  "Fire extinguisher",
  "Fire blanket",
  "BBQ",
  "Gas outdoor cooking burner",
  "Coffee pod machine",
  "Self check-in",
  "Smoke alarm",
  "First aid kit",
];

export function Amenities() {
  return (
    <section id="amenities" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">What&apos;s included</p>
        <h2 className="mt-3 text-4xl leading-tight md:text-5xl">Amenities</h2>
        <ul className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border sm:grid-cols-3 lg:grid-cols-4">
          {amenities.map((a) => (
            <li key={a} className="flex items-center gap-3 bg-card p-5 text-foreground">
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
              {a}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
