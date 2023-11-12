import path from 'path';
import fs from 'fs';
import {AllApps} from "../src/core/model/input/input-models";

export function parseKeyCodes(): Map<string, string> {
    const filePath = path.resolve(__dirname, '../public/data', 'key-codes.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const keyCodesObject = JSON.parse(fileContents) as { keyCodes: [string, string][] };
    return new Map<string, string>(keyCodesObject.keyCodes);
}

export function parseAllApps() {
    const filePath = path.resolve(__dirname, '../public/data', 'combined-apps.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents) as AllApps;
}
