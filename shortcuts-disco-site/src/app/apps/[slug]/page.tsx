import { getAllShortcuts } from "@/lib/shortcuts";
import { notFound } from "next/navigation";
import { AppShortcutsComponent } from "@/ui/applications/application";
import { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: findApplication(params.slug)?.name,
  };
}

export async function generateStaticParams() {
  return getAllShortcuts().applications
    .map(app => ({ slug: app.slug }));
}

export default function Page({ params }: Props) {
  const appShortcuts = findApplication(params.slug) || notFound();


  return (
    <AppShortcutsComponent application={appShortcuts} />
  );
}

function findApplication(slug: string) {
  return getAllShortcuts()
    .applications
    .find(app => app.slug === slug);
}
