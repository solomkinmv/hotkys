import { describe, expect, it } from "@jest/globals";
import grammar from "../shortcut-core/fixtures/grammar.json";
import identities from "../shortcut-core/fixtures/identities.json";
import overlays from "../shortcut-core/fixtures/overlays.json";
import favorites from "../shortcut-core/fixtures/favorites.json";
import { parseKey } from "../shortcut-core/parser";
import { getBaseShortcutId } from "../shortcut-core/identity";
import { resolveOverlayField } from "../shortcut-core/overlay";
import { matchesFavorite, type FavoriteIdentifier } from "../shortcut-core/favorites";
import { ShortcutMerger } from "./shortcut-merger";
import { modifierMapping } from "../model/internal/modifiers";
const codes = new Set(["+", "c", "k", "shift"]);
const shortcut = (title: string, key: string) => ({
  title,
  sequence: parseKey(key).map((chord) => ({
    base: chord.base,
    modifiers: chord.modifiers.map((token) => modifierMapping.get(token)!),
  })),
});
describe("shared shortcut contract", () => {
  it.each(grammar)("parses $key consistently", (fixture) => {
    const parse = () => parseKey(fixture.key, (base) => codes.has(base));
    if (fixture.invalid) expect(parse).toThrow();
    else expect(parse()).toEqual(fixture.sequence);
  });
  it.each(identities)("preserves $title occurrence $occurrence identity", (fixture) => {
    const row = shortcut(fixture.title, fixture.key);
    expect(getBaseShortcutId(row, fixture.occurrence)).toBe(fixture.id);
  });
  it.each(overlays)("resolves inherit/replace/clear", (fixture) =>
    expect(resolveOverlayField("Original", fixture.replacement, fixture.cleared)).toBe(fixture.expected)
  );
  it.each(favorites)("matches stable private references", (fixture) =>
    expect(matchesFavorite(fixture.favorite as FavoriteIdentifier, fixture.identifier as FavoriteIdentifier)).toBe(
      fixture.matches
    )
  );
  it("applies a stored plus-key overlay by its current ID through the actual consumer adapter", () => {
    const fixture = identities.find((value) => value.title === "Zoom")!;
    const data = {
      customApps: [],
      customKeymaps: [],
      favorites: [],
      shortcuts: [
        {
          baseKey: "sample:Default:General:Zoom",
          baseShortcutId: fixture.id,
          modification: { id: "overlay", comment: "Changed", keyIsCleared: true },
        },
      ],
    };
    const result = new ShortcutMerger(data).mergeShortcuts(
      [
        {
          name: "Sample",
          slug: "sample",
          keymaps: [{ title: "Default", sections: [{ title: "General", hotkeys: [shortcut("Zoom", "cmd++")] }] }],
        },
      ],
      data
    );
    expect(result[0].keymaps[0].sections[0].hotkeys[0]).toMatchObject({
      title: "Zoom",
      sequence: [],
      comment: "Changed",
      customizationId: "overlay",
    });
  });
});
