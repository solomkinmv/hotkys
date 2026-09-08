"use client";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ShortcutKeyInput } from "./shortcut-key-input";
import { USER_CONTENT_LIMITS } from "@/lib/validation/user-content";
export interface ShortcutDraft { title: string; key: string; comment: string }
export function ShortcutFields({ value, onChange, prefix = "shortcut" }: { value: ShortcutDraft; onChange(patch: Partial<ShortcutDraft>): void; prefix?: string }) {
  return <>
    <Field><FieldLabel htmlFor={`${prefix}-title`}>Title</FieldLabel><Input id={`${prefix}-title`} value={value.title} maxLength={USER_CONTENT_LIMITS.shortcutTitle} onChange={event => onChange({ title: event.target.value })} /></Field>
    <Field><FieldLabel htmlFor={`${prefix}-key`}>Keys</FieldLabel><ShortcutKeyInput id={`${prefix}-key`} value={value.key} onChange={key => onChange({ key })} /></Field>
    <Field><FieldLabel htmlFor={`${prefix}-comment`}>Comment</FieldLabel><Input id={`${prefix}-comment`} value={value.comment} maxLength={USER_CONTENT_LIMITS.shortcutComment} onChange={event => onChange({ comment: event.target.value })} /></Field>
  </>;
}
