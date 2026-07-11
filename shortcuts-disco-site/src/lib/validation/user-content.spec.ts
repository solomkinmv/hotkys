import { describe, expect, it } from "@jest/globals";
import {
  assertResourceLimit,
  USER_CONTENT_LIMITS,
  validateCustomAppMetadata,
  validateCustomKeymapMetadata,
  validateCustomSectionMetadata,
  validateFavoriteMetadata,
  validateProfileMetadata,
  validateShortcutStorageMetadata,
} from "./user-content";

describe("user content validation", () => {
  it.each([
    ["name", "App name", USER_CONTENT_LIMITS.appName],
    ["slug", "Slug", USER_CONTENT_LIMITS.slug],
    ["bundleId", "Bundle ID", USER_CONTENT_LIMITS.bundleId],
    ["hostname", "Hostname", USER_CONTENT_LIMITS.hostname],
    ["source", "Source URL", USER_CONTENT_LIMITS.urlOrPath],
    ["icon", "Image path", USER_CONTENT_LIMITS.urlOrPath],
  ] as const)("limits custom app %s", (field, label, limit) => {
    expect(() =>
      validateCustomAppMetadata({ [field]: "x".repeat(limit + 1) }),
    ).toThrow(`${label} must be ${limit} characters or fewer`);
  });

  it("limits keymap and section metadata", () => {
    expect(() =>
      validateCustomKeymapMetadata({
        title: "x".repeat(USER_CONTENT_LIMITS.keymapTitle + 1),
      }),
    ).toThrow("Keymap title must be 100 characters or fewer");
    expect(() =>
      validateCustomSectionMetadata({
        title: "x".repeat(USER_CONTENT_LIMITS.sectionTitle + 1),
        sortOrder: 0,
      }),
    ).toThrow("Section title must be 100 characters or fewer");
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,x",
    "ftp://example.com/app",
    "http://",
    "http://javascript:alert(1)",
    "https://example.com:99999/path",
    "https://[:]/",
    "https://%25/path",
    "https://[v1.fe]/path",
    "\nhttps://example.com",
    "https://example.com\n",
    "https://example.com/\npath",
  ])(
    "rejects unsafe source URL scheme %p",
    (source) => {
      expect(() => validateCustomAppMetadata({ source })).toThrow(
        "Source URL must use http or https",
      );
    },
  );

  it.each([
    "javascript:alert(1)",
    "data:image/svg+xml,<svg></svg>",
    "file:///tmp/icon.png",
    "https://",
    "http://javascript:alert(1)",
    "icons/\napp.png",
    "icons/app.png\n",
    "//example.com/icon.png",
    "\\\\example.com\\icon.png",
  ])("rejects unsafe image location %p", (icon) => {
    expect(() => validateCustomAppMetadata({ icon })).toThrow(
      "Image path must be a relative path or an http/https URL",
    );
  });

  it.each([
    "/custom-icons/app.png",
    "custom-icons/app.png",
    "../custom-icons/app.png",
    "http://example.com/app.png",
    "https://example.com/app.png",
    "http://localhost:3000/app.png",
  ])("accepts safe image location %p", (icon) => {
    expect(() => validateCustomAppMetadata({ icon })).not.toThrow();
  });

  it("rejects unsupported persisted keymap platforms", () => {
    expect(() =>
      validateCustomKeymapMetadata({
        title: "Default",
        platforms: ["x".repeat(10_000) as never],
      }),
    ).toThrow("Unsupported keymap platform");
  });

  it("limits persisted official shortcut identity fields", () => {
    expect(() =>
      validateShortcutStorageMetadata({
        baseShortcutId: "x".repeat(USER_CONTENT_LIMITS.baseShortcutId + 1),
        sortOrder: 0,
      }),
    ).toThrow("Base shortcut ID must be 1024 characters or fewer");
  });

  it("limits favorite identity fields", () => {
    expect(() =>
      validateFavoriteMetadata({
        sectionTitle: "x".repeat(USER_CONTENT_LIMITS.sectionTitle + 1),
      }),
    ).toThrow("Section title must be 100 characters or fewer");
  });

  it("limits profile fields", () => {
    expect(() =>
      validateProfileMetadata({
        displayName: "x".repeat(USER_CONTENT_LIMITS.displayName + 1),
        avatarUrl: null,
      }),
    ).toThrow("Display name must be 100 characters or fewer");
  });

  it("rejects creating resources at the configured quota", () => {
    expect(() =>
      assertResourceLimit(
        USER_CONTENT_LIMITS.customApps,
        USER_CONTENT_LIMITS.customApps,
        "custom apps",
      ),
    ).toThrow("You can save at most 25 custom apps.");
  });
});
