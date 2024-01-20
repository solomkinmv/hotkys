import path from "path";
import fs from "fs";
import { AllApps, InputApp } from "@/lib/model/input/input-models";

export function parseKeyCodes(): Map<string, string> {
  const filePath = path.resolve(__dirname, "../public/data", "key-codes.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const keyCodesObject = JSON.parse(fileContents) as { keyCodes: [string, string][] };
  return new Map<string, string>(keyCodesObject.keyCodes);
}

export function parseAllApps(): AllApps {
  const dirPath = path.resolve(__dirname, "../shortcuts-data");
  const fileNames = fs.readdirSync(dirPath);
  const jsonFileNames = fileNames.filter(fileName => fileName.endsWith('.json'));

  const allApps: InputApp[] = jsonFileNames.flatMap(fileName => {
    const filePath = path.resolve(dirPath, fileName);
    const fileContents = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContents) as InputApp[];
  });

  return {
    list: allApps,
  };
}
