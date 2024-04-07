import React, {useEffect, useRef} from 'react';
import 'tailwindcss/tailwind.css'
import {Section} from "@/lib/model/internal/internal-models";

function useAnchorRefs(sections: Section[]) {
    const anchorRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});
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
    let prevElement: HTMLDivElement | undefined;

    useEffect(() => {
        observer.current = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                console.log("Observed element: ", entry.target);
                const id = entry.target.getAttribute('id');
                if (!id) return;
                let element = anchorRefs.current[id];
                console.log("Corresponding anchor tag: ", element);
                if (element && element.current) {
                    if (entry.isIntersecting) {
                        if (prevElement) {
                            prevElement.classList.remove('bg-gray-200');
                        }
                        element.current.classList.add('bg-gray-200');
                        prevElement = element.current;
                    } else {
                        element.current.classList.remove('bg-gray-200');
                    }
                }
            });
        }, {threshold: 0.1});

        // Observe the elements
        Object.values(sectionRefs.current).forEach((ref) => {
            if (observer.current && ref.current) {
                console.log("Observing element: ", ref.current);
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
        <div className="toc p-4 sticky top-0">
            <h2 className="text-lg font-bold mb-2">Sections</h2>
            {sections.map((section) => (
                <div key={section.title} ref={anchorRefs.current[section.title]}>
                    <a href={`#${section.title}`} className="not-prose">
                        {section.title}
                    </a>
                </div>
            ))}
        </div>
    );
};

export default TableOfContents;
