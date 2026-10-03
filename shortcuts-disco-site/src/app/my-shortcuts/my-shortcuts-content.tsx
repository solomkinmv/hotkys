"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  FolderEdit,
  LockKeyhole,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getLoginHref } from "@/lib/auth/redirect";
import { useCustomizations } from "@/lib/hooks/use-customizations";
import { customizationsService } from "@/lib/services/customizations-service";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { MyShortcutAppContent } from "./my-shortcut-app-content";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/ui/app-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ExportDialog } from "@/components/shortcuts/export-dialog";
import {
  AppMetadataFields,
  type AppDraft,
} from "@/components/shortcuts/app-metadata-fields";
import type { CustomApp } from "@/lib/model/user/user-models";
import type { AppShortcuts } from "@/lib/model/internal/internal-models";
import { serializeKeymap } from "@/lib/model/keymap-utils";
import {
  assertResourceLimit,
  USER_CONTENT_LIMITS,
} from "@/lib/validation/user-content";

export function MyShortcutsContent({
  applications = [],
}: {
  applications?: AppShortcuts[];
}) {
  const params = useSearchParams();
  const selectedAppSlug = params.get("app");
  const keymapId = params.get("keymap") ?? undefined;
  return selectedAppSlug ? (
    <MyShortcutAppContent
      key={`${selectedAppSlug}/${keymapId ?? ""}`}
      slug={selectedAppSlug}
      keymapId={keymapId}
    />
  ) : (
    <MyShortcutsListContent applications={applications} />
  );
}
const emptyAppDraft: AppDraft = { name: "", slug: "", bundleId: "", icon: "" };
function MyShortcutsListContent({
  applications,
}: {
  applications: AppShortcuts[];
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { refetch: refetchFavorites } = useFavorites();
  const {
    customizations,
    isLoading,
    error: loadError,
    refetch,
  } = useCustomizations();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draft, setDraft] = useState(emptyAppDraft);
  const [slugEdited, setSlugEdited] = useState(false);
  const [exportApp, setExportApp] = useState<CustomApp | null>(null);
  const [deleteApp, setDeleteApp] = useState<CustomApp | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openCreate = () => {
    setDraft(emptyAppDraft);
    setSlugEdited(false);
    setError(null);
    setIsCreateOpen(true);
  };
  const handleCreate = async () => {
    if (!user || pending) return;
    setPending(true);
    setError(null);
    let wasCreated = false;
    try {
      assertResourceLimit(
        customizations.customApps.length,
        USER_CONTENT_LIMITS.customApps,
        "custom apps",
      );
      const app = await customizationsService.createCustomApp(
        {
          name: draft.name.trim(),
          slug: draft.slug.trim(),
          bundleId: draft.bundleId.trim() || undefined,
          icon: draft.icon.trim() || undefined,
        },
        user,
      );
      wasCreated = true;
      setIsCreateOpen(false);
      await refetch();
      router.push(`/my-shortcuts?app=${encodeURIComponent(app.slug)}`);
    } catch (error) {
      setError(
        wasCreated
          ? "App created, but couldn’t reload your collection. Retry loading to see your new app."
          : error instanceof Error
            ? error.message
            : "Unable to create app. Your draft is still here.",
      );
    } finally {
      setPending(false);
    }
  };
  const handleDelete = async () => {
    if (!user || !deleteApp || pending) return;
    setPending(true);
    setError(null);
    let wasDeleted = false;
    try {
      await customizationsService.deleteCustomApp(deleteApp.id, user);
      wasDeleted = true;
      setDeleteApp(null);
      await Promise.all([refetch(), refetchFavorites()]);
    } catch (error) {
      setError(
        wasDeleted
          ? "App deleted, but couldn’t reload your collection. Retry loading to see the change."
          : error instanceof Error
            ? error.message
            : "Unable to delete this app. Please try again.",
      );
    } finally {
      setPending(false);
    }
  };
  const customApps = customizations.customApps;

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 flex items-center gap-2 text-sm text-brand">
            <FolderEdit className="size-4" aria-hidden="true" />
            Your workspace
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.055em] md:text-5xl">
            My shortcuts
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Your apps. Your key combinations. Make them work your way.
          </p>
        </div>
        {user && (
          <Button className="self-start rounded-xl" onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            New App
          </Button>
        )}
      </div>
      {error && !isCreateOpen && !deleteApp && !loadError && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-destructive/25 bg-destructive/5 p-4"
        >
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 rounded-lg"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              try {
                await Promise.all([refetch(), refetchFavorites()]);
                setError(null);
              } catch {
                setError("Unable to reload your collection. Please try again.");
              } finally {
                setPending(false);
              }
            }}
          >
            Retry loading
          </Button>
        </div>
      )}
      {authLoading || isLoading ? (
        <div
          role="status"
          aria-label="Loading your shortcuts"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border bg-muted/50"
            />
          ))}
        </div>
      ) : user && loadError ? (
        <div role="alert" className="rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-semibold tracking-tight">
            Couldn’t load your apps
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {error ?? loadError}
          </p>
          <Button
            variant="outline"
            className="mt-5 rounded-xl"
            onClick={() =>
              Promise.all([refetch(), refetchFavorites()])
                .then(() => setError(null))
                .catch(() => {})
            }
          >
            Retry loading
          </Button>
        </div>
      ) : !user ? (
        <div className="rounded-2xl border bg-card p-6 md:p-10">
          <LockKeyhole className="mb-5 size-7 text-brand" aria-hidden="true" />
          <h2 className="text-2xl font-semibold tracking-tight">
            A collection that fits you.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Sign in to add private apps and customize shortcuts from the
            catalog.
          </p>
          <Button asChild className="mt-6 rounded-xl">
            <Link href={getLoginHref("/my-shortcuts")}>
              Sign in to create shortcuts{" "}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          <section aria-label="Your apps">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight">
                Your apps{" "}
                <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">
                  {customApps.length}
                </span>
              </h2>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <LockKeyhole className="size-3" aria-hidden="true" />
                Private
              </p>
            </div>
            {customApps.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {customApps.map((app) => {
                  const count = app.keymaps.reduce(
                    (n, k) =>
                      n +
                      k.sections.reduce(
                        (m, s) =>
                          m + s.shortcuts.filter((s) => !s.isDeleted).length,
                        0,
                      ),
                    0,
                  );
                  return (
                    <div
                      key={app.id}
                      className="rounded-2xl border bg-card transition-colors hover:border-brand/35"
                    >
                      <Link
                        href={`/my-shortcuts?app=${encodeURIComponent(app.slug)}`}
                        className="block p-5"
                      >
                        <AppIcon
                          icon={app.icon}
                          appName={app.name}
                          size="md"
                          className="mb-5 size-11 rounded-xl [&_img]:object-contain"
                        />
                        <h3 className="font-semibold tracking-tight">
                          {app.name}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {app.keymaps.length}{" "}
                          {app.keymaps.length === 1 ? "keymap" : "keymaps"} /{" "}
                          {count} {count === 1 ? "shortcut" : "shortcuts"}
                        </p>
                        <span className="mt-5 flex items-center justify-between text-sm font-medium">
                          {count ? "Open shortcuts" : "Add your first shortcut"}
                          <ArrowUpRight
                            className="size-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </span>
                      </Link>
                      <div className="flex justify-between gap-2 border-t px-4 py-2">
                        <FavoriteButton
                          itemType="app"
                          appSlug={`custom-${app.slug}`}
                          customAppId={app.id}
                          label={app.name}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg"
                          onClick={() => setExportApp(app)}
                          aria-label={`Export ${app.name}`}
                        >
                          <Share2 className="size-3.5" aria-hidden="true" />
                          Export
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setError(null);
                            setDeleteApp(app);
                          }}
                          aria-label={`Delete ${app.name}`}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-6 rounded-2xl border border-dashed bg-card p-6 sm:grid-cols-[1fr_auto] sm:items-center md:p-8">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">
                    Start with one app.
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                    Give it a name, choose a keymap, and add the shortcuts you
                    use. A text icon is created for you.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="self-start rounded-xl"
                  onClick={openCreate}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Create your first app
                </Button>
              </div>
            )}
          </section>
          {customizations.shortcuts.length > 0 && (
            <section aria-label="Your changes">
              <h2 className="text-xl font-semibold tracking-tight">
                Your changes
              </h2>
              <p className="mt-2 mb-4 text-sm text-muted-foreground">
                Shortcuts you’ve customized in the public catalog.
              </p>
              <div className="rounded-2xl border bg-card p-2">
                {customizations.shortcuts.map((overlay) => {
                  const [appSlug, keymapTitle, sectionTitle, ...title] =
                    overlay.baseKey.split(":");
                  const app = applications.find((a) => a.slug === appSlug);
                  const shortcutTitle =
                    overlay.modification.title ?? title.join(":");
                  return (
                    <Link
                      key={`${overlay.baseKey}:${overlay.baseShortcutId ?? ""}`}
                      href={`/apps/${appSlug}/${serializeKeymap({ title: keymapTitle, sections: [] })}#${encodeURIComponent(sectionTitle)}`}
                      className="flex items-center gap-3 rounded-xl px-3 py-4 odd:bg-muted/40 hover:bg-accent"
                    >
                      <AppIcon
                        icon={app?.icon}
                        appName={app?.name ?? appSlug}
                        size="md"
                        className="rounded-lg [&_img]:object-contain"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {shortcutTitle}{" "}
                          {overlay.modification.isDeleted && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              Hidden
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {app?.name ?? appSlug} / {keymapTitle} /{" "}
                          {sectionTitle}
                        </p>
                      </div>
                      <ArrowUpRight
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
          <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Want to share an app with everyone? Export it, then contribute it
              on GitHub.
            </p>
            <Button variant="ghost" asChild className="self-start rounded-xl">
              <Link href="https://github.com/solomkinmv/hotkys#contributing-shortcuts">
                Contribution guide{" "}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      )}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!pending) setIsCreateOpen(open);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create an app</DialogTitle>
            <DialogDescription>
              Start with a name. You’ll add keymaps and shortcuts next.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
            className="space-y-6"
          >
            <AppMetadataFields
              draft={draft}
              onChange={(updates) => {
                if (updates.slug !== undefined) setSlugEdited(true);
                setDraft((prev) => ({
                  ...prev,
                  ...updates,
                  ...(updates.name !== undefined && !slugEdited
                    ? {
                        slug: updates.name
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, "")
                          .slice(0, USER_CONTENT_LIMITS.slug),
                      }
                    : {}),
                }));
              }}
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl"
                disabled={pending || !draft.name.trim()}
              >
                {pending ? "Creating…" : "Create App"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleteApp}
        onOpenChange={(open) => {
          if (!open && !pending) setDeleteApp(null);
        }}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete {deleteApp?.name}?</DialogTitle>
            <DialogDescription>
              This deletes the app and all its keymaps, sections, shortcuts, and
              saved favorites. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setDeleteApp(null)}
            >
              Keep app
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              {pending ? "Deleting…" : "Delete app"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {exportApp && (
        <ExportDialog
          app={exportApp}
          open
          onOpenChange={(open) => {
            if (!open) setExportApp(null);
          }}
        />
      )}
    </section>
  );
}
