// lib/utils.js
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Safely merges conditional and Tailwind classes.
 * Example:
 *   cn("p-2", isActive && "bg-blue-500", "text-white")
 */
export function cn(...inputs) {
  return twMerge(clsx(...inputs))
}
