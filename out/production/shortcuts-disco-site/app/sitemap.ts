import {MetadataRoute} from "next";
import {getAllShortcuts} from "@/lib/shortcuts";
import {serializeKeymap} from "@/lib/model/keymap-utils";

export const dynamic = "force-static";

const ChangeFrequency = {
    ALWAYS: "always",
    HOURLY: "hourly",
    DAILY: "daily",
    WEEKLY: "weekly",
    MONTHLY: "monthly",
    YEARLY: "yearly",
    NEVER: "never",
} as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const sitePages = [
        {
            url: "https://hotkys.com",
            lastModified: new Date(),
            changeFrequency: ChangeFrequency.WEEKLY,
            priority: 1,
        },
        {
            url: "https://hotkys.com/raycast-extension",
            lastModified: new Date(),
            changeFrequency: ChangeFrequency.WEEKLY,
            priority: 0.8,
        },
        {
            url: "https://hotkys.com/about",
            lastModified: new Date(),
            changeFrequency: ChangeFrequency.WEEKLY,
            priority: 0.5,
        },
    ];

    for (const app of getAllShortcuts().applications) {
        sitePages.push({
            url: `https://hotkys.com/apps/${app.slug}`,
            lastModified: new Date(),
            changeFrequency: ChangeFrequency.WEEKLY,
            priority: 0.3,
        });
        for (const keymap of app.keymaps) {
            sitePages.push({
                url: `https://hotkys.com/apps/${app.slug}/${serializeKeymap(keymap)}`,
                lastModified: new Date(),
                changeFrequency: ChangeFrequency.WEEKLY,
                priority: 0.7,
            });
        }
    }

    return sitePages;
}
