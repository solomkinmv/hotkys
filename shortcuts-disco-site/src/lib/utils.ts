import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import path from "path"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const rootFolder = path.resolve(__dirname, '../..')
export const dataFolder = path.resolve(rootFolder, 'shortcuts-data')

/**
 * Get display name for platform
 * @param platform - The platform identifier (windows, linux, macos)
 * @returns Human-readable platform name or null if no platform
 */
export function getPlatformDisplay(platform?: 'windows' | 'linux' | 'macos'): string | null {
  if (!platform) return null;

  switch (platform) {
    case 'windows':
      return 'Windows';
    case 'linux':
      return 'Linux';
    case 'macos':
      return 'macOS';
    default:
      return null;
  }
}
