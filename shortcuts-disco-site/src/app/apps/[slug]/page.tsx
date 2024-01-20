import { getAllShortcuts } from "@/lib/shortcuts";
import { notFound } from "next/navigation";
import { AppShortcutsComponent } from "@/ui/applications/application";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {


  return {
    title: findApplication(params.slug)?.name,
  };
}

export async function generateStaticParams() {
  return getAllShortcuts().applications
    .map(app => ({ slug: app.slug }));
}

function findApplication(slug: string) {
  return getAllShortcuts()
    .applications
    .find(app => app.slug === slug);
}

export default function Page({ params }: { params: { slug: string } }) {
  const appShortcuts = findApplication(params.slug) || notFound();


  return (
    <AppShortcutsComponent application={appShortcuts} />
  );
}
