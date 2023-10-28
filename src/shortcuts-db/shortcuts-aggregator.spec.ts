// import { keyCodes } from "../model/key-codes";
// import { aggregatedApps } from "./shortcuts-aggregator";
//
// test("All shortcut keys are defined", () => {
//   aggregatedApps.applications.forEach((app) =>
//     app.keymaps.forEach((keyMap) =>
//       keyMap.sections.forEach((section) => section.hotkeys.forEach((shortcut) => expectToBeValid(shortcut.key)))
//     )
//   );
// });
//
// function expectToBeValid(key: string) {
//   try {
//     expect(isValidKey(key)).toBe(true);
//   } catch (error) {
//     throw new Error(`Key '${key}' should have configured keyCode`);
//   }
// }
//
// function isValidKey(key: string): boolean {
//   return keyCodes.has(key);
// }
