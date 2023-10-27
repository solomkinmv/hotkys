import { AppHotkeys } from "../../model/models";
import { Modifers } from "../../model/modifiers";

export const vsCodeShortcuts: AppHotkeys = {
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
        {
          title: "Editor",
          hotkeys: [
            {
              title: "Open Editor Tab",
              key: "E",
              modifiers: [Modifers.command, Modifers.shift],
            },
            {
              title: "Shrink Selection",
              key: "left",
              modifiers: [Modifers.control, Modifers.shift],
            },
            {
              title: "Increase Selection",
              key: "right",
              modifiers: [Modifers.control, Modifers.shift],
            },
          ],
        },
        {
          title: "Refactor",
          hotkeys: [
            {
              title: "Rename",
              key: "F2",
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
};
