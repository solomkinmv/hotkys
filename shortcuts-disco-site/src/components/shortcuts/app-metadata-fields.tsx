"use client";

import { ChevronDown } from "lucide-react";
import { AppIcon } from "@/components/ui/app-icon";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { USER_CONTENT_LIMITS } from "@/lib/validation/user-content";

export interface AppDraft {
  name: string;
  slug: string;
  bundleId: string;
  icon: string;
  hostname?: string;
  source?: string;
}
export function AppMetadataFields({
  draft,
  onChange,
}: {
  draft: AppDraft;
  onChange: (updates: Partial<AppDraft>) => void;
}) {
  return (
    <FieldGroup className="gap-5">
      <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
        <AppIcon
          icon={draft.icon || undefined}
          appName={draft.name || "New app"}
          size="md"
          className="size-12 rounded-xl [&_img]:object-contain [&_span]:text-lg"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {draft.name || "Your new app"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Private to your account
          </p>
        </div>
      </div>
      <Field>
        <FieldLabel htmlFor="app-name">App Name</FieldLabel>
        <Input
          id="app-name"
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
          maxLength={USER_CONTENT_LIMITS.appName}
          placeholder="e.g., Local Tool"
          autoFocus
        />
      </Field>
      <details className="group rounded-xl border p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium">
          Icon and app details{" "}
          <ChevronDown
            className="size-4 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <FieldGroup className="mt-5 gap-4">
          <Field>
            <FieldLabel htmlFor="app-icon">Image path</FieldLabel>
            <Input
              id="app-icon"
              value={draft.icon}
              onChange={(e) => onChange({ icon: e.target.value })}
              maxLength={USER_CONTENT_LIMITS.urlOrPath}
              placeholder="https://… or /icons/my-app.png"
            />
            <FieldDescription>
              Optional. We’ll make a text icon if you leave this blank.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="app-bundle-id">Bundle ID</FieldLabel>
            <Input
              id="app-bundle-id"
              value={draft.bundleId}
              onChange={(e) => onChange({ bundleId: e.target.value })}
              maxLength={USER_CONTENT_LIMITS.bundleId}
              placeholder="com.example.app"
            />
            <FieldDescription>
              Optional. Identifies the macOS app for Raycast.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="app-hostname">Hostname</FieldLabel>
            <Input
              id="app-hostname"
              value={draft.hostname ?? ""}
              onChange={(e) => onChange({ hostname: e.target.value })}
              maxLength={USER_CONTENT_LIMITS.hostname}
              placeholder="example.com"
            />
            <FieldDescription>
              Optional. Identifies a website for Raycast.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="app-source">Source URL</FieldLabel>
            <Input
              id="app-source"
              type="url"
              value={draft.source ?? ""}
              onChange={(e) => onChange({ source: e.target.value })}
              maxLength={USER_CONTENT_LIMITS.urlOrPath}
              placeholder="https://example.com/shortcuts"
            />
            <FieldDescription>
              Optional. Where these shortcuts are documented.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="app-slug">Slug</FieldLabel>
            <Input
              id="app-slug"
              value={draft.slug}
              onChange={(e) => onChange({ slug: e.target.value })}
              maxLength={USER_CONTENT_LIMITS.slug}
              placeholder="local-tool"
            />
            <FieldDescription>
              Used in the app’s address. Letters, numbers, and hyphens.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </details>
    </FieldGroup>
  );
}
