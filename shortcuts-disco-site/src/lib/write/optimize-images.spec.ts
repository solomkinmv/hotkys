/** @jest-environment node */
import { describe, expect, it } from "@jest/globals";
import fs from "node:fs";
import path from "node:path";
import { getHeroSrcSet, getIconVariantUrl, getLogoSrcSet } from "../utils/image-variants";
import { imageVariantJobs } from "./optimize-images";

const publicDir = path.join(process.cwd(), "public");

describe("imageVariantJobs", () => {
  const jobs = imageVariantJobs(publicDir);
  const outputs = new Set(jobs.map((job) => `/${job.output}`));

  it("generates every icon variant AppIcon requests, only inside public/optimized", () => {
    const icons = fs.readdirSync(path.join(publicDir, "icons")).filter((file) => file.endsWith(".png"));
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      for (const width of [64, 128, 256] as const) {
        expect(outputs).toContain(getIconVariantUrl(`/icons/${icon}`, width));
      }
    }
    for (const job of jobs) {
      expect(job.output.startsWith("optimized/")).toBe(true);
      expect(fs.existsSync(path.join(publicDir, job.source))).toBe(true);
    }
    expect(new Set(jobs.map((job) => job.output)).size).toBe(jobs.length);
  });

  it("generates every hero and logo candidate referenced by the srcsets", () => {
    for (const srcSet of [getHeroSrcSet(), getLogoSrcSet()]) {
      for (const candidate of srcSet.split(", ").map((entry) => entry.split(" ")[0])) {
        expect(outputs.has(candidate) || fs.existsSync(path.join(publicDir, candidate))).toBe(true);
      }
    }
  });
});
