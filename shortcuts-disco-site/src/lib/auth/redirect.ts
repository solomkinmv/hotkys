export function getSafeAuthRedirectPath(
  next: string | null | undefined,
  fallback = "/"
): string {
  if (!next) {
    return fallback;
  }

  let decoded = next;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return fallback;
  }

  if (
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    decoded.startsWith("/auth/")
  ) {
    return fallback;
  }

  return decoded;
}

export function getLoginHref(next: string | null | undefined): string {
  const safeNext = getSafeAuthRedirectPath(next);
  if (safeNext === "/") {
    return "/auth/login";
  }

  return `/auth/login?next=${encodeURIComponent(safeNext)}`;
}
