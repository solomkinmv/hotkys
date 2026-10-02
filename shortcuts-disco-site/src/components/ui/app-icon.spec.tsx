import { describe, expect, it } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { AppIcon } from "./app-icon";

describe("AppIcon", () => {
  it("gives missing icons varied, stable monograms even with transparent card styling", () => {
    const { rerender } = render(<AppIcon icon={undefined} appName="  My Tool  " size="md" className="size-11 bg-transparent rounded-xl" />);
    const monogram = screen.getByRole("img");
    expect(monogram.textContent).toBe("MT");
    const style = monogram.className.replace("text-sm", "");
    expect(style).toMatch(/bg-\[/);
    rerender(<AppIcon icon={undefined} appName="My Tool" />);
    expect(screen.getByRole("img").className.replace("text-[8px]", "")).toBe(style);

    const styles = new Set<string>();
    const shapes = new Set<string>();
    for (const appName of ["Atlas", "Notes", "My Tool", "Calendar", "Studio", "Workbench"]) {
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

  it("uses a monogram for broken images and retries a replacement URL", () => {
    const { rerender } = render(<AppIcon icon="icons/missing.png" appName="My Tool" />);
    fireEvent.error(screen.getByRole("img", { name: "My Tool icon" }));
    expect(screen.getByRole("img").textContent).toBe("MT");
    rerender(<AppIcon icon="icons/replacement.png" appName="My Tool" />);
    expect(screen.getByRole("img").getAttribute("src")).toBe("/icons/replacement.png");
  });
});
