import React from "react";
import { getAllShortcuts } from "@/app/lib/shortcuts";
import { ApplicationList } from "@/app/ui/applications/application-list";

const Page = async () => {
  const allAppShortcuts = getAllShortcuts();

  return (
    <div>
      <ApplicationList applications={allAppShortcuts.applications} />
    </div>
  );
};

export default Page;
