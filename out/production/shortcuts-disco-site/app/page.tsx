import {ApplicationList} from "@/components/list/application-list";
import {getAllShortcuts} from "@/lib/shortcuts";
import React from "react";

const AllApplicationsPage = () => {
    const allAppShortcuts = getAllShortcuts();
    return (
        <section className="mx-auto max-w-3xl prose prose-gray dark:prose-invert">
            <ApplicationList applications={allAppShortcuts.applications}/>
        </section>
    );
};

export default AllApplicationsPage;
