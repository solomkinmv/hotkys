import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import path from "path"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const rootFolder = path.resolve(__dirname, '../..')
export const dataFolder = path.resolve(rootFolder, 'shortcuts-data')
