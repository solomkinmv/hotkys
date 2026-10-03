"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Layers,
  LockKeyhole,
  Plus,
  Settings2,
  Share2,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getLoginHref } from "@/lib/auth/redirect";
import { useCustomizations } from "@/lib/hooks/use-customizations";
import { customizationsService } from "@/lib/services/customizations-service";
import { privateAppsService } from "@/lib/services/private-apps-service";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { PrivateContentActions } from "@/components/shortcuts/private-content-actions";
import { ShortcutMerger } from "@/lib/services/shortcut-merger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppIcon } from "@/components/ui/app-icon";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AppMetadataFields,
  type AppDraft,
} from "@/components/shortcuts/app-metadata-fields";
import {
  ShortcutFields,
  type ShortcutDraft,
} from "@/components/shortcuts/shortcut-fields";
import { ShortcutMethod } from "@/components/shortcuts/shortcut-method";
import { ExportDialog } from "@/components/shortcuts/export-dialog";
import type { Platform } from "@/lib/model/internal/internal-models";
import type {
  CustomSection,
  CustomShortcut,
} from "@/lib/model/user/user-models";
import {
  assertResourceLimit,
  USER_CONTENT_LIMITS,
} from "@/lib/validation/user-content";

const emptyShortcutDraft: ShortcutDraft = { title: "", key: "", comment: "" };
type EditorDialog =
  | { type: "app" }
  | { type: "keymap"; id?: string }
  | { type: "section"; keymapId: string; id?: string }
  | { type: "shortcut"; section: CustomSection; item?: CustomShortcut };
type DeleteTarget = {
  entity: "keymap" | "section" | "shortcut";
  id: string;
  title: string;
  descendants: number;
};

export function MyShortcutAppContent({
  slug,
  keymapId,
}: {
  slug: string;
  keymapId?: string;
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const {
    customizations,
    isLoading,
    error: loadError,
    refetch,
  } = useCustomizations();
  const app = customizations.customApps.find((a) => a.slug === slug);
  const { refetch: refetchFavorites } = useFavorites();
  const [selectedKeymapId, setSelectedKeymapId] = useState<string>(
    keymapId ?? "",
  );
  const [dialog, setDialog] = useState<EditorDialog | null>(null);
  const [appDraft, setAppDraft] = useState<AppDraft>({
    name: "",
    slug: "",
    bundleId: "",
    icon: "",
  });
  const [title, setTitle] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([
    "macos",
    "windows",
    "linux",
  ]);
  const [shortcutDraft, setShortcutDraft] = useState(emptyShortcutDraft);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [destinationSectionId, setDestinationSectionId] = useState("");
  const visitedAnchor = useRef("");
  useEffect(() => {
    if (isLoading || !app || !window.location.hash) return;
    const anchor = window.location.hash.slice(1);
    if (visitedAnchor.current === anchor) return;
    const element = document.getElementById(anchor);
    if (element) {
      element.scrollIntoView({ block: "center" });
      visitedAnchor.current = anchor;
    }
  }, [app, isLoading, selectedKeymapId]);
  const closeDialog = () => {
    if (!pending) {
      setDialog(null);
      setError(null);
    }
  };

  if (authLoading || isLoading)
    return (
      <section
        className="mx-auto max-w-6xl"
        role="status"
        aria-label="Loading app"
      >
        <div className="h-20 w-64 animate-pulse rounded-xl bg-muted" />
        <div className="mt-8 h-60 animate-pulse rounded-2xl border bg-muted/40" />
      </section>
    );
  if (!user)
    return (
      <section className="mx-auto max-w-6xl rounded-2xl border bg-card p-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Your custom shortcuts
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in to manage your private app.
        </p>
        <Button asChild className="mt-6 rounded-xl">
          <Link
            href={getLoginHref(`/my-shortcuts?app=${encodeURIComponent(slug)}`)}
          >
            Sign In <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </section>
    );
  if (loadError)
    return (
      <section
        className="mx-auto max-w-6xl rounded-2xl border bg-card p-6"
        role="alert"
      >
        <h1 className="text-2xl font-semibold tracking-tight">
          Couldn’t load this app
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {error ?? loadError}
        </p>
        <Button
          variant="outline"
          className="mt-5 rounded-xl"
          onClick={async () => {
            try {
              await Promise.all([refetch(), refetchFavorites()]);
              setError(null);
            } catch {}
          }}
        >
          Retry loading
        </Button>
      </section>
    );
  if (!app)
    return (
      <section className="mx-auto max-w-6xl rounded-2xl border border-dashed p-8">
        <h1 className="text-3xl font-semibold tracking-tight">App not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This private app may have been deleted or renamed.
        </p>
        <Button asChild variant="outline" className="mt-6 rounded-xl">
          <Link href="/my-shortcuts">Back to My Shortcuts</Link>
        </Button>
      </section>
    );

  const keymaps = [...app.keymaps].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const keymap = keymaps.find((k) => k.id === selectedKeymapId) ?? keymaps[0];
  const sections = [...(keymap?.sections ?? [])]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((section) => ({
      ...section,
      shortcuts: [...section.shortcuts].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
    }));
  const reload = () => Promise.all([refetch(), refetchFavorites()]);
  const runMutation = async (
    mutate: () => Promise<unknown>,
    afterSave?: () => void,
  ) => {
    if (pending) return;
    setPending(true);
    setError(null);
    let wasSaved = false;
    try {
      await mutate();
      wasSaved = true;
      afterSave?.();
      await reload();
    } catch (error) {
      setError(
        wasSaved
          ? "Saved successfully, but couldn’t reload the app. Retry loading to see your changes."
          : error instanceof Error
            ? error.message
            : "Unable to save. Please try again.",
      );
    } finally {
      setPending(false);
    }
  };
  const moveInOrder = (
    entity: DeleteTarget["entity"],
    parentId: string,
    items: { id: string; isDeleted?: boolean }[],
    id: string,
    direction: number,
  ) => {
    const index = items.findIndex((item) => item.id === id);
    let other = index + direction;
    while (
      entity === "shortcut" &&
      other >= 0 &&
      other < items.length &&
      items[other].isDeleted
    )
      other += direction;
    if (index < 0 || other < 0 || other >= items.length) return;
    const orderedIds = items.map((item) => item.id);
    [orderedIds[index], orderedIds[other]] = [
      orderedIds[other],
      orderedIds[index],
    ];
    void runMutation(() =>
      privateAppsService.reorder(app.id, entity, parentId, orderedIds, user),
    );
  };
  const requestDelete = (target: DeleteTarget) => {
    setError(null);
    setDeleteTarget(target);
  };
  const handleDelete = () => {
    if (!deleteTarget) return;
    const { entity, id } = deleteTarget;
    const remove =
      entity === "keymap"
        ? privateAppsService.deleteKeymap
        : entity === "section"
          ? privateAppsService.deleteSection
          : privateAppsService.deleteShortcut;
    void runMutation(
      () => remove.call(privateAppsService, app.id, id, user),
      () => setDeleteTarget(null),
    );
  };
  const mergedApp = new ShortcutMerger(customizations).mergeShortcuts([], {
    ...customizations,
    customApps: [app],
  })[0];
  const parsedShortcuts = new Map(
    mergedApp.keymaps.flatMap((k) =>
      k.sections.flatMap((s) =>
        s.hotkeys.map(
          (shortcut) => [shortcut.customizationId, shortcut] as const,
        ),
      ),
    ),
  );
  const openDialog = (next: EditorDialog) => {
    if (pending) return;
    setError(null);
    if (next.type === "app")
      setAppDraft({
        name: app.name,
        slug: app.slug,
        bundleId: app.bundleId ?? "",
        icon: app.icon ?? "",
        hostname: app.hostname ?? "",
        source: app.source ?? "",
      });
    if (next.type === "keymap") {
      setPlatforms(
        next.id
          ? (keymaps.find((k) => k.id === next.id)?.platforms ?? [
              "macos",
              "windows",
              "linux",
            ])
          : ["macos", "windows", "linux"],
      );
      setTitle(
        next.id
          ? (keymaps.find((k) => k.id === next.id)?.title ?? "")
          : app.keymaps.length
            ? ""
            : "Default",
      );
    }
    if (next.type === "section")
      setTitle(
        next.id
          ? (keymap?.sections.find((s) => s.id === next.id)?.title ?? "")
          : keymap?.sections.length
            ? ""
            : "General",
      );
    if (next.type === "shortcut") {
      setShortcutDraft(
        next.item
          ? {
              title: next.item.title,
              key: next.item.key ?? "",
              comment: next.item.comment ?? "",
            }
          : emptyShortcutDraft,
      );
      setDestinationSectionId(next.section.id);
    }
    setDialog(next);
  };
  const handleSave = async () => {
    if (!dialog || pending) return;
    setPending(true);
    setError(null);
    let wasSaved = false;
    try {
      if (dialog.type === "app") {
        await customizationsService.updateCustomApp(
          app.id,
          {
            name: appDraft.name.trim(),
            slug: appDraft.slug.trim(),
            bundleId: appDraft.bundleId.trim() || null,
            icon: appDraft.icon.trim() || null,
            hostname: appDraft.hostname?.trim() || null,
            source: appDraft.source?.trim() || null,
          },
          user,
        );
      } else if (dialog.type === "keymap" && dialog.id) {
        await customizationsService.updateCustomKeymap(
          dialog.id,
          { title: title.trim(), platforms },
          user,
        );
      } else if (dialog.type === "section" && dialog.id) {
        await privateAppsService.updateSection(
          app.id,
          dialog.id,
          { title: title.trim() },
          user,
        );
      } else if (dialog.type === "shortcut" && dialog.item) {
        await privateAppsService.updateShortcut(
          app.id,
          dialog.item.id,
          {
            title: shortcutDraft.title.trim(),
            key: shortcutDraft.key.trim() || undefined,
            comment: shortcutDraft.comment.trim() || undefined,
            sectionId: destinationSectionId,
          },
          user,
        );
      } else if (dialog.type === "keymap") {
        assertResourceLimit(
          customizations.customKeymaps.length +
            customizations.customApps.reduce((n, a) => n + a.keymaps.length, 0),
          USER_CONTENT_LIMITS.customKeymaps,
          "custom keymaps",
        );
        const created = await customizationsService.createCustomKeymap(
          {
            customAppId: app.id,
            title: title.trim(),
            platforms,
            sortOrder: app.keymaps.length,
          },
          user,
        );
        setSelectedKeymapId(created.id);
      } else if (dialog.type === "section") {
        const count = [
          ...customizations.customKeymaps,
          ...customizations.customApps.flatMap((a) => a.keymaps),
        ].reduce((n, k) => n + k.sections.length, 0);
        assertResourceLimit(
          count,
          USER_CONTENT_LIMITS.customSections,
          "custom sections",
        );
        await customizationsService.createCustomSection(
          {
            keymapId: dialog.keymapId,
            title: title.trim(),
            sortOrder: keymap?.sections.length ?? 0,
          },
          user,
        );
      } else {
        const count = [
          ...customizations.customKeymaps,
          ...customizations.customApps.flatMap((a) => a.keymaps),
        ].reduce(
          (n, k) => n + k.sections.reduce((m, s) => m + s.shortcuts.length, 0),
          customizations.shortcuts.length,
        );
        assertResourceLimit(
          count,
          USER_CONTENT_LIMITS.customShortcuts,
          "custom shortcuts",
        );
        await customizationsService.createCustomShortcut(
          {
            sectionId: dialog.section.id,
            title: shortcutDraft.title.trim(),
            key: shortcutDraft.key.trim() || undefined,
            comment: shortcutDraft.comment.trim() || undefined,
            isDeleted: false,
            sortOrder: dialog.section.shortcuts.length,
          },
          user,
        );
      }
      wasSaved = true;
      setDialog(null);
      if (dialog.type === "app" && appDraft.slug.trim() !== slug)
        router.replace(
          `/my-shortcuts?app=${encodeURIComponent(appDraft.slug.trim())}`,
        );
      await reload();
    } catch (error) {
      setError(
        wasSaved
          ? "Saved successfully, but couldn’t reload the app. Retry loading to see your changes."
          : error instanceof Error
            ? error.message
            : "Unable to save. Your draft is still here.",
      );
    } finally {
      setPending(false);
    }
  };
  const canSave =
    dialog?.type === "app"
      ? !!(appDraft.name.trim() && appDraft.slug.trim())
      : dialog?.type === "shortcut"
        ? !!(
            shortcutDraft.title.trim() &&
            (shortcutDraft.key.trim() || shortcutDraft.comment.trim())
          )
        : !!title.trim() && (dialog?.type !== "keymap" || platforms.length > 0);

  return (
    <section className="mx-auto max-w-6xl">
      {error && !dialog && !deleteTarget && (
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
                await reload();
                setError(null);
              } catch {
                setError("Unable to reload the app. Please try again.");
              } finally {
                setPending(false);
              }
            }}
          >
            Retry loading
          </Button>
        </div>
      )}
      <Link
        href="/my-shortcuts"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        My shortcuts
      </Link>
      <div className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex items-start gap-5">
          <AppIcon
            icon={app.icon}
            appName={app.name}
            size="md"
            className="size-14 rounded-2xl [&_img]:object-contain [&_span]:text-xl"
          />
          <div className="min-w-0">
            <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <LockKeyhole className="size-3" aria-hidden="true" />
              Private app
            </p>
            <h1 className="break-words text-3xl font-semibold tracking-[-0.045em] md:text-4xl">
              {app.name}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Build your own shortcut collection.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <FavoriteButton
            itemType="app"
            appSlug={`custom-${app.slug}`}
            customAppId={app.id}
            label={app.name}
          />
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => openDialog({ type: "app" })}
          >
            <Settings2 className="size-4" aria-hidden="true" />
            App details
          </Button>
          <Button
            variant="ghost"
            className="rounded-xl"
            onClick={() => setExportOpen(true)}
          >
            <Share2 className="size-4" aria-hidden="true" />
            Export
          </Button>
        </div>
      </div>
      {!keymap ? (
        <div className="grid gap-6 rounded-2xl border border-dashed bg-card p-6 sm:grid-cols-[1fr_auto] sm:items-center md:p-10">
          <div>
            <span className="mb-5 flex size-12 items-center justify-center rounded-xl border bg-muted/50 text-brand">
              <Layers className="size-5" aria-hidden="true" />
            </span>
            <h2 className="text-2xl font-semibold tracking-tight">
              First, add a keymap.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              A keymap is a set of shortcuts, such as Default or a layout for a
              different platform. Then you can organize shortcuts into sections.
            </p>
          </div>
          <Button
            className="self-start rounded-xl"
            onClick={() => openDialog({ type: "keymap" })}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add keymap
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={keymap.id} onValueChange={setSelectedKeymapId}>
                <SelectTrigger
                  aria-label="Choose keymap"
                  className="h-11 w-full rounded-xl bg-card sm:w-64"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {keymaps.map((k) => (
                    <SelectItem value={k.id} key={k.id}>
                      {k.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FavoriteButton
                itemType="keymap"
                appSlug={`custom-${app.slug}`}
                customKeymapId={keymap.id}
                label={`${keymap.title} keymap`}
              />
              <PrivateContentActions
                label={`keymap ${keymap.title}`}
                disabled={pending}
                onEdit={() => openDialog({ type: "keymap", id: keymap.id })}
                onDelete={() =>
                  requestDelete({
                    entity: "keymap",
                    id: keymap.id,
                    title: keymap.title,
                    descendants: keymap.sections.reduce(
                      (n, s) => n + 1 + s.shortcuts.length,
                      0,
                    ),
                  })
                }
                onMoveUp={
                  keymaps[0]?.id !== keymap.id
                    ? () =>
                        moveInOrder("keymap", app.id, keymaps, keymap.id, -1)
                    : undefined
                }
                onMoveDown={
                  keymaps.at(-1)?.id !== keymap.id
                    ? () => moveInOrder("keymap", app.id, keymaps, keymap.id, 1)
                    : undefined
                }
              />
              <Button
                variant="ghost"
                className="rounded-xl"
                onClick={() => openDialog({ type: "keymap" })}
              >
                <Plus className="size-4" aria-hidden="true" />
                Add keymap
              </Button>
            </div>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() =>
                openDialog({ type: "section", keymapId: keymap.id })
              }
            >
              <Plus className="size-4" aria-hidden="true" />
              Add section
            </Button>
          </div>
          {keymap.sections.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-12 text-center">
              <h2 className="text-xl font-semibold tracking-tight">
                Give your shortcuts a home.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Use Add section above to create a group like Navigation,
                Editing, or General.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {sections.map((section) => (
                <section
                  key={section.id}
                  id={`section-${section.id}`}
                  aria-label={section.title}
                  className="rounded-2xl border bg-card p-3 sm:p-4"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-2 pt-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold tracking-tight">
                        {section.title}
                      </h2>
                      <span className="font-mono text-xs text-muted-foreground">
                        {section.shortcuts.filter((s) => !s.isDeleted).length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg"
                        onClick={() =>
                          openDialog({ type: "shortcut", section })
                        }
                        aria-label={`Add shortcut to ${section.title}`}
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                        Add shortcut
                      </Button>
                      <PrivateContentActions
                        label={`section ${section.title}`}
                        disabled={pending}
                        onEdit={() =>
                          openDialog({
                            type: "section",
                            keymapId: keymap.id,
                            id: section.id,
                          })
                        }
                        onDelete={() =>
                          requestDelete({
                            entity: "section",
                            id: section.id,
                            title: section.title,
                            descendants: section.shortcuts.length,
                          })
                        }
                        onMoveUp={
                          sections[0]?.id !== section.id
                            ? () =>
                                moveInOrder(
                                  "section",
                                  keymap.id,
                                  sections,
                                  section.id,
                                  -1,
                                )
                            : undefined
                        }
                        onMoveDown={
                          sections.at(-1)?.id !== section.id
                            ? () =>
                                moveInOrder(
                                  "section",
                                  keymap.id,
                                  sections,
                                  section.id,
                                  1,
                                )
                            : undefined
                        }
                      />
                    </div>
                  </div>
                  {section.shortcuts.filter((s) => !s.isDeleted).length ? (
                    [...section.shortcuts]
                      .filter((s) => !s.isDeleted)
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((item) => {
                        const shortcut = parsedShortcuts.get(item.id);
                        return shortcut ? (
                          <div
                            key={shortcut.customizationId}
                            id={`shortcut-${item.id}`}
                            className="scroll-mt-24 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 rounded-xl px-3 py-4 text-sm odd:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-5"
                          >
                            <button
                              type="button"
                              className="col-start-1 row-start-1 rounded-sm text-left font-medium hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                              onClick={() =>
                                openDialog({ type: "shortcut", section, item })
                              }
                            >
                              {shortcut.title}
                            </button>
                            <ShortcutMethod
                              shortcut={shortcut}
                              className="col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1"
                            />
                            <div className="col-start-2 row-start-1 flex items-center sm:col-start-3">
                              <FavoriteButton
                                itemType="shortcut"
                                appSlug={`custom-${app.slug}`}
                                customShortcutId={item.id}
                                label={item.title}
                              />
                              <PrivateContentActions
                                label={`shortcut ${item.title}`}
                                disabled={pending}
                                onEdit={() =>
                                  openDialog({
                                    type: "shortcut",
                                    section,
                                    item,
                                  })
                                }
                                onDelete={() =>
                                  requestDelete({
                                    entity: "shortcut",
                                    id: item.id,
                                    title: item.title,
                                    descendants: 0,
                                  })
                                }
                                onMoveUp={
                                  section.shortcuts.length > 1 &&
                                  section.shortcuts.filter(
                                    (s) => !s.isDeleted,
                                  )[0]?.id !== item.id
                                    ? () =>
                                        moveInOrder(
                                          "shortcut",
                                          section.id,
                                          section.shortcuts,
                                          item.id,
                                          -1,
                                        )
                                    : undefined
                                }
                                onMoveDown={
                                  section.shortcuts.length > 1 &&
                                  section.shortcuts
                                    .filter((s) => !s.isDeleted)
                                    .at(-1)?.id !== item.id
                                    ? () =>
                                        moveInOrder(
                                          "shortcut",
                                          section.id,
                                          section.shortcuts,
                                          item.id,
                                          1,
                                        )
                                    : undefined
                                }
                              />
                            </div>
                          </div>
                        ) : null;
                      })
                  ) : (
                    <p className="px-2 pb-5 text-sm leading-relaxed text-muted-foreground">
                      No shortcuts yet. Add keys, a mouse action, or a gesture.
                    </p>
                  )}
                </section>
              ))}
            </div>
          )}
        </>
      )}
      <Dialog
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialog?.type === "app"
                ? "App details"
                : dialog?.type === "keymap"
                  ? dialog.id
                    ? "Edit keymap"
                    : "Add keymap"
                  : dialog?.type === "section"
                    ? dialog.id
                      ? "Edit section"
                      : "Add section"
                    : dialog?.type === "shortcut" && dialog.item
                      ? "Edit shortcut"
                      : "Add shortcut"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.type === "app"
                ? "Update this private app’s name, icon, and details."
                : dialog?.type === "keymap"
                  ? "Choose a name for this set of shortcuts."
                  : dialog?.type === "section"
                    ? "Group related actions together, such as Navigation or Editing."
                    : dialog?.type === "shortcut" && dialog.item
                      ? "Change this private action’s keys, instructions, or section."
                      : `Add an action to ${dialog?.type === "shortcut" ? dialog.section.title : "this section"}. It will be saved to your account.`}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            {dialog?.type === "app" ? (
              <AppMetadataFields
                draft={appDraft}
                onChange={(updates) =>
                  setAppDraft((prev) => ({ ...prev, ...updates }))
                }
              />
            ) : (
              <FieldGroup className="gap-5 py-2">
                {dialog?.type === "shortcut" ? (
                  <>
                    {dialog.item && (
                      <Field>
                        <FieldLabel htmlFor="shortcut-destination">
                          Section
                        </FieldLabel>
                        <Select
                          value={destinationSectionId}
                          onValueChange={setDestinationSectionId}
                        >
                          <SelectTrigger
                            id="shortcut-destination"
                            aria-label="Shortcut section"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {keymaps.flatMap((k) =>
                              k.sections.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {k.title} / {s.title}
                                </SelectItem>
                              )),
                            )}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                    <ShortcutFields
                      draft={shortcutDraft}
                      onChange={(updates) =>
                        setShortcutDraft((prev) => ({ ...prev, ...updates }))
                      }
                    />
                  </>
                ) : (
                  <Field>
                    <FieldLabel htmlFor="editor-title">
                      {dialog?.type === "keymap"
                        ? "Keymap name"
                        : "Section name"}
                    </FieldLabel>
                    <Input
                      id="editor-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={
                        dialog?.type === "keymap"
                          ? USER_CONTENT_LIMITS.keymapTitle
                          : USER_CONTENT_LIMITS.sectionTitle
                      }
                      placeholder={
                        dialog?.type === "keymap" ? "Default" : "General"
                      }
                      autoFocus
                    />
                    {dialog?.type === "keymap" && (
                      <fieldset className="mt-3 space-y-3">
                        <legend className="text-sm font-medium">
                          Platforms
                        </legend>
                        <div className="flex flex-wrap gap-4">
                          {(["macos", "windows", "linux"] as const).map(
                            (platform) => (
                              <label
                                key={platform}
                                className="flex items-center gap-2 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={platforms.includes(platform)}
                                  onChange={(e) =>
                                    setPlatforms((previous) =>
                                      e.target.checked
                                        ? [...previous, platform]
                                        : previous.filter(
                                            (p) => p !== platform,
                                          ),
                                    )
                                  }
                                />
                                {platform === "macos"
                                  ? "macOS"
                                  : platform === "windows"
                                    ? "Windows"
                                    : "Linux"}
                              </label>
                            ),
                          )}
                        </div>
                      </fieldset>
                    )}
                  </Field>
                )}
              </FieldGroup>
            )}
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
                onClick={closeDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl"
                disabled={pending || !canSave}
              >
                {pending
                  ? "Saving…"
                  : dialog?.type === "app"
                    ? "Save App"
                    : dialog?.type === "keymap"
                      ? dialog.id
                        ? "Save keymap"
                        : "Create keymap"
                      : dialog?.type === "section"
                        ? dialog.id
                          ? "Save section"
                          : "Create section"
                        : "Save shortcut"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setDeleteTarget(null);
            setError(null);
          }
        }}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.title}?</DialogTitle>
            <DialogDescription>
              This permanently deletes this {deleteTarget?.entity}
              {deleteTarget?.descendants
                ? ` and all content inside it (${deleteTarget.descendants} items)`
                : ""}
              . Saved favorites for the deleted content are removed too. This
              cannot be undone.
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
              onClick={() => {
                setDeleteTarget(null);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              {pending
                ? "Deleting…"
                : `Delete ${deleteTarget?.entity ?? "item"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ExportDialog app={app} open={exportOpen} onOpenChange={setExportOpen} />
    </section>
  );
}
