jest.mock("@raycast/utils", () => ({
  runAppleScript: jest.fn(),
  runPowerShellScript: jest.fn(),
}));

jest.mock("../load/platform", () => ({
  getPlatform: jest.fn(),
}));

import { getFrontmostHostname } from "./frontmost-hostname-fetcher";
import { runAppleScript } from "@raycast/utils";
import { getPlatform } from "../load/platform";

const mockRunAppleScript = runAppleScript as jest.MockedFunction<typeof runAppleScript>;
const mockGetPlatform = getPlatform as jest.MockedFunction<typeof getPlatform>;

describe("getFrontmostHostname", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("macOS", () => {
    beforeEach(() => {
      mockGetPlatform.mockReturnValue("macos");
    });

    it("returns hostname from full URL", async () => {
      mockRunAppleScript.mockResolvedValue("https://github.com/user/repo");

      const result = await getFrontmostHostname();

      expect(result).toBe("github.com");
      expect(mockRunAppleScript).toHaveBeenCalledTimes(1);
    });

    it("returns hostname from URL without protocol", async () => {
      mockRunAppleScript.mockResolvedValue("example.com/path");

      const result = await getFrontmostHostname();

      expect(result).toBe("example.com");
    });

    it("returns null when AppleScript returns null", async () => {
      mockRunAppleScript.mockResolvedValue("null");

      const result = await getFrontmostHostname();

      expect(result).toBeNull();
    });

    it("returns null when no browser is frontmost", async () => {
      mockRunAppleScript.mockResolvedValue("");

      const result = await getFrontmostHostname();

      expect(result).toBeNull();
    });
  });

  describe("Windows", () => {
    beforeEach(() => {
      mockGetPlatform.mockReturnValue("windows");
    });

    it("dispatches to Windows hostname fetcher", async () => {
      const { runPowerShellScript } = await import("@raycast/utils");
      const mockRunPowerShellScript = runPowerShellScript as jest.MockedFunction<typeof runPowerShellScript>;
      mockRunPowerShellScript.mockResolvedValue("https://example.com/path");

      const result = await getFrontmostHostname();

      expect(result).toBe("example.com");
      expect(mockRunPowerShellScript).toHaveBeenCalledTimes(1);
    });

    it("does not call AppleScript on Windows", async () => {
      const { runPowerShellScript } = await import("@raycast/utils");
      const mockRunPowerShellScript = runPowerShellScript as jest.MockedFunction<typeof runPowerShellScript>;
      mockRunPowerShellScript.mockResolvedValue("https://example.com");

      await getFrontmostHostname();

      expect(mockRunAppleScript).not.toHaveBeenCalled();
    });
  });
});
