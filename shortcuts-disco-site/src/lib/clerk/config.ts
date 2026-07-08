export function getClerkPublishableKey(): string | undefined {
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

export function isClerkConfigured(): boolean {
  return Boolean(getClerkPublishableKey());
}
