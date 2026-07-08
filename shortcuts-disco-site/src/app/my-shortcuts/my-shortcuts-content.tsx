"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { getLoginHref } from "@/lib/auth/redirect";
import { useCustomizations } from "@/lib/hooks/use-customizations";
import { customizationsService } from "@/lib/services/customizations-service";
import { MyShortcutAppContent } from "./my-shortcut-app-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  TypographyH1,
  TypographyH3,
  TypographyMuted,
} from "@/components/ui/typography";
import { Plus, Trash2, Edit2, ExternalLink, Share2 } from "lucide-react";
import { ExportDialog } from "@/components/shortcuts/export-dialog";
import type { CustomApp } from "@/lib/model/user/user-models";

export function MyShortcutsContent() {
  const searchParams = useSearchParams();
  const selectedAppSlug = searchParams.get("app");
  const { user, isLoading: authLoading } = useAuth();
  const { customizations, isLoading: customizationsLoading, refetch } = useCustomizations();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [exportApp, setExportApp] = useState<CustomApp | null>(null);
  const [newAppName, setNewAppName] = useState("");
  const [newAppSlug, setNewAppSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (authLoading || customizationsLoading) {
    return (
      <section className="mx-auto max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-md text-center">
        <TypographyH1 className="mb-4">My Shortcuts</TypographyH1>
        <TypographyMuted className="mb-6">
          Sign in to create and manage custom shortcuts
        </TypographyMuted>
        <Button asChild>
          <Link href={getLoginHref("/my-shortcuts")}>Sign In</Link>
        </Button>
      </section>
    );
  }

  const handleCreateApp = async () => {
    if (!newAppName || !newAppSlug) return;

    setIsCreating(true);
    try {
      await customizationsService.createCustomApp({
        name: newAppName,
        slug: newAppSlug,
      }, user);
      await refetch();
      setIsCreateDialogOpen(false);
      setNewAppName("");
      setNewAppSlug("");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteApp = async (id: string) => {
    if (!confirm("Are you sure you want to delete this app and all its shortcuts?")) {
      return;
    }
    await customizationsService.deleteCustomApp(id, user);
    await refetch();
  };

  const customApps = customizations.customApps;
  const shortcutOverlays = customizations.shortcuts;

  if (selectedAppSlug) {
    return <MyShortcutAppContent slug={selectedAppSlug} />;
  }

  return (
    <section className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <TypographyH1>My Shortcuts</TypographyH1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New App
        </Button>
      </div>

      <div className="space-y-8">
        {customApps.length > 0 && (
          <div>
            <TypographyH3 className="mb-4">Custom Apps</TypographyH3>
            <div className="space-y-2">
              {customApps.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{app.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {app.keymaps.length} keymap(s) • {app.keymaps.reduce(
                        (acc, km) =>
                          acc +
                          km.sections.reduce(
                            (sAcc, s) => sAcc + s.shortcuts.length,
                            0
                          ),
                        0
                      )} shortcut(s)
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/my-shortcuts?app=${encodeURIComponent(app.slug)}`}>
                        <Edit2 className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExportApp(app)}
                      title="Export for contribution"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteApp(app.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {shortcutOverlays.length > 0 && (
          <div>
            <TypographyH3 className="mb-4">Modified Shortcuts</TypographyH3>
            <TypographyMuted className="mb-4">
              Shortcuts you&apos;ve customized from existing apps
            </TypographyMuted>
            <div className="space-y-2">
              {shortcutOverlays.map((overlay) => {
                const [appSlug, keymapTitle, sectionTitle, shortcutTitle] =
                  overlay.baseKey.split(":");
                return (
                  <div
                    key={overlay.baseKey}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <Link
                        href={`/apps/${appSlug}`}
                        className="hover:underline inline-flex items-center gap-1"
                      >
                        {appSlug}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <span className="text-muted-foreground">
                        {" / "}{keymapTitle} / {sectionTitle} / {shortcutTitle}
                      </span>
                      {overlay.modification.isDeleted && (
                        <span className="ml-2 text-xs text-destructive">
                          (hidden)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {customApps.length === 0 && shortcutOverlays.length === 0 && (
          <div className="text-center py-8">
            <TypographyMuted className="mb-4">
              You haven&apos;t created any custom shortcuts yet.
            </TypographyMuted>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First App
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New App</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">App Name</Label>
              <Input
                id="name"
                value={newAppName}
                onChange={(e) => {
                  setNewAppName(e.target.value);
                  setNewAppSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, "")
                  );
                }}
                placeholder="e.g., My Custom App"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={newAppSlug}
                onChange={(e) => setNewAppSlug(e.target.value)}
                placeholder="e.g., my-custom-app"
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs and for identification
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateApp}
              disabled={isCreating || !newAppName || !newAppSlug}
            >
              {isCreating ? "Creating..." : "Create App"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {exportApp && (
        <ExportDialog
          app={exportApp}
          open={!!exportApp}
          onOpenChange={(open) => {
            if (!open) setExportApp(null);
          }}
        />
      )}
    </section>
  );
}
