import { InputApp } from "../../model/input/input-models";

export const safariShortcuts: InputApp = {
  bundleId: "com.apple.Safari",
  name: "Safari",
  keymaps: [
    {
      title: "Default",
      sections: [
        {
          title: "Bookmarks",
          shortcuts: [
            {
              title: "Open Bookmarks Manager",
              key: "cmd+opt+B",
            },
          ],
        },
      ],
    },
  ],
};
