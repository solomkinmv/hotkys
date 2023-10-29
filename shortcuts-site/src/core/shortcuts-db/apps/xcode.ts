import { InputApp } from "../../model/input/input-models";

export const xcodeShortcuts: InputApp = {
  bundleId: "com.apple.dt.Xcode",
  name: "Xcode",
  keymaps: [
    {
      title: "Default",
      sections: [
        {
          title: "Build",
          shortcuts: [
            {
              title: "Run",
              key: "cmd+r",
            },
            {
              title: "Build",
              key: "cmd+b",
            },
          ],
        },
        {
          title: "Format",
          shortcuts: [
            {
              title: "Re-Indent",
              key: "ctrl+i",
            },
          ],
        },
        {
          title: "Editor",
          shortcuts: [
            {
              title: "Show library pop-up",
              key: "shift+cmd+l",
            },
            {
              title: "Show library window",
              key: "shift+opt+cmd+l",
            },
          ],
        },
      ],
    },
  ],
};
