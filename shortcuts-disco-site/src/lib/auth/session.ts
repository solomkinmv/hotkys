import type { AuthUser } from "@/lib/auth/types";

let currentAuthUser: AuthUser | null = null;

export function setCurrentAuthUser(user: AuthUser | null) {
  currentAuthUser = user;
}

export function getCurrentAuthUser() {
  return currentAuthUser;
}
