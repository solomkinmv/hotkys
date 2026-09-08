import { ShortcutMerger as CoreMerger } from "@/lib/shortcut-core/merger";
import { parseKey } from "@/lib/shortcut-core/parser";
import { modifierMapping, Modifiers } from "@/lib/model/internal/modifiers";
import type { UserCustomizations } from "@/lib/model/user/user-models";
import type { Platform } from "@/lib/model/internal/internal-models";
export class ShortcutMerger extends CoreMerger<Modifiers, Platform> {
  constructor(customizations: UserCustomizations) {
    super(customizations, key => parseKey(key).map(({base, modifiers}) => ({base, modifiers: modifiers.map(token => modifierMapping.get(token)! )})));
  }
}
