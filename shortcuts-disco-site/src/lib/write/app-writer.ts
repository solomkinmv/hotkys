import {InputApp} from "@/lib/model/input/input-models";
import fs from "fs";
import path from "path";
import {dataFolder, rootFolder} from "../utils";
import {loadAllApps} from "../load/app-loader";

export function writeAppShortcut(inputApp: InputApp) {
    // Serialize the InputApp object and format it as JSON
    const jsonString = JSON.stringify(inputApp, null, 2);

    // Define the file path
    const filePath = path.resolve(__dirname, dataFolder, `${inputApp.slug}.json`);

    // Write the JSON string to a file
    fs.writeFileSync(filePath, jsonString);
}

/**
 * Combines the current JSON files into one file for distribution in public/data
 */
export function combineApps() {
    const apps = loadAllApps()
    // Remove the schema, which isn't used in production
    for (const app of apps.list) {
        delete (<any>app)["$schema"]
    }
    fs.writeFileSync(
        path.resolve(rootFolder, 'public/data/combined-apps.json'),
        JSON.stringify(apps),
        "utf-8"
    )
}


// If run directly via the CLI
if (import.meta.url === `file://${process.argv[1]}`) {
    combineApps();
}
