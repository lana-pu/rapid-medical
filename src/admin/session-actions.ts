"use server";

import { redirect } from "next/navigation";
import { destroySession, getSession } from "@/lib/auth";
import { audit } from "@/lib/audit";

/** Sign out from the account menu (the project picker and the project's header). */
export async function logoutAction() {
  const user = await getSession();
  if (user) await audit(user, "logout");
  await destroySession();
  redirect("/admin/login");
}
