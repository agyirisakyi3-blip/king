"use client";

import { useActionState } from "react";
import { signupAction, type ActionResult } from "@/app/actions/auth";

export default function SignupPage() {
  const [state, action, pending] = useActionState<ActionResult, FormData>(signupAction, { success: true });

  return (
    <div className="flex flex-1 items-center justify-center">
      <form action={action} className="flex w-full max-w-sm flex-col gap-4 rounded border p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Create account</h1>

        {state?.error && (
          <p className="rounded bg-red-50 p-3 text-sm text-red-600">{state.error}</p>
        )}

        <label className="flex flex-col gap-1 text-sm font-medium">
          Name
          <input name="name" type="text" required className="rounded border px-3 py-2 text-sm" />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input name="email" type="email" required className="rounded border px-3 py-2 text-sm" />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Password
          <input name="password" type="password" required minLength={8} className="rounded border px-3 py-2 text-sm" />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Creating account..." : "Create account"}
        </button>

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <a href="/login" className="text-black underline">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}
