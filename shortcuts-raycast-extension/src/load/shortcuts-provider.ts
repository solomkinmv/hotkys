import { Shortcuts } from "../model/internal/internal-models";
import { parseInputShortcuts } from "./input-parser";
import { validate } from "./validator";
import { useFetch } from '@raycast/utils';
import { AllApps } from '../model/input/input-models';

export default function useShortcutsProvider(onData?: (shortcuts: Shortcuts) => void) {
  const {isLoading, data} = useFetch<Shortcuts>("https://shortcuts.solomk.in/combined-apps.json", {
    keepPreviousData: true,
    parseResponse: async (response) => {
      const allApps = (await response.json()) as AllApps;
      validate(allApps.list);
      return {
        applications: parseInputShortcuts(allApps.list),
      };
    },
    onData,
  });
  const defaultValue: Shortcuts = {applications: []};
  return {
    isLoading: isLoading,
    shortcuts: data ?? defaultValue,
  };
}
