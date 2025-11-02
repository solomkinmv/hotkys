'use client';

import { useState, useEffect } from 'react';
import { getPlatform } from '@/lib/model/internal/modifiers';

/**
 * React hook to detect the user's platform (Windows, Linux, or macOS).
 * Uses client-side detection to avoid hydration issues.
 *
 * @returns The detected platform: 'windows', 'linux', or 'macos'
 */
export function usePlatform(): 'windows' | 'linux' | 'macos' {
  const [platform, setPlatform] = useState<'windows' | 'linux' | 'macos'>('macos');

  useEffect(() => {
    setPlatform(getPlatform());
  }, []);

  return platform;
}
