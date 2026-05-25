import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Page not found</h1>
      <p className="text-lg text-zinc-500">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="rounded bg-black px-6 py-3 text-sm font-medium text-white"
      >
        Return home
      </Link>
    </div>
  );
}
