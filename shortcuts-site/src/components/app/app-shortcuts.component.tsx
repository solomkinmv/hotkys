import { ActionFunctionArgs, ParamParseKey, Params, useLoaderData, useParams } from "react-router-dom";
import { AppShortcuts } from "../../core/model/internal/internal-models";
import { ShortcutsProvider, useShortcutsProvider } from "../../core/load/shortcuts-provider";

// const Paths = {
//     appShortcuts: "/apps/:bundleId",
// } as const;
//
// interface AppShortcutsLoaderArgs extends ActionFunctionArgs {
//     params: Params<ParamParseKey<typeof Paths.appShortcuts>>;
// }
//
//
// export async function loader({ params }: AppShortcutsLoaderArgs) {
//     const shortcutsProvider = new ShortcutsProvider();
//     const appShortcuts = shortcutsProvider.getShortcutsByApp(params.bundleId!); // todo: fix force unwrapping
//     return { appShortcuts };
// }
//
// interface LoadedData {
//     appShortcuts: AppShortcuts | undefined;
// }

export function AppShortcutsComponent() {
    let {bundleId} = useParams();
    const appShortcuts = useShortcutsProvider().getShortcutsByApp(bundleId!);
    return (<>
        <div>{appShortcuts?.name}</div>
    </>);
}
