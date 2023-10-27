import { AppHotkeys } from "../../model/models";
import { Modifers } from "../../model/modifiers";

export const safariShortcuts: AppHotkeys = {
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
};
