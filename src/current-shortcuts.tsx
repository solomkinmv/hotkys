import { getFrontmostApplication, launchCommand, LaunchType, showHUD } from "@raycast/api";

export default async function Command() {
    const frontmostApplication = await getFrontmostApplication();
    if (frontmostApplication.bundleId) {
        await launchCommand({
            name: "app-shortcuts",
            type: LaunchType.UserInitiated,
            context: { appBundleId: frontmostApplication.bundleId }
        });
    } else {
        await showHUD("Can't detect current app");
    }
}