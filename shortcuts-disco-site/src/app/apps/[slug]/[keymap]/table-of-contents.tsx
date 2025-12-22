import React, {useEffect, useRef} from 'react';
import {Section} from "@/lib/model/internal/internal-models";
import Link from "next/link";
import {TypographyMuted, TypographySmall} from "@/components/ui/typography";

function useAnchorRefs(sections: Section[]) {
    const anchorRefs = useRef<Record<string, React.RefObject<HTMLAnchorElement | null>>>({});
    sections.forEach(section => {
        anchorRefs.current[section.title] = React.createRef();
    });
    return anchorRefs;
}

const TableOfContents = ({sections, sectionRefs, onSectionClick}: {
    sections: Section[],
    sectionRefs: React.MutableRefObject<Record<string, React.RefObject<HTMLDivElement | null>>>,
    onSectionClick?: () => void
}) => {
    const observer = useRef<IntersectionObserver | null>(null);
    const anchorRefs = useAnchorRefs(sections);

    useEffect(() => {
        let prevElement: HTMLAnchorElement | undefined;

        observer.current = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const id = entry.target.getAttribute('id');
                if (!id) return;
                let element = anchorRefs.current[id];
                if (element && element.current) {
                    if (entry.isIntersecting) {
                        if (prevElement) {
                            prevElement.classList.remove('bg-accent');
                        }
                        element.current.classList.add('bg-accent');
                        prevElement = element.current;
                    } else {
                        element.current.classList.remove('bg-accent');
                    }
                }
            });
        }, {threshold: 0.1});

        // Observe the elements
        Object.values(sectionRefs.current).forEach((ref) => {
            if (observer.current && ref.current) {
                observer.current.observe(ref.current);
            }
        });

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [sections, sectionRefs, anchorRefs]);

    return (
        <div className="sticky top-0">
            <TypographyMuted className="mb-2 font-semibold">Sections</TypographyMuted>
            {sections.map((section) => (
                <Link href={`#${section.title}`}
                      key={section.title}
                      ref={anchorRefs.current[section.title]}
                      className="block cursor-pointer rounded-md px-2 py-1 not-prose hover:bg-accent"
                      onClick={onSectionClick}>
                    <TypographySmall>{section.title}</TypographySmall>
                </Link>
            ))}
        </div>
    );
};

export default TableOfContents;
