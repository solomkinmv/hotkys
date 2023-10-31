import { InputApp } from "../../model/input/input-models";

export const macOsShortcuts: InputApp = {
    bundleId: "mac.os.fake.bundle.id",
    name: "MacOS",
    keymaps: [
        {
            title: "Default",
            sections: [
                {
                    title: "App manipulation",
                    shortcuts: [
                        {
                            title: "Open force quit window",
                            key: "opt+cmd+esc",
                        },
                        {
                            title: "Recent Files",
                            key: "cmd+e",
                        },
                    ],
                },
            ],
        },
    ],
};
