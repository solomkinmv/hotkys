import {AppShortcuts, Shortcuts} from "../model/internal/internal-models";
import {parseInputShortcuts} from "./input-parser";
import Validator from "./validator";
import {useFetch} from '@raycast/utils';
import {AllApps} from '../model/input/input-models';
import useKeyCodes from './key-codes-provider';
import {useEffect, useState} from 'react';
import {Cache} from "@raycast/api";

interface CachedItem {
    data: Shortcuts;
    lastUpdateTs: number;
}

const cache = new Cache();
const TTL_MILLIS = 3600_000;
const CACHE_KEY = "shortcuts";

export default function useAllShortcuts() {
    const cacheIsValid = (cachedItem: CachedItem | undefined): boolean => {
        if (cachedItem === undefined) {
            return false;
        }

        return cachedItem.lastUpdateTs + TTL_MILLIS > Date.now();
    };
    const getCachedItem = (localCache: Cache): CachedItem | undefined => {
        const cachedStringValue = cache.get(CACHE_KEY);
        if (cachedStringValue === undefined) {
            return undefined;
        }
        return JSON.parse(cache.get(CACHE_KEY)!) as CachedItem;
    };
    const cachedItem = getCachedItem(cache);
    const [shouldUpdateCache] = useState(!cacheIsValid(cachedItem));
    const keyCodesResult = useKeyCodes();
    const [shortcuts, setShortcuts] = useState<Shortcuts>(cachedItem ? cachedItem.data : {
            applications: []
        }
    );


    const fetchResult = useFetch<AllApps>("https://shortcuts.solomk.in/combined-apps.json", {
        keepPreviousData: true,
        onWillExecute: parameters => {
            console.log("Will fetch shortcuts");
        },
        onData: (data) => {
            console.log("Shortcuts data received");
        },
        execute: shouldUpdateCache
    });

    useEffect(() => {
        if (keyCodesResult.isLoading || fetchResult.isLoading) {
            return;
        }
        if (shouldUpdateCache) {
            const newCachedItem: CachedItem = {
                lastUpdateTs: Date.now(),
                data: new ShortcutsProvider(fetchResult.data!, new Validator(keyCodesResult.data!)).getShortcuts(),
            };
            cache.set(CACHE_KEY, JSON.stringify(newCachedItem));
        }
    }, [keyCodesResult.isLoading, fetchResult.isLoading, shouldUpdateCache]);

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
