import { describe, expect, it } from "@jest/globals";
import { getIconUrl } from "./icon-helpers";

describe("getIconUrl", () => {
  describe("returns undefined for invalid input", () => {
    it.each([undefined, null, "", "   ", "\t\n"])(
      "returns undefined for %p",
      (input) => {
        expect(getIconUrl(input as string | undefined)).toBeUndefined();
      }
    );
  });

  describe("handles absolute URLs", () => {
    it.each([
      "https://example.com/icon.png",
      "http://example.com/icon.png",
      "HTTPS://EXAMPLE.COM/ICON.PNG",
      "HTTP://EXAMPLE.COM/ICON.PNG",
      "https://cdn.example.com/path/to/icon.svg",
    ])("returns absolute URL as-is: %p", (url) => {
      expect(getIconUrl(url)).toBe(url);
    });

    it("trims whitespace from absolute URLs", () => {
      expect(getIconUrl("  https://example.com/icon.png  ")).toBe(
        "https://example.com/icon.png"
      );
    });
  });

  describe("handles relative paths", () => {
    it("returns relative path with leading slash as-is", () => {
      expect(getIconUrl("/icons/app.png")).toBe("/icons/app.png");
    });

    it("prepends slash to relative path without leading slash", () => {
      expect(getIconUrl("icons/app.png")).toBe("/icons/app.png");
    });

    it("trims whitespace from relative paths", () => {
      expect(getIconUrl("  icons/app.png  ")).toBe("/icons/app.png");
      expect(getIconUrl("  /icons/app.png  ")).toBe("/icons/app.png");
    });
  });
});
