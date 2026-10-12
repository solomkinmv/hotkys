import { describe, expect, it } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { AppIcon } from "./app-icon";

describe("AppIcon", () => {
  it("gives missing icons varied, stable monograms even with transparent card styling", () => {
    const { rerender } = render(
      <AppIcon
        icon={undefined}
        appName="  My Tool  "
        size="md"
        className="size-11 bg-transparent rounded-xl"
      />,
    );
    const monogram = screen.getByRole("img");
    expect(monogram.textContent).toBe("MT");
    const style = monogram.className.replace("text-sm", "");
    expect(style).toMatch(/bg-\[/);
    rerender(<AppIcon icon={undefined} appName="My Tool" />);
    expect(screen.getByRole("img").className.replace("text-[8px]", "")).toBe(
      style,
    );

    const styles = new Set<string>();
    const shapes = new Set<string>();
    for (const appName of [
      "Atlas",
      "Notes",
      "My Tool",
      "Calendar",
      "Studio",
      "Workbench",
    ]) {
      rerender(<AppIcon icon={undefined} appName={appName} />);
      const classes = screen.getByRole("img").className;
      styles.add(classes);
      shapes.add(classes.match(/rounded-\S+/)![0]);
    }
    expect(styles.size).toBeGreaterThan(2);
    expect(shapes.size).toBeGreaterThan(2);
    rerender(<AppIcon icon={undefined} appName=" " />);
    expect(screen.getByRole("img").textContent).toBe("?");
  });

  it("falls back from the optimized variant to the original, then to a monogram, and retries a replacement URL", () => {
    const { rerender } = render(
      <AppIcon icon="icons/missing.png" appName="My Tool" />,
    );
    fireEvent.error(screen.getByRole("img", { name: "My Tool icon" }));
    const original = screen.getByRole("img", { name: "My Tool icon" });
    expect(original.getAttribute("src")).toBe("/icons/missing.png");
    expect(original.getAttribute("srcset")).toBeNull();
    fireEvent.error(original);
    expect(screen.getByRole("img").textContent).toBe("MT");
    rerender(<AppIcon icon="icons/replacement.png" appName="My Tool" />);
    expect(screen.getByRole("img").getAttribute("src")).toBe(
      "/optimized/icons/replacement-64.webp",
    );
  });

  it("serves sized WebP variants for bundled icons and keeps other icons unchanged", () => {
    const { rerender } = render(
      <AppIcon icon="icons/figma.png" appName="Figma" size="md" />,
    );
    let image = screen.getByRole("img");
    expect(image.getAttribute("src")).toBe("/optimized/icons/figma-64.webp");
    expect(image.getAttribute("srcset")).toBe(
      "/optimized/icons/figma-64.webp 1x, /optimized/icons/figma-128.webp 2x",
    );
    expect(image.getAttribute("width")).toBe("44");
    expect(image.getAttribute("height")).toBe("44");
    expect(image.getAttribute("loading")).toBe("lazy");
    expect(image.getAttribute("fetchpriority")).toBeNull();

    rerender(<AppIcon icon="/icons/figma.png" appName="Figma" />);
    image = screen.getByRole("img");
    expect(image.getAttribute("src")).toBe("/optimized/icons/figma-64.webp");
    expect(image.getAttribute("srcset")).toBeNull();

    rerender(
      <AppIcon icon="icons/figma.png" appName="Figma" size="lg" priority />,
    );
    image = screen.getByRole("img");
    expect(image.getAttribute("srcset")).toBe(
      "/optimized/icons/figma-128.webp 1x, /optimized/icons/figma-256.webp 2x",
    );
    expect(image.getAttribute("loading")).toBe("eager");
    expect(image.getAttribute("fetchpriority")).toBe("high");

    for (const icon of [
      "https://example.com/icons/figma.png",
      "icons/figma.svg",
      "icons/nested/figma.png",
    ]) {
      rerender(<AppIcon icon={icon} appName="Figma" size="md" />);
      image = screen.getByRole("img");
      expect(image.getAttribute("src")).not.toContain("/optimized/");
      expect(image.getAttribute("srcset")).toBeNull();
    }
  });
});
