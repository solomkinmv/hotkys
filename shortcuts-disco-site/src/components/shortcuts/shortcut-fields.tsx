"use client";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ShortcutKeyInput } from "./shortcut-key-input";
import { USER_CONTENT_LIMITS } from "@/lib/validation/user-content";

export interface ShortcutDraft {
  title: string;
  key: string;
  comment: string;
}

export function ShortcutFields({
  draft: suppliedDraft,
  value,
  prefix = "shortcut",
  onChange,
}: {
  draft?: ShortcutDraft;
  value?: ShortcutDraft;
  prefix?: string;
  onChange: (updates: Partial<ShortcutDraft>) => void;
}) {
  const draft = suppliedDraft ?? value ?? { title: "", key: "", comment: "" };
  return (
    <>
      <Field>
        <FieldLabel htmlFor={`${prefix}-title`}>Action</FieldLabel>
        <Input
          id={`${prefix}-title`}
          value={draft.title}
          onChange={(e) => onChange({ title: e.target.value })}
          maxLength={USER_CONTENT_LIMITS.shortcutTitle}
          placeholder="e.g., Open command palette"
          autoFocus
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${prefix}-key`}>Keyboard shortcut</FieldLabel>
        <ShortcutKeyInput
          id={`${prefix}-key`}
          value={draft.key}
          onChange={(key) => onChange({ key })}
          placeholder="e.g., cmd+k"
        />
        <FieldDescription>
          Leave blank for a mouse action or gesture.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${prefix}-comment`}>
          Instructions or alternative method
        </FieldLabel>
        <Input
          id={`${prefix}-comment`}
          value={draft.comment}
          onChange={(e) => onChange({ comment: e.target.value })}
          maxLength={USER_CONTENT_LIMITS.shortcutComment}
          placeholder="e.g., Double click a message"
        />
        <FieldDescription>
          Optional when you’ve added keys. Explain how to do the action.
        </FieldDescription>
      </Field>
    </>
  );
}
