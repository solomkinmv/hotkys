jest.mock("@raycast/utils", () => ({
  runPowerShellScript: jest.fn(),
}));

import { getWindowsFrontmostHostname } from "./windows-hostname-fetcher";
import { runPowerShellScript } from "@raycast/utils";

const mockRunPowerShellScript = runPowerShellScript as jest.MockedFunction<typeof runPowerShellScript>;

describe("getWindowsFrontmostHostname", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("extracts hostname from full URL", async () => {
    mockRunPowerShellScript.mockResolvedValue("https://github.com/user/repo");

    const result = await getWindowsFrontmostHostname();

    expect(result).toBe("github.com");
  });

  it("extracts hostname from URL without protocol", async () => {
    mockRunPowerShellScript.mockResolvedValue("example.com/path");

    const result = await getWindowsFrontmostHostname();

    expect(result).toBe("example.com");
  });

  it("extracts hostname from http URL", async () => {
    mockRunPowerShellScript.mockResolvedValue("http://example.com");

    const result = await getWindowsFrontmostHostname();

    expect(result).toBe("example.com");
  });

  it("removes www prefix", async () => {
    mockRunPowerShellScript.mockResolvedValue("https://www.example.com");

    const result = await getWindowsFrontmostHostname();

    expect(result).toBe("example.com");
  });

  it("returns null when PowerShell returns null", async () => {
    mockRunPowerShellScript.mockResolvedValue("null");

    const result = await getWindowsFrontmostHostname();

    expect(result).toBeNull();
  });

  it("returns null when PowerShell returns empty string", async () => {
    mockRunPowerShellScript.mockResolvedValue("");

    const result = await getWindowsFrontmostHostname();

    expect(result).toBeNull();
  });

  it("returns null when PowerShell returns whitespace", async () => {
    mockRunPowerShellScript.mockResolvedValue("   ");

    const result = await getWindowsFrontmostHostname();

    expect(result).toBeNull();
  });

  it("trims whitespace from URL", async () => {
    mockRunPowerShellScript.mockResolvedValue("  https://example.com  ");

    const result = await getWindowsFrontmostHostname();

    expect(result).toBe("example.com");
  });

  it("returns null and logs error when PowerShell script fails", async () => {
    mockRunPowerShellScript.mockRejectedValue(new Error("PowerShell error"));

    const result = await getWindowsFrontmostHostname();

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith("Failed to get Windows frontmost hostname:", expect.any(Error));
  });

  it("handles localhost URLs", async () => {
    mockRunPowerShellScript.mockResolvedValue("http://localhost:3000/path");

    const result = await getWindowsFrontmostHostname();

    expect(result).toBe("localhost");
  });

  it("handles URLs with authentication", async () => {
    mockRunPowerShellScript.mockResolvedValue("https://user:pass@example.com/path");

    const result = await getWindowsFrontmostHostname();

    expect(result).toBe("example.com");
  });

  it("handles URLs with port numbers", async () => {
    mockRunPowerShellScript.mockResolvedValue("https://example.com:8080/path");

    const result = await getWindowsFrontmostHostname();

    expect(result).toBe("example.com");
  });

  it("handles URLs with query parameters", async () => {
    mockRunPowerShellScript.mockResolvedValue("https://example.com/path?query=value");

    const result = await getWindowsFrontmostHostname();

    expect(result).toBe("example.com");
  });

  it("handles URLs with hash fragments", async () => {
    mockRunPowerShellScript.mockResolvedValue("https://example.com/path#section");

    const result = await getWindowsFrontmostHostname();

    expect(result).toBe("example.com");
  });

  it("handles complex URLs", async () => {
    mockRunPowerShellScript.mockResolvedValue("https://user@www.example.com:8080/path?query=value#section");

    const result = await getWindowsFrontmostHostname();

    expect(result).toBe("example.com");
  });
});
