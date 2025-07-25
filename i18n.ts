// i18n.ts
import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { locales } from "./navigation";

export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` es una promesa, no una función.
  const locale = (await requestLocale) || "en"; // <-- SINTAXIS CORREGIDA

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
