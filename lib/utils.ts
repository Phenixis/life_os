import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isEmpty(value: any) {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value).length === 0)
}

export function devEnv() {
  return process.env.NEXT_PUBLIC_ENVIRONMENT === "development"
}

export function previewEnv() {
  return devEnv() || process.env.NEXT_PUBLIC_ENVIRONMENT === "preview"
}