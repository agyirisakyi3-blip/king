"use client";

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Something went wrong</h1>
          <p className="text-lg text-zinc-500">Please try again later.</p>
          <button
            onClick={() => unstable_retry()}
            className="rounded bg-black px-6 py-3 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
