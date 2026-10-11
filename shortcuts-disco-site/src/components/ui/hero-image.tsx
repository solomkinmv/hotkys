/* eslint-disable @next/next/no-img-element -- next/image cannot emit a srcset with images.unoptimized in a static export. */
import { preload } from "react-dom";
import { getHeroSrcSet, HERO_IMAGE } from "@/lib/utils/image-variants";

interface HeroImageProps {
  alt: string;
  sizes: string;
  className?: string;
}

export function HeroImage({ alt, sizes, className }: HeroImageProps) {
  const srcSet = getHeroSrcSet();
  const src = `/${HERO_IMAGE.source}`;
  preload(src, {
    as: "image",
    fetchPriority: "high",
    imageSrcSet: srcSet,
    imageSizes: sizes,
  });
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      width={HERO_IMAGE.width}
      height={HERO_IMAGE.height}
      alt={alt}
      fetchPriority="high"
      decoding="async"
      className={className}
    />
  );
}
