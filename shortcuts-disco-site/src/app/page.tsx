import React from "react";
import { getAllShortcuts } from "@/lib/shortcuts";
import { ApplicationList } from "@/ui/applications/application-list";

const Page = async () => {
  const allAppShortcuts = getAllShortcuts();
  console.log("Received shortcuts: ", allAppShortcuts);
  return (
    <div>
      <ApplicationList applications={allAppShortcuts.applications} />
    </div>
  );
};

export default Page;
