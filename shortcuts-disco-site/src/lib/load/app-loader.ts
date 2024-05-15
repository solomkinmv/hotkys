import {AllApps, InputApp} from "@/lib/model/input/input-models";
import path from "path";
import fs from "fs";

export function loadAllApps(): AllApps {
    const dirPath = path.resolve(__dirname, "../../../shortcuts-data");
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
