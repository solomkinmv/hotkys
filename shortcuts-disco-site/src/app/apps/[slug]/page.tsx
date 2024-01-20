import { getAllShortcuts } from "@/app/lib/shortcuts";
import { notFound } from "next/navigation";
import { AppShortcutsComponent } from "@/app/ui/applications/application";


export async function generateStaticParams() {
  return getAllShortcuts().applications
    .map(app => ({ slug: app.slug }));
}

export default function Page({ params }: { params: { slug: string } }) {
  const appShortcuts = getAllShortcuts()
    .applications
    .find(app => app.slug === params.slug) || notFound();


  return (
    <AppShortcutsComponent application={appShortcuts} />
  );
}
