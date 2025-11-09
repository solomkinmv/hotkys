import { InputApp, InputKeymap } from "@/lib/model/input/input-models";
import fs from "fs";
import path from "path";
import { dataFolder, rootFolder } from "../utils";
import { loadAllApps } from "../load/app-loader";
import { Platform } from "@/lib/model/internal/internal-models";

export function writeAppShortcut(inputApp: InputApp) {
    // Serialize the InputApp object and format it as JSON
    const jsonString = JSON.stringify(inputApp, null, 2);

    // Define the file path
    const filePath = path.resolve(__dirname, dataFolder, `${inputApp.slug}.json`);

    // Write the JSON string to a file
    fs.writeFileSync(filePath, jsonString);
}

/**
 * Filter keymaps for a specific platform
 * @param keymaps - All keymaps from an app
 * @param platform - Target platform to filter for
 * @returns Keymaps that match the platform (or have no platform specified)
 */
function filterKeymapsForPlatform(keymaps: InputKeymap[], platform: Platform): InputKeymap[] {
    return keymaps.filter(keymap =>
        !keymap.platforms || keymap.platforms.includes(platform)
    );
}

/**
 * Check if an app has any keymaps for a given platform
 * @param app - Input app to check
 * @param platform - Platform to check for
 * @returns True if app has at least one keymap for the platform
 */
function appSupportsPlatform(app: InputApp, platform: Platform): boolean {
    return filterKeymapsForPlatform(app.keymaps, platform).length > 0;
}

/**
 * Create lightweight metadata for apps manifest
 */
interface AppMetadata {
    name: string;
    slug: string;
    bundleId?: string;
    source?: string;
    keymaps: string[];
}

/**
 * Generate platform-specific files in public/data/platforms/{platform}/
 */
export function generatePlatformFiles() {
    const allApps = loadAllApps();
    const platforms: Platform[] = ['macos', 'windows', 'linux'];

    for (const platform of platforms) {
        const platformDir = path.resolve(rootFolder, 'public/data', platform);

        // Create directory if it doesn't exist
        fs.mkdirSync(platformDir, { recursive: true });

        // Filter apps that support this platform
        const platformApps = allApps.list.filter(app => appSupportsPlatform(app, platform));

        // Generate lightweight apps.json manifest
        const appsMetadata: AppMetadata[] = platformApps.map(app => {
            const filteredKeymaps = filterKeymapsForPlatform(app.keymaps, platform);
            return {
                name: app.name,
                slug: app.slug,
                bundleId: app.bundleId,
                source: app.source,
                keymaps: filteredKeymaps.map(k => k.title)
            };
        });

        const manifest = {
            platform,
            apps: appsMetadata
        };

        fs.writeFileSync(
            path.resolve(platformDir, 'apps.json'),
            JSON.stringify(manifest, null, 2),
            'utf-8'
        );

        // Generate individual app files with filtered keymaps
        for (const app of platformApps) {
            const filteredApp: InputApp = {
                ...app,
                keymaps: filterKeymapsForPlatform(app.keymaps, platform)
            };

            // Remove $schema from individual files
            delete (<any>filteredApp)["$schema"];

            fs.writeFileSync(
                path.resolve(platformDir, `${app.slug}.json`),
                JSON.stringify(filteredApp, null, 2),
                'utf-8'
            );
        }

        console.log(`Generated ${platformApps.length} apps for ${platform}`);
    }
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
    console.log('Generating combined apps file...');
    combineApps();
    console.log('Generating platform-specific files...');
    generatePlatformFiles();
    console.log('Done!');
}
