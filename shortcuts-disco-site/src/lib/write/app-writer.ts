import {InputApp} from "@/lib/model/input/input-models";
import fs from "fs";
import path from "path";

export function writeAppShortcut(inputApp: InputApp) {
    // Serialize the InputApp object and format it as JSON
    const jsonString = JSON.stringify(inputApp, null, 2);

    // Define the file path
    const filePath = path.resolve(__dirname, `../../../shortcuts-data/${inputApp.slug}.json`);

    // Write the JSON string to a file
    fs.writeFileSync(filePath, jsonString);
}
