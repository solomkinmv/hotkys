import { Hotkeys } from "./models";
import { Modifers } from "./modifiers";

export const hotkeys: Hotkeys = {
  applications: [
    {
      bundleId: "com.apple.dt.Xcode",
      name: "Xcode",
      keymaps: [
        {
          title: "Default",
          sections: [
            {
              title: "Build",
              hotkeys: [
                {
                  title: "Run",
                  key: "R",
                  modifiers: [Modifers.command],
                },
                {
                  title: "Build",
                  key: "B",
                  modifiers: [Modifers.command],
                },
              ],
            },
            {
              title: "Format",
              hotkeys: [
                {
                  title: "Re-Indent",
                  key: "I",
                  modifiers: [Modifers.control],
                },
              ],
            },
            {
              title: "Editor",
              hotkeys: [
                {
                  title: "Show library pop-up",
                  key: "L",
                  modifiers: [Modifers.command, Modifers.shift],
                },
                {
                  title: "Show library window",
                  key: "L",
                  modifiers: [Modifers.command, Modifers.shift, Modifers.option],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      bundleId: "com.microsoft.VSCode",
      name: "Visual Studio Code",
      keymaps: [
        {
          title: "Default",
          sections: [
            {
              title: "Format",
              hotkeys: [
                {
                  title: "Format Document",
                  key: "F",
                  modifiers: [Modifers.shift, Modifers.option],
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
              hotkeys: [
                {
                  title: "Open Editor Tab",
                  key: "E",
                  modifiers: [Modifers.command, Modifers.shift],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      bundleId: "com.apple.Safari",
      name: "Safari",
      keymaps: [
        {
          title: "Default",
          sections: [
            {
              title: "Bookmarks",
              hotkeys: [
                {
                  title: "Open Bookmarks Manager",
                  key: "B",
                  modifiers: [Modifers.command, Modifers.option],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
