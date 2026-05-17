import { Link } from "@tanstack/react-router";

export function SiteNav() {
  return (
    <header className="absolute top-0 left-0 right-0 z-30">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-cream">
        <Link to="/" className="font-display text-xl tracking-tight">
          The Sunset Shanty
          <span className="ml-2 text-xs uppercase tracking-[0.2em] opacity-70">Tippy Tops</span>
        </Link>
        <div className="hidden gap-8 text-sm md:flex">
          <a href="#gallery" className="opacity-90 transition hover:opacity-100">Gallery</a>
          <a href="#about" className="opacity-90 transition hover:opacity-100">The Shanty</a>
          <a href="#book" className="opacity-90 transition hover:opacity-100">Book</a>
        </div>
        <a
          href="#book"
          className="rounded-full bg-cream px-5 py-2 text-sm font-medium text-primary shadow-soft transition hover:bg-fern hover:text-primary"
        >
          Check dates
        </a>
      </nav>
    </header>
  );
}
