import React, {useEffect, useRef} from 'react';
import 'tailwindcss/tailwind.css'
import {Section} from "@/lib/model/internal/internal-models";
import Link from "next/link";

function useAnchorRefs(sections: Section[]) {
    const anchorRefs = useRef<Record<string, React.RefObject<HTMLAnchorElement>>>({});
    sections.forEach(section => {
        anchorRefs.current[section.title] = React.createRef();
    });
    return anchorRefs;
}

const TableOfContents = ({sections, sectionRefs}: {
    sections: Section[],
    sectionRefs: React.MutableRefObject<Record<string, React.RefObject<HTMLDivElement>>>
}) => {
    const observer = useRef<IntersectionObserver | null>(null);
    const anchorRefs = useAnchorRefs(sections);
    let prevElement: HTMLAnchorElement | undefined;

    useEffect(() => {
        observer.current = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const id = entry.target.getAttribute('id');
                if (!id) return;
                let element = anchorRefs.current[id];
                if (element && element.current) {
                    if (entry.isIntersecting) {
                        if (prevElement) {
                            prevElement.classList.remove('bg-slate-100/50');
                        }
                        element.current.classList.add('bg-slate-100/50');
                        prevElement = element.current;
                    } else {
                        element.current.classList.remove('bg-slate-100/50');
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
    }, [sections, sectionRefs]);

    return (
        <div className="sticky top-0">
            <h2 className="mb-2 text-lg font-bold">Sections</h2>
            {sections.map((section) => (
                <Link href={`#${section.title}`}
                      key={section.title}
                      ref={anchorRefs.current[section.title]}
                      className="block cursor-pointer px-2 py-1 not-prose hover:bg-slate-100/50">
                    {section.title}
                </Link>
            ))}
        </div>
    );
};

export default TableOfContents;
