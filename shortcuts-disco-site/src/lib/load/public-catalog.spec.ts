/** @jest-environment node */
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { AllApps } from "@/lib/model/input/input-models";
import { Modifiers } from "@/lib/model/internal/modifiers";
import {
  loadPublicCatalog,
  PUBLIC_CATALOG_URL,
  resetPublicCatalogCache,
} from "./public-catalog";

const catalog: AllApps = {
  list: [
    {
      name: "Sample",
      slug: "sample",
      bundleId: "com.example.sample",
      icon: "icons/sample.png",
      keymaps: [
        {
          title: "Default",
          platforms: ["macos"],
          sections: [
            {
              title: "Editing",
              shortcuts: [
                { title: "Copy", key: "cmd+c" },
                { title: "Swipe", comment: "Swipe left" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const fetchMock = jest.fn<typeof fetch>();
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe("loadPublicCatalog", () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    resetPublicCatalogCache();
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("parses the published catalog into the internal model with one shared request", async () => {
    fetchMock.mockResolvedValue(respond(catalog));
    const [first, second] = await Promise.all([
      loadPublicCatalog(),
      loadPublicCatalog(),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(PUBLIC_CATALOG_URL);
    expect(second).toBe(first);
    expect(first[0]).toMatchObject({
      name: "Sample",
      slug: "sample",
      bundleId: "com.example.sample",
      keymaps: [
        {
          title: "Default",
          platforms: ["macos"],
          sections: [
            {
              title: "Editing",
              hotkeys: [
                {
                  title: "Copy",
                  sequence: [{ base: "c", modifiers: [Modifiers.command] }],
                },
                { title: "Swipe", comment: "Swipe left", sequence: [] },
              ],
            },
          ],
        },
      ],
    });
    await loadPublicCatalog();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("forgets failed requests so callers can retry", async () => {
    fetchMock.mockResolvedValueOnce(respond({}, 503));
    await expect(loadPublicCatalog()).rejects.toThrow("HTTP 503");
    fetchMock.mockResolvedValueOnce(respond({ apps: [] }));
    await expect(loadPublicCatalog()).rejects.toThrow("unexpected format");
    fetchMock.mockResolvedValueOnce(respond(catalog));
    await expect(loadPublicCatalog()).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
