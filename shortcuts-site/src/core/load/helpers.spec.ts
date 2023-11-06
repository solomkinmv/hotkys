import path from 'path';
import fs from 'fs';
import { AllApps } from '../model/input/input-models';

export function parseKeyCodes(): Map<string, string> {
    const filePath = path.resolve(__dirname, '../../../public', 'key-codes.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const keyCodesObject = JSON.parse(fileContents) as { keyCodes: [string, string][] };
    return new Map<string, string>(keyCodesObject.keyCodes);
}

export function parseAllApps() {
    const filePath = path.resolve(__dirname, '../../../public', 'combined-apps.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents) as AllApps;
}
