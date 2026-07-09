"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { getLoginHref } from "@/lib/auth/redirect";
import { useCustomizations } from "@/lib/hooks/use-customizations";
import { customizationsService } from "@/lib/services/customizations-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ShortcutKeyInput } from "@/components/shortcuts/shortcut-key-input";
import {
  TypographyH1,
  TypographyH3,
  TypographyMuted,
} from "@/components/ui/typography";
import type { CustomSection } from "@/lib/model/user/user-models";

interface MyShortcutAppContentProps {
  slug: string;
}

interface ShortcutDraft {
  title: string;
  key: string;
  comment: string;
}

const emptyShortcutDraft: ShortcutDraft = {
  title: "",
  key: "",
  comment: "",
};

export function MyShortcutAppContent({ slug }: MyShortcutAppContentProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const {
    customizations,
    isLoading: customizationsLoading,
    refetch,
  } = useCustomizations();
  const app = customizations.customApps.find((customApp) => customApp.slug === slug);

  const [appName, setAppName] = useState("");
  const [appSlug, setAppSlug] = useState(slug);
  const [appBundleId, setAppBundleId] = useState("");
  const [appIcon, setAppIcon] = useState("");
  const [newKeymapTitle, setNewKeymapTitle] = useState("");
  const [newSectionTitles, setNewSectionTitles] = useState<Record<string, string>>(
    {}
  );
  const [shortcutDrafts, setShortcutDrafts] = useState<
    Record<string, ShortcutDraft>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!app) return;
    setAppName(app.name);
    setAppSlug(app.slug);
    setAppBundleId(app.bundleId ?? "");
    setAppIcon(app.icon ?? "");
  }, [app]);

  const runAction = async (action: () => Promise<void>) => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await action();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save changes."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updateShortcutDraft = (
    sectionId: string,
    updates: Partial<ShortcutDraft>
  ) => {
    setShortcutDrafts((prev) => ({
      ...prev,
      [sectionId]: {
        ...emptyShortcutDraft,
        ...prev[sectionId],
        ...updates,
      },
    }));
  };

  if (authLoading || customizationsLoading) {
    return (
      <section className="mx-auto max-w-3xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 rounded bg-muted" />
          <div className="h-24 rounded bg-muted" />
          <div className="h-24 rounded bg-muted" />
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-md text-center">
        <TypographyH1 className="mb-4">Edit Custom Shortcuts</TypographyH1>
        <TypographyMuted className="mb-6">
          Sign in to manage your custom shortcuts
        </TypographyMuted>
        <Button asChild>
          <Link href={getLoginHref(`/my-shortcuts?app=${encodeURIComponent(slug)}`)}>
            Sign In
          </Link>
        </Button>
      </section>
    );
  }

  if (!app) {
    return (
      <section className="mx-auto max-w-md text-center">
        <TypographyH1 className="mb-4">Custom App Not Found</TypographyH1>
        <TypographyMuted className="mb-6">
          This custom app may have been deleted or renamed.
        </TypographyMuted>
        <Button asChild>
          <Link href="/my-shortcuts">Back to My Shortcuts</Link>
        </Button>
      </section>
    );
  }

  const handleSaveApp = () =>
    runAction(async () => {
      await customizationsService.updateCustomApp(app.id, {
        name: appName,
        slug: appSlug,
        bundleId: appBundleId.trim() || undefined,
        hostname: app.hostname,
        source: app.source,
        icon: appIcon.trim() || undefined,
      }, user);
      await refetch();
      if (appSlug !== slug) {
        router.replace(`/my-shortcuts?app=${encodeURIComponent(appSlug)}`);
      }
    });

  const handleCreateKeymap = () =>
    runAction(async () => {
      if (!newKeymapTitle.trim()) return;
      await customizationsService.createCustomKeymap({
        customAppId: app.id,
        title: newKeymapTitle.trim(),
      }, user);
      setNewKeymapTitle("");
      await refetch();
    });

  const handleCreateSection = (keymapId: string, sortOrder: number) =>
    runAction(async () => {
      const title = newSectionTitles[keymapId]?.trim();
      if (!title) return;
      await customizationsService.createCustomSection({
        keymapId,
        title,
        sortOrder,
      }, user);
      setNewSectionTitles((prev) => ({ ...prev, [keymapId]: "" }));
      await refetch();
    });

  const handleCreateShortcut = (section: CustomSection) =>
    runAction(async () => {
      const draft = shortcutDrafts[section.id] ?? emptyShortcutDraft;
      if (!draft.title.trim()) return;
      await customizationsService.createCustomShortcut({
        sectionId: section.id,
        title: draft.title.trim(),
        key: draft.key.trim() || undefined,
        comment: draft.comment.trim() || undefined,
        isDeleted: false,
        sortOrder: section.shortcuts.length,
      }, user);
      setShortcutDrafts((prev) => ({ ...prev, [section.id]: emptyShortcutDraft }));
      await refetch();
    });

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/my-shortcuts">
          <ArrowLeft className="mr-2 h-4 w-4" />
          My Shortcuts
        </Link>
      </Button>

      <div className="flex items-center justify-between gap-4">
        <TypographyH1>{app.name}</TypographyH1>
        <Button onClick={handleSaveApp} disabled={isSaving || !appName || !appSlug}>
          <Save className="mr-2 h-4 w-4" />
          Save App
        </Button>
      </div>

      {errorMessage && (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}

      <FieldGroup className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="custom-app-name">App Name</FieldLabel>
          <Input
            id="custom-app-name"
            value={appName}
            onChange={(event) => setAppName(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="custom-app-slug">Slug</FieldLabel>
          <Input
            id="custom-app-slug"
            value={appSlug}
            onChange={(event) => setAppSlug(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="custom-app-bundle-id">Bundle ID</FieldLabel>
          <Input
            id="custom-app-bundle-id"
            value={appBundleId}
            onChange={(event) => setAppBundleId(event.target.value)}
            placeholder="com.example.app"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="custom-app-image-path">Image path</FieldLabel>
          <Input
            id="custom-app-image-path"
            value={appIcon}
            onChange={(event) => setAppIcon(event.target.value)}
            placeholder="/custom-icons/my-app.png or https://..."
          />
        </Field>
      </FieldGroup>

      <div className="rounded-lg border p-4">
        <TypographyH3 className="mb-4">Keymaps</TypographyH3>
        <div className="flex gap-2">
          <Input
            value={newKeymapTitle}
            onChange={(event) => setNewKeymapTitle(event.target.value)}
            placeholder="Keymap title"
          />
          <Button onClick={handleCreateKeymap} disabled={isSaving}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {app.keymaps.length === 0 ? (
        <TypographyMuted>
          Add a keymap to start organizing this app&apos;s shortcuts.
        </TypographyMuted>
      ) : (
        app.keymaps.map((keymap) => (
          <div key={keymap.id} className="space-y-4 rounded-lg border p-4">
            <TypographyH3>{keymap.title}</TypographyH3>

            <div className="flex gap-2">
              <Input
                value={newSectionTitles[keymap.id] ?? ""}
                onChange={(event) =>
                  setNewSectionTitles((prev) => ({
                    ...prev,
                    [keymap.id]: event.target.value,
                  }))
                }
                placeholder="Section title"
              />
              <Button
                onClick={() =>
                  handleCreateSection(keymap.id, keymap.sections.length)
                }
                disabled={isSaving}
              >
                <Plus className="mr-2 h-4 w-4" />
                Section
              </Button>
            </div>

            {keymap.sections.map((section) => {
              const draft = shortcutDrafts[section.id] ?? emptyShortcutDraft;
              return (
                <div key={section.id} className="space-y-3 rounded-md border p-3">
                  <div>
                    <div className="font-medium">{section.title}</div>
                    <TypographyMuted className="text-sm">
                      {section.shortcuts.length} shortcut(s)
                    </TypographyMuted>
                  </div>

                  {section.shortcuts.length > 0 && (
                    <div className="space-y-2">
                      {section.shortcuts.map((shortcut) => (
                        <div
                          key={shortcut.id}
                          className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm"
                        >
                          <span>{shortcut.title}</span>
                          {shortcut.key && (
                            <span className="text-muted-foreground">
                              {shortcut.key}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
                    <Input
                      value={draft.title}
                      onChange={(event) =>
                        updateShortcutDraft(section.id, {
                          title: event.target.value,
                        })
                      }
                      placeholder="Shortcut title"
                    />
                    <ShortcutKeyInput
                      value={draft.key}
                      onChange={(value) =>
                        updateShortcutDraft(section.id, { key: value })
                      }
                      inputAriaLabel="Shortcut keys"
                      placeholder="Keys, e.g. cmd+k"
                    />
                    <Input
                      value={draft.comment}
                      onChange={(event) =>
                        updateShortcutDraft(section.id, {
                          comment: event.target.value,
                        })
                      }
                      placeholder="Comment"
                    />
                    <Button
                      onClick={() => handleCreateShortcut(section)}
                      disabled={isSaving}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Shortcut
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}
    </section>
  );
}
