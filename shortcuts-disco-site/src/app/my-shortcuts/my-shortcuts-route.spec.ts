import { describe, expect, it } from "@jest/globals";
import fs from "fs";
import path from "path";

describe("my shortcuts routes", () => {
  it("keeps custom app management on the static my-shortcuts route", () => {
    expect(
      fs.existsSync(
        path.join(process.cwd(), "src/app/my-shortcuts/my-shortcut-app-content.tsx")
      )
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(process.cwd(), "src/app/my-shortcuts/[slug]/page.tsx")
      )
    ).toBe(false);
  });
});
