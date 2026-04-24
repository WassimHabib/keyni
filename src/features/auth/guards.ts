import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { repositories } from "@/lib/db/repositories";

import {
  SESSION_COOKIE_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
  validateSessionToken,
} from "./session";
import type { User } from "@/features/users/types";

export async function getOptionalUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const validated = await validateSessionToken(token);
  if (!validated) {
    store.delete(SESSION_COOKIE_NAME);
    return null;
  }
  const user = await repositories.users.findById(validated.userId);
  if (!user) return null;

  if (validated.renewed) {
    store.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    });
  }
  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getOptionalUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function redirectIfAuthenticated(
  destination = "/tableau-de-bord",
): Promise<void> {
  const user = await getOptionalUser();
  if (user) {
    redirect(destination);
  }
}
