import Link from "next/link";
import { FOOTER_LINKS, SOCIAL_LINKS } from "@/lib/constants/navigation";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between xl:px-0">
        <p>
          Made by{" "}
          <Link
            href="https://solomk.in"
            className="font-medium text-foreground hover:underline"
          >
            Maksym Solomkin
          </Link>
        </p>
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-x-5 gap-y-3"
        >
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground hover:underline"
            >
              {link.label}
            </Link>
          ))}
          {SOCIAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
