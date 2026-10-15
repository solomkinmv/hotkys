import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { rootFolder } from "../utils";
import {
  getHeroVariantPath,
  getIconVariantPath,
  getLogoVariantPath,
  HERO_IMAGE,
  ICON_VARIANT_WIDTHS,
  LOGO_IMAGE,
  OPTIMIZED_IMAGE_FOLDER,
} from "../utils/image-variants";

export interface ImageVariantJob {
  source: string;
  output: string;
  width: number;
  height: number;
}

/** Lists every generated variant, with paths relative to `public/`. */
export function imageVariantJobs(publicDir: string): ImageVariantJob[] {
  const icons = fs
    .readdirSync(path.join(publicDir, "icons"))
    .filter((file) => file.endsWith(".png"))
    .sort();
  return [
    ...icons.flatMap((file) =>
      ICON_VARIANT_WIDTHS.map((width) => ({
        source: `icons/${file}`,
        output: getIconVariantPath(file.slice(0, -".png".length), width),
        width,
        height: width,
      })),
    ),
    ...HERO_IMAGE.variantWidths.map((width) => ({
      source: HERO_IMAGE.source,
      output: getHeroVariantPath(width),
      width,
      height: Math.round((HERO_IMAGE.height * width) / HERO_IMAGE.width),
    })),
    ...LOGO_IMAGE.variantScales.map((scale) => ({
      source: LOGO_IMAGE.source,
      output: getLogoVariantPath(scale),
      width: LOGO_IMAGE.width * scale,
      height: LOGO_IMAGE.height * scale,
    })),
  ];
}

/**
 * Regenerates `public/optimized/` from the bundled images. Outputs newer than
 * their source and this script are reused; outputs without a source are removed.
 */
export async function optimizeImages(
  root: string,
): Promise<{ written: number; reused: number }> {
  const publicDir = path.join(root, "public");
  const outputDir = path.join(publicDir, OPTIMIZED_IMAGE_FOLDER);
  const jobs = imageVariantJobs(publicDir);
  const expected = new Set(jobs.map((job) => path.join(publicDir, job.output)));
  if (fs.existsSync(outputDir)) {
    for (const entry of fs.readdirSync(outputDir, {
      recursive: true,
      withFileTypes: true,
    })) {
      const file = path.join(entry.parentPath, entry.name);
      if (entry.isFile() && !expected.has(file)) fs.rmSync(file);
    }
  }
  const scriptTime = fs.statSync(new URL(import.meta.url)).mtimeMs;
  let written = 0;
  await Promise.all(
    jobs.map(async (job) => {
      const source = path.join(publicDir, job.source);
      const output = path.join(publicDir, job.output);
      if (fs.existsSync(output)) {
        const outputTime = fs.statSync(output).mtimeMs;
        if (outputTime > fs.statSync(source).mtimeMs && outputTime > scriptTime)
          return;
      }
      fs.mkdirSync(path.dirname(output), { recursive: true });
      await sharp(source)
        .resize(job.width, job.height, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82, alphaQuality: 90, effort: 6 })
        .toFile(output);
      written++;
    }),
  );
  return { written, reused: jobs.length - written };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  optimizeImages(rootFolder).then(
    ({ written, reused }) =>
      console.log(
        `Optimized images: ${written} written, ${reused} up to date.`,
      ),
    (error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    },
  );
}
