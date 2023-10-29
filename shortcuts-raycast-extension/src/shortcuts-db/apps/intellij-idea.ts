import { InputApp } from "../../model/input/input-models";

export const intellijIdeaShortcuts: InputApp = {
  bundleId: "com.jetbrains.intellij",
  name: "IntelliJ IDEA",
  keymaps: [
    {
      title: "Default",
      sections: [
        {
          title: "Navigation",
          shortcuts: [
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
export const intellijIdeaEapShortcuts: InputApp = {
  ...intellijIdeaShortcuts,
  bundleId: "com.jetbrains.intellij-EAP",
  name: "IntelliJ IDEA EAP",
};
