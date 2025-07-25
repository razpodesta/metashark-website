// navigation.ts
import { createLocalizedPathnamesNavigation } from "next-intl/navigation";

export const locales = ["en", "es"] as const;
export const localePrefix = "as-needed"; // Default

// The `pathnames` object holds pairs of internal
// and external paths, separated by locale.
export const pathnames = {
  // If all locales use the same path, use the root object
  "/login": "/login",
  "/admin": "/admin",

  // If locales use different paths, specify them separately
  // e.g. '/about': { en: '/about', es: '/sobre' }
};

export const { Link, redirect, usePathname, useRouter } =
  createLocalizedPathnamesNavigation({ locales, localePrefix, pathnames });
