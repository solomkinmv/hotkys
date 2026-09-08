import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });
const config: Config = {
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.spec.{ts,tsx}", "!src/lib/shortcut-core/**"],
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  setupFilesAfterEnv: ["./jest.setup.ts"],
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["__tests__/helpers.ts", "<rootDir>/supabase/tests/"],
};

export default createJestConfig(config);
