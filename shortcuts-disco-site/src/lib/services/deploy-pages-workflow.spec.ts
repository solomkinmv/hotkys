import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";

describe("GitHub Pages production configuration", () => {
  const deployWorkflow = fs.readFileSync(
    path.join(process.cwd(), "../.github/workflows/deploy-pages.yml"),
    "utf8",
  );
  const buildWorkflows = [
    "build-site-pr.yml",
    "build-extension-pr.yml",
  ].map((filename) =>
    fs.readFileSync(
      path.join(process.cwd(), `../.github/workflows/${filename}`),
      "utf8",
    ),
  );

  it("rejects deploys without Supabase database configuration", () => {
    expect(deployWorkflow).toContain('test -n "${NEXT_PUBLIC_SUPABASE_URL}"');
    expect(deployWorkflow).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    expect(deployWorkflow).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    expect(deployWorkflow).toContain("requires a Supabase publishable or anon key");
  });

  it("uses lockfile-only dependency installs in CI", () => {
    for (const workflow of [deployWorkflow, ...buildWorkflows]) {
      expect(workflow).toContain("run: npm ci");
      expect(workflow).not.toContain("run: npm install");
    }
  });

  it("grants write permissions only to the Pages deployment job", () => {
    const topLevel = deployWorkflow.slice(0, deployWorkflow.indexOf("jobs:"));
    const buildJob = deployWorkflow.slice(
      deployWorkflow.indexOf("  build:"),
      deployWorkflow.indexOf("  deploy:"),
    );
    const deployJob = deployWorkflow.slice(deployWorkflow.indexOf("  deploy:"));

    expect(topLevel).toContain("permissions:\n  contents: read");
    expect(topLevel).not.toContain("pages: write");
    expect(buildJob).not.toContain("pages: write");
    expect(buildJob).not.toContain("id-token: write");
    expect(buildJob).toContain("deployment: false");
    expect(deployJob).toContain("pages: write");
    expect(deployJob).toContain("id-token: write");
  });

  it("keeps pull request builds read-only", () => {
    for (const workflow of buildWorkflows) {
      expect(workflow).toContain("permissions:\n  contents: read");
    }
  });
});
