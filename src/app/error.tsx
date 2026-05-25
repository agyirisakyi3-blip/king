"use client";

export default function Error({
  unstable_retry,
}: {
  unstable_retry: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Something went wrong</h1>
      <p className="text-lg text-zinc-500">Please try again later.</p>
      <button
        onClick={() => unstable_retry()}
        className="rounded bg-black px-6 py-3 text-sm font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}
