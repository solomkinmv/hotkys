import { AppShortcuts, Shortcuts } from "../model/internal/internal-models";
import { parseInputShortcuts } from "./input-parser";
import Validator from "./validator";
import { useFetch } from '@raycast/utils';
import { AllApps } from '../model/input/input-models';
import useKeyCodes from './key-codes-provider';
import { useEffect, useState } from 'react';

// todo: make it fetch only when cache expires or no cache
export default function useAllShortcuts() {
  const keyCodesResult = useKeyCodes();
  const [shortcuts, setShortcuts] = useState<Shortcuts>({
    applications: []
  });

  const fetchResult = useFetch<AllApps>("https://shortcuts.solomk.in/combined-apps.json", {
    keepPreviousData: false,
    // parseResponse: async (response) => {
    //   console.log("useAllShortcuts: parsing", keyCodesResult);
    //   const allApps = (await response.json()) as AllApps;
    //   return new ShortcutsProvider(allApps, new Validator(keyCodesResult.data!)).getShortcuts();
    // },
    // execute: !keyCodesResult.isLoading && (keyCodesResult?.data?.size ?? 0) > 0,
  });

  useEffect(() => {
    if (keyCodesResult.isLoading || fetchResult.isLoading) {
        return;
    }
    console.log("useAllShortcuts: useEffect", keyCodesResult, fetchResult);
    setShortcuts(new ShortcutsProvider(fetchResult.data!, new Validator(keyCodesResult.data!)).getShortcuts());
  }, [keyCodesResult.isLoading, fetchResult.isLoading]);

  // console.log("useAllShortcuts: before return", keyCodesResult.isLoading, fetchResult);
  // return {
  //   isLoading: fetchResult.isLoading || keyCodesResult.isLoading,
  //   shortcuts: fetchResult.data ?? {
  //     applications: []
  //   },
  // };
  return {

      isLoading: shortcuts.applications.length === 0,
      shortcuts: shortcuts,
  };
}

class ShortcutsProvider {

  constructor(private readonly allApps: AllApps,
              private readonly validator: Validator) {
  }

  public getShortcuts(): Shortcuts {
    this.validator.validate(this.allApps.list);
    return {
      applications: parseInputShortcuts(this.allApps.list), // todo: don't parse each time
    };
  }

  public getShortcutsByApp(bundleId: string): AppShortcuts | undefined {
    const shortcuts = this.getShortcuts();
    return shortcuts.applications.find(app => app.bundleId === bundleId);
  }
}
