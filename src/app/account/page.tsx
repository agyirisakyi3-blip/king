import { getUser } from "@/lib/dal";
import { deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded border p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Account</h1>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="font-medium text-zinc-500">Name</dt>
            <dd>{user.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-zinc-500">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-zinc-500">Role</dt>
            <dd>{user.role}</dd>
          </div>
        </dl>
        <form
          action={async () => {
            "use server";
            await deleteSession();
            redirect("/");
          }}
        >
          <button
            type="submit"
            className="w-full rounded bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
