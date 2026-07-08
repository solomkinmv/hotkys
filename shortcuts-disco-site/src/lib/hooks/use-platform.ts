'use client';

import { useSyncExternalStore } from 'react';
import { getPlatform } from '@/lib/model/internal/modifiers';
import { Platform } from '@/lib/model/internal/internal-models';

const subscribe = () => () => {};
const getServerPlatformSnapshot = (): Platform => 'macos';

/**
 * React hook to detect the user's platform (Windows, Linux, or macOS).
 * Uses client-side detection to avoid hydration issues.
 *
 * @returns The detected platform: 'windows', 'linux', or 'macos'
 */
export function usePlatform(): Platform {
  return useSyncExternalStore(
    subscribe,
    getPlatform,
    getServerPlatformSnapshot
  );
}
