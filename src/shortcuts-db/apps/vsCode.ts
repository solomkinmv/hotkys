import { InputApp } from "../../model/input/input-models";

export const vsCodeShortcuts: InputApp = {
  bundleId: "com.microsoft.VSCode",
  name: "Visual Studio Code",
  keymaps: [
    {
      title: "Default",
      sections: [
        {
          title: "Format",
          shortcuts: [
            {
              title: "Format Document",
              key: "shift+opt+f",
            },
          ],
        },
        {
          title: "Editor",
          shortcuts: [
            {
              title: "Open Editor Tab",
              key: "shift+cmd+e",
            },
            {
              title: "Shrink Selection",
              key: "ctrl+shift+left",
            },
            {
              title: "Increase Selection",
              key: "ctrl+shift+right",
            },
            {
              title: "Cursor Selection PageUp",
              key: "shift+pageup",
            },
            {
              title: "Cursor Selection PageDown",
              key: "shift+pagedown",
            },
          ],
        },
        {
          title: "Refactor",
          shortcuts: [
            {
              title: "Rename",
              key: "f2",
            },
          ],
        },
        {
          title: "Navigation",
          shortcuts: [
            {
              title: "Open Global Keybindings",
              key: "cmd+k cmd+s",
            },
          ],
        },
      ],
    },
    {
      title: "Custom",
      sections: [
        {
          title: "Editor",
          shortcuts: [
            {
              title: "Open Editor Tab",
              key: "shift+cmd+e",
            },
          ],
        },
      ],
    },
  ],
};
