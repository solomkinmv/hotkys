import React, { useEffect, useState } from "react";
import { Section } from "@/lib/model/internal/internal-models";
import Link from "next/link";

// Match the section cards' scroll-mt-8 anchor offset.
const READING_OFFSET = 32;

const TableOfContents = ({
  sections,
  sectionRefs,
  onSectionClick,
}: {
  sections: Section[];
  sectionRefs: React.MutableRefObject<
    Record<string, React.RefObject<HTMLDivElement | null>>
  >;
  onSectionClick?: () => void;
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const targets = sections.flatMap((section) => {
      const element = sectionRefs.current[section.title]?.current;
      return element ? [{ title: section.title, element }] : [];
    });
    let frame: number | undefined;

    const updateActiveSection = () => {
      frame = undefined;
      if (!targets.length) {
        setActiveSection(null);
        return;
      }

      // Short final sections cannot always scroll all the way to the reading line.
      const atBottom =
        window.scrollY > 0 &&
        window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 2;
      const active = atBottom
        ? targets[targets.length - 1].title
        : targets.reduce(
            (title, target) =>
              target.element.getBoundingClientRect().top <= READING_OFFSET + 1
                ? target.title
                : title,
            targets[0].title,
          );
      setActiveSection(active);
    };

    const scheduleUpdate = () => {
      if (frame === undefined) {
        frame = window.requestAnimationFrame(updateActiveSection);
      }
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(document.documentElement);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver.disconnect();
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, [sections, sectionRefs]);

  return (
    <nav
      aria-label="Shortcut sections"
      className="sticky top-8 max-h-[calc(100dvh-4rem)] overflow-y-auto"
    >
      <p className="mb-3 px-3 font-mono text-xs text-muted-foreground">
        Sections
      </p>
      {sections.map((section) => (
        <Link
          href={`#${section.title}`}
          key={section.title}
          aria-current={
            activeSection === section.title ? "location" : undefined
          }
          className="mb-1 flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm hover:bg-accent aria-[current=location]:bg-brand/8 aria-[current=location]:text-brand"
          onClick={onSectionClick}
        >
          <span className="min-w-0 font-medium">{section.title}</span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {section.hotkeys.length}
          </span>
        </Link>
      ))}
    </nav>
  );
};

export default TableOfContents;
