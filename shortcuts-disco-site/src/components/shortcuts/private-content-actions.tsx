"use client";

import {
  MoreHorizontal,
  Pencil,
  ArrowUp,
  ArrowDown,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PrivateContentActions({
  label,
  disabled,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  label: string;
  disabled?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-muted-foreground"
          aria-label={`Manage ${label}`}
          disabled={disabled}
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!onMoveUp} onSelect={onMoveUp}>
          <ArrowUp aria-hidden="true" />
          Move up
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!onMoveDown} onSelect={onMoveDown}>
          <ArrowDown aria-hidden="true" />
          Move down
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
