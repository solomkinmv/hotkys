import { AppHotkeys } from "../../model/models";
import { Modifers } from "../../model/modifiers";

export const xcodeShortcuts: AppHotkeys = {
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
};
