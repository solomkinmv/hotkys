import React from "react";
import { getAllShortcuts } from "@/lib/shortcuts";
import { ApplicationList } from "@/ui/applications/application-list";

const Page = async () => {
  const allAppShortcuts = getAllShortcuts();
  console.log("Received shortcuts: ", allAppShortcuts);
  return (
      <ApplicationList applications={allAppShortcuts.applications} />
  );
};

export default Page;
