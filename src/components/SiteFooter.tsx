export function SiteFooter() {
  return (
    <footer className="bg-background py-12 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-end">
        <div>
          <div className="font-display text-xl text-foreground">The Sunset Shanty</div>
          <p className="mt-1">Tippy Tops · Gloucester / Barrington Hinterland · NSW</p>
        </div>
        <p className="text-xs">© {new Date().getFullYear()} The Sunset Shanty. Stay gently.</p>
      </div>
    </footer>
  );
}
