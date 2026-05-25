"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signup, login, signupSchema, loginSchema, AuthError } from "@/lib/auth";
import { deleteSession } from "@/lib/session";

export type ActionResult =
  | { success: true; error?: never }
  | { success?: false; error: string };

export async function signupAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    name: formData.get("name") as string,
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(". ") };
  }

  try {
    await signup(parsed.data);
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: e.message };
    }
    return { error: "An unexpected error occurred" };
  }

  revalidatePath("/");
  redirect("/");
}

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(". ") };
  }

  try {
    await login(parsed.data);
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: e.message };
    }
    return { error: "An unexpected error occurred" };
  }

  revalidatePath("/");
  redirect("/");
}

export async function logoutAction() {
  await deleteSession();
  revalidatePath("/");
  redirect("/");
}
