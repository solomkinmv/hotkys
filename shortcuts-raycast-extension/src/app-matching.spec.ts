import { getPlatform } from "./load/platform";
import { AppMetadata } from "./model/input/input-models";

// Mock getPlatform
jest.mock("./load/platform");
const mockGetPlatform = getPlatform as jest.MockedFunction<typeof getPlatform>;

describe("App matching logic", () => {
  const macosApp: AppMetadata = {
    slug: "vscode",
    name: "Visual Studio Code",
    bundleId: "com.microsoft.VSCode",
    windowsAppId: "Code.exe",
    keymaps: ["Default"],
  };

  const windowsApp: AppMetadata = {
    slug: "notepad",
    name: "Notepad",
    bundleId: undefined,
    windowsAppId: "notepad.exe",
    keymaps: ["Default"],
  };

  const macosOnlyApp: AppMetadata = {
    slug: "safari",
    name: "Safari",
    bundleId: "com.apple.Safari",
    windowsAppId: undefined,
    keymaps: ["Default"],
  };

  describe("findAppByIdentifier", () => {
    const apps = [macosApp, windowsApp, macosOnlyApp];

    function findAppByIdentifier(
      apps: AppMetadata[],
      identifier: string,
      platform: "macos" | "windows"
    ): AppMetadata | undefined {
      return apps.find((app) =>
        platform === "windows" ? app.windowsAppId === identifier : app.bundleId === identifier
      );
    }

    it("finds app by bundleId on macOS", () => {
      mockGetPlatform.mockReturnValue("macos");
      const found = findAppByIdentifier(apps, "com.microsoft.VSCode", "macos");
      expect(found).toEqual(macosApp);
    });

    it("finds app by windowsAppId on Windows", () => {
      mockGetPlatform.mockReturnValue("windows");
      const found = findAppByIdentifier(apps, "Code.exe", "windows");
      expect(found).toEqual(macosApp);
    });

    it("returns undefined when app not found on macOS", () => {
      mockGetPlatform.mockReturnValue("macos");
      const found = findAppByIdentifier(apps, "com.unknown.app", "macos");
      expect(found).toBeUndefined();
    });

    it("returns undefined when app not found on Windows", () => {
      mockGetPlatform.mockReturnValue("windows");
      const found = findAppByIdentifier(apps, "unknown.exe", "windows");
      expect(found).toBeUndefined();
    });

    it("returns undefined when Windows app doesn't have windowsAppId", () => {
      mockGetPlatform.mockReturnValue("windows");
      const found = findAppByIdentifier(apps, "com.apple.Safari", "windows");
      expect(found).toBeUndefined();
    });
  });

  describe("formatSubtitle", () => {
    function formatSubtitle(app: AppMetadata, platform: "macos" | "windows"): string {
      const appId = platform === "windows" ? app.windowsAppId : app.bundleId;
      return appId ?? app.hostname ?? "";
    }

    it("returns bundleId on macOS", () => {
      mockGetPlatform.mockReturnValue("macos");
      expect(formatSubtitle(macosApp, "macos")).toBe("com.microsoft.VSCode");
    });

    it("returns windowsAppId on Windows", () => {
      mockGetPlatform.mockReturnValue("windows");
      expect(formatSubtitle(macosApp, "windows")).toBe("Code.exe");
    });

    it("returns empty string when bundleId missing on macOS", () => {
      mockGetPlatform.mockReturnValue("macos");
      expect(formatSubtitle(windowsApp, "macos")).toBe("");
    });

    it("returns empty string when windowsAppId missing on Windows", () => {
      mockGetPlatform.mockReturnValue("windows");
      expect(formatSubtitle(macosOnlyApp, "windows")).toBe("");
    });

    it("returns hostname when app ID missing", () => {
      mockGetPlatform.mockReturnValue("macos");
      const webApp: AppMetadata = {
        slug: "gmail",
        name: "Gmail",
        hostname: "mail.google.com",
        keymaps: ["Default"],
      };
      expect(formatSubtitle(webApp, "macos")).toBe("mail.google.com");
    });
  });

  describe("getAppIdentifier", () => {
    function getAppIdentifier(
      bundleId: string | undefined,
      windowsAppId: string | undefined,
      platform: "macos" | "windows"
    ): string | undefined {
      return platform === "windows" ? windowsAppId : bundleId;
    }

    it("returns bundleId on macOS", () => {
      mockGetPlatform.mockReturnValue("macos");
      expect(getAppIdentifier("com.microsoft.VSCode", "Code.exe", "macos")).toBe("com.microsoft.VSCode");
    });

    it("returns windowsAppId on Windows", () => {
      mockGetPlatform.mockReturnValue("windows");
      expect(getAppIdentifier("com.microsoft.VSCode", "Code.exe", "windows")).toBe("Code.exe");
    });

    it("returns undefined when bundleId missing on macOS", () => {
      mockGetPlatform.mockReturnValue("macos");
      expect(getAppIdentifier(undefined, "Code.exe", "macos")).toBeUndefined();
    });

    it("returns undefined when windowsAppId missing on Windows", () => {
      mockGetPlatform.mockReturnValue("windows");
      expect(getAppIdentifier("com.microsoft.VSCode", undefined, "windows")).toBeUndefined();
    });
  });
});
