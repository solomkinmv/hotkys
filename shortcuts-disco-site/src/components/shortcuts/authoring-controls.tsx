"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShortcutFields } from "./shortcut-fields";
import type { CustomKeymap, CustomSection, CustomShortcut } from "@/lib/model/user/user-models";
import type { Platform } from "@/lib/model/internal/internal-models";
export function MoveControls({ index, count, label, disabled, onMove }: { index: number; count: number; label: string; disabled: boolean; onMove(direction: -1 | 1): void }) {
  return <div className="flex gap-1"><Button size="sm" variant="ghost" aria-label={`Move ${label} up`} disabled={disabled || index === 0} onClick={() => onMove(-1)}>↑</Button><Button size="sm" variant="ghost" aria-label={`Move ${label} down`} disabled={disabled || index === count - 1} onClick={() => onMove(1)}>↓</Button></div>;
}
function DeleteControl({ label, disabled, onDelete }: { label: string; disabled: boolean; onDelete(): void }) {
  const [confirming, setConfirming] = useState(false);
  return confirming ? <div className="flex flex-wrap items-center gap-2"><span className="text-sm">Delete {label} and its contents?</span><Button size="sm" variant="destructive" disabled={disabled} onClick={onDelete}>Confirm Delete</Button><Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button></div> : <Button size="sm" variant="ghost" disabled={disabled} onClick={() => setConfirming(true)}>Delete {label}</Button>;
}
export function KeymapEditor({ keymap, disabled, onSave, onDelete }: { keymap: CustomKeymap; disabled: boolean; onSave(updates: Pick<CustomKeymap, "title" | "platforms">): void; onDelete(): void }) {
  const [title, setTitle] = useState(keymap.title);
  const [platforms, setPlatforms] = useState<Platform[]>(keymap.platforms ?? ["macos", "windows", "linux"]);
  return <div className="space-y-2"><label className="block text-sm">Keymap name<Input value={title} maxLength={100} onChange={event => setTitle(event.target.value)} /></label>
    <fieldset className="flex flex-wrap gap-3"><legend className="text-sm">Platforms</legend>{(["macos", "windows", "linux"] as const).map(platform => <label key={platform} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={platforms.includes(platform)} onChange={event => setPlatforms(previous => event.target.checked ? [...previous, platform] : previous.filter(value => value !== platform))} />{platform}</label>)}</fieldset>
    <div className="flex flex-wrap gap-2"><Button size="sm" disabled={disabled || !title.trim() || !platforms.length} onClick={() => onSave({ title: title.trim(), platforms })}>Save Keymap</Button><DeleteControl label="Keymap" disabled={disabled} onDelete={onDelete} /></div>
  </div>;
}
export function SectionEditor({ section, disabled, onSave, onDelete }: { section: CustomSection; disabled: boolean; onSave(title: string): void; onDelete(): void }) {
  const [title, setTitle] = useState(section.title);
  return <div className="flex flex-wrap items-end gap-2"><label className="flex-1 text-sm">Section name<Input value={title} maxLength={100} onChange={event => setTitle(event.target.value)} /></label><Button size="sm" disabled={disabled || !title.trim()} onClick={() => onSave(title.trim())}>Save Section</Button><DeleteControl label="Section" disabled={disabled} onDelete={onDelete} /></div>;
}
export function ShortcutEditor({ shortcut, disabled, onSave, onDelete }: { shortcut: CustomShortcut; disabled: boolean; onSave(updates: { title: string; key?: string; comment?: string }): void; onDelete(): void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: shortcut.title, key: shortcut.key ?? "", comment: shortcut.comment ?? "" });
  return <div className="space-y-2 rounded-md bg-muted p-3 text-sm">
    <div className="flex items-center justify-between gap-2"><span>{shortcut.title}</span><span className="text-muted-foreground">{shortcut.key}</span><Button size="sm" variant="ghost" onClick={() => setEditing(value => !value)}>{editing ? "Close Editor" : `Edit ${shortcut.title}`}</Button></div>
    {editing ? <><div className="grid gap-3 md:grid-cols-3"><ShortcutFields prefix={`edit-${shortcut.id}`} value={draft} onChange={patch => setDraft(previous => ({ ...previous, ...patch }))} /></div><div className="flex flex-wrap gap-2"><Button size="sm" disabled={disabled || !draft.title.trim()} onClick={() => onSave({ title: draft.title.trim(), key: draft.key.trim() || undefined, comment: draft.comment.trim() || undefined })}>Save Shortcut</Button><DeleteControl label="Shortcut" disabled={disabled} onDelete={onDelete} /></div></> : null}
  </div>;
}
