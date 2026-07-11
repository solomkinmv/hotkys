import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

describe("GitHub Pages production configuration", () => {
  const workflow = fs.readFileSync(
    path.join(process.cwd(), "../.github/workflows/deploy-pages.yml"),
    "utf8",
  );

  it("rejects deploys without Supabase database configuration", () => {
    expect(workflow).toContain('test -n "${NEXT_PUBLIC_SUPABASE_URL}"');
    expect(workflow).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(workflow).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    expect(workflow).toContain("requires a Supabase publishable or anon key");
  });
});
