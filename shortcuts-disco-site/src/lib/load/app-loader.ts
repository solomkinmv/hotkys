import {AllApps, InputApp} from "@/lib/model/input/input-models";
import path from "path";
import fs from "fs";
import { dataFolder } from "../utils";

/**
 * Loads the raw JSON data for the given filename (including .json).
 * Uses the shortcuts-data folder and ignores parent paths.
 * @returns null when the file doesn't exist
 * @throws when the app JSON is invalid
 */
export function loadApp(fileName: string): InputApp | null {
    const filePath  = path.resolve(dataFolder, path.basename(fileName));
    if (!fs.existsSync(filePath)) {
        return null;
    }
    const fileContents  = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContents) as InputApp;
}

/**
 * Loads the raw JSON data for all apps. Does not perform validation.
 */
export function loadAllApps(): AllApps {
    const fileNames = fs.readdirSync(dataFolder);
    const jsonFileNames = fileNames.filter(fileName => fileName.endsWith('.json'));

    // Type cast: we know for a fact that these apps will exist
    const allApps: InputApp[] = jsonFileNames.flatMap(fileName => loadApp(fileName) as InputApp);

    return {
        list: allApps,
    };
}
