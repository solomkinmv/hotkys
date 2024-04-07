import {ApplicationList} from "@/components/list/application-list";
import {getAllShortcuts} from "@/lib/shortcuts";
import React from "react";

const AllApplicationsPage = () => {
    const allAppShortcuts = getAllShortcuts();
    return (
        <div>
            <section className="prose prose-gray max-w-3xl mx-auto dark:prose-invert">
                <ApplicationList applications={allAppShortcuts.applications}/>
            </section>
        </div>
    );
};

export default AllApplicationsPage;
