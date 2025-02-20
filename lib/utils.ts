// FILE: app/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// A type-safe merge function to combine classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}