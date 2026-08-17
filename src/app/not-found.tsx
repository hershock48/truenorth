import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-[family-name:var(--font-display)] text-6xl font-bold text-north">
        Lost?
      </p>
      <p className="mt-4 text-lg text-ink-soft">
        That page is not on the map. The ice cream, however, is easy to find.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Back to the shop
        </Link>
        <Link href="/flavors" className="btn-secondary">
          See the flavors
        </Link>
      </div>
    </div>
  );
}
