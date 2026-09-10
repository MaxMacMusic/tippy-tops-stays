import deck from "@/assets/deck-view.jpeg";
import horses from "@/assets/horses-pasture.jpeg";
import hills from "@/assets/hills-dam.jpeg";
import storm from "@/assets/storm-clouds.jpeg";
import belted from "@/assets/belted-cows.jpeg";
import cows from "@/assets/cows-fence.jpeg";
import gate from "@/assets/cattle-gate.jpeg";
import road from "@/assets/dirt-road.jpeg";
import bedroom from "@/assets/interior-bedroom.jpg";
import kitchen from "@/assets/interior-kitchen.jpg";
import drinks from "@/assets/interior-drinks.jpg";
import loft from "@/assets/interior-loft.jpg";
import entranceGateAsset from "@/assets/entrance-gate.png.asset.json";
import tinyHouseFirepitAsset from "@/assets/tiny-house-firepit.png.asset.json";
import propertyAerialAsset from "@/assets/property-aerial.png.asset.json";

const shots = [
  { src: tinyHouseFirepitAsset.url, alt: "The Sunset Shanty tiny house overlooking the firepit and green hillside", span: "md:col-span-2 md:row-span-2" },
  { src: propertyAerialAsset.url, alt: "Aerial view of The Sunset Shanty tiny house and its secluded hinterland setting", span: "md:col-span-2" },
  { src: entranceGateAsset.url, alt: "Country entrance gate leading toward The Sunset Shanty", span: "" },
  { src: deck, alt: "Hardwood deck looking across the valley", span: "md:col-span-2 md:row-span-2" },
  { src: bedroom, alt: "King bed dressed with linen, fresh towels rolled and waiting", span: "" },
  { src: loft, alt: "Loft bedroom nook with ladder and gallery wall of botanical prints", span: "" },
  { src: kitchen, alt: "Country kitchen with timber bench, crystal glasses and hanging mugs", span: "" },
  { src: storm, alt: "Dramatic storm rolling over the hinterland", span: "md:col-span-2" },
  { src: drinks, alt: "Tea, hot chocolate and marshmallows on the welcome tray", span: "" },
  { src: horses, alt: "Horses and cattle grazing the hilltop pasture", span: "" },
  { src: hills, alt: "Rolling green hills with a farm dam", span: "md:col-span-2" },
  { src: belted, alt: "Belted galloway cattle on the dirt track", span: "" },
  { src: cows, alt: "Curious cows by the fence line", span: "" },
  { src: gate, alt: "Angus cattle at the gate at golden hour", span: "md:col-span-2" },
  { src: road, alt: "Dirt road climbing toward a stormy sky", span: "" },
];

export function Gallery() {
  return (
    <section id="gallery" className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">The property</p>
            <h2 className="mt-3 text-4xl md:text-5xl">A working hilltop. Wild views.</h2>
          </div>
          <p className="hidden max-w-sm text-sm text-muted-foreground md:block">
            Cattle, horses, escarpment trails and the soft moss-green folds of the Barrington Tops a short drive away.
          </p>
        </div>
        <div className="grid auto-rows-[220px] grid-cols-1 gap-3 md:grid-cols-4 md:gap-4">
          {shots.map((s, i) => (
            <figure
              key={i}
              className={`group relative overflow-hidden rounded-xl ${s.span}`}
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <img
                src={s.src}
                alt={s.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
