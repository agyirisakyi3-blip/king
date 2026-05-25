import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-8 py-4">
        <Link href="/" className="text-lg font-bold">
          Store
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {session ? (
            <>
              <Link href="/account" className="font-medium">Account</Link>
              <form
                action={async () => {
                  "use server";
                  const { deleteSession } = await import("@/lib/session");
                  await deleteSession();
                }}
              >
                <button type="submit" className="text-zinc-500 hover:text-black">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="font-medium">Sign in</Link>
              <Link
                href="/signup"
                className="rounded bg-black px-4 py-2 text-sm font-medium text-white"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-8 py-24 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">Welcome to Store</h1>
        <p className="mb-8 max-w-md text-lg text-zinc-500">
          A secure web store built with Next.js, Prisma, and TypeScript.
        </p>
        <div className="flex gap-4">
          <Link
            href={session ? "/account" : "/signup"}
            className="rounded bg-black px-6 py-3 text-sm font-medium text-white"
          >
            {session ? "View account" : "Get started"}
          </Link>
        </div>
      </main>
    </div>
  );
}
