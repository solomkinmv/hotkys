"use client";

import Link from "next/link";
import { ComponentProps, useSyncExternalStore } from "react";

const subscribe = () => () => {};

type HydratedLinkProps = Omit<ComponentProps<"a">, "href"> & { href: string };

/**
 * Link to an account-only (noindex) page. It renders as a plain span in the
 * static HTML so crawlers that do not run JavaScript never discover the page.
 */
export function HydratedLink({ href, ...props }: HydratedLinkProps) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!hydrated) {
    const { className, children, "aria-label": ariaLabel } = props;
    return (
      <span className={className} aria-label={ariaLabel}>
        {children}
      </span>
    );
  }

  return <Link href={href} {...props} />;
}
