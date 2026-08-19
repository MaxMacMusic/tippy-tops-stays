import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { Hero } from "@/components/Hero";
import { Gallery } from "@/components/Gallery";
import { About } from "@/components/About";
import { BookingWidget } from "@/components/BookingWidget";
import { SiteFooter } from "@/components/SiteFooter";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Sunset Shanty at Tippy Tops — Gloucester Hinterland Stay" },
      {
        name: "description",
        content:
          "Book The Sunset Shanty at Tippy Tops — a rustic hilltop retreat in the Gloucester / Barrington Hinterland, NSW. A hideaway for two with sweeping valley views.",
      },
      { property: "og:title", content: "The Sunset Shanty at Tippy Tops" },
      {
        property: "og:description",
        content: "Rustic shack for two, wide hinterland views.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Inter:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <SiteNav />
      <Hero />
      <Gallery />
      <About />
      <BookingWidget />
      <SiteFooter />
      <Toaster richColors position="top-center" />
    </main>
  );
}
