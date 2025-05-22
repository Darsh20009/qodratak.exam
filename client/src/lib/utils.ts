import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000'
  : `${window.location.protocol}//${window.location.hostname}:5000`;