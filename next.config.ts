// next.config.ts
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin(
  // Proporciona la ruta a tu archivo de configuración de i18n.
  "./i18n.ts"
);

const nextConfig: NextConfig = {
  // Aquí puedes añadir otras opciones de configuración de Next.js si las necesitas.
};

export default withNextIntl(nextConfig);
